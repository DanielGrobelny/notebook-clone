-- Materialization prevents approximate IVFFlat probing from losing a small
-- authorized subset. Exact distance ranking, without a similarity threshold.
-- Round-robin source ranks reserve coverage for every selected ready source.
create or replace function public.match_source_chunks(
  p_notebook_id uuid, p_user_id uuid, p_source_ids uuid[],
  p_query_embedding vector(1536), p_match_count integer default 12
) returns table (id uuid, source_id uuid, content text, page integer, section text, similarity real)
language sql stable security invoker set search_path = public as $$
  with scoped as materialized (
    select c.id, c.source_id, c.content, c.metadata, c.embedding
    from public.source_chunks c
    join public.sources s on s.id = c.source_id
    join public.notebooks n on n.id = s.notebook_id
    where n.id = p_notebook_id and ((n.visitor_id = p_user_id and p_user_id = public.current_visitor_id()) or (n.owner_id = p_user_id and p_user_id = auth.uid()))
      and s.status = 'ready' and c.source_id = any(p_source_ids)
      and c.embedding is not null and btrim(c.content) <> ''
  ), ranked as (
    select *, embedding <=> p_query_embedding as distance,
      row_number() over (partition by source_id order by embedding <=> p_query_embedding, id) as source_rank
    from scoped
  )
  select id, source_id, content, (metadata->>'page')::integer,
    metadata->>'section', (1 - distance)::real
  from ranked
  order by source_rank, distance, source_id, id
  limit greatest(1, least(p_match_count, 12));
$$;
