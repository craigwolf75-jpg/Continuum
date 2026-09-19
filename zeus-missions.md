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

### P-G1: Prompt G1 discovery audit of the live platform
- Status: IN PROGRESS. Audit task REGISTERED AND RELEASED. Reading lane. Draft PR. Report landed at `docs/prompts/G1/G1_AUDIT_REPORT.md`. Not G1 closed. Not a stack decision. Not a Continuum product release. Athena does not ship. Do not dispatch Hermes.
- Lead: athena (hosting, residency, schema, auth, consent, identity, change path), argus (Section 5 privacy, Prompt 34 search, dash patrol). Zeus integrates. Hermes only when Craig names ship.
- Gate: draft PR only. Section 5 urgent finding is documented first in the PR for Craig. Do not fix it. Heracles suite is not this mission (docs only). Argus patrolled Section 5; do not claim product-surface CLEAN. Hermes ships Continuum only when Craig names ship.
- Scope: read only discovery audit. Craig prompt written 8 August 2026. Builds nothing. Changes nothing. Facts only: VERIFIED with evidence or UNVERIFIED with the blocker. No patient row contents. Credentials by storage name only. Citation map: Craig 47 through 50 resolve to unified 51, Master Person Index, unified 52, and Product Behaviour. Prompt 10, 27/28/29, 33, 34 are original live-platform numbers. Prompt 53 holds were RELEASED 2026-09-16; hold lift is not an auto-execute; do not invent G1 closed. Root `G1_AUDIT_REPORT.md` dated 2026-08-13 is a prior claim, not this report.
- Base tip: `69615358f1ca20c93ffdf65532121d9d6d163a28` (PR 181 / Prompt 69 register)
- Branch: `cursor/g1-discovery-audit-11af`
- Human gate: Craig platform decision after this report. Section 5 urgent finding is Craig's immediately. Do not begin Azure versus Supabase migration. Do not change any region. Do not apply live schema.
- Result so far: Draft PR 182. `docs/prompts/G1/` holds REGISTER.md, G1_AUDIT_REPORT.md, STOPS.md. Live Supabase `agzhnmunodrhsjbogzae` region `ca-central-1` CANADA VERIFIED. Vercel `continuum-o51l` production from main, regions `iad1`, NOT CANADA. Section 5 URGENT: HSE HTML carries diagnosis, pain, mobility, and clinical narrative. Live P56 views no longer expose those SQL columns. Preview shares production DB keys. Do not claim Argus CLEAN. Do not claim product PASS. Draft PR only. Athena does not ship.

### P69: Prompt 69 Canadian physician systems research
- Status: REGISTERED. Reading lane, hold compatible. Draft PR. Registration only. Not a Continuum product release. Not a product PASS. Research claims remain UNVERIFIED for product use until dated re-check.
- Lead: calliope (register, section 00, stops, acceptance, report source record), argus (patrol). Athena does not ship. Do not dispatch Hermes.
- Gate: draft PR only. Registration complete when docs landed. Research claims remain UNVERIFIED for product use until dated re-check. Not a product PASS. Hermes ships Continuum only when Craig names ship.
- Scope: registration only. Unified Prompt 69, registered 21 August 2026. Reading lane, hold compatible, like architecture documents. Architecture recommendation and top five integration targets are INPUT to human decisions. Platform decision is Craig's after G1. Any integration build touching clinician product sits in the platform lane behind the same gates as unified Prompt 68. Nothing in this registration releases anything. Evidence discipline flag: 54 source links lack retrieval dates; Prompt 64 source rules before source registry or customer-facing use; quarterly re-verify for board channel claims. Coherence with Board Integration Matrix: disagreements are findings to re-verify, not a silent preference. Feeds Prompt 68, Prompt 45, and the integration roadmap. Handed to a second reader as the preamble invites. Do not start Ocean, Accuro, TELUS, or board integrations. Do not touch clinician product or public site. Do not invent API credentials. Do not convert the OntarioMD table to a national share. SMART on FHIR eliminated per Continuum build package 13.4 for Alberta. Do not claim board APIs that do not exist.
- Base tip: `8b9b097963e6b425d727e852230bafea6ad30752` (PR 180)
- Branch: `cursor/prompt-69-register-0acb`
- Human gate: Craig platform decision after G1; dated re-check of sources before registry or customer-facing use; disagreements with the Board Integration Matrix stop and re-verify; any later integration build sits behind Prompt 68 gates.
- Result so far: `docs/prompts/69/` holds REGISTER.md, SECTION_00.md, STOPS.md, ACCEPTANCE.md, REPORT.md. Research claims UNVERIFIED for product use. Do not claim Argus CLEAN. Do not claim product PASS. Draft PR only. Athena does not ship.

