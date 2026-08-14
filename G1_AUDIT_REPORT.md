# G1 DISCOVERY AUDIT REPORT

Read-only discovery audit of the Continuum platform, per Prompt G1. Prepared by Claude Code for Gary, for relay to Craig. Date 2026-08-13.

**No write, delete, region change or configuration change was made anywhere during this audit. No live query was run. No production row content was read.**

## Scope and the governing limitation

**No live-platform access.** The Supabase access token was burned (pasted into chat) and rotated during this audit; no working credential was taken from the environment, and MCP cannot reach the Continuum project. Every fact below is therefore one of:

- `VERIFIED (source)` : proven from a file in the repository (a migration, a config, source code, a CI workflow). The path and line are cited.
- `UNVERIFIED (no live access)` : a fact that can only be confirmed against the running platform (an actual deployed region string, a row count, a live API response, a backup restore history). Named, with the blocker.

The repository holds two distinct build streams, and this matters throughout:

- **The live-platform stream** (`supabase/migrations/*`, `supabase/functions/*`, `deploy/*`, `worker-app/`, `hub-roles/`) is Craig's original numbered build (the G1 citation map's Prompts 10, 27 to 29, 33, 34). This is what the audit is about.
- **The physician stream** (`clinical/db/*`, `clinical/engine/*`) is the later Prompts 39 to 46 work. Prior sessions recorded it as local and CI only. See Section 4 and the prior-claims test at the end.

The **Section 5 urgent finding was already delivered to Gary for same-day relay to Craig, ahead of this report**, per Prompt G1 rule 0.4. It is restated in Section 5 below.

---

## SECTION 2. SERVICE AND HOSTING INVENTORY

| Service | Provider | Role | Account / config reference | Status |
|---|---|---|---|---|
| Application hosting | Vercel | Static site + Node serverless functions (`deploy/`, `deploy/api/*.js`) | `deploy/vercel.json`; deploy target `continuum-o51l` (memory, UNVERIFIED live) | VERIFIED (source) that Vercel is the host; tier UNVERIFIED |
| Database | Supabase (managed Postgres) | Primary datastore, RLS, `pg_cron`, `pg_net`, Vault, Storage | `supabase/` dir; project ref not in `config.toml` | VERIFIED (source) Supabase; project/tier UNVERIFIED |
| Authentication | Supabase Auth (GoTrue) | JWT; `users.auth_user_id -> auth.users`; `jwt_role()`, `jwt_tenant_id()` | `foundation_core.sql` (users table, jwt claim functions) | VERIFIED (source) |
| Object storage | Supabase Storage | Generated WCB documents, signed URLs | `supabase/functions/wcb-generator/index.ts:128,194` (`sb.storage.from(BUCKET)`) | VERIFIED (source) |
| SMS / telephony | Twilio (planned), MOCK today | Intake and escalation SMS | `supabase/functions/cases/index.ts:35-37` ("mock that logs; the Twilio implementation lands in 07.2") | VERIFIED (source) that it is a mock `console.log` today; Twilio NOT wired |
| Email | Resend | Transactional signup notifications | `deploy/api/_notify.js` (`RESEND_API_KEY`, gated behind env) | VERIFIED (source) |
| AI / inference | None wired | No model called anywhere | No `anthropic`/`openai`/`bedrock` call in `supabase/functions` or `clinical/engine` | VERIFIED (source) no model in code (consistent with prior claim: Bedrock drafted, not sent) |
| Scheduled jobs | Supabase `pg_cron` + `pg_net` | `continuum-auto-actions`, `continuum-escalation`, `continuum-wcb-generator`, `framer-demo-reset` | `schedule_auto_actions.sql`, `escalation_engine.sql`, `schedule_wcb_generator.sql`, `framer_demo.sql` | VERIFIED (source) |
| Error tracking / logging / analytics | None found | No Sentry, Datadog, PostHog, Vercel Analytics wired | Grep of `deploy/`, `supabase/functions`, `worker-app` | VERIFIED (source) none in code; platform-native logs UNVERIFIED |
| DNS / CDN | Vercel (implied) | Edge/CDN for the static site | `deploy/vercel.json` | UNVERIFIED live |
| Backups / PITR | Supabase | Point in time recovery (tier dependent) | Not in repo | UNVERIFIED (no live access) |

