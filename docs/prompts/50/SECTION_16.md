# Prompt 50 Section 16: required build output

Tip of this branch after the build. Schema files only. Not shipped. Not
applied to any live database. No em dashes or en dashes anywhere.

Do not read intended work as completed work. Status below is what was
actually built and proven.

---

## 1. Summary of what was built

Prompt 50 foundations were already largely present on main as the Prompt 51
substrate (`platform/db/0000` to `0018`). This build:

- Recorded Section 1 evidence and real STOPS before writing code.
- Extended that substrate with `0019` (pg_trgm, provision, lifecycle,
  authorize, flags, break glass activation, Alberta consent split,
  partition watch, event schema registry, jurisdiction_deadline shared
  ref, replay-retention config key with no value).
- Added `platform/service/*` so tenant context, authorisation, consent,
  config, flags, audit, events, the release path, reconstruction, health,
  logging and metrics exist as testable contracts.
- Added CI greps, a down file for 0019, a bad-fixture proof, expand and
  contract proof, and `deploy/prompt50-foundations.test.mjs`.
- Added `/api/health-live`, `/api/health-ready`, `/api/health-dependencies`.
- Updated `docs/platform/developer-guide.md`.

Did not invent MPI, Azure, adapters, screens, purge jobs, break-glass
holders, or counsel-owned consent wording. Did not attach
`guard_signed_immutable` to live `clinical.wcb_report`. Did not
range-partition `events.domain_event` or `audit.record`.

## 2. Section 1 answers

See `docs/prompts/50/SECTION_1.md`. Defects and disposition:

| Defect | Fixed or deferred |
|---|---|
| No reusable Prompt 50 architecture scan | Fixed (`platform/service/architecture.mjs`) |
| Clinic-facing errors can leak codes on old APIs | Fixed for new services. Deferred for hub APIs |
| `pg_trgm` absent | Fixed in 0019 (files only) |
| `clinical.practitioner` has no tenant column | Deferred (E2 / Prompt 48) |
| Hub `public.*` uses `tenant_id` | Deferred (schema boundary) |
| `clinical.jurisdiction_deadline` unenforced | Fixed when the table is present. Absent in the current clinical apply order |
| `clinical.ai_*` singleton integer keys | Deferred (Prompt 44) |
| Live hub connects as `service_role` | Deferred (infrastructure) |
| No down files on 0000 to 0018 | Deferred. 0019 has a down |
| Consent booleans on `clinical.consent` | Deferred (Prompts 43/44 tests) |
| No structured observability | Fixed as mechanisms, not a live sink |
| Azure assumption mismatch | STOP. Not invented |
| No secret manager | STOP for live wiring. Env mechanism built |
| Backup/PITR unverified | Section 17 item 7. Not resolved |
| Unique key vs monthly partition | STOP. Watch mechanism only |

## 3. Files created

- `docs/prompts/50/SECTION_1.md`
- `docs/prompts/50/STOPS.md`
- `docs/prompts/50/SECTION_16.md`
- `platform/db/0019_prompt50_foundations.sql`
- `platform/db/downs/0019.sql`
- `platform/db/tests/prompt50_foundations.sql`
- `platform/db/tests/prompt50_expand_contract.sql`
- `platform/ci/fixtures/bad_no_tenancy.sql`
- `platform/service/errors.mjs`
- `platform/service/tenant_context.mjs`
- `platform/service/metrics.mjs`
- `platform/service/logging.mjs`
- `platform/service/tracing.mjs`
- `platform/service/secrets.mjs`
- `platform/service/lifecycle.mjs`
- `platform/service/provision.mjs`
- `platform/service/authorize.mjs`
- `platform/service/consent.mjs`
- `platform/service/config.mjs`
- `platform/service/flags.mjs`
- `platform/service/audit.mjs`
- `platform/service/events.mjs`
- `platform/service/release.mjs`
- `platform/service/reconstruction.mjs`
- `platform/service/break_glass.mjs`
- `platform/service/health.mjs`
- `platform/service/uuid.mjs`
- `platform/service/architecture.mjs`
- `platform/service/observability_spec.mjs`
- `deploy/prompt50-foundations.test.mjs`
- `deploy/api/health-live.js`
- `deploy/api/health-ready.js`
- `deploy/api/health-dependencies.js`

## 4. Files modified

- `platform/ci/check_tenant_coverage.sql` (shared refs for `events.event_schema` and `clinical.jurisdiction_deadline`)
- `.github/workflows/platform.yml` (DELETE grep, down-file check, bad fixture)
- `docs/platform/developer-guide.md`

