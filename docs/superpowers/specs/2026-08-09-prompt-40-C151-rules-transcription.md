# Prompt 40 Increment 2: C151 Rule Transcription

Status: TRANSCRIBED, verification against sample XML PENDING per rule.
Source document: `2.03 - C151 - User Interface Design.pdf` (8 pages), read in full 2026-08-09.
Sample XML: `5.07 - C151 - Max Fields.xml`, `5.08 - C151 - Min Fields.xml`.
Companion: shared sections mirror `2026-08-09-prompt-40-C050E-rules-transcription.md`.
House rule: no em dashes or en dashes.

C151 (Physician's Progress Report) has 136 elements, 39 always required, 27 return to work fields, and
about 52 numbered rules. It shares most sections with C050E. Its two differentiators are the injury
"diagnosis changed" show hide and the opioid and Medication Management module in Treatment Plan.

## ui_mapping bracket shift confirmed (engine spec Section 3.2)

The bracket identifiers on C151 differ from C050E for the same meaning, verified directly on this
document (Injury Details section, page 2 to 3):
- Part of body: C10 (was C8 on C050E)
- Side of body: C11 (was C9)
- Nature of injury: C12 (was C10)
- Dominant hand: C14 (was C12)
- Prior conditions yes or no: C15 (was C13)
- Treatment plan: D28 (was D5); Case conference with case manager: D33 (was D10)

Therefore lookups are keyed on `(form_definition_id, element_seq, element_name)`, never on the bracket
identifier. A rule keyed on C8 would hit part of body on a C050E and a different element on a C151.

## Sections identical to C050E (see the C050E transcription for full rows)

- Participant Details (page 1): BR5 (Alberta PHN one of two required, PHN polarity inversion source).
- Accident Details (page 2): BR1 (Date of Injury range). Note: C151 has no SR4 develop over time
  warning in this section (it is present on C050E and C050S but absent here).
- Return to Work Details (pages 6 to 7): BR2, BR8, BR9, and SR1, SR2, SR3 (the same gate chain as
  C050E, with the same field references), plus SR5 (Sitting), SR6 (Standing), SR7 (Walking), SR17
  (Lifting), SR21 (Driving), each Limited to enabling its hours or Max of. This is the Basic (non OIS)
  RTW block, 27 fields, matching C050E exactly.
- Other Information, Attachments (page 7): BR6, BR7, SR9, SR11, SR12.
- Invoice Details (page 8): BR1, BR3, BR6, BR18, SR6, SR7, SR11, SR13, SR17.

## Injury Details (pages 2 to 3). Differs from C050E by BR4 and SR2.

| code | ord | type | trigger element | condition | affected | VAL | ver |
|---|---|---|---|---|---|---|---|
| BR1 | 2 | business | Date of Examination | <= current and >= Date of Injury | Date of Examination | | pending |
| BR2 | 1 | business | Part of body, Nature of injury | valid combination (POB-NOI Validations) | those | VAL-X03 | pending |
| BR3 | 1 | business | Part/Side/Nature (tabular) | each combination unique | injury table | VAL-X04 | pending |
| BR4 | 1 | business | Diagnostic codes | must be valid diagnostic codes | diagnostic codes | | pending |
| BR5 | 2 | business | Part/Side (tabular) | valid combination (cites nonexistent SOB POB Relations tab; use Side of Body Required flag) | Side of body | VAL-X02 | pending |
| BR6 | 1 | business | Diagnostic code 2, 3 | code 2 requires 1; code 3 requires 1 and 2 | those | VAL-X05 | pending |
| BR8 | 1 | business | injury table | at least one valid row | injury table | | pending |
| BR9 | 1 | business | injury row | if any of Part/Side/Nature populated the others must be | injury row | VAL-X06 | pending |
| SR1 | 1 | show_hide | Are you aware of any prior conditions in the same anatomical area | = Yes | Please provide diagnosis and treatment(s) for prior conditions | | pending |
| SR2 | 1 | show_hide | Has the diagnosis changed | Yes -> enable Describe what has changed and include current diagnosis. No -> hide it | Describe what has changed and include current diagnosis | | pending |
| SR3 | 1 | show_hide | Part of body | in {Arm, Elbow, Finger, Hand, Shoulder, Wrist, Thumb, Neck} | Dominant hand | VAL-X07 | pending |
| SR4 | 1 | show_hide | injury table row count | = 5 rows enabled | If more than 5 parts of body, please describe any additional injuries | VAL-X08 | pending |
| IBR1 | 1 | business | prior conditions | blank or No -> dependent blank; Yes -> dependent not blank | Please provide diagnosis and treatment(s) for prior conditions | | pending |
| IBR2 | 1 | business | Has the diagnosis changed | blank or No -> dependent blank; Yes -> dependent not blank | Describe what has changed and include current diagnosis | | pending |

Note: on C050E, "diagnosis changed" existed only as IBR2. On C151 it is BOTH an SR2 show_hide and an
IBR2 conditional requirement (progress report specific, since the diagnosis can change between visits).

## Treatment Plan Details (pages 4 to 5). The C151 differentiator: the opioid and Medication Management module.

Standard consultation and prescription rules (same as C050E):

| code | ord | type | trigger element | condition | affected | VAL | ver |
|---|---|---|---|---|---|---|---|
| BR1 | 3 | business | Consultations Type | = Other | Details (same row) required | | pending |
| BR2 | 2 | business | Prescription name, Strength, Daily intake (row) | any one populated | other two required | | pending |
| BR3 | 2 | business | Category, Type, Details (row) | Category or Type populated -> other required; Details -> Category and Type required | those | | pending |
| SR1 | 2 | show_hide | Were narcotics/opioids prescribed on this visit | = Yes | Prescription name, Strength, Daily intake (tab/ml) | VAL-X09 | pending |
| SR5 | 1 | business | Consultations Type | validate expedite eligibility (Category Type Expedite Codes) | expedite flag | VAL-X10 | pending |
| SR7 | 1 | help_text | expedite checkbox | checked | grid message (expedited service will be reviewed) | | pending |
| SR13 | 1 | code_list_switch | Category | options from Category Type Expedite Codes | Category options | VAL-X11 | pending |
| SR17 | 1 | help_text | Category | = Investigation | grid message (attach diagnostic requisition) | | pending |

The opioid / Medication Management module (uses `Yes No Responses`, engine spec Section 2.1):

| code | ord | type | trigger element | condition and effect | clears | ver |
|---|---|---|---|---|---|---|
| SR2 | 3 | show_hide | Has the patient undergone surgery in the past 60 days; Is the patient being treated for malignant pain; Has WCB advised you not to submit a Medication Management Report | if the response is No to ALL THREE, enable the narcotics/opioids fields D8 through D27 | true | pending |
| SR3 | 2 | show_hide | Is the current opioid therapy resulting in a reduction in pain levels | Yes -> enable Describe the reduction. No -> hide it | true | pending |
| SR12 | 1 | show_hide | Were narcotics/opioids prescribed on this visit, Date of Examination, Date of Injury | if opioids = Yes AND Date of Examination >= 60 days after Date of Injury, enable Has the patient undergone surgery in the past 60 days, Is the patient being treated for malignant pain, Has WCB advised you not to submit a Medication Management Report | true | pending |

Note the two step gate: SR12 (opioids Yes and 60 plus days since injury) reveals the three screening
questions; SR2 (all three answered No) then reveals the D8 to D27 opioid detail block; SR3 gates the
reduction free text. This is the entire opioid module, and it is why `Yes No Responses` (referenced 131
times across the forms) must be loaded, not curated out (loader trap and Section 2.1).

## Verification (definition of done, not yet met)

`verified_against_sample_xml` stays false per rule until confirmed against `5.08 - C151 - Min
Fields.xml` and `5.07 - C151 - Max Fields.xml`. The opioid module gating (SR2, SR3, SR12) and the RTW
gate chain (SR1, SR2, SR3) are the two chains to assert for presence and absence.

## Estimate update

C151 ~ 52 rules. Three of eight forms transcribed (C050E ~48, C050S ~71, C151 ~52). C151S remains (it
carries the SR30 and SR28 no change chain the engine spec Section 4.4 corrects), then the four invoice
forms. Running total consistent with ~300 to 380 across all eight.
