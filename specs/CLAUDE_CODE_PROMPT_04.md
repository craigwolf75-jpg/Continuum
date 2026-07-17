# CONTINUUM PROMPT 04 (revised 2026-07-17) — Claude Code prompt 2: the working app

> This is the review-corrected version of the Prompt 04 draft. It folds in a
> repo audit performed against the actual deployed repo. The original draft
> assumed a repo state that does not yet exist. Read the PRECONDITION first:
> the build cannot start until it is satisfied. Items marked **[TO CONFIRM]**
> are product/design decisions the design phase must lock before or during the
> build; each carries a recommended default, not a final answer.

---

## 0. PRECONDITION (HARD GATE) — do not start the build until this is true

The original draft says *"the 13 hi-fi screens in the repo are the pixel spec,"*
*"move the screen gallery to /screens,"* and *"read the corresponding /screens
page and copy its markup."* **None of those pages exist in the repo.**

Audit of the repo on 2026-07-17 (branch `main`):

- The only HTML files are `deploy/index.html` (marketing landing),
  `deploy/demo/index.html` (the guided demo), and `deploy/404.html`.
- **Zero** per-screen pages. **Zero** `.dc.html` sources are committed — the
  markup only references them in comments (e.g. `Continuum Worker App.dc.html`,
  `Hub H2 Overview Dashboard.dc.html`).
- There is no `/screens` path anywhere.

**Gate:** commit the 13 hi-fi screen source files into the repo (ideally already
laid out as the `/screens/*` gallery this prompt will connect) BEFORE running
the build steps. Until they land, the "lift the exact markup" workflow that the
entire prompt depends on has no source to lift from.

**Also confirm [TO CONFIRM]:** if the screen designs currently live only *inside*
the 9-scene `/demo` (not as standalone pages), then "copy the /screens page
markup" is impossible as written — the markup would have to be reverse-extracted
from the demo or re-exported from the external `.dc.html` files. Decide which,
and get standalone screen files into `/screens` either way.

---

## 1. THE TARGET SHAPE

Landing page + working app, all still static-hostable on the same Vercel project
(Root Directory `deploy/`, auto-deploy on push to `main` — note there are now
**two** Vercel projects wired to this repo, `continuum` and `continuum-o51l`;
"confirm green" means both).

- `/` — the marketing landing page (exists; keep its design). **Add** an app-entry
  affordance to it (see §2 note: the page currently has NO "Sign in" control; its
  only CTA is "Start a Pilot" → `#cta`). Adding a header "Sign in" link that
  points at `/hub` is an explicitly-allowed edit to the otherwise-unchanged page.
- `/app` — the WORKER APP as one connected single-page experience: onboarding
  (5 screens) → Today → tap check-in (3 steps + completion) → movement session →
  progress → duties/messages/more, with a bottom tab bar (Today, Movement,
  Progress, More) and real client-side state. Router via `location.hash`.
- `/hub` — the CONTINUUM HUB as one connected single-page experience: login →
  role picker → that role's workspace with working navigation between its H2–H8
  surfaces **per the role's nav set (defined in §2a — do not leave undefined)**.
- `/demo` — keep the guided demo untouched.
- `/screens/*` — the per-screen hi-fi pages as a design-reference gallery (kept
  deployed and gated; they are the spec). Add a `/screens` index that links them.

---

## 2. HOW TO BUILD IT

- Plain HTML + vanilla JS. NO build step, NO framework install, NO bundler — the
  Vercel project serves static files from `deploy/` and must stay that way.
  **Default to vanilla.** Preact (single vendored file) is an ask-first exception,
  not a casual option; a localStorage store + manual DOM updates does not need it.
  Ask before adding ANY dependency.
- **[TO CONFIRM — architecture risk] support.js interplay.** The lifted markup
  depends on `support.js` (the `<x-dc>`/`<helmet>` runtime, `style-hover`, etc.).
  Before building, determine whether support.js is an inert style/hover shim
  (safe to mutate the DOM underneath with vanilla JS) or a live renderer that
  owns the DOM (in which case hand-written mutation will fight it and a different
  integration approach is required). Establish this on ONE lifted screen before
  scaling the pattern. Never edit or rename support.js.