No `package.json`. No email template. No Prompt 39 to 46 test file.

## 5. Database migrations added

| File | Down |
|---|---|
| `platform/db/0019_prompt50_foundations.sql` | `platform/db/downs/0019.sql` (drops only 0019 objects; does not DELETE clinical, audit, consent or event data; leaves `pg_trgm` installed) |

0000 to 0018 unchanged. No live apply.

## 6. Schemas, tables, indexes, constraints, triggers, policies created

New in 0019:

- Extension: `pg_trgm`
- Tables: `platform.permission_definition`, `platform.role_permission`,
  `events.event_schema` (shared read policy), `platform.partition_watch`
- Functions: `tenancy.lifecycle_privileges`, `tenancy.assert_allowed_transition`,
  `tenancy.transition_status`, `tenancy.provision_tenant`, `platform.authorize`,
  `config.set_flag`, `config.evaluate_flag`, `platform.activate_break_glass`,
  `platform.expire_break_glass`, `platform.board_submission_permitted`,
  `platform.employer_release_permitted`, `platform.migrations_current`,
  `platform.ensure_future_partitions`, `platform.is_range_partitioned`
- Policy: `event_schema_shared_read`; `jurisdiction_deadline_shared_read` when
  that table exists
- Config definition: `events.replay_retention` (required, value unset)

No new trigger on live `clinical.wcb_report`.

## 7. Database roles and grants

No new roles. Existing `app_clinical`, `app_employer`, `app_release`,
`app_readonly`, `migrator` unchanged in 0001.

0019 adds EXECUTE on the new functions to `app_clinical` (and readonly /
release where listed in the file). SELECT on the new catalogs to
`app_clinical` / `app_readonly`. `app_employer` still has no grant on
`clinical`.

## 8. Services and internal contracts

`platform/service/*` as listed above. Contracts: tenant context from the
principal only; authorize before repository; `consentState` four arguments;
release path is the only clinical-to-employer writer; reconstruction by
stored artifact and versions; health live vs ready vs dependencies.

No public clinic screen. No HTTP API beyond health.

## 9. CI checks added, and the fail condition

| Check | Fails when |
|---|---|
| Existing allow-list count | entries != 1 |
| Existing employer-wall grep on `platform/db/0*.sql` | a file mentions both `clinical.` and `employer.` |
| Existing tenant coverage | missing tenant column, RLS, FORCE or policy on an enforced table |
| Existing flag expiry | any `retire_by` before today |
| New DELETE grep | `DELETE FROM clinical\|audit\|consent\|events.` in `0*.sql` |
| New down-file check | a platform migration numbered 0019 or later has no `downs/<ver>.sql` |
| New bad fixture step | coverage still passes after `bad_no_tenancy.sql` |
| `deploy/prompt50-foundations.test.mjs` (suites.yml) | any assertion in that file fails |

## 10. Tests added, mapped to acceptance criteria

| Test | Criteria |
|---|---|
| `platform/db/tests/prompt50_foundations.sql` | 2 (allow-list already CI), 9, 10, 11, 15, 21-23, 38, 40, 41 (local detect), 43 (watch), 48 (migrations_current), 52 |
| `platform/db/tests/prompt50_expand_contract.sql` | 40 expand/contract |
| Existing `tenancy_isolation.sql` (unchanged) | 3, 4, 5, 7, 8 |
| Existing `employer_disclosure.sql` | 12, 14, 16 |
| Existing `consent_ledger.sql` | 21, 22 |
| Existing `events_outbox.sql` | 29, 30, 31, 32 |
| Existing `audit_chain.sql` | 27 |
| Existing `wcb_report_amendment.sql` | 19 |
| Existing `config_framework.sql` | 34-37 |
| Existing `immutability_substrate.sql` | 16 (append-only grant and trigger). Not used as proof of `guard_signed_immutable` on the live report |
| `deploy/prompt50-foundations.test.mjs` | 2, 6, 7, 8-11, 13, 15, 20-28, 31-39, 42, 45-48, 52, 54 |
| `platform.yml` bad fixture | 41 |
| Unchanged clinical/engine `*.test.mjs` | 50 (all passed locally) |

## 11. Documentation added

Section 1, STOPS, Section 16, developer-guide addendum (tenancy, adding a
table, employer wall, immutability, consent, audit, events, config/flags,
database standards, observability, local two-tenant provision, five
must-be-zero counters).

## 12. Metrics, traces, logs, health, dashboards, alerts

Configured as code, not as a live vendor sink (Canada residency STOP):

