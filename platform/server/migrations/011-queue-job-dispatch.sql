alter table jobs add column if not exists dispatched_at timestamptz;
create index if not exists jobs_dispatchable
on jobs(status,available_at,dispatched_at,created_at)
where status='queued';