- The hi-fi screens in `/screens` are the pixel spec. Lift their exact markup and
  inline styles; do not restyle. Where a gallery page shows several phones
  side by side (states/variants), the app shows ONE phone-width column
  (max-width 420px, centered, navy backdrop) and reaches the variants through
  real interaction instead.
- **State:** one plain JS store (localStorage-persisted) shared by `/app` and
  `/hub`, keyed `continuum_demo_state`. Seed it with the Day 9 baseline (see §2b
  for the FULL seed — the aggregate figures alone are not enough to render the
  dashboards). A visible "Reset demo data" control restores the seed, located in
  **[TO CONFIRM]** the hub (recommend: a hub account/settings menu in the H1
  shell chrome, since "settings" is not one of H2–H8) and in `/app` More.
- **Cross-surface reactivity is the wow.** A worker check-in updates the
  coordinator's check-ins KPI and adherence calendar; pain ≥8 raises an
  escalation on the coordinator dashboard; Frank assigning a duty makes it
  appear in Mateo's duties pending accept; Priya clearing a hazard check flips
  Frank's duty chip; Dr. Osei publishing a restriction update changes Frank's
  pinned RestrictionCard and Mateo's duties header; clearance READY →
  full_duty_pending → employer confirm closes the case.
  - **[TO CONFIRM — choreography] how "live" is observed.** localStorage is
    shared, but a presenter on one surface at a time sees nothing update unless
    you wire cross-tab `storage` events OR re-read state on every
    role-switch/navigation. Recommend: re-read on navigation (covers the
    role-switch demo) AND add `storage`-event listeners (covers side-by-side
    tabs). State which the demo script relies on.
  - **Every cross-surface propagation MUST apply the access-matrix translation**
    (see §3): the same event surfaces as clinical detail to the coordinator/
    physician and as functional-only language (Fine / Manageable / Too much) or
    not at all to supervisor/employer/leadership.
- **Status machine — [TO CONFIRM, then implement exactly].** The draft's
  `reported → off_work/treating → light_duty → full_duty_pending → signed_off,
  plus escalated` is ambiguous. Lock these before coding:
  1. Is `off_work/treating` one state or two? (Recommend: one combined state
     `off_work_treating`.)
  2. Is `escalated` a mutually-exclusive status or an OVERLAY flag that coexists
     with the current status? (Recommend: overlay flag — a worker on `light_duty`
     can be escalated by pain ≥8 without leaving light duty.)
  3. How does the physician clearance control (`READY` / `BETTER, NOT READY YET`)
     map to the status states? (Recommend: `READY` triggers
     `full_duty_pending`; employer confirm advances to `signed_off`.)
  Enforce the guards: only the physician role advances clinical status; only the
  employer confirms return (see §2a for who "employer" is).
- The movement session's camera is SIMULATED (looping keypoint animation, as the
  demo does) — no `getUserMedia`, no network dependency.

### 2a. Role → surface map and the "employer" actor — [TO CONFIRM]

The draft defers to *"the role's nav set"* but never defines it, and names an
"employer" who is not in the role picker. These are access-matrix decisions
(design law) and must be explicit. Recommended default, to confirm against the
design phase's matrix:

| Role (picker)      | Surfaces in its nav set        | Clinical data? |
|--------------------|--------------------------------|----------------|
| Coordinator (Dana) | H2 Overview, H3 Case-file      | Yes (care team)|
| Supervisor (Frank) | H4 Supervisor                  | No — functional only |
| HSE (Priya)        | H5 HSE                         | No — functional only |
| Physician (Osei)   | H6 Physician (+ clearance panel)| Yes            |
| Claims             | H7 Claims / early-warning      | Per matrix     |
| Leadership         | H8 Leadership analytics        | No — aggregates only |