- Metrics: `platform/service/metrics.mjs` (required names + must-be-zero)
- Traces: `tracing.mjs` (W3C traceparent, identifier attributes)
- Logs: `logging.mjs` (JSON allow-list)
- Health: service helpers + three deploy API files
- Dashboards and alerts: `observability_spec.mjs` (four dashboards, page
  vs ticket)

## 13. Security and privacy controls, and how each is enforced

| Control | Enforcement |
|---|---|
| Tenant isolation | RLS + FORCE + WITH CHECK + CI coverage |
| Allow-list of one | File + CI count |
| Client asserted tenant | Service ignores header/query/body |
| Employer wall | Grants + CI grep + architecture scan |
| Append only | Grant revoke + `guard_append_only` |
| Consent ledger | Resolver + NOT NULL consent id on release |
| Alberta board split | `board_submission_permitted` / `employer_release_permitted` |
| Audit chain | `append_record` + `verify_chain` |
| Outbox after commit | `events.emit` |
| Flag expiry | `check_flag_expiry.sql` |
| Control flags | `assertFlagAllowed` |
| Secrets | Environment only, fail closed |
| Logging PHI | Allow-list + CI assertion |
| Break glass | Time window, alert, audit. No holders |

## 14. Acceptance criteria status

A criterion is passed only when a test proves it. Failed means the
written rule is not fully true in this repo. Not attempted means the
build did not try that proof, usually because of a STOP.

1. Every in-scope table (Prompt 50a Decision 2: schemas Prompt 51 owns and creates, plus any table that will ever hold identifiable worker, patient, or tenant data) has tenant column, RLS, FORCE, policy: **failed**. Hub, site, demo, and worker tables are a decided schema-boundary exclusion (see `docs/prompts/50a/NON_PLATFORM_INVENTORY.md`), not a failed every-table claim. Remaining in-scope gaps still fail: `clinical.practitioner` (E2 / Prompt 48), Prompt 44 `clinical.ai_runtime` and `clinical.ai_audio_retention` singletons.
2. Allow-list exactly one entry (`mpi.person`); a second fails: **passed**
3. Application role is not table owner / RLS not bypassed: **passed** in the platform harness (`set role app_clinical`). Live hub `service_role` is unchanged (deferred).
4. Org A cannot read/write/delete org B across every in-scope table: **passed** for enforced tenant tables that already have isolation tests. Hub `public.*` is excluded by Prompt 50a Decision 2, not an unscoped every-table miss. Isolation is proven on enforced tenant tables only.
5. WITH CHECK rejects another tenant's identifier: **passed**
6. Header, query and body organisation_id ignored: **passed**
7. No tenant context fails; `tenant_context_missing_total` increments: **passed**
8. Location cannot reference another org's region: **passed**
9. Provisioning is one transaction; a failed step leaves nothing: **passed**
10. Lifecycle only from an allowed predecessor; audit and event: **passed**
11. Suspended can read and cannot write; closed cannot write or sign in; no data removed: **passed**
12. Employer role permission error on SELECT clinical: **passed** (no grant; existing wall tests)
13. CI finds zero dual-schema references outside the release path: **passed** for `platform/db/0*.sql`. Release logic is in `platform/service/release.mjs`.
14. Null `consent_ledger_entry_id` fails at the database: **passed**
15. Permission check at the service boundary; denial audited: **passed**
16. UPDATE/DELETE on append-only tables rejected by grant and trigger: **passed**
17. Signed report cannot be modified as app, migrator or direct SQL: **failed** on live `clinical.wcb_report`. The live trigger is held because attaching `guard_signed_immutable` would break Prompt 42. This PR's probe (`prompt50_expand_contract.sql`) is expand and contract dual-write only. It does not prove `guard_signed_immutable`.
18. Only permitted signed change is status to superseded with `superseded_by_id`: **not attempted** on the live table. The live trigger is held for Prompt 42. This PR's probe does not prove `guard_signed_immutable`.
19. Superseding report without `amendment_reason` rejected: **passed**
20. Signed report reconstructs byte identically after reference versions change: **passed** (service helper; not a live HL7 byte compare)
21. `consent_state` grant, revoke, re-grant at three datetimes: **passed**
22. Resolver missing purpose, recipient or at_datetime fails: **passed**
23. Board submission succeeds while employer release is blocked: **passed**
24. Revocation is not retroactive: **passed**
25. Clinical read writes audit `view` with `subject_person_id`: **passed** (service helper). Not wired to a live clinical HTTP read.
26. Disclosure audit has lawful basis; missing basis fails closed: **passed**
27. Hash chain verifies; altered row detected: **passed**
28. `correlation_id` on audit, event and log for one request: **passed** in process. Not an HTTP end-to-end.
29. State change and event commit together; rollback leaves no event: **passed**
30. No external dispatch inside the transaction; outbox pending at commit: **passed**
31. Draft event type has no external subscriber: **passed**
32. Two events for one aggregate cannot share `sequence_in_aggregate`: **passed**
33. Removing or renaming an event field fails CI: **passed** (registry + `assertSchemaAdditive`)
34. Required config missing fails; counter increments: **passed**
35. Config resolves most specific first across four scopes: **passed**
36. Setting a key at a disallowed scope is rejected: **passed**
37. Config and flag changes audit previous, new, actor, reason: **passed**
38. Feature flag past `retire_by` fails the build: **passed**
39. No flag can disable tenancy, immutability, consent, audit or authorisation: **passed**
40. Migration up, down, up with integrity: **passed** for 0019. Not replayed for 0000 to 0018.
41. Fixture table without tenancy fails CI: **passed**
42. No migration DELETE against clinical, audit, consent or event: **passed**
43. `events.domain_event` and `audit.record` range partitioned by month; missing future partition alerts: **failed** (unique constraint STOP). `platform.ensure_future_partitions` records `not_partitioned`.
44. No sequential integer PK; no natural PK: **failed** for pre-existing exceptions (`audit.ai_generation`, hub `bigserial`, Prompt 44 singletons). New 0019 tables use UUID.
45. No UUID v7 in API responses or documents: **passed** (scan; health APIs return no ids)
46. No personal information in logs, metrics, traces, URLs or error responses for a representative clinical flow: **passed** for the new service flow. Not a live clinic session.
47. Logging a clinical or person field fails CI: **passed**
48. `/health/live` has no dependency check; `/health/ready` fails when migrations are not current, without restart: **passed**
49. Five must-be-zero counters are zero across the full suite: **failed** as a suite-wide zero. Tests increment them on purpose to prove the increment. They are not a live process.
50. Every Prompt 39 to 46 test passes unchanged: **passed**. All `clinical/engine/*.test.mjs` passed locally. No test file from those prompts was edited.
51. Repository and artifact scans find zero committed credentials: **passed** (test fixtures only)
52. Break glass is time bounded, expires, alerts, audited on use: **passed**. Holders unset.
53. Developer documentation covers Section 13: **passed** (`docs/platform/developer-guide.md`)