### P68: Prompt 68 clinician experience build package
- Status: REGISTERED NOT RELEASED. Companions missing (NOT IN HAND as supplied). Draft PR. Registration only. Not a Continuum product release. Not a clinician product PASS.
- Lead: calliope (register, section 00, stops, blocked acceptance, package source record), argus (patrol). Athena does not ship. Do not dispatch Hermes.
- Gate: draft PR only. Acceptance BLOCKED until (a) companions in hand or Craig confirms they will not be supplied, (b) hub auth verified by Craig, (c) G1 discovery audit and Craig platform decision release this lane, (d) Craig confirmation on the Section 00.5 version flag if needed. Hermes ships Continuum only when Craig names ship.
- Scope: registration only. Unified Prompt 68, registered 21 August 2026, ContinuumRTW Inc. Version 1.0. Supersession scoped to clinician SCREEN DESCRIPTIONS only. Citation map: Craig 38 to unified 41, 51 to 58, 42 to 45. `clinician-home.html` md5 `64ff54939f597c8cee3cecb5f730d29d` and `first-report.html` md5 `bb4a14c8c036d2990777612f02828511` were not supplied. Do not invent or reconstruct them. Do not rewrite existing clinician screens. Do not touch the public website, marketing homepage, public sign in, or public branding. Do not apply live migrations. Do not release the bulk accelerator withdrawal. SYNTH only. OQ-016 blocks consent Card A text. No dollar figures in clinician UI. Saskatchewan and Ontario architecture only.
- Base tip: `5beea705d4ea16be8fa9e1769df691b4cc92fc64` (PR 179)
- Branch: `cursor/prompt-68-register-61dd`
- Human gate: Craig or Gary upload the two companion HTML files or confirm they will not be supplied; Craig verifies hub auth; G1 and platform decision; Craig version flag 00.5; OQ-016 recording retention before consent text ships; OQ-008 who completes the return to work section; nurse practitioner board contradiction (do not claim NP support); Saskatchewan and Ontario sequencing.
- Result so far: `docs/prompts/68/` holds REGISTER.md, SECTION_00.md, STOPS.md, ACCEPTANCE.md, PACKAGE.md. Companions NOT IN HAND. Hub auth UNVERIFIED. G1 not closed. Prompt 53 holds were released 2026-09-16 by Craig; hold lift is not an auto-execute; do not invent a Prompt 68 release. Do not claim Argus CLEAN. Do not claim product PASS. Draft PR only. Athena does not ship.

### P67: Prompt 67 public landing onto continuumrtw.com, gate holds lifted
- Status: IN PROGRESS. REGISTERED. Craig named BUILD 2026-09-19 with gate holds lifted. Draft PR. Not a Continuum product release. Athena does not ship. Do not dispatch Hermes.
- Lead: athena (allow-list `/` and `/index.html`; reuse checkout landing; keep `/hub` and portals gated), calliope (register, section 00, stops, acceptance progress), heracles (full suite), argus (patrol). Apollo confirm-only on the existing landing. Hermes only when Craig names ship.
- Gate: draft PR only. Named human gates progressed: (a) checkout `deploy/index.html` verified as Prompt 67 landing and used; (b) both gate rulings named by Craig 2026-09-19; (c) ICON hero named by Craig 2026-09-19. Not ship-ready. Do not claim Argus CLEAN. Hermes ships Continuum only when Craig names ship.
- Scope: public landing is the site root. Allow-list `/` and `/index.html` plus existing public assets. Access code stays on `deploy/gate/holding.html`, reached via gated Sign In `/hub`. POST `/api/site-access` untouched. Reuse checkout landing (48965 bytes at verification, 48749 after comment-only trim). Do not invent HTML. Do not ungate the whole site. Do not touch G1 Section 5 HSE clinical content. Do not touch clinician or platform lane.
- Base tip: `326cc065c9d8657a3f4695c9c958c59c5f80398a` (PR 182)
- Branch: `cursor/prompt-67-public-landing-6065`
- Human gate: Hermes only when Craig names ship. Calendly hand confirm is go-live caution. og-image file exists (1200 by 630); identity as Prompt 40 founding-line asset UNVERIFIED. Unseen: approved landing spec, `Continuum_MVP.html`, Nexus name. Live outside-the-gate browser confirm UNVERIFIED.
- Result so far: Draft PR 183. Tip `81fb85e`. Athena restored `/` and `/index.html` on `ALWAYS_PUBLIC_EXACT`. Holding page keeps the code box behind gated Sign In `/hub`. Landing reused. Calliope updated `docs/prompts/67/`. Heracles full suite GREEN: 88 of 88 Node suites, 3503 passed, 0 failed. Argus scoped patrol: no findings on this patrol. Do not claim Argus CLEAN. Local gate-sim walk: `/` is the landing, `/hub` is holding with the code box. Draft PR only. Athena does not ship.

