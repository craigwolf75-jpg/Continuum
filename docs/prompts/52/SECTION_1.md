# Prompt 52 Section 1: prerequisite inspection

Inspected on 2026-09-16 from tip `41004f2d8a3c881db880ada0b9a1d04a961efb4d`
(`docs(51-design-system): Section 1 prerequisite inspection (#152)`).
Read only for this document. No write, seed, live apply, or credential use
in this inspection. No Prompt 38 screens were invented. The coordinator
daily dashboard of Prompt 45 section 9.2 was not created.

**Headline.** Prompt 52 is the feel specification that governs screens as
they are built. It adds no module, no workflow, and no AI component. This
inspection answers the eight prerequisite checks with evidence. Check 1 is
**UNVERIFIED**. Check 8 is a **STOP**. Nothing in this prompt ships before
Craig verifies Check 1, and this build does not create a screen ID for the
Prompt 45 section 9.2 coordinator daily dashboard.

Standing holds unchanged: no live Bedrock, Prompt 44 Canada/no-train STOP,
no occupational seed, 0018/0019 unapplied, Athena does not ship, no live
schema apply, `package.json` locked. Prompt 51 Design System tokens and CI
may still be landing on a separate PR. This file does not touch
`docs/prompts/51-design-system/SECTION_1.md`. No em dashes or en dashes
anywhere.

**Numbering.** In this repository, Prompt 50 is Core Platform Foundations
and Prompt 51 is the Design System / Surface Standard. The Prompt 52 brief
also cites Prompt 50 as the ten behaviour rules and Prompt 50 section 12 as
timing instrumentation. Those behaviour-prompt numbers are not present as
source documents in this repo. Check 7 reports that collision rather than
inventing a behaviour-prompt section 12.

---

## Check 1. Prompt 33 authentication fix, deployed and verified by Craig

**UNVERIFIED. STOP for ship.**

The Master Prompt Register record that Prompt 33 closed the authentication
hole is **not** verified against running product auth as specified. Grep of
`*.md`, `*.js`, `*.mjs`, and `*.html` for `verified by Craig`,
`Craig verified`, and `verified by Gary` returns **zero** verification
records. `deploy/admin-portal.html` line 150 has demo copy
`Prompt 33 hub and the admin fix shipped`. That is not a Craig
verification record.

### What the brief asked to re-test

1. Sign in with an address that does not exist and a code of `000000`.
2. Request each portal route directly by URL with no session.
3. Report exactly what happens.

### What exists in the repository (not a Craig verification)

The hub path is email and password, not a one-time code. Suites prove the
handler and the middleware mapping. They do not prove a live sign-in.

| Path | Role |
|---|---|
| `deploy/api/hub-signin.js` | POST `/api/hub-signin`. HMAC cookie `ct_session`. Unknown email and bad password return the identical `{ ok: false }` at 401 (lines 206 to 208). No cookie. |
| `deploy/api/_hub_auth.js` | GoTrue password grant |
| `deploy/api/_hub_session.js` | `ct_session` codec |
| `deploy/middleware.js` | Site gate (`ct_site`) then hub gate (`ct_session`) |
| `deploy/hub/index.html` | Hub email and password fields. One-time code copy is gone (`deploy/hub-index.test.mjs` lines 16 to 18) |

Hub suites run in this environment on 2026-09-16:

| Suite | Result |
|---|---|
| `deploy/hub-auth.test.mjs` | 38 passed, 0 failed |
| `deploy/hub-signin.test.mjs` | 65 passed, 0 failed |
| `deploy/hub-middleware-access.test.mjs` | 71 passed, 0 failed |
| `deploy/hub-index.test.mjs` | 23 passed, 0 failed |
| `deploy/worker-live-auth.test.mjs` | 24 passed, 0 failed |
| `deploy/site-middleware.test.mjs` | 155 passed, 0 failed |

Unknown-user proof in `deploy/hub-signin.test.mjs` lines 104 to 114: mocked
GoTrue 400 `invalid_grant` for `nosuchuser@example.com` returns 401, no
cookie, body identical to a bad password. That is a unit proof with a
password field, not a live proof with code `000000`.

