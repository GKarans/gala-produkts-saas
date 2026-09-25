import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/db.mjs';
import {createApp} from '../server/app.mjs';
import {uuid} from '../server/security.mjs';
import {profileDetails} from '../server/profile.mjs';

test('profile validates names, calling codes and business details',()=>{
 const input={first_name:'Anna',last_name:'Test',phone_country:'LV',phone:'20000000',account_type:'business',company_name:'Example'};
 const d=profileDetails(input);assert.equal(d.name,'Anna Test');assert.equal(d.profile.phone,'+37120000000');
 assert.throws(()=>profileDetails({...input,phone:'abc'}));assert.throws(()=>profileDetails({...input,company_name:''}));
 assert.equal(profileDetails({...input,account_type:'personal',phone:''}).profile.company_name,'');
});

test('password change rejects forged credentials and revokes all sessions and reset links',async()=>{
 const db=await openDatabase({memory:true}),app=await createApp({db}),password='Old-private-password-123!';
 try{
  const email=`${uuid()}@example.test`,input={email,password,first_name:'Anna',last_name:'Test',password_confirm:password};
  await assert.rejects(app.auth.register({...input,password_confirm:'wrong'}),/Passwords do not match/);
  await app.auth.register(input);await db.query('update accounts set verified=true where email=$1',[email]);
  const a=await app.auth.login({email,password}),b=await app.auth.login({email,password});
  const req=c=>new Request(app.origin+'/api/auth/session',{headers:{cookie:c}}),user=await app.auth.user(req(a.cookie));
  assert.equal(user.profile.first_name,'Anna');
  await assert.rejects(app.auth.changePassword(user,{password:'wrong',new_password:'New-private-password-456!',password_confirm:'New-private-password-456!'}),/current password/);
  assert(await app.auth.user(req(a.cookie)));await app.auth.requestReset({email});
  await app.auth.changePassword(user,{password,new_password:'New-private-password-456!',password_confirm:'New-private-password-456!'});
  assert.equal(await app.auth.user(req(a.cookie)),null);assert.equal(await app.auth.user(req(b.cookie)),null);
  assert.equal((await db.query('select count(*)::int as n from auth_tokens where account_id=$1',[user.id])).rows[0].n,0);
  await assert.rejects(app.auth.login({email,password}),/incorrect/);
  assert((await app.auth.login({email,password:'New-private-password-456!'})).cookie);
 }finally{await db.close();}
});

test('password reset requires matching confirmation without consuming its link',async()=>{
 const db=await openDatabase({memory:true}),app=await createApp({db});
 try{
  const email=`${uuid()}@example.test`,password='Old-private-password-123!',next='New-private-password-456!';
  await app.auth.register({email,password,first_name:'Anna',last_name:'Test',password_confirm:password});await db.query('update accounts set verified=true where email=$1',[email]);
  const session=await app.auth.login({email,password});await app.auth.requestReset({email});
  const mail=(await db.query('select body from deliveries where recipient=$1 order by created_at desc limit 1',[email])).rows[0],token=new URL(mail.body).searchParams.get('token');
  await assert.rejects(app.auth.consume({token,password:next,password_confirm:'Another-private-password-789!'}),/Passwords do not match/);
  assert.equal((await db.query('select count(*)::int as n from auth_tokens where purpose=$1 and account_id=(select id from accounts where email=$2)',['reset',email])).rows[0].n,1);
  await app.auth.consume({token,password:next,password_confirm:next});
  assert.equal(await app.auth.user(new Request(app.origin+'/api/auth/session',{headers:{cookie:session.cookie}})),null);
  await assert.rejects(app.auth.login({email,password}),/incorrect/);assert((await app.auth.login({email,password:next})).cookie);
 }finally{await db.close();}
});
