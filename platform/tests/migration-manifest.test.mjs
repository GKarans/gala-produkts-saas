import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import path from 'node:path';
import {PLATFORM_MIGRATIONS} from '../server/migration-manifest.mjs';
import {openDatabase,ROOT} from '../server/db.mjs';
import {migrationVersions} from '../../cloudflare/worker/src/index.js';

test('database, release verifier and Worker share the complete forward migration manifest',async()=>{
 const versions=PLATFORM_MIGRATIONS.map(({version})=>version);
 assert.deepEqual(migrationVersions,versions);
 for(const {file} of PLATFORM_MIGRATIONS)await access(path.join(ROOT,'server',file));
 const db=await openDatabase({memory:true});
 try{
  const applied=(await db.query('select version from platform_migrations order by version')).rows.map(row=>row.version);
  assert.deepEqual(applied,[...versions].sort());
 }finally{await db.close();}
});
