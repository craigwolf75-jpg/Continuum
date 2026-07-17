<!-- Recorded in the DEMO repo 2026-07-17 for the paper trail. This is the
     MAINLINE production build series and per its own Hard Isolation rule it
     must be EXECUTED IN A NEW, SEPARATE production repo + new Supabase org and
     project (ca-central-1) + new Vercel project + new credentials. Do NOT build
     it in this demo repo. Copy this file into the new repo's specs/ when it
     exists. Verbatim; formatting preserved. -->

# CONTINUUM PROMPT 07: The Mainline MVP Build Series (Client Prompts 0-10 on the Ratified Stack)

**Governed by:** Continuum_MVP_Build_Handoff.md (Craig, June 27, 2026) for scope, data model, visibility matrix, and contracts; CONTINUUM_PROMPT_05_RECONCILIATION.md for rulings; continuum_workflow_analysis.html (July 17, 2026) for regulatory posture and forward-compatibility law.
**Stack (ratified, Prompt 05 Section 4):** Next.js 14 App Router, TypeScript, Tailwind, Supabase (NEW dedicated org and project, region ca-central-1), Capacitor for iOS and Android, Twilio (Canadian number), Vercel for dashboard delivery.
**Date:** July 17, 2026

**How to use:** run sub-prompts 07.0 through 07.10 in order in Claude Code sessions on the Continuum production repo (a NEW repo, not the demo repo). Paste 07.0 at the start of every session. Each sub-prompt maps one-to-one to the client's Prompts 0-10 so Craig's documents remain cross-referenceable. Where a sub-prompt says STUB, build the real interface backed by a fake until the Nexus and SiteDocs specs land.

**Hard isolation:** new GitHub repo, new Supabase org and project (ca-central-1), new Vercel project, new credentials. Nothing shared with any other platform, project, or entity. Append-only migrations; never edit or delete an applied migration. No package.json changes without Gary's explicit approval beyond the dependencies each sub-prompt names. Lucide React icons at strokeWidth 1.5. No em-dashes or en-dashes anywhere: code, comments, copy, docs.

---

## PROMPT 07.0: Shared context (paste at the start of every session)

```
You are building Continuum, a multi-tenant worker injury-recovery and return-to-work platform for the Canadian workers' compensation ecosystem.

STACK: Next.js 14 App Router with TypeScript and Tailwind; Supabase (Postgres with row-level security, Auth, Storage, Edge Functions) in region ca-central-1; the worker app is a mobile-first Next.js surface packaged with Capacitor for iOS and Android, offline-first; dashboards are Next.js on Vercel; Twilio SMS from a Canadian number behind an SmsProvider interface; Supabase Storage private buckets with signed-URL access only.

NON-NEGOTIABLE PRINCIPLES:
- Every table, query, and file access is scoped by tenant_id. No query runs without a tenant scope. Cross-tenant readers (wcb_officer, nexus_physician) are gated by access_grants, never by tenant RLS exemption alone.
- Enforce all permissions at the API and database layer, never just the UI.
- Health data: TLS in transit, AES-256 at rest, append-only audit_log for every read, edit, and export, soft delete only. Health records are never hard-deleted.
- PHI persists exclusively in Supabase ca-central-1 (database and Storage). Server logic that handles PHI runs in Supabase Edge Functions in ca-central-1. Vercel serves dashboard UI. Flag any code path where PHI would transit or persist elsewhere instead of writing it.
- Employers see FUNCTIONAL status only: never diagnosis notes, photos, check-in free text, or raw pain and mobility scores. HSE sees scores (operational need); employer_admin does not. This firewall (abilities out, diagnostics blocked) is the legal norm in every Canadian province and is Continuum's core trust property.
- Only the nexus_physician role advances a worker's medical status. reported to off_work advances automatically on the worker's first check-in. employer_admin confirms full_duty_pending to signed_off. Escalations never advance medical status.
- Continuum is NOT a health information custodian. It is an agent, information manager, or service provider under provincial law (instrument varies by province; counsel confirms). Never describe Continuum in code, copy, or docs as the medical record, the legal record, or the system of record for clinical care. Deviation alerts are decision support for the clinician, never a diagnosis.
- Escalation and alert copy uses functional and trend language (for example "pain trending high for 3 check-ins"), never diagnostic language.

ENUMS:
- injuries.status: reported, off_work, light_duty, full_duty_pending, signed_off, escalated (side state; injuries also carry prior_status so escalated returns deterministically)
- injuries.severity: minor, moderate, major
- users.role: worker, hse, employer_admin, wcb_officer, nexus_physician
- tenants.province: ab, bc, sk, on (MVP operates ab only; schema and copy must not hard-code Alberta)

SCOPE: build the CORE LOOP only: intake, SMS, twice-daily check-ins, employer dashboard, Nexus clearance, WCB document generation. Do NOT build: photo AI triage, conversational AI check-ins, video assessment, wearable ingestion (table only), SiteDocs SSO, Ocean or EMR or FHIR integration, per-payer form pre-fill beyond Alberta document generation. Leave clean seams where named.

Ask before inventing any field name that crosses the Nexus or SiteDocs API boundary; those specs are pending. Use the proposed contracts verbatim and leave a clear seam.
```

