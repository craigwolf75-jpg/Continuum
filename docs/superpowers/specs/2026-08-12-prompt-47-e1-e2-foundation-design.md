# Prompt 47 sub-project 1: the E1 and E2 schema foundation

Design record. 2026-08-12. Continuum physician platform (repo craigwolf75-jpg/Continuum).
No em dashes or en dashes anywhere (Prompt 47 rule 00.7).

## 1. Scope and why this is a separate sub-project

Prompt 47 is the commercial platform: about eight build-now subsystems plus buy and defer
rows. It is far too large for one spec, and the document itself says building it all now is
the most expensive mistake available. It also mandates (execution rule 00.2) that its two
one-way doors, E1 and E2, land as schema BEFORE any commercial surface is built on top of
them, and that the report states where each landed.

This document designs ONLY that mandated foundation: E1 (organisation, region, location from
the first tenant) and E2 (practitioner identity global, membership scoped). Every commercial
surface (Parts 3 through 11: configuration engine, permissions, physician lifecycle surfaces,
analytics, entitlement mapping, support diagnostic and break glass, onboarding product half)
is a later sub-project that sits on this foundation and is out of scope here.

### Stop conditions honored (00.3, 00.6)

- The Master Architecture prompt is not in hand. E1 and E2 are fully specified in THIS
  document (Parts 5.1, 6.1, 6.2), so they are designed here. Jurisdiction is a separate
  one-way door, D7, whose inheritance rule is load bearing and not derivable from this
  document, so jurisdiction is explicitly NOT added in this sub-project. It is deferred to
  the configuration engine sub-project with a stop-and-report on D7.
- Residency: this sub-project adds tables to the existing clinical schema in the existing
  Canada region project (ca-central-1). No storage or service leaves Canada. No stop.

## 2. Current state (verified against the repo, 2026-08-12)

- No organisation, region, or location tables exist. The top tenant is clinical.clinic
  (migration 016), which is the E1 anti-pattern.
- clinical.practitioner is clinic scoped: practitioner(id, clinic_id references clinic,
  billing_number, family_name, given_name, middle_name, role_code, phone_area, phone_number,
  active, practitioner_sees_all, unique(clinic_id, billing_number)). This is the E2
  anti-pattern: the same human at two clinics is two rows.
- clinical.practitioner has role_code but NO contract_identifier and NO skill_code. The old
  schema never captured them.
- clinic_id is referenced by: wcb_case, clinic_batch_schedule, practitioner, wcb_report_field,
  and functional_measurement (which is INSERT ONLY, UPDATE and DELETE blocked by trigger).
- practitioner_id is referenced by: wcb_report, measurement_draft, and functional_measurement
  (insert only). All reference the person, which stays valid after E2.
- clinic already has a `region` varchar column that holds the RESIDENCY string ('ca-central-1'),
  not an org-hierarchy region. It must not be touched or conflated with the E1 region table.
- The contract and role matrix is clinical.wcb_contract_role(contract_id, practitioner_role)
  primary key. Membership contract and role validate against it.
- Migration 016 is already applied to the live project agzhnmunodrhsjbogzae. Gary has
  confirmed clinic and practitioner hold real rows, so migration 019 must both restructure and
  backfill, with a dry-run and verification.

## 3. E1 design: organisation, region, location

### 3.1 Approach decision

The prompt names the bottom level Location. clinical.clinic already IS the location: it owns
the batch schedule, board credentials, and facility identity. Two options were considered:

- (A) Rename clinic to location. This ripples across every clinic_id foreign key, including
  the immutable functional_measurement, and every engine and adapter query. High risk, no
  functional gain.
- (B, chosen) Keep clinic as the location entity and add two parent tables plus a resolver.
  This is exactly the prompt's own cost estimate ("two extra tables and a resolver"). No
  immutable column is touched.

clinic IS the location. This mapping is documented; a cosmetic rename is not worth a migration
across immutable columns.

### 3.2 New tables (migration 019)

- clinical.organisation(id uuid pk, legal_name, operating_name, business_number, created_at).
- clinical.region(id uuid pk, organisation_id references organisation, name, created_at).
- clinic.region_id uuid references region (new column; distinct from the existing residency
  varchar clinic.region).
- clinical.location_hierarchy view: resolves clinic_id to its region_id and organisation_id
  with names, so any caller resolves a location to its parents through one object.

### 3.3 Backfill

For every existing clinic: create one organisation and one region (1:1:1), then set
clinic.region_id. Names derive deterministically from the clinic name. Idempotent: skip a
clinic that already has region_id set.

## 4. E2 design: practitioner global, membership scoped

### 4.1 Target shape

- clinical.practitioner becomes the global person: drop clinic_id and the
  unique(clinic_id, billing_number) constraint; add unique(billing_number); keep
  billing_number, name components, phone components, active, created_at. role_code and
  practitioner_sees_all move OUT to membership. (College registration columns from Part 5.1
  are a Part 5 credential concern and are NOT added here.)
