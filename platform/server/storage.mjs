import {mkdir,writeFile,readFile,rm,stat} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {Upload} from '@aws-sdk/lib-storage';
import {ROOT} from './db.mjs';
import {requireThat} from './security.mjs';
export function storage(options={}){
 const root=options.root||path.join(ROOT,'.local','objects');
 const bucket=process.env.PLATFORM_R2_BUCKET;
 requireThat(bucket!=='app-images',500,'MVP bucket is forbidden');
 const client=bucket?new S3Client({region:'auto',forcePathStyle:true,endpoint:process.env.PLATFORM_R2_ENDPOINT,credentials:{accessKeyId:process.env.PLATFORM_R2_ACCESS_KEY_ID,secretAccessKey:process.env.PLATFORM_R2_SECRET_ACCESS_KEY},requestChecksumCalculation:'WHEN_REQUIRED'}):null;
 const valid=key=>{requireThat(typeof key==='string'&&/^[a-zA-Z0-9/_ .-]+$/.test(key)&&!key.split('/').some(x=>x==='..'||x==='.')&&!key.startsWith('/'),400,'Invalid file path.');return key;};
 const location=key=>path.join(root,valid(key));
 return {
  remote:Boolean(client),
  async put(key,bytes,type='image/webp'){valid(key);if(client){await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:type}));return;}await mkdir(path.dirname(location(key)),{recursive:true});await writeFile(location(key),bytes);},
  async putStream(key,stream,type='application/octet-stream'){valid(key);if(client){await new Upload({client,params:{Bucket:bucket,Key:key,Body:stream,ContentType:type}}).done();return;}await mkdir(path.dirname(location(key)),{recursive:true});await pipeline(stream,createWriteStream(location(key),{flags:'wx'}));},
  async get(key){valid(key);if(client){const r=await client.send(new GetObjectCommand({Bucket:bucket,Key:key}));return Buffer.from(await r.Body.transformToByteArray());}return readFile(location(key));},
  async remove(key){valid(key);if(client)return client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));await rm(location(key),{force:true});},
  async signedPut(key,bytes,checksum){requireThat(client,400,'Direct storage is unavailable.');return getSignedUrl(client,new PutObjectCommand({Bucket:bucket,Key:valid(key),ContentType:'image/webp',ContentLength:bytes,ChecksumSHA256:checksum}),{expiresIn:300,unhoistableHeaders:new Set(['x-amz-checksum-sha256']),signableHeaders:new Set(['content-type','content-length'])});},
  async size(key){if(client)return(await client.send(new HeadObjectCommand({Bucket:bucket,Key:valid(key)}))).ContentLength;return(await stat(location(key))).size;}
 };
}