**"Employer confirm"** is not a picker role as written. Confirm whether the
return-to-work confirmation actor is the Supervisor (Frank) or Leadership, and
map it to a concrete picker role — the case cannot close without it.

### 2b. The Day 9 seed — full, not aggregate-only — [TO CONFIRM the specifics]

Mateo R.: claim 2408841, Northline Industrial, right wrist sprain, day 9,
pain 3, ring 62%, two plan items done, duties (one accepted, one pending),
status `light_duty`, onboarding **complete** (see below).

Aggregates for the coordinator Overview: 28 / 18 / 24 / 64% / 76%,
cost impact $142,680, time loss 624 hrs (carry the Prompt 03 evidence figures:
63-day baseline WCB Alberta 2024; 763,326 / 274,022 / 1,056 AWCBC 2023).

**Missing from the draft — add:** per-worker seed records for the eight named
dashboard workers (Thompson, Miller, Johnson, Martinez, Anderson, O'Brien,
Clark, Singh) — each needs a status, adherence, and any early-warning flag, or
the coordinator case list, H7 early-warning board, and H8 analytics cannot
render live rows from the aggregates alone.

**Resolve the escalation contradiction:** the draft seeds "the escalation set"
while Mateo's pain is 3 (below the ≥8 trigger). Specify which worker/record is
pre-escalated in the seed and why, or remove it.

**Onboarding vs the seed:** the Day 9 seed marks Mateo's onboarding COMPLETE.
The "onboarding gate on first /app visit" fires ONLY on fresh/unseeded state (or
after a reset that chooses to replay it) — it must NOT block the day-9 demo.

---

## 3. RULES THAT STILL BIND (from Prompt 03 — verify against the repo, don't assume)

- Brand tokens exactly; Space Grotesk + Inter; gold kickers; no emojis; no
  em/en-dashes in any copy.
- Role-access matrix is design law: supervisor/employer/leadership views contain
  functional language only — never diagnosis, pain, or movement data; the
  clearance panel renders only for the physician role. Absent means absent,
  never grayed out or locked.
- Worker-facing copy at grade 7; 48px minimum tap targets in `/app`; red-flag
  states use gold, never red.
- **Gating posture — this must be EXTENDED, not "kept" (current repo covers only
  `/demo`).** After this prompt:
  - `robots.txt` must `Disallow:` `/app`, `/hub`, `/demo`, **and `/screens`**
    (today it lists only the first three — add `/screens`).
  - `vercel.json` must carry `X-Robots-Tag: noindex, nofollow` for `/app`,
    `/app/*`, `/hub`, `/hub/*`, `/screens`, `/screens/*` (today it covers ONLY
    `/demo` and `/demo/*` — add the rest).
  - Every NEW page (`/app`, `/hub`, each `/screens/*`) must be CREATED with the
    `<meta name="robots" content="noindex, nofollow">` + `<link rel="canonical"
    href="/">` head block. The landing page `/` stays the only indexable route.
- Demo cast only (Mateo R., claim 2408841, Northline Industrial,
  Dana/Sarah/Dr. Osei/Frank/Priya, the eight dashboard workers). No real data.

---

## 4. ORDER OF WORK (commit + push after each; confirm BOTH Vercel projects go green)

1. **Scaffold:** move/author the screen gallery at `/screens` (+ index); create
   the `/app` and `/hub` shells (tab bar, role picker, `location.hash` router),
   the shared store with the full Day 9 seed (§2b), the landing-page "Sign in"
   entry → `/hub` (with a "Worker app" link on the hub login → `/app`); and
   extend `robots.txt` + `vercel.json` gating to cover `/app`, `/hub`, `/screens`
   (§3).
2. **Worker app core loop:** Today → 3-step check-in → completion (ring 60→62
   animation) → Today shows "Checked in" chip. Persisted.
3. **Hub core loop:** login → role routing → coordinator Overview with live
   figures from the store; the check-in from step 2 visibly updates it.
