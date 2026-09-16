-- Prompt 47 clinic_ops apply-path proofs.
--
-- After clinical/db and platform/db 0017: clinic_ops tables carry organisation_id,
-- RLS FORCE, and a policy. access_mode.clinical_disabled cannot be true.
-- unique billing_number exists when the practitioner table was empty-safe.
-- membership is unique on (practitioner_id, location_id). override_policy exists
-- on config.definition. Run by psql with ON_ERROR_STOP.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
\set regT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
\set locT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'
\set locU 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'
\set clinicT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5'
\set clinicU 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'
\set pracT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'

-- 1. clinic_ops tenant tables: organisation_id, RLS enabled and FORCEd, a policy
do $$
declare
  tables text[] := array[
    'onboarding_run','onboarding_step','entitlement','access_mode','break_glass',
    'diagnostic_view','metric_event','membership','permission_grant','practitioner_credential'];
  n_col int; n_force int; n_pol int;
begin
  select count(*) into n_col
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinic_ops' and c.relname = any (tables)
    and a.attname = 'organisation_id' and a.attnum > 0 and not a.attisdropped;
  if n_col <> 10 then raise exception 'FAIL: expected organisation_id on 10 clinic_ops tables, got %', n_col; end if;

  select count(*) into n_force
  from pg_class c join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinic_ops' and c.relname = any (tables) and c.relrowsecurity and c.relforcerowsecurity;
  if n_force <> 10 then raise exception 'FAIL: expected RLS FORCE on 10 clinic_ops tables, got %', n_force; end if;

  select count(distinct c.relname) into n_pol
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinic_ops' and c.relname = any (tables);
  if n_pol <> 10 then raise exception 'FAIL: expected a policy on 10 clinic_ops tables, got %', n_pol; end if;
end $$;

-- 2. override_policy column on config.definition
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'config' and table_name = 'definition' and column_name = 'override_policy'
  ) then
    raise exception 'FAIL: config.definition.override_policy is missing';
  end if;
end $$;

-- 3. unique billing_number index exists (table is empty-safe in this harness)
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'clinical' and c.relname = 'ux_practitioner_billing_number' and c.relkind = 'i'
  ) then
    raise exception 'FAIL: ux_practitioner_billing_number is missing';
  end if;
end $$;

grant insert on tenancy.organisation, tenancy.region, tenancy.location to app_clinical;
grant insert on clinical.practitioner to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgT', false);

insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgT', 'Org T', 'Org T', 'AB', 'active');
insert into tenancy.region (id, organisation_id, name, status)
  values (:'regT', :'orgT', 'Region T', 'active');
insert into tenancy.location (id, organisation_id, region_id, name, jurisdiction_code, timezone, status)
  values (:'locT', :'orgT', :'regT', 'Location T', 'AB', 'America/Edmonton', 'active');
insert into tenancy.location (id, organisation_id, region_id, name, jurisdiction_code, timezone, status)
  values (:'locU', :'orgT', :'regT', 'Location U', 'AB', 'America/Edmonton', 'active');

insert into clinical.clinic (id, name, organisation_id, location_id)
  values (:'clinicT', 'Clinic T', :'orgT', :'locT');
insert into clinical.clinic (id, name, organisation_id, location_id)
  values (:'clinicU', 'Clinic U', :'orgT', :'locU');

insert into clinical.practitioner (id, clinic_id, billing_number, family_name, given_name, role_code)
  values (:'pracT', :'clinicT', 'BN-47-T', 'Test', 'Pat', 'GP');

-- 4. unique billing_number: a second person with the same billing number is refused
do $$
begin
  begin
    insert into clinical.practitioner (clinic_id, billing_number, family_name, given_name, role_code)
      values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'BN-47-T', 'Other', 'Sam', 'GP');
  exception when unique_violation then
    return;
  end;
  raise exception 'FAIL: unique billing_number allowed a duplicate';
end $$;

-- 5. access_mode.clinical_disabled cannot be true
do $$
begin
  begin
    insert into clinic_ops.access_mode (organisation_id, mode, reason, clinical_disabled)
      values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'full', 'none', true);
  exception when check_violation then
    return;
  end;
  raise exception 'FAIL: access_mode.clinical_disabled accepted true';
end $$;

insert into clinic_ops.access_mode (organisation_id, mode, reason)
  values (:'orgT', 'full', 'none');

-- 6. membership unique (practitioner_id, location_id)
insert into clinic_ops.membership (
  organisation_id, location_id, clinic_id, practitioner_id,
  contract_identifier, practitioner_role, status
) values (
  :'orgT', :'locT', :'clinicT', :'pracT',
  '000001', 'GP', 'active'
);

do $$
begin
  begin
    insert into clinic_ops.membership (
      organisation_id, location_id, practitioner_id, practitioner_role, status
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
      'GP', 'active'
    );
  exception when unique_violation then
    return;
  end;
  raise exception 'FAIL: membership unique (practitioner, location) allowed a duplicate';
end $$;

insert into clinic_ops.membership (
  organisation_id, location_id, clinic_id, practitioner_id,
  contract_identifier, practitioner_role, status
) values (
  :'orgT', :'locU', :'clinicU', :'pracT',
  '000004', 'OR', 'active'
);

reset role;

\echo 'prompt47 clinic_ops tests passed'
