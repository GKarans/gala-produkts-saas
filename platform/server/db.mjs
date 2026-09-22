import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {migrate} from './migrations.mjs';
import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function openDatabase(options={}) {
 const connection=options.connection??process.env.PLATFORM_DATABASE_URL;
 let query,transaction,close;
 if(connection){
  if(/ojcvnsbhphvijmzjfenl|af664043db99694ff5a6ac88a7e7dc4d/.test(connection))throw new Error('MVP infrastructure is forbidden');
  const {default:postgres}=await import('postgres');
  const sql=postgres(connection,{ssl:'require',max:5});
  query=async(text,args=[])=>({rows:await sql.unsafe(text,args)});
  transaction=fn=>sql.begin(tx=>fn({exec:text=>tx.unsafe(text).simple(),query:async(text,args=[])=>({rows:await tx.unsafe(text,args)})}));
  close=()=>sql.end();
 }else{
  const {PGlite}=await import('@electric-sql/pglite');
  const directory=options.memory?'memory://':path.join(ROOT,'.local','database');
  if(!options.memory)await mkdir(directory,{recursive:true});
  const db=new PGlite(directory);query=(...args)=>db.query(...args);transaction=fn=>db.transaction(fn);close=()=>db.close();
 }
 const db={query,transaction,close};
 const entries=[];
 for(const [version,file]of [['001-platform','schema.sql'],['002-delivery-leases','migrations/002-delivery-leases.sql'],['003-publication-allowances','migrations/003-publication-allowances.sql'],['004-account-profile','migrations/004-account-profile.sql'],['005-gallery-curation','migrations/005-gallery-curation.sql']])entries.push({version,sql:await readFile(path.join(ROOT,'server',file),'utf8')});
 // A single schema execution is valid in PostgreSQL and PGlite extended mode through transaction.
 if(!connection||process.env.PLATFORM_MIGRATE==='1')await migrate(db,entries,{local:!connection});
 else {
  const applied=(await db.query('select version from platform_migrations')).rows.map(r=>r.version);
  if(entries.some(e=>!applied.includes(e.version)))throw new Error('Platform migrations are pending. Run npm run migrate before starting.');
 }
 return db;
}
