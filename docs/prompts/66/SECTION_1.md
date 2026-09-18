# Prompt 66 Section 1: auth, schedule, inventory, table landing

Inspected on 2026-09-18 from tip
`cc017c897fa65e4384ce9faa51cc6f757602be0d`
(`Prompt 65 site lane readiness: Sections 1-2
verify, stop before purge (#176)`).
Branch `cursor/prompt-66-agent-ops-7237`.

This file is written BEFORE product code.
Read only for this document. No product
code, no tests, no UI, no REGISTER.md,
no STOPS.md, no ACCEPTANCE.md, no
migration apply, no `package.json` edit,
no commit, no push. Draft PR only.
Athena does not ship.

Calliope owns register and stops when
those files are commissioned. This
inspection does not overwrite them.

No em dashes or en dashes anywhere.
Credentials never written. Env NAMES
only. Do not invent an Origin GitHub
URL. Do not invent the eight runtime
or eleven contract-only names from
Gary's Prompt 66. Continuum Zeus is
named here as Continuum's product
Steering Dispatcher. A Grok Bot
teammate also named Zeus is OUT OF
SCOPE and is not inventoried.

**Schema human gate.** Four new tables
are a schema change. Prompt 66
authorizes the FILE ONLY. Do not apply
live. Gary or Craig live-apply is not
this mission.

Facts never guesses. A check is PASS,
FAIL, or UNVERIFIED with evidence.

---

## Headline

The admin section for agent telemetry,
findings, and steering cannot live on
the public hostname. Marketing access
codes are a velvet rope, not identity.
Hub email+password is real site/hub
auth and would still publish the
console on Vercel. Platform, worker,
and physician auth stay HELD. Prompt
64 B1 still blocks Continuum env
attach. New tables cannot land on a
live-apply path.

**Chosen path: LOCAL INTERNAL
DASHBOARD.** Bind to `127.0.0.1`.
Zero public Vercel routes. Observation
scheduling should use the unused
GitHub Actions `on.schedule`
capability, writing only to a local
or temp store. Agent tables land as
`internal/agent-ops/db/0001_prompt66_agent_ops.sql`,
FILE ONLY, never applied.

This checkout has seven Continuum
runtime personas (Zeus plus six
hands). Gary's eight runtime plus
eleven contract-only Agent Testing
System roster is UNVERIFIED: Origin
companion unreachable.

---

## Method

- `git rev-parse HEAD` and
  `git branch --show-current` on this
  workspace.
- Repo read of site/hub auth, middleware
  prefixes, admin portal roster,
  workflow YAML, `deploy/vercel.json`,
  agents-kit README, G1 Section 2,
  Prompt 64 register and stops,
  Prompt 65 out-of-scope list,
  Claude agent files, presenter spec,
  physician orchestrator, schema
  directories.
- `rg` for `schedule:` under
  `.github`, `crons` in
  `deploy/vercel.json`, Firecrawl
  outside docs, and tables named
  `agents`, `agent_activity`,
  `agent_findings`, `agent_tasks`.
- `gh repo list craigwolf75-jpg`
  (read only).
- No live HTTP. No env values read.
  No Supabase apply. No Vercel
  project write.

---

## 1. Where the admin section can live

Options verified from files. No
option invented without a file.

### A. Marketing access gate

**Exists. Insufficient.**

`deploy/api/site-access.js` lines 1
to 11: `POST /api/site-access`
validates a launch code against
`public.access_codes` via
`validate_and_log_access`, then
signs `ct_site` with
`CONTINUUM_SITE_SESSION_SECRET`.
It never reads `ct_session`.

`deploy/api/_site_session.js`:
sibling HMAC codec for `ct_site`
only.

`supabase/migrations/20260729130000_site_access_gate.sql`
lines 16 to 26:
`public.access_codes` (label, code,
category, expiry, revoke, max uses).
Lines 28 to 36: `public.access_log`.

Env NAMES (values never):
`CONTINUUM_SUPABASE_URL` or
`SUPABASE_URL`,
`CONTINUUM_SUPABASE_SERVICE_KEY` or
`SUPABASE_SERVICE_ROLE_KEY`,
`CONTINUUM_SITE_SESSION_SECRET`
(`site-access.js` lines 206 to 208).

