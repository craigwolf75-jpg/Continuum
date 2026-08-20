# Prompt 40 Increment 2: C050S Rule Transcription

Status: TRANSCRIBED, verification against sample XML PENDING per rule.
Source document: `2.02 - C050S - User Interface Design.pdf` (9 pages), read in full 2026-08-09.
Sample XML: `5.06 - C050S - Min Fields.xml`, `5.04 - C050S - Max Fields with Attachments.xml`,
`5.05 - C050S - Max Fields without Attachments.xml`.
Companion: this form's shared sections mirror `2026-08-09-prompt-40-C050E-rules-transcription.md`.
House rule: no em dashes or en dashes.

C050S (OIS Physician's First Report) is the largest clinical form: 171 elements, 70 always required, 87
return to work fields. It carries about 71 numbered rules. Every section except Return to Work is
identical to C050E; the OIS Return to Work block is the differentiator and the source of the two board
self contradictions (Prompt 40 Section 4.5 and Section 9 items 4 and 5).

## Sections identical to C050E (see the C050E transcription for full rows)

These carry the same rule codes, triggers, conditions and affected elements as C050E, verified line by
line against this document. The code reuse hazard is identical (BR1 recurs on the Accident, Injury and
Invoice pages; SR1 recurs on Injury, Treatment and RTW; BR5 on Participant and Injury).

- Participant Details (page 1): BR5 (Worker 36 one of two required, PHN polarity inversion source).
- Accident Details (page 2): BR1 (Date of Injury range), SR4 (develop over time warning).
- Injury Details (pages 2 to 3): BR1, BR2 (POB-NOI), BR3 (unique combos, VAL-X04), BR5 (POB-SOB, cites
  the nonexistent SOB POB Relations tab), BR6 (diagnostic code order, VAL-X05), BR8 (at least one row),
  BR9 (row completeness, VAL-X06), SR1 (prior conditions enable), SR3 (dominant hand, VAL-X07), SR4
  (five rows enable additional injuries, VAL-X08), IBR1, IBR2.
- Treatment Plan Details (pages 3 to 4): BR1, BR2, BR3, SR1 (opioid fields enable, VAL-X09), SR5
  (expedite eligibility, VAL-X10), SR7 (expedite message), SR13 (category list, VAL-X11), SR17
  (investigation message).
- Other Information, Attachments (page 8): BR6, BR7, SR9, SR11, SR12.
- Invoice Details (page 9): BR1, BR3, BR6, BR18, SR6, SR7, SR11, SR13, SR17.

## Return to Work Details (pages 5 to 7). The OIS block. Full transcription.

### Date and environment business rules

| code | ord | type | trigger element | condition | affected | VAL | ver |
|---|---|---|---|---|---|---|---|
| BR2 | 3 | business | Estimated date pre-accident level work | >= Date of Examination | that date | | pending |
| BR3 | 2 | business | Date of follow up visit | >= Date of Examination | that date | | pending |
| BR4 | 1 | business | Modified work is required from | >= Date of Injury | that date | | pending |
| BR5 | 3 | business | Modified work is required to | >= Modified work is required from | that date | | pending |
| BR6 | 4 | business | Modified work is available from | >= Date of Injury | that date | | pending |
| BR7 | 2 | business | Modified work is available to | >= Modified work is available from | that date | | pending |
| BR8 | 2 | business | Date the patient returned to work | > Date of Injury | that date | | pending |
| BR9 | 2 | business | Number of hours capable of working per day | > 0 and <= 24 | that field | VAL-X12 | pending |
| BR11 | 1 | business | Environment = Restricted from | at least one of Cold, Hot, Wet, Dry, Dust, Lighting, Noise checked | environment checkboxes | | pending |

### The gate chain SR1, SR2, SR3

| code | ord | type | trigger element | condition and effect | clears | ver |
|---|---|---|---|---|---|---|
| SR1 | 3 | show_hide | Will/has the patient miss(ed) work beyond the date of accident | Yes -> enable Has the patient returned to work, hide Modified duties and Modified hours. No -> enable Modified duties and Modified hours, clear and hide Has the patient returned to work | true | pending |
| SR2 | 1 | show_hide | Has the patient returned to work | Yes -> enable Date returned, Modified duties, Modified hours; hide Current Capabilities, Other reasons why the patient cannot work, Other restrictions or additional comments, Estimated date pre-accident. No -> the inverse | true | pending |
| SR3 | 2 | show_hide | Modified duties, Modified hours | both No -> enable Other restrictions, clear and hide Number of hours, Current Capabilities, Other reasons, Estimated date. both Yes -> enable all five. duties No hours Yes, and duties Yes hours No -> the two mixed branches per the board text | true | pending |

CONTRADICTION 1 (Prompt 40 Section 4.5 and 9.4): SR2 and SR3 reference the field names "Current
Capabilities", "Other reasons why the patient cannot work", and "Estimated date you expect the patient
will be able to perform pre-accident work". Per the engine spec, these are NOT element names on the
C050S element list. Therefore SR2 and SR3 load with `unresolvable = true` for those affected names,
are reported, and are not silently dropped. Do not guess a mapping.

### Per axis capability enables (OIS extended axes)

| code | ord | trigger element | on Limited to | on Able or Unable | ver |
|---|---|---|---|---|---|
| SR5 | 2 | Sitting | enable Hours (approx.) (sitting) | (n/a) | pending |
| SR6 | 1 | Standing | enable Hours (approx.) (standing) | (n/a) | pending |
| SR7 | 2 | Walking | enable Hours (approx.) (walking) | (n/a) | pending |
| SR8 | 1 | Bending | enable Hours (approx.) (bending) | hide and clear Hours (bending) | pending |
| SR9 | 1 | Twisting | enable Hours (approx.) (twisting) | hide and clear Hours (twisting) | pending |
| SR10 | 1 | Kneeling/Squatting | enable Hours (approx.) (kneeling/squatting) | hide and clear that field | pending |
| SR11 | 3 | Climbing | enable Hours (approx.) (climbing) | hide and clear that field | pending |
| SR12 | 1 | Pushing/Pulling | enable Hours (approx.) (pushing/pulling) | hide and clear that field | pending |
| SR18 | 1 | Lifting - Floor to waist | enable Max of (lifting - floor to waist) | hide and clear that field | pending |
| SR19 | 1 | Lifting - Waist to shoulder | enable Max of (lifting - waist to shoulder) | hide and clear that field | pending |
| SR20 | 1 | Lifting - Above shoulder | enable Max of (lifting - above shoulder) | hide and clear that field | pending |
| SR21 | 1 | Driving | enable Hours (approx.) (driving) | (n/a) | pending |

Note: SR8 to SR12 confirm the engine spec Section 3 matrix that on the C050S the bending, twisting,
kneeling and climbing axes carry Extended codes PLUS an hours element (unlike the C050E where they are
Basic with no hours). SR18 to SR20 confirm the three separate lifting planes, each with its own Max of.

### Grasping (twelve fields, six per hand)

| code | ord | trigger element | condition and effect | clears | ver |
|---|---|---|---|---|---|
| SR13 | 2 | Grasping - right | Unable -> enable Prolonged, Repetitive, Vibration, Specify (grasping - right). Able -> hide and clear those four | true | pending |
| SR14 | 1 | Specify (grasping - right) | checkbox checked -> enable Specify text box (grasping - right). unchecked -> hide and clear | true | pending |
| SR15 | 1 | Grasping - left | Unable -> enable Prolonged, Repetitive, Vibration, Specify (grasping - left). Able -> hide and clear those four | true | pending |
| SR16 | 1 | Specify (grasping - left) | checkbox checked -> enable Specify text box (grasping - left). unchecked -> hide and clear | true | pending |

### Environment, OIS disposition, follow up, modified work, family physician

| code | ord | trigger element | condition and effect | clears | ver |
|---|---|---|---|---|---|
| SR22 | 1 | Environment | Restricted from -> enable Cold, Hot, Wet, Dry, Dust, Lighting, Noise (Environment). No restrictions -> hide and clear all seven | true | pending |
| SR23 | 1 | The patient was assessed and now deemed | Not fit for any work today -> enable Estimated return to work date and Level. Fit to return with limitations as above -> hide and clear Estimated return to work date and Estimated return to work level | true | pending |
| SR24 | 1 | OIS follow-up visit required | Yes -> enable Date of follow up visit. No -> hide and clear it | true | pending |
| SR25 | 1 | Modified work is required | Yes -> enable From and To (modified work is required). No -> hide and clear both | true | pending |
| SR26 | 1 | If applicable, modified work is available | Yes -> enable From and To (modified work is available). No -> hide and clear both | true | pending |
| SR27 | 1 | Patient has family physician | Yes -> enable Physician name, Phone number (Country), Phone number (Phone number), Diagnosis/treatment plan (physician), Family physician support for OIS, Return to work date, Who will continue treatment, Return to modified work, Comments (physician). No -> hide and clear all nine | true | pending |

## CONTRADICTION 2 (Prompt 40 Section 4.5 and 9.5): always required and hidden

About twenty C050S capability elements are marked Always Required in the mapping workbook while SR2 (and
the SR3 branches) hide and clear the same block when the worker has returned to work. Taken literally a
legitimate C050S is unsubmittable. Interim handling per the engine spec: an element hidden by an
applicable rule is exempt from the always required check regardless of workbook optionality, and every
exemption writes an exemption record (acceptance criterion 16). The affected elements are the RTW
capability axes and the fields SR2/SR3 hide (Current Capabilities and the per axis capability values,
Other reasons why the patient cannot work, Estimated date pre-accident, Number of hours). Do not
resolve in code. Craig is raising both contradictions with the board.

## Verification (definition of done, not yet met)

`verified_against_sample_xml` stays false per rule until confirmed against `5.06 - C050S - Min
Fields.xml` (the OIS RTW block minimal, worker not returned to work) and `5.04`/`5.05` (maximal). The
grasping, lifting plane, and environment structures in the samples confirm the twelve grasping fields,
three lifting planes, and seven environment booleans that SR13 to SR22 gate. Full per rule presence and
absence assertion is the continuing step.

## Estimate update

C050S ~ 71 rules (C050E ~ 48). Two clinical forms transcribed. C151 and C151S remain (C151S carries the
SR30/SR28 no change chain the engine spec Section 4.4 corrects), then the four invoice forms. Running
total consistent with ~300 to 380 across all eight.
