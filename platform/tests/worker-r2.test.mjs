import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {createR2Storage} from '../../cloudflare/worker/src/r2-storage.js';
import {openDatabase} from '../server/db.mjs';

function memoryBucket(){
 const objects=new Map();
 return {
  objects,
  async put(key,value,options={}){const bytes=value instanceof ReadableStream?new Uint8Array(await new Response(value).arrayBuffer()):new Uint8Array(value);objects.set(key,{bytes,contentType:options.httpMetadata?.contentType});return{key,size:bytes.byteLength};},
  async get(key){const object=objects.get(key);return object?{size:object.bytes.byteLength,httpMetadata:{contentType:object.contentType},arrayBuffer:async()=>object.bytes.slice().buffer,body:new Blob([object.bytes]).stream()}:null;},
  async head(key){const object=objects.get(key);return object?{size:object.bytes.byteLength}:null;},
  async delete(key){objects.delete(key);}
 };
}

test('Worker R2 adapter stores, reads, sizes, and deletes private objects',async()=>{
 const bucket=memoryBucket(),files=createR2Storage(bucket),bytes=Buffer.from('photo bytes');
 assert.equal(files.remote,true);
 await files.put('event--id/guests/guest--id/photo.webp',bytes,'image/webp');
 assert.deepEqual(await files.get('event--id/guests/guest--id/photo.webp'),bytes);
 assert.equal(await new Response(await files.getStream('event--id/guests/guest--id/photo.webp')).text(),'photo bytes');
 assert.equal(await files.size('event--id/guests/guest--id/photo.webp'),bytes.length);
 assert.equal(bucket.objects.get('event--id/guests/guest--id/photo.webp').contentType,'image/webp');
 await files.remove('event--id/guests/guest--id/photo.webp');
 await assert.rejects(files.get('event--id/guests/guest--id/photo.webp'),/not found/);
});

test('Worker R2 adapter accepts streams and rejects unsafe object keys',async()=>{
 const bucket=memoryBucket(),files=createR2Storage(bucket);
 await files.putStream('events/event-1/photo.webp',new Blob(['stream bytes']).stream(),'image/webp');
 assert.equal((await files.get('events/event-1/photo.webp')).toString(),'stream bytes');
 const nodeStream=new PassThrough(),saving=files.putStream('events/event-1/export.zip',nodeStream,'application/zip');
 nodeStream.end('zip bytes');await saving;
 assert.equal((await files.get('events/event-1/export.zip')).toString(),'zip bytes');
 await assert.rejects(files.get('../outside.webp'),/Invalid R2 object key/);
 await assert.rejects(files.get('/outside.webp'),/Invalid R2 object key/);
});

test('Worker R2 adapter requires a bucket binding',()=>{
 assert.throws(()=>createR2Storage(null),/bucket binding is required/);
});

test('Worker R2 budget atomically stops monthly operations and cumulative writes',async()=>{
 const db=await openDatabase({memory:true}),bucket=memoryBucket();
 try{
  const files=createR2Storage(bucket,{db,limits:{classAOpsPerMonth:3,classBOpsPerMonth:2,lifetimeWriteBytes:8,streamWriteBytes:8}});
  await Promise.allSettled([
   files.put('events/one.webp',Buffer.from('1234')),
   files.put('events/two.webp',Buffer.from('5678')),
   files.put('events/three.webp',Buffer.from('abcd'))
  ]).then(results=>assert.equal(results.filter(x=>x.status==='fulfilled').length,2));
  assert.equal((await db.query('select class_a_ops,lifetime_write_bytes from r2_usage_guard where singleton=true')).rows[0].class_a_ops,2);
  assert.equal((await db.query('select lifetime_write_bytes from r2_usage_guard where singleton=true')).rows[0].lifetime_write_bytes,8);
  await files.get('events/one.webp');
  await files.size('events/two.webp');
  await assert.rejects(files.get('events/one.webp'),/safety allowance/);
  await files.remove('events/one.webp');
  assert.equal((await db.query('select class_a_ops from r2_usage_guard where singleton=true')).rows[0].class_a_ops,3);
  await assert.rejects(files.put('events/one.webp',Buffer.from('x')),/safety allowance/);
 } finally {
  await db.close();
 }
});

test('Worker R2 stream writes require and enforce a bounded byte reservation',async()=>{
 const db=await openDatabase({memory:true}),bucket=memoryBucket();
 try{
  const files=createR2Storage(bucket,{db,limits:{classAOpsPerMonth:5,classBOpsPerMonth:5,lifetimeWriteBytes:10,streamWriteBytes:5}});
  await files.putStream('events/export.zip',new Blob(['four']).stream(),'application/zip',{maxBytes:5,contentLength:4});
  assert.equal((await db.query('select lifetime_write_bytes from r2_usage_guard where singleton=true')).rows[0].lifetime_write_bytes,4);
  await assert.rejects(files.putStream('events/too-large.zip',new Blob(['six!!!']).stream(),'application/zip',{maxBytes:5,contentLength:6}),/configured storage safety limit/);
  await assert.rejects(files.putStream('events/wrong-length.zip',new Blob(['four']).stream(),'application/zip',{maxBytes:5,contentLength:3}),/declared length/);
  await assert.rejects(files.putStream('events/unreserved.zip',new Blob(['x']).stream(),'application/zip'),/configured storage safety limit/);
 } finally {
  await db.close();
 }
});