**Repositories.** One repository: `github.com/craigwolf75-jpg/Continuum`, default branch `main`. Vercel deploys automatically from `main` via the Git integration (memory + `deploy/vercel.json`). VERIFIED (source) for the repo and branch; auto-deploy trigger UNVERIFIED live.

Edge functions present: `cases`, `injuries`, `escalation-engine`, `wcb-generator`, `auto-actions-worker`, `framer-demo`.

---

## SECTION 3. DATA RESIDENCY, SERVICE BY SERVICE

**This is the section the stack decision turns on, and it is the section this audit could least verify, because residency is a live-platform fact.** `supabase/config.toml` carries no region or project id. Environment variables `CONTINUUM_REGION` and `VERCEL_REGION` exist (`deploy/api` code references them) but their values are not in the repository.

| Service | Region | Can health information reach it | Residency label |
|---|---|---|---|
| Supabase database | Memory records project `agzhnmunodrhsjbogzae` as `ca-central-1`; not confirmable from source, and it is unconfirmed whether the hub/worker stream shares that project | Yes, it is the primary PHI store (injuries, recovery_logs, users) | UNVERIFIED (no live region string) |
| Supabase Storage | Same project region as above | Yes, generated WCB documents | UNVERIFIED |
| Supabase Edge Functions | Deno runtime; region not pinned in code and can run outside the project region | Yes (`cases`, `injuries`, `escalation-engine`, `wcb-generator` read PHI with the service role key) | UNVERIFIED, and this is a specific residency risk to confirm |
| Vercel hosting/functions | No region in `vercel.json`; `VERCEL_REGION` env value unknown | The Node functions handle hub auth/session; whether any PHI transits them is UNVERIFIED | UNVERIFIED; Vercel default is not a Canadian region |
| Twilio (SMS) | Not wired; mock provider only today | Today, none (mock logs to console). When wired, intake/escalation SMS carry an app link; message templates should be re-audited before Twilio is enabled | UNVERIFIED (not live); see note below |
| Resend (email) | Resend processes outside Canada | Signup notification emails to `SIGNUP_NOTIFY_TO`; content is signup/admin notification, not confirmed clinical | UNVERIFIED; likely NOT CANADA for the provider |
| Backups / PITR | Supabase project region | Yes (full database) | UNVERIFIED; restore-tested history UNVERIFIED |

**Twilio message content (Section 3.3).** The current provider is a mock (`smsProviderSend` logs to console, `cases/index.ts:36`). The intake SMS carries an app link (`cases/index.ts:199-205`). The message templates in code do not embed a diagnosis or clinical detail in what was inspected, but a full template census should be run against the wired Twilio implementation, which does not yet exist. VERIFIED (source) that SMS is a mock today; live templates UNVERIFIED.

**Conclusion for Section 3: the residency question that the stack decision depends on is UNVERIFIED end to end from source.** Confirming it requires the live Supabase project region string, the Vercel function region, the Edge Function execution region, and the Storage bucket and backup regions, none of which live in the repository. This is the single largest gap in the audit and the one most directly blocking Craig's decision.

---

## SECTION 4. SCHEMA AND CODE CENSUS

### 4.1 Tables (live-platform stream, `public` schema)

23 tables, VERIFIED (source) by enumerating `create table` across `supabase/migrations/*`. Approximate row counts are UNVERIFIED (no live access).

`access_codes`, `access_grants`, `access_log`, `audit_log`, `auto_actions`, `case_metrics`, `consents`, `escalation_checks`, `escalation_keywords`, `escalations`, `framer_demo_state`, `hub_profiles`, `injuries`, `light_duties`, `notifications`, `province_form_codes`, `recovery_logs`, `status_transitions`, `tenants`, `users`, `wcb_notifications`, `wearable_data`, `workers`.