No-session portal proof in `deploy/hub-middleware-access.test.mjs` lines 20
to 22: every Group 1, Group 2, and admin portal path returns `blocked`
when `hubSession === null`. Worker companion paths are not hub-gated:
`deploy/worker-live-auth.test.mjs` lines 45 to 47 allow `/worker`,
`/worker/login.html`, and `/worker/signup.html` without a site cookie.

There is **no** `000000` handling in hub auth code or tests. The old
placeholder flow (any email plus any one-time code) is what Prompt 33
replaced. The worker-app OTP path (`worker-app/src/lib/auth.ts`,
`worker-app/src/components/Login.tsx`) is a separate SMS code flow and was
not live-tested here.

### Live probe from this environment (2026-09-16)

No Supabase or hub session secrets are present in this environment. A live
hub sign-in against GoTrue is therefore not available from inside the
repo. An unauthenticated HTTPS probe of the public site was possible.

Apex `https://continuumrtw.com<path>` returned HTTP 308 to
`https://www.continuumrtw.com<path>` for every portal path tried.

Following redirects, with **no cookies**:

| Requested path | Final status | What rendered |
|---|---|---|
| `/employer-dashboard.html` | 308 then 200 | Site holding page, title `Continuum: Coordinated Workplace Injury Recovery`, copy includes `Request access` |
| `/hse-portal.html` | 308 then 200 | Same holding page |
| `/worker-dashboard.html` | 308 then 200 | Same holding page |
| `/clinical-dashboard.html` | 308 then 200 | Same holding page |
| `/wcb-portal.html` | 308 then 200 | Same holding page |
| `/sigma-portal.html` | 308 then 200 | Same holding page |
| `/admin-portal.html` | 308 then 200 | Same holding page |
| `/hub` and `/hub/` | 200 | Same holding page (hub login is behind the site gate) |
| `/measurement.html` | 308 then 200 | Same holding page |
| `/followup.html` | 308 then 200 | Same holding page |
| `/worker/login.html` | 308 then 200 | Worker companion sign-in, title `Continuum: sign in` |

POST `https://www.continuumrtw.com/api/hub-signin` with
`{"email":"nosuch-prompt52@example.invalid","password":"000000"}` and the
same body with `code` instead of `password`, Origin
`https://www.continuumrtw.com`, no site cookie:

- HTTP 403
- Body: `{"ok":false,"code":"SITE_ACCESS_REQUIRED","error":"Site access required. Unlock the site then try again.","errors":["Site access required. Unlock the site then try again."]}`

The exact brief re-test (nonexistent address plus code `000000` reaching
the hub credential check) **did not run**. The site gate answered first.
This inspection does not treat the holding-page result as a Prompt 33
pass.

**STOP for ship.** Athena may still author the string catalogue, the
extended linter, and the feel documents on a draft PR. Do not claim
ship-ready. Craig must re-test and record the result.

**Defect.** Craig verification of the Prompt 33 authentication fix is
absent. The brief's code-`000000` scenario is not the current hub
credential field.

---

## Check 2. Which of the thirty four screens exist today, by screen ID

**Method.** A screen is built only when an implementing HTML, JS, TSX, or
MJS file renders that screen ID. A specification, engine module, or
dashboard demo without the ID is not built. Do not infer existence from a
specification.

**Developer Build Package inventory document.** Not in this repository.
Grep for `Developer Build Package` and `34 screen` returns zero matches.
The thirty four IDs below are the inventory named by the Prompt 52 brief.

**Summary.** 4 built as legacy. 0 built to the Prompt 38 specification.
30 not built.

Prompt 38 in this repo (`specs/CONTINUUM_PROMPT_38.md`) is the Garda
Meeting Additions List, not a fourteen-screen or seventeen-screen UI
specification. None of the four built screens cite Prompt 38.

