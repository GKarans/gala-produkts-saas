import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {uuid,token,hash,email,text,requireThat,cookies,confirmedPassword} from './security.mjs';
import {profileDetails} from './profile.mjs';
export function supabaseAuthService(db,{origin,mail,fetcher=fetch}){
 const url=process.env.PLATFORM_SUPABASE_URL,key=process.env.PLATFORM_SUPABASE_PUBLISHABLE_KEY;
 requireThat(url&&key&&!url.includes('ojcvnsbhphvijmzjfenl'),503,'Configure a new isolated Supabase Auth project.');
 const secret=Buffer.from(process.env.PLATFORM_SESSION_ENCRYPTION_KEY||'','hex');requireThat(secret.length===32,503,'Configure the server session-encryption secret.');
 const seal=data=>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secret,iv);const body=Buffer.concat([cipher.update(Buffer.from(JSON.stringify(data),'utf8')),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64');};
 const open=data=>{const bytes=Buffer.from(data,'base64'),cipher=createDecipheriv('aes-256-gcm',secret,bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString());};
 const request=async(route,body,access,method=body?'POST':'GET')=>{const r=await fetcher(`${url}/auth/v1/${route}`,{method,headers:{apikey:key,'Content-Type':'application/json',...(access?{Authorization:`Bearer ${access}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});let data={};try{data=await r.json();}catch{}requireThat(r.ok,r.status===429?429:400,r.status===429?'Too many attempts. Please wait.':'Authentication could not be completed. Check your details or request a new email link.');return data;};
 const sync=async user=>{requireThat(user?.id&&user.email_confirmed_at,403,'Verify your email before signing in.');const metadata=user.user_metadata||{},preferences={service:true,marketing:false,locale:metadata.locale==='lv'?'lv':'en'},profile=metadata.profile&&typeof metadata.profile==='object'&&!Array.isArray(metadata.profile)?metadata.profile:{};await db.query('insert into accounts(id,email,name,verified,preferences,profile) values($1,$2,$3,true,$4,$5) on conflict(id) do update set email=excluded.email,verified=true',[user.id,user.email,String(metadata.name||metadata.full_name||'Organizer').slice(0,80),preferences,profile]);await db.query('insert into subscriptions(account_id) values($1) on conflict do nothing',[user.id]);const account=(await db.query('select * from accounts where id=$1 and deleted_at is null',[user.id])).rows[0];requireThat(account,403,'This account is no longer available. Contact support.');return account;};
 const fresh=async req=>{
  const cookie=cookies(req.headers.get('cookie')).lumiq_session;if(!cookie)return null;
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
  googleStart(){
   const state=token(),verifier=randomBytes(48).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
   const redirect=`${origin}/api/auth/google/callback`,authorize=new URL(`${url}/auth/v1/authorize`);
   authorize.search=new URLSearchParams({provider:'google',redirect_to:redirect,code_challenge:challenge,code_challenge_method:'s256',state}).toString();
   return{url:authorize.toString(),cookie:`lumiq_oauth=${encodeURIComponent(seal({state,verifier,expires:Date.now()+600000}))}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Secure; Max-Age=600`};
  },
  async googleCallback(req,callback){
   const value=cookies(req.headers.get('cookie')).lumiq_oauth;requireThat(value,400,'This Google sign-in request has expired. Start again.');
   let pending;try{pending=open(decodeURIComponent(value));}catch{throw Object.assign(new Error('This Google sign-in request is invalid. Start again.'),{status:400});}
   requireThat(pending.expires>Date.now()&&callback.searchParams.get('state')===pending.state,400,'This Google sign-in request is invalid. Start again.');
   const code=callback.searchParams.get('code');requireThat(code,400,'Google sign-in was canceled or could not be completed.');
   const result=await request('token?grant_type=pkce',{auth_code:code,code_verifier:pending.verifier});
   const user=await sync(result.user),sessionToken=token();await db.query('insert into sessions(token_hash,account_id,expires_at,provider_session) values($1,$2,now()+interval \'7 days\',$3)',[hash(sessionToken),user.id,seal(result)]);
   return{cookie:`lumiq_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`,clear:'lumiq_oauth=; Path=/api/auth/google; HttpOnly; SameSite=Lax; Secure; Max-Age=0'};
  },
  async user(req){const context=await fresh(req);if(!context)return null;try{return await sync(await request('user',null,context.session.access_token));}catch{return null;}},
  async register(input){requireThat(typeof input.password==='string'&&input.password.length>=12&&input.password.length<=128,400,'Use a password with 12 to 128 characters.');const details=profileDetails(input);await request(`signup?redirect_to=${encodeURIComponent(origin+'/auth/verify')}`,{email:email(input.email),password:input.password,data:{name:details.name,profile:details.profile,locale:input.locale==='lv'?'lv':'en'}});return{message:'Check your email to verify your account.'};},
  async login(input){const result=await request('token?grant_type=password',{email:email(input.email),password:input.password});const user=await sync(result.user),t=token();await db.query('insert into sessions(token_hash,account_id,expires_at,provider_session) values($1,$2,now()+interval \'7 days\',$3)',[hash(t),user.id,seal(result)]);return{user:{id:user.id,email:user.email,name:user.name,role:user.role},cookie:`lumiq_session=${t}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`};},
  async logout(req){const c=await fresh(req);if(c){await request('logout',{},c.session.access_token).catch(()=>{});await db.query('delete from sessions where token_hash=$1',[c.row.token_hash]);}},
  async requestReset(input){await request(`recover?redirect_to=${encodeURIComponent(origin+'/auth/reset')}`,{email:email(input.email)});return{message:'If the account exists, a reset email is on its way.'};},
  async consume(input){
   const resetPassword=input.purpose==='reset'?confirmedPassword(input):null;
   if(input.access_token&&input.purpose==='verify'&&input.type==='signup'){requireThat(typeof input.refresh_token==='string',400,'This confirmation link is invalid. Request a new one.');const providerSession={access_token:text(input.access_token,8192),refresh_token:text(input.refresh_token,8192),expires_at:Math.floor(Date.now()/1000)+Math.min(86400,Math.max(60,Number(input.expires_in)||3600))};const user=await request('user',null,providerSession.access_token);const account=await sync(user),sessionToken=token();await db.query('insert into sessions(token_hash,account_id,expires_at,provider_session) values($1,$2,now()+interval \'7 days\',$3)',[hash(sessionToken),account.id,seal(providerSession)]);return{message:'Email confirmed. Your account is ready.',cookie:`lumiq_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`};
   }
   if(input.access_token&&input.purpose==='reset'&&input.type==='recovery'){
    const access=text(input.access_token,8192),user=await request('user',null,access);await sync(user);await request('user',{password:resetPassword},access,'PUT');await db.query('delete from sessions where account_id=$1',[user.id]);return{message:'Your password has been updated. Sign in to continue.'};
   }
   if(input.access_token&&input.purpose==='email'&&input.type==='email_change'){
    const access=text(input.access_token,8192),user=await request('user',null,access);await sync(user);await db.query('delete from sessions where account_id=$1',[user.id]);return{message:'Your account email has been updated. Sign in to continue.'};
   }
   requireThat(!input.access_token,400,'This confirmation link is invalid. Request a new one.');
   const purpose=input.purpose==='reset'?'recovery':input.purpose==='email'?'email_change':'email',password=purpose==='recovery'?(resetPassword||confirmedPassword(input)):null;const session=await request('verify',{token_hash:text(input.token,256),type:purpose});if(purpose==='recovery')await request('user',{password},session.access_token,'PUT');await sync(session.user);await db.query('delete from sessions where account_id=$1',[session.user.id]);return{message:'Your account has been updated. Sign in to continue.'};
  },
  async update(user,input){const session=await request('token?grant_type=password',{email:user.email,password:input.password});requireThat(session.user.id===user.id,403,'Account mismatch.');const target=input.email!==user.email?`user?redirect_to=${encodeURIComponent(origin+'/auth/email')}`:'user';await request(target,{data:{name:text(input.name,80)},...(input.email!==user.email?{email:email(input.email)}:{})},session.access_token,'PUT');await db.query('update accounts set name=$1,preferences=$2 where id=$3',[text(input.name,80),{service:true,marketing:input.marketing===true,locale:input.locale==='lv'?'lv':'en'},user.id]);return{message:'Profile saved. Check the confirmation email if you changed your address.'};}
 };
}
