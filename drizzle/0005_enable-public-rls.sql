-- The application talks to Postgres directly as the table owner, not through
-- the Supabase Data API. Enable RLS on every public application table and
-- remove the browser-facing roles' access.
--
-- With RLS enabled and no policies, anon and authenticated get no rows even if
-- a future grant is accidentally added. The service_role and the postgres
-- owner are server-side roles and are intentionally left untouched.
--
-- The role checks keep this migration runnable on the embedded local PGlite
-- database, which does not have Supabase's anon and authenticated roles.

alter table public.activities enable row level security;
--> statement-breakpoint
alter table public.applications enable row level security;
--> statement-breakpoint
alter table public.auth_tokens enable row level security;
--> statement-breakpoint
alter table public.companies enable row level security;
--> statement-breakpoint
alter table public.email_interactions enable row level security;
--> statement-breakpoint
alter table public.rate_limits enable row level security;
--> statement-breakpoint
alter table public.settings enable row level security;
--> statement-breakpoint
alter table public.templates enable row level security;
--> statement-breakpoint
alter table public.users enable row level security;
--> statement-breakpoint

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all privileges on all tables in schema public from anon';
    execute 'revoke all privileges on all sequences in schema public from anon';
    execute 'revoke all privileges on all functions in schema public from anon';
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all privileges on all tables in schema public from authenticated';
    execute 'revoke all privileges on all sequences in schema public from authenticated';
    execute 'revoke all privileges on all functions in schema public from authenticated';
  end if;
end
$$;
--> statement-breakpoint

-- Prevent new tables, sequences, and functions created by the app role from
-- being exposed through the Data API by default.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'postgres')
     and exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated';
    execute 'alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated';
    execute 'alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated';
  end if;
end
$$;
