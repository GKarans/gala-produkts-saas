import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import {unzipSync} from 'fflate';
import {openDatabase} from '../server/db.mjs';
import {createApp} from '../server/app.mjs';
import {storage} from '../server/storage.mjs';
import {uuid,hash} from '../server/security.mjs';
import {billingService} from '../server/billing.mjs';
import {supabaseAuthService} from '../server/supabase-auth.mjs';

test('recovery, paging, quotas and request boundaries',async t=>{
 const db=await openDatabase({memory:true}),root=await mkdtemp(path.join(os.tmpdir(),'gf-recovery-'));
 const app=await createApp({db,files:storage({root})}),owner={id:uuid(),name:'Tester',email:'tester@example.test'};
 await db.query('insert into accounts(id,name,email,verified) values($1,$2,$3,true)',[owner.id,owner.name,owner.email]);
 await db.query("insert into subscriptions(account_id,plan,status) values($1,'studio','active')",[owner.id]);
 const draft=await app.events.save(owner,{name:'Recovery event',start:new Date(Date.now()-3600000).toISOString().slice(0,16),end:new Date(Date.now()+3600000).toISOString().slice(0,16),time_zone:'UTC'});
 await app.events.action(owner,draft.id,{action:'publish'});
 let e=await app.events.own(owner,draft.id);
 const guest=await app.events.join(e,{name:'Same name'}),g=await app.events.guestIdentity(e,guest.token);
 const image=await sharp({create:{width:32,height:24,channels:3,background:'#267f62'}}).webp().toBuffer();
 const reserve=()=>app.media.reserve(e,g,{id:uuid(),name:'photo.webp',bytes:image.length,thumbnail_bytes:image.length,checksum:hash(image),thumbnail_checksum:hash(image)});
 let media;
 try{
  await t.test('method confusion and invalid JSON never mutate state',async()=>{
   assert.equal((await app.handle(new Request(app.origin+'/api/auth/logout'))).status,405);
   assert.equal((await app.handle(new Request(app.origin+'/api/auth/login',{method:'POST',headers:{Origin:app.origin},body:'{broken'}))).status,400);
   assert.equal((await app.handle(new Request(app.origin+'/api/events/not-an-id'))).status,404);
  });
  await t.test('server quota, forged files and stale live-state are rejected',async()=>{
   await assert.rejects(app.media.reserve(e,g,{id:uuid(),name:'big',bytes:6291457,thumbnail_bytes:1}),/6 MB/);
   media=await reserve();
   await assert.rejects(app.media.upload(e,g,media.id,'photo',Buffer.from('not an image')),/changed/);
   await app.events.action(owner,e.id,{action:'pause'});
   await assert.rejects(reserve(),/closed/);
   await app.events.action(owner,e.id,{action:'resume'});
   await db.query("update events set entitlement=jsonb_set(entitlement,'{photos}','1') where id=$1",[e.id]);
   await assert.rejects(reserve(),/allowance/);
   await db.query("update events set entitlement=jsonb_set(entitlement,'{photos}','5000') where id=$1",[e.id]);
  });
  await t.test('twenty-five paired photos paginate without originals in grid metadata',async()=>{
   for(let i=0;i<25;i++){
    const m=i===0?media:await reserve();
    await app.media.upload(e,g,m.id,'photo',image);await app.media.upload(e,g,m.id,'thumb',image);await app.media.finalize(e,g,m.id);
   }
   const page=await app.media.list(e,new URLSearchParams()),second=await app.media.list(e,new URLSearchParams({cursor:page.next}));
   assert.equal(page.photos.length,24);assert.equal(second.photos.length,1);assert.equal(new Set([...page.photos,...second.photos].map(p=>p.id)).size,25);
   assert.equal(page.photos[0].object_key,undefined);
  });
  await t.test('Studio maximum gallery uses stable cursors across one thousand photos',async()=>{
   await db.query(`insert into media(id,event_id,guest_id,object_key,thumbnail_key,name,bytes,thumbnail_bytes,checksum,thumbnail_checksum,status,created_at)
    select gen_random_uuid(),$1,$2,'load/photo-'||n,'load/thumb-'||n,'load-'||n||'.webp',1024,128,repeat('a',64),repeat('b',64),'uploaded',now()-(n*interval '1 millisecond')
    from generate_series(1,1000) n`,[e.id,g.id]);
   const ids=new Set();let cursor=null,pages=0;do{const params=new URLSearchParams();if(cursor)params.set('cursor',cursor);const page=await app.media.list(e,params);page.photos.forEach(photo=>ids.add(photo.id));cursor=page.next;pages++;}while(cursor);
   assert.equal(ids.size,1025);assert.equal(pages,43);
   await db.query("delete from media where event_id=$1 and object_key like 'load/%'",[e.id]);
  });
  await t.test('read-only missing-thumbnail report and repair job',async()=>{
   await app.files.remove(media.thumbnail_key);
   const report=await app.jobs.inspect(e.id);assert.equal(report.issues.length,1);assert.equal(report.issues[0].variant,'thumbnail');
   const job=await app.jobs.queue(owner.id,e.id,'thumbnail-repair',{id:media.id});await app.jobs.tick();
   assert.equal((await db.query('select status from jobs where id=$1',[job.id])).rows[0].status,'ready');
   assert.equal((await app.jobs.inspect(e.id)).issues.length,0);
  });
  await t.test('discard expires reserved URLs before durable deletion',async()=>{
   const m=await reserve();await app.media.upload(e,g,m.id,'photo',image);
   await app.media.discard(e,g,m.id);assert.equal((await app.media.ready(m.id)).status,'deleted');
   await db.query("update jobs set available_at=now() where type='media-cleanup'");await app.jobs.tick();
   await assert.rejects(app.files.get(m.object_key));
  });
  await t.test('date filters follow the viewer timezone without displaying a zone selector',async()=>{
   const previous=(await app.media.ready(media.id)).created_at;
   await db.query("update media set created_at='2026-09-01T01:00:00Z' where id=$1",[media.id]);
   const ny=await app.media.list(e,new URLSearchParams({date:'2026-08-31',time_zone:'America/New_York'}));
   const riga=await app.media.list(e,new URLSearchParams({date:'2026-09-01',time_zone:'Europe/Riga'}));
   assert.equal(ny.total,1);assert.equal(riga.total,1);assert.equal(ny.photos[0].id,riga.photos[0].id);
   await assert.rejects(app.media.list(e,new URLSearchParams({time_zone:'not-a-zone'})),/valid date/);
   await db.query('update media set created_at=$1 where id=$2',[previous,media.id]);
  });
  await t.test('abandoned pending uploads expire and their partial objects are cleaned',async()=>{
   const m=await reserve();await app.media.upload(e,g,m.id,'photo',image);
   await db.query("update media set created_at=now()-interval '25 hours' where id=$1",[m.id]);
   await app.jobs.retention();assert.equal((await app.media.ready(m.id)).status,'deleted');
   await app.jobs.tick();await assert.rejects(app.files.get(m.object_key));
  });
  await t.test('export snapshot includes every page exactly once after a simulated worker crash',async()=>{
   await db.query("update events set starts_at=now()-interval '3 hours',ends_at=now()-interval '1 hour' where id=$1",[e.id]);e=await app.events.own(owner,e.id);
   const job=await app.jobs.requestExport(owner,e,{});
   await db.query("update jobs set status='processing',lease_until=now()-interval '1 minute' where id=$1",[job.id]);await app.jobs.tick();
   const done=(await db.query('select * from jobs where id=$1',[job.id])).rows[0];assert.equal(done.result.count,25);
   const files=unzipSync(await app.files.get(done.result.parts[0].key));assert.equal(Object.keys(files).filter(k=>k.endsWith('.webp')).length,25);
   const manifest=JSON.parse(new TextDecoder().decode(files['manifest.json']));assert.equal(new Set(manifest.map(p=>p.id)).size,25);
   assert.equal((await app.jobs.requestExport(owner,e,{})).id,job.id);
  });
  await t.test('sharing expiry, quota, archive and restore do not reveal photos',async()=>{
   await app.events.action(owner,e.id,{action:'share',enabled:true,days:7});
   await db.query('update events set share_limit=1 where id=$1',[e.id]);e=await app.events.own(owner,e.id);
   await app.events.share(e);await assert.rejects(app.events.share(e),/allowance/);
   await db.query("update events set share_limit=50,share_expires=now()-interval '1 minute' where id=$1",[e.id]);e=await app.events.own(owner,e.id);await assert.rejects(app.events.share(e),/sharing period/);
   await app.events.action(owner,e.id,{action:'archive'});await assert.rejects(app.events.guest(e.slug),/not found/);
   await app.events.action(owner,e.id,{action:'restore'});e=await app.events.own(owner,e.id);assert.equal(e.status,'published');assert.equal(e.share_enabled,false);
  });
  await t.test('object deletion is retryable after a storage outage',async()=>{
   await app.files.put('temporary/cover.webp',image);const job=await app.jobs.queue(owner.id,e.id,'object-cleanup',{keys:['temporary/cover.webp']});
   const remove=app.files.remove;let failed=false;app.files.remove=async k=>{if(!failed){failed=true;throw new Error('simulated outage');}return remove(k);};
   await app.jobs.tick();assert.equal((await db.query('select status from jobs where id=$1',[job.id])).rows[0].status,'queued');
   await db.query('update jobs set available_at=now() where id=$1',[job.id]);await app.jobs.tick();await assert.rejects(app.files.get('temporary/cover.webp'));
   await app.jobs.retention();
  });
 }finally{await db.close();await rm(root,{recursive:true,force:true});}
});

