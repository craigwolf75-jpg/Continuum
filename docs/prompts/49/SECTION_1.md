# Prompt 49 Section 1: prerequisite inspection

Inspected on 2026-09-16 from tip `842514f` (Prompt 47 clinic enterprise CS platform).
Read only. No write, seed, live apply, or credential use.

**Headline.** Prompt 49 assumes Prompt 47 and Prompt 48 are implemented. Prompt 47 is
present (`platform/db/0000` to `0017`, clinic_ops engine). Prompt 48 is **not**
present. `MPI_AS_BUILT_REPORT.md` is confirmed: there is no `mpi` schema, no
`mpi.person`, no `mpi.external_identity`, no `mpi.identifier_namespace`, no
`mpi.person_identifier`, and no callable `resolve_identity`. This build does **not**
invent a Master Person Index. It adds a fail-closed identity port only.

No em dashes or en dashes anywhere.

---

## 1.1 Repository

### 1. Language, framework, package manager, versions

There is no root `package.json`. Engine code is plain ESM (`.mjs`) on Node 20.

| Package root | Role | Versions |
|---|---|---|
| `deploy/package.json` | Vercel static site gate | `@vercel/functions` 3.7.6, `xmllint-wasm` 4.0.2 |
| `hub-roles/package.json` | Hub role-select bundle | React ^18.3.1, Vite ^5.4.0 |
| `worker-app/package.json` | Worker app | Next.js 14.2.5, React 18.3.1, TypeScript ^5.5.0 |
| `clinical/db/package.json` | WCB seed generator | `xlsx` (CDN tarball) |
| `clinical/tools/wcb-code-list-loader/package.json` | Prompt 40 workbook loader | `xlsx` 0.18.5 |

CI Node version: `.github/workflows/suites.yml` pins **Node 20**. Platform and
exposure-proof workflows use **Postgres 15** only. Edge functions run on Deno with
`npm:@supabase/supabase-js@2`.

### 2. Module layout (preserved)

| Path | Role |
|---|---|
| `platform/db/` | Platform SQL migrations, tenant coverage, SQL tests |
| `platform/ci/` | Coverage and role setup |
| `clinical/db/` | Physician schema and seeds |
| `clinical/engine/` | Pure deterministic logic, no live database |
| `clinical/tools/` | Workbook loaders and verifiers |
| `supabase/` | Hub migrations and Deno edge functions |
| `deploy/` | Static site, Vercel APIs, CI Node suites |
| `docs/`, `specs/` | Documentation and prompt specs |

New interop code follows this layout: SQL in `platform/db/0018_interop.sql`,
engine in `clinical/engine/interop/`, CI aggregator in
`deploy/prompt49-canonical.test.mjs`. No new top-level tree.

### 3. Architecture test framework (Prompt 47 check 3)

**Absent as a reusable forbidden-import framework.** Prompt 47 shipped clinic-ops
engine tests and platform SQL tests, not a central import matrix.

Existing ad hoc guards:

- `deploy/bedrock_canada_guard.test.mjs`: forbidden Bedrock regions
- `deploy/ai_boundaries.test.mjs`: sign path must not invoke a model adapter
- `platform.yml` shell greps: tenant allow-list count; no platform migration
  referencing both `clinical.` and `employer.`
- `deploy/prompt47-clinic-ops.test.mjs`: dash hygiene on Prompt 47 engine files

This build adds architecture scans in `deploy/prompt49-canonical.test.mjs` so a
forbidden import, a bare `provenance` identifier, a Worker entity, a new clinical
measurement table, or an identity bypass fails the suite gate.

### 4. CI mechanism for custom checks

| Workflow | What it runs |
|---|---|
| `.github/workflows/suites.yml` | All `deploy/*.test.mjs` on Node 20 |
| `.github/workflows/platform.yml` | Postgres 15: allow-list grep, employer-wall grep, clinical then platform migrations, tenant coverage, flag expiry, `platform/db/tests/*.sql` |
| `.github/workflows/exposure-proof.yml` | Hub migrations and exposure proofs |
| `.github/workflows/xsd-crosscheck.yml` | Board HL7 XML vs structural XSD |

Custom checks are shell greps, SQL `RAISE`, and Node exit-code suites.

---

## 1.2 Existing domain

### 5. Domain entities and canonical mapping