This is a code velvet rope on the
public marketing site. It is not
individuated operator identity. It
is not enough for agent telemetry.

### B. Hub email+password

**Exists. Site/hub only. Do not
attach the agent console here.**

`deploy/api/hub-signin.js` lines 1
to 28: `POST { email, password }`
to GoTrue password grant, then
`public.hub_profiles` approval,
then `ct_session` signed with
`CONTINUUM_HUB_SESSION_SECRET`.

`deploy/api/_hub_auth.js` lines 16
to 19: `verifyPassword` posts
`/auth/v1/token?grant_type=password`.

`deploy/api/_hub_session.js` lines
27 to 33: cookie name `ct_session`.
`ADMIN_EMAILS` is a hardcoded
allowlist of three addresses
(values not repeated). Lines 155
to 158: `isAuthorizedAdmin`
requires a session object, a
non-empty email claim, and
membership in `ADMIN_EMAILS`.

`deploy/middleware.js` line 116:
`HUB_ADMIN_PREFIXES` =
`/admin-portal`,
`/admin-hub-users`,
`/admin-site-codes`.
Lines 129 to 156: admin requires
`group === 'admin'` AND email in
`ADMIN_EMAILS`. Those prefixes are
on the public Vercel hostname
behind a session.

Env NAMES (values never):
`CONTINUUM_SUPABASE_URL` or
`SUPABASE_URL`,
`CONTINUUM_SUPABASE_SERVICE_KEY` or
`SUPABASE_SERVICE_ROLE_KEY`,
`CONTINUUM_HUB_SESSION_SECRET`
(`hub-signin.js` lines 186 to 188).

This is real auth. It is still
site/hub, not platform. Putting
agent telemetry, findings, or
steering on those prefixes would
make them publicly reachable on
the hosted hostname even when
gated. Prompt 66 forbids that.
Prompt 64 B1 still blocks attaching
agents to a real Continuum env
(`docs/prompts/64/STOPS.md`
lines 24 to 39).

### C. Platform / worker / physician auth

**HELD. Do not touch.**

Prompt 65 out-of-scope list still
binds (`docs/prompts/65/REGISTER.md`
lines 54 to 61;
`docs/prompts/65/STOPS.md`
lines 41 to 53): worker, physician,
employer, coordinator, platform
auth, and former Prompt 53 platform
items stay out of scope.

No inspection of those login
surfaces was opened.

### D. Local internal dashboard

**No such dashboard exists yet.**
No `internal/` tree. No
`agent-ops` path under `deploy/`.
`127.0.0.1` binds in this repo are
CI Postgres (`PGHOST: localhost` in
`.github/workflows/platform.yml`
line 39 and
`exposure-proof.yml` line 37) and
a test listener
(`deploy/phase-b-nojs-fetch.test.mjs`
lines 28 to 29). None is an agent
ops console.

This is the path to take, not a
path already built.

### Chosen-path ruling

**LOCAL INTERNAL DASHBOARD.**
Evidence holds. Reasons:

1. Agent telemetry, findings, and
   steering must never be publicly
   reachable. Hub admin prefixes
   already live on the public host
   (`middleware.js` line 116).
2. Prompt 64 B1 blocks Continuum
   env attach
   (`docs/prompts/64/STOPS.md`
   lines 24 to 39).
3. New tables are FILE ONLY.
   Production persistence cannot
   be applied this mission.
4. Marketing gate (A) is a code
   rope, not operator auth.
5. Platform / worker / physician
   auth (C) is HELD.
6. Using hub auth (B) would place
   the console on the public
   hostname even behind
   `ct_session`.

Do not disagree. Bind later work
to `127.0.0.1`. Zero new public
Vercel routes.

**Naming.** Continuum Zeus (12) is
Continuum's product Steering
Dispatcher. Distinct from other
ventures' orchestrators. Doctrine
today still titles him "the
Obsidian Brain"
(`CLAUDE.md` lines 1 and 8). This
section names the Continuum
product role Steering Dispatcher.
A Grok Bot teammate named Zeus
is OUT OF SCOPE: zero hits in
this checkout; not inventoried.

---

## 2. Existing scheduling capability

### GitHub Actions: unused, available

Four workflows, all
`push` / `pull_request` only:

