import {createHash} from 'node:crypto';

// Add new numbered entries; never edit a migration already applied to staging.
export async function migrate(db,entries,{local=false}={}){
 await db.query('create table if not exists platform_migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())');
 await db.query('alter table platform_migrations enable row level security');
 await db.query("do $$ begin if exists(select 1 from pg_roles where rolname='anon') then revoke all on platform_migrations from anon; end if; if exists(select 1 from pg_roles where rolname='authenticated') then revoke all on platform_migrations from authenticated; end if; end $$;");
 for(const entry of entries){
  const checksum=createHash('sha256').update(entry.sql.replaceAll('\r\n','\n')).digest('hex');
  await db.transaction(async tx=>{
   await tx.query('lock table platform_migrations in exclusive mode');
   const prior=(await tx.query('select checksum from platform_migrations where version=$1',[entry.version])).rows[0];
   if(prior?.checksum===checksum)return;
   if(prior&&!local)throw new Error(`Migration ${entry.version} changed after application. Add a new forward migration.`);
   await tx.exec(entry.sql);
   await tx.query('insert into platform_migrations(version,checksum) values($1,$2) on conflict(version) do update set checksum=excluded.checksum,applied_at=now()',[entry.version,checksum]);
  });
 }
}