---

## PROMPT 07.1: Foundation (schema, RLS, instrumentation)

```
Set up the Supabase project schema as multi-tenant with row-level security. All DDL as append-only migrations via the Supabase CLI, committed to the repo.

Every table carries: id (uuid PK, default gen_random_uuid()), tenant_id (uuid FK to tenants, indexed), created_at, updated_at, deleted_at (soft delete; health records are never hard-deleted). Exception: cross-tenant registry tables noted below.

Tables (client data model, plus reconciliation and forward-compatibility additions):
- tenants: name, province (enum ab/bc/sk/on), wcb_account_number, branding jsonb (logo_url, colors, display_name), light_duty_task_bank jsonb, rtw_obligation_frame (enum incentive/compliance; ab seeds incentive), status (active/suspended)
- users: auth_user_id (FK to auth.users), phone E.164 unique, email, full_name, role enum, tenant_id (NULL for wcb_officer and nexus_physician), status (invited/active/disabled), language
- workers: user_id FK, photo_url, job_title, shift_rotation, hire_date
- injuries: worker_id FK, date_of_injury, body_part, injury_type, severity enum, prognosis_days, diagnosis_notes, status enum, prior_status enum nullable, estimated_return_date, nexus_case_ref
- recovery_logs: injury_id FK, client_generated_id uuid UNIQUE (idempotent offline sync), logged_at, pain_score 1-10, mobility_score 1-10, notes, image_url, source (check_in/photo)
- light_duties: injury_id FK, task_description, medical_restrictions, assigned_by FK users, assigned_date, completed_date, worker_feedback
- wcb_notifications: injury_id FK, type (initial/light_duty/full_duty), payload jsonb, wcb_claim_number, sent_timestamp, status (pending/generated/submitted/acknowledged/failed)
- escalations: injury_id FK, trigger text, notified_party, created_at, resolved_at
- consents: user_id FK, version, scope jsonb, granted_at, revoked_at (nullable)
- access_grants: user_id FK, tenant_id nullable, injury_id nullable, access (read)
- audit_log: actor_id FK, action, entity, entity_id, occurred_at, ip_device; APPEND ONLY (revoke UPDATE and DELETE from every role; enforce with a trigger that raises on both)
- wearable_data: injury_id FK, captured_at, metric (hrv/strain/recovery/hr), value, device. Table only, no ingestion.
- case_metrics: injury_id FK, metric (days_to_first_checkin/days_in_status/checkin_adherence/escalation_count/days_to_rtw), value numeric, computed_at. The outcomes instrumentation baseline; populated by the state machine and check-in flow from day one so future duration and cost claims are measurable, never speculative.
- province_form_codes (no tenant_id; reference table): province, party (worker/employer/physician), form_code, form_name, deadline_text. Seed all four provinces from verified values: AB C060/C040/C050 with 72 hours employer and 48 hours physician; BC Form 6/7/8 with 72 hours employer; SK W1/E1/PPI with 5 days employer (never "D1"); ON Form 6/7/8 plus FAF 2647A with 3 business days employer. MVP renders Alberta only; the table exists so no Alberta string is ever hard-coded.

RLS: custom JWT claims (tenant_id, role, user_id) issued via a Supabase auth hook. Tenant-scoped roles (worker, hse, employer_admin) read and write only rows where tenant_id matches their claim. Cross-tenant roles (wcb_officer, nexus_physician) have NO tenant claim and every policy for them requires a matching access_grants row. Workers additionally restricted to their own worker and injury rows. Write every policy explicitly; no table without RLS enabled.

Deliver: migrations, policies, the auth hook, and a seed script with one tenant (Worley, province ab), one user per role, and the Marcus Bedard case per the client intake example (NX-2026-00481, right shoulder, msk_strain, moderate, 21 days, no lifting above shoulder height). Include a policy test suite (pgTAP or SQL scripts) proving cross-tenant reads fail and access_grants gates work.
```

