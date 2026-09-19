# Prompt 68. Package source record

REGISTERED NOT RELEASED. Draft PR.
Registration source record only. Not a
Continuum product release. Not a
clinician product PASS.

Write date: 19 September 2026.
Registration date in the stream:
21 August 2026.

Craig named BUILD Prompt 68: THE
CLINICIAN EXPERIENCE BUILD PACKAGE.
Registered unified Prompt 68 on
21 August 2026. ContinuumRTW Inc.
Version 1.0.

This file stores the company document
text supplied with this registration.
It is dash-law clean as received
(zero em dashes, zero en dashes).
Box drawing in the experience map is
kept as supplied.

Companion HTML files named in
Section 00.4 were NOT supplied.
Status: NOT IN HAND.

- clinician-home.html expected md5
  64ff54939f597c8cee3cecb5f730d29d
- first-report.html expected md5
  bb4a14c8c036d2990777612f02828511

Do not invent those files. Do not
treat this text as a ship order.
Consent Card A wording in the body
is specification text. OQ-016 blocks
it from shipping. See STOPS.md.

Governing register files:

- REGISTER.md
- SECTION_00.md
- STOPS.md
- ACCEPTANCE.md

No em dashes or en dashes anywhere.

---

CONTINUUM PROMPT 68: THE CLINICIAN EXPERIENCE BUILD PACKAGE
Registered in the unified Continuum stream as Prompt 68 on August 21, 2026. Craig's company document (ContinuumRTW Inc., Version 1.0, 21 August 2026), original title: CONTINUUM CLINICIAN EXPERIENCE. BUILD PACKAGE FOR GARY. See Section 00.
Version 1.0. 21 August 2026. ContinuumRTW Inc.
This is the single source of truth for the authenticated clinician product. It supersedes every earlier clinician screen description. Where it conflicts with an older Continuum document, this package wins for the clinician experience only.
Companion files, both shipped with this package:
Both are working reference implementations using the real Continuum design tokens. Build to them, not to a reinterpretation of them.
Out of scope. The public website, the marketing homepage, the public sign in page and all public branding. Nothing in this package touches them.

SECTION 00. REGISTRATION AND EXECUTION DISCIPLINE (added at registration by Gary's stream; the package's own rules below stand unaltered)
00.1 Status: REGISTERED, NOT RELEASED. The authenticated clinician product is the platform lane. This package sits behind the G1 discovery audit, Craig's platform decision, and the Prompt 53 hold, like unified 56 and 58 before it. That includes its own removal instruction: the bulk accelerator withdrawal and any row migration execute only when the lane is released. Its final section's ship gate stands on top: nothing ships before the hub authentication fix is deployed and verified by Craig.
00.2 Supersession, scoped exactly as the package scopes it. This package supersedes every earlier clinician SCREEN DESCRIPTION, and wins on conflict for the clinician experience only. The safety laws of unified Prompts 39 to 46 persist except where this package names a supersession. One is named: the two zone model is superseded and the bulk accelerator is withdrawn package wide, which strengthens the posture unified 41's never-defaults rule guarded. Any other apparent conflict between this package and a 39 to 46 law is a stop and report; silence never repeals a law. The carried-forward laws visibly intact here: ai_draft blocks signature, the draft label is real page text never a pseudo element, the UNCHANGED affirmation is a clinical statement not a default, the 90 day stale rule, and jurisdiction resolution that blocks with a named message rather than falling back.
00.3 Citation map. Craig's numbering, translated in place: his Prompt 38 is unified 41 (Physician Interface, four citations), his Prompt 51 is unified 58 (Design System and Surface Standard, one citation), his Prompt 42 is unified 45 (Jurisdiction Layer, one citation). The Developer Build Package remains the named hard dependency it was under unified 41.
00.4 Artifact manifest, build to these and not to a reinterpretation of them. clinician-home.html, md5 64ff54939f597c8cee3cecb5f730d29d, and first-report.html, md5 bb4a14c8c036d2990777612f02828511, ship with this registration under the exact filenames the package's companion table uses. Both verified dash free, zero external requests, draft labels as real DOM text.
00.5 Version flag. This package postdates Craig's canonical versions list, the same flag family as unified 54, 55, 56, and 58; his confirmation clears it.
00.6 Standard clauses. Credentials never in chat; python dash audits on everything written; evidence or UNVERIFIED on every prerequisite; SYNTH prefixed test data only while the hold stands; append only migrations when the lane releases.

LOCKED TERMINOLOGY
From the Developer Build Package section 0.2. Use these in code, database, interface and conversation.
Banned in every label, tooltip, empty state, error and placeholder: predicted, suggested diagnosis, recommended restriction, smart, automatic assessment, AI decided. Use instead: proposed for your review, drafted, not yet reviewed, carried forward from 12 Aug, worker reported.
Never expose to a practitioner: data models, form engine internals, rule engine internals, the occupational database, algorithms, model architecture, prompt systems, or board mapping mechanics. These are implementation details.

A. CLINICIAN EXPERIENCE MAP
SIGN IN
   │
   ▼
CLINICIAN HOME  (SCR-HOME-01)
   │   Needs you now · Today · Follow-ups due · Recently seen · Search
   │
   ├──[ Start a new assessment ]──► START A CASE (SCR-CASE-01)
   │                                   │  reception may complete this
   │                                   ▼
   │                             form resolved from contract + role
   │                                   │
   │                    ┌──────────────┴───────────────┐
   │                    │ no prior report              │ prior report exists
   │                    ▼                              ▼
   │            FIRST ASSESSMENT                 FOLLOW-UP (SCR-FUP-01)
   │            (SCR-CONS-01 Consent)                  │
   │                    │                              ├─ UNCHANGED ──────────┐
   │                    ▼                              ├─ IMPROVING ─┐        │
   │            (SCR-EXAM-01 Examination)              └─ REGRESSING ┤        │
   │                    │                                            ▼        │
   │                    ▼                                    MEASUREMENT      │
   │            (SCR-MEAS-01 Measurement) ◄─────────────────────────┘         │
   │                    │                                                     │
   │                    ├──(form is C050S only)──► OIS COORDINATION           │
   │                    │                          (SCR-OIS-01)               │
   │                    ▼                                                     │
   │            (SCR-TREAT-01 Treatment and referrals) ◄──────────────────────┘
   │                    │
   │                    │   [invoice is computed here but is NOT shown
   │                    │    in practitioner navigation. See section K]
   │                    ▼
   │            REVIEW AND SIGN (SCR-REV-01)
   │                    │  signature blocked until every gate clears
   │                    ▼
   │            SUBMISSION STATUS (SCR-OUT-01)
   │                    │
   │                    ├─ accepted ────────────────────► back to HOME
   │                    └─ rejected ──► CORRECTIONS (SCR-REJ-01) ──► reopen
   │                                                                 at the
   │                                                                 offending
   │                                                                 field
   │
   ├──[ open a row ]────► the case at whatever step it stopped at
   └──[ search ]────────► worker or case
