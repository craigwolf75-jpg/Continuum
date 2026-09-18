# Prompt 66. Admin agent operations
and Continuum Zeus, Steering
Dispatcher.

IN PROGRESS. Draft PR. Registration
plus acceptance criteria. Not a
Continuum product release.

Date: 18 September 2026.

No product or runtime change in this
Calliope pass. Athena does not ship.
This file is not a ship order.

No em dashes or en dashes anywhere.

---

## Status

Prompt 66 is IN PROGRESS: Section 1
written. Auth ruling documented.
This pass writes register, stops,
and acceptance only.

Inventory in this checkout: 7
RUNTIME IMPLEMENTED (Zeus, Athena,
Apollo, Heracles, Hermes, Argus,
Calliope). Presenter, Judge, and
Firecrawl retrieval are CONTRACT
ONLY or UNVERIFIED. Gary's eight
runtime plus eleven contract-only
Origin roster is UNVERIFIED. Origin
URL UNVERIFIED.

Do not invent G1 closed. Do not
invent REV 2. Do not invent an
Origin URL or the missing eight
plus eleven names. Do not claim
Argus CLEAN.

---

## Scope

LOCAL INTERNAL DASHBOARD only.
Bind to 127.0.0.1. Zero public
Vercel routes.

Continuum product Zeus role:
Steering Dispatcher. Distinct from
other ventures' orchestrators. Grok
Bot teammate Zeus is OUT OF SCOPE.

Agents observe and report only. No
agent including Zeus applies site,
data, or config changes
autonomously. Change executes only
from a task a named human
dispatched. Findings propose;
humans dispose. dispatched_by is
always a human name.

Scheduling: unused GitHub Actions
on.schedule. Do not use pg_cron
(held). Do not add Vercel Cron.

Tables: FILE ONLY at
internal/agent-ops/db/0001_prompt66_agent_ops.sql.
Do not apply live. Do not land in
supabase/migrations, platform/db,
or clinical/db.

Holds stay open: B1, G1, HIL-1 to
HIL-11, standing retrieval policy,
platform production. Do not resolve
them.

Out of scope:

- public Vercel routes
- hub email+password as host for
  this console
- marketing access gate as operator
  auth
- platform, worker, and physician
  auth (HELD)
- Grok Bot teammate Zeus
- Origin eight plus eleven names
  (UNVERIFIED)
- live schema apply
- Continuum env attach (B1)
- Firecrawl without a recorded
  authorizer
- pg_cron and Vercel Cron

---

## Peer notes

This prompt registers the local
agent operations console. It does
not ship Continuum.

- Prompt 64 register: Agent Testing
  System registered. Origin URL
  UNVERIFIED. B1 and B2 still bind.
- Prompt 65 lane: public site lane
  only. Worker, physician, employer,
  coordinator, platform auth, and
  former Prompt 53 platform items
  stay out of that lane and stay
  out of this prompt.
- This Prompt 66: Continuum Zeus as
  Steering Dispatcher, plus a
  locally bound agent operations
  console. Draft PR only.

---

## Naming

Continuum Zeus (12) is Continuum's
product Steering Dispatcher.
Doctrine still titles him the
Obsidian Brain. This register names
the Continuum product role Steering
Dispatcher.

A Grok Bot teammate also named Zeus
is OUT OF SCOPE and is not
inventoried.

---

## Auth ruling

LOCAL INTERNAL DASHBOARD. Bind to
127.0.0.1. Zero public Vercel
routes. Marketing access codes are
a velvet rope, not identity, and
are not enough. Hub email+password
is real site/hub auth and must not
host this console: telemetry must
never be publicly reachable, even
behind a session. Platform, worker,
and physician auth stay HELD.
Prompt 64 B1 still blocks Continuum
env attach. Do not disagree.

---

## Base tip

