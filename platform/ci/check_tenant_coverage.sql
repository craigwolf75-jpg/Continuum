-- Continuum Core Platform Foundations (Prompt 51). CI tenant coverage check.
--
-- Section 3.4 item 4 and Section 12.4: enumerate the enforced platform schemas and fail the build
-- if any table is not correctly isolated. Run by psql with ON_ERROR_STOP so a RAISE fails the job.
--
-- Enforced schemas grow one sub-build at a time. S1 enforced tenancy; S3 adds consent. The
-- clinical, employer and audit schemas are in scope (Decision 2) but enforced in the S8 live
-- retrofit; the hub, site, demo and worker schemas are excluded permanently by schema boundary;
-- the platform metadata schema holds no identifiable data and is not enforced.
--
-- Three recognised table shapes, none of which is an allow-list entry (the mpi.person allow-list
-- stays at exactly one and is checked separately by the workflow):
--   tenant table         organisation_id column, row level security, FORCE, and a policy.
--   tenant root          tenancy.organisation, isolated by its own id: RLS, FORCE, policy, no
--                        organisation_id column.
--   shared reference     Section 3.7 wording and code lists, read by every tenant, written by no
--                        tenant: RLS and a policy, no organisation_id and no FORCE, because the
--                        owner writes it through a migration and FORCE would block that write.
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
  enforced   text[] := array['tenancy', 'consent', 'events', 'config'];
  -- S8b brought the clinical board reference tables under the shared reference pattern (row level
  -- security plus a read all policy, no organisation_id, no FORCE). The rest of the clinical schema
  -- (tenant owned and immutable tables) is enforced as those increments land.
  clinical_shared text[] := array[
    'clinical.jurisdiction', 'clinical.wcb_code_list', 'clinical.wcb_code_value',
    'clinical.wcb_pob_noi_forbidden', 'clinical.wcb_contract_role', 'clinical.wcb_contract_role_form',
    'clinical.wcb_fee_schedule', 'clinical.statutory_holiday', 'clinical.form_definition',
    'clinical.form_element', 'clinical.form_rule', 'clinical.wcb_capability_code_set',
    'clinical.wcb_error_catalogue', 'clinical.wcb_obx_skeleton', 'clinical.wcb_hl7_wire_map',
    'clinical.functional_axis_map', 'clinical.internal_restriction_code'];
  -- S8c brought the mutable tenant owned clinical tables under tenant isolation (organisation_id,
  -- RLS, FORCE, policy). practitioner is not here: E2 needs the absent mpi.person and is blocked.
  -- The immutable clinical tables and the live audit tables are later increments.
  clinical_tenant text[] := array[
    'clinical.worker', 'clinical.wcb_case', 'clinical.wcb_report', 'clinical.wcb_report_field',
    'clinical.wcb_submission', 'clinical.measurement_draft', 'clinical.clinic',
    'clinical.clinic_batch_schedule', 'clinical.consent'];
  -- S8d brought the immutable clinical tables under tenant isolation (organisation_id, RLS, FORCE,
  -- policy); they remain insert only via the migration 011 revoke plus the blocking trigger.
  clinical_immutable text[] := array[
    'clinical.functional_measurement', 'clinical.functional_axis_value', 'clinical.functional_grasping',
    'clinical.functional_reaching', 'clinical.functional_environment', 'clinical.functional_clinical_context',
    'clinical.internal_restriction', 'clinical.legacy_restriction_label', 'clinical.band_derivation_audit'];
  -- specific tables in schemas that also hold out of scope tables. audit.event and
  -- audit.ai_generation (the physician audit tables) were retrofitted in S8e.
  enforced_tables text[] := array['audit.record', 'employer.disclosure_release', 'audit.event', 'audit.ai_generation']
    || clinical_shared || clinical_tenant || clinical_immutable;
  shared_ref text[] := array['consent.text_version', 'config.definition', 'config.feature_flag'] || clinical_shared;
  is_shared  boolean;
  is_root    boolean;
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name, c.oid as oid
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and (n.nspname = any (enforced)
           or (n.nspname || '.' || c.relname) = any (enforced_tables))
  loop
    is_shared := (r.schema_name || '.' || r.table_name) = any (shared_ref);
    is_root   := (r.schema_name = 'tenancy' and r.table_name = 'organisation');

    select c.relrowsecurity, c.relforcerowsecurity into v_rls, v_force from pg_class c where c.oid = r.oid;
    select count(*) into v_policies from pg_policy p where p.polrelid = r.oid;
    select exists (
      select 1 from pg_attribute a
      where a.attrelid = r.oid and a.attname = 'organisation_id' and a.attnum > 0 and not a.attisdropped
    ) into v_tenant;

    if not v_rls      then v_problems := v_problems || format('  %s.%s: row level security not enabled', r.schema_name, r.table_name) || chr(10); end if;
    if v_policies = 0 then v_problems := v_problems || format('  %s.%s: no policy attached', r.schema_name, r.table_name) || chr(10); end if;

    if is_shared then
      null;  -- shared reference: RLS and a policy are enough; no organisation_id, no FORCE
    elsif is_root then
      if not v_force then v_problems := v_problems || format('  %s.%s: FORCE row level security not set', r.schema_name, r.table_name) || chr(10); end if;
    else
      if not v_tenant then v_problems := v_problems || format('  %s.%s: no organisation_id column', r.schema_name, r.table_name) || chr(10); end if;
      if not v_force  then v_problems := v_problems || format('  %s.%s: FORCE row level security not set', r.schema_name, r.table_name) || chr(10); end if;
    end if;
  end loop;

  if v_problems <> '' then
    raise exception 'tenant coverage violations found:%', chr(10) || v_problems;
  end if;

  raise notice 'tenant coverage check passed for enforced schemas: %', array_to_string(enforced, ', ');
end
$check$;