| Screen ID | Name | Classification | Evidence |
|---|---|---|---|
| SCR-AUTH-01 | Sign in | not built | No file carries `SCR-AUTH-01`. `deploy/hub/index.html` is hub gate auth. `deploy/worker/login.html` and `worker-app/src/components/Login.tsx` are worker auth. |
| SCR-AUTH-02 | Multi factor challenge | not built | No `SCR-AUTH-02`. MFA appears only as `admin_mfa_enrolled` in `clinical/engine/onboarding.mjs` line 23. |
| SCR-AUTH-03 | Password reset | not built | No `SCR-AUTH-03`. Hub design defers reset (`docs/superpowers/specs/2026-07-30-hub-email-password-auth-design.md` line 48). |
| SCR-AUTH-04 | Break glass access request | not built | No `SCR-AUTH-04`. `platform/service/break_glass.mjs` is a mechanism, not a screen. |
| SCR-WL-01 | Clinic worklist | not built | No `SCR-WL-01`. Prompt 51 Design System Section 1 line 894: `There is no page or suite named "worklist."` |
| SCR-CASE-01 | Start a case | not built | No `SCR-CASE-01`. `deploy/clinical-dashboard.html` line 140 `New Case` only toasts. |
| SCR-CONS-01 | Consent | not built | No `SCR-CONS-01`. Worker consent UIs are `SCR-WRK-07` / `ConsentGate.tsx`, not clinic consent. |
| SCR-EXAM-01 | Examination capture | not built | No `SCR-EXAM-01` and no examination-capture UI. |
| SCR-MEAS-01 | The measurement | built as legacy | Prompt 41. `deploy/measurement.html` lines 6 to 9. Spine `deploy/measurement-screen.mjs` line 1. Suite `deploy/measurement.test.mjs` line 1. |
| SCR-OIS-01 | OIS coordination | not built | No `SCR-OIS-01`. |
| SCR-TREAT-01 | Treatment and referrals | not built | No `SCR-TREAT-01`. |
| SCR-FUP-01 | Follow up entry | built as legacy | Prompt 41. `deploy/followup.html` lines 6 to 9. Spine `deploy/followup-screen.mjs` line 1. Suite `deploy/followup.test.mjs` line 1. |
| SCR-INV-01 | Invoice | not built | No `SCR-INV-01`. Form rules only in `clinical/db/form_rules.data.mjs`. |
| SCR-REV-01 | Review and sign | not built | No `SCR-REV-01`. Sign guard is `clinical/engine/ai_sign_guard.mjs`. |
| SCR-OUT-01 | Submission and outputs | not built | No `SCR-OUT-01`. Engine only (`orchestrator.mjs`, `submission_gate.mjs`). |
| SCR-REJ-01 | Rejections and corrections | not built | No `SCR-REJ-01`. Engine only (`resubmission.mjs`). |
| SCR-BAT-01 | Submission batch monitor | not built | No `SCR-BAT-01`. Engine only (`batch.mjs`). |
| SCR-DIR-01 | Employer directory | not built | No `SCR-DIR-01`. |
| SCR-DIR-02 | Employer detail | not built | No `SCR-DIR-02`. |
| SCR-DIR-03 | Modified duty library | not built | No `SCR-DIR-03`. Duty match is `clinical/engine/dutymatch.mjs`. |
| SCR-BIL-01 | Billing and remittance | not built | No `SCR-BIL-01`. Admin demo billing is not this screen. |
| SCR-BIL-02 | Invoice correction | not built | No `SCR-BIL-02`. |
| SCR-AUD-01 | Audit log viewer | not built | No `SCR-AUD-01`. Admin demo audit is not this screen. |
| SCR-ANL-01 | Clinic operational metrics | not built | No `SCR-ANL-01`. Engine only (`clinic_analytics.mjs`). |
| SCR-NOT-01 | Notification centre | not built | No `SCR-NOT-01`. |
| SCR-ADM-01 | Clinic setup | not built | No `SCR-ADM-01`. Onboarding stages are engine only. |
| SCR-ADM-02 | Practitioner profiles | not built | No `SCR-ADM-02`. |
| SCR-ADM-03 | User management | not built | No `SCR-ADM-03`. Hub admin users is not this screen. |
| SCR-ADM-04 | myWCB credentials | not built | No `SCR-ADM-04`. Engine only (`credential.mjs`). |
| SCR-PRIV-01 | Privacy pack | not built | No `SCR-PRIV-01`. Blocking flag in `onboarding.mjs` only. |
| SCR-EMP-01 | Employer dashboard | not built | No `SCR-EMP-01`. `deploy/employer-dashboard.html` is a legacy demo portal with no screen ID. |
| SCR-EMP-02 | Employer case view and duty list | not built | No `SCR-EMP-02`. |
| SCR-WRK-01 | Worker plan | built as legacy | Prompt 56, labeled Today. `deploy/worker/today.html` lines 9 to 10: `SCR-WRK-01 Today. Prompt 56 / Document 3.6.` Separate live home: `worker-app/src/components/Home.tsx` (no screen ID). |
| SCR-WRK-02 | Worker check in | built as legacy | Prompt 56. `deploy/worker/check-in.html` lines 9 to 10: `SCR-WRK-02 Check in, the Companion conversation. Prompt 56 / Document 3.6.` Separate live check-in: `worker-app/src/components/CheckIn.tsx` (no screen ID). |

