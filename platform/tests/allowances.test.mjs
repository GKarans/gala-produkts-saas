import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/db.mjs';
import {createApp} from '../server/app.mjs';
import {billingService} from '../server/billing.mjs';
import {PLANS,eventState} from '../shared/plans.js';
import {uuid} from '../server/security.mjs';

test('publication allowance and Single Event purchases',async t=>{
 const db=await openDatabase({memory:true}),app=await createApp({db});
 const account=async(plan='trial')=>{const u={id:uuid(),name:'Allowance test',email:`${uuid()}@example.test`};await db.query('insert into accounts(id,name,email) values($1,$2,$3)',[u.id,u.name,u.email]);await db.query("insert into subscriptions(account_id,plan,status) values($1,$2,$3)",[u.id,plan,plan==='trial'?'trialing':'active']);return u;};
 const draft=(u)=>app.events.save(u,{name:'Future gathering',start:new Date(Date.now()+86400000).toISOString().slice(0,16),end:new Date(Date.now()+2*86400000).toISOString().slice(0,16),time_zone:'UTC'});
 const publish=(u,e,funding='plan')=>app.events.action(u,e.id,{action:'publish',funding});
 try{
  await t.test('new plan limits and automatic expiry archive behavior',async()=>{
   assert.deepEqual(['trial','single','gathering','studio'].map(id=>{const p=PLANS[id];return[p.price,p.photos,p.bytes/1024**2,p.durationDays,p.retentionDays,p.shareDays];}),[[0,50,300,1,7,4],[1500,500,2000,3,14,7],[3000,500,2000,3,14,7],[7000,1000,4000,3,30,14]]);
   const u=await account('gathering'),e=await draft(u);await publish(u,e);
   await db.query("update events set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour',retention_at=now()-interval '1 second',share_enabled=true where id=$1",[e.id]);
   const expired=await app.events.own(u,e.id);assert.equal(eventState(expired),'archived');
   const listed=(await app.events.list(u)).find(row=>row.id===e.id);assert.equal(listed.state,'archived');assert.equal(listed.photo_count,0);assert.equal(Number(listed.bytes),0);
   await assert.rejects(app.media.list(expired,new URLSearchParams(),{owner:true}),/Photo retention has ended/);
   await assert.rejects(app.events.guest(e.slug),/Event not found/);
   await app.jobs.retention();await app.jobs.tick();
   assert.equal((await app.events.own(u,e.id)).status,'archived');
   assert.equal((await db.query("select count(*)::int as n from jobs where event_id=$1 and type='retention-cleanup' and status='ready'",[e.id])).rows[0].n,1);
  });
  await t.test('expired subscriptions preserve owner access and post-event sharing until retention ends',async()=>{
   for(const plan of ['gathering','studio']){
    const u=await account(plan),e=await draft(u);await publish(u,e);
    const published=await app.events.own(u,e.id);
    assert.equal(published.entitlement.retentionDays,plan==='studio'?30:14);
    await db.query("update events set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour',retention_at=now()+($2*interval '1 day') where id=$1",[e.id,published.entitlement.retentionDays]);
    await db.query("update subscriptions set status='canceled',period_end=now()-interval '1 day' where account_id=$1",[u.id]);
    const retained=await app.events.own(u,e.id);
    assert.deepEqual(retained.entitlement,published.entitlement);
    assert((await app.events.list(u)).some(item=>item.id===e.id));
    await app.events.action(u,e.id,{action:'share',enabled:true,days:published.entitlement.shareDays});
    await app.events.share(await app.events.guest(e.slug));
    await assert.rejects(publish(u,await draft(u)));
    await db.query("update events set retention_at=now()-interval '1 second' where id=$1",[e.id]);
    await assert.rejects(app.events.guest(e.slug),/Event not found/);
   }
  });
  await t.test('sharing duration is user-selected but cannot pass the remaining retention deadline',async()=>{
   const u=await account('gathering'),e=await draft(u);await publish(u,e);
   await db.query("update events set starts_at=now()-interval '2 days',ends_at=now()-interval '1 day',retention_at=now()+interval '4 days 1 minute' where id=$1",[e.id]);
   await assert.rejects(app.events.action(u,e.id,{action:'share',enabled:true,days:5}),/remaining photo-retention period/);
   await app.events.action(u,e.id,{action:'share',enabled:true,days:4});
   const shared=await app.events.own(u,e.id);assert(Date.parse(shared.share_expires)<=Date.parse(shared.retention_at));
  });
  await t.test('trial remains one free publication and deletion cannot recycle it',async()=>{
   assert.equal(PLANS.trial.price,0);const u=await account(),a=await draft(u),b=await draft(u);
   assert.equal((await app.events.allowance(u)).remaining,1);await publish(u,a);
   await app.events.action(u,a.id,{action:'delete',confirm:a.name});await assert.rejects(publish(u,b),/trial event has been used/);
  });
  await t.test('Gathering grants four per period, including future and already ended events',async()=>{
   assert.equal(PLANS.gathering.events,4);const u=await account('gathering');
   for(let i=0;i<4;i++){const e=await draft(u);await publish(u,e);await db.query("update events set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=$1",[e.id]);}
   const fifth=await draft(u);await assert.rejects(publish(u,fifth),/billing period is used/);
   assert.equal((await app.events.allowance(u)).used,4);
   await db.query("update event_publications set consumed_at=now()-interval '1 month' where owner_id=$1",[u.id]);
   await db.query("update subscriptions set period_start=now(),period_end=now()+interval '1 month' where account_id=$1",[u.id]);
   assert.equal((await app.events.allowance(u)).remaining,4);await publish(u,fifth);
  });
  await t.test('concurrent publications cannot spend the final subscription slot twice',async()=>{
   const u=await account('gathering');for(let i=0;i<3;i++)await publish(u,await draft(u));
   const a=await draft(u),b=await draft(u);
   const results=await Promise.allSettled([publish(u,a),publish(u,b)]);
   assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
   assert.equal((await app.events.allowance(u)).used,4);
  });
  await t.test('a pass belongs to its buyer and concurrent publication consumes it once',async()=>{
   const owner=await account(),other=await account(),order=await app.billing.checkout(owner,{plan:'single'});
   await app.billing.simulate(owner,order.order,'success');
   await assert.rejects(publish(other,await draft(other),'pass'),/No Single Event pass/);
   const a=await draft(owner),b=await draft(owner);
   const results=await Promise.allSettled([publish(owner,a,'pass'),publish(owner,b,'pass')]);
   assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
   assert.equal((await app.events.allowance(owner)).passes,0);
   assert.equal((await db.query('select count(*)::int as n from event_publications where owner_id=$1',[owner.id])).rows[0].n,1);
  });
  await t.test('restoring an ended unpublished draft never grants guest access',async()=>{
   const u=await account(),e=await draft(u);
   await app.events.action(u,e.id,{action:'archive'});
   await db.query("update events set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=$1",[e.id]);
   await app.events.action(u,e.id,{action:'restore'});
   assert.equal((await app.events.own(u,e.id)).status,'draft');
   await assert.rejects(app.events.guest(e.slug),/Event not found/);
   assert.equal((await app.events.allowance(u)).remaining,1);
  });
  await t.test('Studio grants twelve, not unlimited sequential events',async()=>{
   const u=await account('studio');for(let i=0;i<12;i++)await publish(u,await draft(u));
   await assert.rejects(publish(u,await draft(u)),/billing period is used/);
  });
  await t.test('one-time pass is idempotent, separate from subscription and consumed once',async()=>{
   const u=await account('gathering'),before=await app.events.subscription(u);
   const order=await app.billing.checkout(u,{plan:'single'});await app.billing.simulate(u,order.order,'success');await app.billing.simulate(u,order.order,'success');
   const after=await app.events.subscription(u);assert.equal(after.plan,'gathering');assert.equal(String(before.period_end),String(after.period_end));
   assert.equal((await app.events.allowance(u)).passes,1);
   const e=await draft(u);await publish(u,e,'pass');assert.equal((await app.events.own(u,e.id)).entitlement.photos,PLANS.gathering.photos);assert.equal((await app.events.allowance(u)).used,0);
   await app.events.action(u,e.id,{action:'archive'});await app.events.action(u,e.id,{action:'restore'});await publish(u,e);
   assert.equal((await app.events.allowance(u)).passes,0);assert.equal((await app.events.allowance(u)).used,0);
   await assert.rejects(publish(u,await draft(u),'pass'),/No Single Event pass/);
  });
  await t.test('failed/canceled checkout grants no pass and invalid publication rolls back consumption',async()=>{
   const u=await account();for(const outcome of ['fail','cancel']){const o=await app.billing.checkout(u,{plan:'single'});await app.billing.simulate(u,o.order,outcome);}
   assert.equal((await app.events.allowance(u)).passes,0);
   const e=await draft(u);await db.query("update events set ends_at=starts_at+interval '8 days' where id=$1",[e.id]);
   await assert.rejects(publish(u,e),/up to 1 day/);assert.equal((await app.events.allowance(u)).remaining,1);
  });
  await t.test('subscription plan changes in the same period cannot reset used publications',async()=>{
   const u=await account(),first=await app.billing.checkout(u,{plan:'gathering'});await app.billing.simulate(u,first.order,'success');
   await publish(u,await draft(u));const before=await app.events.subscription(u);
   const change=await app.billing.checkout(u,{plan:'studio'});await app.billing.simulate(u,change.order,'success');
   const after=await app.events.subscription(u);assert.equal(String(before.period_start),String(after.period_start));assert.equal((await app.events.allowance(u)).used,1);assert.equal((await app.events.allowance(u)).remaining,11);
  });
 }finally{await db.close();}
});

