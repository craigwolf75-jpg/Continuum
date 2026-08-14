-- Continuum Core Platform Foundations (Prompt 51). Migration 0004: the consent ledger.
--
-- Section 6. The question that must be answerable in year seven is not "did this person consent"
-- but "to exactly what wording, on what date, given by whom, captured how, scoped to which purpose
-- and which recipient, and has it since been revoked, and if so when". A boolean answers none of
-- it, so consent is a ledger with versioned wording, effective dating, revocation and a resolver.
--
-- Two tables:
--   consent.text_version  a SHARED reference table (Section 3.7): the approved wording, identical
--                         for every tenant, readable by all, writable by no tenant. It carries no
--                         organisation_id and is not FORCEd, because it is written only by a
--                         migration or an administrator through the owner, never by a tenant.
--   consent.ledger_entry  tenant owned, append only. Carries organisation_id, is isolated by row
--                         level security with FORCE, and attaches guard_append_only (S2) alongside
--                         revoked UPDATE and DELETE grants.
--
-- The resolver consent.consent_state is the only read path. It requires purpose, recipient and an
-- at_datetime and fails rather than assuming any of them, because consent for one recipient is not
-- consent for another and a past disclosure is evaluated against its own date.
--
-- NOTE on the live defect: the existing clinical.consent booleans (migration 016) are superseded
-- by this ledger. Cutting the physician stream over to the resolver is a live change to Prompts 39
-- to 46 and is deferred to the S8 retrofit, so no existing test changes here.
--
-- Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

create schema if not exists consent;

-- ---------------------------------------------------------------------------
-- text_version: shared, read only to tenants.
-- ---------------------------------------------------------------------------
create table if not exists consent.text_version (
  id                uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null,
  purpose           varchar(60) not null,
  version_label     varchar(20) not null,
  body_text         text not null,
  language_code     varchar(8) not null,
  approved_by       varchar(120) not null,
  effective_from    timestamptz not null,
  effective_to      timestamptz,
  constraint ux_text_version unique (jurisdiction_code, purpose, version_label, language_code));

alter table consent.text_version enable row level security;
-- deliberately NOT forced: the owner writes shared wording through a migration. Tenants read.
drop policy if exists text_version_shared_read on consent.text_version;
create policy text_version_shared_read on consent.text_version for select using (true);

-- ---------------------------------------------------------------------------
-- ledger_entry: tenant owned, append only.
-- ---------------------------------------------------------------------------
create table if not exists consent.ledger_entry (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null references tenancy.organisation(id),
  location_id        uuid,
  subject_person_id  uuid not null,
  purpose            varchar(60) not null,
  action             varchar(20) not null,
  text_version_id    uuid not null references consent.text_version(id),
  scope_recipient    varchar(120),
  scope_data_classes jsonb not null,
  captured_by        uuid not null,
  capture_method     varchar(30) not null,
  witnessed_by       uuid,
  captured_at        timestamptz not null,
  effective_from     timestamptz not null,
  effective_to       timestamptz,
  superseded_by_id   uuid references consent.ledger_entry(id),
  evidence_ref       varchar(200),
  created_at         timestamptz not null default now(),
  constraint ck_ledger_action
    check (action in ('granted','refused','revoked','expired','superseded')),
  constraint ck_ledger_capture_method
    check (capture_method in ('in_person','electronic_signature','verbal_witnessed')));

create index if not exists ix_ledger_lookup
  on consent.ledger_entry(subject_person_id, purpose, effective_from);
create index if not exists ix_ledger_organisation on consent.ledger_entry(organisation_id);

alter table consent.ledger_entry enable row level security;
alter table consent.ledger_entry force  row level security;
drop policy if exists ledger_entry_isolation on consent.ledger_entry;
create policy ledger_entry_isolation on consent.ledger_entry
  using      (organisation_id = (select current_setting('app.organisation_id'))::uuid)
  with check (organisation_id = (select current_setting('app.organisation_id'))::uuid);

-- append only: grant wall plus the S2 trigger. No role holds UPDATE or DELETE.
revoke update, delete on consent.ledger_entry from app_clinical, app_employer, app_release, app_readonly;
drop trigger if exists tr_ledger_entry_append_only on consent.ledger_entry;
create trigger tr_ledger_entry_append_only
  before update or delete on consent.ledger_entry
  for each row execute function platform.guard_append_only();

-- ---------------------------------------------------------------------------
-- The resolver: the only read path (Section 6.3). Requires purpose, recipient and at_datetime.
-- Returns granted | refused | revoked | expired | never_asked. Runs as the caller (security
-- invoker), so row level security limits it to the caller's own tenant.
-- ---------------------------------------------------------------------------
create or replace function consent.consent_state(
  p_subject_person_id uuid,
  p_purpose           text,
  p_recipient         text,
  p_at                timestamptz)
returns text
language plpgsql stable as $resolver$
declare
  v_action       text;
  v_effective_to timestamptz;
begin
  if p_subject_person_id is null then raise exception 'consent_state requires a subject person'; end if;
  if p_purpose is null then raise exception 'consent_state requires a purpose'; end if;
  if p_recipient is null then raise exception 'consent_state requires a recipient: consent for one recipient is not consent for another'; end if;
  if p_at is null then raise exception 'consent_state requires an at_datetime: a past disclosure is evaluated against its own date'; end if;

  select le.action, le.effective_to
    into v_action, v_effective_to
  from consent.ledger_entry le
  where le.subject_person_id = p_subject_person_id
    and le.purpose = p_purpose
    and le.scope_recipient is not distinct from p_recipient
    and le.superseded_by_id is null
    and le.effective_from <= p_at
  order by le.effective_from desc, le.created_at desc
  limit 1;

  if v_action is null then return 'never_asked'; end if;
  if v_action = 'revoked' then return 'revoked'; end if;
  if v_action = 'refused' then return 'refused'; end if;
  if v_action = 'expired' then return 'expired'; end if;
  if v_action = 'granted' then
    if v_effective_to is not null and v_effective_to <= p_at then return 'expired'; end if;
    return 'granted';
  end if;
  return 'never_asked';
end
$resolver$;
alter function consent.consent_state(uuid, text, text, timestamptz) set search_path = '';

-- grants (the primary wall). app_clinical captures and reads; app_release reads for the release
-- path; the shared wording is readable by both. No tenant writes text_version.
grant usage on schema consent to app_clinical, app_employer, app_release, app_readonly;
grant select on consent.text_version to app_clinical, app_employer, app_release, app_readonly;
grant select, insert on consent.ledger_entry to app_clinical;
grant select on consent.ledger_entry to app_release, app_readonly;
grant execute on function consent.consent_state(uuid, text, text, timestamptz) to app_clinical, app_release;

insert into platform.schema_migration (version) values ('0004')
  on conflict (version) do nothing;
