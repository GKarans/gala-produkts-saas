import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PLANS} from '../shared/plans.js';
import {openDatabase} from '../server/db.mjs';
test('approved prices and full photo-pair capacity stay consistent',()=>{
 assert.deepEqual(['single','gathering','studio'].map(id=>PLANS[id].price),[1500,3000,7000]);
 assert.deepEqual(['single','gathering','studio'].map(id=>PLANS[id].photos),[500,500,1000]);
 assert.deepEqual(['trial','single','gathering','studio'].map(id=>PLANS[id].bytes/1024**2),[100,1000,1000,2000]);
 for(const p of Object.values(PLANS))assert.equal(p.bytes/1024**2/p.photos,2,'each tier budgets 2 MiB per photo pair');
 assert.deepEqual(['trial','single','gathering','studio'].map(id=>PLANS[id].retentionDays),[7,14,14,30]);
 assert.deepEqual(['trial','single','gathering','studio'].map(id=>PLANS[id].shareDays),[4,7,7,14]);
 for(const plan of Object.values(PLANS)){
  assert(plan.bytes>0&&plan.photos>0);
  assert(plan.shareDays<=plan.retentionDays);
 }
});

test('012 raises byte ceilings in existing event, publication and pass snapshots',async()=>{
 const db=await openDatabase({memory:true});
 try{
  const account='11111111-1111-4111-8111-111111111111';
  const event='22222222-2222-4222-8222-222222222222';
  const order='33333333-3333-4333-8333-333333333333';
  await db.query('insert into accounts(id,email,name) values($1,$2,$3)',[account,'capacity@example.test','Capacity']);
  const oldSingle={...PLANS.single,bytes:200*1024**2},oldStudio={...PLANS.studio,bytes:400*1024**2};
  await db.query('insert into events(id,owner_id,slug,name,starts_at,ends_at,time_zone,storage_prefix,entitlement,retention_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[event,account,'capacity-test','Capacity test','2026-01-01T10:00:00Z','2026-01-01T11:00:00Z','UTC','capacity/events/test',oldStudio,'2026-02-01T11:00:00Z']);
  await db.query('insert into event_publications(event_id,owner_id,source,entitlement) values($1,$2,$3,$4)',[event,account,'subscription',oldStudio]);
  await db.query('insert into orders(id,owner_id,plan,amount) values($1,$2,$3,$4)',[order,account,'single',1500]);
  await db.query('insert into event_passes(id,owner_id,order_id,entitlement) values($1,$2,$3,$4)',['44444444-4444-4444-8444-444444444444',account,order,oldSingle]);
  const migration=await readFile(new URL('../server/migrations/012-tier-photo-capacity.sql',import.meta.url),'utf8');
  await db.query(migration);
  assert.equal(Number((await db.query('select entitlement->>\'bytes\' as bytes from events where id=$1',[event])).rows[0].bytes),PLANS.studio.bytes);
  assert.equal(Number((await db.query('select entitlement->>\'bytes\' as bytes from event_publications where event_id=$1',[event])).rows[0].bytes),PLANS.studio.bytes);
  assert.equal(Number((await db.query('select entitlement->>\'bytes\' as bytes from event_passes where order_id=$1',[order])).rows[0].bytes),PLANS.single.bytes);
 }finally{await db.close();}
});
