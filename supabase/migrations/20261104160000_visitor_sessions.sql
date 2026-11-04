create table if not exists public.visitor_sessions (id uuid primary key default gen_random_uuid(), token_hash text not null unique, expires_at timestamptz not null, created_at timestamptz not null default now(), last_seen_at timestamptz not null default now());
create index if not exists visitor_sessions_expires_idx on public.visitor_sessions(expires_at);
alter table public.visitor_sessions enable row level security;
revoke all on public.visitor_sessions from anon, authenticated;

grant all on public.visitor_sessions to service_role;
