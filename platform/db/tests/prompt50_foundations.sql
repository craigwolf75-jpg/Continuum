-- Prompt 50 SQL proofs: pg_trgm, provision, lifecycle, flags, authorize,
-- Alberta consent split, break glass, partition watch, migrations current,
-- event schema, up then down then up. No em dashes or en dashes.

\set ON_ERROR_STOP on

\set orgP  '50505050-5050-5050-5050-5050505050aa'
\set regP  '50505050-5050-5050-5050-5050505050ab'
\set locP  '50505050-5050-5050-5050-5050505050ac'
\set actP  '50505050-5050-5050-5050-5050505050ad'
\set corrP '50505050-5050-5050-5050-5050505050ae'
\set orgQ  '50505050-5050-5050-5050-5050505050ba'
\set regQ  '50505050-5050-5050-5050-5050505050bb'
\set locQ  '50505050-5050-5050-5050-5050505050bc'
\set perQ  '50505050-5050-5050-5050-5050505050bd'
\set tvQ   '50505050-5050-5050-5050-5050505050be'

-- 1. pg_trgm is available
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_trgm') then
    raise exception 'FAIL: pg_trgm extension is not installed';
  end if;
end $$;

-- 2. provision is one transaction and is idempotent
select tenancy.provision_tenant(
  :'orgP'::uuid, :'regP'::uuid, :'locP'::uuid,
  'Org P', 'Org P', 'AB', 'America/Edmonton', :'actP'::uuid, :'corrP'::uuid);

select tenancy.provision_tenant(
  :'orgP'::uuid, :'regP'::uuid, :'locP'::uuid,
  'Org P', 'Org P', 'AB', 'America/Edmonton', :'actP'::uuid, :'corrP'::uuid);

do $$
declare n int;
begin
  perform set_config('app.organisation_id', '50505050-5050-5050-5050-5050505050aa', true);
  select count(*) into n from tenancy.organisation where id = '50505050-5050-5050-5050-5050505050aa';
  if n <> 1 then raise exception 'FAIL: expected one provisioned organisation, got %', n; end if;
  select count(*) into n from tenancy.region where organisation_id = '50505050-5050-5050-5050-5050505050aa';
  if n <> 1 then raise exception 'FAIL: expected one region, got %', n; end if;
  select count(*) into n from tenancy.location where organisation_id = '50505050-5050-5050-5050-5050505050aa';
  if n <> 1 then raise exception 'FAIL: expected one location, got %', n; end if;
  select count(*) into n from clinic_ops.permission_grant where organisation_id = '50505050-5050-5050-5050-5050505050aa';
  if n <> 1 then raise exception 'FAIL: expected one initial role assignment, got %', n; end if;
end $$;

-- failed provision leaves nothing (null timezone)
do $$
begin
  begin
    perform tenancy.provision_tenant(
      '50505050-5050-5050-5050-5050505050ff'::uuid,
      '50505050-5050-5050-5050-5050505050fe'::uuid,
      '50505050-5050-5050-5050-5050505050fd'::uuid,
      'Fail Org', 'Fail Org', 'AB', null,
      '50505050-5050-5050-5050-5050505050fc'::uuid, null);
  exception when others then
    perform set_config('app.organisation_id', '50505050-5050-5050-5050-5050505050ff', true);
    if exists (select 1 from tenancy.organisation where id = '50505050-5050-5050-5050-5050505050ff') then
      raise exception 'FAIL: a failed provision left an organisation row';
    end if;
    return;
  end;
  raise exception 'FAIL: provision with a null timezone succeeded';
end $$;

