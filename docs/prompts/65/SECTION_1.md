# Prompt 65 Section 1: public site lane wiring verification

Recount note: Zeus re-verified wrong-code 401 after this pass (`POST /api/site-access`, path `/SYNTH-p65-verify`); that added one SYNTH `access_log` row; inventory N moved from 14 to 15. Lead store SELECT remains 1. Zeus did not send a second marketing lead.

Inspected on 2026-09-17 from branch
`cursor/prompt-65-site-lane-fbe0` at
`13d6afddb18920bf11d6630077a7f51934cd4698`
(Calliope Prompt 65 register). Base tip
`bf69f17c462a64a3176ff1da7749dc6184a992da`
(`Prompt 64 agent testing system registered
(#175)`) was not moved.

Read only for product runtime. This dispatch
wrote this file and
[STAGED_DATA_INVENTORY.md](STAGED_DATA_INVENTORY.md)
only. No product code, no schema, no
`package.json`, no migration apply, no
email-template edit, no row delete, no
commit, no push.

Scope is the public marketing site only
(`https://continuumrtw.com`, 308 to
`https://www.continuumrtw.com`). Worker,
physician, employer, coordinator, platform
auth, and former Prompt 53 platform items
are out of scope.

Facts never guesses. A check is PASS, FAIL,
or UNVERIFIED with evidence. SYNTH prefix
on every test input this session sent.
Credentials never written. `ACCESS_GATE_CODE`
values never written. No em dashes or en
dashes.

Zero deletions. Section 4 purge did not run.

---

## Headline

The live public site is the Prompt 40
holding page plus public `/book`,
`/privacy`, `/terms`, and `/assessment/`.
The access gate is still
`POST /api/site-access` against
`public.access_codes` via
`validate_and_log_access`. It is not wired
to `ACCESS_GATE_CODE` (that name is still
absent from `deploy/`). A wrong SYNTH code
returns 401 `invalid code` and no
`Set-Cookie`. Correct admit is UNVERIFIED
(no launch-code secret). Eleven rapid
wrong-code posts from this environment did
not return 429: 13 SYNTH-tagged
`access_log` rows landed across 6 distinct
IPs, so the per-IP hour window never
reached 10.

Lead capture stores. One SYNTH row is in
`public.marketing_leads` with timestamp and
source `/SYNTH-p65`. Forward to
`info@continuumrtw.com` is wired in
`deploy/api/_notify.js` and is UNVERIFIED
in production (Resend send not observed).
Mailbox MX is live Google Workspace.

Assessment `/assessment/` is public
(middleware bounded prefix `/assessment`).
Headless Chrome rendered the intro with the
63c clause. Stage 1 result, Stage 2, live
Save, and a live network trace of zero
writes are UNVERIFIED (Chrome did not
complete the flow). Served
`assessment.js` matches Prompt 63c:
opt-in save, `user_initiated`, no
forbidden explainer. `public_assessment_response`
has 0 rows.

Book a demo on the holding page is `/book`,
not a placeholder. Hosting env var NAMES
could not be listed (Vercel MCP
`list_teams` empty, `get_project` 403).

---

## Method

- HTTP against `https://www.continuumrtw.com`
  (apex `https://continuumrtw.com` returns
  HTTP 308 `location:
  https://www.continuumrtw.com/`).
- SYNTH POSTs to `/api/site-access` and
  `/api/marketing-lead`.
- Served asset fetch and needle scan.
- Headless Chrome
  `--user-data-dir=/tmp/p65-chrome`
  dump-dom of `/assessment/` (intro only).
- Repo read of `deploy/api/site-access.js`,
  `marketing-lead.js`, `_notify.js`,
  `_site_session.js`,
  `deploy/assessment/assessment.js`,
  `scoring.js`, `config/crs-1.1.js`,
  `deploy/gate/holding.html`,
  `deploy/book.html`, `deploy/index.html`,
  `deploy/site-links.js`,
  `deploy/middleware.js`,
  `.github/workflows/suites.yml`,
  `.github/workflows/exposure-proof.yml`.
- `gh` read-only for PR 172 / 173 and
  workflow runs.
- Supabase MCP `list_organizations`,
  `list_projects`, `list_tables`,
  `list_migrations`, `execute_sql` SELECT
  counts only.
- Vercel MCP `list_teams` (empty),
  `get_git_deployment_context` (empty),
  `get_project` / `list_projects` 403.

No browser console capture. No mobile
viewport. No test mail sent to `info@`.

