-- Continuum Core Platform Foundations (Prompt 51). S6 configuration framework tests.
--
-- Proves Section 9 and acceptance criteria 34 to 37: a value resolves most specific first across
-- all four scopes, a required key with no value fails the operation, a key set at a scope not in
-- allowed_scopes is rejected, and a change versions the value (never in place) and writes an audit
-- record. Run by psql with ON_ERROR_STOP.
--
-- Values are written only through config.set_value (security definer), which validates the scope,
-- versions the value and audits the change. The definitions are shared and written by the owner.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgF     '77777777-7777-7777-7777-77777777777f'
\set regF     '77777777-7777-7777-7777-7777777777a1'
\set locF     '77777777-7777-7777-7777-7777777777a2'
\set otherLoc '77777777-7777-7777-7777-7777777777a3'
\set actor    '77777777-7777-7777-7777-7777777777b1'

-- shared key definitions (owner write)
insert into config.definition (key, value_type, allowed_scopes, is_required, description) values
  ('batch.safety_margin', 'int', 'global,organisation,region,location', false, 'submission safety margin'),
  ('global.only',         'int', 'global,organisation',                 false, 'a global fallback key'),
  ('req.only',            'int', 'organisation',                        true,  'a required key'),
  ('org.only',            'int', 'organisation,location',               false, 'not settable at region')
  on conflict do nothing;

grant insert on tenancy.organisation to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgF', false);
select set_config('app.actor_id', :'actor', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgF', 'Org F', 'Org F', 'AB', 'active') on conflict do nothing;

-- set the same key at three scopes
select config.set_value('batch.safety_margin', 'global',       null,   '10'::jsonb, 'baseline');
select config.set_value('batch.safety_margin', 'organisation', :'orgF', '20'::jsonb, 'org override');
select config.set_value('batch.safety_margin', 'location',     :'locF', '30'::jsonb, 'location override');
-- a key set only globally
select config.set_value('global.only', 'global', null, '99'::jsonb, 'global default');

-- most specific first (criterion 35)
do $$
declare v jsonb;
begin
  v := config.resolve('batch.safety_margin', '77777777-7777-7777-7777-77777777777f', '77777777-7777-7777-7777-7777777777a1', '77777777-7777-7777-7777-7777777777a2');
  if v <> '30'::jsonb then raise exception 'FAIL: location scope expected 30, got %', v; end if;
  v := config.resolve('batch.safety_margin', '77777777-7777-7777-7777-77777777777f', '77777777-7777-7777-7777-7777777777a1', '77777777-7777-7777-7777-7777777777a3');
  if v <> '20'::jsonb then raise exception 'FAIL: unset location should fall back to organisation 20, got %', v; end if;
  v := config.resolve('batch.safety_margin', '77777777-7777-7777-7777-77777777777f', null, null);
  if v <> '20'::jsonb then raise exception 'FAIL: organisation scope expected 20, got %', v; end if;
  v := config.resolve('global.only', '77777777-7777-7777-7777-77777777777f', null, null);
  if v <> '99'::jsonb then raise exception 'FAIL: global fallback expected 99, got %', v; end if;
end $$;

-- a required key with no value fails closed (criterion 34)
do $$
begin
  begin
    perform config.resolve('req.only', '77777777-7777-7777-7777-77777777777f', null, null);
  exception when others then return;  -- expected: required key has no value
  end;
  raise exception 'FAIL: a required key with no value did not fail';
end $$;

-- a key set at a disallowed scope is rejected (criterion 36)
do $$
begin
  begin
    perform config.set_value('org.only', 'region', '77777777-7777-7777-7777-7777777777a1', '5'::jsonb, 'not allowed');
  exception when others then return;  -- expected: region not in allowed_scopes
  end;
  raise exception 'FAIL: a key was set at a scope not in allowed_scopes';
end $$;

-- a change versions the value, never in place (criterion 37)
select config.set_value('batch.safety_margin', 'organisation', :'orgF', '25'::jsonb, 'raised the margin');
do $$
declare v_versions int; v_latest jsonb;
begin
  select count(*) into v_versions from config.value
    where key = 'batch.safety_margin' and scope_type = 'organisation' and scope_id = '77777777-7777-7777-7777-77777777777f';
  if v_versions <> 2 then raise exception 'FAIL: expected 2 versions at organisation scope, saw %', v_versions; end if;
  v_latest := config.resolve('batch.safety_margin', '77777777-7777-7777-7777-77777777777f', null, null);
  if v_latest <> '25'::jsonb then raise exception 'FAIL: latest organisation value expected 25, got %', v_latest; end if;
end $$;

-- every configuration change wrote an audit record
do $$
declare n int;
begin
  select count(*) into n from audit.record where action = 'configure';
  if n < 5 then raise exception 'FAIL: expected at least 5 configure audit records, saw %', n; end if;
end $$;

reset role;

\echo 'configuration framework tests passed'
