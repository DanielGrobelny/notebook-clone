create extension if not exists vector;
alter table public.source_chunks add column if not exists embedding vector(1536);
create index if not exists source_chunks_embedding_idx on public.source_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create or replace function public.match_source_chunks(p_notebook_id uuid, p_user_id uuid, p_source_ids uuid[], p_query_embedding vector(1536), p_match_count integer default 12) returns table (id uuid, source_id uuid, content text, page integer, section text, similarity real) language sql stable security invoker set search_path = public as $$ select c.id, c.source_id, c.content, (c.metadata->>'page')::integer, c.metadata->>'section', (1 - (c.embedding <=> p_query_embedding))::real from public.source_chunks c join public.sources s on s.id = c.source_id join public.notebooks n on n.id = s.notebook_id where n.id = p_notebook_id and n.owner_id = p_user_id and s.status = 'ready' and c.source_id = any(p_source_ids) and c.embedding is not null order by c.embedding <=> p_query_embedding limit greatest(1, least(p_match_count, 12)); $$;
grant execute on function public.match_source_chunks(uuid, uuid, uuid[], vector, integer) to authenticated;
-- Existing chunks predate embeddings and cannot be searched safely. Keep them out of
-- retrieval and surface a deterministic re-import state instead of empty answers.
update public.sources s
set status = 'error'
where s.status = 'ready'
  and exists (select 1 from public.source_chunks c where c.source_id = s.id)
  and not exists (select 1 from public.source_chunks c where c.source_id = s.id and c.embedding is not null);
