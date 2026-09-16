-- Prompt 49 BUILD-NOW: interop schema for the canonical normalisation layer.
--
-- Schema files only. Gary or Hermes apply. Athena does not live apply.
-- Residency: these tables live in the existing Canada-region clinical and
-- platform database. No US service and no region change.
--
-- Prompt 48 is not present. This migration does not create mpi.person,
-- mpi.person_record, mpi.identifier_namespace, mpi.person_identifier, or
-- mpi.external_identity. The identity function below fails closed.
--
-- No new clinical measurement table. FunctionalCapacity is a projection over
-- clinical.functional_measurement and clinical.functional_axis_value.
--
-- Conflict (Section 19): the prompt SQL for canonical_version omitted
-- organisation_id. Section 12 and acceptance 5 require organisation_id, RLS,
-- FORCE, and a policy on every interop table. organisation_id is present.
--
-- Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

create schema if not exists interop;

-- ---------------------------------------------------------------------------
-- Fail-closed identity seam. Not a Master Person Index.
-- Never creates a person. Never auto-merges. Prompt 48 must replace this.
-- ---------------------------------------------------------------------------
create or replace function interop.resolve_identity(
  p_connection_id     uuid,
  p_identifier_type   text,
  p_identifier_value  text,
  p_namespace_key     text)
returns table (
  outcome   text,
  person_id uuid,
  reason    text)
language plpgsql stable as $fn$
begin
  if p_connection_id is null then
    raise exception 'resolve_identity requires a connection';
  end if;
  outcome := 'review_required';
  person_id := null;
  reason := 'PROMPT_48_NOT_LANDED';
  return next;
end
$fn$;
alter function interop.resolve_identity(uuid, text, text, text) set search_path = '';

-- ---------------------------------------------------------------------------
-- inbound_message: envelope. Idempotency is (connection_id, idempotency_key).
-- ---------------------------------------------------------------------------
create table if not exists interop.inbound_message (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references tenancy.organisation(id),
  location_id         uuid,
  connection_id       uuid not null,
  source_system       varchar(60) not null,
  external_org_ref    varchar(120),
  external_message_id varchar(120),
  idempotency_key     varchar(160) not null,
  correlation_id      uuid not null,
  trace_id            varchar(64),
  event_type          varchar(80) not null,
  schema_version      varchar(20) not null,
  payload_version     varchar(20),
  canonical_version   varchar(20) not null,
  adapter_name        varchar(60) not null,
  adapter_version     varchar(20) not null,
  content_type        varchar(80) not null,
  content_length      bigint not null,
  payload_digest      bytea not null,
  raw_payload_ref     varchar(200),
  transport_metadata  jsonb,
  source_recorded_at  timestamptz,
  received_at         timestamptz not null default now(),
  processing_status   varchar(30) not null,
  outcome             varchar(40),
  constraint ck_inbound_processing_status
    check (processing_status in ('received', 'processing', 'completed', 'conflict', 'failed')),
  constraint ck_inbound_outcome
    check (outcome is null or outcome in (
      'normalised',
      'normalised_with_warnings',
      'rejected_invalid_source',
      'rejected_unsupported_mapping',
      'rejected_unsupported_schema',
      'requires_manual_reconciliation',
      'processing_failure',
      'replayed',
      'conflict')),
  constraint ux_inbound_connection_idempotency unique (connection_id, idempotency_key),
  constraint ux_inbound_id_organisation unique (id, organisation_id));

create index if not exists ix_inbound_message_organisation
  on interop.inbound_message(organisation_id);
create index if not exists ix_inbound_message_correlation
  on interop.inbound_message(correlation_id);

-- ---------------------------------------------------------------------------
-- raw_payload: restricted store, separately permissioned. Retention unset.
-- No purge job. Section 19 item 1.
-- ---------------------------------------------------------------------------
create table if not exists interop.raw_payload (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  payload_ref     varchar(200) not null,
  content_type    varchar(80) not null,
  content_length  bigint not null,
  payload_digest  bytea not null,
  body            bytea not null,
  stored_at       timestamptz not null default now(),
  constraint ux_raw_payload_ref unique (payload_ref),
  constraint ux_raw_payload_id_organisation unique (id, organisation_id));

create index if not exists ix_raw_payload_organisation
  on interop.raw_payload(organisation_id);

