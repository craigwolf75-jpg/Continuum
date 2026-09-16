-- Prompt 47 BUILD-NOW: clinic_ops product half plus E2 membership and config override policy.
--
-- Schema files only. Gary or Hermes apply. Athena does not live apply.
-- Residency: these tables live in the existing Canada-region clinical and platform
-- database. No US service and no region change.
--
-- E1 already landed at tenancy.organisation / tenancy.region / tenancy.location (0002)
-- and clinical.clinic.location_id (0010). This migration does not create
-- clinical.organisation or clinical.region.
--
-- E2: clinical.practitioner stays the global person identity. clinic_id is kept as a
-- legacy hint (no DROP). A guarded unique index on billing_number is added when the
-- table has no duplicate billing numbers. Location membership lands in
-- clinic_ops.membership (tenant isolated). Contract and role pairs are validated in
-- the engine against clinical.wcb_contract_role; no composite FK is added here.
--
-- config.definition gains override_policy (inherited, default, locked). 0007 is not
-- edited. Jurisdiction and board credential keys are location-scoped and never inherited.
--
-- Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

-- ---------------------------------------------------------------------------
-- config.definition: override policy (Prompt 47 Part 3.2)
-- ---------------------------------------------------------------------------
alter table config.definition
  add column if not exists override_policy varchar(20) not null default 'default';

do $ck_override$
begin
  if not exists (select 1 from pg_constraint where conname = 'ck_definition_override_policy') then
    alter table config.definition
      add constraint ck_definition_override_policy
      check (override_policy in ('inherited', 'default', 'locked'));
  end if;
end
$ck_override$;

-- Location-owned keys: jurisdiction and board credential secret-store KEY NAME.
-- The value is never a password. allowed_scopes is location only (Part 6.2).
insert into config.definition (key, value_type, allowed_scopes, is_required, description, override_policy)
values
  ('location.jurisdiction_code', 'string', 'location', true,
   'Location-owned jurisdiction code. Never inherited.', 'default'),
  ('location.board_credential_key', 'string', 'location', true,
   'Secret-store key name for board credentials at this location. Never the secret.', 'default')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- E2: unique billing_number on clinical.practitioner when empty-safe
-- ---------------------------------------------------------------------------
do $ux_billing$
declare
  v_dups int := 0;
begin
  if to_regclass('clinical.practitioner') is null then
    raise notice 'skip: clinical.practitioner is absent';
    return;
  end if;

  select count(*) into v_dups
  from (
    select billing_number
    from clinical.practitioner
    group by billing_number
    having count(*) > 1
  ) d;

  if v_dups = 0 then
    execute 'create unique index if not exists ux_practitioner_billing_number on clinical.practitioner (billing_number)';
    raise notice 'E2: unique(billing_number) on clinical.practitioner';
  else
    -- Duplicates exist: do not invent a survivor. clinic_id remains the uniqueness hint
    -- pending expand and contract. A non-unique lookup index is still useful.
    execute 'create index if not exists ix_practitioner_billing_number on clinical.practitioner (billing_number)';
    raise notice 'E2: unique(billing_number) deferred; % duplicate billing_number group(s); clinic_id remains the legacy hint', v_dups;
  end if;
end
$ux_billing$;

-- ---------------------------------------------------------------------------
-- clinic_ops schema: tenant owned commercial product-half tables
-- ---------------------------------------------------------------------------
create schema if not exists clinic_ops;

-- onboarding_run: Part 2 product half, four stages, blocking readiness stored as flags
create table if not exists clinic_ops.onboarding_run (
  id                           uuid primary key default gen_random_uuid(),
  organisation_id              uuid not null references tenancy.organisation(id),
  current_stage                varchar(32) not null,
  status                       varchar(20) not null,
  privacy_pack_filed           boolean not null default false,
  privacy_pack_override_reason varchar(300),
  privacy_pack_banner          boolean not null default false,
  ima_all_signed               boolean not null default false,
  admin_mfa_enrolled           boolean not null default false,
  sandbox_test_complete        boolean not null default false,
  go_live_at                   timestamptz,
  created_at                   timestamptz not null default now(),
  constraint ck_onboarding_run_stage
    check (current_stage in ('organisation', 'configure', 'people_and_data', 'ready')),
  constraint ck_onboarding_run_status
    check (status in ('in_progress', 'blocked', 'ready', 'live', 'withdrawn')),
  constraint ck_onboarding_privacy_override
    check (privacy_pack_override_reason is null or privacy_pack_filed = false),
  constraint ux_onboarding_run_id_organisation unique (id, organisation_id));

