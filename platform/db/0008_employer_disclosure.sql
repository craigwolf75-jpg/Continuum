-- Continuum Core Platform Foundations (Prompt 51). Migration 0008: the employer disclosure release.
--
-- Section 4.1, one way door D2. The employer and clinical schemas are physically separate. This adds
-- the platform employer.disclosure_release: the filtered copy of a disclosure, taken at release time.
-- If the clinical record later changes, the release does not, because a disclosure that was made
-- cannot be unmade. It is append only (Section 5.1).
--
-- Two rules are load bearing and enforced here:
--   source_report_id is NOT a foreign key, because a foreign key is a join waiting to be written.
--   consent_ledger_entry_id is NOT NULL, because a release with no lawful basis must fail at the
--     database, not only in application code (criterion 14).
-- There is no foreign key of any kind from this schema into clinical or consent; the only references
-- are opaque uuids, so no query can follow a path out of the employer schema into a person's record.
--
-- The employer schema already exists (migration 015 holds the physician stream's employer tables).
-- This adds disclosure_release only; the live employer tables are brought under the platform rules in
-- the rest of S8. Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

create schema if not exists employer;

create table if not exists employer.disclosure_release (
  id                      uuid primary key default gen_random_uuid(),
  organisation_id         uuid not null references tenancy.organisation(id),
  location_id             uuid,
  employer_party_id       uuid not null,
  claim_reference         varchar(40) not null,
  source_report_id        uuid not null,          -- opaque reference, NOT a foreign key
  disclosure_profile      varchar(40) not null,
  consent_ledger_entry_id uuid not null,          -- opaque reference, NOT NULL is deliberate
  released_at             timestamptz not null,
  released_by             uuid not null,
  payload                 jsonb not null,         -- already filtered at release time
  payload_digest          bytea not null);

create index if not exists ix_disclosure_organisation on employer.disclosure_release(organisation_id);
create index if not exists ix_disclosure_claim on employer.disclosure_release(claim_reference);

alter table employer.disclosure_release enable row level security;
alter table employer.disclosure_release force  row level security;
drop policy if exists disclosure_release_isolation on employer.disclosure_release;
create policy disclosure_release_isolation on employer.disclosure_release
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

-- append only: grant wall plus the S2 trigger. The release path role (app_release) inserts; no role
-- holds update or delete (Section 5.3).
revoke update, delete on employer.disclosure_release from app_employer, app_release;
drop trigger if exists tr_disclosure_release_append_only on employer.disclosure_release;
create trigger tr_disclosure_release_append_only
  before update or delete on employer.disclosure_release
  for each row execute function platform.guard_append_only();

grant usage on schema employer to app_employer, app_release;
grant select on employer.disclosure_release to app_employer, app_release;
grant insert on employer.disclosure_release to app_release;

insert into platform.schema_migration (version) values ('0008')
  on conflict (version) do nothing;