**Flags (VERIFIED source):**
- **Tenant identifier:** the PHI and case tables carry `tenant_id` (users, workers, injuries, recovery_logs, consents, audit_log and others; 9 migration files reference `tenant_id`). Reference lookups (`province_form_codes`) and `framer_demo_state` are not tenant scoped.
- **Row level security:** RLS is enabled broadly (23 `enable row level security` statements across the migrations), with per-role policies keyed on `jwt_role()` and `jwt_tenant_id()`. This live-platform stream DOES enforce RLS, unlike the physician `clinical` stream (which has none; see below).
- **Provenance / authorship:** the live-platform tables carry no `provenance` or `authorship_provenance` column. That concept exists only in the physician stream (`clinical.provenance` enum, migration 017). So the live platform has no clinical-authorship provenance model.

### 4.2 Authentication and role model (Prompt 33)

VERIFIED (source):
- Roles are a Postgres enum `public.user_role = ('worker','hse','employer_admin','wcb_officer','nexus_physician')` (`foundation_core.sql:31`).
- Authorisation is enforced **server side** in the database, through RLS policies and `security_invoker=false` role views, scoped from JWT claims (`jwt_role()`, `jwt_tenant_id()`). This is a strong pattern: the field firewall is structural (forbidden fields are simply not selected in the role views), not a client filter.
- Base PHI tables deny `employer_admin`, `hse`, `wcb_officer`; those roles read only through the role views (`role_case_views.sql`).
- Route guards: hub API routes (`deploy/api/*.js`) use a service-role key server side and session secrets. A full route-by-route guard census was not completed in this pass and is flagged as UNVERIFIED for completeness.

**This is the Prompt 33 model. Prompt 51 (old stream 47) specifies a different one (organisation/region/location tenancy, `app.organisation_id` context, non-owner app role). The two are unreconciled. See Conflicts.**

### 4.3 Consent model (Prompt 10)

VERIFIED (source), `foundation_core.sql:185`:

```
public.consents ( id, tenant_id, user_id, version text, scope jsonb,
                  granted_at, revoked_at, created_at, updated_at, deleted_at )
```

It is **not a bare boolean flag**: it captures a wording `version`, a `scope` (jsonb), `granted_at` and `revoked_at`. **But it is a mutable per (tenant, user) record, not an append only ledger:** it has `updated_at` and a `before update` trigger (`trg_consents_updated`), and revocation is an in-place UPDATE that sets `revoked_at` on the same row rather than a new append only entry. Prompt 51 Section 6 specifies an append only `consent.ledger_entry` with a resolver. **The models differ; this is a confirmed conflict.**

### 4.4 Condition modules (Prompts 27 to 29): measured value vs band/label census

This is a yes/no census, not a judgement. VERIFIED (source):
- `injuries.current_restrictions` : type `text` (`injury_restrictions.sql:11`). A **free-text label**, not a measured value with a unit.
- `injuries.body_part`, `injury_type`, `severity` : classification fields, not measured values.
- `recovery_logs.pain_score`, `mobility_score` : integer 1 to 10 **scores** (`foundation_core.sql:134-135`), ordinal scores, not measurements with units.
- `wearable_data` : sensor data (columns not fully enumerated in this pass).

**Census result:** the live-platform condition modules store restriction **labels** (free text) and 1 to 10 **scores**. They do **not** store functional-capacity measurements with units (kilograms, hours) the way the physician stream (`clinical.functional_axis_value.measured_weight_kg`, migration 011) does. Whether a text restriction label sitting where a measurement belongs violates the "store the measurement, derive the band" one-way door is a judgement for Craig; the census fact is stated.

### 4.5 Worker identity

VERIFIED (source):
- One person table, `public.users`; `public.workers` is a role projection (`workers.user_id -> users.id`). No separate second person entity.
- **Natural key present:** `users.phone` carries a `unique` constraint (`foundation_core.sql`). Phone is used as a uniqueness key.
- `users.auth_user_id -> auth.users` links Supabase auth.
- **Can the same human exist twice:** yes, structurally. There is no cross-tenant or cross-source identity resolution (no Master Person Index). A person at two employers, or re-registering with a different phone or email, produces two `users` rows. This is the identity concern Prompt 52 and the Master Person Index prompt exist to solve, and neither is built (the MPI is absent from the repository).