### P66: Prompt 66 admin agent operations and Zeus the Steering Dispatcher
- Status: IN PROGRESS. Section 1 written. Auth ruling: LOCAL INTERNAL DASHBOARD. Draft PR only.
- Lead: athena (tables, dispatcher, local console, observation), apollo (internal layout), calliope (register, stops, acceptance, operator copy), heracles (suite), argus (patrol)
- Gate: draft PR only. Athena does not ship. Hermes ships Continuum only when Craig names ship. Do not dispatch a ship.
- Scope: Continuum product Zeus role (Steering Dispatcher) plus a locally bound agent operations console. Zero public exposure. Agents observe and report only. Change executes only from a named human dispatch. No Continuum env attach (Prompt 64 B1). No Firecrawl without authorizer (B2). No live schema apply. No platform, worker, or former Prompt 53 surfaces.
- Base tip: `cc017c897fa65e4384ce9faa51cc6f757602be0d` (Prompt 65 #176)
- Branch: `cursor/prompt-66-agent-ops-7237`
- Human gate: four new tables are FILE ONLY. Gary or Craig live-apply is not this mission. Standing retrieval policy stays with Gary. B1, G1, HIL-1 to HIL-11 untouched.
- Result so far: Draft PR 177. `docs/prompts/66/` holds SECTION_1.md, REGISTER.md, STOPS.md, ACCEPTANCE.md. Auth ruling is LOCAL INTERNAL DASHBOARD on `127.0.0.1`. Product code is under `internal/agent-ops/` with FILE ONLY schema, Continuum Zeus Steering Dispatcher, observation CLI, retrieval refuse gate, and Apollo UI. CI proof is `deploy/prompt66-agent-ops.test.mjs` (157 passed). Full deploy suite 88 files GREEN. Argus FAIL ARGUS-HYG-177-001 open until this honesty fix. Do not claim Argus CLEAN. Origin eight-plus-eleven remains UNVERIFIED. Draft PR only. Athena does not ship.

### P65: Prompt 65 site lane production readiness and staged data purge
- Status: IN PROGRESS. Sections 1 and 2 complete. Pending Gary purge gate. Draft PR. Section 4 purge MUST NOT run.
- Lead: athena (wiring verify and inventory, SELECT only), calliope (register, stops, section 3 gate), argus (patrol)
- Gate: draft PR only. Athena does not ship. Continuum ships only when Craig names ship. Do not treat this as a ship order. Do not dispatch a ship.
- Scope: public site lane at continuumrtw.com only (access gate, lead capture, public Injury Recovery Assessment). Worker, physician, employer, coordinator, platform auth, and former Prompt 53 platform items are out of scope.
- Base tip: `bf69f17c462a64a3176ff1da7749dc6184a992da` (Prompt 64 registered #175)
- Branch: `cursor/prompt-65-site-lane-fbe0`
- Human gate: Section 3. Gary must reply exactly `purge approved 0` plus the inventory row total 0. A mismatch or anything less explicit means stop. Data deletion is not a migration. Zero deletions this mission.
- Result so far: `docs/prompts/65/` holds REGISTER.md, STOPS.md, SECTION_1.md, STAGED_DATA_INVENTORY.md, SECTION_3_GATE.md. Commissioned count(*) snapshot: marketing_leads 0, public_assessment_response 0, access_log 110 (operational NON-SYNTH), access_codes 2 NEVER. Safe access_log SYNTH rule is code_label ILIKE SYNTH% only (0). N = 0 rows proposed for deletion. list_tables vs count(*) drift is UNVERIFIED; prefer count(*). Later Section 1 probe recount (leads 1, access_log 125) is a FLAG for Gary, not a second N. Hosting env NAMES UNVERIFIED. Correct admit UNVERIFIED. Rate-limit 11th rapid 429 FAIL live. Book a demo is `/book` (finding, not a fix). Argus docs patrol after the N=0 correction: CLEAN. Not a product-surface CLEAN claim.

### P64: Prompt 64 agent testing system registered
- Status: DONE. Draft PR 175. Tip `8e4ed5d4791182e3ae9ed7a37ee1d09762954a87`.
- Lead: calliope (register, section 00, stops), athena (structure and Origin pointer), argus (patrol)
- Gate: draft PR. Registration only. No product or runtime change. Hermes ships Continuum only when Craig names ship. Argus patrol on the register files: CLEAN.
- Base tip: `3e3dbf1b545906e215f20a36d71a29df2195d61a` (PR 174 merged; newer than named `16d61ff4b82ace52069b7cc2c900a1b152b4eb48`)
- Branch: `cursor/prompt-64-register-492e`
- Human gate: no Continuum env attach without Craig named credentials via secret store; Firecrawl needs Craig approval; HIL-11 CIPS and STAT-Q1 / HIL-9 stay human. Commissioning brief not supplied, on the ask list. Origin testing repo URL UNVERIFIED.
- Result: `docs/prompts/64/` holds REGISTER.md, SECTION_00.md, STOPS.md. Honest state: EXECUTED against the conformance reference; nothing VERIFIED AGAINST CONTINUUM. README is stale. No product or runtime change.

### P63c: Prompt 63c assessment opt-in save (do not ship)
- Status: DONE. Merged on tip `bcf16e4d58706c7a5b767f113708cb34d841b737` (PR 172). Hygiene and register close on this follow-up tip (do not ship).
- Lead: athena (architecture), calliope (register and save explainer), heracles (suite), argus (patrol)
- Gate: draft PR only. Athena does not ship. Hermes does not treat this as a ship.
- Base tip: `18d416e91635ca952cc0df1f74b97fce1b259a2b`
- Merge tip: `bcf16e4d58706c7a5b767f113708cb34d841b737`
- Companions: 63a (consent copy gate, now resolved), 63b (seven rulings), 63c (Gary ruled (b) 2026-08-16)
- Human gate: consent language beyond Gary named strings. Do not invent privacy or terms. Section 00 item 4 binds: own result only until counsel discloses aggregate use.
- Result: product opt-in save merged on PR 172. Save explainer is the honest sentence only (anonymous summary of the result already shown). Persist test asserts that sentence. Fail path names a retry in a few minutes. No aggregate "improve the assessment" claim. No invented privacy or terms.

### P61: Prompt 61 psychological injury (do not ship)
- Status: IN PROGRESS
- Lead: athena (architecture), calliope (register and stops), heracles (suite)
- Gate: draft PR only. Athena does not ship. Hermes does not treat this as a ship.
- Result so far: Section 1 written before product code. Section 2 C1447
  verified and skipped (Prompt 60 already built it). Allowed psych
  pathway built against SYNTH. Section 10 open items reported, not
  decided. Draft PR only.
- Residual named 2026-09-17: `#coordinator` and `#helpnow` ids on
  `deploy/worker/get-help.html` (draft PR, do not ship). `#resources`
  already landed in #169. Athena does not ship.
- Human gate: Section 10.1 counsel, 10.2 counsel, 10.3 Craig, 10.4 Craig.
  Do not decide in code.

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
  color), admin clean, canon consistent (Worker 15 day 9 pain 4, Worker 08 day 18,
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
- Result: deploy/canon.test.mjs proves the ledger across surfaces (Worker 15 day 9
  pain 4 on worker/hse/clinical, Worker 08 off work day 18 on hse/clinical,
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

## Prompt 12j mission (from the chat stream)

### SITE-12j: worker sign-up and onboarding with real accounts
- Status: BLOCKED (Phase 2 backend, waiting on the human counsel gate for consent
  copy; sits behind the D12 pilot-minimum ruling and the D5/D6 counsel
  dependencies). Recommended by August 1.
- Scope: real accounts on the deployed site, the backend twin of the artifact
  wizard shipped in Prompt 12j (deploy/worker-dashboard.html).
- Auth: Supabase Auth with email magic links (no passwords for a workforce that
  includes people who will never keep one), plus a coordinator invitation path: the
  coordinator creates the case, the worker receives a secure invitation link that
  binds their new account to it.
- Onboarding: mirrors the artifact wizard exactly (welcome, consent, basics, first
  check-in) with the consent step rendering counsel's approved text, version-stamped
  and stored with a timestamp on acceptance. The human gate applies to that copy and
  it does not ship without counsel sign-off.
- Data model: workers see only their own rows under row-level security scoped to
  their authenticated identity; the employer-facing projection is produced server
  side under the standing serialization test; no clinical field is ever selectable by
  an employer role, matching the deploy/bridge.js functional allowlist.
- Leads by nature of work: Athena owns the schema and the RLS floor, Calliope owns
  every word at grade level, Heracles proves the walls with authenticated-role tests
  including a worker who attempts another worker's row, Hermes deploys dark behind a
  flag until counsel clears the consent copy.
- Human gate: Gary and counsel on the consent copy and the retention or consent
  wording (D5, D6) before any live data.
