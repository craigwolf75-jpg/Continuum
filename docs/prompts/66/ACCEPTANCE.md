# Prompt 66 acceptance (operator-facing
draft)

Operator-facing draft on branch
`cursor/prompt-66-agent-ops-7237`,
from base tip
`cc017c897fa65e4384ce9faa51cc6f757602be0d`
(Prompt 65 #176). This file writes
the criteria. It is not a product
release. Prompt 53 holds were
released 2026-09-16 by Craig. Hold
lift is not an auto-execute.

Do not claim Argus CLEAN. Do not
claim ship-ready. Do not invent G1
closed or REV 2. Do not invent an
Origin URL or the missing eight
plus eleven names.

Calliope owns [REGISTER.md](REGISTER.md)
and [STOPS.md](STOPS.md). This file
does not overwrite REGISTER, STOPS,
or [SECTION_1.md](SECTION_1.md).

Heracles filled 7.1 through 7.7
on 2026-09-18 from this checkout.
Section 1 already proved the auth
ruling and inventory completeness
as far as this checkout. Origin
eight plus eleven remains
UNVERIFIED.

No em dashes or en dashes
anywhere.

---

## Section 7 (brief numbering)

| Item | Verdict | Evidence |
|---|---|---|
| 7.1 Console reachable only through real auth OR local with zero public exposure | PASS | LOCAL INTERNAL DASHBOARD in [SECTION_1.md](SECTION_1.md). Bind 127.0.0.1 (`netstat`: `127.0.0.1:8766` LISTEN, not 0.0.0.0). `node deploy/prompt66-agent-ops.test.mjs`: 157 passed, 0 failed. `deploy/vercel.json` and `deploy/middleware.js` have no agent-ops, agent_findings, agent_tasks, or /api/agents. Same walk over deploy html and api js. `internal/` is outside the Vercel deploy root. Live `https://www.continuumrtw.com/agent-ops`, `/internal/agent-ops/`, `/api/agents`, and `/api/findings` each return the marketing holding page (`data-surface=holding`, title Continuum: Coordinated Workplace Injury Recovery), not Agent Operations. Marketing gate insufficient. Hub email+password must not host this console. Platform, worker, and physician auth HELD. |
| 7.2 Agent inventory complete; each statused RUNTIME IMPLEMENTED or CONTRACT ONLY; matches repositories | PASS (this checkout). Origin UNVERIFIED | Suite: DEFAULT_INVENTORY 10 rows, 7 RUNTIME IMPLEMENTED (zeus, athena, apollo, heracles, hermes, argus, calliope), 3 CONTRACT ONLY (presenter, judge, firecrawl-retrieval). Judge and Firecrawl retrieval home_repository UNVERIFIED. No invented Origin names. Gary eight runtime plus eleven contract-only UNVERIFIED. Origin URL UNVERIFIED. Do not invent names. |
| 7.3 SYNTH finding flows NEW to APPROVED to DISPATCHED to DONE; approving and dispatching human named | PASS | `prompt66-agent-ops.test.mjs`: insert SYNTH status NEW, approve by Craig to APPROVED, receiveDispatch by Craig. `zeus.mjs` marks DISPATCHED then DONE in that dispatch. Suite asserts NEW, APPROVED, DONE, approved_by Craig, dispatched_by Craig, one task DONE. Fail-first: expect DONE as NEW failed (156 passed, 1 failed, exit 1), then restored to 157 passed, 0 failed. |
| 7.4 Change task with no human dispatch cannot execute; attempt and show refusal | PASS | receiveDispatch without dispatched_by refuses. Blank dispatched_by refuses. dispatched_by zeus refuses. tryAutonomousChange refuses. After each attempt `listTasks().length === 0`. |
| 7.5 Scheduled observation writes heartbeat and finding and nothing else | PASS | `runObservation` with mock GET: writes.activity and writes.findings nonempty, writes.tasks.length === 0, writes.other empty, no POST, store tasks remain empty, zeus heartbeat present. Workflow `.github/workflows/agent-ops-observe.yml` uses on.schedule. No pg_cron. No Vercel Cron claimed. |
| 7.6 Retrieval without authorizer refuses; with authorizer records budget, sources, cost | PASS | queueRetrieval without authorizer refuses, firecrawl_ran is not true, no retrieval row. With authorizer Craig: budget and sources recorded, cost UNKNOWN, never 0. cost 0 stored as UNKNOWN. |
| 7.7 Python dash audit clean | PASS | python3 scan of 17 Prompt 66 files: scanned_files=17, dash_hits=0, exit 0. Same files listed under Heracles proof. Suite also asserts dash clean on that set. |

---

## Honest remainder

Origin eight runtime plus eleven
contract-only roster remains
UNVERIFIED. Origin URL remains
UNVERIFIED. Do not invent those
names. Do not invent a GitHub URL.

7.1 now also records the suite
proof that deployed site routes
omit the console. It does not
claim Argus CLEAN. It does not
invent G1 closed.

7.2 Origin eight plus eleven
stays UNVERIFIED.

---

## Heracles proof (2026-09-18)

Command (same loop as
`.github/workflows/suites.yml`):

```
set -e
shopt -s nullglob
count=0
for t in deploy/*.test.mjs; do
  echo "== $t =="
  node "$t"
  count=$((count + 1))
done
echo "Ran $count Node suites."
```

Result: 88 Node suites, 88
passed, 0 failed. Counted
checks: 3488 passed, 0 failed
(70 ok() suites plus 6 node:test
suites totaling 46). Twelve
assessment suites print PASS
without a numeric check count.

Also: `node deploy/prompt66-agent-ops.test.mjs`
157 passed, 0 failed.

Canon reconciled before those
assertions, Prompt 66 did not
change it:

- Worker 15 is day 9, pain 4 in
  `deploy/worker-dashboard.html`
  (`day:9`, `pain:4`),
  `deploy/hse-portal.html`
  (`day`: 9), and
  `deploy/clinical-dashboard.html`
  (`day`: 9, `pain`: 4).
- Worker 08 is off work as of
  day 18 in
  `deploy/hse-portal.html`
  (`status`: `off_work`, `day`:
  18) and
  `deploy/clinical-dashboard.html`.
- Tenant actives sum: Employer B
  7 + Employer A 12 + Employer C
  5 = 24. Sandbox 28 excluded.
  `deploy/canon.test.mjs`: 11
  passed, 0 failed.

Fail-first: temporarily expected
SYNTH status DONE as NEW.
`node deploy/prompt66-agent-ops.test.mjs`
then printed `FAIL: SYNTH status
DONE`, 156 passed, 1 failed,
exit 1. Assertion restored.
Rerun: 157 passed, 0 failed.

Python dash audit (7.7), files
scanned:

- `.github/workflows/agent-ops-observe.yml`
- `deploy/prompt66-agent-ops.test.mjs`
- `docs/prompts/66/ACCEPTANCE.md`
- `docs/prompts/66/REGISTER.md`
- `docs/prompts/66/SECTION_1.md`
- `docs/prompts/66/STOPS.md`
- `internal/agent-ops/.gitignore`
- `internal/agent-ops/README.md`
- `internal/agent-ops/db/0001_prompt66_agent_ops.sql`
- `internal/agent-ops/lib/http.mjs`
- `internal/agent-ops/lib/observation.mjs`
- `internal/agent-ops/lib/retrieval.mjs`
- `internal/agent-ops/lib/store.mjs`
- `internal/agent-ops/lib/zeus.mjs`
- `internal/agent-ops/observe.mjs`
- `internal/agent-ops/server.mjs`
- `internal/agent-ops/ui/index.html`

Result: scanned_files=17,
dash_hits=0, exit 0.

Did not claim Argus CLEAN. Did
not invent G1 closed. Did not
ship. Did not commit.

---

## Independent STOPs still standing

Prompt 53 holds were released
2026-09-16 by Craig. Former Prompt
53 holds are no longer binding
under Prompt 53. Hold lift is not
an auto-execute.

- Draft PR only. Athena does not
  ship. Hermes ships Continuum
  only when Craig names ship.
- Named human dispatch still
  required before Montreal,
  Bedrock, non-SYNTH seed, or live
  schema apply.
- No Continuum env attach (B1).
- Firecrawl needs a recorded
  authorizer (B2).
- No live schema apply.
  `internal/agent-ops/db/0001_prompt66_agent_ops.sql`
  is FILE ONLY when written.
- Do not land tables in
  supabase/migrations, platform/db,
  or clinical/db.
- Locked root `package.json` stays
  locked.
- B1, G1, HIL-1 to HIL-11,
  standing retrieval policy, and
  platform production stay
  untouched.
- No credentials in repo or chat.
  Env NAMES only.

---

## What this draft did not do

- Did not overwrite
  [SECTION_1.md](SECTION_1.md).
- Did not apply a migration.
- Did not edit any
  `package.json`.
- Did not invent Origin agent
  names or a GitHub URL.
- Did not invent G1 closed or
  REV 2.
- Did not attach to a Continuum
  environment.
- Did not claim a repo-wide
  Argus CLEAN. Do not claim
  the Prompt 66 scope patrol
  returned no findings.
  ARGUS-HYG-177-001 remains
  open until this honesty
  fix.
- Did not resolve B1, G1, HIL-1
  to HIL-11, standing retrieval
  policy, or platform production.
- Did not ship.
