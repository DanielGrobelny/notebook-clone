create table public.visitor_provider_limits(visitor_id uuid primary key references public.visitor_sessions(id), window_started_at timestamptz not null default now(), request_count integer not null default 0);
alter table public.visitor_provider_limits enable row level security;
revoke all on public.visitor_provider_limits from anon,authenticated;
create or replace function public.claim_visitor_provider_call() returns table(allowed boolean,retry_after_seconds integer)
language plpgsql security definer set search_path=public as $$
declare v uuid:=public.current_visitor_id(); q public.visitor_provider_limits;
begin
 if v is null then return query select false,3600;return;end if;
 insert into public.visitor_provider_limits(visitor_id) values(v) on conflict do nothing;
 select * into q from public.visitor_provider_limits where visitor_id=v for update;
 if q.window_started_at<=now()-interval '1 hour' then
 update public.visitor_provider_limits set window_started_at=now(),request_count=1 where visitor_id=v;
 return query select true,0;
 elsif q.request_count<12 then
 update public.visitor_provider_limits set request_count=request_count+1 where visitor_id=v;
 return query select true,0;
 else return query select false,greatest(1,ceil(extract(epoch from (q.window_started_at+interval '1 hour'-now())))::integer);
 end if;
end;$$;
revoke all on function public.claim_visitor_provider_call() from public;
grant execute on function public.claim_visitor_provider_call() to anon;
