# Prompt 50 Section 1: prerequisite inspection

Inspected on 2026-09-16 from tip `94d99347c712da80c125caa6d4a3fe1b4c75d2e0`
(`Fail closed on omitted authorship, answered, and axis_source. (#149)`).
Read only for this document. No write, seed, live apply, or credential use
in this inspection.

**Headline.** Prompt 50 (physician-stream old number 47, repo comments still
say Prompt 51) is largely already present on main: `platform/db/0000` through
`0018`, tenant coverage CI, and `docs/platform/developer-guide.md`. Prompt 47
clinic and enterprise scaffolding is present (`clinic_ops`, `hierarchy.mjs`).
Prompt 49 interop substrate is present (`0018_interop.sql`). Prompt 48 Master
Person Index is **not** present. This build does **not** invent MPI, a second
hierarchy, or Azure Canada infrastructure.

No em dashes or en dashes anywhere.

---

## 1.1 Repository

### Check 1. Language, framework, package manager, versions

There is no root `package.json`. Engine and platform service code is plain
ESM (`.mjs`) on Node 20. SQL is PostgreSQL.

| Package root | Role | Versions (from the file) |
|---|---|---|
| `deploy/package.json` | Vercel static site gate | `@vercel/functions` 3.7.6, `xmllint-wasm` 4.0.2 |
| `hub-roles/package.json` | Hub role-select bundle | React ^18.3.1, Vite ^5.4.0, Framer Motion ^11.3.0 |
| `worker-app/package.json` | Worker app | Next.js 14.2.5, React 18.3.1, TypeScript ^5.5.0, `@supabase/supabase-js` ^2.45.0 |
| `clinical/db/package.json` | WCB seed generator | `xlsx` (CDN tarball) |
| `clinical/tools/wcb-code-list-loader/package.json` | Prompt 40 workbook loader | `xlsx` 0.18.5 |

CI Node version: `.github/workflows/suites.yml` pins **Node 20**.
`.github/workflows/platform.yml` and `exposure-proof.yml` use **Postgres 15**.
Edge functions run on Deno with `npm:@supabase/supabase-js@2`.

**Defect.** None for this check.

### Check 2. Directory and module layout (preserve; do not restructure)

| Path | Role |
|---|---|
| `platform/db/` | Platform SQL migrations `0000` to `0018`, tenant allow-list, SQL tests |
| `platform/ci/` | Coverage, flag expiry, role setup |
| `clinical/db/` | Physician schema and seeds `001` to `022` |
| `clinical/engine/` | Pure deterministic logic, no live database |
| `clinical/tools/` | Workbook loaders and verifiers |
| `supabase/` | Hub migrations and Deno edge functions |
| `deploy/` | Static site, Vercel APIs, Node suites |
| `docs/`, `specs/` | Documentation and prompt specs |
| `worker-app/`, `hub-roles/` | Visitor surfaces (out of scope here) |

This build adds files only under existing trees: `platform/db/0019_*.sql`,
`platform/db/downs/`, `platform/db/tests/`, `platform/ci/`,
`platform/service/` (new folder under the existing `platform/` root),
`deploy/prompt50-foundations.test.mjs`, `deploy/api/health-*.js`,
`docs/prompts/50/`, and an update to `docs/platform/developer-guide.md`.
No new top-level tree. No second tenancy hierarchy.

**Defect.** None. Layout preserved.

### Check 3. Architecture test framework (forbidden import)

**Partial.** There is no single reusable forbidden-import matrix for the whole
repo. Ad hoc gates exist:

- `deploy/prompt49-canonical.test.mjs`: interop forbidden imports, bare
  `provenance`, no Worker entity, no new measurement table, identity bypass
- `deploy/bedrock_canada_guard.test.mjs`: forbidden Bedrock regions
- `deploy/ai_boundaries.test.mjs`: sign path must not invoke a model adapter
- `platform.yml` shell greps: tenant allow-list count; no `platform/db/0*.sql`
  file referencing both `clinical.` and `employer.`
