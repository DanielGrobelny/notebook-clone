alter table public.artifacts add column if not exists source_refs jsonb not null default '[]'::jsonb;
alter table public.artifacts add column if not exists generation_status text not null default 'ready';
alter table public.artifacts drop constraint if exists artifacts_generation_status_check;
alter table public.artifacts add constraint artifacts_generation_status_check check (generation_status in ('processing','ready','failed','stale'));
create index if not exists artifacts_notebook_created_idx on public.artifacts(notebook_id, created_at desc);