create table if not exists clinic_ops.onboarding_step (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  run_id          uuid not null,
  step_key        varchar(80) not null,
  stage           varchar(32) not null,
  complete        boolean not null default false,
  blocking        boolean not null default false,
  detail          jsonb not null default '{}'::jsonb,
  constraint ck_onboarding_step_stage
    check (stage in ('organisation', 'configure', 'people_and_data', 'ready')),
  constraint fk_onboarding_step_run_organisation
    foreign key (run_id, organisation_id)
    references clinic_ops.onboarding_run (id, organisation_id),
  constraint ux_onboarding_step_run_key unique (run_id, step_key));

-- entitlement: plan maps to module and capacity rows (Part 10 mapping only)
create table if not exists clinic_ops.entitlement (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  module_key      varchar(80) not null,
  kind            varchar(20) not null,
  limit_value     int,
  source_plan     varchar(80) not null,
  effective_from  timestamptz not null,
  effective_to    timestamptz,
  version         int not null,
  constraint ck_entitlement_kind check (kind in ('module', 'capacity')),
  constraint ux_entitlement_scope_version unique (organisation_id, module_key, kind, version));

-- access_mode: E8 structural. clinical_disabled can never be true.
create table if not exists clinic_ops.access_mode (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references tenancy.organisation(id),
  mode              varchar(20) not null,
  reason            varchar(40) not null,
  export_available  boolean not null default true,
  clinical_disabled boolean not null default false,
  constraint ck_access_mode_mode check (mode in ('full', 'read_only')),
  constraint ck_access_mode_reason check (reason in ('none', 'trial_ended', 'payment_grace_elapsed')),
  constraint ck_access_mode_clinical_disabled check (clinical_disabled = false),
  constraint ux_access_mode_organisation unique (organisation_id));

-- break_glass: Part 11. Time limited, clinic consented, admin notified, flagged.
create table if not exists clinic_ops.break_glass (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  location_id     uuid not null references tenancy.location(id),
  actor_id        uuid not null,
  clinic_consented boolean not null,
  admin_notified  boolean not null,
  reason          varchar(300) not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  reviewed        boolean not null default false,
  audit_flag      varchar(40) not null default 'break_glass',
  constraint ck_break_glass_window check (ends_at > starts_at),
  constraint ck_break_glass_audit_flag check (audit_flag = 'break_glass'));

-- diagnostic_view: metadata and error reference only. No clinical fields.
create table if not exists clinic_ops.diagnostic_view (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  location_id     uuid not null references tenancy.location(id),
  error_reference varchar(80) not null,
  component       varchar(80) not null,
  status          varchar(20) not null,
  metadata        jsonb not null default '{}'::jsonb,
  constraint ck_diagnostic_status check (status in ('open', 'acknowledged', 'resolved')));

-- metric_event: product instrumentation intake. No PHI.
create table if not exists clinic_ops.metric_event (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  location_id     uuid not null references tenancy.location(id),
  practitioner_id uuid,
  metric_key      varchar(80) not null,
  value_num       numeric,
  unit            varchar(40),
  occurred_at     timestamptz not null,
  form_type       varchar(20));

-- membership: E2 location membership (practitioner is global; this row is tenant scoped)
create table if not exists clinic_ops.membership (
  id                   uuid primary key default gen_random_uuid(),
  organisation_id      uuid not null references tenancy.organisation(id),
  location_id          uuid not null references tenancy.location(id),
  clinic_id            uuid references clinical.clinic(id),
  practitioner_id      uuid not null references clinical.practitioner(id),
  contract_identifier  varchar(10),
  practitioner_role    varchar(10) not null,
  skill_code           varchar(20),
  status               varchar(20) not null,
  start_date           date,
  end_date             date,
  created_at           timestamptz not null default now(),
  constraint ck_membership_status
    check (status in ('invited', 'registered', 'credentialed', 'active', 'suspended', 'inactive', 'deactivated', 'locum')),
  constraint ck_membership_dates check (end_date is null or start_date is null or end_date >= start_date),
  constraint ux_membership_practitioner_location unique (practitioner_id, location_id));

