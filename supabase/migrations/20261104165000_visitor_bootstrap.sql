create function public.ensure_visitor_notebook() returns uuid language plpgsql security invoker set search_path=public as $$
declare v uuid:=public.current_visitor_id(); result uuid;
begin
 if v is null then raise exception 'visitor_required';end if;
 perform pg_advisory_xact_lock(hashtextextended(v::text,0));
 select id into result from public.notebooks where visitor_id=v order by created_at limit 1;
 if result is null then insert into public.notebooks(title,visitor_id) values('Mein Notebook',v) returning id into result;end if;
 return result;
end;$$;
revoke all on function public.ensure_visitor_notebook() from public;
grant execute on function public.ensure_visitor_notebook() to anon;
