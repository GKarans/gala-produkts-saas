import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { assertEmptyAuthUsers, assertEmptyPublicSchema, validateRestoreTarget, waitForChildExit } from './restore-safety.mjs';
import {assertObjectInventory,assertTableInventory} from './restore-verification.mjs';

if (process.env.PLATFORM_RESTORE_DRILL !== 'EMPTY-ISOLATED-TARGET') {
  throw new Error('Set PLATFORM_RESTORE_DRILL=EMPTY-ISOLATED-TARGET only for a new empty drill environment.');
}

const backupDirectory = process.argv[2];
if (!backupDirectory) throw new Error('Usage: node platform/scripts/restore-drill.mjs <backup-directory>');

const database = process.env.PLATFORM_DATABASE_URL;
const bucket = process.env.PLATFORM_R2_BUCKET;
const endpoint = process.env.PLATFORM_R2_ENDPOINT;
if (!database || !bucket || !endpoint || !process.env.PLATFORM_R2_ACCESS_KEY_ID || !process.env.PLATFORM_R2_SECRET_ACCESS_KEY) throw new Error('Load the empty restore target credentials.');
const targetProjectRef=validateRestoreTarget(database, process.env.PLATFORM_RESTORE_TARGET_REF);

const root = path.resolve(backupDirectory);
const scripts = path.dirname(fileURLToPath(import.meta.url));
const verification = spawn(process.execPath, [path.join(scripts, 'verify-backup.mjs'), root], {
  stdio: 'inherit',
  windowsHide: true
});
if (await waitForChildExit(verification) !== 0) {
  throw new Error('Backup integrity verification failed; restore was not started.');
}
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
if (targetProjectRef === manifest.database.source_project_ref) throw new Error('Restore target must be a different Supabase project from the source.');
if (bucket === manifest.bucket) throw new Error('Restore target R2 bucket must be different from the source bucket.');

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.PLATFORM_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.PLATFORM_R2_SECRET_ACCESS_KEY
  }
});
const existing = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
if (existing.KeyCount) throw new Error('Restore target bucket is not empty.');

const sql = postgres(database, { ssl: 'require', max: 1 });
try {
  await assertEmptyPublicSchema(sql);
  await assertEmptyAuthUsers(sql);
} finally {
  await sql.end();
}

const pgRestore = spawn('pg_restore', [
  '--exit-on-error',
  '--no-owner',
  '--dbname',
  database,
  path.join(root, 'database.dump')
], { stdio: 'inherit', windowsHide: true });
if (await waitForChildExit(pgRestore) !== 0) {
  throw new Error('Database restore failed. Install PostgreSQL client tools and retry.');
}

const authRestore = spawn('pg_restore', [
  '--data-only',
  '--exit-on-error',
  '--no-owner',
  '--no-acl',
  '--dbname',
  database,
  path.join(root, manifest.database.auth_file)
], { stdio: 'inherit', windowsHide: true });
if (await waitForChildExit(authRestore) !== 0) {
  throw new Error('Supabase Auth user/identity restore failed.');
}

const restoredDb=postgres(database,{ssl:'require',max:1});
let restoredTables;
try{restoredTables=await assertTableInventory(restoredDb,manifest.database.tables);}finally{await restoredDb.end();}

for (const object of manifest.objects) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: object.key,
    Body: createReadStream(path.join(root, object.file))
  }));
}
const restoredObjects=await assertObjectInventory({s3,bucket,expected:manifest.objects});
console.log(`Restore verified: ${restoredTables} public tables match row counts; all ${restoredObjects} R2 objects match keys, sizes and SHA-256 checksums.`);
console.log('Still run the migration verifier, application smoke tests and a sample ZIP extraction before recording the full drill as complete.');