test('Stripe adapter uses customer IDs and canonical state for delayed delivery',async()=>{
 const db=await openDatabase({memory:true}),owner=uuid(),before={...process.env};
 try{
  process.env.PLATFORM_STRIPE_SECRET='sk_test_fixture';process.env.PLATFORM_STRIPE_PRICE_GATHERING='price_fixture';
  await db.query('insert into accounts(id,email,name) values($1,$2,$3)',[owner,'billing@example.test','Billing']);
  await db.query("insert into subscriptions(account_id,provider_id,provider_customer) values($1,'sub_fixture','cus_fixture')",[owner]);
  let body;const service=billingService(db,{local:false,origin:'https://staging.example.test',fetcher:async(url,options)=>{
   if(url.endsWith('billing_portal/sessions')){body=String(options.body);return Response.json({url:'https://billing.stripe.com/test'});}
   return Response.json({id:'sub_fixture',customer:'cus_fixture',metadata:{account_id:owner},status:'canceled',cancel_at_period_end:true,items:{data:[{quantity:1,price:{id:'price_fixture'},current_period_start:Math.floor(Date.now()/1000)-86400,current_period_end:Math.floor(Date.now()/1000)+3600}]}});
  }});
  await service.portal({id:owner});assert.match(body,/customer=cus_fixture/);assert.doesNotMatch(body,/customer=sub_/);
  const event={id:'evt_delayed',created:1,type:'invoice.paid',data:{object:{subscription:'sub_fixture'}}};
  await service.apply(event);assert.equal((await db.query('select status from subscriptions where account_id=$1',[owner])).rows[0].status,'ended');
  assert.equal((await service.apply(event)).duplicate,true);
  assert.equal((await service.apply({id:'evt_unrelated',created:2,type:'customer.created'})).ignored,true);
 }finally{for(const key of ['PLATFORM_STRIPE_SECRET','PLATFORM_STRIPE_PRICE_GATHERING']){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}await db.close();}
});

