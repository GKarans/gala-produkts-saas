import {phoneCountries} from './profile.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {ROOT,openDatabase} from './db.mjs';
import {storage} from './storage.mjs';
import {authService} from './auth.mjs';
import {supabaseAuthService} from './supabase-auth.mjs';
import {mailDelivery} from './mail.mjs';
import {replaceCover} from './covers.mjs';
import {queueMessage} from './notifications.mjs';
import {checkMethod,storageOrigin} from './http-policy.mjs';
import {eventService} from './events.mjs';
import {mediaService} from './media.mjs';
import {jobService} from './jobs.mjs';
import {billingService,verifyStripe} from './billing.mjs';
import {PLANS,VERSION,eventState} from '../shared/plans.js';
import {uuid,requireThat,Fault,csrf,databaseLimiter,email,text} from './security.mjs';

export async function createApp(options={}){
 const origin=options.origin||'http://127.0.0.1:5700';const local=options.local!==false;
 if(local)requireThat(!process.env.PLATFORM_DATABASE_URL&&!process.env.PLATFORM_R2_BUCKET,503,'Local mode cannot connect to cloud data. Clear remote configuration first.');
 if(!local)requireThat(process.env.PLATFORM_RELEASE_APPROVED==='staging',503,'Live release is locked until the launch checklist is approved.');
 const db=options.db||await openDatabase();const files=options.files||storage();const localAuth=authService(db,{origin,local});const auth=local?localAuth:supabaseAuthService(db,{origin,mail:localAuth.mail}),events=eventService(db,auth.mail),media=mediaService(db,files,events),jobs=jobService(db,files,auth.mail),billing=billingService(db,{origin,local}),deliverMail=mailDelivery(db,{local});
 const limit=databaseLimiter(db,1000,'all'),authLimit=databaseLimiter(db,15,'auth'),guestLimit=databaseLimiter(db,90,'guest');
 const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}});
 const userSafe=u=>u?{id:u.id,name:u.name,email:u.email,role:u.role,preferences:u.preferences,profile:u.profile}:null;
 const publicEvent=e=>({id:e.id,slug:e.slug,name:e.name,description:e.description,starts_at:e.starts_at,ends_at:e.ends_at,time_zone:e.time_zone,appearance:e.appearance,state:eventState(e),shared:eventState(e)==='completed'&&e.share_enabled&&Date.parse(e.share_expires)>Date.now(),share_expires:e.share_expires});
 async function handle(req,context={}){const url=new URL(req.url),p=url.pathname;const requestId=uuid();try{
  requireThat(url.origin===origin,403,'This host is not allowed.');
  if(p==='/api/billing/webhook'){
   requireThat(!local&&req.method==='POST',404,'Not found.');const body=await req.text();const event=verifyStripe(body,req.headers.get('stripe-signature'),process.env.PLATFORM_STRIPE_WEBHOOK_SECRET);return response(await billing.apply(event));
  }
  if(p.startsWith('/api/')){
   checkMethod(p,req.method);csrf(req,origin);const client=context.clientId||options.clientId||'local';await limit(client);let input={};if(!['GET','HEAD'].includes(req.method)&&!p.includes('/content/')){const body=await req.text();requireThat(body.length<(p.endsWith('/cover')?9*1024**2:100000),413,'The request is too large.');try{input=body?JSON.parse(body):{};}catch{throw new Fault(400,'The request could not be read.');}requireThat(input&&typeof input==='object'&&!Array.isArray(input),400,'Provide a valid request.');}
   const user=await auth.user(req),mustUser=()=>{requireThat(user,401,'Sign in to continue.');return user;};
   if(p==='/api/config')return response({local,version:VERSION,plans:PLANS,phoneCountries,checkout:local?'simulated':'test',releaseReady:false});
   if(p==='/api/local/demo'){requireThat(local,404,'Not found.');await db.query("update events set starts_at=now()-interval '1 hour',ends_at=now()+interval '7 hours',status='published',paused=false,retention_at=now()+interval '180 days' where slug='sample-gathering' and owner_id=(select id from accounts where email='demo@gatherframe.local')");return response({slug:'sample-gathering'});}
   if(p==='/api/local/demo-session'){requireThat(local&&req.method==='POST',404,'Not found.');const {DEMO_EMAIL,DEMO_PASSWORD}=await import('./seed.mjs');const result=await auth.login({email:DEMO_EMAIL,password:DEMO_PASSWORD});return response({user:result.user},200,{'Set-Cookie':result.cookie});}
   if(p==='/api/auth/session')return response({user:userSafe(user)});
   if(p==='/api/auth/register'){await authLimit(client+':register');return response(await auth.register(input));}
   if(p==='/api/auth/login'){await authLimit(client+':login');const result=await auth.login(input);return response({user:result.user},200,{'Set-Cookie':result.cookie});}
   if(p==='/api/auth/logout'){await auth.logout(req);return response({ok:true},200,{'Set-Cookie':'gf_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});}
   if(p==='/api/auth/reset'){await authLimit(client+':reset');return response(await auth.requestReset(input));}
   if(p==='/api/auth/consume'){await authLimit(client+':consume');return response(await auth.consume(input));}
   if(p==='/api/local/inbox'){requireThat(local,404,'Not found.');return response((await db.query('select id,recipient,subject,body,created_at from deliveries order by created_at desc limit 50')).rows);}
   if(p==='/api/account/password'){await authLimit(client+':password');mustUser();requireThat(local,503,'Password changes will be enabled after the identity provider is configured.');return response(await auth.changePassword(user,input),200,{'Set-Cookie':'gf_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});}
   if(p==='/api/account'&&req.method==='PATCH')return response(await auth.update(mustUser(),input));
   if(p==='/api/account'&&req.method==='DELETE'){
    mustUser();requireThat(input.confirm===user.email,400,'Type your email to request account deletion.');await db.query('insert into support_cases(id,owner_id,email,subject,message) values($1,$2,$3,$4,$5)',[uuid(),user.id,user.email,'Account deletion request','Please review billing obligations, export access and data erasure.']);await auth.mail(user,'Account deletion requested','Your request is recorded. Support will confirm ownership and retention obligations before irreversible deletion.');return response({message:'Your account deletion request has been recorded.'});
   }
   if(p==='/api/events'){mustUser();if(req.method==='POST')return response(await events.save(user,input),201);return response(await events.list(user));}
   let match=p.match(/^\/api\/events\/([0-9a-f-]{36})(?:\/(.*))?$/i);
   if(match){mustUser();const id=match[1],action=match[2]||'';const e=await events.own(user,id);
    if(!action){if(req.method==='PATCH')return response(await events.save(user,input,id));return response({...e,state:eventState(e),published_before:Boolean((await db.query('select event_id from event_publications where event_id=$1',[id])).rows.length)});}
    if(action==='action')return response(await events.action(user,id,input));
    if(action==='photos'){if(req.method==='DELETE')return response(await media.remove(user,e,input.ids));return response(await media.list(e,url.searchParams));}
    if(action==='export')return response(await jobs.requestExport(user,e,input),202);
    if(action==='jobs')return response((await db.query('select * from jobs where event_id=$1 and owner_id=$2 order by created_at desc limit 30',[id,user.id])).rows);
    if(action==='duplicate'){const copy={...input,name:`${e.name.slice(0,65)} (copy)`,title:e.appearance.title,subtitle:e.appearance.subtitle,button:e.appearance.button,cover:e.appearance.cover};return response(await events.save(user,copy),201);}
    if(action==='qr'){const {default:QRCode}=await import('qrcode');const png=await QRCode.toBuffer(`${origin}/event/${e.slug}`,{width:1200,margin:4,errorCorrectionLevel:'M'});return new Response(png,{headers:{'Content-Type':'image/png','Cache-Control':'no-store'}});}
    if(action==='cover'&&req.method==='POST')return response(await replaceCover(db,files,events,user,id,input.data));
   }
   match=p.match(/^\/api\/guest\/([a-zA-Z0-9_-]+)(?:\/(.*))?$/);
   if(match){const e=await events.guest(match[1]),action=match[2]||'';
    if(!action)return response(publicEvent(e));
    if(action==='join'){await guestLimit(e.id);return response(await events.join(e,input));}
    if(action==='photos'){await events.share(e);return response(await media.list(e,url.searchParams));}
    const g=await events.guestIdentity(e,req.headers.get('x-guest-token'));
    if(action==='reserve'){await guestLimit(e.id+g.id);const reserved=await media.reserve(e,g,input);if(!local&&reserved.status==='pending'){reserved.targets={};for(const [kind,key,size,checksum]of [['photo',reserved.object_key,reserved.bytes,reserved.checksum],['thumb',reserved.thumbnail_key,reserved.thumbnail_bytes,reserved.thumbnail_checksum]]){const digest=Buffer.from(checksum,'hex').toString('base64');reserved.targets[kind]={url:await files.signedPut(key,Number(size),digest),headers:{'Content-Type':'image/webp','x-amz-checksum-sha256':digest}};}}return response(reserved);}
    if(action==='discard')return response(await media.discard(e,g,input.id));
    if(action==='finalize')return response(await media.finalize(e,g,input.id));
    const content=action.match(/^content\/([0-9a-f-]{36})\/(photo|thumb)$/i);
    if(content){const bytes=Buffer.from(await req.arrayBuffer());requireThat(bytes.length<=6291456,413,'This photo is too large.');return response(await media.upload(e,g,content[1],content[2],bytes));}
   }
   match=p.match(/^\/api\/covers\/([0-9a-f-]{36})$/i);
   if(match){const e=(await db.query("select * from events where id=$1 and status<>'deleted' and retention_at>now()",[match[1]])).rows[0];requireThat(e&&(user?.id===e.owner_id||e.status==='published'),404,'Cover unavailable.');return new Response(await files.get(e.appearance.cover_key),{headers:{'Content-Type':'image/webp','Cache-Control':'no-store'}});}
   match=p.match(/^\/api\/photos\/([0-9a-f-]{36})\/(thumb|photo)$/i);
   if(match){const m=await media.ready(match[1]);requireThat(m.status==='uploaded',404,'Photo unavailable.');const e=(await db.query("select * from events where id=$1 and status<>'deleted' and retention_at>now()",[m.event_id])).rows[0];requireThat(e,404,'Photo unavailable.');if(!user||user.id!==e.owner_id)await events.share(e);let bytes;try{bytes=await files.get(match[2]==='thumb'?m.thumbnail_key:m.object_key);}catch{throw new Fault(404,'This photo is temporarily unavailable.');}await db.query('insert into metrics(id,event_id,kind,amount) values($1,$2,$3,$4)',[uuid(),e.id,match[2]==='thumb'?'thumbnail-bytes':'photo-bytes',bytes.length]);return new Response(bytes,{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store',...(url.searchParams.has('download')?{'Content-Disposition':`attachment; filename="photo-${m.id}.webp"`}:{})}});}
   match=p.match(/^\/api\/jobs\/([0-9a-f-]{36})(?:\/(.*))?$/i);
   if(match){mustUser();const job=(await db.query('select * from jobs where id=$1 and owner_id=$2',[match[1],user.id])).rows[0];requireThat(job,404,'Job not found.');if(match[2]==='retry')return response(await jobs.retry(user,job.id));if(match[2]?.startsWith('download/')){requireThat(job.status==='ready'&&Date.parse(job.result.expires_at)>Date.now(),410,'This export has expired. Request a new export.');const part=job.result.parts?.[Number(match[2].split('/')[1])];requireThat(part,404,'Archive not found.');const e=await events.own(user,job.event_id);requireThat(Date.parse(e.retention_at)>Date.now(),410,'Photo retention has ended.');return new Response(await files.get(part.key),{headers:{'Content-Type':'application/zip','Cache-Control':'no-store','Content-Disposition':`attachment; filename="${part.name}"`}});}return response(job);}
   if(p==='/api/billing'){mustUser();return response({subscription:await events.subscription(user),allowance:await events.allowance(user),orders:(await db.query('select * from orders where owner_id=$1 order by created_at desc',[user.id])).rows});}
   if(p==='/api/billing/checkout')return response(await billing.checkout(mustUser(),input));
   if(p==='/api/billing/simulate')return response(await billing.simulate(mustUser(),input.order,input.outcome));
   if(p==='/api/billing/cancel')return response(await billing.cancel(mustUser()));
   if(p==='/api/billing/portal')return response(await billing.portal(mustUser()));
   if(p==='/api/admin/reconcile'){mustUser();requireThat(user.role==='admin',403,'Administrator access is required.');await events.audit(user.id,'admin.billing.reconcile',input.id);return response(await billing.reconcile(input.id));}
   if(p==='/api/support'){if(req.method==='POST'){await authLimit(client+':support');const id=uuid();await db.query('insert into support_cases(id,owner_id,email,subject,message) values($1,$2,$3,$4,$5)',[id,user?.id||null,email(input.email||user?.email),text(input.subject,120),text(input.message,4000)]);return response({id,message:'Your request has been recorded.'},201);}mustUser();return response((await db.query('select * from support_cases where owner_id=$1 order by created_at desc',[user.id])).rows);}
   if(p.startsWith('/api/admin')){mustUser();requireThat(user.role==='admin',403,'Administrator access is required.');if(p==='/api/admin')return response({accounts:(await db.query('select id,email,name,created_at from accounts order by created_at desc')).rows,jobs:(await db.query('select * from jobs order by created_at desc limit 100')).rows,deliveries:(await db.query('select id,recipient,subject,status,attempts,created_at from deliveries order by created_at desc limit 100')).rows,cases:(await db.query('select * from support_cases order by created_at desc limit 100')).rows,audit:(await db.query('select * from audit order by created_at desc limit 100')).rows,metrics:(await db.query('select kind,sum(amount)::bigint as amount from metrics group by kind')).rows});if(p==='/api/admin/retry-email'){await db.transaction(async tx=>{const r=await tx.query("update deliveries set status='queued',attempts=0,available_at=now(),lease_until=null where id=$1 and status='failed' returning id",[input.id]);requireThat(r.rows.length,404,'Failed email not found.');await tx.query('insert into audit(id,actor_id,action,target_id) values($1,$2,$3,$4)',[uuid(),user.id,'admin.email.retry',input.id]);});return response({ok:true});}if(p==='/api/admin/retry'){await events.audit(user.id,'admin.job.retry',input.id);return response(await jobs.retry(user,input.id,true));}if(p==='/api/admin/reply'){await db.transaction(async tx=>{const c=(await tx.query("select * from support_cases where id=$1 for update",[input.id])).rows[0];requireThat(c,404,'Support request not found.');const reply=text(input.reply,4000);await tx.query("update support_cases set reply=$1,status='answered' where id=$2",[reply,input.id]);await queueMessage(tx,{id:c.owner_id,email:c.email},'Reply to your Gatherframe support request',reply);await tx.query('insert into audit(id,actor_id,action,target_id) values($1,$2,$3,$4)',[uuid(),user.id,'admin.support.reply',c.id]);});return response({ok:true});}}
   throw new Fault(404,'This action is not available.');
  }
  const map={'/shared/covers.js':path.join(ROOT,'shared/covers.js'),'/shared/cover.js':path.join(ROOT,'shared/cover.js'),'/shared/plans.js':path.join(ROOT,'shared/plans.js'),'/vendor/lucide.js':path.join(ROOT,'../node_modules/lucide/dist/umd/lucide.js')};
  let file=map[p];if(!file){const relative=p==='/'?'index.html':p.slice(1);requireThat(!relative.split('/').includes('..')&&!relative.includes('\\'),404,'Not found.');file=path.join(ROOT,'public',relative);if(!path.extname(file))file=path.join(ROOT,'public/index.html');}
  const ext=path.extname(file),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain'};requireThat(types[ext],404,'Not found.');let body;try{body=await readFile(file);}catch{throw new Fault(404,'Not found.');}return new Response(body,{headers:{'Content-Type':types[ext],'Cache-Control':ext==='.html'?'no-store':'max-age=300','Content-Security-Policy':`default-src 'self'; img-src 'self' blob: data:; script-src 'self'; style-src 'self'; connect-src 'self' ${local?'':storageOrigin()}; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 }catch(error){const status=error.status||(error.code==='23505'?409:['22P02','22007','22008'].includes(error.code)?400:500);if(status>=500)console.error(JSON.stringify({requestId,error:error.code||error.name,message:local?error.message:undefined}));return response({error:status===500?'Something went wrong. Try again or contact support.':error.code==='23505'?'That record already exists. Try signing in.':error.code?'Check the submitted values and try again.':error.message,requestId},status);}}
 return {handle,db,files,auth,events,media,jobs,billing,deliverMail,origin,local};
}
