-- Requests carry the opaque cookie token only through the server's scoped client.
create or replace function public.current_visitor_id() returns uuid
language sql stable security definer set search_path=public,extensions as $$
 select id from public.visitor_sessions
 where token_hash=encode(digest(coalesce(current_setting('request.headers',true)::jsonb->>'x-visitor-token',''),'sha256'),'hex')
 and expires_at>now();
$$;
revoke all on function public.current_visitor_id() from public;
grant execute on function public.current_visitor_id() to anon,authenticated,service_role;
alter table public.notebooks alter column visitor_id set default public.current_visitor_id();
alter table public.notebooks add constraint notebooks_single_owner check ((owner_id is null) <> (visitor_id is null));
grant select,insert,update,delete on public.notebooks,public.sources,public.source_chunks,public.chats,public.messages,public.artifacts to anon;
create policy visitor_notebooks on public.notebooks for all to anon using(visitor_id=public.current_visitor_id()) with check(visitor_id=public.current_visitor_id() and owner_id is null);
create policy visitor_sources on public.sources for all to anon using(exists(select 1 from public.notebooks n where n.id=notebook_id and n.visitor_id=public.current_visitor_id())) with check(exists(select 1 from public.notebooks n where n.id=notebook_id and n.visitor_id=public.current_visitor_id()));
create policy visitor_chunks on public.source_chunks for all to anon using(exists(select 1 from public.sources s where s.id=source_id)) with check(exists(select 1 from public.sources s where s.id=source_id));
create policy visitor_chats on public.chats for all to anon using(exists(select 1 from public.notebooks n where n.id=notebook_id and n.visitor_id=public.current_visitor_id())) with check(exists(select 1 from public.notebooks n where n.id=notebook_id and n.visitor_id=public.current_visitor_id()));
create policy visitor_messages on public.messages for all to anon using(exists(select 1 from public.chats c where c.id=chat_id)) with check(exists(select 1 from public.chats c where c.id=chat_id));
create policy visitor_artifacts on public.artifacts for all to anon using(exists(select 1 from public.notebooks n where n.id=notebook_id and n.visitor_id=public.current_visitor_id())) with check(exists(select 1 from public.notebooks n where n.id=notebook_id and n.visitor_id=public.current_visitor_id()));
grant select,insert,update,delete on storage.objects to anon;
create policy visitor_files on storage.objects for all to anon using(bucket_id='source-files' and (storage.foldername(name))[1]=public.current_visitor_id()::text and exists(select 1 from public.notebooks n where n.id::text=(storage.foldername(name))[2] and n.visitor_id=public.current_visitor_id())) with check(bucket_id='source-files' and (storage.foldername(name))[1]=public.current_visitor_id()::text and exists(select 1 from public.notebooks n where n.id::text=(storage.foldername(name))[2] and n.visitor_id=public.current_visitor_id()));
create or replace function public.match_source_chunks(p_notebook_id uuid, p_user_id uuid, p_source_ids uuid[], p_query_embedding vector(1536), p_match_count integer default 12) returns table (id uuid, source_id uuid, content text, page integer, section text, similarity real) language sql stable security invoker set search_path = public as $$ select c.id, c.source_id, c.content, (c.metadata->>'page')::integer, c.metadata->>'section', (1 - (c.embedding <=> p_query_embedding))::real from public.source_chunks c join public.sources s on s.id = c.source_id join public.notebooks n on n.id = s.notebook_id where n.id = p_notebook_id and ( (n.visitor_id = p_user_id and p_user_id = public.current_visitor_id()) or (n.owner_id = p_user_id and p_user_id = auth.uid()) ) and s.status = 'ready' and c.source_id = any(p_source_ids) and c.embedding is not null order by c.embedding <=> p_query_embedding limit greatest(1, least(p_match_count, 12)); $$;
grant execute on function public.match_source_chunks(uuid, uuid, uuid[], vector, integer) to anon;