---

## PROMPT 07.2: Authentication (SMS OTP workers, email OTP dashboards)

```
Configure Supabase Auth: phone OTP for workers via the Twilio provider (Canadian sending number; credentials in project secrets, never in the repo), email OTP for dashboard roles. Leave the Supabase email templates at defaults.

- 6-digit codes, 5-minute expiry, single-use. Rate-limit requests per phone (3 per 15 minutes) and per IP at the edge function layer in front of auth where Supabase limits are insufficient.
- Wrap all SMS sending (auth and notifications alike) behind an SmsProvider interface with a mock implementation for dev and tests.
- The auth hook stamps user_id, role, tenant_id claims from the users table at token issuance; RLS consumes the claims (Prompt 07.1).
- Dashboard login: email plus OTP, same mechanics. Build a clean seam (an AuthStrategy boundary) for SiteDocs SSO later; do not build SSO.
- On any role or tenant change, tokens must refresh; document the invalidation path.

Deliver: auth configuration as code where the platform allows, the rate-limit layer, the mock SmsProvider, and tests for expiry, reuse, and rate-limit cases.
```

---

## PROMPT 07.3: Worker app (offline-first, Capacitor)

```
Build the worker app as a mobile-first Next.js surface packaged with Capacitor for iOS and Android. Dependencies: @capacitor/core, @capacitor/ios, @capacitor/android, and @capacitor/preferences only; ask before anything else.

Screens (the client wireframe is the reference where available):
1. SMS OTP login (Prompt 07.2).
2. Privacy consent, first launch: who sees what in plain grade-7 language (employer sees what you can do at work, never your medical details; your clinician sees everything; WCB receives the legal milestone documents; Continuum manages this information for you and is not your medical record). Capture a timestamped consent row (version, scope) BEFORE any data entry; revocable in settings; revocation blocks further collection.
3. Home: injury summary (body part, status, day X of prognosis, estimated return date) plus the current check-in card.
4. Check-in: pain slider 0-10, mobility slider 0-10, optional notes, submit. Twice daily, AM and PM windows; reminders by push with SMS fallback.
5. History: recent check-ins as a simple trend.
6. Light-duty checklist: today's duties with restrictions, tap to mark done, optional feedback.

OFFLINE-FIRST (hard requirement): check-ins and duty check-offs queue locally (Capacitor Preferences or IndexedDB) when offline and sync on reconnect; visible sync state; idempotent sync via client_generated_id so retries never duplicate (Prompt 07.1 unique constraint is the backstop).

48px minimum tap targets. Tenant branding pulled at login from tenants.branding. Brand defaults navy #0E1B2C and gold #C8972F. Grade-7 copy throughout.

Deliver: the screens, the offline queue and sync service with tests (queue while offline, sync on reconnect, duplicate suppression), and the consent gate wired to the consents table.
```

