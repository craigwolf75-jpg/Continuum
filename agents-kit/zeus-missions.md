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
- Status: QUEUED
- Lead: apollo
- Gates: none to clear (a baseline audit and plan; findings become backlog).
  Any surface change it recommends returns as its own mission through the
  normal gates.
- Human gate: none.
- Note: Apollo's onboarding mission, seeded ahead of the first Argus patrol.
  Audit the site's current visual system and motion against his laws (motion
  serves comprehension, prefers-reduced-motion honored, performance as a design
  property, the healthcare register, no visual treatment reintroducing clinical
  inference). Deliver the Figma source of truth for the existing pages. Produce
  a prioritized motion plan for the hub and demo cards. Every finding lands in
  the backlog below.

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