-- permission_grant: ROLE intersect SCOPE intersect ENTITLEMENT (Part 4)
create table if not exists clinic_ops.permission_grant (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid not null references tenancy.organisation(id),
  principal_id          uuid not null,
  role_key              varchar(60) not null,
  scope_type            varchar(20) not null,
  scope_id              uuid,
  entitlement_required  varchar(80),
  expires_at            timestamptz,
  delegable             boolean not null default false,
  constraint ck_permission_scope_type
    check (scope_type in ('organisation', 'region', 'location', 'own_records')));

-- practitioner_credential: person-held credential refs. value_ref is never a secret.
create table if not exists clinic_ops.practitioner_credential (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  practitioner_id uuid not null references clinical.practitioner(id),
  kind            varchar(40) not null,
  value_ref       varchar(120) not null,
  expires_on      date,
  status          varchar(20) not null,
  constraint ck_practitioner_credential_kind
    check (kind in ('college_registration', 'board_billing', 'liability', 'signature_enrolment')),
  constraint ck_practitioner_credential_status
    check (status in ('pending', 'active', 'expired', 'revoked')));

create index if not exists ix_onboarding_run_organisation on clinic_ops.onboarding_run(organisation_id);
create index if not exists ix_onboarding_step_organisation on clinic_ops.onboarding_step(organisation_id);
create index if not exists ix_entitlement_organisation on clinic_ops.entitlement(organisation_id);
create index if not exists ix_access_mode_organisation on clinic_ops.access_mode(organisation_id);
create index if not exists ix_break_glass_organisation on clinic_ops.break_glass(organisation_id);
create index if not exists ix_diagnostic_view_organisation on clinic_ops.diagnostic_view(organisation_id);
create index if not exists ix_metric_event_organisation on clinic_ops.metric_event(organisation_id);
create index if not exists ix_membership_organisation on clinic_ops.membership(organisation_id);
create index if not exists ix_membership_location on clinic_ops.membership(location_id);
create index if not exists ix_permission_grant_organisation on clinic_ops.permission_grant(organisation_id);
create index if not exists ix_practitioner_credential_organisation on clinic_ops.practitioner_credential(organisation_id);
create index if not exists ix_practitioner_credential_practitioner on clinic_ops.practitioner_credential(practitioner_id);

-- ---------------------------------------------------------------------------
-- Row level security: enable, FORCE, fail-closed policy
-- ---------------------------------------------------------------------------
do $rls$
declare
  t text;
  tables text[] := array[
    'onboarding_run',
    'onboarding_step',
    'entitlement',
    'access_mode',
    'break_glass',
    'diagnostic_view',
    'metric_event',
    'membership',
    'permission_grant',
    'practitioner_credential'
  ];
begin
  foreach t in array tables loop
    execute format('alter table clinic_ops.%I enable row level security', t);
    execute format('alter table clinic_ops.%I force row level security', t);
    execute format('drop policy if exists %I on clinic_ops.%I', t || '_isolation', t);
    execute format(
      'create policy %I on clinic_ops.%I using (organisation_id = (select current_setting(''app.organisation_id''))::uuid) with check (organisation_id = (select current_setting(''app.organisation_id''))::uuid)',
      t || '_isolation', t);
  end loop;
end
$rls$;

-- Grants: clinical application reads and writes clinic_ops. Employer gets nothing here.
grant usage on schema clinic_ops to app_clinical, app_release, app_readonly;
grant select, insert, update on
  clinic_ops.onboarding_run,
  clinic_ops.onboarding_step,
  clinic_ops.entitlement,
  clinic_ops.access_mode,
  clinic_ops.break_glass,
  clinic_ops.diagnostic_view,
  clinic_ops.metric_event,
  clinic_ops.membership,
  clinic_ops.permission_grant,
  clinic_ops.practitioner_credential
  to app_clinical;
grant select on
  clinic_ops.onboarding_run,
  clinic_ops.onboarding_step,
  clinic_ops.entitlement,
  clinic_ops.access_mode,
  clinic_ops.break_glass,
  clinic_ops.diagnostic_view,
  clinic_ops.metric_event,
  clinic_ops.membership,
  clinic_ops.permission_grant,
  clinic_ops.practitioner_credential
  to app_release, app_readonly;

insert into platform.schema_migration (version) values ('0017')
  on conflict (version) do nothing;
