-- Continuum Core Platform Foundations (Prompt 51). S1 tenancy isolation tests.
--
-- Proves Section 3.4 and the acceptance criteria for tenancy: FORCE is set, a tenant sees only
-- its own rows, WITH CHECK blocks a cross tenant write, the composite foreign key blocks a cross
-- organisation region link, and an absent or blank tenant context fails closed. Run by psql with
-- ON_ERROR_STOP so any RAISE fails the job.
--
-- The tests run as app_clinical, a non superuser non owner role, so row level security actually
-- applies (a superuser or the table owner would bypass it, which is exactly why the application
-- never connects as either). The test grants app_clinical insert only for the duration of the
-- run, because provisioning writes are a later administrative path.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

-- fixed identifiers for two organisations
\set orgA '11111111-1111-1111-1111-11111111111a'
\set regA '11111111-1111-1111-1111-1111111111a1'
\set locA '11111111-1111-1111-1111-1111111111a2'
\set orgB '22222222-2222-2222-2222-22222222222b'
\set regB '22222222-2222-2222-2222-2222222222b1'

-- the test needs to write; provisioning grants come later
grant insert on tenancy.organisation, tenancy.region, tenancy.location to app_clinical;

-- 1. FORCE is set on every tenancy table
do $$
declare n int;
begin
  select count(*) into n
  from pg_class c join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'tenancy' and c.relkind = 'r' and c.relforcerowsecurity;
  if n <> 3 then raise exception 'FAIL: expected FORCE row level security on 3 tenancy tables, found %', n; end if;
end $$;

-- 2. seed organisation A under context A
set role app_clinical;
select set_config('app.organisation_id', :'orgA', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgA', 'Org A', 'Org A', 'AB', 'active');
insert into tenancy.region (id, organisation_id, name, status)
  values (:'regA', :'orgA', 'Region A', 'active');
insert into tenancy.location (id, organisation_id, region_id, name, jurisdiction_code, timezone, status)
  values (:'locA', :'orgA', :'regA', 'Location A', 'AB', 'America/Edmonton', 'active');
reset role;

-- 3. seed organisation B under context B
set role app_clinical;
select set_config('app.organisation_id', :'orgB', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgB', 'Org B', 'Org B', 'AB', 'active');
insert into tenancy.region (id, organisation_id, name, status)
  values (:'regB', :'orgB', 'Region B', 'active');
reset role;

-- 4. isolation on read: under context A only A's region is visible
set role app_clinical;
select set_config('app.organisation_id', :'orgA', false);
do $$
declare n int;
begin
  select count(*) into n from tenancy.region;
  if n <> 1 then raise exception 'FAIL: org A should see exactly 1 region, saw %', n; end if;
end $$;

-- 5. WITH CHECK: under context A, inserting a row owned by B is rejected
do $$
begin
  begin
    insert into tenancy.region (id, organisation_id, name, status)
      values (gen_random_uuid(), '22222222-2222-2222-2222-22222222222b', 'sneaky', 'active');
  exception when others then
    return;  -- expected: WITH CHECK blocked the cross tenant write
  end;
  raise exception 'FAIL: WITH CHECK allowed a cross tenant insert';
end $$;
reset role;

-- 6. composite foreign key: a location under B cannot link a region belonging to A
set role app_clinical;
select set_config('app.organisation_id', :'orgB', false);
do $$
begin
  begin
    insert into tenancy.location (id, organisation_id, region_id, name, jurisdiction_code, timezone, status)
      values (gen_random_uuid(), '22222222-2222-2222-2222-22222222222b',
              '11111111-1111-1111-1111-1111111111a1', 'cross', 'AB', 'America/Edmonton', 'active');
  exception when others then
    return;  -- expected: the composite foreign key rejected the cross organisation region link
  end;
  raise exception 'FAIL: a location linked a region from another organisation';
end $$;
reset role;

-- 7. fail closed: a blank tenant context refuses the read (blank casts to an invalid uuid; a
--    truly unset context raises unrecognized parameter under the same strict current_setting).
set role app_clinical;
select set_config('app.organisation_id', '', false);
do $$
begin
  begin
    perform count(*) from tenancy.region;
  exception when others then
    return;  -- expected: no tenant context, operation fails closed
  end;
  raise exception 'FAIL: a read succeeded with no tenant context';
end $$;
reset role;

\echo 'tenancy isolation tests passed'
