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
- Status: BLOCKED (needs the site-build series spec from Gary)
- Lead: athena
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: none expected. If the fold-in touches schema, stop for Gary.
- Note: the S12d fold-in from the series. Smallest correct change; hand every
  function to Heracles with its tests.

### M2: Hub Worker card (S12f)
- Status: BLOCKED (needs the site-build series spec from Gary)
- Lead: apollo for the card copy and design, athena for wiring
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: none for the Worker card itself. Publishing other portal cards is
  a separate ruling (see backlog B1).
- Note: the S12f hub Worker card. Worker tone laws apply: gold never red, grade
  7, no guilt mechanics.

### M3: Dashboard deployment (S13c)
- Status: BLOCKED (needs the site-build series spec from Gary)
- Lead: hermes, with athena for any build wiring
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: none expected.
- Note: the S13c dashboard deployment. Direct push to main, smoke check on
  deploy, rollback before diagnosis if the smoke check fails.

### M4: Demo edge function (S12a)
- Status: BLOCKED (needs the site-build series spec from Gary)
- Lead: athena
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: if the function reads or writes schema, stop for Gary.
- Note: the S12a demo edge function. Three-layer resilience is mandatory on the
  data path; UNKNOWN never renders as 0.

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
- Status: QUEUED
- Lead: heracles, with hermes for the CI wiring
- Gates: Heracles green (the canon suite itself must pass), Argus clean.
- Note: wire the canon suite into CI so canon drift fails the build. Marcus at
  day 9 pain 4, Cardinal off work day 18, per-tenant numbers that sum.

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
- S-DASH-SWEEP (M5-F06, F07): QUEUED. Em/en dashes in support.js vendor doc
  comments (not visitor-facing) and three internal specs docs (PROMPT_04,
  Wireframe_Reference_v2, PROMPT_05_RECONCILIATION). The five *.test.mjs dash
  hits are the detector's own regex and must stay. Lead: calliope (specs),
  athena (runtime). Priority low.
- S-ADMIN-COPY (M5-F05): QUEUED. admin-portal.html:196 "Keep it off
  (recommended)" uses "recommended" for a config default, not a product claim.
  Optional reword. Lead: calliope. Priority low.

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
- Status: QUEUED
- Lead: apollo
- Note: entrance stagger + hover lift + press feedback on the six hub cards,
  transform/opacity only, 200-400ms, inside a reduced-motion guard. Hub does not
  load support.js, so no background-tab throttle. Enhancement, no finding.

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
