import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {uuid,token,hash,email,text,requireThat,cookies} from './security.mjs';
export function supabaseAuthService(db,{origin,mail,fetcher=fetch}){
 const url=process.env.PLATFORM_SUPABASE_URL,key=process.env.PLATFORM_SUPABASE_PUBLISHABLE_KEY;
 requireThat(url&&key&&!url.includes('ojcvnsbhphvijmzjfenl'),503,'Configure a new isolated Supabase Auth project.');
 const secret=Buffer.from(process.env.PLATFORM_SESSION_ENCRYPTION_KEY||'','hex');requireThat(secret.length===32,503,'Configure the server session-encryption secret.');
 const seal=data=>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secret,iv);const body=Buffer.concat([cipher.update(JSON.stringify(data)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64');};
 const open=data=>{const bytes=Buffer.from(data,'base64'),cipher=createDecipheriv('aes-256-gcm',secret,bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString());};
 const request=async(route,body,access,method=body?'POST':'GET')=>{const r=await fetcher(`${url}/auth/v1/${route}`,{method,headers:{apikey:key,'Content-Type':'application/json',...(access?{Authorization:`Bearer ${access}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});let data={};try{data=await r.json();}catch{}requireThat(r.ok,r.status===429?429:400,r.status===429?'Too many attempts. Please wait.':'Authentication could not be completed. Check your details or request a new email link.');return data;};
 const sync=async user=>{requireThat(user?.id&&user.email_confirmed_at,403,'Verify your email before signing in.');await db.query('insert into accounts(id,email,name,verified) values($1,$2,$3,true) on conflict(id) do update set email=excluded.email,verified=true',[user.id,user.email,String(user.user_metadata?.name||'Organizer').slice(0,80)]);await db.query('insert into subscriptions(account_id) values($1) on conflict do nothing',[user.id]);const account=(await db.query('select * from accounts where id=$1 and deleted_at is null',[user.id])).rows[0];requireThat(account,403,'This account is no longer available. Contact support.');return account;};
 const fresh=async req=>{
  const cookie=cookies(req.headers.get('cookie')).gf_session;if(!cookie)return null;
  return db.transaction(async tx=>{
   const row=(await tx.query('select * from sessions where token_hash=$1 and expires_at>now() for update',[hash(cookie)])).rows[0];
   if(!row?.provider_session)return null;
   let session;try{session=open(row.provider_session);}catch{await tx.query('delete from sessions where token_hash=$1',[row.token_hash]);return null;}
   if(session.expires_at*1000<Date.now()+30000){
    try{session=await request('token?grant_type=refresh_token',{refresh_token:session.refresh_token});await tx.query('update sessions set provider_session=$1 where token_hash=$2',[seal(session),row.token_hash]);}
    catch{await tx.query('delete from sessions where token_hash=$1',[row.token_hash]);return null;}
   }
   return{row,session};
  });
 };
 return{mail,
  async user(req){const context=await fresh(req);if(!context)return null;try{return await sync(await request('user',null,context.session.access_token));}catch{return null;}},
  async register(input){requireThat(typeof input.password==='string'&&input.password.length>=12&&input.password.length<=128,400,'Use a password with 12 to 128 characters.');await request(`signup?redirect_to=${encodeURIComponent(origin+'/auth/verify')}`,{email:email(input.email),password:input.password,data:{name:text(input.name,80)}});return{message:'Check your email to verify your account.'};},
  async login(input){const result=await request('token?grant_type=password',{email:email(input.email),password:input.password});const user=await sync(result.user),t=token();await db.query('insert into sessions(token_hash,account_id,expires_at,provider_session) values($1,$2,now()+interval \'7 days\',$3)',[hash(t),user.id,seal(result)]);return{user:{id:user.id,email:user.email,name:user.name,role:user.role},cookie:`gf_session=${t}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`};},
  async logout(req){const c=await fresh(req);if(c){await request('logout',{},c.session.access_token).catch(()=>{});await db.query('delete from sessions where token_hash=$1',[c.row.token_hash]);}},
  async requestReset(input){await request(`recover?redirect_to=${encodeURIComponent(origin+'/auth/reset')}`,{email:email(input.email)});return{message:'If the account exists, a reset email is on its way.'};},
  async consume(input){const purpose=input.purpose==='reset'?'recovery':input.purpose==='email'?'email_change':'email';const session=await request('verify',{token_hash:text(input.token,256),type:purpose});if(purpose==='recovery'){requireThat(typeof input.password==='string'&&input.password.length>=12,400,'Use at least 12 characters.');await request('user',{password:input.password},session.access_token,'PUT');}await sync(session.user);await db.query('delete from sessions where account_id=$1',[session.user.id]);return{message:'Your account has been updated. Sign in to continue.'};},
  async update(user,input){const session=await request('token?grant_type=password',{email:user.email,password:input.password});requireThat(session.user.id===user.id,403,'Account mismatch.');await request('user',{data:{name:text(input.name,80)},...(input.email!==user.email?{email:email(input.email)}:{})},session.access_token,'PUT');await db.query('update accounts set name=$1,preferences=$2 where id=$3',[text(input.name,80),JSON.stringify({service:true,marketing:input.marketing===true}),user.id]);return{message:'Profile saved. Check the confirmation email if you changed your address.'};}
 };
}