- `deploy/prompt47-clinic-ops.test.mjs`: dash hygiene on Prompt 47 engines

**Defect.** Sections 4 and 12 need a Prompt 50 architecture scan (employer
wall outside the release path, service-boundary authz, flag call sites must
not gate security, logging must not pass clinical or person fields, client
asserted tenant ignored). **Fixed in this build** by
`platform/service/architecture.mjs` plus `deploy/prompt50-foundations.test.mjs`.

### Check 4. CI on every commit, custom check can fail the build

| Workflow | Trigger | What fails the build |
|---|---|---|
| `.github/workflows/suites.yml` | push and pull_request to `main` | any `deploy/*.test.mjs` non-zero exit |
| `.github/workflows/platform.yml` | push/PR paths `platform/**` | allow-list count, employer-wall grep, SQL RAISE, flag expiry |
| `.github/workflows/exposure-proof.yml` | hub SQL | exposure proofs |
| `.github/workflows/xsd-crosscheck.yml` | HL7 XSD | structural XSD mismatch |

Mechanism: GitHub Actions, `psql -v ON_ERROR_STOP=1`, Node `process.exit`.
Custom checks are already first class.

**Defect.** `platform.yml` path filter means a Prompt 50 change that only
touches `deploy/` or `docs/` would not run the SQL gate. Suites still run.
**Deferred:** do not widen the path filter in a way that rewrites an
unrelated workflow contract; new deploy tests are picked up by `suites.yml`.
SQL files under `platform/` still trigger `platform.yml`.

### Check 5. Test framework and naming convention

| Kind | Convention | Example |
|---|---|---|
| Node suite | `deploy/<name>.test.mjs`, `ok(name, cond)`, increment pass/fail, exit 1 | `deploy/prompt47-clinic-ops.test.mjs` |
| Engine unit | `clinical/engine/<name>.test.mjs` same `ok` helper | `clinical/engine/consent.test.mjs` |
| Platform SQL | `platform/db/tests/<topic>.sql`, `\set ON_ERROR_STOP on`, `RAISE EXCEPTION 'FAIL: ...'` | `platform/db/tests/tenancy_isolation.sql` |
| Hub SQL | `supabase/tests/*.sql` | `exposure_proof.sql` |

This build follows those conventions. It does **not** modify any test from
Prompts 39 to 46.

**Defect.** None.

### Check 6. Error handling convention (Section 0.4 item 4)

Two conventions exist:

1. Engine: `namedError(code, message)` in `clinical/engine/clinic_ops_util.mjs`.
   Codes are internal (`JURISDICTION-MISSING`). Messages are plain language.
2. HTTP (`deploy/api/*.js`): JSON `{ error }` with 4xx/5xx. Some paths return
   internal codes to the caller.

Section 0.4: a clinic-user error states what happened and what to do. No
status codes, stack traces, or internal identifiers in that surface.

**Defect.** HTTP APIs can return raw `{ error }` strings and engine codes.
**Fixed for new Prompt 50 services** via `platform/service/errors.mjs`
(`toClinicMessage` strips codes and stacks). Existing hub APIs are **deferred**
(out of scope: do not rewrite Prompts 39 to 46 surfaces).

---

## 1.2 Database

### Check 7. Database engine and version

**PostgreSQL 15.** Evidence: `.github/workflows/platform.yml` service
`image: postgres:15`. Clinical and hub CI use the same image. Live store is
Supabase managed Postgres (`G1_AUDIT_REPORT.md` Section 2). Not Azure SQL,
not MySQL.

**Defect.** None. Not a stop. The Azure assumption is a separate check (21).

### Check 8. pg_trgm extension

**Absent.** Grep of `*.sql` for `pg_trgm` and `CREATE EXTENSION` in
`platform/db` and `clinical/db` returns no `pg_trgm`. The old stream Prompt 48
requires it. The extension is available on Postgres 15 and typical Supabase
projects, but it is not created in this repo.