Related legacy surfaces without these IDs (not counted as built):
`deploy/clinical-dashboard.html`, `deploy/hse-portal.html`,
`deploy/wcb-portal.html`, `deploy/admin-portal.html`,
`deploy/worker-dashboard.html`, `worker-app/`, `deploy/hub/index.html`.

---

## Check 3. Copy or string catalogue

**No whole-product string catalogue exists.** Strings are inline in HTML,
TSX, and JS per surface.

Searched: `i18n`, `messages.json`, `copy catalogue`, `string catalogue`,
`strings.mjs`, locale message files. None serve the whole product.

Partial, domain-specific stores (not a product catalogue):

| File | Role |
|---|---|
| `deploy/status-icons.mjs` | Five named status labels |
| `clinical/engine/pinkcopy.mjs` | Pink Copy labels and headers |
| `deploy/measurement-screen.mjs` | `BANNED_TERMS` lint list |
| `clinical/engine/employer_schema.mjs` | Employer copy lint |
| `clinical/db/error_catalogue.data.mjs` | Board error codes |
| `hub-roles/src/main.jsx` | Hub role card copy only |

`supabase/migrations/20260915140000_worker_schema.sql` has `locale text
not null default 'en'` on a worker account. That is metadata, not a
message store.

Inline examples:

- `worker-app/src/components/Login.tsx` line 28: `Sign in to your recovery check-ins.`
- `deploy/worker/today.html` line 102: `Good morning, Michael.`
- `hub-roles/src/main.jsx` line 21: `Your live recovery companion. Sign in with your email to open it.`

Section 2 cannot be applied consistently until a catalogue exists.
Scaffolding that catalogue is in-scope for this prompt. Migrating every
existing inline string into it is not: that would rewrite screens this
prompt does not build.

---

## Check 4. Exclamation, emoji, first-person software voice (baseline)

Scanned product surfaces: `deploy/*.html` excluding marketing
`index.html`, `privacy.html`, `terms.html`, and `404.html`;
`deploy/worker/*`; `worker-app/src/*`; `hub-roles/src/*`; and copy-emitting
JS (`deploy/worker/app/app.js`, companion pages).

`deploy/banned-strings.test.mjs` (Prompt 58 linter) on this tip: **0**
regulatory hits, **0** tone hits, **0** emoji files, **0** exclamation
files on top-level deploy product HTML. Tone, emoji, and exclamation are
reported, not build-failing. The emoji regex does **not** include U+26A0.

### Exclamation marks

**None** found in product-surface visible copy after stripping code
operators.

### Glyphs (not pictographic emoji)