### 4.6 Prompt 34 de-identification and lockdown

Partial. VERIFIED (source): a grep for dollar-amount patterns and million-CAD figures across `deploy/*.html` and the migrations returned **zero hits**. **UNVERIFIED:** the specific client names Prompt 34 removed are not known to me, so a name-by-name search could not be run. Confirming the lockdown held on those names requires the list Prompt 34 removed. Method stated; result partial.

---

## SECTION 5. THE BLOCKING PRIVACY QUESTION (urgent finding, already relayed)

**Answer: not none. A finding exists and was reported to Gary for same-day relay to Craig ahead of this report.** Restated:

Two role-gated views on the live-platform stream (`supabase/migrations/20260717160000_role_case_views.sql`) expose injury clinical fields to employer-side roles:

- **`public.employer_case_view`** (role `employer_admin`, lines 22 to 52) selects `body_part`, **`injury_type`**, **`severity`**, `current_restrictions` from `public.injuries`.
- **`public.hse_case_view`** (role `hse`, lines 54 to 94) selects all of the above **plus `latest_pain_score` and `latest_mobility_score`** from `public.recovery_logs`.

The role enum confirms `employer_admin` and `hse` are employer-side roles (`foundation_core.sql:31`). The views are `security_invoker=false` (owner owned, bypass base RLS) and self-scope on `jwt_role()` + `jwt_tenant_id()`.

**Method:** every surface an employer-side role can reach was walked against the live schema in source. The base PHI tables deny these roles (VERIFIED, `foundation_core.sql:397`), so the role views are the only read path, and the fields above are what those views select.

**Assessment against Section 5's wording** ("a diagnosis, a symptom, a medication, a clinical narrative, or a restriction value beyond a duty capability statement"):
- The `hse_case_view` `pain_score` and `mobility_score` are unambiguously clinical and are exposed to an employer-side role by design (the view comment calls it "operational need").
- The `employer_case_view` `injury_type`, `severity` and `body_part` are injury classification/detail, not a duty capability statement. For contrast, the physician-stream employer wall (`clinical/db/015`) exposes only `work_status` (fit / fit_with_restrictions / unfit) and duty verdicts, a strictly narrower line.
- `current_restrictions` is free text; its safety depends on populating-code discipline, not the column type.

**Two judgement questions are Craig's:** (1) is `injury_type` / `severity` / `body_part` clinical content beyond a duty capability statement; (2) is `hse` an employer-facing surface for this purpose. If yes to either, this is clinical content reachable from an employer-facing surface.

**UNVERIFIED (no live access):** whether these views are deployed on a live project, whether `employer_admin` / `hse` accounts exist, and whether any real (non-SYNTH) worker data sits behind them.

---

## SECTION 6. CHANGE AND CONFIGURATION PATH

1. **How a change reaches production (VERIFIED source, partial).** Code lands on `main` (`github.com/craigwolf75-jpg/Continuum`); Vercel deploys the site automatically from `main`. Database migrations are applied out of band (manually, via the Supabase Management API or CLI), not through the Git deploy. CI runs four GitHub Actions on push and pull request: `suites.yml` (Node test suites), `exposure-proof.yml` (a `psql` exposure-proof SQL gate), `xsd-crosscheck.yml`, and `platform.yml` (the held Prompt 51 platform migrations against a throwaway Postgres container). Whether a human review gates `main`, and the rollback method, are UNVERIFIED.
2. **Environments (UNVERIFIED live).** Production plus Vercel preview builds are implied. A `framer_demo` schema and a `framer-demo` edge function indicate a demo surface. Whether any non-production environment holds production data could not be determined from source.
3. **Secrets.** All secrets are taken from the environment: Edge Functions use `Deno.env` (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_URL`, `CONTINUUM_NEXUS_TOKEN`, `CONTINUUM_WORKER_SECRET`), and the worker secret is read from Supabase Vault (`schedule_auto_actions.sql:6`); Vercel functions use `process.env` (`CONTINUUM_HUB_SESSION_SECRET`, `CONTINUUM_SITE_SESSION_SECRET`, `CONTINUUM_SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, `CONTINUUM_REGION`, `VERCEL_REGION`). **A scan of the working tree found zero committed live secrets** (the only matches are `worker-app/.env.local.example`, a template, and test fixtures with fake values). A full commit-history scan (by file path only) was not run in this pass and is flagged. **Separately: a Supabase access token was pasted into chat during this audit and has been rotated; it must be treated as burned and confirmed rotated.**
4. **Configuration change path (UNVERIFIED live).** Configuration is changed in code (migrations) and in the database out of band. An `audit_log` table exists (tenant scoped, `employer_admin` reads within tenant). Whether every hand configuration change is recorded, and who may make one, is UNVERIFIED.