## 15. Known limitations

- Live apply is not done. Hermes is not named.
- Application service is in-process contracts, not a running multi-service mesh.
- mTLS, short-lived environment-scoped tokens, and replica routing are not built.
- Azure Canada Central / Canada East is not the stack.
- Monthly partitioning is not applied.
- Live signed-report trigger is not attached.
- Hub tenancy remains `public.tenants.tenant_id`.
- `clinical.consent` booleans remain.
- Counters are in-memory in the Node suite, not a metrics backend.

## 16. Open items (Section 17 plus genuine conflicts)

Section 17, unchanged and not resolved:

1. Retention and purge policy per data family. No purge job.
2. One custodian or many under HIA s.66 (organisation vs location).
3. Approved consent wording. Table empty of counsel text.
4. Verbal witnessed consent for employer disclosure in Alberta.
5. Event replay retention window. Key exists, value unset.
6. Who holds break glass, under what approval, for how long.
7. Whether backups and PITR meet residency.
8. Privacy impact assessment before real health information.

Genuine conflicts found in this build:

- Azure assumption vs Vercel + Supabase.
- Range partition vs unique constraints that omit `occurred_at`.
- Section 5.4 signed immutability vs Prompt 42 `signed` to `submitted`.
- Prompt 48 MPI assumed by later prompts and still absent.

## 17. Anything that could not be implemented as written

- Azure primary/secondary regions: stack is not Azure. STOP.
- Monthly declarative partitioning of the two append-only tables: would
  weaken uniqueness in PostgreSQL 15+. STOP.
- `guard_signed_immutable` on live `clinical.wcb_report`: would break
  Prompt 42. STOP.
- `mpi.person`: reserved only. Not created.
- Consent `body_text` seed: counsel-owned. Not seeded.
- Purge jobs, break-glass holders, screens, MPI, adapters, gateway, board
  integration, clinic features, billing: out of scope.
- Live secret manager and live apply: governance.

Local proof: Postgres 16 (CI remains Postgres 15), all platform SQL tests
green, all `clinical/engine` tests green, prompt47/49/50 Node suites green.
Athena does not ship.