Canonical types are contracts, not tables. Most map onto existing storage.
None of the mappings below authorises a duplicate clinical measurement table.

| Canonical type | Backing storage | Disposition |
|---|---|---|
| Person | Prompt 48 `mpi.person` (absent) | Fail-closed identity port only. No MPI invented |
| Worker | Role projection of a Person within a case | **Not an entity.** No Worker table |
| Practitioner | `clinical.practitioner` | Identity global, membership in `clinic_ops.membership` |
| Organization | `tenancy.organisation` | Correction 2. No parallel org table |
| Clinic | `tenancy.location` (clinic link: `clinical.clinic.location_id`) | Correction 2. No parallel clinic entity |
| Employer | `employer` schema only | Never joined to clinical |
| Coverage | No dedicated table | Value object / mapping only |
| ClaimReference | `clinical.wcb_case.claim_number` | Reference, never a claim record |
| OccupationalInjuryCase | `clinical.wcb_case` and hub `public.injuries` | Dual streams exist; canonical maps, does not merge them |
| Encounter | None | Canonical contract only |
| Appointment | None | Canonical contract only |
| DiagnosisReference | Coded values on the case / `wcb_code_value` | Reference and coding, not a judgement |
| Assessment | Partial: public assessment response; measurement via functional tables | Contract |
| FunctionalCapacity | `clinical.functional_measurement` + `clinical.functional_axis_value` | **Projection. No new table** |
| FunctionalRestriction | `functional_axis_value.derived_band` and `derived_capability_code` | Derived only |
| ReturnToWorkStatus | `functional_measurement.fit_for_work`, modified hours/duties | Projection |
| ReturnToWorkPlan | Engine payload in `worker_plan.mjs`; no table | Contract |
| ClinicalNote | Partial narrative fields | Contract |
| Document | Signed artifact digest (Prompt 47 5.5) | Contract |
| Submission | `clinical.wcb_submission` | Existing |
| Communication | Outbound message record (partial hub notifications) | Contract |
| ConsentReference | `consent.ledger_entry` identifier | Identifier only. State from `consent_state()` |
| Identifier | Value object | Layered on Prompt 48 namespaces when they exist |
| ExternalIdentifier | Prompt 48 `mpi.external_identity` (absent) | Value object. Lookup fails closed |
| Address | Value object | Worker address columns exist on `clinical.worker` |
| Contact | Value object | Phone columns exist |
| Coding | Value object | `wcb_code_list` / `wcb_code_value` |
| Status | Value object | Canonical state plus retained source status |
| Provenance | Value object | `authorship_provenance` and `source_provenance`, separate |

Hub tables (`public.users`, `public.workers`) and `clinical.worker` remain two
unlinked person models. This build does not reconcile them (Prompt 48 / Craig).

### 6. Functional measurement tables

Confirmed in `clinical/db/011_migration_functional_measurement_model.sql`.

`clinical.functional_measurement` columns: `id`, `clinic_id`, `case_id`,
`report_id`, `practitioner_id`, `form_id`, `version`, `measured_at`,
`work_hours_per_day`, `modified_hours`, `modified_duties`, `fit_for_work`,
`fit_override_reason`, `effective_from`, `effective_to`, `created_at`,
`created_by`. Unique `(case_id, version)`.

`clinical.functional_axis_value` columns include `axis`, `answered`, `skipped`,
`skip_reason`, `capability`, `measured_hours`, `measured_weight_kg`,
`derived_band`, `derived_capability_code`, `rounded_down`, `below_lowest_band`,
`source`.

`clinical.functional_grasping` exists (lines 133 to 143). Gap-fill CHECKs in
`019_migration_functional_measurement_gap_fill.sql`.

No column difference requires a new table. Canonical `FunctionalCapacity` is a
projection over these rows.

### 7. Enumerations

| Type | Values | Source |
|---|---|---|
| `clinical.capability` | `able`, `limited_to`, `limited`, `unable`, `restricted_from` | `011:57-58` |
| `clinical.axis_source` | `measured`, `carried_forward`, `bulk_marked_able` | `011:60-61` |
| `clinical.functional_axis` | `sitting`, `standing`, `walking`, `bending`, `twisting`, `kneeling_squatting`, `climbing`, `driving`, `pushing_pulling`, `lifting_general`, `overhead_reaching`, `lifting_floor_to_waist`, `lifting_waist_to_shoulder`, `lifting_above_shoulder` | `011:69-74` |
| `clinical.provenance` | `human`, `ai_draft`, `ai_draft_edited`, `carried_forward`, `system` | `017:23-24` |