| File | Line | Exact string |
|---|---|---|
| `deploy/hse-portal.html` | 292 | `"✓"` |
| `deploy/hse-portal.html` | 309 | `"✓"` |
| `deploy/worker-dashboard.html` | 491 | `"&#10003;"` |

No hits for `⚠` (U+26A0), `ⓘ`, `●`, `⛔`, `⧗`, `✕`, or `⚑` in those
product surfaces. Material Symbols ligatures (`warning`, `info`) are icon
font, not Unicode emoji.

### First-person software or companion voice

| File | Line | Exact string |
|---|---|---|
| `deploy/worker/app/app.js` | 144 | `I recorded that.` |
| `deploy/worker/app/app.js` | 145 | `I have turned the camera off.` |
| `deploy/worker/app/app.js` | 147 | `I cannot answer that. Here is who can.` |
| `deploy/worker/support-offer.html` | 66 | `I will check in with you later today.` |
| `deploy/worker/support-offer.html` | 66 | `I will check in tomorrow morning.` |
| `deploy/worker/support-offer.html` | 66 | `I will check in tomorrow evening.` |
| `deploy/worker-dashboard.html` | 264 | `. I am your coordinator here. Thirty seconds a day is all this asks.` |
| `deploy/worker-dashboard.html` | 402 | `Got it, thanks Worker 15. I will follow up today.` |
| `deploy/worker-dashboard.html` | 465 | `Your name lets your coordinator reach you. It is the only thing we need.` |
| `deploy/clinical-dashboard.html` | 141 | `The doctor decides; we show the information. The treating physician makes every medical and return-to-work decision.` |
| `deploy/clinical-dashboard.html` | 259 | `The doctor decides; we show the information. Open the patient to record a physician sign-off or reassess.` |
| `deploy/book.html` | 162 | `Thanks. We will be in touch shortly.` |
| `deploy/gate/holding.html` | 345 | `Thanks. We will be in touch shortly.` |
| `worker-app/src/components/ConsentGate.tsx` | 26 | `Before we start` |
| `deploy/worker-embed.html` | 135 | `Before we start` |

User-voice strings (the worker or practitioner speaking, not the
software) are listed so they are not treated as rule 1 breaches:

| File | Line | Exact string |
|---|---|---|
| `worker-app/src/components/ConsentGate.tsx` | 35 | `I agree, let us go` |
| `deploy/worker/get-help.html` | 66 to 68 | `I have a question about my plan` / `I want a clinician to look at this` / `I need help now` |
| `deploy/worker/first-run.html` | 99 | `I understand` |
| `deploy/worker/privacy.html` | 87 | `Share with a clinician when I ask` |
| `deploy/worker/clinician-handoff.html` | 64 | `I agree to send the items above to the care team, this time.` |
| `deploy/worker/check-in.html` | 117 | `What am I approved for today?` |
| `deploy/worker/check-in.html` | 139 | `I had to stop` |
| `deploy/worker/movement-check.html` | 80 | `I cannot do this movement today` |
| `deploy/worker/movement-check.html` | 95 | `I am ready` |
| `deploy/worker-dashboard.html` | 372 | `I understand my duties today` |
| `deploy/worker-dashboard.html` | 491 | `I understand, and I choose to take part.` |
| `deploy/employer-dashboard.html` | 653 to 654 | `I acknowledge` |
| `deploy/measurement.html` | 116 | `Yes, I assessed these as Able` |

---

## Check 5. Empty, loading, and error states on the four surfaces

The four surfaces named by the brief are practitioner and clinic staff,
coordinator, employer, and worker. Verbatim strings below are from
implemented UI, not from specifications.

The QA report of 30 to 31 July that lists empty-state handling among four
things "better than most systems at this stage" is **not in this
repository**. Grep for `better than most`, `most systems`, `empty state
handling`, `30 to 31 July`, and `QA report` plus empty-state praise
returns no matching document. Closest dated hits are the 30 July hub
auth design and a walkthrough path comment in `deploy/index.html`. Those
empty states therefore cannot be named as the protected QA set. What
exists today is recorded so a later copy pass does not invent a
replacement without reading it.

