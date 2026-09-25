alter table accounts add column if not exists design_defaults jsonb not null default '{}';