---

## PROMPT 07.4: Employer dashboard (functional data only)

```
Build the employer and HSE web dashboard in Next.js on Vercel, reading through PHI-safe server endpoints (edge functions or route handlers that query Supabase with the caller's JWT so RLS applies).

Layout per the client wireframe: sidebar nav; header with date range and tenant white-label; KPI row (total active injuries, new injuries 7d, currently on light duty, average days injured, total doctor visits, return-to-work rate); charts (injuries by type, workers by status, days-injured distribution); worker table (worker name and role, injury type, injury date, days injured, doctor visits, status badge, restrictions, next review, RTW progress); alerts side rail.

FIELD-LEVEL FIREWALL, enforced server-side:
- Create Postgres views or RPCs per role: employer_case_view exposes ONLY functional fields (no pain_score, no mobility_score, no diagnosis_notes, no notes, no image_url); hse_case_view additionally exposes pain_score and mobility_score, still never diagnosis_notes, notes free text, or image_url. Dashboards query the view for their role; base-table reads for these roles are denied by policy.
- Response-shape tests: for employer_admin, assert the serialized API response contains no key and no value from the forbidden set; run the same test against every endpoint the dashboard touches.
- The dashboard surfaces the tenant's rtw_obligation_frame in its RTW panel copy: incentive framing (claim cost, premium impact) for ab; compliance framing reserved for future provinces. No hard-coded Alberta strings; read province and frame from the tenant row.

Real-time: Supabase Realtime subscription on the role view's underlying changes, falling back to 30-second polling.

Deliver: the dashboard, the per-role views and policies, and the field-stripping test suite.
```

---

## PROMPT 07.5: Status machine and guards (database-enforced)

```
Implement the injury status machine server-side as data plus a single guarded transition function. No status column is ever updated except through it.

- status_transitions reference table: from_state, to_state, required_role, trigger_label. Rows exactly: reported to off_work (system, first check-in); off_work to light_duty (nexus_physician, clearance); light_duty to full_duty_pending (nexus_physician, clearance); full_duty_pending to signed_off (employer_admin, confirms return); any active state to escalated (system, escalation rule; record prior_status); escalated to prior_status (nexus_physician, reassess).
- advance_injury_status: a SECURITY DEFINER Postgres function that validates (current status, requested status, caller role from JWT claims) against the table, writes prior_status when entering escalated, appends audit_log, updates the row, and emits a row into an auto_actions queue table. Reject everything else with a typed error. A trigger on injuries blocks direct status updates that did not come through the function.
- Auto-actions consumed by an edge function worker: entering off_work queues the WCB initial notification and surfaces the worker on the employer dashboard; entering light_duty publishes restrictions and queues the WCB light-duty notification; entering full_duty_pending generates the fitness-for-work form; entering signed_off queues the WCB full-duty notification with the FFW form attached and closes the case. Each auto-action also writes case_metrics (days_in_status for the exited state; days_to_rtw on signed_off).
- Endpoints (edge functions, contract shapes verbatim per the client):
  POST /v1/injuries/{id}/clearance { clear_to, restrictions?, effective_date, physician }
  POST /v1/injuries/{id}/reassess { action, new_status?, note }
  Both verify the caller is the nexus_physician holding an access grant for this injury.

Deliver: the transition table and function, the block trigger, both endpoints, the auto-actions worker, and tests for every allowed and rejected transition including role spoofing and state skipping.
```

---

## PROMPT 07.6: Nexus dashboard and intake (the front door) [intake auth = STUB]