Do not extend the authorship enumeration. Do not reuse the bare name
`provenance` in new code.

### 8. Band derivation

Exactly two algorithm implementations, one consumer at signature:

1. SQL: `clinical.derive_weight_band` in `011_migration_functional_measurement_model.sql:283-307`
2. JS mirror: `deriveWeightBand` in `clinical/engine/measurement.mjs:35-46`
3. Consumer: `deriveAxis()` in `clinical/engine/sign_measurement.mjs:105-117` at signature

**Not consolidated in this build.** The SQL and JS pair is the Prompt 39
deliberate mirror (engine tests without a database). A third implementation
must not be added. Interop code must not call derivation. Architecture tests
fail the build if an adapter, transformer, or interop read path imports
`deriveWeightBand`.

### 9. Authorship enumeration write path

Written in `clinical/db/017_migration_ai_provenance_and_isolation.sql` and
guarded in `clinical/engine/ai_provenance.mjs`. Model writes are `ai_draft`
only. `checkWriteProvenance` rejects `source === "model_service"` with
authorship `human` (`PROVENANCE-MODEL-CLAIMS-HUMAN`). Proven in
`deploy/ai_boundaries.test.mjs`. No path from a model response to `human`.

---

## 1.3 Existing API

### 10. External-facing endpoints

**Vendor-shaped payload today:** `supabase/functions/cases/index.ts` accepts a
Nexus-shaped intake body and writes hub domain rows directly, including clinical
fields on `public.injuries`. Reported as an existing defect. This build does not
rewrite that function (out of scope: production adapters and gateway). It is
listed as deferred: it must later sit behind the adapter contract.

Other endpoints: hub auth (`/api/hub-*`), site access, marketing lead, status,
jurisdiction-boards, injuries RPCs, wcb-generator (worker secret), escalation
and auto-actions workers. None of the Vercel APIs accept a vendor clinical
payload.

### 11. Auth, authorisation, error, versioning conventions

- Site gate: HMAC cookie `ct_site`
- Hub gate: HMAC cookie `ct_session`
- Tenant context: server-side `set_config('app.organisation_id', ..., true)`.
  Never from a request parameter, header, body, or envelope
- Engine errors: named codes (`JURISDICTION-MISSING`, and similar)
- HTTP errors: JSON `{ error }` with 4xx/5xx
- Event `schema_version` on `events.domain_event`
- No `/v1/` API prefix in use

This build follows those conventions. It adds no public HTTP API.

### 12. OpenAPI

**None.** No `openapi` or `swagger` artifact. Specs live in markdown.

---

## 1.4 Existing entities and identifiers

### 13. Vendor field names outside an adapter directory

No `adapter/` directory exists. `accuro_` and `c050e_` as field prefixes: zero
matches. `alberta_` appears only as jurisdiction profile keys
(`alberta_pink_copy`, `alberta_statutory_report`) in Prompt 45 data rows.
`C050E` is a board form identifier in measurement and HL7 seed data, not a
vendor column. Defect list for this scan: none in application code. Data rows
and adapters remain the only lawful homes.

### 14. External identifiers stored as columns

| Column | Table |
|---|---|
| `phn` | `clinical.worker` |
| `claim_number` | `clinical.wcb_case` |
| `claim_reference` | `clinical.wcb_report` |
| `employer_ref` | `clinical.wcb_case` |
| `billing_number` | `clinical.practitioner` |
| `board_clinic_identifier` | `tenancy.location` |
| `nexus_case_ref` | `public.injuries` |
| `wcb_claim_number` | `public.wcb_notifications` |
| `wcb_account_number` | `public.tenants` |
| `phone` (natural key) | `public.users` |

Each of these is a Prompt 48 migration candidate. **Not migrated here.** Moving
them into `mpi.external_identity` would invent Prompt 48. Deferred to Section 19
/ Craig (identity key and MPI decisions remain open in `MPI_DECISION_BRIEF.md`).

### 15. MPI objects

