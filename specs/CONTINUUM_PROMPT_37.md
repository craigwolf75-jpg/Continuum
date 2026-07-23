# CONTINUUM PROMPT 37: Comprehensive Employer Onboarding as Its Own Sub-Section

Ten steps, three uploads with the privacy wall as code, and the strategic question set that makes the employer seat game-changing from day one.

**Deliverable:** Prompt 37 pre-build, stated plainly as such (employer-dashboard.html not in the authoring session; the anchored-patch law forbids regeneration, so installation is held exactly as in 12k). Shipped: CONTINUUM_37_EMPLOYER_ONBOARDING_MODULE.js, a self-contained module in the house pattern implementing a ten step onboarding flow (welcome, commitments, organization, sites, roster, injuries, duty mapping, program and goals, contacts, review) with the 13c commitments step relocated through the adapter and never re-rendered, an absolute commitments gate locking every later step until both acknowledgments are accepted and timestamped, three CSV uploads validated with row-numbered errors and cross-references (roster rows must name uploaded sites; injury rows must name uploaded employees and sites), the privacy wall as executable code (any uploaded column whose name contains a medical token such as diagnosis, pain, restriction, or treatment is refused outright, with the functional-only promise printed in the refusal), an optional injuries step because a new employer may have no open cases, and a completion that assembles the payload, writes the organization, tears down the sub-section, refreshes the dashboard, and loads the populated portal. Also shipped: CONTINUUM_37_MODULE_TESTS.js, eighteen hard-failing headless tests run green this session, and the three upload templates (employer_work_sites_template.csv, employer_roster_template.csv, employer_open_injuries_template.csv), each proven against the module's own validators. All files live in deploy/ beside the suite family, inert until installed. Scope, stated plainly: the module ships the flow's mechanics (the gate, the validators, the wall, the payload assembly, the teardown); the welcome screen, the step navigation, and the duty proposal picker are step UI rendered at installation against the artifact, and the module's dutyMapping submit validates the employer's confirmed matches rather than generating proposals. The full onboarding question copy and its strategic rationale follow in section 2, and the seven-slot adapter contract and installation path mirror 12k.
**Date:** July 22, 2026

## 1. The design, and the two walls it is built on

The flow mirrors 12k exactly where it should: the sub-section (Set up your organization) exists only while no organization profile exists, a blank employer app lands directly on it, and completion populates and loads the portal while hiding setup from navigation. Two walls shape everything else. First, the commitments gate: the two 13c acknowledgments (functional-only view; participation voluntary and never a performance matter) are the second step and an absolute lock; the module refuses to accept data for any later step until acceptance is timestamped, so no employer can upload a single row before agreeing to the deal, on the record. Second, the wall as code: the three uploads carry incident facts and workforce facts, never medical facts, and this is enforced in the validator rather than the documentation: a column named diagnosis, pain_score, restrictions, or any of fifteen forbidden tokens is refused with the promise itself as the error message. There is deliberately no free-text incident description column, because narratives are where clinical content leaks; incident detail lives in HSE case records behind the wall, not in employer bulk files.

## 2. The onboarding, step by step, with the questions and why each changes the game

**Step 1, welcome.** One screen, plain words: what Continuum is for the employer seat (a better answer from less information), what setup collects, and the promise that nothing medical will ever be asked for or accepted.

**Step 2, the commitments.** The relocated 13c step, character for character. Nothing new here by design; counsel owns this copy.

**Step 3, your organization.** Questions: What is your organization's legal name, and the name your people actually use? Which industry is closest to yours? In which provinces do you employ people? How many employees do you have (1 to 49, 50 to 199, 200 to 499, 500 to 999, 1000 to 4999, 5000 plus)? Is any part of your workforce covered by a collective agreement (yes, no, some sites)? Do you have a modified duties program today (yes, informal, no)? If you know it, what is your rough average lost time per claim, in days? Why it matters: the employee count band and provinces size the deployment and determine which compensation boards apply; the collective agreement answer shapes how modified duty offers must be made; and the last two questions are the baseline that makes every later analytics number mean something. An employer who says fourteen days today and sees nine in month three has a story their CFO understands.

