# Zeus Mission Queue

Zeus reads this file, executes the first mission not marked done, and updates
it in place. This file is Zeus's working memory between sessions. Status values:
QUEUED, IN PROGRESS, BLOCKED (waiting on a human gate), DONE.

Each mission names its lead by nature of work, the gates it must clear, and any
human gate that stops for Gary.

Numbering note: the roster IDs (12 Zeus, 12a Athena, 12b Apollo, 12c Heracles,
12d Hermes, 12e Argus, 12f Calliope) name the agents. Mission series references
carry an S prefix (S12a, S12d, S12f, S13c) so no bare 12x tag ever collides with
an agent ID. Each mission's own queue ID is DESIGN-1 or M1 to M5 (active) or B1
onward (backlog); an S tag records only which site-build series item the mission
folds in.

## Active queue

### DESIGN-1: Apollo baseline pass
- Status: DONE (audit + motion plan), with one part deferred and one escalated.
- Lead: apollo
- Result: audit of all ten visitor-facing surfaces delivered against the five
  laws; 12 findings (D1-F01..F12) distilled into backlog items S-DESIGN-A..F
  below; reduced-motion sweep and a hub + demo-card motion plan delivered.
- Deferred (human/tooling gate): the Figma source of truth for existing pages
  was NOT produced. It creates external artifacts in Gary's Figma and needs the
  integration connected; it stops for Gary.
