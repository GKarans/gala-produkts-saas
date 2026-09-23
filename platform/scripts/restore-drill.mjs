import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { assertEmptyPublicSchema, validateRestoreTarget, waitForChildExit } from './restore-safety.mjs';

if (process.env.PLATFORM_RESTORE_DRILL !== 'EMPTY-ISOLATED-TARGET') {
  throw new Error('Set PLATFORM_RESTORE_DRILL=EMPTY-ISOLATED-TARGET only for a new empty drill environment.');
}

const backupDirectory = process.argv[2];
if (!backupDirectory) throw new Error('Usage: node platform/scripts/restore-drill.mjs <backup-directory>');

const database = process.env.PLATFORM_DATABASE_URL;
const bucket = process.env.PLATFORM_R2_BUCKET;
const endpoint = process.env.PLATFORM_R2_ENDPOINT;
if (!database || !bucket || !endpoint) throw new Error('Load the empty restore target credentials.');
validateRestoreTarget(database, process.env.PLATFORM_RESTORE_TARGET_REF);

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
} finally {
  await sql.end();
}

const pgRestore = spawn('pg_restore', [
  '--exit-on-error',
  '--no-owner',
  '--no-acl',
  '--dbname',
  database,
  path.join(root, 'database.dump')
], { stdio: 'inherit', windowsHide: true });
if (await waitForChildExit(pgRestore) !== 0) {
  throw new Error('Database restore failed. Install PostgreSQL client tools and retry.');
}

for (const object of manifest.objects) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: object.key,
    Body: createReadStream(path.join(root, object.file))
  }));
}
console.log(`Restore drill loaded the database and ${manifest.objects.length} objects. Run migrations, application smoke tests and checksum verification before recording success.`);