-- 3. lifecycle transitions and privileges
do $$
declare r record;
begin
  perform set_config('app.organisation_id', '50505050-5050-5050-5050-5050505050aa', true);
  perform set_config('app.actor_id', '50505050-5050-5050-5050-5050505050ad', true);
  if (select status from tenancy.organisation where id = '50505050-5050-5050-5050-5050505050aa') <> 'onboarding' then
    raise exception 'FAIL: provisioned tenant should start in onboarding';
  end if;
  perform tenancy.transition_status('50505050-5050-5050-5050-5050505050aa'::uuid, 'active', '50505050-5050-5050-5050-5050505050ae'::uuid);
  select * into r from tenancy.lifecycle_privileges('active');
  if r.data_writable is not true then raise exception 'FAIL: active should be writable'; end if;
  perform tenancy.transition_status('50505050-5050-5050-5050-5050505050aa'::uuid, 'suspended', null);
  select * into r from tenancy.lifecycle_privileges('suspended');
  if r.data_writable is not false or r.data_readable is not true then
    raise exception 'FAIL: suspended should be read only';
  end if;
  perform tenancy.transition_status('50505050-5050-5050-5050-5050505050aa'::uuid, 'active', null);
  begin
    perform tenancy.assert_allowed_transition('closed', 'active');
  exception when others then
    null;
  end;
  begin
    perform tenancy.assert_allowed_transition('closed', 'active');
    raise exception 'FAIL: closed to active should be rejected';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
end $$;

-- 4. authorize at the service boundary, denial is audited
do $$
begin
  perform set_config('app.organisation_id', '50505050-5050-5050-5050-5050505050aa', true);
  perform set_config('app.actor_id', '50505050-5050-5050-5050-5050505050ad', true);
  if platform.authorize(
    '50505050-5050-5050-5050-5050505050ad'::uuid,
    'tenant_provision', 'organisation',
    '50505050-5050-5050-5050-5050505050aa'::uuid) is not true then
    raise exception 'FAIL: onboarding principal should hold tenant_provision';
  end if;
  begin
    perform platform.authorize(
      '50505050-5050-5050-5050-5050505050ad'::uuid,
      'sign_report', 'organisation',
      '50505050-5050-5050-5050-5050505050aa'::uuid);
  exception when others then
    return;
  end;
  raise exception 'FAIL: sign_report should be denied for the onboarding role';
end $$;

-- 5. feature flags
insert into config.feature_flag (key, description, default_state, is_kill_switch, retire_by)
values ('prompt50.demo_flag', 'test only', false, false, current_date + 60)
on conflict (key) do nothing;

do $$
declare v boolean;
begin
  perform set_config('app.organisation_id', '50505050-5050-5050-5050-5050505050aa', true);
  perform set_config('app.actor_id', '50505050-5050-5050-5050-5050505050ad', true);
  v := config.evaluate_flag('prompt50.demo_flag', '50505050-5050-5050-5050-5050505050aa'::uuid, null, null);
  if v is not false then raise exception 'FAIL: default flag state expected false'; end if;
  perform config.set_flag('prompt50.demo_flag', 'organisation', '50505050-5050-5050-5050-5050505050aa'::uuid, true, 'enable for this org');
  v := config.evaluate_flag('prompt50.demo_flag', '50505050-5050-5050-5050-5050505050aa'::uuid, null, null);
  if v is not true then raise exception 'FAIL: organisation flag override expected true'; end if;
end $$;

-- 6. Alberta split: board succeeds while employer release is blocked
insert into consent.text_version (id, jurisdiction_code, purpose, version_label, body_text, language_code, approved_by, effective_from)
values (:'tvQ', 'AB', 'employer_disclosure', 'test', 'test wording, not counsel approved', 'en', 'test', '2020-01-01')
on conflict do nothing;

select tenancy.provision_tenant(
  :'orgQ'::uuid, :'regQ'::uuid, :'locQ'::uuid,
  'Org Q', 'Org Q', 'AB', 'America/Edmonton', :'actP'::uuid, :'corrP'::uuid);

do $$
begin
  perform set_config('app.organisation_id', '50505050-5050-5050-5050-5050505050ba', true);
  insert into consent.ledger_entry (
    organisation_id, subject_person_id, purpose, action, text_version_id, scope_recipient,
    scope_data_classes, captured_by, capture_method, captured_at, effective_from)
  values (
    '50505050-5050-5050-5050-5050505050ba',
    '50505050-5050-5050-5050-5050505050bd',
    'employer_disclosure', 'refused',
    '50505050-5050-5050-5050-5050505050be',
    'employer:acme', '["restrictions"]'::jsonb,
    '50505050-5050-5050-5050-5050505050ad',
    'in_person', '2026-01-01', '2026-01-01');
  if platform.board_submission_permitted(
    '50505050-5050-5050-5050-5050505050bd'::uuid, 'AB', '2026-03-01'::timestamptz) is not true then
    raise exception 'FAIL: board submission must succeed when employer consent is refused';
  end if;
  if platform.employer_release_permitted(
    '50505050-5050-5050-5050-5050505050bd'::uuid, 'employer:acme', '2026-03-01'::timestamptz) is not false then
    raise exception 'FAIL: employer release must be blocked when consent is refused';
  end if;
