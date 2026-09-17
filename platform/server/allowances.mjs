import {PLANS} from '../shared/plans.js';
import {requireThat} from './security.mjs';

export async function publicationAllowance(db,owner){
 const subscription=(await db.query('select * from subscriptions where account_id=$1',[owner])).rows[0];
 const plan=PLANS[subscription?.plan]||PLANS.trial;
 const trial=plan.billing==='trial';
 const used=(await db.query("select count(*)::int as n from event_publications where owner_id=$1 and (($2 and source='trial') or (not $2 and source='subscription' and consumed_at>=$3 and consumed_at<$4))",[owner,trial,subscription.period_start,subscription.period_end])).rows[0].n;
 const available=['active','trialing'].includes(subscription.status)&&Date.parse(subscription.period_start)<=Date.now()&&Date.parse(subscription.period_end)>Date.now();
 const passes=(await db.query('select count(*)::int as n from event_passes where owner_id=$1 and redeemed_event_id is null and revoked_at is null',[owner])).rows[0].n;
 return {used,limit:plan.events,remaining:available?Math.max(0,plan.events-used):0,available,passes,period_start:subscription.period_start,period_end:subscription.period_end,plan:plan.id};
}

// Caller holds the account and event locks. The publication row is never removed on archive/delete.
export async function grantPublication(tx,user,event,funding='plan'){
 requireThat(['plan','pass'].includes(funding),400,'Choose an event allowance.');
 const prior=(await tx.query('select * from event_publications where event_id=$1',[event.id])).rows[0];
 if(prior)return prior.entitlement;
 let entitlement,source,pass,sub;
 if(funding==='pass'){
  pass=(await tx.query('select * from event_passes where owner_id=$1 and redeemed_event_id is null and revoked_at is null order by created_at,id for update limit 1',[user.id])).rows[0];
  requireThat(pass,409,'No Single Event pass is available. Buy a pass in Plan & billing.');
  entitlement=pass.entitlement;source='pass';
 }else{
  sub=(await tx.query('select * from subscriptions where account_id=$1 for update',[user.id])).rows[0];
  const allowance=await publicationAllowance(tx,user.id);
  requireThat(allowance.available,403,'Choose an active plan or use a Single Event pass.');
  requireThat(allowance.remaining>0,409,sub.plan==='trial'?'Your trial event has been used. Choose a plan or a Single Event pass.':'Your publication allowance for this billing period is used. Buy a Single Event pass or wait for renewal.');
  entitlement=PLANS[sub.plan];source=entitlement.billing==='trial'?'trial':'subscription';
 }
 requireThat(Date.parse(event.ends_at)<=Date.now()+366*86400000,400,'Schedule the event to end within the next year.');
 await tx.query('insert into event_publications(event_id,owner_id,source,pass_id,entitlement,period_start,period_end) values($1,$2,$3,$4,$5,$6,$7)',[event.id,user.id,source,pass?.id||null,JSON.stringify(entitlement),sub?.period_start||null,sub?.period_end||null]);
 if(pass)await tx.query('update event_passes set redeemed_event_id=$1 where id=$2',[event.id,pass.id]);
 return entitlement;
}
