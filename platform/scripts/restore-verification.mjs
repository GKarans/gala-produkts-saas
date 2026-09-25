import {createHash} from 'node:crypto';
import {GetObjectCommand,ListObjectsV2Command} from '@aws-sdk/client-s3';

const quoteIdentifier=value=>`"${String(value).replaceAll('"','""')}"`;

export async function captureTableInventory(tx){
 const tables=await tx`
  select t.schemaname, t.tablename
  from pg_catalog.pg_tables t
  join pg_catalog.pg_class c on c.relname=t.tablename
  join pg_catalog.pg_namespace n on n.nspname=t.schemaname and n.oid=c.relnamespace
  where t.schemaname='public'
    and not exists (
     select 1 from pg_catalog.pg_depend d
     where d.classid='pg_catalog.pg_class'::regclass and d.objid=c.oid
       and d.refclassid='pg_catalog.pg_extension'::regclass and d.deptype='e'
    )
  union all
  select table_schema as schemaname, table_name as tablename
  from information_schema.tables
  where table_schema='auth' and table_name in ('users','identities') and table_type='BASE TABLE'
  order by schemaname,tablename
 `;
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
