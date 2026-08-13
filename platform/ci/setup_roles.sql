-- Continuum platform CI: pre-create the Supabase managed roles in the throwaway postgres 15
-- container, so the physician clinical migrations (which revoke from anon, authenticated and
-- service_role) apply cleanly. On the live project these roles already exist; here they do not,
-- so the CI harness creates them before applying clinical/db. NOLOGIN, no privileges granted here.
-- No em dashes or en dashes anywhere.

do $roles$
begin
  if not exists (select from pg_roles where rolname = 'anon')          then create role anon          nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'service_role')  then create role service_role  nologin; end if;
end
$roles$;