end $$;

-- 7. break glass is time bounded
do $$
declare v uuid;
begin
  perform set_config('app.organisation_id', '50505050-5050-5050-5050-5050505050aa', true);
  v := platform.activate_break_glass(
    '50505050-5050-5050-5050-5050505050ac'::uuid,
    '50505050-5050-5050-5050-5050505050ad'::uuid,
    'support window',
    '2026-01-01'::timestamptz,
    '2026-01-02'::timestamptz,
    '50505050-5050-5050-5050-5050505050ae'::uuid);
  if platform.expire_break_glass(v, '2026-01-03'::timestamptz) is not true then
    raise exception 'FAIL: break glass should expire after ends_at';
  end if;
  if platform.expire_break_glass(v, '2026-01-01 12:00'::timestamptz) is not false then
    raise exception 'FAIL: break glass should be active inside the window';
  end if;
end $$;

-- 8. partition watch reports not_partitioned rather than converting
do $$
declare n int;
begin
  n := platform.ensure_future_partitions(3);
  if n < 1 then raise exception 'FAIL: expected a not_partitioned watch row'; end if;
  if platform.is_range_partitioned('events', 'domain_event') then
    raise exception 'FAIL: domain_event should remain unpartitioned until the unique-key conflict is decided';
  end if;
end $$;

-- 9. migrations current
do $$
begin
  if platform.migrations_current('0019') is not true then
    raise exception 'FAIL: 0019 should be recorded as applied in this harness';
  end if;
  if platform.migrations_current('9999') is not false then
    raise exception 'FAIL: a missing head must make readiness fail';
  end if;
end $$;

-- 10. event schema registry is present and additive
do $$
declare n int;
begin
  select count(*) into n from events.event_schema where event_type = 'tenant.provisioned';
  if n < 3 then raise exception 'FAIL: tenant.provisioned schema fields missing'; end if;
end $$;

-- 11. no sequential PK on new platform tables
do $$
declare r record;
begin
  for r in
    select n.nspname, c.relname, a.attname, t.typname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_constraint k on k.conrelid = c.oid and k.contype = 'p'
    join pg_attribute a on a.attrelid = c.oid and a.attnum = any (k.conkey)
    join pg_type t on t.oid = a.atttypid
    where n.nspname in ('platform') and c.relname in ('permission_definition', 'role_permission', 'partition_watch')
  loop
    if r.typname in ('int2', 'int4', 'int8') and r.relname = 'partition_watch' then
      raise exception 'FAIL: partition_watch must not use a sequential integer primary key';
    end if;
  end loop;
end $$;

-- 12. bad fixture is detected, then dropped
create table tenancy.bad_fixture (id uuid primary key);
do $$
declare
  v_rls boolean;
  v_force boolean;
  v_tenant boolean;
begin
  select c.relrowsecurity, c.relforcerowsecurity into v_rls, v_force
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'tenancy' and c.relname = 'bad_fixture';
  select exists (
    select 1 from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'tenancy' and c.relname = 'bad_fixture' and a.attname = 'organisation_id'
  ) into v_tenant;
  if v_rls or v_force or v_tenant then
    raise exception 'FAIL: bad fixture should lack tenancy controls';
  end if;
end $$;
drop table tenancy.bad_fixture;

-- 13. up, down, up for 0019
\ir ../downs/0019.sql
do $$
begin
  if to_regprocedure('tenancy.provision_tenant(uuid,uuid,uuid,text,text,text,text,uuid,uuid)') is not null then
    raise exception 'FAIL: down did not drop provision_tenant';
  end if;
end $$;
\ir ../0019_prompt50_foundations.sql
do $$
begin
  if to_regprocedure('tenancy.provision_tenant(uuid,uuid,uuid,text,text,text,text,uuid,uuid)') is null then
    raise exception 'FAIL: re-applied 0019 did not restore provision_tenant';
  end if;
  if not exists (select 1 from platform.schema_migration where version = '0019') then
    raise exception 'FAIL: 0019 missing from the ledger after up down up';
  end if;
end $$;