**Defect.** Missing extension. **Fixed in this build** by
`CREATE EXTENSION IF NOT EXISTS pg_trgm` in `platform/db/0019_prompt50_foundations.sql`.
Files only. Not applied live.

### Check 9. Every existing table and whether it carries a tenant column

Enumerated from `create table` in `platform/db`, `clinical/db`, and
`supabase/migrations`. Probe and shim tables are omitted.

#### Platform and clinic_ops (tenant isolated unless noted)

| Table | Tenant column | Notes |
|---|---|---|
| `tenancy.organisation` | isolated by `id` | Root. Not an allow-list entry |
| `tenancy.region` | `organisation_id` | Unique `(id, organisation_id)` |
| `tenancy.location` | `organisation_id` | Composite FK to region+org |
| `consent.text_version` | none (shared ref) | Section 3.7 |
| `consent.ledger_entry` | `organisation_id` | Append only |
| `audit.record` | `organisation_id` | Hash chain |
| `events.domain_event` | `organisation_id` | Append only |
| `events.subscription` | `organisation_id` | |
| `events.outbox` | `organisation_id` | Mutable status |
| `config.definition` | none (shared ref) | |
| `config.value` | `organisation_id` null only when global | |
| `config.feature_flag` | none (shared ref) | |
| `config.feature_flag_rule` | `organisation_id` null only when global | |
| `employer.disclosure_release` | `organisation_id` | No FK to clinical |
| `employer.published_restriction_set` | `organisation_id` (0013 retrofit) | |
| `employer.duty_match_line` | `organisation_id` (0013 retrofit) | |
| `clinic_ops.*` (10 tables) | `organisation_id` | 0017 |
| `interop.*` (10 tables) | `organisation_id` (vocab map nullable) | 0018 |
| `platform.schema_migration` | none | Metadata only, no PHI |

#### Clinical tenant retrofits (0010, 0011)

`clinical.worker`, `wcb_case`, `wcb_report`, `wcb_report_field`,
`wcb_submission`, `measurement_draft`, `clinic`, `clinic_batch_schedule`,
`consent`, plus the functional measurement family and restriction tables:
`organisation_id` added. RLS + FORCE + policy.

#### Clinical shared reference (0009)

Jurisdiction, code lists, forms, fees, holidays, capability, error catalogue,
OBX, HL7 map, axis map, restriction codes: no `organisation_id` by design
(Section 3.7). RLS + read-all policy, not FORCE.

#### Tables without a tenant column (migration items or explicit exclusions)

| Table | Disposition |
|---|---|
| `mpi.person` | **Does not exist.** Single allow-list reservation only. Do not create |
| `clinical.practitioner` | No `organisation_id`. E2 global person. Coverage check excludes it. Deferred pending Prompt 48 |
| `clinical.jurisdiction_deadline` | Composite natural key. Not in coverage. Shared-ref candidate |
| `clinical.ai_runtime` | Singleton `smallint` PK, no tenant column |
| `clinical.ai_audio_retention` | Singleton `smallint` PK, no tenant column |
| `audit.event` | Retrofitted in 0012 (tenant + RLS) |
| `audit.ai_generation` | Retrofitted in 0012; still `bigserial` PK |
| Hub `public.*` | Uses `tenant_id`, not `organisation_id`. Excluded by schema boundary (Prompt 50a Decision 2). Not a second allow-list entry |
| `worker.*` | Worker-app schema. Excluded by schema boundary |
| `public.marketing_leads` | `bigserial` PK, no tenant column (marketing) |
| `public.access_log` | `bigserial` PK |
| `public.access_codes` | Site gate |

**Defects found.**

1. `clinical.practitioner` has no tenant column and is not the mpi.person
   exception. **Deferred** (E2 + Prompt 48). Do not add a second allow-list
   entry.
2. Hub `public.*` uses `tenant_id` and is a parallel tenancy model.
   **Deferred.** Do not fork a second hierarchy and do not rewrite the hub
   in this prompt.