- `.github/workflows/suites.yml`
  lines 9 to 13
- `.github/workflows/exposure-proof.yml`
  lines 15 to 19
- `.github/workflows/platform.yml`
  lines 12 to 21
- `.github/workflows/xsd-crosscheck.yml`
  lines 12 to 16

`rg 'schedule:' .github`: no
matches. **PASS: no live
`on.schedule`.**

### Vercel Cron: unused

`deploy/vercel.json` has
`cleanUrls` and `headers` only.
No `crons` key.
`rg 'crons' deploy/vercel.json`:
no matches. **PASS.**

### agents-kit examples, not installed

`agents-kit/README.md` lines 38
to 70: cron and GitHub Actions
`on.schedule` EXAMPLES. The
example workflow name is
`zeus-queue`, cron
`0 9 * * 1-5`. That YAML is
documentation, not a file under
`.github/workflows/`.

### pg_cron: exists, HELD

`G1_AUDIT_REPORT.md` Section 2
line 34 names four jobs:
`continuum-auto-actions`,
`continuum-escalation`,
`continuum-wcb-generator`,
`framer-demo-reset`.

Source confirms:

- `supabase/migrations/20260717150000_schedule_auto_actions.sql`
  lines 56 to 64:
  `continuum-auto-actions`
- `supabase/migrations/20260717170000_escalation_engine.sql`
  lines 92 to 98:
  `continuum-escalation`
- `supabase/migrations/20260717190500_schedule_wcb_generator.sql`
  lines 35 to 41:
  `continuum-wcb-generator`
- `supabase/migrations/20260718100000_framer_demo.sql`
  lines 170 to 174:
  `framer-demo-reset`

Those are platform / live-schema
jobs. Do not use them for Prompt
66 observation.

### Capability that already exists

GitHub Actions `on.schedule` is
unused and available. Hosting
Vercel Cron is unused. `pg_cron`
exists and is held.

**Scheduling decision.** Use the
existing GitHub Actions scheduler.
A later workflow file may add
`on.schedule` for a read-only
observation entrypoint that writes
only to a local or temp store,
never live schema, never a public
route. Do not wait for a new
hosted scheduler. Do not provision
a new service. Do not add Vercel
Cron. Do not schedule on
`pg_cron`.

---

## 3. Agent inventory

Prompt 64 vocabulary: RUNTIME
IMPLEMENTED or CONTRACT ONLY.
Unregistered finds included.
Grok Bot Zeus excluded.

`gh repo list craigwolf75-jpg`
returned one repo:
`craigwolf75-jpg/Continuum`
(public).
`ORIGIN_TESTING_REPO_URL` remains
UNVERIFIED
(`docs/prompts/64/REGISTER.md`
lines 147 to 153;
`docs/prompts/64/SECTION_00.md`
lines 59 to 61 and 200 to 206).
Tip `be947e50a311c1e4f66a3f97bc63a3c92802a1f9`
is not in this checkout. Do not
invent a GitHub URL.

### RUNTIME IMPLEMENTED in this repo

Seven Continuum personas. Zeus is
the main thread, not a file under
`.claude/agents/`. Six sub-agent
files exist in
`.claude/agents/` and as copies
under `agents-kit/.claude/agents/`.

| Name | ID (doctrine) | Kind | Evidence |
|---|---|---|---|
| Zeus, Steering Dispatcher | 12 | RUNTIME IMPLEMENTED | `CLAUDE.md` lines 1 to 33; `zeus-missions.md` queue. No `.claude/agents/zeus.md`. |
| Athena | 12a | RUNTIME IMPLEMENTED | `.claude/agents/athena.md` line 7; kit copy |
| Apollo | 12b | RUNTIME IMPLEMENTED | `.claude/agents/apollo.md` line 7; kit copy |
| Heracles | 24c | RUNTIME IMPLEMENTED | `CLAUDE.md` lines 12, 26; kit `agents-kit/.claude/agents/heracles.md` line 7 says 24c |
| Hermes | 12d | RUNTIME IMPLEMENTED | `.claude/agents/hermes.md` line 7; kit copy |
| Argus | 12e | RUNTIME IMPLEMENTED | `.claude/agents/argus.md` line 7; kit copy |
| Calliope | 24f | RUNTIME IMPLEMENTED | `.claude/agents/calliope.md` line 7; kit copy |