-- ---------------------------------------------------------------------------
-- result_summary: persisted warnings and errors joined to the envelope.
-- ---------------------------------------------------------------------------
create table if not exists interop.result_summary (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  inbound_id      uuid not null,
  outcome         varchar(40) not null,
  warning_count   integer not null default 0,
  error_count     integer not null default 0,
  details         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  constraint fk_result_summary_inbound
    foreign key (inbound_id, organisation_id)
    references interop.inbound_message (id, organisation_id),
  constraint ux_result_summary_id_organisation unique (id, organisation_id));

create index if not exists ix_result_summary_organisation
  on interop.result_summary(organisation_id);

-- ---------------------------------------------------------------------------
-- conflict_record: inbound value contradicts an existing or signed value.
-- ---------------------------------------------------------------------------
create table if not exists interop.conflict_record (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references tenancy.organisation(id),
  inbound_id        uuid not null,
  field_path        varchar(200) not null,
  existing_digest   bytea,
  incoming_digest   bytea,
  signed_value_wins boolean not null default false,
  created_at        timestamptz not null default now(),
  constraint fk_conflict_inbound
    foreign key (inbound_id, organisation_id)
    references interop.inbound_message (id, organisation_id),
  constraint ux_conflict_id_organisation unique (id, organisation_id));

create index if not exists ix_conflict_record_organisation
  on interop.conflict_record(organisation_id);

-- ---------------------------------------------------------------------------
-- reconciliation_item: requires_manual_reconciliation writes this, nothing else.
-- ---------------------------------------------------------------------------
create table if not exists interop.reconciliation_item (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  inbound_id      uuid not null,
  reason          varchar(80) not null,
  status          varchar(20) not null,
  created_at      timestamptz not null default now(),
  constraint ck_reconciliation_status
    check (status in ('open', 'resolved', 'ignored')),
  constraint fk_reconciliation_inbound
    foreign key (inbound_id, organisation_id)
    references interop.inbound_message (id, organisation_id),
  constraint ux_reconciliation_id_organisation unique (id, organisation_id));

create index if not exists ix_reconciliation_item_organisation
  on interop.reconciliation_item(organisation_id);

-- ---------------------------------------------------------------------------
-- outbound_message: records that a payload was built, by digest. Not delivery.
-- ---------------------------------------------------------------------------
create table if not exists interop.outbound_message (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null references tenancy.organisation(id),
  location_id        uuid,
  connection_id      uuid not null,
  destination_system varchar(60) not null,
  source_event_id    uuid not null,
  canonical_version  varchar(20) not null,
  adapter_name       varchar(60) not null,
  adapter_version    varchar(20) not null,
  mapping_version    varchar(20) not null,
  field_manifest_ref varchar(120) not null,
  lawful_basis_type  varchar(30) not null,
  lawful_basis_ref   varchar(120) not null,
  payload_digest     bytea not null,
  raw_payload_ref    varchar(200),
  built_at           timestamptz not null default now(),
  correlation_id     uuid not null,
  constraint ck_outbound_lawful_basis
    check (lawful_basis_type <> '' and lawful_basis_ref <> ''),
  constraint ux_outbound_id_organisation unique (id, organisation_id));

create index if not exists ix_outbound_message_organisation
  on interop.outbound_message(organisation_id);

-- ---------------------------------------------------------------------------
-- vocabulary_map: versioned. Nothing updated in place. reviewed_by is a human.
-- organisation_id NULL means platform wide (Section 9.1).
-- ---------------------------------------------------------------------------
create table if not exists interop.vocabulary_map (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid references tenancy.organisation(id),
  external_system    varchar(60) not null,
  external_code_set  varchar(60) not null,
  external_code      varchar(60) not null,
  external_display   varchar(200),
  canonical_code_set varchar(60) not null,
  canonical_code     varchar(60) not null,
  canonical_display  varchar(200),
  jurisdiction_code  varchar(4),
  map_version        varchar(20) not null,
  mapping_status     varchar(20) not null,
  proposed_by        varchar(60),
  reviewed_by        uuid not null,
  reviewed_at        timestamptz not null,
  review_note        varchar(300),
  effective_from     timestamptz not null,
  effective_to       timestamptz,
  board_controlled   boolean not null default false,
  constraint ck_vocabulary_mapping_status
    check (mapping_status in ('proposed', 'approved', 'deprecated', 'rejected')),
  constraint ux_vocabulary_map_key unique (
    external_system, external_code_set, external_code,
    jurisdiction_code, organisation_id, map_version));

