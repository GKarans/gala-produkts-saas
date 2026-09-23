import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateWebp} from '../../cloudflare/worker/src/webp-validation.js';
import {createWorkerHandler} from '../../cloudflare/worker/src/router.js';

test('Worker WebP validation accepts optimized photos and rejects malformed or oversized files',async()=>{
 const sample=await readFile(new URL('../public/assets/garden-gathering.webp',import.meta.url));
 await validateWebp(sample);
 await assert.rejects(validateWebp(sample.subarray(0,sample.length-1)));
 const oversized=Buffer.from(sample);
 const dimensions=oversized.indexOf(Buffer.from('VP8 '));
 assert.notEqual(dimensions,-1);
 oversized[dimensions+14]=0xff;
 oversized[dimensions+15]=0xff;
 oversized[dimensions+16]=0xff;
 oversized[dimensions+17]=0xff;
 await assert.rejects(validateWebp(oversized));
});

test('Worker forwards API requests and reports database health',async()=>{
 const seen=[];
 const handler=createWorkerHandler(async()=>({
  db:{query:async sql=>{seen.push(sql);return{rows:[{ready:1}]};},close:async()=>{seen.push('closed');}},
  handle:async request=>{seen.push(new URL(request.url).pathname);return new Response('api response');}
 }));
 const api=await handler.fetch(new Request('https://lumiq.cam/api/config'),{});
 assert.equal(api.status,200);
 assert.equal(await api.text(),'api response');
 const health=await handler.fetch(new Request('https://lumiq.cam/healthz'),{});
 assert.equal(health.status,200);
 assert.deepEqual(await health.json(),{status:'ok',service:'lumiq-cam',database:'ready',storage:'bound'});
 assert.deepEqual(seen,['/api/config','closed','select 1 as ready','closed']);
});

test('Worker serves assets and gives a closed 503 when backend setup is unavailable',async()=>{
 const handler=createWorkerHandler(async()=>{throw new Error('private configuration detail');});
 const page=await handler.fetch(new Request('https://lumiq.cam/'),{ASSETS:{fetch:async()=>new Response('static app')}});
 assert.equal(await page.text(),'static app');
 const api=await handler.fetch(new Request('https://lumiq.cam/api/config'),{});
 assert.equal(api.status,503);
 assert.deepEqual(await api.json(),{error:'Lumiq backend is temporarily unavailable.'});
 const health=await handler.fetch(new Request('https://lumiq.cam/healthz'),{});
 assert.equal(health.status,503);
 assert.equal((await health.json()).database,'unavailable');
});