**Confirmed absent.** Grep for `mpi.external_identity`, `mpi.identifier_namespace`,
`mpi.person_identifier`, and `resolve_identity` returns only forward comments
and the MPI reports. The allow-list still reserves exactly one entry:
`mpi.person`. This build does not create that table and does not add a second
allow-list entry.

**PHN checksum location (Prompt 37 / 40):** `clinical/engine/phn.mjs`. The check
digit is default OFF and refuses to guess an algorithm. Identifier validation
in this build **references that module** and does not write a second
implementation.

---

## 1.5 Existing events

### 16. Event foundation

Confirmed in `platform/db/0006_events.sql`:

- `events.domain_event`
- `events.outbox`
- Three classes: `domain`, `integration`, `notification`

### 17. Existing event types

No production catalogue. Test types only (`thing.changed`, `case.opened`,
`report.drafted`, and similar). Draft types ending in `.drafted` never reach
the outbox. This build **adds** interop event type constants. It does not
modify any existing type.

### 18. Subscription ACL

`events.subscription` with `is_entitled`. `events.emit` never outboxes domain
events or `*.drafted` types. Proven in `platform/db/tests/events_outbox.sql`.

---

## 1.6 Existing integration code

### 19. Inventory and disposition

| Piece | Disposition |
|---|---|
| `clinical/tools/wcb-code-list-loader/loader.mjs` | Reuse. Prompt 37/40 loader. Not a second loader |
| Clinical seed generators (`seedgen.mjs` and siblings) | Out of scope: reference data, not runtime ingress |
| HL7 engine (`hl7gen.mjs`, envelope, report, doc, obx) | Out of scope: board wire format, not a vendor adapter. Future outbound may call it through the adapter contract |
| `clinical/tools/wcb-rule-verifier/verify.mjs` | Out of scope: verification tool |
| `deploy/xsd-validator.mjs` | Out of scope: schema check |
| `clinical/engine/orchestrator.mjs`, `batch.mjs`, `resubmission.mjs` | Out of scope: board submission orchestration |
| `deploy/repo-live.mjs` | Existing internal sign-path adapter. Reported: writes domain tables. Not migrated in this prompt (gateway / production adapter out of scope) |
| `supabase/functions/cases` | Defect: vendor-shaped payload writes hub domain rows. Deferred |
| `supabase/functions/wcb-generator` | Out of scope: notification drain |
| `deploy/CONTINUUM_37_EMPLOYER_ONBOARDING_MODULE.js` | Prompt 37 employer onboarding. Reuse, do not rebuild |
| `clinical/engine/jurisdiction.mjs` | Prompt 42 resolvers. This build must not branch on jurisdiction |
| FHIR | Spec only. Not implemented |

### 20. Direct domain writes from importers

Yes. Defects that this build **closes for the new inbound path** (nothing reaches
a business service except through the pipeline). Existing writers are **not**
rewritten here:

- `supabase/functions/cases/index.ts` writes `users`, `workers`, `injuries`
- `deploy/repo-live.mjs` writes functional measurement tables
- Seed SQL writes reference tables

Closing those existing writers is a later mission. The new pipeline cannot
reach domain writes without stages 1 to 13.

---

## Conflicts sent to Section 19 (Craig), not resolved here

1. Prompt 49 claims Prompt 48 is implemented. It is not. Identity remains
   fail-closed until Craig lands Prompt 48 or Prompt 57.
2. Prompt SQL for `interop.canonical_version` omits `organisation_id`;
   Section 12 and acceptance 5 require it on every interop table. This build
   adds `organisation_id` so tenant coverage and acceptance 5 hold.
3. `vocabulary_map.organisation_id` is nullable (platform-wide maps) while
   tenant tables are normally `NOT NULL`. Mechanism built as specified in
   Section 9.1. Who may write a platform-wide row is governance.
4. External identifier columns on existing entities are not migrated into
   `mpi.external_identity` because that table does not exist.
5. Two band-derivation implementations (SQL + JS mirror) pre-exist. Not
   consolidated; no third copy added.
6. Raw payload retention, replay who-may, terminology authorities, FHIR
   profile, idempotency window, marketplace, EMR contracts, residency of
   subprocessors, and the PIA remain Section 19 as written.

## Human gates (untouched)

`package.json`, consent/legal/pricing copy, email templates, credentials, and
live schema apply. Schema files only. Athena does not ship.
