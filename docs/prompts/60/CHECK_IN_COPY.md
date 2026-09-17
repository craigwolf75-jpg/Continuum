# Prompt 60 check-in copy

In-house wording for the concussion check-in and the
visibility lines. Draft for the catalogue. Not shipped
product copy. Sequenced 2026-09-16 for Section 1 then
allowed-scope local/CI draft. Still not a live-platform
product release. Athena does not ship.

Section 0 overrides this file. Continuum does not
diagnose, treat, or determine fitness. The treating
physician makes every medical and return to work
decision. Check-in is task linked, not symptom scored.
Twenty-four hour settle boundary only. The platform
never auto-advances hours steps.

Author all wording in house. Worker lines are grade 7,
calm, no guilt. The next step is always visible.
Supported, never monitored. Button labels are verbs.
The same action has one name.

No em dashes or en dashes anywhere.

See [REGISTER.md](REGISTER.md) and [STOPS.md](STOPS.md).

---

## What this file captures

The worker check-in captures only:

1. Which of today's approved duties the worker actually
   performed (from the plan duty list).
2. Whether any of those duties made symptoms worse, and
   if yes which one or ones. Multiple selections
   permitted.
3. Whether that worsening had settled by the end of
   shift.
4. Approved hours today versus hours actually worked.
5. Optional free text in the worker's own words.

Nothing else. No instrument name. No score. No total.
No band. No colour ranking. No readiness from check-in.

Duty names in examples below are SYNTH fixture titles
only (6 positions). They are not a live library and
not the 209 GardaWorld duties.

---

## Visibility walls

| Surface | What they see | What they never see |
|---|---|---|
| Worker | The check-in, the next-day follow up, a save confirmation, your saved check-ins | A score, a band, a medical decision |
| Clinician | A routed record for review, including what the worker reported | A recommendation, a score, a clearance |
| Coordinator | Contact prompts, hours hold, match faces, unmapped loud fail | A symptom, a body part, a diagnosis |
| Employer / supervisor | Functional status and the safe duty list | Check-in, symptom, provocation, hours the worker typed |

Employer phrases stay: duties on track, duty plan under
review, awaiting clinical review. Per program rules is
the routing sentence. The platform informs. People
decide.

Do not use "patient" for a worker on the employer side.

The standing employer wall is protected string 3 from
`docs/prompts/52/VOICE.md`. Cited, not rewritten. Human
gate if anyone changes it:

`Continuum shows you what work is safe. It does not tell you the worker's diagnosis, symptoms, medications or examination findings, and never will.`

---

## Worker check-in

Register: plain, second person, short sentences. Grade 7.
No praise. No apology. No streak. No guilt.

### Screen title

`Today's duties`

### Opening line

`This check-in is about the duties on your plan today. It is not a score.`

### Approved duty list (capture 1)

Label: `Which of today's approved duties did you do?`

Helper: `Pick every duty you actually did. The list comes from your current plan.`

Empty: `There are no approved duties on your plan today. You have nothing to mark.`

Example options (SYNTH fixture, labelled as fixture):

- `Gatehouse monitoring`
- `Yard foot patrol`
- `Light bin sorting`

Control: multiple choice. Duties not on today's plan
do not appear.

### Worsening, task linked (capture 2)

Label: `Did any of those duties make your symptoms worse?`

Helper: `This is about the duties you did today, not a score.`

Choices:

- `No`
- `Yes`

If Yes, follow-on label: `Which duty or duties made your symptoms worse?`

Follow-on helper: `You can pick more than one.`

The follow-on list is only the duties the worker marked
as done. Multiple selections permitted.

If the worker marked no duties done, do not ask this
pair. Do not invent a symptom list.

### End of shift settle (capture 3)

Ask only when the worker said Yes to worsening.

Label: `Had that worsening settled by the end of your shift?`

Helper: `Settled means you felt the same as before that duty, by the time your shift ended.`

Choices:

- `Yes, it had settled`
- `No, it had not settled`

If more than one duty was marked, keep one settle
answer for the shift. Do not total duties. Do not
grade the worsening.

### Hours (capture 4)

Label: `Hours today`

Approved line: `Approved hours today: [n]`

If approved hours are missing from the plan, show
`UNKNOWN`. Never show 0 for a missing value.

Worker line: `Hours you worked today`

Helper: `Type the hours you actually worked. This is not a score.`

### Optional free text (capture 5)

Label: `Anything else you want to say?`

Helper: `Optional. In your own words. This is recorded as worker reported.`

Placeholder: ` ` (empty). Do not prompt them to fill it.

### Actions (one name each)

Primary: `Save check-in`