- clinical.practitioner_membership(id uuid pk, practitioner_id references practitioner,
  clinic_id references clinic, contract_identifier varchar null, practitioner_role varchar,
  skill_code varchar null, practitioner_sees_all boolean, status varchar, start_date,
  end_date, created_at, unique(practitioner_id, clinic_id),
  foreign key (contract_identifier, practitioner_role) references
  wcb_contract_role(contract_id, practitioner_role)). The composite foreign key validates the
  contract and role pair against the board matrix when a contract is present.

### 4.2 Backfill and the immutability refuse rule

- Dedup existing practitioner rows by billing_number into one global practitioner. If two rows
  under one billing_number carry conflicting names, RAISE (surface the conflict, never guess a
  survivor).
- Create one membership per original practitioner row, carrying the original clinic_id,
  role_code (into practitioner_role), active (into status), and practitioner_sees_all.
  contract_identifier and skill_code land NULL because the old schema never stored them. The
  runtime contract and role gate then treats a contract-less membership as unable to create
  forms, which surfaces the gap instead of inventing a contract identifier.
- IMMUTABILITY REFUSE: functional_measurement.practitioner_id is insert only. If any
  functional_measurement row references a practitioner that dedup would remove, the migration
  RAISEs rather than repointing an immutable foreign key. Pre-launch (prod submission never
  enabled) this table is expected empty of real signatures; if it is not, we stop and decide
  rather than corrupt immutable data. The safe survivor is any id already referenced by
  immutable rows; only unreferenced duplicates are removed.

## 5. Migration 019 strategy

- New migration clinical/db/019_migration_org_hierarchy_and_practitioner_identity.sql, layered
  ABOVE 016. Never edit an applied migration (016 stays untouched).
- Idempotent, guarded, one transaction, hand applied by Gary. I never touch Supabase, and the
  prior access token is burned, so Gary applies after rotating it.
- Because it backfills real data, it ships with a VERIFICATION pack (a set of SELECT queries
  Gary runs after apply): organisations = regions = clinics; global practitioners = distinct
  billing_numbers; memberships = original practitioner row count; every clinic has region_id;
  the immutable-reference guard reported zero conflicts. Apply success is not proof data
  changed, so the counts are checked explicitly.

## 6. Code ripple

The only data-layer code that moves is deploy/repo-live.mjs getReportFields: it currently
reads p.role_code from clinical.practitioner. After E2, role_code lives on
practitioner_membership, so getReportFields joins practitioner_membership on
(practitioner_id = r.practitioner_id and clinic_id = c.clinic_id) and reads
membership.practitioner_role. getClinic, isPractitionerActive, and commitSignature are
unchanged (clinic stays; practitioner.active stays global; practitioner_id is the person).
hl7report.populatePRD and p3.mjs are pure functions that receive role and contract as inputs,
so they do not change. Every change is made under TDD (fake executor tests in
deploy/repo-live.test.mjs).

## 7. Testing strategy

- The migration cannot run locally (no Postgres, and I never touch the live project), so its
  correctness is proven two ways: a structural read-through against the 011 and 016 schemas in
  this document, and the verification query pack Gary runs after apply.
- The code ripple (getReportFields) is proven by fake-executor unit tests asserting the new
  join and the membership.practitioner_role mapping, plus the full deploy suite staying green.
- No em dash or en dash scan on every changed file before commit.

## 8. The 00.2 report (where each door landed)

- E1 lands in migration 019: clinical.organisation, clinical.region, clinic.region_id, and the
  clinical.location_hierarchy resolver view. Backfill creates one org and one region per clinic.
- E2 lands in migration 019: clinical.practitioner becomes global (clinic scope removed,
  unique(billing_number)); clinical.practitioner_membership carries contract, role, and skill
  per location, validated against wcb_contract_role. Backfill dedups by billing_number and
  creates one membership per original row, refusing to touch immutable references.

## 9. Open items assigned elsewhere (not mine to resolve, 00.8)

- Jurisdiction per location (D7) waits on the Master Architecture prompt and the configuration
  engine sub-project.
- Backfilled memberships have no contract_identifier because the old schema never stored one;
  a clinic administrator assigns contracts before those practitioners can create forms. Whether
  Gary wants a data list of affected practitioners produced is his call.
- Applying migration 019 and running the verification pack is Gary's action, after rotating the
  burned Supabase token.

## 10. Out of scope for this sub-project

Parts 3 through 11 (configuration engine, permission enforcement, physician lifecycle surfaces,
multi-location consoles, analytics, entitlement mapping, support diagnostic and break glass,
onboarding product half). Each is its own spec, plan, and build cycle on top of this foundation.