create index if not exists ix_vocabulary_map_organisation
  on interop.vocabulary_map(organisation_id);

-- ---------------------------------------------------------------------------
-- mapping_gap: unmapped codes. Occurrence count is the one mutable field.
-- ---------------------------------------------------------------------------
create table if not exists interop.mapping_gap (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null references tenancy.organisation(id),
  connection_id      uuid not null,
  external_system    varchar(60) not null,
  external_code_set  varchar(60) not null,
  external_code      varchar(60) not null,
  external_display   varchar(200),
  field_path         varchar(200) not null,
  first_seen_at      timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),
  occurrence_count   bigint not null default 1,
  status             varchar(20) not null,
  resolved_by        uuid,
  resolved_at        timestamptz,
  constraint ck_mapping_gap_status
    check (status in ('open', 'mapped', 'ignored')),
  constraint ux_mapping_gap_id_organisation unique (id, organisation_id));

create index if not exists ix_mapping_gap_organisation
  on interop.mapping_gap(organisation_id);

-- ---------------------------------------------------------------------------
-- canonical_version and adapter_registry. organisation_id required by
-- Section 12. Platform-wide rows use the reserved sentinel organisation
-- 00000000-0000-0000-0000-000000000000. That sentinel is not a tenant.
-- ---------------------------------------------------------------------------
create table if not exists interop.canonical_version (
  version         varchar(20) not null,
  organisation_id uuid not null references tenancy.organisation(id),
  status          varchar(20) not null,
  released_on     date not null,
  deprecated_on   date,
  retire_after    date,
  release_note    varchar(300) not null,
  constraint ck_canonical_version_status
    check (status in ('current', 'supported', 'deprecated', 'retired')),
  primary key (version, organisation_id));

create table if not exists interop.adapter_registry (
  name              varchar(60) not null,
  version           varchar(20) not null,
  organisation_id   uuid not null,
  vendor            varchar(60) not null,
  transport_pattern varchar(30) not null,
  canonical_version varchar(20) not null,
  schema_versions   jsonb not null,
  capabilities      jsonb not null,
  field_manifest    jsonb not null,
  status            varchar(20) not null,
  registered_at     timestamptz not null default now(),
  constraint ck_adapter_registry_status
    check (status in ('registered', 'certified', 'active', 'deprecated', 'retired')),
  primary key (name, version, organisation_id),
  constraint fk_adapter_canonical_version
    foreign key (canonical_version, organisation_id)
    references interop.canonical_version (version, organisation_id));

-- Platform sentinel organisation so version rows can exist before a tenant
-- is provisioned. Isolated from real tenants by a reserved UUID.
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
values (
  '00000000-0000-0000-0000-000000000000',
  'Continuum platform sentinel',
  'Platform',
  'CA',
  'active')
on conflict (id) do nothing;

insert into interop.canonical_version (
  version, organisation_id, status, released_on, release_note)
values
  ('1.0.0', '00000000-0000-0000-0000-000000000000', 'current', date '2026-09-16',
   'Prompt 49 initial canonical model'),
  ('2.0.0', '00000000-0000-0000-0000-000000000000', 'supported', date '2026-09-16',
   'Synthetic concurrent major for deprecation-window translation tests')