If they leave: `Keep for later`

Do not use a second name for save. Keep for later is
the action only. No confirmation line.

### Confirmation

`Your check-in is saved. The doctor can see what you reported. Your employer does not see this check-in.`

### Save failed

`Your check-in is not saved yet. What you typed is still here. Try again in a few minutes.`

### Already saved today

`Today's check-in is already saved. Nothing else is due now.`

---

## Next-day follow up

Twenty-four hour settle boundary only. Ask about one
named duty at a time. Use this when a worsening was
still present at the end of shift, or as the next-day
settle check for that duty.

Title: `About yesterday`

Question: `Yesterday you said [duty name] made your symptoms worse. Has that now settled?`

Example: `Yesterday you said Yard foot patrol made your symptoms worse. Has that now settled?`

Choices:

- `Yes, it has settled`
- `No, it has not settled`

Helper: `Settled means you feel the same as before that duty.`

Primary: `Save check-in`

Confirmation: `Your answer is saved. The doctor can see it. Your employer does not see this follow up.`

Unanswered state (worker): `This follow up is still open. Save an answer when you can.`

Do not add a new symptom question. Do not auto-advance
hours because the answer is Yes.

---

## Worker History

Worker surface. Grade 7. Second person. Not a score.
Not a band. Not a colour ranking. Not the clinician
table. Employer does not see this list.

Title: `Your check-ins`

Opening: `This list is what you reported. It is not a score.`

Empty (no saved check-ins at all): `You have not saved a check-in yet. You can save one from Today's duties.`

Do not use the clinician empty line on this surface.
`No check-in is on file for this date.` is clinician
only.

Date: show the stored date. No extra label.

Duty, no worsening:

`[duty]. You said this duty did not make your symptoms worse.`

Example: `Yard foot patrol. You said this duty did not make your symptoms worse.`

Duty, worsening that has settled:

`[duty]. You said this duty made your symptoms worse. That has settled.`

Duty, worsening that has not settled:

`[duty]. You said this duty made your symptoms worse. That has not settled.`

Duty, follow up still open:

`[duty]. You said this duty made your symptoms worse. This follow up is still open. Save an answer when you can.`

Free text, if any: `You also said: [text]`

Do not write `worker reported` as a worker History
label. That label is clinician only.

Do not write field-name voice (`worsened yes`,
`settled within 24h`). Do not total the rows. Do not
band them. Do not colour them.

---

## Clinician table

This is a routed record for review, not a
recommendation. Software does not drive a medical call.

Table label: `Routed record for review`

Required line, character for character:

`The treating physician makes every medical and return to work decision.`

Visibility line: `Surfaces for the doctor to review. This is not a recommendation.`

Columns, in this order. Transcribe. Do not interpret.

1. Date
2. Duties performed (from the plan duty list)
3. Duties the worker said made symptoms worse
4. Settled by end of shift
5. Approved hours / hours worked
6. Next-day settle (Yes / No / unanswered)
7. Worker free text, labelled `worker reported`

Empty: `No check-in is on file for this date.`

Do not total the rows. Do not band them. Do not colour
them. Do not add a readiness, recovery, or severity
field. Do not write "clinical review recommended".

---

## Coordinator prompts

Operational and specific. A prompt to make contact.
Never a symptom. Never a body part. Never a diagnosis.

### Worsening did not settle in 24 hours

`A worsening was reported and did not settle within 24 hours. Per program rules, make contact. Check that the current assignment still matches the current restrictions.`

### Follow up unanswered

`A follow-up is unanswered. Per program rules, make contact. Check that the current assignment still matches the current restrictions.`

### Hours hold (planned step date passed)

`The planned hours step date has passed. The plan holds. Outstanding action: clinician authorisation is still needed.`

Primary action name: `Make contact`

Do not write "regression detected". Do not write
"clinical review recommended". Do not write "at risk".
Do not name a duty as a provocation on this surface.
Do not name a body part. Do not name a diagnosis.

---

## Employer / supervisor

Functional status and the safe duty list only. No
check-in. No symptom wording. No provocation. No hours
the worker typed.

### Status lines (one of these)

- `Duties on track`
- `Duty plan under review`
- `Awaiting clinical review`

### Safe duty list

Heading: `Work that is safe on the current plan`

Empty: `No safe duties are on the current plan.`

Expired: `This duty list is past its review date. Do not assign from it.`

### Hours the plan allows

`Approved hours: [n]`

If missing: `Approved hours: UNKNOWN`

Never show 0 for a missing value. Never show hours the
worker typed in the check-in.

### Hours hold (employer face)

`Hours stay as they are. The plan holds. Outstanding action.`