3. `clinical.jurisdiction_deadline` is unenforced. **Fixed** by registering
   it as shared reference in coverage after enabling RLS in 0019.
4. `clinical.ai_runtime` and `clinical.ai_audio_retention` are Prompt 44
   singletons with integer keys. **Deferred** (do not modify Prompts 39 to 46
   objects to make this pass).

### Check 10. Application connect role (owner or superuser)

Platform roles in `0001_platform_roles.sql`: `app_clinical`, `app_employer`,
`app_release`, `app_readonly`, `migrator`. All `NOLOGIN`. Grants are
least privilege. SQL tests `set role app_clinical` so RLS applies.

Live hub and edge functions use Supabase `service_role` and `anon` /
`authenticated` (`supabase/functions/*`, `deploy/api/*`). `service_role`
bypasses RLS.

**Defect.** The live application (hub, edge) connects with a role that can
bypass row level security. That blocks Section 3.4 for those paths until
they are moved onto `app_*`. **Not fixed here** (rewriting live connection
strings is infrastructure / Gary). New platform SQL and services assume
`app_*` only. Mechanism is present. Wiring is deferred.

### Check 11. Migration tool, convention, reversible today

| Stream | Convention | Reversible |
|---|---|---|
| Platform | `platform/db/0000` to `0018` numbered files, ledger `platform.schema_migration` | **No down files today** |
| Clinical | `clinical/db/NNN_migration_*.sql` / seeds, custom apply order in `platform.yml` | No downs |
| Hub | Supabase timestamped `supabase/migrations/*.sql` | Supabase down not used |

CI applies clinical in a non-lexical order, then `platform/db/0*.sql` in
lexical order. Migrations are idempotent `IF NOT EXISTS` / `ON CONFLICT`.
Append only: ALTER, never drop in place.

**Defect.** No down migrations on 0000 to 0018. Section 10.3 requires a down
unless it would destroy retained clinical data. **Fixed for new files**
(`platform/db/downs/0019.sql`). **Deferred** for 0000 to 0018 (do not
rewrite applied-history files).

### Check 12. Primary key strategy

Platform and clinical entity tables: `uuid primary key default gen_random_uuid()`
(v4). Application-generated ids are used in tests (`insert ... id = '...'`).

Exceptions (sequential or natural keys):

| Object | Key | Status |
|---|---|---|
| `audit.ai_generation` | `bigserial` | Predates 10.2. Noted in `0012_retrofit_audit.sql` |
| `clinical.ai_runtime`, `ai_audio_retention` | `smallint` singleton | Prompt 44 |
| `clinical.jurisdiction_deadline` | `(jurisdiction_code, deadline_kind)` | Natural composite |
| `clinical.jurisdiction` | `code` natural | Shared ref |
| `public.marketing_leads`, `access_log` | `bigserial` | Hub |
| `cron.job` shim | `bigserial` | CI only |

UUID v7 is permitted only on `events.domain_event` and `audit.record` and
must never be exposed. Today both use `gen_random_uuid()` (v4).

**Defect.** Sequential keys on the exceptions above. **Deferred** for
pre-existing tables. New Prompt 50 tables use UUID. CI scan fails a new
serial PK on enforced platform schemas.

### Check 13. Row level security today

FORCE + policy on: tenancy (3), consent.ledger_entry, audit.record,
events (3), config.value and flag_rule, employer.disclosure_release,
clinic_ops (10), interop (enforced), retrofitted clinical tenant and
immutable tables, retrofitted employer view and physician audit tables.

Shared refs: RLS enabled, not FORCE.

Hub `public.*`: RLS exists, policies use `jwt_tenant_id()`, not
`app.organisation_id`.

**Defect.** FORCE is not universal on hub or on unenforced clinical leftovers
(`practitioner`, `ai_*`, `jurisdiction_deadline` before this build).
**jurisdiction_deadline fixed** in 0019. Others deferred as above.