`.claude/agents/` frontmatter
`name:` values: athena, apollo,
calliope, heracles, hermes, argus.
Six files. No others.

### ID drift (report, do not fix here)

Doctrine: Heracles is 24c because
12c was claimed by the worker-app
arc. Calliope is 24f because 12f
was claimed by the site-hub arc
(`CLAUDE.md` lines 5 to 26).

Stale 12c / 12f labels still
present:

- `deploy/admin-portal.html`
  line 153: `Calliope (12f)`
- `deploy/admin-portal.html`
  line 154: `Heracles (12c)`
- `.claude/agents/heracles.md`
  line 7: `You are Heracles (12c)`
  (kit copy is 24c)
- `zeus-missions.md` lines 10 to
  11 numbering note still lists
  `12c Heracles` and
  `12f Calliope`

Admin portal roster is the same
seven names (`admin-portal.html`
lines 149 to 156). It is a
localStorage demo, not a runtime
dispatcher. See 3.4.

### CONTRACT ONLY / UNVERIFIED

**Continuum Presenter Agent.**
`specs/CONTINUUM_PRESENTER_AGENT_KIT.md`
(Prompt 32, ElevenLabs). Spec and
one-hour setup path. Not a
Continuum runtime persona.
`deploy/presenter.js` lines 7 to
16 embeds an ElevenLabs Conversational
AI widget (`DEFAULT_AGENT` is a
public embed identifier, value not
repeated). CONTRACT ONLY.

**Prompt 64 Judge.** Named only:
"Only the Judge authors defects"
(`docs/prompts/64/REGISTER.md`
lines 86 to 87;
`docs/prompts/64/SECTION_00.md`
lines 179 to 180). Origin.
CONTRACT ONLY / UNVERIFIED
runtime. No Judge agent file in
this checkout.

**Prompt 64 Firecrawl retrieval
agents.** B2 in
`docs/prompts/64/STOPS.md`
lines 43 to 49 and
`docs/prompts/64/SECTION_00.md`
lines 132 to 135. Source rules
bind. `rg -i firecrawl` outside
docs and the queue file: no
matches. No Firecrawl code in
this repo. CONTRACT ONLY /
UNVERIFIED runtime. Roster
names not present here.

**Gary's eight runtime plus
eleven contract-only Agent
Testing System names.** Not in
this Continuum checkout. Prompt
64 registration did not
transcribe the Origin documents
(`docs/prompts/64/REGISTER.md`
lines 31 to 32 and 184 to 191).
Eight + eleven + Firecrawl
retrieval roster = UNVERIFIED
(Origin companion unreachable).
Do not invent names to fill the
count.

### Found, and not agents

Honesty requires these so they
are not later counted as
personas.

- `clinical/engine/orchestrator.mjs`
  lines 1 to 21: physician batch
  orchestrator (sign, clinic
  batch, return file, resubmit,
  employer view, pink copy). Not
  a named agent persona.
- `clinical/engine/p3.mjs`: form
  orchestration entrypoint. Not
  an agent.
- `clinical/engine/ai_runtime.mjs`
  line 12: `EIGHT_IDS` AI-01
  through AI-08. Physician AI
  components under Prompt 44.
  Not Continuum agent personas.
  Do not conflate this eight
  with Gary's unverified eight.
- `worker.companion_memory`
  (`supabase/migrations/20260915140000_worker_schema.sql`
  lines 163 to 169): worker
  memory table. Not an agent.
- Worker companion HTML / hub
  "live companion" note: a
  worker surface, not a roster
  persona.
- Admin portal Mount Olympus
  (`deploy/admin-portal.html`
  lines 146 to 156 and 387 to
  432): hardcoded roster plus
  `continuum_olympus_feed_v1`
  / `continuum_admin_v1`
  localStorage. Demo UI. Not a
  runtime dispatcher.

### Search notes

`worker-app`: no agent persona
files. `platform/`: no agent
persona files. `docs/prompts/64/`
names Judge and Firecrawl only.
No `.claude/agents/zeus.md`.

### Counts

