alter table public.sources add column if not exists status text not null default 'ready' check (status in ('processing','ready','error'));
alter table public.sources add column if not exists content_hash text;
alter table public.sources add column if not exists byte_size integer;
alter table public.sources add column if not exists page_count integer;
create unique index if not exists sources_notebook_content_hash_unique on public.sources(notebook_id, content_hash) where content_hash is not null;
