alter table accounts add column if not exists storage_prefix text;
create unique index if not exists accounts_storage_prefix_unique
 on accounts(storage_prefix) where storage_prefix is not null;

alter table media add column if not exists captured_at timestamptz;
update media set captured_at=created_at where captured_at is null;
alter table media alter column captured_at set default now();
alter table media alter column captured_at set not null;
