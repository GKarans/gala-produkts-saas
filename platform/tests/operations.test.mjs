import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import {openDatabase} from '../server/db.mjs';
import {createApp} from '../server/app.mjs';
import {storage} from '../server/storage.mjs';
import {uuid,hash} from '../server/security.mjs';
import {collectNotices,queueMessage} from '../server/notifications.mjs';
import {mailDelivery} from '../server/mail.mjs';
import {replaceCover} from '../server/covers.mjs';

test('service notices deduplicate and delivery retries survive worker restarts',async()=>{
 const db=await openDatabase({memory:true}),owner={id:uuid(),email:'notices@example.test',name:'Notifications'};
 const previousKey=process.env.PLATFORM_EMAIL_KEY,previousFrom=process.env.PLATFORM_EMAIL_FROM;
 try{
  await db.query('insert into accounts(id,email,name) values($1,$2,$3)',[owner.id,owner.email,owner.name]);
  await db.query("insert into subscriptions(account_id,plan,status) values($1,'studio','active')",[owner.id]);
  const app=await createApp({db});
  const e=await app.events.save(owner,{name:'Notice fixture',time_zone:'UTC',start:'2026-01-01T10:00',end:'2026-01-01T11:00'});
  await db.query("update events set status='published',retention_at=now()+interval '10 days' where id=$1",[e.id]);
  await collectNotices(db);await collectNotices(db);
  assert.equal((await db.query('select count(*)::int as n from deliveries')).rows[0].n,2);
  Object.assign(process.env,{PLATFORM_EMAIL_KEY:'fixture',PLATFORM_EMAIL_FROM:'testing@example.test'});
  let fail=true;const keys=[];
  const deliver=mailDelivery(db,{local:false,fetcher:async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return new Response(null,{status:fail?503:200});}});
  assert.equal((await deliver()).sent,0);
  const retry=(await db.query('select * from deliveries')).rows;
  assert.ok(retry.every(m=>m.status==='queued'&&m.attempts===1&&Date.parse(m.available_at)>Date.now()));
  fail=false;await db.query('update deliveries set available_at=now()');assert.equal((await deliver()).sent,2);
  assert.equal(new Set(keys).size,2);
  await queueMessage(db,owner,'Crash fixture','Resume without duplicate delivery.','crash');
  await db.query("update deliveries set status='processing',lease_until=now()-interval '1 minute' where dedupe_key='crash'");
  assert.equal((await deliver()).sent,1);
  await queueMessage(db,owner,'Last attempt','Requires operator attention.','last');
  await db.query("update deliveries set attempts=4 where dedupe_key='last'");fail=true;
  await deliver();assert.equal((await db.query("select status from deliveries where dedupe_key='last'")).rows[0].status,'failed');
 }finally{
  for(const [key,value]of [['PLATFORM_EMAIL_KEY',previousKey],['PLATFORM_EMAIL_FROM',previousFrom]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  await db.close();
 }
});

test('cover replacement preserves the attached file and cleans failed attachments',async()=>{
 const db=await openDatabase({memory:true}),root=await mkdtemp(path.join(os.tmpdir(),'gf-covers-'));
 const files=storage({root}),app=await createApp({db,files}),user={id:uuid(),email:'cover@example.test',name:'Cover'};
 try{
  await db.query('insert into accounts(id,email,name) values($1,$2,$3)',[user.id,user.email,user.name]);await db.query('insert into subscriptions(account_id) values($1)',[user.id]);
  const e=await app.events.save(user,{name:'Cover fixture',time_zone:'UTC',start:new Date(Date.now()-3600000).toISOString().slice(0,16),end:new Date(Date.now()+3600000).toISOString().slice(0,16)});
  const data=(await sharp({create:{width:16,height:16,channels:3,background:'#16835e'}}).webp().toBuffer()).toString('base64');
  await replaceCover(db,files,app.events,user,e.id,data);const first=(await app.events.own(user,e.id)).appearance.cover_key;
  await replaceCover(db,files,app.events,user,e.id,data);const second=(await app.events.own(user,e.id)).appearance.cover_key;
  assert.notEqual(first,second);await app.jobs.tick();await assert.rejects(files.get(first));assert.ok(await files.size(second));
  await app.events.action(user,e.id,{action:'archive'});
  await assert.rejects(replaceCover(db,files,app.events,user,e.id,data),/redesigned/);
  const cleanup=(await db.query("select * from jobs where status='queued' and type='object-cleanup'")).rows;
  assert.equal(cleanup.length,1);const detached=cleanup[0].payload.keys[0];assert.ok(await files.size(detached));
  await db.query('update jobs set available_at=now() where id=$1',[cleanup[0].id]);await app.jobs.tick();await assert.rejects(files.get(detached));assert.ok(await files.size(second));
 }finally{await db.close();await rm(root,{recursive:true,force:true});}
});

test('support replies and failed-email recovery require an audited administrator',async()=>{
 const db=await openDatabase({memory:true}),app=await createApp({db});
 try{
  const admin=uuid(),customer=uuid(),caseId=uuid();
  for(const [id,role]of [[admin,'admin'],[customer,'customer']]){
   await db.query('insert into accounts(id,name,email,role) values($1,$2,$3,$4)',[id,role,`${role}@example.test`,role]);
   await db.query("insert into sessions(token_hash,account_id,expires_at) values($1,$2,now()+interval '1 hour')",[hash(id),id]);
  }
  await db.query('insert into support_cases(id,owner_id,email,subject,message) values($1,$2,$3,$4,$5)',[caseId,customer,'customer@example.test','Need help','Test question']);
  const call=(who,route,body)=>app.handle(new Request(app.origin+'/api/'+route,{method:body?'POST':'GET',headers:{Origin:app.origin,Cookie:`lumiq_session=${who}`},...(body?{body:JSON.stringify(body)}:{})}));
  assert.equal((await call(customer,'admin/reply',{id:caseId,reply:'Not authorized'})).status,403);
  assert.equal((await call(admin,'admin/reply',{id:caseId,reply:'Here is your answer.'})).status,200);
  const delivery=(await db.query('select * from deliveries')).rows[0];assert.equal(delivery.body,'Here is your answer.');
  await db.query("update deliveries set status='failed',attempts=5 where id=$1",[delivery.id]);
  assert.equal((await call(customer,'admin/retry-email',{id:delivery.id})).status,403);
  assert.equal((await call(admin,'admin/retry-email',{id:delivery.id})).status,200);
  assert.equal((await db.query('select attempts from deliveries where id=$1',[delivery.id])).rows[0].attempts,0);
  const overview=await(await call(admin,'admin')).json();assert.equal(overview.deliveries[0].body,undefined);
  assert.equal((await db.query("select count(*)::int as n from audit where action in ('admin.support.reply','admin.email.retry')")).rows[0].n,2);
 }finally{await db.close();}
});