| Bucket | Count | Verdict |
|---|---|---|
| RUNTIME IMPLEMENTED found here | 7 | PASS (this checkout) |
| CONTRACT ONLY named here | 3 classes: Presenter, Judge, Firecrawl retrieval | PASS as named; runtime UNVERIFIED for Judge and Firecrawl |
| Gary Prompt 66 eight runtime | unknown | UNVERIFIED |
| Gary Prompt 66 eleven contract-only | unknown | UNVERIFIED |
| Firecrawl retrieval roster names | unknown | UNVERIFIED |
| Grok Bot Zeus | 0 hits | OUT OF SCOPE, not counted |

---

## 4. Existing storage, and where new tables land

### Named tables do not exist

`rg` for `agents`,
`agent_activity`,
`agent_findings`,
`agent_tasks` as table names
across `supabase/`, `platform/db`,
and `clinical/db`: no
`create table` for those four.
The only `agents` hit in
clinical SQL is a board skill
code phrase
(`clinical/db/002_seed_reference_and_lookups.sql`
line 645: `Ther. Pharm. agents`).
**PASS: those four tables are
absent.**

### Nothing named Zeus is a product table

No `create table` Zeus. No Zeus
schema.

`supabase/migrations/20260915150000_worker_provision_invite_gate.sql`
lines 3 to 7: comments that Zeus
has not approved restoring
EXECUTE. Comment text, not a
Zeus table.

`deploy/admin-portal.html` line
150: Zeus is a UI roster row,
not schema.

### Where tables must NOT land

- `supabase/migrations`:
  `.github/workflows/exposure-proof.yml`
  lines 54 to 62 applies every
  `supabase/migrations/*.sql` to
  CI postgres. That directory is
  also the live-apply path. Do
  not put Prompt 66 tables there.
- `platform/db`: HOLD. Nothing
  touches platform.
  `platform.yml` lines 86 to 91
  applies `platform/db/0*.sql`.
  Last file is
  `platform/db/0019_prompt50_foundations.sql`.
  Next number would be 0020.
- `clinical/db`: physician
  surface. `platform.yml` lines
  74 to 84 applies a listed
  clinical order through 018
  (019 to 024 exist on disk and
  are not in that apply string).
  Last numbered file is
  `clinical/db/024_migration_prompt61_psych_injury.sql`.
  Next number would be 025.
  Do not put Prompt 66 tables
  there.

### Section 1 landing decision

`internal/agent-ops/db/0001_prompt66_agent_ops.sql`
as an append-only FILE ONLY.
The directory does not exist
yet. This dispatch does not
create it.

Local dashboard uses an
in-memory or file store that
mirrors those four tables
(`agents`, `agent_activity`,
`agent_findings`,
`agent_tasks`). Do not apply
live. Do not add the file to
`supabase/migrations`,
`platform/db`, or
`clinical/db`.

Four new tables remain a schema
change under the human gate.
Prompt 66 authorizes the FILE
ONLY. Gary or Craig live-apply
is not this mission.

### Existing agent-ish state

`deploy/admin-portal.html`
lines 146 to 147:
`continuum_admin_v1` and
`continuum_olympus_feed_v1`
in localStorage. Demo only.
Not a durable agent store.

---

## Check list

