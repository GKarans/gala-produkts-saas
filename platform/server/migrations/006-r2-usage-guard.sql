create table if not exists r2_usage_guard (
  singleton boolean primary key default true check (singleton),
  month_start date not null,
  class_a_ops bigint not null default 0 check (class_a_ops >= 0),
  class_b_ops bigint not null default 0 check (class_b_ops >= 0),
  lifetime_write_bytes bigint not null default 0 check (lifetime_write_bytes >= 0)
);

alter table r2_usage_guard enable row level security;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on r2_usage_guard from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on r2_usage_guard from authenticated;
  end if;
end $$;
