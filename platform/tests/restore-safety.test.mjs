import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {assertEmptyAuthUsers,assertEmptyPublicSchema,libpqConnectionForCli,validateRestoreTarget,waitForChildExit} from '../scripts/restore-safety.mjs';

const ref='cpweowosocjuccjsyyic';

test('libpq CLI connections keep passwords out of process arguments',()=>{
 const result=libpqConnectionForCli('postgresql://postgres.project:pa%40ss%3Aword@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require');
 assert.equal(result.password,'pa@ss:word');
 assert.equal(result.connectionString,'postgresql://postgres.project@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require');
 assert.equal(result.connectionString.includes('pa@ss'),false);
 assert.throws(()=>libpqConnectionForCli('postgresql://postgres@db.example.com:5432/postgres'),/include a host, username and password/);
});

test('restore target confirmation matches direct and session-pooler Supabase URLs',()=>{
 assert.equal(validateRestoreTarget(`postgresql://postgres.${ref}:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,ref),ref);
 assert.equal(validateRestoreTarget(`postgresql://postgres:secret@db.${ref}.supabase.co:5432/postgres`,ref),ref);
});

test('restore target confirmation rejects wrong project refs and non-Supabase hosts',()=>{
 assert.throws(()=>validateRestoreTarget(`postgresql://postgres.${ref}:secret@pool.example.com:5432/postgres`,ref),/does not match/);
 assert.throws(()=>validateRestoreTarget(`postgresql://postgres.otherref:secret@pooler.supabase.com:5432/postgres`,ref),/does not match/);
 assert.throws(()=>validateRestoreTarget(`postgresql://postgres.${ref}:secret@pooler.supabase.com:5432/postgres`,''),/Confirm the exact/);
});

test('restore target confirmation rejects wrong schemes and transaction-pooler port',()=>{
 assert.throws(()=>validateRestoreTarget(`https://postgres.${ref}:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,ref),/PostgreSQL endpoint on port 5432/);
 assert.throws(()=>validateRestoreTarget(`postgresql://postgres.${ref}:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,ref),/PostgreSQL endpoint on port 5432/);
});

test('restore preflight refuses databases containing public tables',async()=>{
 const empty=async()=>[];
 await assertEmptyPublicSchema(empty);
 await assert.rejects(assertEmptyPublicSchema(async()=>[{table_name:'events'}]),/not empty \(events\)/);
});

test('restore preflight refuses target projects with existing Auth users or identities',async()=>{
 await assertEmptyAuthUsers(async()=>[]);
 await assert.rejects(assertEmptyAuthUsers(async()=>[{table_name:'users'}]),/Auth data is not empty \(users\)/);
 await assert.rejects(assertEmptyAuthUsers(async()=>[{table_name:'identities'}]),/Auth data is not empty \(identities\)/);
});

test('missing restore utility rejects rather than leaving the drill waiting',async()=>{
 const child=new EventEmitter(),pending=waitForChildExit(child);child.emit('error',Object.assign(new Error('missing'),{code:'ENOENT'}));
 await assert.rejects(pending,/missing/);
});