### Check 14. Append-only tables: grant revoke vs avoided in code

| Table | Grant revoke | Trigger |
|---|---|---|
| `events.domain_event` | UPDATE/DELETE/INSERT revoked; write via `events.emit` | `tr_domain_event_append_only` |
| `audit.record` | INSERT/UPDATE/DELETE revoked; write via `audit.append_record` | `tr_record_append_only` |
| `consent.ledger_entry` | UPDATE/DELETE revoked | `tr_ledger_entry_append_only` |
| `employer.disclosure_release` | UPDATE/DELETE revoked | `tr_disclosure_release_append_only` |
| Functional measurement family | INSERT only + blocking trigger (clinical 011 + 0011) | Yes |
| `audit.event` | Physician-stream revoke + trigger | Yes |

Avoided-in-code does not count. The tables above revoke at the role level
**and** attach `platform.guard_append_only` (or the physician equivalent).

`events.outbox` is mutable by design (dispatch status). No DELETE grant.

**Defect.** None for the platform append-only set. Hub `public.audit_log`
and `worker.audit_log` are not under these grants. Deferred (schema boundary).

---

## 1.3 Security

### Check 15. How a request is authenticated; token lifetime

| Path | Mechanism | Lifetime |
|---|---|---|
| Hub | HMAC cookie `ct_session` (`deploy/api/_hub_session.js`) | Short session cookie (site/hub helpers) |
| Site gate | HMAC cookie `ct_site` | Site access cookie |
| Hub users | Supabase Auth (GoTrue) JWT; `users.auth_user_id` | Supabase default JWT (not pinned in repo) |
| Edge functions | Service role key or user JWT | Service role is long lived |
| Clinical engine | No HTTP. Injected store | n/a |
| Platform SQL | `set_config` after `set role` | Transaction scoped when `true` |

**Defect.** Service role is a long-lived secret. Section 4.5 wants short
lived, tenant scoped tokens and mTLS. **Deferred** (infrastructure, not
invented here). New services fail closed without an authenticated principal.

### Check 16. How the acting user's organisation is determined

Platform SQL: `current_setting('app.organisation_id')` set server side.
Interop inbound: connection's `organisation_id`; a mismatched envelope value
is recorded and ignored (`clinical/engine/interop/inbound.mjs`).

Hub: `public.jwt_tenant_id()` reads `tenant_id` from the JWT / app_metadata
(custom access token hook in `20260717123000_auth_hook.sql`). That is the
authenticated principal, not a request header.

Grep did not find a live handler that trusts `X-Organisation` or a body
`organisation_id` as the session tenant for hub auth.

**Defect.** Hub tenancy is `tenant_id` on `public.tenants`, not
`tenancy.organisation`. Two identifiers. **Deferred** (do not fork a second
hierarchy; do not invent a mapping table that would be Prompt 48 / 47
reconciliation). New Prompt 50 context helper **rejects** organisation_id
from header, query, or body and uses only `principal.organisation_id`.

This check does **not** block Section 3.5 for new services.

### Check 17. Authorisation layer

| Layer | Where | UI only? |
|---|---|---|
| Hub RLS | SQL policies on `public.*` | No |
| Prompt 47 | `clinical/engine/authorize.mjs` plus `clinic_ops.permission_grant` | No (engine, not UI) |
| Prompt 43 consent | `clinical/engine/consent.mjs` | No |
| Site / hub admin | HMAC + role checks in `deploy/api` | Mixed |

**Defect.** Permission checks are not a single service-boundary gate in front
of every repository call. UI affordances exist on hub screens (out of scope).
**Fixed for new platform services** (`platform/service/authorize.mjs` must
run before a repository function). Existing hub paths deferred.

### Check 18. Secrets in source, config files, or committed env

Grep for assigned password / api key / token literals:

- Test-only secrets in `deploy/*.test.mjs` (`test-secret-do-not-use-in-prod`,
  `re_test`). Not production credentials.
