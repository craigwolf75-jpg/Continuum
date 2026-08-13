-- Continuum Core Platform Foundations (Prompt 51). Migration 0007: the configuration framework.
--
-- Section 9. Configuration is data: anything that changes without a code change lives in a table
-- with an effective date and a version, and nothing is updated in place. Four scopes resolve most
-- specific first with no implicit default: location, then region, then organisation, then global.
-- A required key with no value at any scope fails the operation that needs it (fail closed).
--
-- Two catalog tables are shared (the definition of a key and of a flag are identical for every
-- tenant, changed by Continuum only): config.definition and config.feature_flag. Two value tables
-- carry per scope values: config.value and config.feature_flag_rule. A value row is tenant owned
-- when its scope is organisation, region or location, and global when scope is global, in which
-- case organisation_id is null and the row is readable by every tenant. Writes go through
-- config.set_value, which validates the scope, versions the value and writes an audit record.
--
-- Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

create schema if not exists config;

-- ---------------------------------------------------------------------------
-- definition: shared key catalog.
-- ---------------------------------------------------------------------------
create table if not exists config.definition (
  key             varchar(120) primary key,
  value_type      varchar(20) not null,
  allowed_scopes  varchar(60) not null,   -- comma list of scopes that may set the key
  is_required     boolean not null,
  description     varchar(300) not null,
  validation_rule varchar(200),
  constraint ck_definition_value_type check (value_type in ('string','int','bool','json','duration')));

alter table config.definition enable row level security;
drop policy if exists definition_shared_read on config.definition;
create policy definition_shared_read on config.definition for select using (true);

-- ---------------------------------------------------------------------------
-- value: per scope, effective dated, versioned. Tenant owned, plus global rows (organisation_id
-- null) readable by all. Written only through config.set_value.
-- ---------------------------------------------------------------------------
create table if not exists config.value (
  id              uuid primary key default gen_random_uuid(),
  key             varchar(120) not null references config.definition(key),
  scope_type      varchar(20) not null,
  scope_id        uuid,                    -- null only when scope_type = global
  organisation_id uuid references tenancy.organisation(id),  -- null only when scope_type = global
  value           jsonb not null,
  version         int not null,
  effective_from  timestamptz not null,
  effective_to    timestamptz,
  set_by          uuid not null,
  set_at          timestamptz not null default now(),
  reason          varchar(200),
  constraint ck_value_scope_type check (scope_type in ('global','organisation','region','location')),
  constraint ck_value_global_org check ((scope_type = 'global') = (organisation_id is null)),
  constraint ux_value_scope_version unique (key, scope_type, scope_id, version));

create index if not exists ix_value_lookup on config.value(key, scope_type, scope_id, version);

alter table config.value enable row level security;
alter table config.value force  row level security;
drop policy if exists value_isolation on config.value;
create policy value_isolation on config.value
  using      (organisation_id = current_setting('app.organisation_id')::uuid or organisation_id is null)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);
revoke insert, update, delete on config.value from app_clinical, app_employer, app_release, app_readonly;

-- ---------------------------------------------------------------------------
-- feature_flag: shared flag catalog. Every flag has a retirement date.
-- ---------------------------------------------------------------------------
create table if not exists config.feature_flag (
  key            varchar(120) primary key,
  description    varchar(300) not null,
  default_state  boolean not null,
  is_kill_switch boolean not null,
  created_at     timestamptz not null default now(),
  retire_by      date not null);

alter table config.feature_flag enable row level security;
drop policy if exists feature_flag_shared_read on config.feature_flag;
create policy feature_flag_shared_read on config.feature_flag for select using (true);

-- ---------------------------------------------------------------------------
-- feature_flag_rule: per scope flag state. Tenant owned plus global rows.
-- ---------------------------------------------------------------------------
create table if not exists config.feature_flag_rule (
  id              uuid primary key default gen_random_uuid(),
  flag_key        varchar(120) not null references config.feature_flag(key),
  scope_type      varchar(20) not null,
  scope_id        uuid,
  organisation_id uuid references tenancy.organisation(id),
  state           boolean not null,
  version         int not null,
  effective_from  timestamptz not null,
  set_by          uuid not null,
  reason          varchar(200),
  constraint ck_flag_rule_scope_type check (scope_type in ('global','organisation','region','location')),
  constraint ck_flag_rule_global_org check ((scope_type = 'global') = (organisation_id is null)),
  constraint ux_flag_rule_scope_version unique (flag_key, scope_type, scope_id, version));

