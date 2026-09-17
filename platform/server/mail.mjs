import {requireThat} from './security.mjs';

export function mailDelivery(db,{local=true,fetcher=fetch}){
 return async function deliver(){
  if(local)return {local:true};
  const messages=await db.transaction(async tx=>{
   await tx.query("update deliveries set status=case when attempts>=5 then 'failed' else 'queued' end where status='processing' and lease_until<now()");
   const rows=(await tx.query("select * from deliveries where status='queued' and attempts<5 and available_at<=now() order by created_at for update skip locked limit 10")).rows;
   for(const m of rows)await tx.query("update deliveries set status='processing',lease_until=now()+interval '5 minutes',attempts=attempts+1 where id=$1",[m.id]);
   return rows;
  });
  let sent=0;
  for(const m of messages){
   try{
    requireThat(process.env.PLATFORM_EMAIL_KEY&&process.env.PLATFORM_EMAIL_FROM,503,'Email sender is not configured.');
    const r=await fetcher('https://api.resend.com/emails',{
     method:'POST',headers:{Authorization:`Bearer ${process.env.PLATFORM_EMAIL_KEY}`,'Content-Type':'application/json','Idempotency-Key':m.id},
     body:JSON.stringify({from:process.env.PLATFORM_EMAIL_FROM,to:[m.recipient],subject:m.subject,text:m.body}),signal:AbortSignal.timeout(15000)
    });
    requireThat(r.ok,502,'Email delivery failed.');
    await db.query("update deliveries set status='sent',lease_until=null where id=$1",[m.id]);sent++;
   }catch{
    await db.query("update deliveries set status=case when attempts>=5 then 'failed' else 'queued' end,lease_until=null,available_at=now()+(power(2,attempts)*interval '1 minute') where id=$1",[m.id]);
   }
  }
  return {sent};
 };
}
