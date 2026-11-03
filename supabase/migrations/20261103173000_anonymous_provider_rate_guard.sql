-- Server-enforced spend guard for anonymous identities.  The fixed constants
-- intentionally live here (rather than request input): 12 provider calls / 60 min.
-- A demo reset deletes notebooks only; it cannot reset this quota. This constrains
-- one anonymous auth identity, not deliberate anonymous-identity rotation.
create table public.anonymous_provider_rate_limits (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);
alter table public.anonymous_provider_rate_limits enable row level security;

create or replace function public.claim_anonymous_provider_call()
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql security definer set search_path = public, auth as $fn$
declare
  quota public.anonymous_provider_rate_limits%rowtype;
  window_seconds constant integer := 3600;
  max_calls constant integer := 12;
  remaining integer;
begin
  if auth.uid() is null then
    return query select false, window_seconds;
    return;
  end if;
  -- Registered users preserve their existing normal flows without quota debit.
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'is_anonymous')::boolean, false) is not true then
    return query select true, 0;
    return;
  end if;

  insert into public.anonymous_provider_rate_limits(owner_id)
  values (auth.uid()) on conflict (owner_id) do nothing;
  select * into quota from public.anonymous_provider_rate_limits
  where owner_id = auth.uid() for update;

  if quota.window_started_at + make_interval(secs => window_seconds) <= now() then
    update public.anonymous_provider_rate_limits
      set window_started_at = now(), request_count = 1 where owner_id = auth.uid();
    return query select true, 0;
  elsif quota.request_count < max_calls then
    update public.anonymous_provider_rate_limits
      set request_count = request_count + 1 where owner_id = auth.uid();
    return query select true, 0;
  end if;

  remaining := greatest(1, ceil(extract(epoch from quota.window_started_at + make_interval(secs => window_seconds) - now()))::integer);
  return query select false, remaining;
end;
$fn$;
grant execute on function public.claim_anonymous_provider_call() to authenticated;
