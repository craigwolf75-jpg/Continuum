# Continuum Sidebar Page Scripts (Prompt 35, per-page companion)

A short spoken script for every sidebar page in every portal, so a presenter who
clicks into a section has narration that matches exactly what is on that page. Each
runs 20 to 40 seconds. These sit under the eight portal-level walkthroughs in
CONTINUUM_PRESENTATION_SCRIPTS.md; use those to open a seat, these to move through
it. Numbers are the current seeds and match the screen. No em-dashes anywhere.

---

## Worker app

### Dashboard (Today)
This is Marcus at day nine. One quick check-in: two sliders for how he feels and
how he moves, a fatigue and a confidence tap, and one tap to confirm he
understands today's duties. Today's assigned tasks sit right below. It is gold,
never red, and it takes under a minute.

### Recovery Trend
His own recovery line across the days, pain easing and movement returning. It is
his to see, framed as progress, never as a grade or a streak to keep.

### My Duties
The activities his clinician cleared. He marks each one done or skips it, and a
skip quietly tells the care team, with no blame attached.

### Chat
A place to ask a question and get plain, grade seven guidance. It never diagnoses;
anything clinical routes to a person.

### Settings
Where consent lives. It states in one line what the employer can see, functional
status only, and lets him withdraw sharing at any time.

---

## Employer dashboard

### Overview
The whole caseload at a glance, counts and rates only, with the live worker row
updating from the worker app. Every figure here is functional.

### Injured Workers
The functional list: can each person work, which duties are safe, days off, and
return-to-work progress. No pain score, no diagnosis, no note appears.

### Claims and Documentation
The claim record and its documents, tracked by status. The employer sees the
paperwork, not the worker's health information.

### Return to Work
The plan to bring each worker back to safe, suitable duties, by status. What is
shown is the work, not the medicine.

### Doctor Visits
A schedule: when a visit happened and whether the worker is cleared for duties.
Never what was discussed.

### Case Notes
Functional notes on the plan, and the place a supervisor can raise a concern that
routes to the coordinator. Never a medical note.

### Dashboards
The caseload in charts. Every number is a count or a rate, never a private detail.

### Reports
Exportable reports, built from the functional data only.

### Trends
How the caseload moves over time, as totals and rates. Descriptive, not predictive.

### Benchmarking
How this workplace compares to similar ones, at the aggregate level, with no
individual identified.

### Users and Roles
Who has access and what each role can see. Roles decide the view; the walls decide
what stays off limits.

### Settings
Configuration for this employer workspace.

### Integrations
Connections to other systems. Data leaves only as the walls allow, and only the
functional fields cross.

---

## HSE hub

### Dashboard
The attention queue, seven open cases, sorted so the person who needs attention
now is on top. Escalations carry the six-part insight card.

### Claims
The paperwork and the Ontario filing. In the pilot the employer files the Form 7;
Continuum prepares and tracks each submission, machine to machine only after a
person authorizes the send.

### Workers
The census with pain and mobility scores, which this seat is authorized to see, and
the duty assignment. A duty cannot be assigned until the hazard check is confirmed
by a person; the button refuses until it is.

### Analytics
Workforce trends as totals and rates. Descriptive only, and never a name beside a
number the room should not see.

### Settings
Configuration and the access log. Every time a coordinator opens a worker's file,
it is recorded.

---

## Clinical seat, Nexus Health

### Dashboard
Twenty-four active cases, escalations first, each with the six-part insight card:
what changed, the contributing signals, the period, why it may matter, what is
uncertain, and who holds authority.

### Claims
The claim records tied to each case.

### Workers
The full census and the patient detail: diagnosis, scores, the since-last-visit
delta, and the clearance and escalation controls. Only the clinician advances
status, only the clinician clears for duty.

### Analytics
Progress against prognosis, shown in buckets. The percentage is clinician-entered,
not a computed prediction.

### Settings
Configuration and the clinical audit trail.

---

## Board seat, WCB

### Dashboard
Nineteen open claims, seven to acknowledge, and the average days open against the
sixty-three day lost-time baseline the deck cites. Nothing transmits to the board
from this screen.

### Claims
Each claim with its milestone documents, tracked through generated, submitted, and
acknowledged.

### Providers
The health care providers on file for these claims, a read-only directory.

### Analytics
Claims analytics by status, aggregate, for the board's own operational view.

### SIGMA exchange
The proposed connection to the exchange, labeled a proposed workflow, not a live
integration.

### Settings
Configuration for the board seat.

---

## Admin

### Dashboard
Tenants, active users, the twenty-four active cases, and the compliance switchboard
where each tenant's program state is visible at a glance.

### Mount Olympus
The agent group's live status: the roster, the activity feed, and any open concern.
Operational telemetry only, never case content.

### Tenants
Provisioning, and the two compliance flags: the program-pause toggle and the pose
module, which ships dark until counsel signs off.

### Users
Provision a user, assign a role and a tenant, deactivate. Roles are data rows, not
code.

### Grants
Cross-tenant reach is granted here, never by relaxing isolation. Row-level security
still applies underneath.

### Billing
The meter: onboarding per claim plus a weekly rate while on program. Automatic
metering, manual invoicing in the pilot.

### Audit
Platform actions this session, newest first. In production every row lands in the
audit log with who, what, and when.

### Settings
The operational posture: Canadian data residency, encrypted backups, and the
employer serialization test that proves zero clinical fields cross.

---

## SIGMA portal (SIGMA-RH connection)

### Overview
The proposed connection between Continuum and a system of record like SIGMA-RH. A
proposed workflow, drawn honestly, not a live integration.

### Case exchange
How a case would move: a claim opens in the exchange, Continuum creates the recovery
case, and at the end prepares information to hand back. Jordan Miller is the worked
example.

### Field mapping
Which fields would map between the two systems, and which stay put. The clinical
fields never cross to the employer side of the exchange.

### Sync history
What would sync, and when. Today it is prepared and held; nothing has actually
synced, because there is no live integration yet.

### Permissions
Who on each side could see and do what. The walls hold across the connection, not
just inside Continuum.

### Settings
Configuration for the exchange connection.
