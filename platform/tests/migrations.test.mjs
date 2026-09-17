import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/db.mjs';
import {migrate} from '../server/migrations.mjs';
test('numbered schema migrations are idempotent and reject changed applied SQL',async()=>{
 const db=await openDatabase({memory:true});
 try{
  const first={version:'fixture-001',sql:"-- SQL comments may contain ; safely\ncreate table fixture(id integer primary key); create table fixture_note(body text); insert into fixture_note values('a;b');"};
  await migrate(db,[first]);await migrate(db,[first]);
  assert.equal((await db.query("select body from fixture_note")).rows[0].body,'a;b');
  assert.equal((await db.query("select count(*)::int as n from platform_migrations where version='fixture-001'")).rows[0].n,1);
  await assert.rejects(migrate(db,[{...first,sql:'drop table fixture'}]),/changed/);
  await migrate(db,[first,{version:'fixture-002',sql:'alter table fixture add column title text'}]);
  await db.query("insert into fixture values(1,'upgraded')");assert.equal((await db.query('select title from fixture')).rows[0].title,'upgraded');
 }finally{await db.close();}
});
