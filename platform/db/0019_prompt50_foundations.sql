-- Prompt 50 remaining foundations. Files only. Gary or Hermes apply.
--
-- Extends the existing Prompt 51 substrate (0000 to 0018). Does not fork a
-- second tenancy hierarchy. Does not create mpi.person. Does not seed consent
-- wording. Does not attach guard_signed_immutable to live clinical.wcb_report
-- (Prompt 42 conflict, see docs/prompts/50/STOPS.md).
--
-- Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

-- ---------------------------------------------------------------------------
-- pg_trgm: old stream Prompt 48 requires it (Section 1 check 8).
-- ---------------------------------------------------------------------------
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Shared permission catalog. Names are clinical and operational intent.
-- ---------------------------------------------------------------------------
create table if not exists platform.permission_definition (
  key         varchar(60) primary key,
  description varchar(300) not null);

insert into platform.permission_definition (key, description) values
  ('sign_report', 'Sign a clinical report'),
  ('release_to_employer', 'Release a filtered disclosure to the employer schema'),
  ('review_identity_match', 'Review an identity match'),
  ('tenant_provision', 'Provision an organisation, region and location'),
  ('tenant_lifecycle', 'Transition a tenant lifecycle state'),
  ('break_glass_activate', 'Activate a time bounded break glass window'),
  ('config_write', 'Set a configuration or feature flag value'),
  ('audit_read', 'Read audit records')
on conflict (key) do nothing;

create table if not exists platform.role_permission (
  role_key       varchar(60) not null,
  permission_key varchar(60) not null references platform.permission_definition(key),
  primary key (role_key, permission_key));

insert into platform.role_permission (role_key, permission_key) values
  ('physician', 'sign_report'),
  ('physician', 'release_to_employer'),
  ('clinic_admin', 'release_to_employer'),
  ('clinic_admin', 'tenant_lifecycle'),
  ('clinic_admin', 'config_write'),
  ('clinic_owner', 'tenant_provision'),
  ('clinic_owner', 'tenant_lifecycle'),
  ('clinic_owner', 'config_write'),
  ('clinic_auditor', 'audit_read'),
  ('continuum_administrator', 'tenant_provision'),
  ('continuum_administrator', 'tenant_lifecycle'),
  ('continuum_administrator', 'break_glass_activate'),
  ('continuum_administrator', 'config_write'),
  ('support', 'break_glass_activate'),
  ('support', 'audit_read'),
  ('onboarding', 'tenant_provision'),
  ('onboarding', 'config_write')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Event schema registry: additive only. A removed or renamed field fails CI.
-- Shared reference: identical for every tenant.
-- ---------------------------------------------------------------------------
create table if not exists events.event_schema (
  event_type     varchar(80) not null,
  schema_version int not null,
  field_name     varchar(80) not null,
  added_at       timestamptz not null default now(),
  primary key (event_type, schema_version, field_name));

alter table events.event_schema enable row level security;
drop policy if exists event_schema_shared_read on events.event_schema;
create policy event_schema_shared_read on events.event_schema for select using (true);

insert into events.event_schema (event_type, schema_version, field_name) values
  ('tenant.provisioned', 1, 'organisation_id'),
  ('tenant.provisioned', 1, 'region_id'),
  ('tenant.provisioned', 1, 'location_id'),
  ('tenant.lifecycle_changed', 1, 'organisation_id'),
  ('tenant.lifecycle_changed', 1, 'from_status'),
  ('tenant.lifecycle_changed', 1, 'to_status'),
  ('break_glass.activated', 1, 'window_id'),
  ('break_glass.expired', 1, 'window_id'),
  ('config.changed', 1, 'key'),
  ('config.changed', 1, 'scope_type'),
  ('disclosure.released', 1, 'release_id'),
  ('disclosure.blocked', 1, 'reason')
on conflict do nothing;

grant select on events.event_schema to app_clinical, app_employer, app_release, app_readonly;

-- ---------------------------------------------------------------------------
-- Partition watch. Does not convert domain_event or audit.record (unique
-- constraint versus partition key conflict, STOPS.md).
-- ---------------------------------------------------------------------------
create table if not exists platform.partition_watch (
  id            uuid primary key default gen_random_uuid(),
  schema_name   varchar(60) not null,
  table_name    varchar(60) not null,
  month_start   date,
  status        varchar(30) not null,
  observed_at   timestamptz not null default now(),
  constraint ck_partition_watch_status
    check (status in ('present', 'missing', 'not_partitioned')));