Two rules govern movement.
The clinical sequence is linear and forward only. A step not yet reached cannot be opened. Source: Developer Build Package section 7, "there is no free navigation between clinical screens once a case is open, because skipping ahead invites incomplete assessments." Completed steps may be revisited.
Every screen exits to the clinician home in one action.

B. CLINICIAN HOME. SCR-HOME-01
Built as clinician-home.html. Build to that file.
B1. Purpose
The practitioner signs in and immediately sees who needs them and what to do next. Nothing else. This screen answers one question and answers it in under two seconds.
It is the screen the clinic lives on. It must reach first contentful paint under 800 ms with 500 open cases, and be interactive under 1.5 s. Source: SCR-WL-01 acceptance criterion 1.
This screen makes no model calls of any kind. Source: SCR-WL-01, "AI interactions. None. This screen must be instant and boring."
B2. What is deliberately NOT on it
No injury statistics. No recovery percentages. No employer analytics. No return to work rates. No cost figures. No dollar amounts anywhere. No charts. No management reporting. No "clinical performance" framing of any kind.
A practitioner must never be shown a screen that reads as a report card on their own performance.
B3. Hierarchy, top to bottom
The one line summary reads, for example: 3 need you now · 7 today · 4 follow-ups due. Each number is a link that scrolls to its section. Counts are computed live, never hard coded.
B4. Section 3, Needs you now
The only section that can be visually urgent. Holds three kinds of item, in this order:
Review and sign appears only when the signed in practitioner is the author of that report. Source: SCR-WL-01 acceptance criterion 3, "a practitioner cannot see the Sign and submit action on another practitioner's report."
There is no bulk action of any kind in this section, and no select all. Source: SCR-WL-01, "Bulk: none. There is deliberately no bulk sign," and section 12.3, "a signature is an attestation about one worker."
The fee tier deadline, and how it is allowed to appear
The board pays by tier and the tier is set by receipt at the board, not by submission. The practitioner sees the deadline, never the money.
No dollar figure appears anywhere in the clinician experience. The dollar figure exists only on the invoice screen, which the practitioner does not see. Source: SCR-INV-01, "the practitioner should never see this screen. It is not their work, and it costs them seconds they do not have."
The countdown is an estimate and must be labelled as one on hover. The board publishes no receipt timestamp, so it is calculated from the batch schedule plus a configurable safety margin, default 60 minutes. Source: OQ-014.
Business day calculation excludes weekends and the statutory holidays of the case's jurisdiction, read from the jurisdiction pack, never hard coded.
B5. Section 4, Today
Every case with an examination scheduled or recorded today, for this clinic. Two groups with a visible divider, not two separate tables:
New assessments waiting. No prior report on this claim. Row action Start.
Today's follow-ups. A prior report exists. Row action Open.
Row shows: worker family name and given name, employer, injury in plain words, and the form badge. It does not show a diagnosis code, a pain score or any measurement value. Those belong inside the case.
B6. Section 5, Follow-ups due
Cases whose next reassessment date has been reached or passed, that are not already in today's list. Sorted by how overdue. Row shows worker, employer, days since the last visit, and the reassessment date. Row action Open.
An overdue follow-up is presented neutrally, never as a failure. Wording is reassessment due 3 days ago, not overdue and not a warning colour.
B7. Section 6, Recently seen
The last ten workers this practitioner recorded a report for, most recent first. One line each: worker name, employer, date. Row action Open. Purely a shortcut back to yesterday's work.
B8. Search
A single free text field over worker family name, given name and claim number. Source: SCR-WL-01 filter row. Results are a list of cases with the same row shape as the sections above.
Search returns only cases this practitioner is permitted to see. Default is clinic wide, controlled by clinic.practitioner_sees_all, default true because clinics cover for each other. Source: SCR-WL-01 business logic. See section K.
B9. States
B10. Accessibility
Every section is a landmark with a heading. Tables carry a caption and scope attributes. Sort state is announced. Countdown values are additionally rendered as text in an aria-live polite region updating no more than once per minute. Row actions are reachable by Tab and invoked by Enter. Fully operable with the mouse physically disconnected.
B11. Audit
WORKLIST_VIEWED with the active filters. Opening any row logs CASE_ACCESSED.

C. FIRST ASSESSMENT. THE CASE WORKFLOW
Built as first-report.html. It is entered from the clinician home. It is not a landing screen and must not be reachable by signing in.
C1. Entry
The practitioner arrives from a home screen row or from search, with a case already selected. The case identity strip is always visible at the top: worker name, date of birth, employer, job title, date of injury, date of examination, claim number, jurisdiction and form.
C2. Which form, resolved not chosen
if an unsuperseded report exists on this claim for this clinic:
    form := follow_up_for(prior_report.form_id, practitioner.contract_id, practitioner.role)
    route to FOLLOW-UP
else:
    form := initial_for(practitioner.contract_id, practitioner.role)
    route to CONSENT
initial_for and follow_up_for read the board's contract and role to form mapping, held as data. If the pair resolves to more than one candidate, present a choice. If it resolves to none, block case creation and raise. Never default to General Practitioner. Source: BR-WF-002, "silence is not permission. A wrong form is an instant rejection."
C3. The step model
Consent, Examination, Measurement, Treatment, Review and sign. Rendered as a stepper. A step not yet reached is disabled and carries a title explaining why. A completed step can be reopened. This is already implemented in first-report.html.
C4. Safeguards that must not regress
Every one of these is already built in first-report.html and is load bearing.