This draft starts from
`cc017c897fa65e4384ce9faa51cc6f757602be0d`
(Prompt 65 #176).

Section 1 inspected that tip. Do
not overwrite
[SECTION_1.md](SECTION_1.md).

Branch:
`cursor/prompt-66-agent-ops-7237`.

---

## What this draft may do

Docs only in this Calliope pass.

- Write `docs/prompts/66/REGISTER.md`.
- Write `docs/prompts/66/STOPS.md`.
- Write `docs/prompts/66/ACCEPTANCE.md`.
- Link Athena's
  [SECTION_1.md](SECTION_1.md).
  Do not overwrite it.
- Name Continuum Zeus as Steering
  Dispatcher.
- Record the LOCAL INTERNAL
  DASHBOARD ruling.
- Paste operator copy for Apollo.

Later product work on this prompt
(Athena, not this pass) may add a
local console bound to 127.0.0.1,
FILE ONLY tables, and GitHub
Actions on.schedule observation
that writes heartbeat and finding
only. That work is still a draft
PR. Athena does not ship.

## What this draft must not do

- Overwrite [SECTION_1.md](SECTION_1.md).
- Write product code, tests, or UI
  in this Calliope pass.
- Attach to a Continuum
  environment (B1).
- Apply live schema.
- Land tables in
  supabase/migrations, platform/db,
  or clinical/db.
- Host the console on hub prefixes
  or any public Vercel route.
- Widen into platform, worker,
  physician, or former Prompt 53
  surfaces.
- Use pg_cron. Add Vercel Cron.
- Run Firecrawl without a recorded
  authorizer.
- Put credentials in repo or chat.
  Env NAMES only.
- Invent G1 closed, REV 2, an
  Origin URL, or the missing eight
  plus eleven names.
- Claim Argus CLEAN.
- Resolve B1, G1, HIL-1 to HIL-11,
  standing retrieval policy, or
  platform production.
- Apply site, data, or config
  changes autonomously.
- Ship. Athena does not ship.

Draft PR. Registration plus
acceptance criteria. Not a
Continuum product release.

---

## Operator copy

Apollo pastes these strings
character for character. Do not
rewrite them in layout.

Title:

Continuum Agent Operations

Zeus line:

Continuum Zeus, Steering Dispatcher

Autonomy notice:

Agents observe and report. A named human must dispatch every change.

Local banner:

This console is local only. It is not on the public site.

Approve button:

Approve

Dismiss button:

Dismiss

Dispatch button:

Dispatch

Retrieval refuse line:

A retrieval run without a recorded authorizer is refused.

---

## Holds (untouched)

Do not resolve these.

- B1: no Continuum env attach
- B2: Firecrawl needs a recorded
  authorizer
- G1: do not invent closed
- HIL-1 to HIL-11
- Standing retrieval policy
  (stays with Gary)
- Platform production
- Four new tables FILE ONLY until
  Gary or Craig names live-apply

---

## Cross-links

Calliope docs in this folder:

- [STOPS.md](STOPS.md)
- [ACCEPTANCE.md](ACCEPTANCE.md)

Athena writes, do not overwrite:

- [SECTION_1.md](SECTION_1.md)

Peer registers:

- [../64/REGISTER.md](../64/REGISTER.md)
- [../65/REGISTER.md](../65/REGISTER.md)

Prompt 64 stops that still bind:

- [../64/STOPS.md](../64/STOPS.md)

Prompt 65 lane that stays out:

- [../65/REGISTER.md](../65/REGISTER.md)
- [../65/STOPS.md](../65/STOPS.md)

---

## Do not claim Argus CLEAN

This registration does not run an
Argus patrol that closes findings.
Do not claim Argus CLEAN.

---

## Deploy gate

Draft PR. Registration plus
acceptance criteria. Not a
Continuum product release. Athena
does not ship. Do not treat this
file as a ship order.

STOP. Continuum ships only when
Craig names ship. Hermes ships
Continuum only when Craig names
ship. Do not dispatch Hermes. Do
not treat this draft as a
Continuum ship.