- `worker-app/.env.local.example` exists (example placeholders).
- No committed `.env` with live values found.
- Live keys are environment variables: `RESEND_API_KEY`,
  `CONTINUUM_SITE_SESSION_SECRET`, Supabase service role (not in repo).
- `G1_AUDIT_REPORT.md` names project ref `agzhnmunodrhsjbogzae` and a
  public Supabase URL inside **applied hub SQL**
  (`schedule_auto_actions.sql`, `escalation_engine.sql`,
  `schedule_wcb_generator.sql`). That is a project URL, not a secret key.

**Defect.** Project URL hardcoded in hub migrations. **Deferred** (do not
edit Prompts 39 to 46 / hub applied SQL). No live secret values in source.
New code reads credentials from the environment only and never prints them.

### Check 19. Employer-facing paths reading clinical tables

Physical wall in platform SQL: `app_employer` has no grant on `clinical`.
CI fails a `platform/db/0*.sql` file that mentions both schemas.

Known crossings (reported, not rewritten):

- Physician employer view (migration 015) is a filtered projection written
  at publish time, then isolated in 0013.
- `clinical/engine/employer_schema.mjs` is the engine filter (not a SQL join).
- Hub `employer_hse_views` historically exposed injury fields
  (`G1_AUDIT_REPORT.md` Section 4). Firewall migration
  `20260815140000_employer_hse_views_p56_firewall.sql` exists.
- `supabase/functions/cases` writes hub domain rows including clinical-ish
  fields. Defect, deferred (Prompt 49 STOPS).

**Defect.** Historical hub views. **Deferred.** New release path is the only
added clinical-to-employer writer and lives outside `platform/db/0*.sql`
so the wall grep stays honest.

### Check 20. Consent stored as a boolean

Grep hits that are booleans:

| Location | Strings | Disposition |
|---|---|---|
| `clinical.consent` | `consent_a_granted`, `consent_b_granted`, `consent_recording_granted` | **Defect.** Prompt 43/44 booleans. Ledger in `consent.*` supersedes. Cutover deferred (do not change Prompts 39 to 46 tests) |
| `clinic_ops.break_glass.clinic_consented` | boolean | Clinic consent **to support access**, not a person-consent ledger. Keep |
| `clinical/engine/consent.mjs` | `consentB.granted` | Engine projection of the boolean table |
| Hub `public.consents` | ledger-ish (`version`, `granted_at`, `revoked_at`) | Parallel hub model, not a single boolean |
| `worker.consent` | worker-app | Schema boundary |
| Demo `consented: true` | `deploy/bridge.js`, worker signup tests, Framer | Demo / projection. Not the platform ledger |

**Defect.** `clinical.consent` booleans remain. **Deferred** (S8 note in
`0004_consent.sql` already recorded this). This build uses
`consent.consent_state` only for new callers. No speculative
`consent.text_version.body_text` seed.

---

## 1.4 Infrastructure

### Check 21. Cloud and regions (assumes Azure Canada Central / Canada East)

**Mismatch. Stop and report.** The running stack is **not Azure**.

Evidence (`G1_AUDIT_REPORT.md` Section 2, `deploy/vercel.json`,
`supabase/`, `clinical/engine/bedrock_canada_guard.mjs`):

| Assumed | Actual |
|---|---|
| Azure Canada Central primary | Vercel host (`continuum-o51l` in audit memory) |
| Azure Canada East secondary | Not present |
| Azure Postgres | Supabase managed Postgres; memory says `ca-central-1`, **unverified** in source |
| Azure regions | Bedrock guard requires `ca-central-1` and is **not live** (Prompt 44 STOP) |

