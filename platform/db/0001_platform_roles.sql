-- Continuum Core Platform Foundations (Prompt 51). Migration 0001: the platform roles.
--
-- Section 4.4 least privilege. These are the non-owner application roles. Application code
-- connects ONLY as one of these, never as the owner or a superuser (guardrail b, Prompt 50a).
-- They are created NOLOGIN here: enabling login and wiring the connection string or pooler onto
-- them is an infrastructure step that is Gary's, not a code change (standing rule: Claude hands
-- Gary the SQL and the env, and never changes the Supabase project). Grants per schema are
-- attached in the migration that creates each schema, so a role never holds a grant on a schema
-- that does not yet exist.
--
-- Idempotent. No em dashes or en dashes anywhere.

do $roles$
begin
  if not exists (select from pg_roles where rolname = 'app_clinical') then create role app_clinical nologin; end if;
  if not exists (select from pg_roles where rolname = 'app_employer') then create role app_employer nologin; end if;
  if not exists (select from pg_roles where rolname = 'app_release')  then create role app_release  nologin; end if;
  if not exists (select from pg_roles where rolname = 'app_readonly') then create role app_readonly nologin; end if;
  if not exists (select from pg_roles where rolname = 'migrator')     then create role migrator     nologin; end if;
end
$roles$;

insert into platform.schema_migration (version) values ('0001')
  on conflict (version) do nothing;