- Escalated (canon + human gate): findings D1-F01/F02 (employer "Clinician
  reviewing" tag and escalation-driven RTW dip) may or may not be law-5 leaks,
  because Prompt 19 canon explicitly permits "awaiting clinical review" as an
  employer phrase. Awaiting Gary's ruling before any fix (see S-DESIGN-A).
- Stack finding: this repo is plain HTML/CSS/JS, so Apollo's Framer Motion and
  React toolkit maps onto CSS transitions here; the React stack is continuum-app.

### M1: Fold in S12d
- Status: DONE.
- Lead: athena
- Result: single-sourced the worker bridge projection into deploy/bridge.js
  (ContinuumBridge.writeBridgeShared over a functional allowlist; any key not on
  the list is dropped, so no clinical field can ever cross). worker-dashboard,
  continuum_workflow_app, and worker-embed now build their fields and call the
  one shared writer; the dead BRIDGE_KEY const was removed. Payloads unchanged
  (consumers read by key). deploy/bridge.test.mjs (15 checks, auto-run by
  suites.yml) proves allowlist-only + clinical fields dropped + one writer. This
  closes M5-F02 / S-BRIDGE-WRITERS at code level, not just doctrine. Full suite:
  7 suites, 146 checks green. Argus clean, no direct bridge setItem left in any
  surface.

### M2: Hub Worker card (S12f)
- Status: DONE.
- Lead: calliope (copy), apollo (emphasis), athena (route)
- Result: the hub Worker card copy is finalized to grade-7, calm, next-step
  visible ("Do a quick check-in, see your duties for today, and follow your
  plan. Open it to start."). Gold not red, no guilt mechanics. It remains the
  emphasized primary path (full-width gold, lands first via S-DESIGN-D) and
  routes to the worker dashboard. Argus clean.

### M3: Dashboard deployment (S13c)
- Status: DONE.
- Lead: hermes (smoke gate), athena (resilience)
- Result: deploy/smoke.test.mjs (35 checks, auto-run by suites.yml) is the
  deployment smoke gate. For every interactive surface it parse-checks the inline
  script (a syntax error is a blank deploy, so it fails the build), and asserts
  the mount element, a render path, a live read, and a try/catch degradation path
  (three-layer resilience). All surfaces parse and pass; no resilience gaps found.

### M4: Demo edge function (S12a)
- Status: DONE.
- Lead: athena
- Result: deploy/api/status.js is a Vercel serverless function at /api/status
  returning operational telemetry only (ok, region, surfaces, surfaceCount,
  generatedAt) with no case content or worker facts. Three-layer resilience:
  live VERCEL_REGION, then CONTINUUM_REGION, then the string UNKNOWN (never 0);
  it never throws to the caller. deploy/api-status.test.mjs (12 checks, auto-run
  by suites.yml) proves operational-only, UNKNOWN-not-0, and no-500. Prod reach
  of /api/status verified at deploy. Argus clean.

### M5: First full Argus patrol
- Status: DONE. Seven patrols run; findings in B3 below.
- Lead: argus
- Result: NO confirmed law violation on any live visitor product surface.
  Employer surface visually clean (all trend arrows green, no red, no alarm
  color), admin clean, canon consistent (Marcus day 9 pain 4, Cardinal day 18,
  per-tenant sums 7+12+5=24), 11 storage keys no collision, hygiene clean (no
  secrets; publishable key correctly labeled). Six findings surfaced, all drift
  or housekeeping or governance rulings, none a live breach. Absorbed S-DESIGN-F
  (bridge re-scan): bridge payloads are clinically clean of pain/mobility/notes.

## Backlog (seeded)

### B1: Six portal hub cards
- Status: BLOCKED (human gate)
- Blocked on: Gary's ruling on which portals go public.
- Lead when unblocked: apollo for cards, athena for wiring.
- Note: the six portal hub cards wait on the publication ruling. Zeus does not
  decide which portals go public; he asks once and waits.

### B2: Canon suite into CI
- Status: DONE.
- Lead: heracles (canon suite), hermes (CI wiring).
- Result: deploy/canon.test.mjs proves the ledger across surfaces (Marcus day 9
  pain 4 on worker/hse/clinical, Cardinal off work day 18 on hse/clinical,
  non-sandbox tenant active sums to 24 on admin, plus the canon copy). Wired into
  CI via .github/workflows/suites.yml, which runs every deploy/*.test.mjs on push
  and pull_request to main, so a portal-suite failure or canon drift fails the
  build. Runs alongside the existing exposure-proof SQL gate. One unsound "no day
  12 or 21" assertion was watched failing, diagnosed as a false positive (the
  21-day prognosis is canon), and removed. Full run: 6 suites, 131 checks green.

### B3: Argus M5 patrol findings

Zeus note: two findings that looked like violations to Argus are resolved by
canon he did not hold. Prompt 05 reconciliation (client-governed) makes HSE an
authorized viewer of pain and mobility scores, so HSE showing pain/mobility is
NOT a breach. But Prompt 05 also makes diagnosis Nexus-only, so the two items
below turn on one narrower question for Gary: how much injury/diagnosis
vocabulary is allowed off the Nexus surface.

- S-HSE-DIAGNOSIS (M5-F01): RESOLVED (Gary ruled 2026-07-20, keep as-is). Canon
  clarified: injury-type naming ("grade 1 supraspinatus strain") is authorized
  context on the HSE clinical operational seat, not a diagnosis leak. HSE
  pain/mobility was already canon-authorized. No change.
- S-INJURY-RULING (M5-F03): RESOLVED (Gary ruled 2026-07-20, keep as-is). The
  employer Injury column ("Right shoulder strain") is functional context for duty
  planning, not a suppressed diagnosis. "Diagnosis Nexus-only" reads as
  free-text/clinical detail, not injury-type naming. No change.
- S-BRIDGE-WRITERS (M5-F02): RESOLVED (doctrine clarified). Any WORKER surface may
  write the functional-only bridge (worker-dashboard, continuum_workflow_app,
  worker-embed); Argus verified all three payloads clinically clean. The law is
  "functional-only projection", not "single writer". No code change.
- S-APP-REDIRECT (M5-F04): DONE (Gary ruled 2026-07-20, not intended). The two
  /app redirects removed from vercel.json so /app serves the sign-in gate
  (app/index.html) again; the S-DESIGN-C focus fix is now live. noindex headers
  kept. Lead: athena/hermes.
- S-DASH-SWEEP (M5-F06, F07): DONE. The three internal specs docs (PROMPT_04,
  Wireframe_Reference_v2, PROMPT_05_RECONCILIATION) swept to the dash rule (0
  em/en dashes). support.js is vendor-generated ("do not edit", dashes in
  doc-comments only, not visitor-facing) so its 8 comment dashes are a documented
  upstream exception, alongside the *.test.mjs detector regexes.
- S-ADMIN-COPY (M5-F05): DONE. The pose-modal button "Keep it off (recommended)"
  is reworded to "Keep it off (default)", so no product-claim reading remains.

## DESIGN-1 backlog (from Apollo's baseline pass)

### S-DESIGN-A: Employer inference-channel ruling and fix
- Status: DONE. Both findings resolved and shipped.
- Lead: apollo, with argus and calliope co-sign; athena for the wiring
- D1-F01 RESOLVED (Gary ruled 2026-07-20): the employer tag "Clinician reviewing"
  is replaced with the Prompt 19 canon phrase "Awaiting clinical review"
  (employer-dashboard.html). Shipped PR #41.
- D1-F02 RESOLVED (Gary ruled 2026-07-20, hold last functional value): liveRtw()
  escalated base raised 45 to 55, and readBridge now holds the worker's last
  functional rtw across an escalation (prevRtw), reset when the bridge clears. An
  escalated worker never reads below functional readiness on the employer surface.

### S-DESIGN-B: prefers-reduced-motion guards
- Status: DONE. Universal reduced-motion block added to worker-dashboard,
  hse-portal, clinical-dashboard, wcb-portal, admin-portal; employer's narrow
  block widened to universal; worker-dashboard burst() confetti short-circuits
  under reduced motion.
- Lead: apollo
- Note: add a reduced-motion block to worker-dashboard, hse-portal,
  clinical-dashboard, wcb-portal, admin-portal; extend the partial one in
  employer-dashboard (D1-F03, F05, F06). The pattern already exists in
  worker-embed.html and continuum_workflow_app.html.

### S-DESIGN-C: Worker-app accessibility
- Status: DONE. app/index.html focus ring restored (outline:none removed, gold
  :focus-visible added); worker-dashboard action buttons raised to 44px via the
  shared .btn class.
- Lead: athena, apollo co-sign
- Note: restore a designed gold focus ring on the served worker app
  (app/index.html strips outline at ~66) and raise worker action buttons to a
  44px touch target (worker-dashboard.html ~276-284). Worker-facing (D1-F04, F07).

### S-DESIGN-D: Hub role-picker motion pass
- Status: DONE.
- Lead: apollo
- Result: hub/index.html .role cards now carry a 200ms transform/border/shadow
  transition with a hover lift (translateY -2px + soft navy shadow), a press
  (scale .98), and a staggered entrance (roleIn keyframes, opacity + translateY
  8px, 280ms, nth-child delays 0 to 300ms, worker card first). All neutralized by
  a prefers-reduced-motion guard (transition/animation none, transform none).
  Transform and opacity only, no CLS. Argus clean, focus ring intact, full suite
  green.

### S-DESIGN-E: Register and polish sweep
- Status: DONE. HSE pain sparkline recolored red to muted amber #B87A2E; gold
  :focus-visible rings added to hub and marketing; hub secondary-button touch
  targets nudged to 44px; dead fadeUp keyframe deleted from index.html.
- Lead: apollo
- Note: HSE red pain sparkline to desaturated amber (D1-F08), hub and marketing
  :focus-visible rings (D1-F10), secondary-button touch targets (D1-F11), delete
  dead fadeUp keyframe in index.html (D1-F09). Minor.

### S-DESIGN-F: Argus re-scan after S-DESIGN-A
- Status: DONE (absorbed into M5). Argus confirmed the bridge payloads are
  clinically clean (no pain, mobility, or notes) and the employer surface carries
  no red or alarm treatment. The only bridge issue is the 3-writer drift, tracked
  as S-BRIDGE-WRITERS, not an escalation leak.
- Lead: argus

## Prompt 34a mission (from the chat stream)

### SITE-34a: SIGMA Exchange hub card
- Add a seventh card to the /hub role select: SIGMA Exchange. Same card component
  and interaction states as the six existing roles (blue at rest, gold on
  activation, per the Prompt 33 redesign), icon swap_horiz, subtitle The
  system-of-record connection, linking to the SIGMA portal artifact
  (/sigma-portal.html). The card copy follows the plain-language standard and
  never claims a live integration: the phrase is proposed workflow.
- Argus patrols the new card under the register scan; Heracles extends the hub
  suite to seven cards; the human gate does not apply (no consent, legal,
  pricing, or schema content).
- Status: DONE (built by the hub-redesign session, verified and reconciled here).
- Result: the seventh hub card SIGMA Exchange is live, roleKey sigma, linking to
  /sigma-portal.html, subtitle "The system-of-record connection", copy "A proposed
  workflow, not a live integration". It uses the same React Card component as the
  six roles (blue at rest, gold on activation); the redesigned cards carry no
  icons, so matching the six is correct and the swap_horiz icon does not apply.
  Heracles hub suite extended to seven cards (39 checks green); Argus register scan
  clean, no live-integration claim; no human gate.
- Lead: hub redesign lane (Apollo design, Heracles suite, Argus patrol)
