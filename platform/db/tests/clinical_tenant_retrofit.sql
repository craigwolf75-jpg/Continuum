-- Continuum Core Platform Foundations (Prompt 51). S8c clinical tenant retrofit tests.
--
-- Proves migration 0010: the 9 mutable tenant owned clinical tables now carry organisation_id, have
-- row level security enabled and FORCEd, and an isolation policy, and that isolation actually holds
-- on a representative table (clinical.worker, which has no outgoing foreign keys). Run by psql with
-- ON_ERROR_STOP, after clinical/db and the platform migrations are applied.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgP '99999999-9999-9999-9999-9999999999a1'
\set orgQ '99999999-9999-9999-9999-9999999999b2'

-- structural: all 9 have organisation_id, RLS enabled and forced, and a policy
do $$
declare
  tables text[] := array[
    'worker','wcb_case','wcb_report','wcb_report_field','wcb_submission',
    'measurement_draft','clinic','clinic_batch_schedule','consent'];
  n_col int; n_force int; n_pol int;
begin
  select count(*) into n_col
  from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (tables)
    and a.attname = 'organisation_id' and a.attnum > 0 and not a.attisdropped;
  if n_col <> 9 then raise exception 'FAIL: expected organisation_id on 9 tenant tables, got %', n_col; end if;

  select count(*) into n_force
  from pg_class c join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (tables) and c.relrowsecurity and c.relforcerowsecurity;
  if n_force <> 9 then raise exception 'FAIL: expected RLS enabled and forced on 9 tenant tables, got %', n_force; end if;

  select count(distinct c.relname) into n_pol
  from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'clinical' and c.relname = any (tables);
  if n_pol <> 9 then raise exception 'FAIL: expected a policy on 9 tenant tables, got %', n_pol; end if;
end $$;

-- behavioural isolation on clinical.worker (no outgoing foreign keys)
grant insert on tenancy.organisation to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgP', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgP', 'Org P', 'Org P', 'AB', 'active') on conflict do nothing;
insert into clinical.worker (organisation_id, family_name, given_name) values (:'orgP', 'Alpha', 'Ann');

select set_config('app.organisation_id', :'orgQ', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgQ', 'Org Q', 'Org Q', 'AB', 'active') on conflict do nothing;
insert into clinical.worker (organisation_id, family_name, given_name) values (:'orgQ', 'Beta', 'Bob');

-- org P sees only its own worker
select set_config('app.organisation_id', :'orgP', false);
do $$
declare n int;
begin
  select count(*) into n from clinical.worker;
  if n <> 1 then raise exception 'FAIL: org P should see exactly 1 worker, saw %', n; end if;
end $$;

-- WITH CHECK: cannot write a worker for another org under org P context
do $$
begin
  begin
    insert into clinical.worker (organisation_id, family_name, given_name)
      values ('99999999-9999-9999-9999-9999999999b2', 'Cross', 'Tenant');
  exception when others then return;  -- expected: WITH CHECK blocked it
  end;
  raise exception 'FAIL: a cross tenant worker insert was allowed';
end $$;

-- fail closed: a blank tenant context refuses the read
select set_config('app.organisation_id', '', false);
do $$
begin
  begin
    perform count(*) from clinical.worker;
  exception when others then return;  -- expected: no tenant context, fails closed
  end;
  raise exception 'FAIL: a worker read succeeded with no tenant context';
end $$;

reset role;

\echo 'clinical tenant retrofit tests passed'
