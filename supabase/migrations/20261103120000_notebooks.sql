create extension if not exists pgcrypto;

create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  source_type text not null check (source_type in ('text', 'file', 'url')),
  storage_path text unique,
  created_at timestamptz not null default now()
);
create table public.source_chunks (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.sources(id) on delete cascade,
  position integer not null check (position >= 0), content text not null check (char_length(content) > 0),
  metadata jsonb not null default '{}'::jsonb, unique(source_id, position)
);
create table public.chats (
  id uuid primary key default gen_random_uuid(), notebook_id uuid not null references public.notebooks(id) on delete cascade,
  title text not null default 'Neuer Chat' check (char_length(trim(title)) between 1 and 160),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')), content text not null check (char_length(content) between 1 and 20000),
  citations jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);
create table public.artifacts (
  id uuid primary key default gen_random_uuid(), notebook_id uuid not null references public.notebooks(id) on delete cascade,
  kind text not null check (kind in ('note', 'summary', 'briefing')), title text not null check (char_length(trim(title)) between 1 and 160),
  content text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index sources_notebook_idx on public.sources(notebook_id);
create index chunks_source_idx on public.source_chunks(source_id);
create index chats_notebook_idx on public.chats(notebook_id);
create index messages_chat_idx on public.messages(chat_id);
create index artifacts_notebook_idx on public.artifacts(notebook_id);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker
set search_path = public as $fn$
begin new.updated_at = now(); return new; end;
$fn$;
create trigger notebooks_updated_at before update on public.notebooks for each row execute function public.set_updated_at();
create trigger chats_updated_at before update on public.chats for each row execute function public.set_updated_at();
create trigger artifacts_updated_at before update on public.artifacts for each row execute function public.set_updated_at();

alter table public.notebooks enable row level security;
alter table public.sources enable row level security;
alter table public.source_chunks enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.artifacts enable row level security;

create policy notebooks_owner on public.notebooks for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy sources_owner on public.sources for all using (exists (select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid())) with check (exists (select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid()));
create policy chunks_owner on public.source_chunks for all using (exists (select 1 from public.sources s join public.notebooks n on n.id = s.notebook_id where s.id = source_id and n.owner_id = auth.uid())) with check (exists (select 1 from public.sources s join public.notebooks n on n.id = s.notebook_id where s.id = source_id and n.owner_id = auth.uid()));
create policy chats_owner on public.chats for all using (exists (select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid())) with check (exists (select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid()));
create policy messages_owner on public.messages for all using (exists (select 1 from public.chats c join public.notebooks n on n.id = c.notebook_id where c.id = chat_id and n.owner_id = auth.uid())) with check (exists (select 1 from public.chats c join public.notebooks n on n.id = c.notebook_id where c.id = chat_id and n.owner_id = auth.uid()));
create policy artifacts_owner on public.artifacts for all using (exists (select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid())) with check (exists (select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid()));

insert into storage.buckets (id, name, public) values ('source-files', 'source-files', false) on conflict (id) do update set public = false;
create policy source_files_select on storage.objects for select using (bucket_id = 'source-files' and owner_id::text = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.notebooks n where n.owner_id = auth.uid() and n.id::text = (storage.foldername(name))[2]));
create policy source_files_insert on storage.objects for insert with check (bucket_id = 'source-files' and owner_id::text = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.notebooks n where n.owner_id = auth.uid() and n.id::text = (storage.foldername(name))[2]));
create policy source_files_update on storage.objects for update using (bucket_id = 'source-files' and owner_id::text = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.notebooks n where n.owner_id = auth.uid() and n.id::text = (storage.foldername(name))[2])) with check (bucket_id = 'source-files' and owner_id::text = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.notebooks n where n.owner_id = auth.uid() and n.id::text = (storage.foldername(name))[2]));
create policy source_files_delete on storage.objects for delete using (bucket_id = 'source-files' and owner_id::text = auth.uid()::text and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.notebooks n where n.owner_id = auth.uid() and n.id::text = (storage.foldername(name))[2]));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.notebooks, public.sources, public.source_chunks, public.chats, public.messages, public.artifacts to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
