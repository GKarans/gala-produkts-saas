alter table deliveries add column if not exists available_at timestamptz not null default now();
alter table deliveries add column if not exists lease_until timestamptz;
create index if not exists deliveries_pending on deliveries(status,available_at);
