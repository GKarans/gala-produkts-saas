alter table accounts add column if not exists profile jsonb not null default '{}'::jsonb;
