-- Continuum Core Platform Foundations (Prompt 51). S8e audit retrofit tests.
--
-- Proves migration 0012: the two physician audit tables (audit.event, audit.ai_generation) now
-- carry organisation_id, have row level security enabled and FORCEd, and an isolation policy, and
-- that the retrofit preserved their append only nature. Isolation and append only are exercised on
-- audit.event. Run by psql with ON_ERROR_STOP, after clinical/db and the platform migrations.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgT 'cccc1111-2222-3333-4444-555566667777'
\set orgU 'dddd1111-2222-3333-4444-555566667777'

-- structural: both audit tables have organisation_id, RLS enabled and forced, and a policy
do $$
declare
  tables text[] := array['event', 'ai_generation'];
  n_col int; n_force int; n_pol int;
begin
  select count(*) into n_col
  from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'audit' and c.relname = any (tables)
    and a.attname = 'organisation_id' and a.attnum > 0 and not a.attisdropped;
  if n_col <> 2 then raise exception 'FAIL: expected organisation_id on 2 audit tables, got %', n_col; end if;

  select count(*) into n_force
  from pg_class c join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'audit' and c.relname = any (tables) and c.relrowsecurity and c.relforcerowsecurity;
  if n_force <> 2 then raise exception 'FAIL: expected RLS enabled and forced on 2 audit tables, got %', n_force; end if;

  select count(distinct c.relname) into n_pol
  from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace s on s.oid = c.relnamespace
  where s.nspname = 'audit' and c.relname = any (tables);
  if n_pol <> 2 then raise exception 'FAIL: expected a policy on 2 audit tables, got %', n_pol; end if;
end $$;

grant insert on tenancy.organisation to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgT', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgT', 'Org T', 'Org T', 'AB', 'active') on conflict do nothing;
insert into audit.event (organisation_id, action, entity) values (:'orgT', 'view', 'wcb_report');

select set_config('app.organisation_id', :'orgU', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgU', 'Org U', 'Org U', 'AB', 'active') on conflict do nothing;
insert into audit.event (organisation_id, action, entity) values (:'orgU', 'view', 'wcb_case');

-- isolation: org T sees only its own event
select set_config('app.organisation_id', :'orgT', false);
do $$
declare n int;
begin
  select count(*) into n from audit.event;
  if n <> 1 then raise exception 'FAIL: org T should see exactly 1 audit event, saw %', n; end if;
end $$;

-- WITH CHECK: a cross tenant audit event is rejected
do $$
begin
  begin
    insert into audit.event (organisation_id, action, entity)
      values ('dddd1111-2222-3333-4444-555566667777', 'view', 'sneaky');
  exception when others then return;  -- expected: WITH CHECK blocked it
  end;
  raise exception 'FAIL: a cross tenant audit event was allowed';
end $$;

-- append only preserved (grant wall): app_clinical holds no update
do $$
begin
  begin
    update audit.event set action = 'tamper';
  exception when others then return;  -- expected: no update grant
  end;
  raise exception 'FAIL: app_clinical updated an append only audit table';
end $$;

reset role;

-- append only preserved (trigger wall): the owner update is still rejected after the retrofit
do $$
begin
  begin
    update audit.event set action = 'tamper' where organisation_id = 'cccc1111-2222-3333-4444-555566667777';
  exception when others then return;  -- expected: the audit.block_mutation trigger
  end;
  raise exception 'FAIL: the owner updated an append only audit event (trigger lost in the retrofit)';
end $$;

\echo 'audit retrofit tests passed'