---

## Access gate

### What IS (code, live, DB)

`deploy/api/site-access.js` lines 36 to 37:
`MAX_ATTEMPTS = 10`,
`WINDOW_SECONDS = 60 * 60`. Line 234:
429 body `{ ok: false, error: "too many
attempts" }`. Lines 206 to 208: env names
`CONTINUUM_SUPABASE_URL` or `SUPABASE_URL`,
`CONTINUUM_SUPABASE_SERVICE_KEY` or
`SUPABASE_SERVICE_ROLE_KEY`,
`CONTINUUM_SITE_SESSION_SECRET`. Line 175:
RPC `validate_and_log_access`. Lines 240
to 248: miss 401 `invalid code`; match
`issueSiteCookie` and 200.

Cookie (`deploy/api/_site_session.js`
lines 109 to 127): name `ct_site`,
HttpOnly, Secure, SameSite=Lax, Path=/,
no Max-Age, no Expires, TTL 30 minutes
idle. Not 30 days.

`ACCESS_GATE_CODE`: zero hits under
`deploy/`. Repo hits are Prompt 62 / 65
docs only. Same absence Prompt 62
Section 1 recorded.

Live `/` (after 308): HTTP 200, Vercel
(`server: Vercel`), holding markup
`data-surface="holding"`, form posts
`{ code, path: "/" }` to
`/api/site-access`
(`holding.html` live lines 323 to 326).

### Correct admit + cookie

**UNVERIFIED.** No launch-code secret was
available. None was invented. Success 200
and `Set-Cookie: ct_site=...` were not
observed.

### Wrong code, plain failure

**PASS.** `POST
https://www.continuumrtw.com/api/site-access`
`{"code":"SYNTH-p65-wrong-code-001","path":"/SYNTH-p65-probe"}`
with `Origin: https://www.continuumrtw.com`
returned HTTP 401,
`{"ok":false,"error":"invalid code"}`.
Response headers had no `set-cookie`.
Empty code returned HTTP 400
`{"ok":false,"error":"code required"}`.
Holding copy for 401 remains
`That code was not recognized.`
(live holding script).

### Code absent from served assets

**PASS.** Fetched live: `/`, `/book`,
`/privacy`, `/terms`, `/legal-config.js`,
`/site-links.js`, `/assessment/`,
`/assessment/assessment.js`,
`/assessment/scoring.js`,
`/assessment/config/crs-1.1.js`,
`/config.js`, `/supabase.js`,
`/robots.txt`. Needle `ACCESS_GATE_CODE`:
0. Needle scan of those files printed no
hits.

### Rate limit, 11th rapid attempt

**FAIL (live). Code still implements
10 per IP per hour.**

Attempts 1 through 12 in this session
each returned HTTP 401
`{"ok":false,"error":"invalid code"}`.
The 11th rapid attempt was not 429.
A follow-up POST also 401, no
`retry-after`.

SELECT on `public.access_log` after the
burst: 13 rows with
`path = '/SYNTH-p65-probe'` or
`user_agent = 'SYNTH-p65-athena-probe'`,
across 6 distinct `ip` values (IPs not
printed). Per-IP count therefore stayed
under 10, so `rateDecision` never
blocked. This environment's `x-real-ip` /
`x-forwarded-for` last-entry split is the
observed cause, not a missing limiter in
source.

---

## Lead capture

### Store with timestamp and source

**PASS.** `POST
https://www.continuumrtw.com/api/marketing-lead`
`{"email":"SYNTH-p65-athena@example.com","source":"/SYNTH-p65"}`
returned HTTP 200 `{"ok":true}`. Invalid
email returned HTTP 400
`{"ok":false,"error":"invalid email"}`.

SELECT after the POST (email values not
selected): `marketing_leads` total 1,
SYNTH 1, non-SYNTH 0. That SYNTH row has
`source_page = '/SYNTH-p65'`,
`created_at` present, and
`created_at` within 30 minutes. Email
body was not logged. Pattern only:
`SYNTH-p65-athena@example.com`.

### Forward to info@ iff wired

**UNVERIFIED (production send).**
`deploy/api/marketing-lead.js` line 91
calls `sendLeadNotification` after a
successful store, best effort.
`deploy/api/_notify.js` lines 88 to 105:
no-op unless `RESEND_API_KEY` and
`SIGNUP_NOTIFY_TO` are both set. Recipient
comment says normally
`info@continuumrtw.com`. This session did
not read hosting env values and did not
observe a Resend HTTP status.

