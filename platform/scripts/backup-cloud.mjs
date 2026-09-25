import {spawn} from 'node:child_process';
import {mkdir,stat,writeFile} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import postgres from 'postgres';
import {S3Client,ListObjectsV2Command,GetObjectCommand} from '@aws-sdk/client-s3';
import {waitForChildExit} from './restore-safety.mjs';
import {captureTableInventory} from './restore-verification.mjs';

const database=process.env.PLATFORM_DATABASE_URL,bucket=process.env.PLATFORM_R2_BUCKET,endpoint=process.env.PLATFORM_R2_ENDPOINT;
if(!database||!bucket||!endpoint||!process.env.PLATFORM_R2_ACCESS_KEY_ID||!process.env.PLATFORM_R2_SECRET_ACCESS_KEY)throw new Error('Load isolated closed-test backup credentials first.');
if(bucket!=='lumiq-closed-test-photos')throw new Error('Backup is restricted to the approved closed-test R2 bucket.');
let databaseUrl;try{databaseUrl=new URL(database);}catch{throw new Error('Backup database URL is invalid.');}
const poolerRef=databaseUrl.hostname.endsWith('.pooler.supabase.com')?decodeURIComponent(databaseUrl.username).match(/^postgres\.([a-z0-9-]+)$/i)?.[1]:null;
const directRef=/^db\.([a-z0-9-]+)\.supabase\.co$/i.exec(databaseUrl.hostname)?.[1];
const sourceProjectRef=poolerRef||directRef;
if(sourceProjectRef!=='cpweowosocjuccjsyyic')throw new Error('Backup is restricted to the approved closed-test Supabase project.');
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),root=path.resolve(process.argv[2]||`backups/lumiq-${stamp}`);
await mkdir(path.join(root,'objects'),{recursive:true});

const dump=path.join(root,'database.dump'),authDump=path.join(root,'auth-users.dump'),sql=postgres(database,{ssl:'require',max:1});
let tableInventory;
try{
 await sql.begin('isolation level repeatable read, read only',async tx=>{
  const snapshot=(await tx`select pg_export_snapshot() as id`)[0].id;
  tableInventory=await captureTableInventory(tx);
  const appTables=tableInventory.filter(table=>table.schema==='public');
  if(!appTables.length||appTables.some(table=>!/^[a-z_][a-z0-9_]*$/.test(table.name)))throw new Error('Public schema inventory is empty or contains an unsupported table name.');
  const publicDump=spawn('pg_dump',['--format=custom','--no-owner',...appTables.flatMap(table=>['--table',`public.${table.name}`]),`--snapshot=${snapshot}`,'--file',dump,database],{stdio:'inherit',windowsHide:true});
  if(await waitForChildExit(publicDump)!==0)throw new Error('pg_dump failed while exporting Lumiq public schema.');
  const authUsersDump=spawn('pg_dump',['--format=custom','--data-only','--no-owner','--no-acl','--table=auth.users','--table=auth.identities',`--snapshot=${snapshot}`,'--file',authDump,database],{stdio:'inherit',windowsHide:true});
  if(await waitForChildExit(authUsersDump)!==0)throw new Error('pg_dump failed while exporting Supabase Auth users and identities.');
 });
}finally{await sql.end();}

const hashFile=async file=>{const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return{size:(await stat(file)).size,sha256:hash.digest('hex')};};
const databaseFile=await hashFile(dump),authFile=await hashFile(authDump);
const s3=new S3Client({region:'auto',endpoint,credentials:{accessKeyId:process.env.PLATFORM_R2_ACCESS_KEY_ID,secretAccessKey:process.env.PLATFORM_R2_SECRET_ACCESS_KEY}}),objects=[];
let token;
do{
 const page=await s3.send(new ListObjectsV2Command({Bucket:bucket,ContinuationToken:token}));
 for(const item of page.Contents||[]){
  const result=await s3.send(new GetObjectCommand({Bucket:bucket,Key:item.Key})),target=path.join(root,'objects',encodeURIComponent(item.Key));
  await pipeline(result.Body,createWriteStream(target,{flags:'wx'}));
  const hash=createHash('sha256');for await(const chunk of createReadStream(target))hash.update(chunk);
  objects.push({key:item.Key,size:item.Size,etag:item.ETag,sha256:hash.digest('hex'),file:path.relative(root,target)});
 }
 token=page.NextContinuationToken;
}while(token);
await writeFile(path.join(root,'manifest.json'),JSON.stringify({format_version:3,created_at:new Date().toISOString(),bucket,database:{scope:'lumiq-public-plus-auth-users-identities',source_project_ref:sourceProjectRef,file:'database.dump',size:databaseFile.size,sha256:databaseFile.sha256,auth_file:'auth-users.dump',auth_size:authFile.size,auth_sha256:authFile.sha256,tables:tableInventory},objects},null,2));
console.log(`Backup completed: ${root} (${tableInventory.length} public/Auth tables, ${objects.length} R2 objects).`);
