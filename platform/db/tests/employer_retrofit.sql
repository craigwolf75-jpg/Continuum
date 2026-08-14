-- Continuum Core Platform Foundations (Prompt 51). S8f employer retrofit tests.
--
-- Proves migration 0013: the two physician employer tables (published_restriction_set,
-- duty_match_line) now carry organisation_id, have row level security enabled and FORCEd, and an
-- isolation policy. Isolation is exercised on published_restriction_set, written by the release
-- path role. Run by psql with ON_ERROR_STOP, after clinical/db and the platform migrations.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgV 'eeee1111-2222-3333-4444-555566667777'
\set orgW 'ffff1111-2222-3333-4444-555566667777'

-- structural: both employer tables have organisation_id, RLS enabled and forced, and a policy
do $$
declare
  tables text[] := array['published_restriction_set', 'duty_match_line'];
  n_col int; n_force int; n_pol int;
begin
  select count(*) into n_col
  from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'employer' and c.relname = any (tables)
    and a.attname = 'organisation_id' and a.attnum > 0 and not a.attisdropped;
  if n_col <> 2 then raise exception 'FAIL: expected organisation_id on 2 employer tables, got %', n_col; end if;

  select count(*) into n_force
  from pg_class c join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'employer' and c.relname = any (tables) and c.relrowsecurity and c.relforcerowsecurity;
  if n_force <> 2 then raise exception 'FAIL: expected RLS enabled and forced on 2 employer tables, got %', n_force; end if;

  select count(distinct c.relname) into n_pol
  from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'employer' and c.relname = any (tables);
  if n_pol <> 2 then raise exception 'FAIL: expected a policy on 2 employer tables, got %', n_pol; end if;
end $$;

grant insert on tenancy.organisation to app_release;

set role app_release;
select set_config('app.organisation_id', :'orgV', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgV', 'Org V', 'Org V', 'AB', 'active') on conflict do nothing;
insert into employer.published_restriction_set
  (organisation_id, case_ref, employer_id, worker_ref, worker_display_name, job_title, work_status, effective_from, measurement_version)
  values (:'orgV', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'Worker One', 'Operator', 'fit', '2026-01-01', 1);

select set_config('app.organisation_id', :'orgW', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgW', 'Org W', 'Org W', 'AB', 'active') on conflict do nothing;
insert into employer.published_restriction_set
  (organisation_id, case_ref, employer_id, worker_ref, worker_display_name, job_title, work_status, effective_from, measurement_version)
  values (:'orgW', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'Worker Two', 'Driver', 'fit_with_restrictions', '2026-02-01', 1);

-- isolation: org V sees only its own restriction set
select set_config('app.organisation_id', :'orgV', false);
do $$
declare n int;
begin
  select count(*) into n from employer.published_restriction_set;
  if n <> 1 then raise exception 'FAIL: org V should see exactly 1 restriction set, saw %', n; end if;
end $$;

-- WITH CHECK: a cross tenant restriction set is rejected
do $$
begin
  begin
    insert into employer.published_restriction_set
      (organisation_id, case_ref, employer_id, worker_ref, worker_display_name, job_title, work_status, effective_from, measurement_version)
      values ('ffff1111-2222-3333-4444-555566667777', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'X', 'Y', 'fit', '2026-01-01', 1);
  exception when others then return;  -- expected: WITH CHECK blocked it
  end;
  raise exception 'FAIL: a cross tenant restriction set was allowed';
end $$;

reset role;

\echo 'employer retrofit tests passed'
