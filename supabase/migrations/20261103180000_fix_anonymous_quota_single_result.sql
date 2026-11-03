-- Each claim must return exactly one decision. Without these returns, successful
-- calls also emitted a following denial row, which made concurrent clients see
-- contradictory quota outcomes.
create or replace function public.claim_anonymous_provider_call()
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql security definer set search_path = public, auth as $fn$
declare
  quota public.anonymous_provider_rate_limits%rowtype;
  window_seconds constant integer := 3600;
  max_calls constant integer := 12;
  remaining integer;
begin
  if auth.uid() is null then return query select false, window_seconds; return; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, (auth.jwt() -> 'app_metadata' ->> 'is_anonymous')::boolean, false) is not true then
    return query select true, 0; return;
  end if;
  insert into public.anonymous_provider_rate_limits(owner_id) values (auth.uid()) on conflict (owner_id) do nothing;
  select * into quota from public.anonymous_provider_rate_limits where owner_id = auth.uid() for update;
  if quota.window_started_at + make_interval(secs => window_seconds) <= now() then
    update public.anonymous_provider_rate_limits set window_started_at = now(), request_count = 1 where owner_id = auth.uid();
    return query select true, 0; return;
  elsif quota.request_count < max_calls then
    update public.anonymous_provider_rate_limits set request_count = request_count + 1 where owner_id = auth.uid();
    return query select true, 0; return;
  end if;
  remaining := greatest(1, ceil(extract(epoch from quota.window_started_at + make_interval(secs => window_seconds) - now()))::integer);
  return query select false, remaining;
end;
$fn$;