This build does **not** invent Azure resources, ARM templates, or a fake
Canada East pair. Platform mechanisms stay cloud-agnostic (SQL + Node).
See `docs/prompts/50/STOPS.md`. Prompt 50a Decision 1 was GO on this
stack (`docs/prompts/50a/DECISIONS.md`); that is not a claim that Azure
arrived. 50a Decision 1 is RELEASED-from-53-hold. Prompt 53 holds were
released 2026-09-16 by Craig. Platform GO still requires a Craig or
Hermes named path. Do not invent live apply. See `docs/prompts/53/`.

### Check 22. Observability stack and whether data leaves Canada

| Component | Present? | Leaves Canada? |
|---|---|---|
| Sentry / Datadog / PostHog / Vercel Analytics | **No** (G1 Section 2) | n/a |
| `console.log` in edge functions | Yes | Host log region unverified |
| `/api/status` | Operational telemetry only | Vercel region unverified |
| Resend | Signup mail | Provider is outside Canada (audit) |
| Planned Twilio | Mock only | n/a today |

**Defect.** No structured allow-listed logger, no required metrics, no W3C
trace wrapper, no `/health/live|ready|dependencies`. Backup and log residency
are **unverified**. Whether that suffices is Section 17 item 7 (compliance,
not a builder decision). **Fixed as mechanisms** in `platform/service`
(metrics, logging allow-list, tracing, health, alert and dashboard
specifications as data). No third-party sink outside Canada is wired.

### Check 23. Secret manager

**No dedicated secret manager in repo.** Supabase Vault is mentioned in the
audit as a product capability; there is no Vault usage in platform SQL.
Vercel / GitHub Actions environment variables are the runtime store.
Prompt 47 `location.board_credential_key` stores a **key name**, never a
secret.

Section 4.4 says a secret manager is required before least-privilege
credential wiring. **Stop for live wiring.** **Fixed as mechanism:**
`platform/service/secrets.mjs` reads named keys from `process.env` only,
fails closed when missing, and never logs values. Rotation is a config
change, not a code change. Holders and Azure Key Vault are not invented.

### Check 24. Deployment mechanism and two-phase (expand and contract)

| Path | Mechanism |
|---|---|
| Site | Vercel Git integration from `main` (`deploy/vercel.json`) |
| Hub SQL | Supabase migrations (Gary / Hermes apply) |
| Platform / clinical SQL | Files only. `platform.yml` applies them in a throwaway Postgres 15. Live apply is Hermes when named |
| Expand and contract | 0014 is an explicit expand on `clinical.wcb_report`. Contract is deferred (Prompt 42 conflict) |

**Defect.** No automated two-phase migrator. **Fixed as a proven pattern**
in `platform/db/tests/prompt50_expand_contract.sql` (synthetic column
rename: add, dual write, backfill, switch read). Existing 0014 remains the
live expand example. No single migration in this build renames or drops a
column in use.

### Check 25. Backup and point in time recovery

**Unverified from source.** G1: Supabase PITR is tier dependent, not in
repo, last successful restore unknown. Retention window unknown.

Section 17 item 7: whether backups meet residency in every region and tier
is a compliance determination. This inspection reports absence of evidence
only. No purge job. No invented retention period.

**Defect.** No restore drill record, no documented retention. **Deferred**
to Craig and privacy counsel (open item 7). Not a builder value.

---

## Conflicts already resolved above this prompt (do not reopen)

- Prompt 47 E1 landed at `tenancy.*`, not `clinical.organisation`.
- Prompt 49 did not invent MPI. `mpi.person` remains the sole allow-list row.
- Prompt 42 submission statuses outrank Section 5.2's narrower status set
  (0014 expand only; `guard_signed_immutable` is **not** attached to live
  `clinical.wcb_report`).
- Unique `(aggregate_type, aggregate_id, sequence_in_aggregate)` cannot
  include `occurred_at`, so PostgreSQL 15 cannot range-partition
  `events.domain_event` or `audit.record` by month without weakening
  uniqueness. See STOPS.

## Human gates (untouched)

`package.json`, consent wording, legal pages, pricing, email templates,
credentials, live schema apply, occupational seed, live Bedrock.
Schema files only.
