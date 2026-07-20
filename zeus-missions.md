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
- Status: QUEUED
- Lead: athena
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: none expected. If the fold-in touches schema, stop for Gary.
- Note: the S12d fold-in from the series. Smallest correct change; hand every
  function to Heracles with its tests.

### M2: Hub Worker card (S12f)
- Status: QUEUED
- Lead: apollo for the card copy and design, athena for wiring
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: none for the Worker card itself. Publishing other portal cards is
  a separate ruling (see backlog B1).
- Note: the S12f hub Worker card. Worker tone laws apply: gold never red, grade
  7, no guilt mechanics.

### M3: Dashboard deployment (S13c)
- Status: QUEUED
- Lead: hermes, with athena for any build wiring
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: none expected.
- Note: the S13c dashboard deployment. Direct push to main, smoke check on
  deploy, rollback before diagnosis if the smoke check fails.

### M4: Demo edge function (S12a)
- Status: QUEUED
- Lead: athena
- Gates: Heracles green, Argus clean, canon consistency
- Human gate: if the function reads or writes schema, stop for Gary.
- Note: the S12a demo edge function. Three-layer resilience is mandatory on the
  data path; UNKNOWN never renders as 0.

### M5: First full Argus patrol
- Status: QUEUED
- Lead: argus
- Gates: none to clear (Argus changes nothing); findings become backlog.
- Human gate: none.
- Note: a full patrol of the repo as it stands. Run every scan: dash audit,
  privacy vocabulary, canon, gold-never-red, links, storage key collisions.
  Every finding lands in the backlog below with file and line, and Zeus routes
  each fix to its lead.

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

### B3+: Argus patrol findings
- Status: QUEUED (populated by M5)
- Note: findings from the first full patrol land here, each with file and line,
  each routed by Zeus to its lead.

## DESIGN-1 backlog (from Apollo's baseline pass)

### S-DESIGN-A: Employer inference-channel ruling and fix
- Status: PARTIAL. D1-F01 resolved and shipped; D1-F02 still BLOCKED on a ruling.
- Lead: apollo, with argus and calliope co-sign; athena for the wiring
- D1-F01 RESOLVED (Gary ruled 2026-07-20): the employer tag "Clinician reviewing"
  is replaced with the Prompt 19 canon phrase "Awaiting clinical review"
  (employer-dashboard.html 327 and 388). Shipped.
- D1-F02 BLOCKED on Gary's ruling: liveRtw() line 187 gives escalated a base of
  45, below light_duty 55, so an escalated worker reads as lower readiness than a
  light-duty one, quantifying a setback. Options: hold the last functional value
  across an escalation, or leave the dip as legitimate functional readiness.
  Zeus will not guess a privacy-law call. No fix until Gary decides.

### S-DESIGN-B: prefers-reduced-motion guards
- Status: QUEUED
- Lead: apollo
- Note: add a reduced-motion block to worker-dashboard, hse-portal,
  clinical-dashboard, wcb-portal, admin-portal; extend the partial one in
  employer-dashboard (D1-F03, F05, F06). The pattern already exists in
  worker-embed.html and continuum_workflow_app.html.

### S-DESIGN-C: Worker-app accessibility
- Status: QUEUED
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
- Status: QUEUED
- Lead: apollo
- Note: HSE red pain sparkline to desaturated amber (D1-F08), hub and marketing
  :focus-visible rings (D1-F10), secondary-button touch targets (D1-F11), delete
  dead fadeUp keyframe in index.html (D1-F09). Minor.

### S-DESIGN-F: Argus re-scan after S-DESIGN-A
- Status: QUEUED (gated on S-DESIGN-A landing)
- Lead: argus
- Note: re-scan the employer and worker bridge to confirm no other escalation
  state leaks into a functional-only surface.