```
Build the Nexus Health physician dashboard (Next.js) and the intake edge function.

Intake, contract shape VERBATIM from the client (field names are the seam; do not rename):
  POST /v1/cases
  { nexus_case_ref, worker: { full_name, phone, dob, sin, job_title },
    tenant: { wcb_account_number, company_name },
    injury: { date_of_injury, body_part, injury_type, severity, prognosis_days, diagnosis_notes, initial_restrictions } }
  Returns 201 { injury_id, status: "reported", sms_dispatched: true }
- severity minor: return { engaged: false }, create nothing, log nothing clinical.
- moderate or major: resolve or create the tenant by wcb_account_number, create worker and injury (status reported), fire the intake SMS with the app link, queue the WCB initial notification as pending, write case_metrics baseline.
- AUTH STUB: a static service token in project secrets, validated in the function, wrapped behind a NexusAuth boundary swappable for the real mechanism (SSO or mTLS) when the spec lands.
- SIN handling: store masked plus a hash; the full value is never returned by any endpoint and never leaves ca-central-1. Only the WCB initial-notification document generator may embed it, and that path is audited.
- Internal seed-case admin action so the system has data without Nexus.

Dashboard: KPIs (active patients, new assessments 7d, open escalations, average recovery vs prognosis, pending clearances, cases closed); escalation alerts panel using trend language; patient monitoring table with recovery progress; assessment intake form calling POST /v1/cases; clearance actions calling the Prompt 07.5 endpoints; fitness-for-work PDF generation from a clearance (pdf-lib in an edge function, stored to a private bucket, signed-URL access, access audited).

Nexus sees full medical detail but ONLY for patients they hold an access grant on. Deliver: the dashboard, the intake function with stubbed auth and seed action, SIN handling, and FFW PDF generation.
```

---

## PROMPT 07.7: Deviation and escalation engine (rule-based)

```
Build the escalation engine, rule-based, no ML. Evaluate on every recovery_logs insert (database trigger enqueues; edge function evaluates):

1. pain_score at or above 8 for 3 consecutive check-ins, or
2. mobility_score declining across 2 or more days, or
3. a red-flag keyword in notes (configurable list in one config table; seed: numb, tingling, sharp, worse at night, cannot sleep).

On trigger: create the escalations row (trigger text in trend language, notified_party nexus), advance to escalated via advance_injury_status (recording prior_status), notify the granted nexus_physician in-app and by push, optionally pause light-duty progression, increment case_metrics escalation_count.

Framing law: this is decision support. Alert copy states the observed trend and never a diagnosis or clinical interpretation. Resolution only through /reassess; escalations never advance medical status.

Deliver: the pure rule evaluator with unit tests per rule (including boundary cases: exactly 3 consecutive, decline of exactly 2 days, keyword casing), the trigger-to-notify flow, and an integration test from check-in insert to physician notification.
```

---

## PROMPT 07.8: WCB document generation and lifecycle [no live API anywhere]

```
Build the WCB notification module. There is NO public WCB claims API in any Canadian province; do not build or imply one. This module generates documents and tracks a submission lifecycle handled by the responsible human through the payer's existing channel.

- Three payload types in wcb_notifications.payload, shapes verbatim from the client: initial (wcb_account_number, worker name, SIN, DOB, date_of_injury, body_part, incident_description, time_lost bool); light_duty (wcb_claim_number, modified_duty_start_date, modified_duties_description, restrictions); full_duty (wcb_claim_number, regular_duty_return_date, hours_pay_confirmed bool, fitness_for_work_form PDF attached).
- Lifecycle: pending, generated, submitted, acknowledged, failed. Generation fires from the Prompt 07.5 auto-actions; retry generation on failure.
- Document rendering reads province_form_codes: for the MVP the tenant is ab, so the initial package is framed as the data set for the employer report (C040 via myWCB, 72-hour deadline surfaced prominently with a countdown from date_of_injury) and the full-duty package carries the FFW PDF for the physician channel (HCP online services). No Alberta string hard-coded; all names, codes, and deadline copy come from the reference table.
- A submit-to-WCB step in the employer and Nexus dashboards hands the document to the responsible party and lets them mark submitted, then acknowledged; every payload and status change is audited.
- Exact WCB form field sets remain a pre-go-live verification item (client open item 9); mark the generators with a single FIELDSET_VERSION constant so reconciliation is one change.

Build the read-only WCB officer dashboard: claims table and notification log, gated by access_grants to assigned employers only, scores visible per the matrix, no diagnosis notes, no free text, no edit actions.

Deliver: generators, lifecycle, deadline countdown, and the WCB dashboard.
```