No clinical reason. No check-in fact. Software does
not clear anyone for duty.

### Employer wall (cited, not rewritten)

`Continuum shows you what work is safe. It does not tell you the worker's diagnosis, symptoms, medications or examination findings, and never will.`

---

## Hours hold, all faces

When a planned step date passes without clinician
authorisation:

- The plan holds.
- Outstanding action is visible.
- No clinical content on the employer view.
- The platform never auto-advances the hours step.

Worker (if they open the plan): `Your hours stay as they are. The next hours step has not been authorised.`

Clinician: `Planned hours step date has passed. The plan holds. Outstanding action: authorisation.`

Coordinator and employer: use the lines in the sections
above.

Do not write "clears for duty". Do not write a
readiness from this hold.

---

## Binding constraint fact line

Descriptive only. No recommendation. Always name the
specific restriction. Example numbers only. Not canon.
Not a live library count. Not 209 scored duties.

Shape: `[restriction] accounts for [n] of [n] exclusions`

Example (labelled example): `No lone work accounts for 34 of 41 exclusions. Example numbers only.`

If a count is missing, write `UNKNOWN`. Never write 0
for a missing count.

Do not turn this line into a rank, a band, or a next
step. Continuum shows what changed. People decide.

---

## Match result face text

Always name the specific restriction responsible. Do
not score. Do not interpret past the face text.

### Excluded

`Excluded by: No lone work`

Shape: `Excluded by: [restriction]`

### Conditional, past review date

`Conditional: restriction past review date`

### Conditional, not yet assessed

`Conditional: not yet assessed on this demand factor`

### Unmapped restriction (loud fail to coordinator)

Coordinator only:

`Unmapped restriction. This demand cannot be matched. Do not assign from this result. Make contact.`

Do not send an unmapped result to the employer as a
safe duty. Do not guess a match. Do not silence it.

Intensity definitions were retrieved from C1447.
Customer facing copy must not claim board alignment
for any intensity scale. Open item 8.2. See
[STOPS.md](STOPS.md).

---

## Sentences flagged

Closest lawful sentence first. The forbidden or STOP
wording is named after it.

1. Lawful: `The doctor decides. Continuum shows the information.`
   Could not use the bound phrase "the doctor decides;
   we show the information" as product voice. "We" is
   not the software. Consent and legal text may use
   "we". This line is not that.

2. Lawful: `Flagged for the doctor to review` and
   `Surfaces for the doctor to review.`
   Could not write "clinical review recommended".
   Banned. Software does not recommend care.

3. Lawful: `The plan holds. Outstanding action: clinician authorisation is still needed.`
   Could not write "clears for duty". Banned.

4. Lawful coordinator: `A worsening was reported and did not settle within 24 hours.`
   Could not write "regression detected" or "at risk".
   Banned.

5. Lawful employer noun: `worker`
   Could not write "patient" on the employer side,
   including schemas.

6. Worker capture uses `symptoms` on the worker and
   clinician surfaces only, task linked to a named
   duty. That word is forbidden on the employer view.
   Closest employer line is the safe duty list, with
   no provocation.

7. Could not write a recovery score, a readiness
   score, a severity field, a total, a band, or a
   colour ranking. Check-in is not scored.

8. Could not claim WCB Alberta
   Cognitive-Psychosocial Job Demands Analysis
   alignment for the intensity scale. Open item 8.2.
   STOP.

9. Could not repeat this copy in outbound sales
   material. Open item 8.3. STOP until Section 7
   actually passes.

10. Employer wall is [SPEC] from Prompt 52. Cited, not
    rewritten. Changing it is a human gate for Gary.

11. Example constraint counts (34 of 41) are examples
    only. Could not present them as a scored live
    library. 209 GardaWorld duties are not in this
    repository.

12. Named concussion instruments and score-field
    identifiers stay in [STOPS.md](STOPS.md) only.
    They are not product copy and are not used here.

13. Lawful worker History heading: `Your check-ins`
    Could not write `Check-in record` or reuse
    `Routed record for review` as worker voice.

14. Lawful worker History empty: `You have not saved a check-in yet. You can save one from Today's duties.`
    Could not use clinician empty `No check-in is on
    file for this date.` as a worker all-dates empty.

15. Could not write field-name voice `worsened yes`
    or `settled within 24h` on worker History. Worker
    duty lines are the four shapes above.

16. Could not keep companion `Saved on your phone as
    you go.` or `Your care team sees this. Your
    employer does not.` Confirmation already names
    the doctor and the employer wall.

17. Could not write `Kept on this device.` Keep for
    later is the action only. No confirmation line.
