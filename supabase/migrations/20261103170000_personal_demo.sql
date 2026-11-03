alter table public.notebooks add column if not exists is_demo boolean not null default false;
create index if not exists notebooks_owner_demo_idx on public.notebooks(owner_id, is_demo);