test('Stripe Single Event checkout uses payment mode and a verified paid event grants only a pass',async()=>{
 const db=await openDatabase({memory:true}),u={id:uuid(),email:'single@example.test'},prior={...process.env};let request;
 try{
  process.env.PLATFORM_STRIPE_SECRET='sk_test_fixture';process.env.PLATFORM_STRIPE_PRICE_SINGLE='price_one_time';
  await db.query('insert into accounts(id,name,email) values($1,$2,$3)',[u.id,'Single buyer',u.email]);await db.query('insert into subscriptions(account_id) values($1)',[u.id]);
  const billing=billingService(db,{origin:'https://isolated.example.test',local:false,fetcher:async(url,options)=>{request=new URLSearchParams(options.body);return Response.json({id:'cs_fixture',url:'https://checkout.stripe.com/fixture'});}});
  await billing.checkout(u,{plan:'single'});assert.equal(request.get('mode'),'payment');assert.equal(request.has('subscription_data[metadata][account_id]'),false);
  const event={id:'evt_single',created:Math.floor(Date.now()/1000),type:'checkout.session.completed',data:{object:{id:'cs_fixture',mode:'payment',payment_status:'paid',amount_total:PLANS.single.price,currency:'eur',metadata:{account_id:u.id,order_id:request.get('metadata[order_id]')}}}};
  await billing.apply(event);await billing.apply(event);assert.equal((await db.query('select count(*)::int as n from event_passes')).rows[0].n,1);assert.equal((await db.query('select plan from subscriptions where account_id=$1',[u.id])).rows[0].plan,'trial');
 }finally{for(const key of ['PLATFORM_STRIPE_SECRET','PLATFORM_STRIPE_PRICE_SINGLE']){if(prior[key]===undefined)delete process.env[key];else process.env[key]=prior[key];}await db.close();}
});
