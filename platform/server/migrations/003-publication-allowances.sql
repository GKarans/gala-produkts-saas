alter table subscriptions add column if not exists period_start timestamptz;
update subscriptions set period_start=least(updated_at,period_end-interval '1 day') where period_start is null;
alter table subscriptions alter column period_start set default now();
alter table subscriptions alter column period_start set not null;

create table if not exists event_passes (
 id uuid primary key,owner_id uuid not null references accounts,order_id uuid not null unique references orders,
 entitlement jsonb not null,redeemed_event_id uuid unique references events,
 revoked_at timestamptz,created_at timestamptz not null default now()
);
create table if not exists event_publications (
 event_id uuid primary key references events,owner_id uuid not null references accounts,
 source text not null check(source in ('trial','subscription','pass','legacy')),
 pass_id uuid unique references event_passes,entitlement jsonb not null,
 period_start timestamptz,period_end timestamptz,consumed_at timestamptz not null default now(),
 schedule_deadline timestamptz not null default now()+interval '1 year'
);
create index if not exists publications_account_cycle on event_publications(owner_id,source,consumed_at);
create index if not exists passes_available on event_passes(owner_id,redeemed_event_id,revoked_at);

-- Preserve existing local/staging grants; deleted events never return a consumed slot.
insert into event_publications(event_id,owner_id,source,entitlement,period_start,period_end,consumed_at)
select e.id,e.owner_id,case when e.entitlement->>'id'='trial' then 'trial' else 'subscription' end,
e.entitlement,s.period_start,s.period_end,greatest(e.created_at,s.period_start)
from events e join subscriptions s on s.account_id=e.owner_id
where e.status in ('published','archived','deleted') on conflict(event_id) do nothing;

alter table event_passes enable row level security;
alter table event_publications enable row level security;
do $$ begin
 if exists(select 1 from pg_roles where rolname='anon') then
  revoke all on event_passes,event_publications from anon;
 end if;
 if exists(select 1 from pg_roles where rolname='authenticated') then
  revoke all on event_passes,event_publications from authenticated;
 end if;
end $$;