alter table config.feature_flag_rule enable row level security;
alter table config.feature_flag_rule force  row level security;
drop policy if exists flag_rule_isolation on config.feature_flag_rule;
create policy flag_rule_isolation on config.feature_flag_rule
  using      (organisation_id = current_setting('app.organisation_id')::uuid or organisation_id is null)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);
revoke insert, update, delete on config.feature_flag_rule from app_clinical, app_employer, app_release, app_readonly;

-- ---------------------------------------------------------------------------
-- set_value: the write path. Validates the scope against allowed_scopes, versions the value
-- (never updates in place), and writes an audit record. Security definer so callers hold execute
-- but not insert; the value chain plus the audit record together carry the previous value, the new
-- value, the actor and the reason (the previous value is the prior version at the same scope).
-- ---------------------------------------------------------------------------
create or replace function config.set_value(
  p_key        text,
  p_scope_type text,
  p_scope_id   uuid,
  p_value      jsonb,
  p_reason     text)
returns int
language plpgsql security definer set search_path = '' as $setval$
declare
  v_ctx_org uuid := current_setting('app.organisation_id')::uuid;  -- strict: no context fails closed
  v_actor   uuid := nullif(current_setting('app.actor_id', true), '')::uuid;
  v_allowed text;
  v_row_org uuid := case when p_scope_type = 'global' then null else v_ctx_org end;
  v_version int;
  v_id      uuid := gen_random_uuid();
begin
  select allowed_scopes into v_allowed from config.definition where key = p_key;
  if v_allowed is null then raise exception 'unknown configuration key %', p_key; end if;
  if not (p_scope_type = any (string_to_array(v_allowed, ','))) then
    raise exception 'configuration key % may not be set at scope %', p_key, p_scope_type;
  end if;

  select coalesce(max(version), 0) + 1 into v_version
    from config.value where key = p_key and scope_type = p_scope_type and scope_id is not distinct from p_scope_id;

  insert into config.value (id, key, scope_type, scope_id, organisation_id, value, version, effective_from, set_by, reason)
    values (v_id, p_key, p_scope_type, p_scope_id, v_row_org, p_value, v_version, now(), coalesce(v_actor, v_ctx_org), p_reason);

  perform audit.append_record('configure', 'config_value', 'permitted',
    p_entity_id => v_id, p_access_reason => p_reason);

  return v_version;
end
$setval$;

-- ---------------------------------------------------------------------------
-- resolve: the read path. Most specific first, no implicit default. A required key with no value
-- at any scope raises (fail closed). Security invoker so row level security scopes it to the
-- caller's tenant plus the global rows.
-- ---------------------------------------------------------------------------
create or replace function config.resolve(
  p_key             text,
  p_organisation_id uuid,
  p_region_id       uuid,
  p_location_id     uuid,
  p_at              timestamptz default null)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $resolve$
declare
  v_at       timestamptz := coalesce(p_at, now());
  v_scope    text;
  v_scope_id uuid;
  v_value    jsonb;
  v_required boolean;
begin
  foreach v_scope in array array['location','region','organisation','global']
  loop
    v_scope_id := case v_scope
      when 'location' then p_location_id
      when 'region' then p_region_id
      when 'organisation' then p_organisation_id
      else null end;
    select cv.value into v_value
    from config.value cv
    where cv.key = p_key and cv.scope_type = v_scope and cv.scope_id is not distinct from v_scope_id
      and cv.effective_from <= v_at and (cv.effective_to is null or cv.effective_to > v_at)
    order by cv.version desc limit 1;
    if found then return v_value; end if;
  end loop;

  select is_required into v_required from config.definition where key = p_key;
  if v_required then
    raise exception 'required configuration % has no value at any scope', p_key;
  end if;
  return null;
end
$resolve$;

grant usage on schema config to app_clinical, app_employer, app_release, app_readonly;
grant select on config.definition, config.value, config.feature_flag, config.feature_flag_rule
  to app_clinical, app_employer, app_release, app_readonly;
grant execute on function config.set_value(text, text, uuid, jsonb, text) to app_clinical;
grant execute on function config.resolve(text, uuid, uuid, uuid, timestamptz) to app_clinical, app_employer, app_release;

insert into platform.schema_migration (version) values ('0007')
  on conflict (version) do nothing;