D. CONSENT. SCR-CONS-01
Was a stub. This is the complete specification.
D1. Purpose
Capture two legally distinct consents separately. Source: BR-PRIV-001, "never merged. They have different legal bases, different revocability and different consequences." Merging them to shorten the interface is a defect, not a simplification.
D2. Layout
Two stacked cards. Each has plain language body text, an explicit affirmative control, and a decline control of equal visual weight. Consent body text is body copy at 16 pixels minimum. It is never fine print.
The controls are buttons, not checkboxes, because an affirmative act must be unambiguous. Source: SCR-CONS-01 accessibility. Screen reader users hear the full text before reaching the controls.
D3. Card A. Consent to record and draft
Written at a grade 8 reading level. It must state: the visit may be recorded or dictated; software will draft notes for the practitioner to review and correct; the practitioner remains responsible; participation is voluntary and can be declined without affecting care; and how long any recording is kept.
Approved wording, from the specification, use verbatim:
We can record this visit, or the doctor can dictate afterwards. Software will write a first draft of the notes. The doctor reads and corrects every word before signing, and stays responsible for the notes. You can say no. Your care will be exactly the same either way. Recordings are deleted after 30 days.
Controls: Patient consented · Patient declined.
Consequence of decline. The examination screen offers typing only. The record control is not rendered at all, and the API rejects a transcription request for this case. Verified at the API layer, not only in the interface. Source: SCR-CONS-01 acceptance criterion 1.
CRAIG DECISION REQUIRED. The wording says recordings are deleted after 30 days. Open question OQ-016 asks whether Continuum holds ambient recordings at all, and for how long. The number in this sentence must match the answer before this text is shown to a patient.
D4. Card B. Consent to share with the employer
Body text states exactly what an employer would receive and, more importantly, what they would never receive. It names diagnosis, symptoms, medications and clinical findings as never shared.
Approved wording, from the specification, use verbatim:
Your employer would be shown: which duties are safe for you right now, how long that applies, and when you are being reassessed. Your employer would NEVER be shown: your diagnosis, your symptoms, your medications, or anything the doctor found on examination.
Controls: Patient consented · Patient declined · secondary Show the patient what the employer sees, which opens a modal rendering a realistic example employer view.
Consequence of decline. The report, the Pink Copy and the clinical record are all produced normally. Only the worker plan and the employer view are suppressed. Declining must never degrade the board submission, because the duty to report is statutory and survives the worker's refusal. Source: BR-PRIV-002, BR-REG-003.
D5. Progression
Continue is enabled once Card A has an explicit answer. Card B may remain unanswered and defaults to declined. Source: SCR-CONS-01 buttons.
D6. Revocation
Available at any time from the case header and from the worker's own plan. Revoking Card B withdraws the employer view within 60 seconds and records the event.
The interface must state plainly that already disclosed information cannot be recalled. Source: BR-PRIV-012. Do not imply a recall is possible.
Approved wording:
Sharing is switched off. Your employer can no longer see your duties or your progress. Anything that was already shared with them cannot be taken back.
D7. What is recorded
Every consent event stores the type, the timestamp, the staff member who obtained it, and the version identifier of the exact text that was shown. Retained for the full ten year period regardless of case deletion. Source: SCR-CONS-01 audit events.
Events: CONSENT_GRANTED, CONSENT_DECLINED, CONSENT_REVOKED.
D8. States
D9. Model calls
None on this screen.
D10. Acceptance criteria
Card A declined disables recording and drafting everywhere in the case, verified at the API layer.
Card B declined still produces a valid board submission and a Pink Copy.
Revoking Card B removes employer access within 60 seconds and logs the event.
The consent text version is stored, so a consent obtained under old wording is distinguishable years later.
The two consents cannot be answered by a single control anywhere in the interface.

E. EXAMINATION. SCR-EXAM-01
Retained from the built screen, refined. Already implemented in first-report.html.
E1. Layout
Two columns on wide screens. Left: capture controls and the live transcript. Right: the narrative fields and injury coding. Stacked on narrow screens with capture pinned to the top.
E2. Capture bar
Record, Stop, Pause, elapsed time, audio level, and a recording indicator that cannot be hidden by scrolling, because consent is ongoing rather than a single click. Source: Prompt 41 section 8. Start and stop are announced to assistive technology.
Typing directly is always available and is never penalised. A model failure never blocks the visit. Source: BR-AI-009.
E3. Narrative fields
The model may not propose the date of examination and may not answer the prior conditions question. Source: BR-AI-010.
Character counters appear at 80 percent of the limit. Nothing is ever truncated silently, because the board's limits are tight enough to cut real Canadian names. Source: BR-VAL-011.
E4. Injury coding
Up to five rows of part of body, side of body, nature of injury. Part of body determines whether side is required, from the board's own per code flag. A sixth injury goes to the additional injuries free text.
Every part and nature pair is checked against the board's forbidden combinations at the moment of entry, not at submission. A forbidden pair is rejected inline showing the board's own description of both codes. A proposal that would form a forbidden pair is suppressed before it is ever displayed. Source: SCR-EXAM-01 validation, AI-03.
At least one injury row is required.
Board element identifiers are not stable keys. Part of body is C8 on one form and C10 on another. Key on form definition, element sequence and element name. The bracket code is a display label only. Source: Errata D3.
E5. Drafting behaviour
Drafting runs when dictation stops, or on demand per field. Each drafted field enters provenance ai_draft and renders with the loud draft treatment. Any keystroke, or an explicit accept, moves it to ai_draft_edited.
Where the transcript does not support a field, emit nothing rather than inventing. An empty draft is correct behaviour. The model may not state a finding as observed when the transcript records it as reported. Source: AI-02.
Summary line after drafting: 4 fields drafted. Review each before signing.
E6. Failure
Transcription failure keeps the audio and shows Transcription failed. Your recording is saved. Type or retry. Drafting failure leaves the field empty and editable.
E7. Audit
RECORDING_STARTED, RECORDING_STOPPED, TRANSCRIPTION_COMPLETED, AI_DRAFT_GENERATED per field with model, version and confidence, AI_DRAFT_ACCEPTED, AI_DRAFT_EDITED, FIELD_UPDATED, FORBIDDEN_PAIR_REJECTED.

