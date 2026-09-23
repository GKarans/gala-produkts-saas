import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {openDatabase} from '../server/db.mjs';
import {createApp} from '../server/app.mjs';
import {PLANS} from '../shared/plans.js';
import {uuid} from '../server/security.mjs';

test('JSONB writes stay objects and the forward migration repairs legacy string scalars',async()=>{
 const db=await openDatabase({memory:true}),app=await createApp({db});
 try{
  const user={id:uuid(),name:'JSONB test',email:`${uuid()}@example.test`};
  await db.query('insert into accounts(id,name,email) values($1,$2,$3)',[user.id,user.name,user.email]);
  await db.query("insert into subscriptions(account_id,plan,status) values($1,'trial','trialing')",[user.id]);
  const start=new Date(Date.now()+86400000),end=new Date(start.getTime()+30*60000);
  const event=await app.events.save(user,{name:'JSONB allowance test',start:start.toISOString().slice(0,16),end:end.toISOString().slice(0,16),time_zone:'UTC'});
  await app.events.action(user,event.id,{action:'publish'});

  let rows=(await db.query(`select jsonb_typeof(e.entitlement) as event_type,
      e.entitlement->>'id' as event_plan,
      jsonb_typeof(p.entitlement) as publication_type,
      p.entitlement->>'id' as publication_plan
    from events e join event_publications p on p.event_id=e.id where e.id=$1`,[event.id])).rows[0];
  assert.deepEqual(rows,{event_type:'object',event_plan:'trial',publication_type:'object',publication_plan:'trial'});

  const legacy=JSON.stringify(PLANS.trial);
  await db.query('update events set entitlement=to_jsonb($1::text) where id=$2',[legacy,event.id]);
  await db.query('update event_publications set entitlement=to_jsonb($1::text) where event_id=$2',[legacy,event.id]);
  const migration=await readFile(new URL('../server/migrations/007-jsonb-parameter-encoding.sql',import.meta.url),'utf8');
  for(const statement of migration.split(/;\s*(?:\r?\n|$)/).map(value=>value.trim()).filter(Boolean))await db.query(statement);

  rows=(await db.query(`select jsonb_typeof(e.entitlement) as event_type,
      e.entitlement->>'id' as event_plan,
      jsonb_typeof(p.entitlement) as publication_type,
      p.entitlement->>'id' as publication_plan
    from events e join event_publications p on p.event_id=e.id where e.id=$1`,[event.id])).rows[0];
  assert.deepEqual(rows,{event_type:'object',event_plan:'trial',publication_type:'object',publication_plan:'trial'});

  await db.query('update events set starts_at=now()-interval \'1 minute\',ends_at=now()+interval \'30 minutes\' where id=$1',[event.id]);
  const live=await app.events.guest(event.slug),guest=await app.events.join(live,{name:'Test guest'});
  const reservation=await app.media.reserve(live,await app.events.guestIdentity(live,guest.token),{
   id:uuid(),name:'synthetic.webp',bytes:100,thumbnail_bytes:50,checksum:'a'.repeat(64),thumbnail_checksum:'b'.repeat(64)
  });
  assert.equal(reservation.status,'pending');
 }finally{await db.close();}
});