test('Supabase adapter keeps provider tokens encrypted and out of browser cookies',async()=>{
 const db=await openDatabase({memory:true}),before={...process.env},id=uuid();
 try{
  Object.assign(process.env,{PLATFORM_SUPABASE_URL:'https://isolated-fixture.supabase.co',PLATFORM_SUPABASE_PUBLISHABLE_KEY:'fixture',PLATFORM_SESSION_ENCRYPTION_KEY:'12'.repeat(32)});
  const user={id,email:'auth@example.test',email_confirmed_at:new Date().toISOString(),user_metadata:{name:'Auth',profile:{first_name:'Anna',last_name:'Test',phone_country:'LV',phone:'',account_type:'personal',company_name:''}}};
  let tokenRequest,signupRequest,signupUrl,resetUrl;const service=supabaseAuthService(db,{origin:'https://staging.example.test',mail:async()=>{},fetcher:async(url,options)=>{if(url.includes('/signup?')){signupRequest=JSON.parse(options.body);signupUrl=new URL(url);}if(url.includes('/recover?'))resetUrl=new URL(url);if(url.includes('grant_type=pkce'))tokenRequest=JSON.parse(options.body);return Response.json(url.endsWith('/user')?user:{user,access_token:'private-access-fixture',refresh_token:'private-refresh-fixture',expires_at:Math.floor(Date.now()/1000)+3600});}});
  await service.register({first_name:'Anna',last_name:'Test',phone_country:'LV',phone:'',account_type:'personal',email:user.email,password:'Test-password-123!'});
  assert.equal(signupUrl.searchParams.get('redirect_to'),'https://staging.example.test/auth/verify');
  await service.requestReset({email:user.email});assert.equal(resetUrl.searchParams.get('redirect_to'),'https://staging.example.test/auth/reset');
  assert.equal(signupRequest.data.name,'Anna Test');assert.equal(signupRequest.data.profile.first_name,'Anna');
  const confirmed=await service.consume({access_token:'confirmed-access-fixture',refresh_token:'confirmed-refresh-fixture',expires_in:'3600',type:'signup',purpose:'verify'});
  assert.match(confirmed.cookie,/HttpOnly; SameSite=Lax; Secure/);assert.doesNotMatch(JSON.stringify(confirmed),/confirmed-access|confirmed-refresh/);
  await assert.rejects(service.consume({access_token:'confirmed-access-fixture',refresh_token:'confirmed-refresh-fixture',type:'recovery',purpose:'verify'}),/invalid/);
  const start=service.googleStart(),authorize=new URL(start.url),oauthCookie=start.cookie.split(';')[0];assert.equal(authorize.searchParams.get('provider'),'google');assert.equal(authorize.searchParams.get('code_challenge_method'),'s256');assert(authorize.searchParams.get('code_challenge'));assert.doesNotMatch(start.url,/verifier/);assert.match(start.cookie,/HttpOnly; SameSite=Lax; Secure/);
  const state=authorize.searchParams.get('state');await assert.rejects(service.googleCallback(new Request('https://staging.example.test',{headers:{Cookie:oauthCookie}}),new URL(`https://staging.example.test/api/auth/google/callback?state=tampered&code=fixture`)),/invalid/);
  const oauth=await service.googleCallback(new Request('https://staging.example.test',{headers:{Cookie:oauthCookie}}),new URL(`https://staging.example.test/api/auth/google/callback?state=${encodeURIComponent(state)}&code=fixture`));assert(tokenRequest.code_verifier);assert.match(oauth.cookie,/HttpOnly; SameSite=Lax; Secure/);assert.match(oauth.clear,/Max-Age=0/);assert.doesNotMatch(oauth.cookie,/private-access|private-refresh/);
  const login=await service.login({email:user.email,password:'Test-password-123!'});
  assert.match(login.cookie,/HttpOnly; SameSite=Lax; Secure/);assert.doesNotMatch(login.cookie,/private-access|private-refresh/);
  const row=(await db.query('select * from sessions')).rows[0];assert.doesNotMatch(row.provider_session,/private-access|private-refresh/);
  const request=new Request('https://staging.example.test',{headers:{Cookie:login.cookie.split(';')[0]}});
  assert.equal((await service.user(request)).id,id);const account=(await db.query('select profile from accounts where id=$1',[id])).rows[0];assert.equal(account.profile.first_name,'Anna');assert.equal(account.profile.last_name,'Test');await service.logout(request);assert.equal(await service.user(request),null);
 }finally{for(const key of ['PLATFORM_SUPABASE_URL','PLATFORM_SUPABASE_PUBLISHABLE_KEY','PLATFORM_SESSION_ENCRYPTION_KEY']){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}await db.close();}
});