F. MEASUREMENT. SCR-MEAS-01
Retain exactly as built. This is the core screen of the product and the only genuinely new work in the encounter. Target ninety seconds.
F1. Three tier relevance. Amendment 1, 9 August 2026
The two zone model is superseded. The bulk accelerator is withdrawn package wide. Do not build it. If it exists, remove it and migrate any existing rows.
Promotion into a higher tier is computed live from state and carries a recorded reason from a closed list: core_to_injured_region, raised_by_worker_report, raised_by_clinical_finding, required_by_proposed_duty, jurisdiction_requirement. The reason is shown to the practitioner in plain words beside the axis name.
On the reference lumbar case this produces five to six required axes, not forty one.
F2. Capability values
able | limited_to | unable | no_injury_related_restriction | NULL (not answered)
no_injury_related_restriction is deliberately not able. It means the practitioner considered the axis and identified no restriction arising from this injury. It is never rendered to an employer or a board as a certification of ability, and it carries that meaning in the record so a downstream reader cannot flatten the distinction. Source: Amendment 1, criterion A3.
NULL is a distinct state meaning not answered. Source: Errata D7.
F3. The axis row
Axis name, the promotion reason, a radio group of the four capability values, and a quantity input that appears only when Limited to is selected. Units go in the label, never only in placeholder text.
The axis set, the quantity type and the code list are read per form from the form pack. Nothing is hard coded. Source: Errata D2.
F4. The band function. Complete, both open ends
Pound equivalents: 11, 22, 44, over 44.
Every rounding writes both the real measurement and the fact of rounding to the audit log.
A below range measurement is never described as rounded down for safety. It moves up to the band floor, which is the less safe direction, and the wording must say so.
F5. Which number governs
The derived band governs every downstream output, including the worker's plan and the employer duty match. The raw measurement is stored for trend, precision at the next visit, and audit. The raw measurement never leaves Continuum. Source: BR-PRIV-005, because telling the worker 8 kg while telling the board 5 kg would put a 60 percent discrepancy into the employer's duty computation.
F6. Model boundary. The hardest line in the product
The model may propose which axes to open. It may never propose a capability value or a quantity. There is no exception, no confidence threshold above which it is permitted, and no configuration flag that enables it.
The axis relevance component returns a list of axis names and nothing else. Its function signature cannot return a value type. Source: AI-04 safety clause.
F7. Validation
Hours on any axis cannot exceed the hours capable of working per day. Weight cannot be negative, and a configurable sanity ceiling, default 100 kg, warns rather than blocks. Grasping specific restriction is limited to 21 characters, the board's own limit, short enough to require a warning.
F8. Internal restrictions
Add a restriction the board has no field for opens the internal restriction picker, holding the eight Continuum codes with no board field: repetitive lifting, no use of force, no restraint or take downs, no night or shift work, psychological restrictions, most of the concussion set, post surgical and weight bearing. These are stored as first class internal codes and emitted into the board's other restrictions free text field, which allows 2048 characters. That is a legitimate use of the field, not a workaround.
F9. Failure
Save failure retains all values locally, retries automatically, and shows an unsaved indicator. A measurement must never be lost to a network failure. Never a data loss dialog.
F10. Immutability
Every visit creates a new measurement version. Measurements are never updated in place and are never deleted, by any role including the practitioner. Source: BR-CLIN-004, section 12.1.

G. TREATMENT AND REFERRALS. SCR-TREAT-01
Was a stub. This is the complete specification.
G1. Layout
Single column. The medication management module is a conditionally revealed section with its own heading.
G2. Base fields, present on all four forms
Errata D3 correction. The source contradicts itself by calling D5 both the treatment plan on all forms and the start of the medication module. Treatment plan is D5 on a C050E and D28 on a C151. Read it from the form pack, never assume.
G3. Referral dropdowns
Category and type must be a valid pair from the board's table. That table contains only ten distinct treatment types, repeated once per report type. Build the dropdown from distinct types filtered by report type and the selected category, or the practitioner sees every option four times. Source: SCR-TREAT-01 validation, Errata D20.
Expedite may only be set where the board's own per row flag permits it for that specific type. An expedite request on a non expeditable type is rejected.
G4. The medication management module
Renders only on a C151, and only when [D1] is Yes. It is explicitly not asked on a C151S. Source: BR-CLIN-008.
Twenty three fields, in this order:
Surgery in the past 60 days
Malignant pain
Whether the board has advised not to submit a medication management report
Eleven side effect flags, as one fieldset with a legend, never eleven orphan checkboxes: nausea, sleep disorders and apnea, constipation, endocrine dysfunction, sweating, cognitive deficits, dry mouth, fatigue and drowsiness, depressed mood, worsening pain, social deterioration
Five misuse flags, same treatment: unsanctioned use, altering route of delivery, opioid seeking, accessing opioids from other sources, withdrawal symptoms
Pain severity, 0 to 10
Whether opioid therapy is reducing pain
A description of the reduction
Clinical function estimate, 0 to 10
The model may not answer any of the sixteen flags. Source: BR-AI-010.
G5. The highest value automation in the entire form family
On a follow-up, these twenty three fields recur near identically visit after visit. Present them carried forward behind one control: Any change since last visit?
Answering No preserves all twenty three values with provenance carried_forward and requires no further interaction.
This is not the same as defaulting. The practitioner is affirming that nothing changed, which is a clinical statement they are qualified to make, and it is recorded as such. The values are stored as carried_forward, never as system. Source: SCR-TREAT-01 acceptance criterion 2.
G6. Buttons
Add prescription · Add referral · Request expedite · Copy treatment plan from last visit · Any change since last visit (follow-ups with opioids only) · Continue.
G7. Model calls permitted here
Draft the treatment plan narrative from the transcript. Propose referral category and type from the diagnosis. Flag expedite eligibility from the board's own per row flag. Nothing else.
G8. Audit
TREATMENT_UPDATED, PRESCRIPTION_ADDED, REFERRAL_ADDED, OPIOID_MODULE_CARRIED_FORWARD with the count of fields carried.
G9. Acceptance criteria
The medication module appears on a C151 with opioids and never on a C151S.
Carrying forward records twenty three fields as carried_forward, not as system.
An expedite request on a non expeditable type is rejected.
The referral type dropdown shows each type once.

