# Continuum Presentation Scripts (Prompt 35)

Eight spoken-word walkthroughs, one per surface, in presentation order. Each runs
60 to 90 seconds at a natural pace, follows the portal's real section order,
quotes only numbers that are actually on the screen, and closes with the question
the room usually asks and the answer the ElevenLabs agent should give in the same
words. No em-dashes anywhere.

The agent must never say a number the screen does not show. The seeded numbers
below are current: HSE queue seven open cases, board nineteen open claims and
seven to acknowledge, clinical twenty-four active cases, Marcus at day nine,
Jordan Miller in the exchange.

---

## 1. Worker app

**Open:** This is the worker's own space, the one seat built for the person doing
the recovering, not for anyone watching them.

**Walkthrough:** We are looking at Marcus Bedard, day nine. The Today view is a
quick check-in: two sliders for how he feels and how he moves, a fatigue and
confidence tap, and one tap to say he understands his duties for today. Recovery
Trend is his own line, and it is moving the right way. My Duties are the tasks his
clinician cleared, marked done or skipped. Chat and Settings are where his consent
lives, and he can turn sharing off at any time.

**Emphasize:** Everything here is gold, never red. No alarm color, no guilt, no
streaks to shame him. A worker at a hard moment opens this and sees calm.

**Expected question:** Is the worker being monitored by their employer?
**Agent answer:** No. This is supported, never monitored. The pain and movement
scores he enters never reach his employer. The employer only ever sees whether he
can work and what duties are safe.

---

## 2. Employer dashboard

**Open:** This is the employer's dashboard. The interesting part is what is not on
it.

**Walkthrough:** The Overview is the whole caseload at a glance, counts and rates
only. Injured Workers is a functional list: can each person work, which duties are
safe, days off, and return-to-work progress. Claims and Return to Work track
status. Doctor Visits show that a visit happened and the functional outcome, never
what was discussed. Dashboards, Reports, Trends, and Benchmarking are all
aggregate. Nowhere on this seat is there a pain score, a diagnosis, or a note.

**Emphasize:** This is a better answer from less information. The employer plans
work better precisely because it sees only what work is safe.

**Expected question:** What can the employer actually see?
**Agent answer:** Functional status only. Whether the worker can work, and which
duties. Never a diagnosis, never a pain score, never a medical note. Notice what is
not here.

---

## 3. HSE hub

**Open:** This is the coordinator's control room, the seat that runs the recovery
day to day.

**Walkthrough:** The Dashboard opens on the attention queue: seven open cases,
sorted so the person who needs attention now is at the top. Claims holds the
paperwork and the Ontario filing. Workers is where duties are assigned within the
published medical restrictions, and this is the hazard check. Analytics is
workforce trends, descriptive only. Settings holds the access log, so every look
at a worker's file is recorded.

**Emphasize:** The hazard check is a button that refuses. A duty cannot be assigned
until a person confirms the check, and the product enforces that on the server, not
just in the screen.

**Expected question:** Can a coordinator assign a duty that is not safe?
**Agent answer:** No. The assign button stays disabled until the hazard check is
confirmed by a person. And when a worker's pattern needs a clinician, the case
routes to the clinician per program rules. The coordinator never makes the medical
call.

---

## 4. Clinical seat, Nexus Health

**Open:** This is Nexus Health, the clinical seat, and it is the only place a
medical decision is made in the whole platform.

**Walkthrough:** The Dashboard shows twenty-four active cases, escalations first,
each carrying a six-part insight card: what changed, the contributing signals, the
period, why it may matter, what is uncertain, and who holds authority. Workers is
the full census and the patient detail: diagnosis, scores, the since-last-visit
delta, and the clearance and escalation controls. Claims and Analytics round it
out, and Settings holds the audit trail.

**Emphasize:** This is where medical decisions actually live. Only the clinician
advances status, only the clinician clears for duty. The intelligence layer routes
a case for review; it never decides.

**Expected question:** Does Continuum diagnose, or decide when someone returns to
work?
**Agent answer:** No. Continuum surfaces information and routes a case to a person.
The clinician diagnoses, the clinician decides. Predictive features are staged
behind regulatory review; today the platform describes what has happened, it does
not predict.

---

## 5. Board seat, WCB

**Open:** This is the compensation board seat, and it is, on purpose, the narrowest
view in the platform.

**Walkthrough:** The Dashboard shows nineteen open claims and seven to acknowledge,
with the average days open measured against the sixty-three day lost-time baseline
the deck cites. Claims is each claim with its milestone documents: initial
notification, light-duty package, medical update, tracked through generated,
submitted, and acknowledged. Nothing transmits to the board from this screen.

**Emphasize:** This is the narrowest view on purpose. The board sees claim status
and document lifecycle, and nothing more.

**Expected question:** Does Continuum pull claim data from the board?
**Agent answer:** No. Nothing is retrieved from the board and nothing transmits to
it here. Documents are filed through myWCB or the health care provider's own online
services. This seat only tracks that lifecycle.

---

## 6. SIGMA connection page

**Open:** This page shows how Continuum would sit beside a system of record like
the SIGMA exchange. It is a proposed workflow, drawn honestly.

**Walkthrough:** It follows one connected journey. A claim, Jordan Miller at
GardaWorld, claim SIGMA-2026-04417, begins in the exchange. Continuum creates the
recovery case, modified work is approved by a person, the recovery journey runs,
and at the end Continuum prepares the information to share back to the exchange.

**Emphasize:** Nothing is replaced. The exchange stays the system of record.
Continuum feeds it and never becomes it.

**Expected question:** Is this connected to SIGMA today?
**Agent answer:** No. This is a proposed workflow, not a live integration. No data
moves between the two systems yet. We are showing the shape of the partnership,
labeled as exactly that.

---

## 7. SIGMA portal

**Open:** This is the SIGMA Exchange seat inside Continuum, the system-of-record
connection.

**Walkthrough:** It lays out the proposed workflow end to end: how a recovery case
would open from an exchange claim, how modified work and status would move, and
what Continuum would package to hand back. Every step is labeled a proposed
workflow, not a live integration.

**Emphasize:** Everything here is prepared and held. Continuum prepares the record
and holds it for a person to file. The exchange stays the record.

**Expected question:** So Continuum replaces SIGMA?
**Agent answer:** No. Prepared and held. Continuum feeds the record, it never
becomes it, and it never auto-submits. The human files, always.

---

## 8. Admin

**Open:** This is the platform admin seat, where every promise the demo makes is a
switch you can actually throw.

**Walkthrough:** The Dashboard shows the tenants, the active users, the twenty-four
active cases, and the compliance switchboard. Mount Olympus is the agent group's
live status. Tenants carries the program-pause toggle and the pose module, which
ships dark. Users and Grants control access. Billing meters the program. Audit and
Settings hold data residency, backups, and the employer serialization test.

**Emphasize:** Every promise here is a switch. The program pause, the pose module
held dark, Canadian data residency, all of it, built before the crisis that needs
them.

**Expected question:** How do you stop everything if something goes wrong?
**Agent answer:** The program-pause toggle stops worker-facing capture and nudges
tenant-wide, and case management keeps running. The pose module stays dark until
counsel signs off. The controls exist before they are ever needed.
