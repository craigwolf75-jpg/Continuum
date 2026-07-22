# Continuum Prompt 12j: Sign-Up and Onboarding on the Worker Portal

Date: 2026-07-22. Series: 12 (site-lane numbering). Both halves carry the same
number: the worker app artifact (built and suite-proven here) and the deployed
site's real-account backend (SITE-12j, queued for Zeus below).

## Half one: the worker app artifact (built)

A four-step sign-up wizard now lives on the worker app (deploy/worker-dashboard.html),
launched from Settings by "Sign up as a new worker (pilot)". It takes a new worker
from welcome, through consent in plain words, through their basics, into their first
check-in, and lands them in their own day-zero app, device-local, with every safety
rule live.

### The wizard, step by step
1. Welcome. This app is yours, about thirty seconds a day, your care team sees it,
   your employer never does.
2. Consent as a choice, not a gate. Voluntary, pausable, withdrawable with the
   program continuing by phone, the employer wall stated plainly, quiet hours named.
   The checkbox is genuinely respected: unchecked, the wizard does not advance, and
   the toast reads "Taking part is your choice. Tick the box only if you want to."
3. The basics. Name is required; trade and injury are collected in the worker's own
   words. An empty name blocks the step with a plain-language toast.
4. The first check-in itself, because the best onboarding for a thirty-second daily
   habit is doing it once.

Finishing creates the worker's own record: day zero, status reported, consent
timestamped, the first check-in already on the timeline, a welcome message from the
coordinator, and a toast that says what is true: "This device now holds your record."
Cancel at any step returns to the demonstration unharmed. Settings then flips to
"Return to the demonstration", which restores the Marcus canon exactly.

### The three mechanics underneath (suite-proven)
- The seven-day chart assumed seven entries and rendered NaN bars for a day-zero
  worker. It now renders only the days that exist, labels them Day 1 through Day n in
  pilot mode, shows quiet placeholders for days not yet lived, and the day-detail
  modal refuses indexes that do not exist.
- The rolling check-in window assumed a full week and would have pinned a pilot
  worker at one entry forever. It now grows to seven then rolls, and the first save
  advances day zero to day one.
- The bridge broadcast Marcus by name unconditionally. It now reflects the active
  worker with functional fields only: name, trade, and injury cross; pain and
  mobility never do; reset returns the bridge to the demonstration. Enforcement stays
  the single functional allowlist in deploy/bridge.js.

### The escalation rule holds from the first minute
The wizard's own first check-in escalates at pain eight (a clinician-notified log
worded as thanks for honesty, not alarm). A pain-two second check-in stays quiet. A
pain-eight later check-in escalates through the same saveLog path unchanged. A worker
who signs up on day zero is inside every safety rule from their first minute.

### Verification
deploy/worker-signup.test.mjs (40 assertions) executes the DOM-free PILOT-CORE
mechanics headlessly and statically proves the wizard wiring and the active-worker
bridge. The canon suite (Marcus day 9, pain 4) and the bridge suite stay green, so the
demonstration is untouched. Full suite green: 16 suites, dash audit clean.

## Half two: SITE-12j (real accounts, queued for Zeus, Phase 2)

See zeus-missions.md for the mission text. Supabase Auth with email magic links plus a
coordinator invitation path; onboarding mirrors the artifact wizard exactly with the
consent step rendering counsel's version-stamped approved text; per-worker row-level
security scoped to the authenticated identity; the employer projection produced server
side under the standing serialization test with no clinical field selectable by an
employer role. Athena owns the schema and the RLS floor, Calliope owns every word at
grade level, Heracles proves the walls with authenticated-role tests, Hermes deploys
dark behind a flag until counsel clears the consent copy. Phase 2 work; sits behind the
D12 pilot-minimum ruling and the D5/D6 counsel dependencies. Recommended by August 1.