H. REVIEW AND SIGN. SCR-REV-01
Retain exactly as built. This is the regulatory gate.
H1. The rule that defines the screen
This screen is inert. Nothing generates here. Zero network requests to any model endpoint originate from it, verified by network inspection. A generation here would mean the thing being signed changed while it was being reviewed. Source: BR-AI-011.
H2. Layout
The complete report rendered in the board's own field structure and order, so the practitioner sees exactly what goes out under their credential. Sticky summary banner at the top. Sticky signature bar at the bottom.
H3. The blocking banner
An aria-live assertive region counting and naming: untouched drafts, missing always required fields, failed validations, and unconfirmed stale carried forward values. Each entry links to the first offending field.
H4. The five provenance treatments
H5. Skip with a reason
Available on any clinical field. Four options exactly:
( ) Not assessed at this visit
( ) Not clinically relevant to this injury
( ) Unable to assess
( ) Other  [                    ]
Where the board marks the field required, warn that submission will be rejected and offer Skip and hold alongside Skip anyway.
Source: BR-CLIN-002. The medical protection advice is that a physician should not complete form sections they cannot honestly complete, so forcing an answer puts the practitioner in conflict with their own liability guidance.
H6. Attachments
Up to three, typed against the board's per form allowed list, one megabyte each. On forms that permit none, the control is absent, not present and empty. Source: BR-VAL-009.
H7. Signature
Sign and submit requires zero untouched drafts, zero validation errors, and a practitioner whose credential matches the report's practitioner.
Signature cannot be delegated, cannot be batched, and cannot be automated. Source: section 12.3.
Also available: Sign and hold, Save as draft.
REPORT_SIGNED records practitioner identity, credential, timestamp, a full snapshot hash, and the list of drafted fields with whether each was edited. The snapshot hash must reproduce the exact submitted payload.
H8. Acceptance criteria
One untouched drafted field anywhere blocks signature, enforced server side, verified by calling the sign endpoint with the interface bypassed.
The signed snapshot hash reproduces the exact submitted payload.
A practitioner cannot sign a report authored under another practitioner's credential.
Zero model requests originate from this screen.
Every board required field that is missing is listed by name before signature is offered.

I. FOLLOW-UP ASSESSMENT. SCR-FUP-01
New in this package. Build it second, immediately after the measurement screen.
"Make a follow up visit take under two minutes when nothing has changed. This is the wedge. If this screen is mediocre the product fails commercially, regardless of how good the rest is." Source: SCR-FUP-01 purpose.
I1. Entry
Reached from the clinician home when a prior unsuperseded report exists on the claim. The form is resolved from the board's matrix, not chosen. A follow-up may only be created from the specific prior forms the board's matrix permits. Source: BR-WF-003.
I2. Layout, top to bottom
The trajectory control must be interactive immediately. The chart may load after it.
I3. The trajectory control
A radio group with a legend. Three values.
The correction that must be built
An earlier Continuum specification claimed UNCHANGED collapses 66 fields and reaches signature in two interactions. That is false and must not be built.
Verified in the board's own documents: selecting either Yes or No on the status changed element enables the missed work question; "not changed" hides only the coordination disposition questions and shows the pre-accident date; and five capability elements carry a rule that switches the code list from Extended to Basic rather than hiding the fields. What actually collapses the capability block is a separate rule, modified duties and modified hours both being No.
UNCHANGED requires four answers minimum, not two. Build the real chain from the form pack. Do not shortcut it.
The real saving is carry forward, and it is large: roughly 78 of 136 elements arrive pre filled.
I4. Carry forward rules
Every carried value renders with a from previous visit, 12 Aug label. It is never silently presented as a new practitioner finding.
The candidate carry forward set is all participant fields, all accident fields, the previous diagnosis, injury coding, the prior conditions answer, the invoice fields and the return to work fields.
A carried value older than a configurable age, default 90 days, is marked stale and cannot reach a signature without explicit confirmation. Source: BR-WF-007, "an unconfirmed three month old restriction is not a current assessment."
A new measurement version is created on every follow up, including UNCHANGED, so the recovery trend has a point for every visit. Source: BR-CLIN-004.
I5. The clearing warning, mandatory
Before any collapse that would discard entered data, warn explicitly that data in hidden fields will be cleared and not submitted. The board's rule is unambiguous: when a triggering field changes and causes a shown field to hide, the data in that field is cleared. Source: BR-WF-006.
I6. Where every value came from
The practitioner must be able to see the origin of everything on the screen. Six origins, each with its own visible treatment:
Worker reported data is never auto applied to a measurement and never enters a signed report unlabelled. A worker's self report is not a clinical finding. Source: BR-CLIN-007.
I7. Model calls permitted
Propose the trajectory selection from the worker check in trend, clearly labelled as derived from worker reported data and never auto applied. Summarise what the worker reported since the last visit. Nothing else.
I8. States
I9. Acceptance criteria
UNCHANGED applies the full board rule chain correctly and the payload matches the board's own minimum field example for the equivalent scenario.
A new measurement version exists after every follow up, including UNCHANGED.
The clearing warning appears before any collapse that would discard entered data.
A stale carried value cannot reach a signature without explicit confirmation.
Every value on the screen displays its origin from the six above.

