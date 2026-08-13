-- Continuum Core Platform Foundations (Prompt 51). Migration 0009: S8b, retrofit the clinical
-- reference tables to the shared reference pattern.
--
-- The first increment of the S8 live retrofit, and the safe one. Under the Supabase stack
-- decision, the physician clinical schema is brought under Prompt 51 tenancy. The board reference
-- data (jurisdiction records, code lists, form definitions, fee schedules, holidays, the axis map,
-- the error catalogue, the OBX skeleton, the wire map, the capability code set, the restriction
-- code list) is identical for every tenant and is written only by a migration, so per Section 3.7
-- it is the SHARED reference category: row level security enabled with a read all policy, no
-- organisation_id, and NOT forced (the owner writes it through a migration and FORCE would block
-- that write). No tenant data is touched, no row is backfilled, no immutable table is altered.
--
-- These tables carry no clinic or tenant column today and are read by every role. Enabling row
-- level security without a policy would deny all reads, so the read all policy is added in the
-- same statement. The physician engine reads them through a service role connection that bypasses
-- row level security; the policy is what lets the non owner application role read them once the
-- connection is switched.
--
-- Idempotent, ALTER never drop. Hand applied by Gary after clinical/db 001 to 017 and platform/db
-- 0000 to 0008. No em dashes or en dashes anywhere.

do $retrofit$
declare
  t    text;
  refs text[] := array[
    'jurisdiction',
    'wcb_code_list',
    'wcb_code_value',
    'wcb_pob_noi_forbidden',
    'wcb_contract_role',
    'wcb_contract_role_form',
    'wcb_fee_schedule',
    'statutory_holiday',
    'form_definition',
    'form_element',
    'form_rule',
    'wcb_capability_code_set',
    'wcb_error_catalogue',
    'wcb_obx_skeleton',
    'wcb_hl7_wire_map',
    'functional_axis_map',
    'internal_restriction_code'
  ];
begin
  foreach t in array refs loop
    if to_regclass('clinical.' || t) is null then
      raise notice 'skip: clinical.% is absent', t;
      continue;
    end if;
    execute format('alter table clinical.%I enable row level security', t);
    execute format('drop policy if exists %I on clinical.%I', t || '_shared_read', t);
    execute format('create policy %I on clinical.%I for select using (true)', t || '_shared_read', t);
    execute format('grant usage on schema clinical to app_clinical, app_employer, app_release, app_readonly');
    execute format('grant select on clinical.%I to app_clinical, app_employer, app_release, app_readonly', t);
    raise notice 'retrofit shared reference: clinical.%', t;
  end loop;
end
$retrofit$;

insert into platform.schema_migration (version) values ('0009')
  on conflict (version) do nothing;