---

## PROMPT 07.9: Light duties (HSE assigns, worker checks off)

```
Build light-duty management.

HSE (tenant-scoped): assign a task from the tenant's light_duty_task_bank or custom, set hours per day; medical_restrictions are SET BY the Nexus clearance and are READ-ONLY to HSE (rendered from the injury's current published restrictions; no HSE write path exists at API or policy level). Writes light_duties rows. Assignment UI presents the restrictions pinned above the task list.

Worker (app, Prompt 07.3): today's duties with restrictions, check off daily, optional feedback; updates completed_date and worker_feedback through the offline-safe sync path.

Valid only while the injury is in light_duty status; the API rejects assignment and check-off in any other state.

Seam, not a build: structure task-bank entries with optional demand attributes (lift limit, standing, hours) so a future modified-duties matcher can score tasks against coded abilities. Do not build the matcher.

Deliver: assign UI and API, worker check-off, restriction read-only enforcement proven by a policy test, and state-gating tests.
```

---

## PROMPT 07.10: Cross-cutting (consent, audit, notifications, exposure proof)

```
Wire the cross-cutting concerns end to end.

- Consent: block all collection endpoints until a current consent row exists for the worker; revocation takes effect immediately; consent version recorded on every recovery_logs row created after a version change is not required, but the active version is checkable in the admin view.
- Audit: every read, edit, and export of health data writes audit_log. Writes and status changes are covered by triggers; reads through the PHI endpoints are covered by an interceptor in the edge function layer (log actor, action, entity, entity_id, timestamp, ip and device). Verify append-only: attempts to update or delete audit rows fail in a test. Admin audit view included.
- Notifications: one Notifications service unifying Twilio SMS and push for check-in reminders (twice daily, per-tenant configurable windows), escalation alerts, and case events. All sends recorded; SMS behind the SmsProvider interface.
- Exposure proof: a test suite that walks EVERY endpoint in the system as each of the five roles and asserts the response contains no field outside that role's row in the visibility matrix (client handoff section 5). This suite is the release gate; CI fails on any leak.
- Instrumentation check: assert case_metrics populates across a full simulated case (intake to signed_off) so duration and adherence reporting has data from the first real user. No outcome percentages appear anywhere in product copy.

Deliver: the consent gate, audit interceptor and immutability test, notifications service, the exposure-proof suite wired into CI, and a full-loop integration test: seed case, first check-in advances to off_work, clearances, duty assignment and check-off, escalation and reassess, employer confirmation, signed_off, three WCB documents generated with lifecycle transitions.
```

---

## When the Nexus and SiteDocs specs land

```
Reconcile the intake and clearance contracts and auth to the attached Nexus Health and SiteDocs specs: update field names in POST /v1/cases and /clearance behind the existing seam, replace the static service token with the real mechanism inside the NexusAuth boundary, and wire SiteDocs SSO behind the AuthStrategy boundary (replacing email OTP for dashboards). Nothing else should change; prove it by running the full test suite including the exposure-proof gate.
```

## Deferred by design (seams exist, builds do not)

Photo AI triage; conversational check-ins; video assessment; wearable ingestion; SiteDocs SSO (seam in 07.2); Ocean or EMR or FHIR integration; per-payer form pre-fill beyond the Alberta document package (province_form_codes already carries BC, SK, ON); the modified-duties matcher (seam in 07.9); Ontario FAF triggering; outcome benchmarking surfaces (case_metrics collects from day one so the claims are provable when made).