J. SUBMISSION STATUS. SCR-OUT-01 AND SCR-REJ-01
New in this package. After signing, the case must not disappear.
J1. Report states. Use these exact values
From the report_status enumeration. Do not invent additional states.
Do not invent board acknowledgements the board does not provide. Alberta's channel is a file upload with a returned text file. There is no live acknowledgement, no delivery receipt and no read status. Where a jurisdiction's channel behaves differently, the jurisdiction pack controls it. It is never hard coded.
J2. What happens on signature
Eight outputs fan out simultaneously. The practitioner sees a checklist with per item state:
Board file generated and validated against the board's schema
Queued for upload, timed to beat the same day cutoff
Pink Copy generated
Clinical record generated for the clinic
Invoice lines computed
Employer view published, only if Card B consent exists
Worker plan activated, only if Card B consent exists
Follow-up pre built with the carried forward count
Partial failure is the normal case and must be handled gracefully. If the Pink Copy generates but the board file fails, say exactly that, keep the successful outputs, and offer targeted retry.
Never present a partial success as a success. Source: SCR-OUT-01 error state.
A file that fails schema validation never enters the batch and must surface to a named human, not to a log. Source: BR-VAL-008.
J3. Buttons
Print Pink Copy · Send secure link to worker · Download the clinical record · Retry submission · Back to home.
The Pink Copy is produced before invoicing is complete, per the board's own requirement.
J4. Rejections. SCR-REJ-01
"Where clinic trust is won or lost."
The board's return file gives a tab delimited error number and a description. There is no error code catalogue anywhere in the board's package. The mapping from error text to field is built by parsing description text and grown empirically.
Therefore:
A mapped error opens the report focused on the offending field, with a plain language explanation beside the board's raw text.
An unmapped error displays the board's raw text to a named human and is logged so the catalogue can grow. It is never swallowed and never guessed at.
A rejection notifies the clinic administrator and the report's practitioner.
A rejection older than a configurable threshold, default three business days, escalates.
Resubmission produces a new submission record and never mutates the original.
J5. Where the practitioner sees all this
Rejected and held reports appear in Needs you now on the clinician home. That is the only place a practitioner needs to look.

K. ROLES AND PERMISSIONS
Roles available: CLINIC_ADMIN, PRACTITIONER, COORDINATOR, BILLING, RECEPTION, AUDITOR.
K1. Practitioner only. Not delegable under any circumstance
Every one of these has a named source. Do not add to this list and do not remove from it.
K2. Already specified as clinic staff work. Build for it now
These are not open questions. The specification already places them outside the practitioner.
K3. Potentially delegable. CRAIG DECISION REQUIRED
One item, and it is load bearing.
Open question OQ-008. Does the practitioner or the office assistant complete the return to work section in a real clinic? The specification states plainly: "If it is the assistant, the entire user model is aimed at the wrong person."
Build for the practitioner, as the specification instructs, and expect a possible revision.
Architect so that resolving this does not require rebuilding the clinician experience. Specifically:
The measurement screen is a component that takes an actor and a permission set, not a screen hard wired to the practitioner session.
Every axis value already carries an actor in its audit row. Do not collapse actor into "the signing practitioner" anywhere in the data model, because that is the change that would force a rebuild.
The signature gate reads who asserted each clinical value, not merely whether a value exists. If delegation is later permitted for some subset, the gate becomes a policy lookup rather than a code change.
Until Craig answers, no non practitioner role may write a capability value. The permission simply does not exist yet.
K4. System actions
Derive the skill code and facility type at report creation with system provenance, because these are always required and block signature but the practitioner has no access to the invoice section. Source: Errata D4, the signature deadlock. Compute bands from measurements. Compute the duty match. Generate outputs on signature. system provenance is permitted on non clinical fields only.
K5. Model actions
May: draft a narrative field; propose an injury code; propose which functional axes are relevant; parse a board rejection; summarise what a worker reported; propose a trajectory selection labelled as worker derived.
May not: propose a capability value; propose a quantity; propose a fitness determination; propose a restriction; propose a diagnosis it was not given; propose the date of examination; answer the prior conditions question; answer any medication flag; auto correct any clinical field; run at all on the review and sign screen; draw on any other case however similar.
There is no code path by which a model response becomes provenance human.
Transcript text, worker check in text and board error text are untrusted input. They are data, never instructions. A transcript containing an instruction to the software must have no effect. Test with an explicit adversarial suite.
K6. Permissions that do not exist for anyone
Deleting a case, a report or a measurement. Editing a measurement, including by the practitioner, because measurements are immutable and versioned. Editing an audit event. Bulk signature. Signing another practitioner's report. An employer reading anything clinical, which is structurally impossible because the schema has no such column. A practitioner reading the invoice or the audit log.
A practitioner with signed reports is deactivated, never deleted, so signed reports always resolve to their author.

L. JURISDICTION BEHAVIOUR
L1. The architectural rule
No component contains a jurisdiction conditional. Every screen renders from form elements, form rules and code values filtered by the case's jurisdiction. If a screen, validator, document generator or fee calculation contains a province name, a province code or a form code as a literal, that is a defect.
Source: backlog task CT-003, "no jurisdiction rule appears in any component. Adding a second row requires no code change."
One resolver, used everywhere. No caller ever branches on jurisdiction. If you write a conditional on the jurisdiction, the abstraction has failed and the resolver needs another field instead.
L2. What varies by jurisdiction, and nothing else varies
Form definitions and code lists. The fee schedule. Which consents are required. What may lawfully reach an employer. Statutory deadlines and cutoffs. The statutory holiday table. The submission channel. The practitioner credential label and its format.
L3. Current honest state
A jurisdiction is active only when its real configuration exists. Do not seed speculative form packs. An unverified form definition that looks complete is more dangerous than an absent one.
L4. What happens on an inactive jurisdiction
Block, with a named message. Never fall back to Alberta and never fabricate board behaviour.
The reason is not pedantic: a silent fallback sends a Saskatchewan report on an Alberta form, under a real practitioner's real credential.
Implemented in first-report.html. Switch the jurisdiction selector and the reporting workflow is blocked with a message naming the board and stating exactly what is missing.
Other loud failures: a resolver called with no jurisdiction fails rather than defaulting. A form pack missing any required component fails activation and names what is missing. A fee lookup with no effective row for that date fails rather than using the nearest row. A deadline with no configured rule fails rather than assuming 48 hours.
L5. Adding a jurisdiction
Must require zero application code changes. It requires a jurisdiction row with deadlines, a form pack, a fee schedule and holiday table, a submission adapter only if the channel is new, and a disclosure and consent profile.
The proof: a synthetic test jurisdiction with two invented forms loads entirely from data, renders, validates and generates a document, with no application code change. Build that test.
One clinician application serves every province. There is never a second clinician application.