**Step 4, work sites upload.** Template columns: site_id, site_name, address, city, province, site_type (office, warehouse, plant, field, retail, healthcare, mixed). Why it matters: sites are where hazard checks happen and where safe duties physically exist. The hazard gate (the button that refuses) is per site, and duty matching is only real if a proposed duty exists at a site the worker can reach.

**Step 5, employee roster upload.** Template columns: employee_id, first_name, last_name, work_email, home_site_id, position_title, employment_type, start_date. The validator cross-checks every home_site_id against step 4 and refuses duplicates. Why it matters: the roster is what turns an injury report into a one-click case: the coordinator picks a person instead of typing one, and worker app invitations can go out without a data entry project. Position_title is required on purpose: it feeds step 7.

**Step 6, open injuries upload (optional).** Template columns: incident_id, employee_id, incident_date, site_id, incident_category (strain_or_sprain, slip_trip_fall, struck_by_object, cut_or_laceration, burn, repetitive_motion, vehicle_incident, other), work_status (off_work, modified_duties, full_duties), lost_time_days, claim_number. Cross-checked against roster and sites. Why it matters: this is the difference between Continuum starting empty and Continuum starting useful. Every open case an employer already has goes under coordination on day one, and the board seat's claim picture is real from the first morning. Optional, because a new or lucky employer may have none, and an honest empty state beats a forced fake row.

**Step 7, duty mapping.** The system proposes matches from each uploaded position_title to the occupational database (45 positions, 209 pre-matched duties across 26 categories), and the employer confirms or corrects each. Question: For each of your position titles, is this the closest match in our duty library? Why it matters: this fifteen minute step is the single biggest game-changer in onboarding. It means that on the day a clinician sets restrictions, the coordinator sees proposed safe duties immediately, drawn from a library the employer already confirmed, instead of starting a binder hunt. It converts the platform's largest asset into this employer's asset before the first injury.

**Step 8, your program and your goals.** Questions: What would make this program a win for you in six months (fewer lost time days, faster first safe duties, fewer unacknowledged claims, a better premium or rebate position, a better experience for injured workers; pick up to three)? Do you want to set a target for days from restrictions received to first safe onsite duties (optional)? Who should see the monthly numbers? Why it matters: the analytics measure was renamed in Prompt 33 to plain words for exactly this moment; letting the employer pick goals and a target turns the dashboard from a report into a scoreboard they chose.

**Step 9, people and notifications.** Questions: Who is your return to work coordinator (name and work email)? Who leads health and safety? Who administers claims? Invite them now or later? Confirm text message defaults: sign-in codes and neutral reminders only, never case content, quiet hours in each worker's own time zone. Why it matters: escalations route to named humans or they route nowhere; and restating the SMS rule at onboarding makes the privacy posture something the employer actively accepted rather than fine print they scrolled past.

**Step 10, review and finish.** Everything on one screen with counts (sites, employees, open cases, mapped positions), then Finish. Completion writes the organization, and the portal loads populated: the workers table carrying the roster, sites in place, open cases visible in functional terms, goals on the dashboard. Setup disappears from navigation.

## 3. The adapter contract and installation

