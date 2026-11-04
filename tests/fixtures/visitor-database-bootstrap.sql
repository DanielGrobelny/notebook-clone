-- Only the disposable local integration stack uses this platform bootstrap.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login noinherit;
grant anon,authenticated,service_role to authenticator;
create role supabase_storage_admin login superuser;
create schema auth;
create schema extensions;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant all on schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