M. OUTSTANDING CRAIG DECISIONS
Four. Nothing else in this package is waiting on you.
1. Who completes the return to work section in a real clinic, the practitioner or the office assistant? This is OQ-008 and it is the biggest one. The specification says that if it is the assistant, the entire user model is aimed at the wrong person. The package is built for the practitioner and architected so the answer can change without a rebuild. Answering this needs one conversation with one clinic.
2. Do we hold ambient recordings at all, and for how long? This is OQ-016. The consent wording currently shown to a patient says recordings are deleted after 30 days. That sentence is a promise to a patient and it must match reality before anyone reads it.
3. Nurse practitioners. Unresolved and left unresolved on purpose. The board's own role code list holds nine codes and does not include nurse practitioner, while its contract mapping table does reference the role. The two board documents contradict each other.
Until the board resolves it, nurse practitioner support cannot be claimed and must be blocked at configuration with an explanatory message. Do not work around this. Do not make a board submission claim the board's own material does not support. The decision you own is whether to write to the board and ask.
4. Saskatchewan and Ontario. Neither has a form pack, so neither is operable, while your practitioners are working in those provinces. Either the clinic side follows the Alberta plan and waits, or a real form pack is commissioned for the province where your practitioners actually are. This is a sequencing decision, not a technical one.

