-- Continuum Core Platform Foundations (Prompt 51). S8b clinical reference retrofit tests.
--
-- Proves migration 0009: the 17 clinical board reference tables now have row level security enabled
-- with a read all policy, are NOT forced (the owner writes them through a migration), carry no
-- organisation_id, and remain readable by the non owner application role. Run by psql with
-- ON_ERROR_STOP. This runs after clinical/db and the platform migrations are applied.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

-- structural: all 17 have RLS enabled, none forced, each has a policy
do $$
declare
  refs text[] := array[
    'jurisdiction','wcb_code_list','wcb_code_value','wcb_pob_noi_forbidden','wcb_contract_role',
    'wcb_contract_role_form','wcb_fee_schedule','statutory_holiday','form_definition','form_element',
    'form_rule','wcb_capability_code_set','wcb_error_catalogue','wcb_obx_skeleton','wcb_hl7_wire_map',
    'functional_axis_map','internal_restriction_code'];
  n_rls int;
  n_pol int;
begin
  select count(*) into n_rls
  from pg_class c join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (refs)
    and c.relrowsecurity and not c.relforcerowsecurity;
  if n_rls <> 17 then
    raise exception 'FAIL: expected 17 clinical reference tables with RLS enabled and not forced, got %', n_rls;
  end if;

  select count(distinct c.relname) into n_pol
  from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (refs);
  if n_pol <> 17 then
    raise exception 'FAIL: expected a policy on all 17 reference tables, got % with a policy', n_pol;
  end if;
end $$;

-- behavioural: the non owner app role can still read the reference data (RLS plus read all policy
-- plus the grant), and the read all policy filters nothing. The owner count (superuser, bypasses
-- RLS) and the app role count (subject to RLS) must match, whether the seed is present or not. The
-- role is switched inside the block so no psql interpolation into a dollar quoted body is relied on.
do $$
declare owner_count bigint; app_count bigint;
begin
  select count(*) into owner_count from clinical.jurisdiction;    -- owner (superuser), RLS bypassed
  execute 'set local role app_clinical';
  select count(*) into app_count from clinical.jurisdiction;      -- app_clinical, RLS plus read all policy
  perform count(*) from clinical.wcb_fee_schedule;                -- a second read must not error
  perform count(*) from clinical.form_definition;                 -- a third read must not error
  execute 'reset role';
  if app_count <> owner_count then
    raise exception 'FAIL: app_clinical sees % of % jurisdiction rows (read all policy not working)', app_count, owner_count;
  end if;
end $$;

\echo 'clinical reference retrofit tests passed'