### Practitioner and clinic staff

Primary files: `deploy/clinical-dashboard.html`, `deploy/measurement.html`.

| State | Verbatim (or absence) |
|---|---|
| Empty | `No open escalations.` (`clinical-dashboard.html` line 238). `No clinical actions yet this session.` (line 351). `Case is signed off. No further transitions.` (line 315). |
| Loading | Not implemented. No `Loading`, `spinner`, or `skeleton` in `clinical-dashboard.html`. Renders from seeded `PATIENTS` plus localStorage. |
| Error | Toast only: `Select a <b>patient</b> first.` (line 267). `Illegal transition: ... The server would reject this too.` (line 181). |

### Coordinator

Primary file: `deploy/hse-portal.html` (HSE coordinator seat, no screen ID).

| State | Verbatim (or absence) |
|---|---|
| Empty | `No duties yet.` (line 305). `No reads yet. Open a worker to record one.` (line 379). |
| Loading | Not implemented. |
| Error | Blocking toasts: `Blocked: <b>hazard check first</b>` (line 323). `Waiting on the <b>worker</b> to accept.` (line 334). |

This is not the Prompt 45 section 9.2 daily dashboard. See Check 8.

### Employer

Primary file: `deploy/employer-dashboard.html`.

| State | Verbatim (or absence) |
|---|---|
| Empty | `No reads yet. Open the Active workers view to record one.` (line 522). `Optional. If you have no open cases, skip this honestly.` (line 658). `Skip, no open cases` (line 677). Main caseload is seeded; there is no empty-restriction-list state. |
| Loading | Not implemented. |
| Error | `Something did not validate.` (line 681). `Both commitments are accepted one at a time before setup continues.` (line 698). |

### Worker

Primary files: `worker-app/src/**` and `deploy/worker/**`.

| State | Verbatim |
|---|---|
| Empty | `No active injury on file.` (`Home.tsx` line 8). `No check-ins yet.` (`History.tsx` line 29). `No duties assigned yet.` (`Duties.tsx` line 41). `No duties right now. Your site assigns these once your clinician clears you for light duty.` (`Duties.tsx` line 26). `Both check-ins done today` / `See you tomorrow.` (`CheckIn.tsx` lines 55 to 56). Companion: `No pain recorded yet` (`progress.html` line 93). |
| Loading | `Loading...` (`worker-app/src/app/page.tsx` line 9). `Syncing...` (`AppShell.tsx` line 15). Companion login button: `Signing in...` (`login.html` line 52). |
| Error | `Could not send the code.` / `That code did not work.` (`Login.tsx` lines 15, 21). `Could not save your choice. Please try again.` (`ConsentGate.tsx` line 20). Companion: `Sign in failed.` (`login.html` line 55). `This cannot be shown right now, so Continuum will not show you an old copy of it, because that could be wrong about who can see what. Nothing has changed. Try again in a few minutes.` (`employer-view.html` line 102). Offline: `You are offline. This saves and sends when you reconnect.` (`CheckIn.tsx` line 76). `Not sent yet, because you are offline. It is saved on your phone.` (`app.js` line 146). |

`deploy/worker-dashboard.html` is a seeded demo: no data-empty, loading,
or error shell.

---

## Check 6. `forbidden_pair` configuration, 380 rows

**Present. Count is 380.** The table is not named `forbidden_pair`. The
canonical store is `clinical.wcb_pob_noi_forbidden`.

Schema: `clinical/db/001_migration_wcb_engine.sql` lines 40 to 46.

Seed: `clinical/db/002_seed_reference_and_lookups.sql` lines 817 to 819
open the insert. Counted on this tip with a Python parse of that insert
block: **380** `('AB',` data tuples.

`clinical/db/README.md` line 98: `| wcb_pob_noi_forbidden | 380 | acceptance criterion 2 (exactly 380 Alberta rows) |`.