### Mailbox deliverability

**PASS (MX this session). Prior human
LIVE confirmation still on record.**
`dig` MX `continuumrtw.com`:
`1 smtp.google.com.` Prompt 62 Section 1
recorded Craig confirmation LIVE on
2026-09-17. No test mail was sent to
`info@` this session.

---

## Assessment

`/assessment` is always public
(`deploy/middleware.js` line 97,
`ALWAYS_PUBLIC_BOUNDED_PREFIX` includes
`/assessment`). Live
`GET https://www.continuumrtw.com/assessment/`
HTTP 200, title
`Continuum Recovery Readiness Assessment`.

Headless Chrome dump-dom (isolated
profile `/tmp/p65-chrome`): intro text
includes `Recovery Readiness Assessment`,
`nothing is sent anywhere until you choose
to save your result`, and
`Start the Assessment`. `Save my result`
count 0 on the intro. Chrome exited 124
on a 25s timeout after the dump. No
completed Stage 1 click path. No
DevTools network log.

### Stage 1 result, zero server writes

**PASS (code + served JS + census).
UNVERIFIED (live completed Stage 1
network trace).**

`deploy/assessment/assessment.js` lines
241 to 275: `persist` is the write
primitive; `saveResult` is the only
tag-and-send path; comments state nothing
calls `persist` on render or navigation.
`render` (line 687) sets `innerHTML`
only. Live served `assessment.js` (HTTP
200, 41883 bytes): `function persist`
count 1, `function saveResult` present,
`render` body does not call `persist`,
`help improve the assessment` count 0,
SAVE_EXPLAINER present:
`Saving records an anonymous summary of
the result you already see.`

SELECT `public.public_assessment_response`:
0 rows after this session (no Save was
sent).

### Opt-in save, one write, user_initiated

**PASS (code + served JS). UNVERIFIED
(live Save click).**

Live and repo `saveOfferInner`: button
`Save my result`. `taggedForSave` sets
`save_source: 'user_initiated'`.
`handleSaveResult` removes the button
before the write. No live Save was
activated, so no SYNTH-taggable
assessment row was created on purpose.

### Abandonment persists nothing

**PASS (code + census 0). UNVERIFIED
(live abandon after a snapshot).**

Navigation actions `start`,
`to-snapshot`, `to-stage2`, `to-result`,
`restart` call `render` only
(assessment.js lines 761 to 785). Census
of `public_assessment_response` is 0.

### Stage 2 refines

**PASS (code). UNVERIFIED (live).**

`renderResult` score line uses
`a refined Recovery Readiness score`
(assessment.js line 603). Stage 2
questions and exposure are in
`renderStage2`. Not exercised in the
browser this session.

### Not sure never scores as zero

**PASS (code + local eval of CRS_1.1).
UNVERIFIED (live UI).**

`crs-1.1.js` and fallback config:
`NOT_SURE` value is `null`, provenance
`UNKNOWN`. `scoring.js` lines 8 to 17:
null values are excluded from dimension
averages. Local `node` eval of repo
`scoring.js` + `crs-1.1.js`:

- all six Stage 1 `NOT_SURE`: overall
  `null`, every dimension `null`,
  `zeroDims` empty, confidence `Limited`.
- mixed `NOT_SURE`: those dimensions stay
  `null`, not 0.
- `ABSENT` is a real 0 (`CLAIMS_COORDINATION`
  0 when answered ABSENT). That is not
  Not sure.

Stage 1 copy (assessment.js line 533):
`Choose Not sure if you do not know: an
unknown answer is never scored as zero.`

### Confidence tier wording matches the tier

**PASS (code mapping). FINDING: Moderate
and Limited share one visitor lead, and
the words High / Moderate / Limited are
not rendered. UNVERIFIED (live result).**

`confidenceLead` (assessment.js lines
332 to 335): High ->
`Your responses indicate`; otherwise
`Based on the information available, your
responses suggest`. CRS_1.1 High also
requires `minExactExposureValues: 1`, so
a Stage 1 snapshot may never take the
High lead. Local eval: all Not sure ->
Limited; mixed Stage 1 -> Moderate.

---

## Footer and public contact

**PASS (served public marketing).**

Live counts of `info@continuumrtw.com` /
`craig@continuumrtw.com`:

