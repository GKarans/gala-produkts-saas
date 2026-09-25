import {once} from 'node:events';

export async function waitForChildExit(child){return (await once(child,'close'))[0]??1;}

export function validateRestoreTarget(databaseUrl, expectedProjectRef){
 if(typeof expectedProjectRef!=='string'||! /^[a-z0-9-]{8,64}$/i.test(expectedProjectRef))throw new Error('Confirm the exact empty drill project reference in PLATFORM_RESTORE_TARGET_REF.');
 let url;try{url=new URL(databaseUrl);}catch{throw new Error('Restore target must be a valid PostgreSQL URL.');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||(url.port&&url.port!=='5432'))throw new Error('Restore target must use the Supabase PostgreSQL endpoint on port 5432.');
 const username=decodeURIComponent(url.username),poolerRef=url.hostname.endsWith('.pooler.supabase.com')?username.match(/^postgres\.([a-z0-9-]+)$/i)?.[1]:null,directRef=url.hostname.match(/^db\.([a-z0-9-]+)\.supabase\.co$/i)?.[1],actualRef=poolerRef||directRef;
 if(!actualRef||actualRef!==expectedProjectRef)throw new Error('Restore target URL does not match the confirmed Supabase project reference.');
 return actualRef;
}

export async function assertEmptyPublicSchema(sql){
 const existing=await sql`
  select table_name from information_schema.tables
  where table_schema='public'
    and table_name not in ('spatial_ref_sys','geometry_columns','geography_columns')
  limit 1
 `;
 if(existing.length)throw new Error(`Restore target public schema is not empty (${existing[0].table_name}).`);
}

export async function assertEmptyAuthUsers(sql){
 const existing=await sql`
  select 'users' as table_name where exists (select 1 from auth.users limit 1)
  union all
  select 'identities' as table_name where exists (select 1 from auth.identities limit 1)
 `;
 if(existing.length)throw new Error(`Restore target Auth data is not empty (${existing[0].table_name}).`);
}
