-- Continuum Core Platform Foundations (Prompt 51). S8d immutable clinical retrofit tests.
--
-- Proves migration 0011: the 9 immutable clinical tables now carry organisation_id, have row level
-- security enabled and FORCEd, and an isolation policy, and that the retrofit preserved their
-- immutability (still insert only, by grant and by the migration 011 trigger). Isolation and
-- immutability are exercised on clinical.band_derivation_audit, which has no outgoing foreign keys.
-- Run by psql with ON_ERROR_STOP, after clinical/db and the platform migrations are applied.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgR 'aaaa1111-2222-3333-4444-555566667777'
\set orgS 'bbbb1111-2222-3333-4444-555566667777'

-- structural: all 9 immutable tables have organisation_id, RLS enabled and forced, and a policy
do $$
declare
  tables text[] := array[
    'functional_measurement','functional_axis_value','functional_grasping','functional_reaching',
    'functional_environment','functional_clinical_context','internal_restriction',
    'legacy_restriction_label','band_derivation_audit'];
  n_col int; n_force int; n_pol int;
begin
  select count(*) into n_col
  from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (tables)
    and a.attname = 'organisation_id' and a.attnum > 0 and not a.attisdropped;
  if n_col <> 9 then raise exception 'FAIL: expected organisation_id on 9 immutable tables, got %', n_col; end if;

  select count(*) into n_force
  from pg_class c join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (tables) and c.relrowsecurity and c.relforcerowsecurity;
  if n_force <> 9 then raise exception 'FAIL: expected RLS enabled and forced on 9 immutable tables, got %', n_force; end if;

  select count(distinct c.relname) into n_pol
  from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (tables);
  if n_pol <> 9 then raise exception 'FAIL: expected a policy on 9 immutable tables, got %', n_pol; end if;
end $$;

grant insert on tenancy.organisation to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgR', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgR', 'Org R', 'Org R', 'AB', 'active') on conflict do nothing;
insert into clinical.band_derivation_audit (organisation_id, measurement_id, axis, rounded_down, below_lowest_band, derived_by)
  values (:'orgR', gen_random_uuid(), 'sitting', false, false, gen_random_uuid());

select set_config('app.organisation_id', :'orgS', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgS', 'Org S', 'Org S', 'AB', 'active') on conflict do nothing;
insert into clinical.band_derivation_audit (organisation_id, measurement_id, axis, rounded_down, below_lowest_band, derived_by)
  values (:'orgS', gen_random_uuid(), 'standing', false, false, gen_random_uuid());

-- isolation: org R sees only its own band audit row
select set_config('app.organisation_id', :'orgR', false);
do $$
declare n int;
begin
  select count(*) into n from clinical.band_derivation_audit;
  if n <> 1 then raise exception 'FAIL: org R should see exactly 1 band audit row, saw %', n; end if;
end $$;

-- WITH CHECK: a cross tenant insert into an immutable table is rejected
do $$
begin
  begin
    insert into clinical.band_derivation_audit (organisation_id, measurement_id, axis, rounded_down, below_lowest_band, derived_by)
      values ('bbbb1111-2222-3333-4444-555566667777', gen_random_uuid(), 'sitting', false, false, gen_random_uuid());
  exception when others then return;  -- expected: WITH CHECK blocked it
  end;
  raise exception 'FAIL: a cross tenant insert into an immutable table was allowed';
end $$;

-- immutability preserved (grant wall): app_clinical holds no update
do $$
begin
  begin
    update clinical.band_derivation_audit set axis = 'standing';
  exception when others then return;  -- expected: no update grant
  end;
  raise exception 'FAIL: app_clinical updated an immutable table';
end $$;

reset role;

-- immutability preserved (trigger wall): the owner update is still rejected after the retrofit
do $$
begin
  begin
    update clinical.band_derivation_audit set axis = 'standing'
      where organisation_id = 'aaaa1111-2222-3333-4444-555566667777';
  exception when others then return;  -- expected: the migration 011 blocking trigger
  end;
  raise exception 'FAIL: the owner updated an immutable band audit row (trigger lost in the retrofit)';
end $$;

\echo 'clinical immutable retrofit tests passed'
