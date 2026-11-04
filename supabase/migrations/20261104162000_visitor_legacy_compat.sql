-- Keep the historical auth.users FK; only visitor-owned rows have a null owner_id.
alter table public.notebooks alter column owner_id drop not null;
-- Retain auth.uid() default for old previews; it evaluates to NULL for visitors.
