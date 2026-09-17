import {uuid} from './security.mjs';

export function queueMessage(db,account,subject,body,dedupe=null){
 return db.query('insert into deliveries(id,account_id,recipient,subject,body,dedupe_key) values($1,$2,$3,$4,$5,$6) on conflict(dedupe_key) do nothing',[uuid(),account.id||null,account.email,subject,body,dedupe]);
}

// Service notices only. Marketing consent never controls security or billing mail.
export async function collectNotices(db){
 const events=(await db.query(`select e.*,a.email,
  count(m.id) filter(where m.status in ('pending','uploaded'))::int as photo_count,
  coalesce(sum(m.bytes+m.thumbnail_bytes) filter(where m.status in ('pending','uploaded')),0)::bigint as used_bytes
  from events e join accounts a on a.id=e.owner_id left join media m on m.event_id=e.id
  where e.status='published' and e.retention_at>now() and a.deleted_at is null
  group by e.id,a.email`)).rows;
 for(const e of events){
  const account={id:e.owner_id,email:e.email};
  if(Date.parse(e.ends_at)<=Date.now())await queueMessage(db,account,'Your event photos are ready',`${e.name} has ended. Open your event workspace to view photos, prepare an export or enable guest gallery sharing. Sharing remains off until you enable it.`,`ended:${e.id}:${new Date(e.ends_at).toISOString()}`);
  const ratio=Math.max(e.photo_count/e.entitlement.photos,Number(e.used_bytes)/e.entitlement.bytes);
  if(ratio>=0.8)await queueMessage(db,account,'Your event is approaching its photo allowance',`${e.name} has used at least 80% of its photo or storage allowance. Review usage in the event workspace. Pending uploads also reserve capacity.`,`allowance-80:${e.id}`);
  if(e.share_enabled&&Date.parse(e.share_expires)>Date.now()&&Date.parse(e.share_expires)<Date.now()+86400000)await queueMessage(db,account,'Guest gallery sharing ends soon',`${e.name}: guest access ends within 24 hours. Your organizer access continues until the photo retention deadline.`,`share-ending:${e.id}:${new Date(e.share_expires).toISOString()}`);
 }
 const subscriptions=(await db.query("select s.*,a.email from subscriptions s join accounts a on a.id=s.account_id where a.deleted_at is null and s.plan<>'trial'")).rows;
 for(const s of subscriptions){
  const body=s.status==='active'?`${s.plan} is active.${s.cancel_at_end?' It will not renew after the current period.':''}`:s.status==='past_due'?'Your payment needs attention. Open Billing to review payment details. Existing event allowances are preserved.':'Your subscription is no longer active. Existing event retention deadlines remain unchanged.';
  await queueMessage(db,{id:s.account_id,email:s.email},'Your Gatherframe plan status',body,`plan:${s.account_id}:${s.plan}:${s.status}:${s.cancel_at_end}:${new Date(s.period_end).toISOString()}`);
 }
}
