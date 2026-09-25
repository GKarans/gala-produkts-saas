import {createHash} from 'node:crypto';
import {GetObjectCommand,ListObjectsV2Command} from '@aws-sdk/client-s3';

const quoteIdentifier=value=>`"${String(value).replaceAll('"','""')}"`;

export async function captureTableInventory(tx){
 const tables=await tx`select schemaname, tablename from pg_catalog.pg_tables where schemaname='public' order by schemaname,tablename`;
 const inventory=[];
 for(const table of tables){
  const relation=`${quoteIdentifier(table.schemaname)}.${quoteIdentifier(table.tablename)}`;
  const rows=await tx.unsafe(`select count(*)::text as row_count from ${relation}`);
  inventory.push({schema:table.schemaname,name:table.tablename,rows:rows[0].row_count});
 }
 return inventory;
}

export async function assertTableInventory(tx,expected){
 if(!Array.isArray(expected))throw new Error('Backup has no database table inventory. Create a new backup before the restore drill.');
 const actual=await captureTableInventory(tx);
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('Restored database table inventory does not match the backup.');
 return actual.length;
}

async function digestBody(body){
 const hash=createHash('sha256');let size=0;
 for await(const chunk of body){hash.update(chunk);size+=chunk.length;}
 return{size,sha256:hash.digest('hex')};
}

export async function assertObjectInventory({s3,bucket,expected,listPage,getObject}){
 const list=listPage||(ContinuationToken=>s3.send(new ListObjectsV2Command({Bucket:bucket,ContinuationToken})));
 const read=getObject||(key=>s3.send(new GetObjectCommand({Bucket:bucket,Key:key})));
 const actual=new Map();let token;
 do{const page=await list(token);for(const item of page.Contents||[])actual.set(item.Key,item.Size);token=page.NextContinuationToken;}while(token);
 if(actual.size!==expected.length||expected.some(item=>actual.get(item.key)!==item.size))throw new Error('Restored R2 key and size inventory does not match the backup.');
 for(const item of expected){const result=await read(item.key);const measured=await digestBody(result.Body);if(measured.size!==item.size||measured.sha256!==item.sha256)throw new Error(`Restored R2 object checksum mismatch: ${item.key}`);}
 return actual.size;
}