---

## CLOSING LIST 1: CONFLICTS CONFIRMED

Against the six conflicts in Prompt G1 Section 1:

1. **Stack and residency (Azure vs Supabase/Vercel/Twilio).** CONFIRMED at the stack level (the platform is Supabase + Vercel + Resend + planned Twilio, not Azure), VERIFIED (source). The residency resolution is UNVERIFIED and is the blocking gap.
2. **Prompt 33 auth/role model vs Prompt 51.** CONFIRMED. The live platform enforces a five-role JWT + RLS model (`user_role` enum, role views); Prompt 51 specifies organisation/region/location tenancy with an `app.organisation_id` context and a non-owner app role. Unreconciled. Evidence: `foundation_core.sql:31`, `role_case_views.sql`.
3. **Prompt 10 consent vs Prompt 51 ledger.** CONFIRMED. The live `consents` table is a mutable versioned record with `granted_at`/`revoked_at` updated in place; Prompt 51 specifies an append only `consent.ledger_entry`. Evidence: `foundation_core.sql:185`, `trg_consents_updated`.
4. **Prompts 27 to 29 measurement vs band one-way door.** CONFIRMED as a census fact: the live condition modules store restriction **labels** (`injuries.current_restrictions text`) and 1 to 10 **scores**, not measurements with units. Whether that violates the door is Craig's judgement. Evidence: `injury_restrictions.sql:11`, `foundation_core.sql:134-135`.
5. **Clinical content on an employer-facing surface.** CONFIRMED as a finding (Section 5), already relayed. `employer_case_view` and `hse_case_view` expose injury classification, and in the HSE case pain and mobility scores, to employer-side roles.
6. **No documented path to production.** CONFIRMED (partial). The path is reconstructable from source (main -> Vercel; migrations out of band; four CI gates) but is not documented, and review, rollback and environment-data questions are UNVERIFIED.

## CLOSING LIST 2: EVERYTHING UNDETERMINED, AND WHAT WOULD UNBLOCK IT

1. **Every residency region string** (Supabase project, Storage bucket, Edge Function execution, Vercel function, backup destination). Unblocks with read access to the Supabase and Vercel dashboards, or the region values from the environment. This is the top priority for the stack decision.
2. **All row counts** and whether real (non-SYNTH) data exists. Unblocks with a read-only live connection (rotated token in `continuum-secrets.env`, count queries only).
3. **Whether the Section 5 views are deployed live**, and whether `employer_admin`/`hse` accounts and real worker data exist behind them. Unblocks with read-only live access.
4. **Backup existence, region and last successful restore.** Unblocks with the Supabase dashboard.
5. **Prompt 34 de-identification, name by name.** Unblocks with the list of client names Prompt 34 removed.
6. **Route-by-route guard census and full commit-history secret scan.** Unblocks with a further read-only pass (no live platform needed).
7. **Review gate, rollback method, and whether any non-production environment holds production data.** Unblocks with the deploy configuration and a short operator confirmation.

---

**End of report. No stack decision is proposed. No migration is begun. Nothing found was fixed. The audit stops here, per Prompt G1 Section 7.**
