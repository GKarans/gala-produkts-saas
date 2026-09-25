import {openDatabase} from '../server/db.mjs';
import {PLATFORM_MIGRATIONS} from '../server/migration-manifest.mjs';
if(process.env.PLATFORM_MODE!=='staging'||process.env.PLATFORM_MIGRATE!=='1'||!process.env.PLATFORM_DATABASE_URL)throw new Error('Explicit isolated staging migration configuration is required.');
const expected=PLATFORM_MIGRATIONS.map(({version})=>version);
const protectedTables=['accounts','sessions','auth_tokens','subscriptions','events','guests','media','jobs','orders','payment_events','deliveries','support_cases','audit','metrics','request_limits','r2_usage_guard','platform_migrations'];
const db=await openDatabase();
try{
 const applied=(await db.query('select version from platform_migrations order by version')).rows.map(row=>row.version);
 const missing=expected.filter(version=>!applied.includes(version));
 const unexpected=applied.filter(version=>!expected.includes(version));
 if(missing.length||unexpected.length)throw new Error(`Closed-test schema verification failed. Missing: ${missing.join(', ')||'none'}. Unexpected: ${unexpected.join(', ')||'none'}.`);
 const security=(await db.query(`
  select c.relname,c.relrowsecurity as rls,
    has_table_privilege('anon',c.oid,'SELECT') as anon_can_read,
    has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_can_read
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in ('r','p') and c.relname=any($1::text[])
 `,[protectedTables])).rows;
 const unsafe=security.filter(table=>!table.rls||table.anon_can_read||table.authenticated_can_read).map(table=>table.relname);
 const absent=protectedTables.filter(name=>!security.some(table=>table.relname===name));
 if(absent.length||unsafe.length)throw new Error(`Closed-test access verification failed. Missing tables: ${absent.join(', ')||'none'}. RLS/read access problems: ${unsafe.join(', ')||'none'}.`);
 console.log(`Isolated platform schema verified: ${applied.join(', ')}. RLS enabled and anon/authenticated SELECT denied on ${security.length} tables. No MVP migration was run.`);
}finally{await db.close();}