4. **The duty loop:** Frank assigns (restriction pinned, only fitting duties
   listed) → Priya hazard-checks → Mateo accepts → Frank's confirmations show
   Fine / Manageable / Too much from Mateo's next check-in (functional language
   only for Frank — §3).
5. **The clinical loop:** Dr. Osei's signal review, restrictions editor (publish
   propagates), clearance READY → employer confirm → case closes, WCB stage
   tracker advances. **[TO CONFIRM]** enumerate the WCB stages (tie to the 63-day
   baseline) so "advances" is well-defined.
6. **Remaining surfaces:** worker (onboarding gate on fresh state only, movement
   session, progress, more/privacy center) and hub (H5 receipts, H7 early-warning
   board, H8 analytics reading live aggregates).
7. **QA pass — assert every §3 rule, not just navigation.** Walk both loops end
   to end; reset works; the access matrix holds in every role; no dead ends; AND
   verify: 48px tap targets in `/app`, grade-7 worker copy, gold-not-red for
   red-flag states, no emojis, no em/en-dashes, and the full gating posture on
   `/app` `/hub` `/screens` `/demo` (noindex meta + canonical + robots + headers).
   Then a final deploy; confirm both projects green.

At each step, before writing code, read the corresponding `/screens` page and
copy its markup. Report what shipped after each push with the production URL path
to click.

---

## Appendix A — changes from the original Prompt 04 draft (traceability)

1. **[Blocker]** 13 hi-fi screens are not in the repo → added §0 hard-gate
   precondition; the "lift the markup" workflow has no source until they land.
2. Landing page has no "Sign in" affordance to repurpose (only "Start a Pilot")
   → §1 now says *add* one, reconciled with "keep as is."
3. Gating is under-covered, not "kept": `robots.txt` lacks `/screens`;
   `vercel.json` covers only `/demo` → §3 now says EXTEND to `/app` `/hub`
   `/screens`, and each new page must be created with the head block.
4. Onboarding gate contradicted the Day 9 seed → §2b: gate fires on fresh state
   only; seed marks onboarding complete.
5. Per-role nav sets were undefined → §2a table (TO CONFIRM).
6. "Employer" confirm actor absent from the role picker → §2a (TO CONFIRM).
7. Status machine ambiguous ("exactly" was unenforceable) → §2 disambiguation
   items (TO CONFIRM) for `off_work/treating`, `escalated` overlay, READY mapping.
8. Seed was aggregate-only → §2b adds per-worker records for the 8 named workers;
   resolves the pain-3-vs-"escalation set" contradiction.
9. `/hub settings` (reset location) is not an H2–H8 surface → §2 places it in the
   H1 shell chrome (TO CONFIRM).
10. support.js ↔ vanilla-state interplay unaddressed → §2 architecture-risk item;
    validate on one screen first.
11. Cross-surface "live" choreography undefined → §2 storage-events vs
    re-read-on-nav (TO CONFIRM), plus mandatory translation on every propagation.
12. Preact permitted and forbidden in the same breath → §2 defaults to vanilla,
    Preact ask-first only.
13. QA step under-asserted the binding rules → §4 step 7 now checks tap targets,
    grade-7 copy, gold-not-red, no emojis/dashes, full gating.
14. Two Vercel projects now double-deploy → §1/§4 "confirm green" means both.

## Appendix B — repo facts this revision is based on (verified 2026-07-17)

- Repo `github.com/craigwolf75-jpg/Continuum`, branch `main`. Vercel Root
  Directory `deploy/`. Two prod projects auto-deploy: `continuum`, `continuum-o51l`.
- HTML present: `deploy/index.html`, `deploy/demo/index.html`, `deploy/404.html`.
  No `/screens`, no `.dc.html` sources, no "Sign in" on the landing page.
- `robots.txt`: Disallow `/app` `/hub` `/demo`. `vercel.json`: X-Robots-Tag on
  `/demo` and `/demo/*` only.
- The prerequisite `specs/CLAUDE_CODE_PROMPT_03.md` referenced by the draft was
  not present in the repo when this was written.
