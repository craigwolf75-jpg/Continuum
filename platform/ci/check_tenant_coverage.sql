-- Continuum Core Platform Foundations (Prompt 51). CI tenant coverage check.
--
-- Section 3.4 item 4 and Section 12.4: enumerate the enforced platform schemas and fail the
-- build if any table lacks a tenant column, row level security, FORCE, or a policy. Run by psql
-- with ON_ERROR_STOP so a RAISE fails the job.
--
-- Enforced schemas grow one sub-build at a time. S1 enforces tenancy. The clinical, employer and
-- audit schemas are in scope (Decision 2) but their enforcement lands in the S8 live retrofit;
-- the hub, site, demo and worker schemas are excluded permanently by schema boundary. The
-- platform metadata schema holds no identifiable data and is not enforced.
--
-- The tenant root tenancy.organisation is isolated by its own id and is recognised here as
-- compliant without an organisation_id column. That is structural, not an allow-list entry: the
-- single allow-list entry (mpi.person) is asserted separately by the workflow.
--
-- No em dashes or en dashes anywhere.

do $check$
declare
  r          record;
  v_tenant   boolean;
  v_rls      boolean;
  v_force    boolean;
  v_policies int;
  v_problems text := '';
  enforced   text[] := array['tenancy'];   -- S1. Extend as each schema is brought into compliance.
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name, c.oid as oid
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and n.nspname = any (enforced)
  loop
    select exists (
      select 1 from pg_attribute a
      where a.attrelid = r.oid and a.attname = 'organisation_id'
        and a.attnum > 0 and not a.attisdropped
    ) into v_tenant;

    -- the tenant root is isolated by id, so it is compliant without organisation_id
    if not v_tenant and not (r.schema_name = 'tenancy' and r.table_name = 'organisation') then
      v_problems := v_problems || format('  %s.%s: no organisation_id column', r.schema_name, r.table_name) || chr(10);
    end if;

    select c.relrowsecurity, c.relforcerowsecurity
      into v_rls, v_force
      from pg_class c where c.oid = r.oid;
    if not v_rls   then v_problems := v_problems || format('  %s.%s: row level security not enabled', r.schema_name, r.table_name) || chr(10); end if;
    if not v_force then v_problems := v_problems || format('  %s.%s: FORCE row level security not set', r.schema_name, r.table_name) || chr(10); end if;

    select count(*) into v_policies from pg_policy p where p.polrelid = r.oid;
    if v_policies = 0 then v_problems := v_problems || format('  %s.%s: no policy attached', r.schema_name, r.table_name) || chr(10); end if;
  end loop;

  if v_problems <> '' then
    raise exception 'tenant coverage violations found:%', chr(10) || v_problems;
  end if;

  raise notice 'tenant coverage check passed for enforced schemas: %', array_to_string(enforced, ', ');
end
$check$;