- holding `/`: info 3, craig 0
- `/book`: info 3, craig 0
- `/privacy`: info 1, craig 0
- `/terms`: info 1, craig 0
- `/legal-config.js`:
  `supportEmail: 'info@continuumrtw.com'`
- `/assessment/` intro dump: craig 0

Hub admin `craig@continuumrtw.com` remains
in repo files that are not the public
marketing site (report only, not
rewritten): `deploy/api/_hub_session.js`
`ADMIN_EMAILS`, `deploy/admin-hub-users.html`,
and hub tests. Out of scope.

---

## Book a demo

**PASS (report only). Not a placeholder.
Section 5.4 remains a Gary item.**

Live holding CTA:
`<a class="btn btn-secondary" href="/book">Book a demo</a>`.
Needle `booking-url-pending` count 0 on
the served holding page. `/book` is the
Request access form (title
`Continuum: Request access`), which posts
to `/api/marketing-lead` with source
`/book`.

Assessment Book a Demo degrades to
`https://continuumrtw.com/book`
(`deploy/site-links.js` live
`bookingUrl`). Gated homepage
`Talk to Our Team` Calendly
(`deploy/index.html` line 846,
`https://calendly.com/craig-continuumrtw`)
was not served without a cookie
(`GET /index.html` rewrote to holding;
Calendly count 0). Do not change.

FINDING for Gary: current public Book a
demo destination is `/book` (lead form),
not a booking calendar.

---

## Environment

**UNVERIFIED (hosting name list).**
Vercel MCP `list_teams` returned
`teams: []`. `get_git_deployment_context`
returned `teams: []`. `get_project` /
`list_projects` for slug `continuum-o51l`
returned 403
(`Not authorized: ... scope
"craigwolf75-5699s-projects"`). Env
values were never requested.

Project slug from `gh pr checks 172`
Vercel URL:
`https://vercel.com/craigwolf75-5699s-projects/continuum-o51l/...`
(deployment completed). Live
`server: Vercel`. Source name
`continuum-o51l` also in
`docs/DEPLOY-prompt-40-site-gate.md`.

Names the lane needs, from code only
(values never):

- `CONTINUUM_SUPABASE_URL` or `SUPABASE_URL`
- `CONTINUUM_SUPABASE_SERVICE_KEY` or
  `SUPABASE_SERVICE_ROLE_KEY`
- `CONTINUUM_SITE_SESSION_SECRET`
- `RESEND_API_KEY`
- `SIGNUP_NOTIFY_TO`
- `SIGNUP_NOTIFY_FROM`
- `ACCESS_GATE_CODE`: Prompt 62 intended
  name, still absent from `deploy/` and
  from this hosting list (list unread)

Client-safe `deploy/config.js` (also
served live) names the Supabase project
ref `agzhnmunodrhsjbogzae` and a
publishable key (not a service role).
The string `service_role` appears only
in a NEVER-put-this-here comment.

---

## No committed secrets

**PASS (paths only).**

