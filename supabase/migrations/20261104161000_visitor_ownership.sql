alter table public.notebooks add column if not exists visitor_id uuid references public.visitor_sessions(id) on delete cascade;
create index if not exists notebooks_visitor_idx on public.notebooks(visitor_id);
-- Visitor rows are intentionally additive. Existing auth-owned rows retain owner_id and are not reassigned.