BUILD ORDER
Build in this order. It is not the order the screens appear in.
Source: Prompt 41 section 2, "build the measurement screen and the follow up screen first, before the worklist, because they are the two that determine whether the product is worth using."
PREREQUISITE, BEFORE ANY OF IT
Is the hub authentication fix deployed and verified by Craig? Nothing ships before it is. Report status and stop if not. Source: Prompt 41 section 1.
File | What it is
clinician-home.html | Section B, built. The screen a practitioner lands on.
first-report.html | Sections C to H, built. The first assessment, entered from the home screen.
Term | Means | Never call it
The board | The workers compensation authority for the case's jurisdiction | WSIB, the insurer, WCB in user facing copy
Practitioner | A physician or nurse practitioner who signs reports | Doctor, user, provider
Case | One workplace injury for one worker at one clinic | Claim. The board owns claims, we do not
Report | One board form instance, for example a C050E | Form. A form is a definition, a report is an instance
Measurement | The functional capacity a practitioner recorded | Restriction, assessment
Band | The board's coarse value derived from a measurement | Level, category
Restriction | A label computed from a measurement | Never a stored fact
Pink Copy | The board mandated worker copy | Worker summary, employer copy
Employer view | Continuum's narrower employer artifact | Pink Copy. Two different things
Duty match | Safe, conditional and excluded duty lists | Restriction list
Order | Region | Why it is here
1 | Application bar: clinic name, practitioner name and role, sign out | Orientation only
2 | Action bar: one line summary, search, Start a new assessment | The two things done most often
3 | Needs you now | Work only this practitioner can clear
4 | Today | Who is in the building
5 | Follow-ups due | Who is falling out of contact
6 | Recently seen | Quiet. Getting back to someone from yesterday
Kind | Row shows | Row action
Awaiting your signature | Worker, form, date of examination, time remaining on the fee tier | Review and sign
Rejected by the board | Worker, form, the board's own error text where mapped | Open the problem
Held or incomplete | Worker, form, what is missing, how long it has been held | Resume
Condition | Display
More than one hour remaining | 4h 12m to same day, normal weight
Under one hour remaining | 47m to same day, caution colour
Passed | Same day lost, neutral colour, not alarming
State | Behaviour
Loading | Ten skeleton rows per section. The search field and the primary button are interactive immediately.
Empty, whole screen | Nothing needs you right now. with the primary button. Never an empty page.
Empty, Needs you now | Nothing is waiting on your signature. Section stays visible so the practitioner learns where it lives.
Empty, Today | No assessments booked today.
Empty, Follow-ups due | No follow-ups due.
Empty, search | No cases match. with a clear control.
Error | Inline banner above the affected section. The section keeps its last successful data. Retry control. Never a blank screen.
Return from a signature | Transient message: Report signed and queued. Same day tier secured. Source: SCR-WL-01.
Safeguard | Rule | Source
Provenance on every field | human, ai_draft, ai_draft_edited, carried_forward, system | BR-AI-003
Draft is loud | Four pixel left border, tint, and the words Draft, not yet reviewed as real text in the page, never a pseudo element. It cannot be styled quiet | Prompt 58, Prompt 41 section 0.2
Signature blocked by an untouched draft | Enforced server side. The interface only mirrors it | BR-AI-004
No model authored clinical value | The model may propose which axes to open. It may never propose a capability value or a quantity. No exception, no confidence threshold, no configuration flag | BR-AI-002
Measurement precedes restriction | A restriction is computed from a measurement and is never stored or typed | Locked terminology
One axis at a time | No control anywhere writes more than one capacity axis from a single action | Amendment 1, criterion A1
Linear progression | No free navigation forward | Developer Build Package section 7
Jurisdiction from the pack | No jurisdiction conditional in any component | CT-003
No silent fallback | An inactive jurisdiction blocks with a named message | Prompt 45 section 6
Nothing generates on review | Zero model requests originate from the review and sign screen | BR-AI-011
State | Behaviour
Loading | Text renders server side. Controls disabled until the consent version resolves
Success | Inline confirmation. No transient message
Error | Consent capture failure blocks progression, because an unrecorded consent is worse than a delayed visit
Field | Board element | Limit | Required | May be drafted
Mechanism of injury, how and when it occurred | [B4] | 1024 | yes | yes
Date of examination | [C1] | date | yes | no, never
Symptoms | [C2] | 2048 | yes | yes
Objective findings | [C3] | 1024 | yes | yes
Current diagnosis | [C4] | 1024 | yes | yes
Prior conditions in the same area | [C13] | Yes or No | yes | no, never
Describe the prior condition | [C14] | narrative | conditional on [C13] | yes
Tier | Meaning | Behaviour
REQUIRED_NOW | The injured region, the worker's own report, a clinical finding, a proposed duty or a jurisdiction rule makes this necessary on this visit | Individual answer only. Blocks signature while unassessed. No accelerator of any kind
RTW_RELEVANT | A real recorded job demand touches this axis, but nothing makes a statement necessary yet | May be answered. Does not block signature. Rendered to the employer as no statement was made, never as ability
CONTEXT_ONLY | Neither the injury nor any recorded demand touches it | Not shown as an exception at all
Measured weight | Band emitted | What the practitioner is shown
Under 5 kg | LIMITED, logged as below the board's lowest band | you measured 3 kg, which is below the board's lowest band. The board has no value under 5 kg, so 5 kg is what it receives
Exactly 5 kg | LIMITED | no note
Over 5, under 10 | LIMITED | you measured 8 kg, rounded down for safety
Exactly 10 | LIGHT | no note
Over 10, under 20 | LIGHT | rounded down for safety
Exactly 20 | MEDIUM | no note
Over 20 | HEAVY, defined as over 20 kg, not a rounding case | shown as over 20 kg / over 44 lb
Field | Board element | Type | Required
Narcotics or opioids prescribed this visit | [D1] | Yes or No | yes
Prescriptions: name, strength, daily intake | [D2 to D4] | dataset, up to 5 rows | required when [D1] is Yes
Treatment plan and non opioid medications | [D5] on C050E, [D28] on C151 | narrative, 1024 | yes
Consultations, referrals and investigations: category, type, details, expedite | [D6 to D9] | dataset, up to 5 rows | no
Case conference with the board's case manager | [D10] | Yes or No | yes
Case conference with the board's physician | [D11] | Yes or No | yes
Referral to a return to work provider | [D12] | Yes or No | yes
Provenance | Treatment
human | Normal
carried_forward | Small label, from previous visit, 12 Aug
ai_draft | Left border, Draft, not yet reviewed, blocks signature
ai_draft_edited | Small label, drafted, edited by you
system | Small label, generated. Non clinical fields only
Order | Section | Contents
1 | The case at a glance | Original injury with part and side, date of injury, previous diagnosis, days since injury, prior report type and date
2 | Trajectory | One sparkline per previously measured axis, showing measurement across visits. Plus worker reported pain and function where Card B consent exists
3 | What the worker reported | Check in data since the last visit. Any divergence from the practitioner's last assessment is flagged neutrally, never as a contradiction
4 | Outstanding items | Referrals with no result, investigations pending, prior modified duty status
5 | The trajectory control | The whole screen turns on this
Selection | Behaviour | Where it routes
UNCHANGED | Carries every eligible field forward and applies the board's real rule chain. Routes to review when the chain permits | Review and sign
IMPROVING | Carries forward, opens only the axes the practitioner chooses to relax, pre set to previous values | Measurement, partial
REGRESSING | Carries forward, opens the full measurement screen with previous values shown alongside for comparison | Measurement, full
Origin | Treatment
Previous visit | from previous visit, 12 Aug
Worker input | worker reported
Clinic staff | entered by <name>, <role>
Model draft | Draft, not yet reviewed, loud, blocks signature
Current practitioner | no label, normal
System derived | generated, non clinical fields only
State | Behaviour
Empty, no check ins | Show the section reading No check ins recorded, never hide it, so the practitioner knows the difference between no data and no problem
Error, prior report will not load | Block and explain. Never present an empty follow up as though it were a first report
State | What the practitioner sees | Reached by
draft | Draft | Case opened, work in progress
awaiting_signature | Ready to sign | Every gate cleared, not yet signed
signed | Signed | Practitioner signed
held | Held | Signed but deliberately not sent, or a required field skipped
queued | Queued for submission | In the next scheduled batch
submitted | Sent to the board | Upload succeeded
accepted | Accepted | The board's return file confirmed it
rejected | Rejected, action required | The board's return file raised an error
void | Void | Superseded or withdrawn
Action | Source
Create, edit or accept any clinical value | BR-CLIN-001, "the practitioner is the custodian and the author. Everything else is transcription"
Set any capability value or quantity on the measurement | BR-CLIN-003
Answer the prior conditions question | BR-AI-010
Answer any of the sixteen medication flags | BR-AI-010
Confirm or override employer work availability | SCR-OIS-01 acceptance criterion 1
Assert the trajectory on a follow-up | SCR-FUP-01
Sign a report | Section 12.3, "signature is personal, not delegable, not batchable, not automatable"
Confirm a stale carried forward value | BR-WF-007
Action | Role | Source
Start a case: worker, employer, accident, claim number | Reception | SCR-CASE-01 purpose, "designed to be completed by reception in under 90 seconds, before the practitioner sees the worker"
Obtain and record consent | Any clinic staff | SCR-CONS-01 audit, which records "the staff member who obtained it" as a distinct field from the practitioner
The entire invoice | Billing, clinic admin, coordinator | SCR-INV-01, "explicitly not the practitioner"
Handle a rejection that is administrative | Coordinator, clinic admin | SCR-REJ-01 users
Print the Pink Copy, send the worker link | Reception, coordinator | SCR-OUT-01
Jurisdiction | State | Meaning
Alberta | Form pack exists | The clinician experience is fully operable
Saskatchewan | Architecture only | No form definitions, no code lists, no rule set, no fee schedule, no holiday table. Not operable
Ontario | Architecture only | Same. Uses a portal channel rather than file upload, so a new submission adapter is also required. Not operable
Order | Screen | Why here
1 | Measurement, SCR-MEAS-01 | The only genuinely new work in the encounter, and the screen most likely to need rework once a clinic sees it
2 | Follow-up, SCR-FUP-01 | The commercial wedge
3 | Clinician home, SCR-HOME-01 | Everything else hangs off it
4 | Start a case, SCR-CASE-01 | 
5 | Consent, SCR-CONS-01 | 
6 | Review and sign, SCR-REV-01 | 
7 | Examination, SCR-EXAM-01 | 
8 | Treatment, SCR-TREAT-01 | 
9 | Submission status, SCR-OUT-01 | 
10 | Rejections, SCR-REJ-01 | 