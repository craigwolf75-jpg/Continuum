# CONTINUUM PROMPT 08: The Working Section-by-Section Workflow App

**Deliverable:** continuum_workflow_app.html, a complete working application in one static file. Built and logic-tested this session; no build step, no dependencies beyond Google Fonts.
**Governed by:** Prompt 05 rulings and the Prompt 06 baseline (five roles, client cast, client hexes, slider check-ins, gold-not-red, no camera).
**Date:** July 17, 2026

---

## 1. What it is

A single-file HTML application that runs the entire Continuum core loop live, organized as five navigable sections with the wiring between them made explicit and visible. Open the file in any browser; state persists in localStorage under `continuum_demo_state_v2` and synchronizes across open tabs. Drop it into `deploy/` on the demo repo and it serves on Vercel as is.

## 2. The five sections and how they connect

1. **Workflow map.** Six stage nodes (Intake, Check-ins, Employer view, Escalation, Clearance and duties, WCB and sign-off). The map is live: the gold node tracks where Marcus Bedard's case sits right now, completed stages turn green, and every node deep-links into the working section that runs it. Each node lists its feeds and receives lines, so section-to-section connection is readable on the map itself.
2. **Worker app.** Phone-width column. Consent gate (timestamped, revocable, blocks entry), Today with the injury summary and the AM or PM slider check-in, History with a pain and mobility sparkline, Duties with check-off and feedback, More with the privacy center. Cross-reference chips in the header name what this section feeds (HSE, Nexus, Escalation, Employer counts) and receives (restrictions, duties).
3. **Hub.** Role picker with exactly four seats: Employer (functional projection only, KPI row, worker table of eight, the confirm-return action when the case reaches Return pending), HSE (latest scores for operational need, the clinician's restriction pinned read-only, duty assignment from a four-task bank, worker confirmations), Nexus Health (full clinical detail, escalation alert with reassess, restriction publishing, clearances, the generated fitness for work document), WCB (read-only claim row and the three-package document lifecycle with mark-submitted and mark-acknowledged).
4. **Wiring.** The cross-reference contract as a table: every record type, its producing section, every consuming section, and the guard that protects it; the visibility projection matrix; and a live event feed showing the last twenty writes with the sections each one fed.
5. **Audit.** The append-only transition log: day, actor role, from, to, trigger.

The signature element is the wiring rail, a fixed strip at the bottom of every section that narrates each write as it happens and names its consumers, so the wiring is never abstract.

## 3. The mechanics under it

- **Status machine:** reported, off_work, light_duty, full_duty_pending, signed_off, plus escalated with prior_status. A single guarded transition function validates (from, to, actor role) against the transition table and rejects everything else; rejections are themselves narrated. Auto-actions on entry generate the WCB packages and the FFW document.
- **Escalation engine:** evaluated on every check-in submit. Pain 8 or higher for three consecutive check-ins, mobility average declining across two or more days, or a red-flag keyword in notes (numb, tingling, sharp, worse at night, cannot sleep). Trigger records prior_status, alerts Nexus, and never advances medical status; only reassess resolves.
- **Projection firewall:** each role's view is built from a projection function that strips forbidden fields before render. The employer object never contains pain, mobility, diagnosis, or notes keys at all.
- **Presenter controls:** day counter with Advance day, plus three seeds (New case for the day-zero consent and first-check-in arc, Day 9 baseline, Escalation-ready which is one bad check-in away from firing rule one) and Reset.

## 4. Verification performed this session

Headless test run passed in full: first check-in auto-advances reported to off_work and generates the initial WCB package; physician clearance publishes restrictions and moves to light duty; duty assignment and worker check-off round-trip; rule one, rule two, and rule three each fire from clean states; escalation records prior_status and reassess returns the case; an employer_admin attempt to advance medical status is rejected by the guard; full-duty clearance generates the FFW; employer confirmation closes the case with the full-duty package; the employer projection contains no forbidden keys and the HSE projection carries scores but no diagnosis or notes. Copy audit: zero em or en dashes in markup and script.

## 5. Suggested demo walkthrough (about four minutes)

Seed New case. Open the Worker app: consent, first check-in, watch the rail announce four consumers and the map light stage B. Open Hub as Employer: Marcus appears, no scores anywhere. Open as Nexus: publish restrictions, clear for light duty. Open as HSE: assign a duty; back in the Worker app, check it off. Seed Escalation-ready: submit one pain-8 check-in, watch the case go gold; as Nexus, reassess. Clear for full duty, show the FFW document, confirm return as Employer, and end on WCB with all three packages and the lifecycle. Close on the Wiring section: the whole story is in the event feed.

## 6. Relationship to the other tracks

This app is the working expression of the Prompt 06 baseline and can serve as the connected demo while the wireframe-derived rebuild proceeds, or replace that build outright if Craig approves it as the demo. It changes nothing in the mainline: the Prompt 07 series remains the production build, and every behavior here (the transition table, the three rules, the projections, the WCB lifecycle) matches what 07.5 through 07.8 implement server-side.
