create table if not exists accounts (
 id uuid primary key, email text not null unique, password_hash text, name text not null,
 verified boolean not null default false, role text not null default 'customer' check(role in ('customer','admin')),
 preferences jsonb not null default '{"service":true,"marketing":false}', deleted_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists sessions (token_hash text primary key, account_id uuid not null references accounts, expires_at timestamptz not null);
alter table sessions add column if not exists provider_session text;
create table if not exists auth_tokens (token_hash text primary key, account_id uuid not null references accounts, purpose text not null, payload jsonb not null default '{}', expires_at timestamptz not null);
create table if not exists subscriptions (
 account_id uuid primary key references accounts, plan text not null default 'trial', status text not null default 'trialing',
 period_end timestamptz not null default now()+interval '14 days', cancel_at_end boolean not null default false,
 provider_id text unique, provider_updated_at bigint not null default 0, updated_at timestamptz not null default now()
);
alter table subscriptions add column if not exists provider_customer text;
create table if not exists events (
 id uuid primary key, owner_id uuid not null references accounts, slug text not null unique, name text not null,
 description text not null default '', starts_at timestamptz not null, ends_at timestamptz not null,
 time_zone text not null, status text not null default 'draft' check(status in ('draft','published','archived','deleted')),
 paused boolean not null default false, appearance jsonb not null default '{}', storage_prefix text not null unique,
 entitlement jsonb not null, retention_at timestamptz not null, share_enabled boolean not null default false,
 share_expires timestamptz, share_used bigint not null default 0, share_limit bigint not null default 20000,
 created_at timestamptz not null default now(), check(ends_at>starts_at)
);
create index if not exists events_owner_date on events(owner_id,created_at desc);
create table if not exists guests (id uuid primary key,event_id uuid not null references events,name text not null, token_hash text not null unique,storage_prefix text not null,created_at timestamptz not null default now());
create table if not exists media (
 id uuid primary key,event_id uuid not null references events,guest_id uuid not null references guests,
 object_key text not null unique,thumbnail_key text not null unique, name text not null, bytes bigint not null,
 thumbnail_bytes bigint not null, checksum text, thumbnail_checksum text,
 status text not null default 'pending' check(status in ('pending','uploaded','deleted')), created_at timestamptz not null default now(),
 deleted_at timestamptz, check(bytes>0 and bytes<=6291456),check(thumbnail_bytes>0 and thumbnail_bytes<=1048576)
);
create index if not exists media_event_date on media(event_id,status,created_at,id);
create table if not exists jobs (
 id uuid primary key,owner_id uuid references accounts,event_id uuid references events,type text not null,
 status text not null default 'queued' check(status in ('queued','processing','ready','failed')),
 payload jsonb not null default '{}',result jsonb not null default '{}',attempts integer not null default 0,
 available_at timestamptz not null default now(),lease_until timestamptz,error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists jobs_pending on jobs(status,available_at);
create table if not exists orders(id uuid primary key,owner_id uuid not null references accounts,plan text not null,amount integer not null,status text not null default 'pending',provider_id text unique,created_at timestamptz not null default now());
create table if not exists payment_events(id text primary key,created bigint not null,received_at timestamptz not null default now());
create table if not exists deliveries(id uuid primary key,account_id uuid references accounts,recipient text not null,subject text not null,body text not null,dedupe_key text unique,status text not null default 'queued',attempts integer not null default 0,created_at timestamptz not null default now());
create table if not exists support_cases(id uuid primary key,owner_id uuid references accounts,email text not null,subject text not null,message text not null,status text not null default 'open',reply text,created_at timestamptz not null default now());
create table if not exists audit(id uuid primary key,actor_id uuid,action text not null,target_id text,detail jsonb not null default '{}',created_at timestamptz not null default now());
create table if not exists metrics(id uuid primary key,event_id uuid,kind text not null,amount bigint not null default 1,created_at timestamptz not null default now());
create table if not exists request_limits(key_hash text primary key,window_id bigint not null,requests integer not null,expires_at timestamptz not null);
alter table request_limits enable row level security;

-- This schema is server-only. Browser Supabase clients receive no table access.
alter table accounts enable row level security;
alter table sessions enable row level security;
alter table auth_tokens enable row level security;
alter table subscriptions enable row level security;
alter table events enable row level security;
alter table guests enable row level security;
alter table media enable row level security;
alter table jobs enable row level security;
alter table orders enable row level security;
alter table payment_events enable row level security;
alter table deliveries enable row level security;
alter table support_cases enable row level security;
alter table audit enable row level security;
alter table metrics enable row level security;
-- Run this grant block with the future Supabase installation, after migration.
do $$ begin
 if exists(select 1 from pg_roles where rolname='anon') then
   revoke all on accounts,sessions,auth_tokens,subscriptions,events,guests,media,jobs,orders,payment_events,deliveries,support_cases,audit,metrics,request_limits from anon;
 end if;
 if exists(select 1 from pg_roles where rolname='authenticated') then
   revoke all on accounts,sessions,auth_tokens,subscriptions,events,guests,media,jobs,orders,payment_events,deliveries,support_cases,audit,metrics,request_limits from authenticated;
 end if;
end $$;
