import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

test('Cloudflare npm aliases cannot target the live staging config',async()=>{
 const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 assert.match(pkg.scripts['cloudflare:dev'],/platform\/scripts\/block-deploy\.mjs --dev/);
 assert.match(pkg.scripts['cloudflare:deploy'],/platform\/scripts\/block-deploy\.mjs/);
 for(const args of [[],['--dev']]){
  const result=spawnSync(process.execPath,[path.join(root,'platform/scripts/block-deploy.mjs'),...args],{encoding:'utf8'});
  assert.equal(result.status,1);
  assert.match(result.stderr,/existing lumiq\.cam staging Worker and its data/);
 }
});
