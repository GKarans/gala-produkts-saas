alter table media add column if not exists favorite boolean not null default false;
alter table media add column if not exists hidden boolean not null default false;
alter table events add column if not exists gallery_cover_id uuid;
create index if not exists media_gallery_cursor
  on media(event_id, status, hidden, created_at desc, id desc);
