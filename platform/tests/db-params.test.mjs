import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeUuidArrayParameters,openDatabase} from '../server/db.mjs';

test('PostgreSQL UUID array placeholders are encoded as array literals without mutating input',()=>{
 const ids=['91bbb7b1-da7b-4a4b-a1b2-b15dc5db2e7f','4a4e6d20-1357-4ca6-a10d-0fb62d8ed341'];
 const args=[ids,'untouched'];
 const encoded=encodeUuidArrayParameters('id=any($1::uuid[]) or id=any($1::uuid[]) and name=$2',args);
 assert.equal(encoded[0],'{"91bbb7b1-da7b-4a4b-a1b2-b15dc5db2e7f","4a4e6d20-1357-4ca6-a10d-0fb62d8ed341"}');
 assert.equal(encoded[1],'untouched');
 assert.equal(args[0],ids);
});

test('PostgreSQL UUID array placeholders support empty, null and unrelated parameters',()=>{
 const encoded=encodeUuidArrayParameters('id=any($1::uuid[]) or $2::uuid[] is null or email=$3',[[],null,['not-for-uuid[]']]);
 assert.equal(encoded[0],'{}');
 assert.equal(encoded[1],null);
 assert.deepEqual(encoded[2],['not-for-uuid[]']);
});

test('encoded UUID arrays are accepted by PostgreSQL array casts',async()=>{
 const db=await openDatabase({memory:true});
 try{
  const ids=['91bbb7b1-da7b-4a4b-a1b2-b15dc5db2e7f'];
  const values=encodeUuidArrayParameters('select $1::uuid[] as ids',[ids]);
  const result=await db.query('select $1::uuid[] as ids',values);
  assert.deepEqual(result.rows[0].ids,ids);
 }finally{await db.close();}
});