on conflict (version, organisation_id) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security: enable, FORCE, fail-closed policy.
-- vocabulary_map allows NULL organisation_id (platform wide) plus tenant match.
-- ---------------------------------------------------------------------------
do $rls$
declare
  t text;
  tenant_tables text[] := array[
    'inbound_message',
    'raw_payload',
    'result_summary',
    'conflict_record',
    'reconciliation_item',
    'outbound_message',
    'mapping_gap',
    'canonical_version',
    'adapter_registry'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table interop.%I enable row level security', t);
    execute format('alter table interop.%I force row level security', t);
    execute format('drop policy if exists %I on interop.%I', t || '_isolation', t);
    execute format(
      'create policy %I on interop.%I using (organisation_id = (select current_setting(''app.organisation_id''))::uuid) with check (organisation_id = (select current_setting(''app.organisation_id''))::uuid)',
      t || '_isolation', t);
  end loop;

  alter table interop.vocabulary_map enable row level security;
  alter table interop.vocabulary_map force row level security;
  drop policy if exists vocabulary_map_isolation on interop.vocabulary_map;
  create policy vocabulary_map_isolation on interop.vocabulary_map
    using (
      organisation_id is null
      or organisation_id = (select current_setting('app.organisation_id'))::uuid
    )
    with check (
      organisation_id is null
      or organisation_id = (select current_setting('app.organisation_id'))::uuid
    );
end
$rls$;

-- ---------------------------------------------------------------------------
-- Grants. Raw payload is separately permissioned: no SELECT to app roles.
-- Access goes through interop.access_raw_payload with an entered reason.
-- ---------------------------------------------------------------------------
grant usage on schema interop to app_clinical, app_release, app_readonly;

grant select, insert, update on interop.inbound_message to app_clinical;
grant select, insert on interop.result_summary to app_clinical;
grant select, insert on interop.conflict_record to app_clinical;
grant select, insert on interop.reconciliation_item to app_clinical;
grant select, insert on interop.outbound_message to app_clinical;
grant select, insert on interop.vocabulary_map to app_clinical;
grant select, insert, update on interop.mapping_gap to app_clinical;
grant select on interop.canonical_version to app_clinical, app_release, app_readonly;
grant select, insert on interop.adapter_registry to app_clinical;
grant select on
  interop.inbound_message,
  interop.result_summary,
  interop.conflict_record,
  interop.reconciliation_item,
  interop.outbound_message,
  interop.vocabulary_map,
  interop.mapping_gap,
  interop.adapter_registry
  to app_release, app_readonly;

revoke select, insert, update, delete on interop.raw_payload
  from app_clinical, app_employer, app_release, app_readonly;

grant execute on function interop.resolve_identity(uuid, text, text, text)
  to app_clinical, app_release;

-- Access to a raw payload requires a reason and writes an audit record.
-- Retention period is unset (Section 19). No purge job.
create or replace function interop.access_raw_payload(
  p_payload_ref  text,
  p_access_reason text)
returns table (
  payload_ref    varchar(200),
  content_type   varchar(80),
  content_length bigint,
  payload_digest bytea,
  body           bytea)
language plpgsql security definer as $fn$
declare
  v_org uuid;
  v_id  uuid;
begin
  if p_access_reason is null or length(btrim(p_access_reason)) = 0 then
    raise exception 'raw payload access requires an entered access_reason';
  end if;
  v_org := current_setting('app.organisation_id')::uuid;

  select rp.id into v_id
  from interop.raw_payload rp
  where rp.payload_ref = p_payload_ref
    and rp.organisation_id = v_org;

  if v_id is null then
    raise exception 'raw payload not found';
  end if;

  perform audit.append_record(
    'raw_payload_read',
    'interop.raw_payload',
    'permitted',
    v_id,
    null,
    'integration',
    null,
    'integration',
    'interop.raw_payload_access',
    p_access_reason);

  return query
    select rp.payload_ref, rp.content_type, rp.content_length, rp.payload_digest, rp.body
    from interop.raw_payload rp
    where rp.id = v_id;
end
$fn$;
alter function interop.access_raw_payload(text, text) set search_path = '';

grant execute on function interop.access_raw_payload(text, text) to app_clinical;

-- Store path for inbound raw bytes. Restricted. Returns the payload_ref.
create or replace function interop.store_raw_payload(
  p_payload_ref    text,
  p_content_type   text,
  p_content_length bigint,
  p_payload_digest bytea,
  p_body           bytea)
returns text
language plpgsql security definer as $fn$
declare
  v_org uuid;
begin
  v_org := current_setting('app.organisation_id')::uuid;
  insert into interop.raw_payload (
    organisation_id, payload_ref, content_type, content_length, payload_digest, body)
  values (
    v_org, p_payload_ref, p_content_type, p_content_length, p_payload_digest, p_body)
  on conflict (payload_ref) do nothing;
  return p_payload_ref;
end
$fn$;
alter function interop.store_raw_payload(text, text, bigint, bytea, bytea) set search_path = '';

grant execute on function interop.store_raw_payload(text, text, bigint, bytea, bytea)
  to app_clinical;

-- Employer wall: app_employer holds no grant on interop.
revoke all on schema interop from app_employer;

insert into platform.schema_migration (version) values ('0018')
  on conflict (version) do nothing;