Find for `.env`, `.pem`, `id_rsa`,
`credentials.json`, service-account JSON:
the only env-like file is
`worker-app/.env.local.example` (template
NAMES `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
Code modules, not secret files:
`platform/service/secrets.mjs`,
`clinical/engine/credential.mjs`,
`clinical/engine/credential.test.mjs`.
No `.pem` files. Publishable browser
key in `deploy/config.js` is designed
public; value not repeated here.

---

## Console / mobile / desktop

- Console: **UNVERIFIED.** No DevTools
  console capture.
- Mobile viewport: **UNVERIFIED.**
- Desktop: **PASS (intro only).**
  Headless Chrome dump-dom of
  `/assessment/` rendered the intro
  clause and Start control.

---

## CI and assessment PR 63c / #172

**Report what IS.**

- PR 172
  `https://github.com/craigwolf75-jpg/Continuum/pull/172`
  title `Prompt 63c assessment opt-in
  save (do not ship)`. State MERGED
  2026-09-17T04:28:56Z. Head branch
  `cursor/prompt-63c-opt-in-save-b200`.
  Merge commit
  `bcf16e4d58706c7a5b767f113708cb34d841b737`
  on `main`.
- PR 172 checks: exposure-proof pass
  (38s), xsd-crosscheck pass, Vercel
  pass (`Deployment has completed`),
  suites **fail** (10s). Failed job
  `35182041202` on
  `deploy/assessment-persist.test.mjs`:
  `FAIL snapshot save control states what
  saving does in one sentence`. That is
  the Prompt 63c ACCEPTANCE gap
  (suite still asserted the forbidden
  explainer).
- PR 173
  `https://github.com/craigwolf75-jpg/Continuum/pull/173`
  `fix(Heracles): assessment-persist save
  control copy (do not ship)` MERGED
  2026-09-17T04:41:02Z, commit
  `16d61ff4b82ace52069b7cc2c900a1b152b4eb48`.
- `.github/workflows/exposure-proof.yml`
  exists (push/PR to `main`,
  postgres:15, apply migrations, run
  `supabase/tests/exposure_proof.sql`).
  Latest `main` run at base tip
  `bf69f17`: conclusion success,
  `https://github.com/craigwolf75-jpg/Continuum/actions/runs/35184329491`.
- `.github/workflows/suites.yml` exists
  (runs every `deploy/*.test.mjs`).
  Latest `main` run at `bf69f17`:
  conclusion success,
  `https://github.com/craigwolf75-jpg/Continuum/actions/runs/35184329467`.
- 63c is on `main` and is served: live
  `assessment.js` has SAVE_EXPLAINER and
  no forbidden explainer. Exact Vercel
  SHA for the live hostname is
  UNVERIFIED (project read 403). Vercel
  did complete a deployment on PR 172.

---

## Check list (one evidence line each)

| Check | Verdict | Evidence |
|---|---|---|
| Access gate, correct admit + cookie | UNVERIFIED | No launch-code secret; 200 / `ct_site` not observed |
| Access gate, wrong code | PASS | `POST /api/site-access` SYNTH code HTTP 401 `invalid code`, no `Set-Cookie` |
| Access gate, code absent from assets | PASS | Live public HTML/JS/CSS scan: `ACCESS_GATE_CODE` count 0 |
| Access gate, 11th rapid 429 | FAIL | Attempts 1 to 12 HTTP 401; 13 SYNTH `access_log` rows across 6 IPs |
| Lead store + timestamp + source | PASS | HTTP 200 `ok:true`; SELECT 1 SYNTH row, `source_page=/SYNTH-p65`, `created_at` recent |
| Lead forward to info@ | UNVERIFIED | `_notify.js` gated on `RESEND_API_KEY` + `SIGNUP_NOTIFY_TO`; send not observed |
| Mailbox deliverability | PASS | MX `1 smtp.google.com.`; Craig LIVE 2026-09-17 on Prompt 62 record |
| Assessment Stage 1, zero writes | PASS (code/census), UNVERIFIED (live trace) | Served JS: persist not in `render`; table row count 0; Stage 1 clicks not completed |
| Opt-in save once, `user_initiated` | PASS (code), UNVERIFIED (live click) | Live `assessment.js` `taggedForSave` / `Save my result`; no Save sent |
| Abandonment persists nothing | PASS (code/census), UNVERIFIED (live abandon) | Navigation is `render` only; `public_assessment_response` 0 |
| Stage 2 refines | PASS (code), UNVERIFIED (live) | `renderResult` refined score line; not exercised live |
| Not sure never scores as 0 | PASS (code/eval), UNVERIFIED (live UI) | Local CRS_1.1: all `NOT_SURE` -> overall null, dims null, no zeroDims |
| Confidence wording matches tier | PASS (code), UNVERIFIED (live) | High vs not-High leads; Moderate and Limited share a lead; labels not shown |
| Footer info@, no craig@ on public | PASS | Live holding/book/privacy/terms/legal-config: info@ present, craig@ 0 |
| Book a demo destination | PASS (report) | Live holding `href="/book"`; not `#booking-url-pending` |
| Hosting env NAMES | UNVERIFIED | Vercel MCP teams empty; `get_project` 403 |
| No committed secrets | PASS | Only `worker-app/.env.local.example` template; no `.pem` |
| Console | UNVERIFIED | No console capture |
| Mobile | UNVERIFIED | No mobile viewport |
| Desktop | PASS (intro) | Chrome dump-dom rendered assessment intro |
| CI / PR 172 / exposure-proof | PASS (report) | 172 MERGED; its suites failed persist copy; 173 fixed; main `bf69f17` suites + exposure-proof success |

---

## What this dispatch did not do

- Did not admit with a real code.
- Did not send mail to `info@`.
- Did not click Save my result on live
  (would have created an untagged row).
- Did not delete or update any row.
- Did not apply a migration.
- Did not edit `package.json` or email
  templates.
- Did not write REGISTER.md, STOPS.md,
  or SECTION_3_GATE.md.
- Did not commit or push.
