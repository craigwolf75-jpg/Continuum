<!-- Folded into the repo 2026-07-17. Prose preserved verbatim from the source;
     the §4 transition table and the §1.2 matrix were re-rendered as clean
     markdown (the paste had collapsed them). No wording changed. -->

# CONTINUUM PROMPT 06: Claude Code Prompt 3, Demo Re-baseline to the Client Spec

**Supersedes:** Prompt 04 in full (including specs/CLAUDE_CODE_PROMPT_04.md and its TO-CONFIRM items, all now resolved by Prompt 05).
**Governed by:** CONTINUUM_PROMPT_05_RECONCILIATION.md. Where this prompt and Prompt 05 disagree, Prompt 05 wins.
**Screen source:** Continuum_MVP_Wireframe.html (the client's clickable prototype). The 13 Claude Design screens are no longer the spec.
**Date:** July 17, 2026

Paste everything below the line into a Claude Code session at the Continuum repo root (github.com/craigwolf75-jpg/Continuum, Vercel Root Directory = deploy, auto-deploy on push to main).

---

You are Continuum's production engineer, continuing from Claude Code prompt 1 (repo connected, Vercel linked, deploys green). Prompt 04 is retired. This prompt rebuilds the connected demo application against the CLIENT baseline: the five-role model, the field-level visibility matrix, slider check-ins, and the client's own wireframe as the pixel source.

## 0. PRECONDITION GATE (do not start the build until both pass)

- Continuum_MVP_Wireframe.html exists in the repo. If it is not present, STOP and report; do not reconstruct screens from memory or from any earlier gallery. When it lands, commit it to deploy/reference/wireframe.html and treat it as read-only design law.
- Read specs/CONTINUUM_PROMPT_05_RECONCILIATION.md if present in the repo (commit this prompt and Prompt 05 into specs/ as your first action so the repo carries its own law).

Then, before building anything, open the wireframe and produce a SCREEN INVENTORY: list every screen and state it contains for Worker, Employer, Light Duties, Nexus Health, and WCB, plus the reference surfaces (Status Flow, Roles and Access, Data Model). Extract each product surface into a standalone reference page under deploy/screens/ (one file per surface, markup lifted verbatim, shared styles inlined) and deploy that as a gated gallery. Report the inventory before proceeding. The old Mateo-era gallery, if any of it exists, moves to deploy/screens/legacy/ and is linked nowhere.

## 1. THE BASELINE THAT CHANGED (apply everywhere, no exceptions)

- Roles are exactly five: worker, hse, employer_admin, wcb_officer, nexus_physician. There is no coordinator role, no leadership role, no separate supervisor role, and no analytics workspace. Any screen, nav item, copy string, or store field referring to retired roles is removed, not hidden.
- Visibility matrix (enforce in what each view reads from the store, not just what it renders):
  - **worker:** own data in full, diagnosis as summary only.
  - **hse:** pain and mobility scores YES (operational need), body part and injury type, restrictions, RTW status. Never diagnosis notes, never check-in free text, never photos.
  - **employer_admin:** functional only. Status, restrictions, days off, doctor visits, RTW progress, injury type and body part. NEVER pain or mobility scores, diagnosis, photos, or check-in free text.
  - **wcb_officer:** read-only claims view, milestone notifications, scores visible per the matrix, no diagnosis notes, no free text.
  - **nexus_physician:** full medical detail.
  - Absent means absent: forbidden fields never render grayed out, locked, or redacted; they simply do not exist in that role's view. Build each role's view-model as a projection function over the store that strips forbidden fields BEFORE render, so a rendering bug cannot leak them.
- Check-in is the client model: twice daily (AM and PM), pain slider 0 to 10, mobility slider 0 to 10, optional notes, submit. No three-step tap flow. NO camera, NO movement session, NO photo capture anywhere in the demo. The worker app bottom tabs become: Today, History, Duties, More.
- Brand hexes are the client's: navy #0E1B2C, gold #C8972F. Update the token layer once and let every surface inherit. Secondary tokens (cream, ink, slate, mist) survive only where they do not fight the wireframe. Space Grotesk and Inter stay. Gold kickers stay. No emojis, no em-dashes, no en-dashes in any copy or code comment.
- Cast is the client's: the demo case is Marcus Bedard, scaffolder at Worley, case ref NX-2026-00481, right shoulder, injury type msk_strain, severity moderate, prognosis 21 days, initial restriction "No lifting above shoulder height", physician Dr. A. Owusu. Mateo, Northline Industrial, Dr. Osei, claim 2408841, Dana, Frank, Priya, and Sarah are retired from every visible surface. Additional workers in the employer table take their names and figures FROM THE WIREFRAME; where the wireframe does not supply them, generate deterministic records into the seed file once (varied trades, case refs in the NX-2026-004xx range) and reconcile every dashboard KPI to the seeded rows exactly. Clinical fields exist on Marcus's record only; every other seeded worker carries functional fields exclusively, so nothing clinical exists to leak.
- Worker-facing copy stays at grade 7. 48px minimum tap targets in the worker app. Red-flag and escalation states use gold, never red, in the worker app; hub surfaces may use the wireframe's own severity treatment.

## 2. TARGET SHAPE

- **/** marketing landing page: keep as is, except swap brand hexes and remove or replace any imagery showing retired screens (camera session, coordinator dashboard). Its sign-in affordance points at /hub.
- **/app** the WORKER APP as one connected single-page experience: consent gate on first visit (timestamped, revocable in More, blocks all data entry until granted), then Today (injury summary card: body part, status, day X of 21, estimated return date, plus the current check-in card), slider check-in flow, History (trend of past check-ins), Duties (assigned light duties with restrictions, tap to mark done, optional feedback), More (consent and privacy center, reset). Hash-routed, max-width 420px column, one phone.
- **/hub** the CONTINUUM HUB: login screen, then a role picker with exactly four entries: HSE (Light Duties workspace), Employer (dashboard), Nexus Health (physician workspace), WCB (read-only claims view). Each role's workspace reproduces its wireframe surface and reads live from the store.
- **/screens** the gated reference gallery extracted from the wireframe (section 0).
- **/demo** PARK IT: replace its content with a single gated page saying the guided demo is being rebuilt against the client baseline, linking to /hub. Do not delete the route.
- Gating posture unchanged: /app, /hub, /screens, /demo carry noindex meta and canonical to /, robots.txt disallows them, vercel.json keeps X-Robots-Tag. The landing page stays the only indexable route.

## 3. HOW TO BUILD (mechanics carried forward from prompt 1, plus lessons learned)

- Plain HTML plus vanilla JS. NO build step, NO framework, NO bundler, NO package.json. The Vercel project serves static files from deploy/ and must stay that way. Ask before adding any dependency.
- One plain JS store persisted to localStorage under key continuum_demo_state_v2 (new key; ignore and do not migrate any v1 state). Include schema_version in the seed.
- Cross-surface reactivity must work across BROWSER TABS, not just within one page: every write goes through one saveState() that writes localStorage and dispatches an in-page event; every page subscribes to BOTH the in-page event and the window storage event, and re-reads state on visibilitychange and on hash navigation. This is mandatory; within-tab-only reactivity was the failure mode of the previous build.
- A visible "Reset demo data" control in /hub (each role's settings) and /app More restores the seed.

## 4. THE STATUS MACHINE (implement exactly)

States: reported, off_work, light_duty, full_duty_pending, signed_off, plus escalated as a side state. The case record carries status and prior_status.

Transition table (reject anything not listed; every transition appends to an in-store audit log with actor role, from, to, timestamp):

| from | to | actor | trigger |
|---|---|---|---|
| reported | off_work | system | Marcus submits his first check-in |
| off_work | light_duty | nexus_physician | clearance with restrictions published |
| light_duty | full_duty_pending | nexus_physician | full-duty clearance; fitness-for-work form generated |
| full_duty_pending | signed_off | employer_admin | employer confirms return |
| any active state | escalated | system | escalation rule fires; prior_status recorded |
| escalated | prior_status | nexus_physician | reassess returns the case |

Auto-actions on entry, each visible somewhere: off_work queues the WCB initial notification (status pending, then generated); light_duty publishes restrictions to the employer and HSE views and queues the WCB light-duty notification; full_duty_pending generates the fitness-for-work form (a rendered document view, not a real PDF); signed_off queues the WCB full-duty notification with the FFW form attached and closes the case.

WCB notifications live in the store with lifecycle pending, generated, submitted, acknowledged. The WCB view and the Nexus view surface a "submit to WCB" step that the responsible party marks submitted, then acknowledged. NOTHING transmits anywhere; this is document lifecycle tracking, and every label says so. No copy anywhere implies a live WCB API.

## 5. THE ESCALATION ENGINE (three rules, evaluated on every check-in submit)

- pain at or above 8 for 3 consecutive check-ins, or
- mobility declining across 2 or more days, or
- a red-flag keyword in notes (seed list: numb, tingling, sharp, worse at night, cannot sleep; keep the list in one config object).

On trigger: create an escalation record (trigger text, notified party nexus), move the case to escalated via the guarded transition (recording prior_status), and surface it on the Nexus workspace as an alert. Resolution happens only through the Nexus reassess action. Escalations never advance medical status.

For demonstrability, the /hub login screen (below the role buttons, small) gets a presenter panel with three buttons: "Seed day 9 baseline", "Seed escalation-ready history" (loads a check-in history one bad check-in away from firing rule 1), and "Advance day". These manipulate the store only; they are the compressed-time controls for a live walkthrough.

## 6. ORDER OF WORK (commit and push after each step, confirm Vercel green, report the URL path to click)

1. Law into the repo: commit Prompts 05 and 06 into specs/, swap the brand tokens, commit the wireframe to deploy/reference/, produce the screen inventory, extract /screens, park /demo.
2. Store v2 plus the seed built from the wireframe's own figures; the reset control; the cross-tab reactivity harness (prove it with a temporary debug read-out on two open tabs before building screens on top).
3. Worker app: consent gate, Today, slider check-in, History. First check-in flips reported to off_work and the WCB initial notification appears.
4. Employer dashboard reading live: KPI row, worker table (status badges, restrictions, RTW progress), reacting to check-ins from another tab. Prove the projection: the employer view-model contains no pain, mobility, diagnosis, or free-text fields.
5. Nexus workspace: patient monitoring for Marcus (scores visible, full detail), clearance actions driving the status machine, restrictions publish propagating to employer, HSE, and the worker's Duties header.
6. HSE Light Duties workspace: assign from a small task bank within the published restrictions (restrictions read-only to HSE), worker accepts and checks off in /app, completion reflects back. HSE view shows scores; employer view still does not.
7. Escalation engine plus the presenter panel; WCB read-only view with the notification lifecycle; full-duty clearance, FFW form view, employer confirmation, signed_off, case closed end to end.
8. QA: run the full loop in two tabs; run the visibility audit (for each role, dump that role's view-model to console and verify against the matrix in section 1.2); verify gating headers; reset and run once more clean. Final deploy.

Report after every push. If the wireframe is ambiguous or missing a surface, say so and propose the smallest faithful interpretation; do not invent product behavior beyond this prompt.