Seven slots: hasOrganization, mountCommitments, registerNavItem, removeNavItem, navigate, refreshDashboard, writeOrganization. Install validates all seven and refuses with the missing slots named, proven by the first test. Installation, when employer-dashboard.html is in session, is the 12k path verbatim: one script block before the closing body tag (single anchor, asserted once), the adapter bound by anchored reads (the 13c wizard's commitments mount and acceptance point, navigation, dashboard render, the employer storage write path), install called with the console clean, then the gates: this suite against live bindings, the full employer suite including the thirteen zero-safe sections, the six-portal canon regression, and the dash audit.

## 4. Sequencing and numbering

37 is the next free number (ledger: 27 to 36 plus letters; 36 taken by hero video in the site mission queue, 37 unused in both streams, noted here per the collision law). The employer surface presents today, so the same sequencing rule as 12k applies: install only with all gates green, or land it after the presentation window at zero risk. Real employer accounts remain the SITE-13d mission and are untouched by this prompt; 37 is the demo-family employer app's onboarding, and its question set doubles as the specification SITE-13d inherits.

## 5. Verification summary

Both code files pass the node syntax gate. The suite is green this session: eighteen hard-failing tests carrying forty one assertions, window and document shims per the standing test law (install refusal with named slots; the unonboarded landing with commitments mounted; the onboarded silence; the absolute commitments gate with the locked step named in the refusal; sites validation three ways with row numbers; roster validation three ways with cross-referenced sites; both wall-as-code refusals, a diagnosis column on the roster and a pain_score column on the injuries, each carrying the functional-only promise verbatim; injuries validation five ways including the empty upload accepted; organization band and province enforcement; and the completion path refusing with the missing steps named, then writing the payload with the commitments timestamp, injuries defaulting to zero, teardown, refresh, and navigation to the populated dashboard). An adversarial review pass then hardened the build, and the last three tests lock the fixes: quoted CSV cells are data, not column breaks, so an address with a comma survives; a ragged row is refused by its physical file line, never silently padded; row numbers count real file lines across interior blanks; an empty lost_time_days is refused; a missing column is refused by name; reopening the sub-section never remounts the counsel-owned commitments step; a second finish is refused and never writes twice; a fresh install resets the whole session so no acceptance or data carries across bindings; finish re-verifies every cross-reference against the final uploads; an acceptance without a timestamp is refused; the medical wall also covers field names on the question steps, promise verbatim; duty mapping accepts only confirmed match objects; and more than three goals is refused. The three templates are proven against the module's own validators. Dash audit clean on the module, the suite, the three templates, and this companion; issued as markdown, JavaScript, and CSV in the repository only. Numbering: 37 per the collision law as stated in section 4.

## 6. Installation record (added at install, July 23, 2026)

Installed into deploy/employer-dashboard.html on Gary's instruction, the 12k
path: the module script block before the closing body tag (single anchor), the
seven slot adapter bound by anchored reads (NAV plus renderSide plus a wrapped
go for the navigation slots, render for the dashboard refresh, S plus save on
the continuum_employer_v1 key for writeOrganization), install with no console
refusal, and a compact step UI rendering the ten steps into the module's host
inside the main area. One contract completion surfaced at install and made
here: the 13c commitments step existed nowhere in the artifact (the S13c
mission in specs is an unrelated smoke gate), so the commitments step renders
the two acknowledgments with their canon wording from the shipped presentation
scripts (functional-only view, never medical details; participation voluntary
and never a performance matter), each accepted separately with its own
timestamp, both carried into the organization record. Unonboarded means
arriving on the setup route (?setup=1) with no organization on file; while
unonboarded the sidebar carries only the setup tab; the demonstration and an
onboarded organization see no setup entry, and completion returns the full
navigation with the demonstration dashboard, the organization on the record,
and an audit line written. The uploaded roster driving the workers table is a
future numbered prompt by design; the demonstration presents. All gates green
at install: the module suite (forty one assertions), the twelve k suite, the
whole deploy family, the dash audit, and a live browser pass of the
demonstration silence, the unonboarded single-tab landing, the commitments
gate locking uploads, a quoted address surviving the parser, a diagnosis
column refused mid-flow with the promise rendered, the review counts, the
completion writing both timestamps, and the onboarded revisit hiding setup.

## 7. Reconciliation with the series module draft (July 23, 2026)

The prompt series later delivered its own draft of the module. Reconciled by
adoption rather than replacement, because the installed module carries
hardening the draft lacks (validated submits, a single commitments mount, a
single write, session reset on install, and finish-time cross-reference
checks). Adopted from the draft: the wall grows to fifteen tokens (condition,
mental, and injury_description join the twelve), employment_type is enforced
against its four values on the roster, province codes are accepted in either
case, the payload carries a version marker (37-1), and the module also
answers to the draft's global name CONTINUUM_37. Kept against the draft: the
employee band wording stays in the companion's spoken form (1 to 49), the
wall refusal keeps the functional-only promise verbatim, and the draft's
unvalidated setData path, per-open commitments remounting, and unguarded
completion were not adopted. The suite grows to nineteen tests, forty seven
assertions, locking every adopted delta.

Where care ends, Continuum begins.