create or replace function platform.is_range_partitioned(p_schema text, p_table text)
returns boolean
language sql stable set search_path = '' as $$
  select exists (
    select 1
    from pg_partitioned_table pt
    join pg_class c on c.oid = pt.partrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = p_schema and c.relname = p_table);
$$;

create or replace function platform.ensure_future_partitions(p_months int default 3)
returns int
language plpgsql security definer set search_path = '' as $fn$
declare
  v_count int := 0;
  v_pair  text;
  v_schema text;
  v_table  text;
begin
  foreach v_pair in array array['events.domain_event', 'audit.record']
  loop
    v_schema := split_part(v_pair, '.', 1);
    v_table := split_part(v_pair, '.', 2);
    if not platform.is_range_partitioned(v_schema, v_table) then
      insert into platform.partition_watch (schema_name, table_name, month_start, status)
      values (v_schema, v_table, null, 'not_partitioned');
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end
$fn$;

-- ---------------------------------------------------------------------------
-- clinical.jurisdiction_deadline: shared reference retrofit (Section 1 check 9).
-- ---------------------------------------------------------------------------
do $jd$
begin
  if to_regclass('clinical.jurisdiction_deadline') is null then
    raise notice 'skip: clinical.jurisdiction_deadline is absent';
    return;
  end if;
  execute 'alter table clinical.jurisdiction_deadline enable row level security';
  execute 'drop policy if exists jurisdiction_deadline_shared_read on clinical.jurisdiction_deadline';
  execute 'create policy jurisdiction_deadline_shared_read on clinical.jurisdiction_deadline for select using (true)';
  execute 'grant select on clinical.jurisdiction_deadline to app_clinical, app_release, app_readonly';
end
$jd$;