Generator: `clinical/db/seedgen.mjs` lines 119 to 131, audit line
`POB-NOI forbidden rows: ` plus ` (expect 380)`.

Runtime: `clinical/engine/validation.mjs` `valX03` injects a Set of
`POB|NOI` keys. Suite `clinical/engine/validation.test.mjs` proves a
forbidden pair is rejected.

Literal name `forbidden_pair` appears only as `refused_forbidden_pair` in
`clinical/engine/ai_components.mjs`, which is not the 380-row table.

---

## Check 7. Timing instrumentation of Prompt 50 section 12

**Absent for the clinical timing Prompt 52 depends on.**

The Prompt 52 brief says its acceptance criteria depend on Prompt 50
section 12 timing (median seconds from case open to signature, per form
type). That behaviour-prompt document is **not in this repository**.

What this repo calls Prompt 50 section 12 is platform observability
(`docs/prompts/50/SECTION_16.md` lines 184 to 193):
`platform/service/metrics.mjs`, `tracing.mjs`, `logging.mjs`,
`observability_spec.mjs`. Required metric names
(`platform/service/metrics.mjs` lines 72 to 88) are HTTP, database, RLS,
authz, immutability, employer wall, consent, outbox, audit, config, and
flag expiry. None is `documentation_time`, `case_open_to_signature`,
`warnings_per_session`, or `notifications_per_role`.

Closest clinical definitions, not runtime instrumentation:

- `clinical/engine/clinic_analytics.mjs` lines 17 to 32 (Prompt 47 Part 9):
  `documentation_time` and `report_completion_time` as frozen metric
  definitions. No emit path.
- `clinic_ops.metric_event` in `platform/db/0017_prompt47_clinic_ops.sql`
  lines 177 to 187. Schema only. No application writer found.

Grep for `case open to signature`, `warnings per session`,
`notifications per role`, and `timing instrumentation` returns zero
matches.

Prompt 52 acceptance criteria that depend on that instrumentation cannot
be marked passed in this build.

---

## Check 8. Coordinator daily dashboard of Prompt 45 section 9.2

**No screen ID. Not built. STOP.**

The Prompt 52 brief states that Prompt 45 section 9.2 names a daily
dashboard for the clinic administrator and coordinator (Today, submission
and batch status, rejections needing action, credential expiries,
configuration drift) and that it has no screen ID in the thirty four
screen inventory.

In this repository:

- There is no `CONTINUUM_PROMPT_45` source with a section 9.2 dashboard.
  Prompt 45 here is provincial rules (`clinical/db/021_migration_provincial_rules.sql`).
- Grep for `coordinator daily`, `daily dashboard`, `clinic owner dashboard`,
  `credential expir`, `configuration drift`, and `SCR-COORD` returns zero
  matches.
- None of the thirty four IDs in Check 2 is a coordinator daily dashboard
  or a clinic owner dashboard.
- `deploy/hse-portal.html` is a legacy HSE coordinator seat with a generic
  Dashboard nav. It is not labeled as Prompt 45 section 9.2 and does not
  carry those five sections as a specified product screen.

This prompt does not create that screen and does not assign it an ID.
Whether the coordinator daily surface is SCR-WL-01 with additional
sections, or a distinct screen, is a Craig architecture decision (open
item 8). Recorded in `docs/prompts/52/STOPS.md`.

---

## Disposition for this build

| Check | Verdict | This build |
|---|---|---|
| 1 | UNVERIFIED | STOP ship. Do not invent a pass. |
| 2 | 4 legacy, 0 Prompt 38, 30 not built | Do not invent Prompt 38 screens. |
| 3 | No catalogue | Scaffold a catalogue. Do not rewrite existing screens. |
| 4 | Baseline recorded | Extend the existing banned-string linter. |
| 5 | Verbatim states recorded; July QA report absent | Protect existing strings by listing them. Do not replace them here. |
| 6 | 380 rows present | No change. |
| 7 | Clinical timing instrumentation absent | Do not invent live telemetry. |
| 8 | No screen ID | STOP. Do not build a coordinator dashboard. |