| Check | Verdict | Evidence |
|---|---|---|
| Tip and branch | PASS | `git rev-parse HEAD` = `cc017c897fa65e4384ce9faa51cc6f757602be0d`; branch `cursor/prompt-66-agent-ops-7237` |
| A. Marketing gate exists | PASS | `deploy/api/site-access.js`, `_site_session.js`, `public.access_codes` |
| A. Marketing gate sufficient for agent ops | FAIL | Code rope on `ct_site`; no operator identity; Prompt 66 rejects it |
| B. Hub email+password exists | PASS | `hub-signin.js`, `_hub_auth.js` password grant, `_hub_session.js` HMAC `ct_session`, `ADMIN_EMAILS`, `isAuthorizedAdmin` |
| B. Hub prefixes on public host | PASS | `middleware.js` line 116 `/admin-portal`, `/admin-hub-users`, `/admin-site-codes` |
| B. Hub auth acceptable for agent console | FAIL | Would publish telemetry on the public hostname even behind a session |
| C. Platform / worker / physician auth | PASS (held) | Prompt 65 REGISTER lines 54 to 61 and STOPS lines 41 to 53 still bind; not opened |
| D. Local dashboard already present | FAIL (absent) | No `internal/` tree; no agent-ops Vercel route; `127.0.0.1` only in CI/tests |
| Chosen path LOCAL INTERNAL DASHBOARD | PASS | Reasons 1 to 6 hold on this tip |
| No `schedule:` in `.github` | PASS | `rg 'schedule:' .github` empty; four workflows are push/PR only |
| No `crons` in `deploy/vercel.json` | PASS | File has `cleanUrls` and `headers` only |
| agents-kit cron/GHA are examples | PASS | `agents-kit/README.md` lines 38 to 70; no matching workflow file |
| pg_cron jobs are held platform | PASS | G1 Section 2 line 34 plus four `cron.schedule` migrations |
| Observation schedule: use GHA `on.schedule` | PASS (decision) | Unused capability; later workflow; local/temp store only |
| Craig GitHub has only Continuum | PASS | `gh repo list craigwolf75-jpg` returned `craigwolf75-jpg/Continuum` only |
| `ORIGIN_TESTING_REPO_URL` | UNVERIFIED | Prompt 64 REGISTER lines 147 to 153; SHA `be947e50` absent here |
| Runtime personas in this repo | PASS | 7: Zeus 12, Athena 12a, Apollo 12b, Heracles 24c, Hermes 12d, Argus 12e, Calliope 24f |
| Heracles/Calliope ID drift | PASS (reported) | admin-portal 12c/12f; live `heracles.md` line 7 says 12c; `zeus-missions.md` numbering note 12c/12f |
| Presenter Agent | PASS (CONTRACT ONLY) | `specs/CONTINUUM_PRESENTER_AGENT_KIT.md`; ElevenLabs embed in `deploy/presenter.js` |
| Prompt 64 Judge runtime | UNVERIFIED | Named in Prompt 64 docs only; no agent file |
| Firecrawl code in this repo | PASS (absent) | No hits outside docs/queue |
| Firecrawl retrieval roster | UNVERIFIED | B2 STOP; names not in this checkout |
| Gary eight + eleven names | UNVERIFIED | Origin companion unreachable; do not invent |
| Orchestrator is not an agent | PASS | `clinical/engine/orchestrator.mjs` physician batch wiring |
| No `agents` / `agent_activity` / `agent_findings` / `agent_tasks` tables | PASS | No `create table` in supabase, platform/db, or clinical/db |
| No Zeus product table | PASS | Comments and UI roster only |
| Do not land in `supabase/migrations` | PASS (decision) | exposure-proof.yml applies all `*.sql`; live-apply path |
| Do not land in `platform/db` | PASS (decision) | HOLD; next file would be 0020 |
| Do not land in `clinical/db` | PASS (decision) | Physician surface; next file would be 025 |
| FILE ONLY landing path | PASS (decision) | `internal/agent-ops/db/0001_prompt66_agent_ops.sql`; not created this dispatch |
| Olympus keys are demo only | PASS | `continuum_admin_v1`, `continuum_olympus_feed_v1` in `admin-portal.html` lines 146 to 147 |
| Grok Bot Zeus excluded | PASS | Zero hits; out of scope |
| No credentials written | PASS | Env NAMES only; allowlist values not repeated |
| package.json untouched | PASS | Not opened for edit |
| No migration apply | PASS | File write only, this document |

---

## Human gates (untouched)

`package.json`, consent wording,
legal pages, pricing, email
templates, credentials, live
schema apply, `platform/db`,
`clinical/db` apply,
`supabase/migrations` apply,
Prompt 64 B1 env attach,
Prompt 64 B2 Firecrawl,
Montreal, Bedrock, Origin URL.

Four new tables stay FILE ONLY
until Gary or Craig names a
live-apply. That naming is not
this mission.

---

## What this dispatch did not do

- Did not write product code,
  tests, or UI.
- Did not write REGISTER.md,
  STOPS.md, or ACCEPTANCE.md.
- Did not create
  `internal/agent-ops/`.
- Did not apply a migration.
- Did not edit `package.json`
  or email templates.
- Did not invent Origin agent
  names or a GitHub URL.
- Did not attach to a Continuum
  environment.
- Did not commit or push.

This dispatch wrote this file
only.