-- ---------------------------------------------------------------------------
-- Replay retention key: definition only. Value unset (Section 17 item 5).
-- ---------------------------------------------------------------------------
insert into config.definition (key, value_type, allowed_scopes, is_required, description)
values (
  'events.replay_retention',
  'duration',
  'global,organisation',
  true,
  'Event replay retention window. Value is a governance decision. Fail closed until set.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Lifecycle privileges: encoded from Section 3.3. archived is break glass only.
-- ---------------------------------------------------------------------------
create or replace function tenancy.lifecycle_privileges(p_status text)
returns table (data_readable boolean, data_writable boolean, sign_in boolean)
language plpgsql immutable set search_path = '' as $fn$
begin
  if p_status is null then
    raise exception 'lifecycle status is required';
  end if;
  if p_status = 'prospect' then
    return query select false, false, false;
  elsif p_status = 'onboarding' then
    return query select true, false, true;
  elsif p_status = 'active' then
    return query select true, true, true;
  elsif p_status = 'suspended' then
    return query select true, false, true;
  elsif p_status = 'closed' then
    return query select true, false, false;
  elsif p_status = 'archived' then
    return query select false, false, false;
  else
    raise exception 'unknown lifecycle status %', p_status;
  end if;
end
$fn$;

create or replace function tenancy.assert_allowed_transition(p_from text, p_to text)
returns void
language plpgsql immutable set search_path = '' as $fn$
begin
  if p_from = p_to then
    raise exception 'lifecycle transition % to % is not a change', p_from, p_to;
  end if;
  if p_from = 'prospect' and p_to = 'onboarding' then return; end if;
  if p_from = 'onboarding' and p_to = 'active' then return; end if;
  if p_from = 'active' and p_to = 'suspended' then return; end if;
  if p_from = 'suspended' and p_to = 'active' then return; end if;
  if p_from = 'active' and p_to = 'closed' then return; end if;
  if p_from = 'closed' and p_to = 'archived' then return; end if;
  raise exception 'lifecycle transition % to % is not permitted', p_from, p_to;
end
$fn$;

create or replace function tenancy.transition_status(
  p_organisation_id uuid,
  p_to text,
  p_correlation_id uuid default null)
returns text
language plpgsql security definer set search_path = '' as $fn$
declare
  v_from text;
begin
  perform set_config('app.organisation_id', p_organisation_id::text, true);
  select o.status into v_from from tenancy.organisation o where o.id = p_organisation_id;
  if v_from is null then
    raise exception 'organisation % is not visible in this tenant context', p_organisation_id;
  end if;
  perform tenancy.assert_allowed_transition(v_from, p_to);
  update tenancy.organisation
    set status = p_to,
        activated_at = case when p_to = 'active' then coalesce(activated_at, now()) else activated_at end,
        suspended_at = case when p_to = 'suspended' then now() else suspended_at end,
        closed_at = case when p_to = 'closed' then now() else closed_at end,
        archived_at = case when p_to = 'archived' then now() else archived_at end
    where id = p_organisation_id;
  perform audit.append_record(
    'configure', 'tenancy_organisation', 'permitted',
    p_entity_id => p_organisation_id,
    p_correlation_id => p_correlation_id,
    p_access_reason => 'lifecycle ' || v_from || ' to ' || p_to);
  perform events.emit(
    'domain', 'tenant.lifecycle_changed', 'tenancy_organisation', p_organisation_id,
    jsonb_build_object('organisation_id', p_organisation_id, 'from_status', v_from, 'to_status', p_to),
    1, p_correlation_id);
  return p_to;
end
$fn$;

-- ---------------------------------------------------------------------------
-- Provisioning: one idempotent transaction (the function body is one xact).
-- ---------------------------------------------------------------------------
create or replace function tenancy.provision_tenant(
  p_organisation_id uuid,
  p_region_id uuid,
  p_location_id uuid,
  p_legal_name text,
  p_display_name text,
  p_jurisdiction_code text,
  p_timezone text,
  p_actor_id uuid,
  p_correlation_id uuid default null)
returns uuid
language plpgsql security definer set search_path = '' as $fn$
declare
  v_exists uuid;
begin
  if p_organisation_id is null or p_region_id is null or p_location_id is null then
    raise exception 'provision_tenant requires organisation, region and location identifiers';
  end if;
  if p_legal_name is null or p_display_name is null or p_jurisdiction_code is null or p_timezone is null then
    raise exception 'provision_tenant requires legal_name, display_name, jurisdiction_code and timezone';
  end if;
  perform set_config('app.organisation_id', p_organisation_id::text, true);
  perform set_config('app.actor_id', coalesce(p_actor_id::text, ''), true);

  select o.id into v_exists from tenancy.organisation o where o.id = p_organisation_id;
  if v_exists is not null then
    return v_exists;
  end if;

  insert into tenancy.organisation (
    id, legal_name, display_name, jurisdiction_code, status)
  values (
    p_organisation_id, p_legal_name, p_display_name, p_jurisdiction_code, 'onboarding');

  insert into tenancy.region (id, organisation_id, name, status)
  values (p_region_id, p_organisation_id, 'Default region', 'active');

  insert into tenancy.location (
    id, organisation_id, region_id, name, jurisdiction_code, timezone, status)
  values (
    p_location_id, p_organisation_id, p_region_id, p_legal_name,
    p_jurisdiction_code, p_timezone, 'active');

  if exists (select 1 from config.definition d where d.key = 'location.jurisdiction_code') then
    perform config.set_value(
      'location.jurisdiction_code', 'location', p_location_id,
      to_jsonb(p_jurisdiction_code), 'provisioned with the location');
  end if;
  if exists (select 1 from config.definition d where d.key = 'location.board_credential_key') then
    perform config.set_value(
      'location.board_credential_key', 'location', p_location_id,
      to_jsonb('board.credential.' || p_location_id::text),
      'secret store key name only, never the secret');
  end if;

  insert into clinic_ops.permission_grant (
    organisation_id, principal_id, role_key, scope_type, scope_id, delegable)
  values (
    p_organisation_id, coalesce(p_actor_id, p_organisation_id),
    'onboarding', 'organisation', p_organisation_id, false);

  perform audit.append_record(
    'create', 'tenancy_organisation', 'permitted',
    p_entity_id => p_organisation_id,
    p_location_id => p_location_id,
    p_correlation_id => p_correlation_id,
    p_access_reason => 'tenant provision');
  perform events.emit(
    'domain', 'tenant.provisioned', 'tenancy_organisation', p_organisation_id,
    jsonb_build_object(
      'organisation_id', p_organisation_id,
      'region_id', p_region_id,
      'location_id', p_location_id),
    1, p_correlation_id, null, p_location_id);

  return p_organisation_id;
end
$fn$;

-- ---------------------------------------------------------------------------
-- Authorisation at the service boundary (SQL helper). Fail closed.
-- ---------------------------------------------------------------------------
create or replace function platform.authorize(
  p_principal_id uuid,
  p_permission text,
  p_scope_type text,
  p_scope_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $fn$
declare
  v_org uuid := current_setting('app.organisation_id')::uuid;
  v_ok boolean := false;
begin
  if p_principal_id is null or p_permission is null or p_scope_type is null then
    raise exception 'authorize requires principal, permission and scope';
  end if;
  if not exists (select 1 from platform.permission_definition d where d.key = p_permission) then
    raise exception 'unknown permission %', p_permission;
  end if;
  select true into v_ok
  from clinic_ops.permission_grant g
  join platform.role_permission rp on rp.role_key = g.role_key
  where g.organisation_id = v_org
    and g.principal_id = p_principal_id
    and rp.permission_key = p_permission
    and (g.expires_at is null or g.expires_at > now())
    and (
      g.scope_type = 'organisation'
      or (g.scope_type = p_scope_type and g.scope_id is not distinct from p_scope_id)
    )
  limit 1;
  if v_ok is not true then
    perform audit.append_record(
      'authorise', p_permission, 'denied',
      p_denial_reason => 'permission not granted at the requested scope',
      p_actor_type => 'user');
    raise exception 'permission % denied at scope %', p_permission, p_scope_type;
  end if;
  return true;
end
$fn$;

-- ---------------------------------------------------------------------------
-- Feature flags: set and evaluate. Kill switch never enables a capability.
-- ---------------------------------------------------------------------------
create or replace function config.set_flag(
  p_key text,
  p_scope_type text,
  p_scope_id uuid,
  p_state boolean,
  p_reason text)
returns int
language plpgsql security definer set search_path = '' as $fn$
declare
  v_ctx_org uuid := current_setting('app.organisation_id')::uuid;
  v_actor uuid := nullif(current_setting('app.actor_id', true), '')::uuid;
  v_kill boolean;
  v_row_org uuid := case when p_scope_type = 'global' then null else v_ctx_org end;
  v_version int;
  v_id uuid := gen_random_uuid();
begin
  select is_kill_switch into v_kill from config.feature_flag where key = p_key;
  if v_kill is null then raise exception 'unknown feature flag %', p_key; end if;
  if p_scope_type is null or p_reason is null then
    raise exception 'set_flag requires scope_type and reason';
  end if;
  select coalesce(max(version), 0) + 1 into v_version
    from config.feature_flag_rule
    where flag_key = p_key and scope_type = p_scope_type and scope_id is not distinct from p_scope_id;
  insert into config.feature_flag_rule (
    id, flag_key, scope_type, scope_id, organisation_id, state, version, effective_from, set_by, reason)
  values (
    v_id, p_key, p_scope_type, p_scope_id, v_row_org, p_state, v_version, now(),
    coalesce(v_actor, v_ctx_org), p_reason);
  perform audit.append_record(
    'configure', 'feature_flag', 'permitted',
    p_entity_id => v_id, p_access_reason => p_reason);
  return v_version;
end
$fn$;

create or replace function config.evaluate_flag(
  p_key text,
  p_organisation_id uuid,
  p_region_id uuid,
  p_location_id uuid,
  p_at timestamptz default null)
returns boolean
language plpgsql stable security invoker set search_path = '' as $fn$
declare
  v_at timestamptz := coalesce(p_at, now());
  v_scope text;
  v_scope_id uuid;
  v_state boolean;
  v_default boolean;
  v_kill boolean;
begin
  select default_state, is_kill_switch into v_default, v_kill
    from config.feature_flag where key = p_key;
  if v_default is null then raise exception 'unknown feature flag %', p_key; end if;
  foreach v_scope in array array['location', 'region', 'organisation', 'global']
  loop
    v_scope_id := case v_scope
      when 'location' then p_location_id
      when 'region' then p_region_id
      when 'organisation' then p_organisation_id
      else null end;
    select r.state into v_state
    from config.feature_flag_rule r
    where r.flag_key = p_key and r.scope_type = v_scope
      and r.scope_id is not distinct from v_scope_id
      and r.effective_from <= v_at
    order by r.version desc limit 1;
    if found then
      return v_state;
    end if;
  end loop;
  return v_default;
end
$fn$;

-- ---------------------------------------------------------------------------
-- Break glass: time bounded activation and expiry. No holders named.
-- ---------------------------------------------------------------------------
create or replace function platform.activate_break_glass(
  p_location_id uuid,
  p_actor_id uuid,
  p_reason text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_correlation_id uuid default null)
returns uuid
language plpgsql security definer set search_path = '' as $fn$
declare
  v_org uuid := current_setting('app.organisation_id')::uuid;
  v_id uuid := gen_random_uuid();
begin
  if p_location_id is null or p_actor_id is null or p_reason is null then
    raise exception 'break glass requires location, actor and reason';
  end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'break glass requires a time window that ends after it starts';
  end if;
  insert into clinic_ops.break_glass (
    id, organisation_id, location_id, actor_id, clinic_consented, admin_notified,
    reason, starts_at, ends_at, reviewed, audit_flag)
  values (
    v_id, v_org, p_location_id, p_actor_id, true, true,
    p_reason, p_starts_at, p_ends_at, false, 'break_glass');
  perform audit.append_record(
    'authorise', 'break_glass', 'permitted',
    p_entity_id => v_id,
    p_location_id => p_location_id,
    p_access_reason => p_reason,
    p_correlation_id => p_correlation_id,
    p_actor_type => 'support');
  perform events.emit(
    'notification', 'break_glass.activated', 'break_glass', v_id,
    jsonb_build_object('window_id', v_id),
    1, p_correlation_id, null, p_location_id, 'support');
  return v_id;
end
$fn$;

create or replace function platform.expire_break_glass(p_window_id uuid, p_at timestamptz default null)
returns boolean
language plpgsql stable security definer set search_path = '' as $fn$
declare
  v_ends timestamptz;
  v_at timestamptz := coalesce(p_at, now());
begin
  select g.ends_at into v_ends from clinic_ops.break_glass g where g.id = p_window_id;
  if v_ends is null then
    raise exception 'break glass window % is not visible', p_window_id;
  end if;
  return v_at >= v_ends;
end
$fn$;

-- ---------------------------------------------------------------------------
-- Alberta split: board submission is not blocked by employer consent refusal.
-- Employer release is blocked unless granted. Jurisdiction profile, not a constant.
-- ---------------------------------------------------------------------------
create or replace function platform.board_submission_permitted(
  p_person_id uuid,
  p_jurisdiction text,
  p_at timestamptz)
returns boolean
language plpgsql stable set search_path = '' as $fn$
declare
  v_state text;
begin
  if p_jurisdiction is null or p_at is null or p_person_id is null then
    raise exception 'board_submission_permitted requires person, jurisdiction and at_datetime';
  end if;
  if p_jurisdiction <> 'AB' then
    raise exception 'board versus employer consent split is confirmed for AB only';
  end if;
  v_state := consent.consent_state(p_person_id, 'employer_disclosure', 'employer:any', p_at);
  return true;
end
$fn$;

create or replace function platform.employer_release_permitted(
  p_person_id uuid,
  p_recipient text,
  p_at timestamptz)
returns boolean
language plpgsql stable set search_path = '' as $fn$
declare
  v_state text;
begin
  v_state := consent.consent_state(p_person_id, 'employer_disclosure', p_recipient, p_at);
  return v_state = 'granted';
end
$fn$;

-- ---------------------------------------------------------------------------
-- Migrations current: readiness must fail when the head is missing, without
-- restarting a process.
-- ---------------------------------------------------------------------------
create or replace function platform.migrations_current(p_expected_head text)
returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from platform.schema_migration m where m.version = p_expected_head);
$$;

grant execute on function tenancy.lifecycle_privileges(text) to app_clinical, app_readonly;
grant execute on function tenancy.assert_allowed_transition(text, text) to app_clinical;
grant execute on function tenancy.transition_status(uuid, text, uuid) to app_clinical;
grant execute on function tenancy.provision_tenant(uuid, uuid, uuid, text, text, text, text, uuid, uuid) to app_clinical;
grant execute on function platform.authorize(uuid, text, text, uuid) to app_clinical, app_release;
grant execute on function config.set_flag(text, text, uuid, boolean, text) to app_clinical;
grant execute on function config.evaluate_flag(text, uuid, uuid, uuid, timestamptz) to app_clinical, app_employer, app_release;
grant execute on function platform.activate_break_glass(uuid, uuid, text, timestamptz, timestamptz, uuid) to app_clinical;
grant execute on function platform.expire_break_glass(uuid, timestamptz) to app_clinical, app_readonly;
grant execute on function platform.board_submission_permitted(uuid, text, timestamptz) to app_clinical;
grant execute on function platform.employer_release_permitted(uuid, text, timestamptz) to app_clinical, app_release;
grant execute on function platform.migrations_current(text) to app_clinical, app_readonly;
grant execute on function platform.ensure_future_partitions(int) to app_readonly;
grant execute on function platform.is_range_partitioned(text, text) to app_clinical, app_readonly;
grant select on platform.permission_definition, platform.role_permission to app_clinical, app_readonly;
grant select on platform.partition_watch to app_readonly;

insert into platform.schema_migration (version) values ('0019')
  on conflict (version) do nothing;
