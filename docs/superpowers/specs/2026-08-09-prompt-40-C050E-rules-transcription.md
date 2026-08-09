# Prompt 40 Increment 2: C050E Rule Transcription

Status: TRANSCRIBED from the board document, verification against sample XML PENDING per rule (that is
the definition of done, Prompt 40 Section 4.1 and criterion 17). This is the human auditable record
that maps one to one onto clinical.form_rule.
Source document: `2.01 - C050E - User Interface Design.pdf` (7 pages), read in full 2026-08-09.
Sample XML for verification: `5.03 - C050E - Min Fields.xml`, `5.01 - C050E - Max Fields with
Attachment.xml`, `5.02 - C050E - Max Fields without Attachments.xml`.
House rule: no em dashes or en dashes.

## Estimate, grounded in one full document

C050E carries about 48 numbered rules across 7 section pages: roughly 20 System Rules (SR), 2 Interface
Business Rules (IBR), and 26 Business Rules (BR), plus Help Text (HT) which is not a form_rule. Of
these, about 22 are show_hide, code_list_switch, or conditional requirement rules (the ones form_rule
exists for); the rest are field level range and date checks that live in the validation layer
(Sections 5 and 6 of the engine spec). C050E is the smallest of the four clinical forms, so the four
clinical forms plus four invoice forms total on the order of 300 to 380 rules. This matches the engine
spec's "roughly forty prose rules per form across eight PDFs".

## The code reuse hazard, observed directly on C050E

The board reuses rule codes across sections with unrelated meanings. Verified on this one form:
- `BR1` appears on page 2 (Date of Injury range), page 2 to 3 (Date of Examination range), and page 7
  (Modifier field dependency). Three unrelated BR1 rules.
- `SR1` appears on page 2 to 3 (prior conditions enable), page 3 to 4 (opioid fields enable), and page
  5 to 6 (miss work gate). Three unrelated SR1 rules.
- `BR5` appears on page 1 (Alberta PHN required one of two) and page 3 (POB and SOB combination).
- `SR4`, `SR5`, `SR7`, `SR17` each recur across sections.

Therefore the form_rule key is `(form_definition_id, source_document, source_page, rule_code, ordinal)`
and `rule_code` alone is never a key. This is Prompt 40 Section 4.2, seen in the wild.

## Transcription. One row per rule. Column order matches clinical.form_rule.

Legend: type = show_hide | business | code_list_switch | help_text. clears = clears_on_hide.
VAL = the named cross field rule it realizes, if any. ver = verified_against_sample_xml.

### Section: Participant Details (page 1)

| code | ord | type | trigger element | condition | affected elements | clears | VAL | ver |
|---|---|---|---|---|---|---|---|---|
| BR5 | 1 | business | Alberta PHN, Patient does not have an Alberta PHN | exactly one of the two is provided | Alberta PHN | n/a | VAL-X01 | pending |

Note: BR5 page 1 is the source of the PHN polarity inversion (engine spec Section 6.3). The element
"Patient does not have an Alberta PHN" Yes means NO PHN; it maps to the inverse XPath
`Claimant/HavePersonalHealthNumber`. Invert deliberately at emission.

### Section: Accident Details (page 2)

| code | ord | type | trigger element | condition | affected elements | clears | VAL | ver |
|---|---|---|---|---|---|---|---|---|
| BR1 | 1 | business | Date of Injury | Date of Injury <= current date and >= patient date of birth | Date of Injury | n/a | | pending |
| SR4 | 1 | business | Did the injury/condition develop over time | = Yes | (warning: date of injury should equal date of exam) | n/a | | pending |

### Section: Injury Details (pages 2 to 3)

| code | ord | type | trigger element | condition | affected elements | clears | VAL | ver |
|---|---|---|---|---|---|---|---|---|
| BR1 | 2 | business | Date of Examination | Date of Examination <= current date and >= Date of Injury | Date of Examination | n/a | | pending |
| BR2 | 1 | business | Part of body, Nature of injury | must be a valid combination (POB-NOI Validations) | Part of body, Nature of injury | n/a | VAL-X03 | pending |
| BR3 | 1 | business | Part of body, Side of body, Nature of injury (tabular) | each combination in the table must be unique | injury table | n/a | VAL-X04 | pending |
| BR5 | 2 | business | Part of body, Side of body (tabular) | must be a valid combination (see open item: SOB POB Relations tab does not exist, use Side of Body Required flag) | Side of body | n/a | VAL-X02 | pending |
| BR6 | 1 | business | Diagnostic code 2, Diagnostic code 3 | code 2 requires code 1; code 3 requires codes 1 and 2 | Diagnostic code 2, Diagnostic code 3 | n/a | VAL-X05 | pending |
| BR8 | 1 | business | injury table | at least one valid row in Part/Side/Nature | injury table | n/a | | pending |
| BR9 | 1 | business | Part of body, Side of body, Nature of injury (row) | if any one populated the others must be (BR5 dictates whether Side is required) | injury row | n/a | VAL-X06 | pending |
| SR1 | 1 | show_hide | Are you aware of any prior conditions in the same anatomical area | = Yes | Please provide diagnosis and treatment(s) for prior conditions | true | | pending |
| SR3 | 1 | show_hide | Part of body | in {Arm, Elbow, Finger, Hand, Shoulder, Wrist, Thumb, Neck} | Dominant hand | true | VAL-X07 | pending |
| SR4 | 2 | show_hide | injury table row count | = 5 rows enabled | If more than 5 parts of body, please describe any additional injuries | true | VAL-X08 | pending |
| IBR1 | 1 | business | Are you aware of any prior conditions in the same anatomical area | blank or No -> dependent must be blank; Yes -> dependent must not be blank | Please provide diagnosis and treatment(s) for prior conditions | true | | pending |
| IBR2 | 1 | business | Has the diagnosis changed | blank or No -> dependent must be blank; Yes -> dependent must not be blank | Describe what has changed and include current diagnosis | true | | pending |

### Section: Treatment Plan Details (pages 3 to 4)

| code | ord | type | trigger element | condition | affected elements | clears | VAL | ver |
|---|---|---|---|---|---|---|---|---|
| BR1 | 3 | business | Consultations/Referrals/Investigations Type | Type = Other | Details (same row) becomes required | n/a | | pending |
| BR2 | 2 | business | Prescription name, Strength, Daily intake (row) | any one populated | the other two become required | n/a | | pending |
| BR3 | 2 | business | Category, Type, Details (row) | Category or Type populated -> other required; Details populated -> Category and Type required | Category, Type | n/a | | pending |
| SR1 | 2 | show_hide | Were narcotics/opioids prescribed on this visit | = Yes | Prescription name, Strength, Daily intake (tab/ml) | true | VAL-X09 | pending |
| SR5 | 1 | business | Consultations/Referrals/Investigations Type | on choose, validate expedite eligibility (Category Type Expedite Codes) | expedite flag | n/a | VAL-X10 | pending |
| SR7 | 1 | help_text | expedite checkbox | service checked to expedite | bottom of grid message: "Your request for expedited service will be reviewed by WCB and your patient will be advised accordingly." | n/a | | pending |
| SR13 | 1 | code_list_switch | Category | dropdown options from Category Type Expedite Codes | Category options | n/a | VAL-X11 | pending |
| SR17 | 1 | help_text | Category | = Investigation | grid message: "Please attach the appropriate diagnostic requisition form when requesting an Investigation." | n/a | | pending |

### Section: Return to Work Details (pages 5 to 6). The primary show/hide block.

| code | ord | type | trigger element | condition | affected elements | clears | VAL | ver |
|---|---|---|---|---|---|---|---|---|
| BR2 | 3 | business | Estimated date you expect the patient will be able to perform pre-accident level work | >= Date of Examination | that date | n/a | | pending |
| BR8 | 2 | business | Date the patient returned to work | > Date of Injury | that date | n/a | | pending |
| BR9 | 2 | business | Number of hours patient is capable of working per day | > 0 and <= 24 | that field | n/a | VAL-X12 | pending |
| SR1 | 3 | show_hide | Will/has the patient miss(ed) work beyond the date of accident | Yes -> enable Has the patient returned to work, hide Modified duties and Modified hours. No -> enable Modified duties and Modified hours, clear and hide Has the patient returned to work | Has the patient returned to work, Modified duties, Modified hours | true | | pending |
| SR2 | 1 | show_hide | Has the patient returned to work | Yes -> enable Date returned, Modified duties, Modified hours; hide Current Capabilities, Other reasons why the patient cannot work, Other restrictions or additional comments, Estimated date pre-accident. No -> the inverse | Date the patient returned to work, Modified duties, Modified hours, Current Capabilities, Other reasons why the patient cannot work, Other restrictions or additional comments, Estimated date you expect the patient will be able to perform pre-accident work | true | | pending |
| SR3 | 2 | show_hide | Modified duties, Modified hours | both No -> enable Other restrictions, clear and hide Number of hours, Current Capabilities, Other reasons, Estimated date. both Yes -> enable all five. duties No hours Yes, and duties Yes hours No -> the two mixed branches (see board text) | Number of hours patient is capable of working per day, Current Capabilities, Other reasons why the patient cannot work, Other restrictions or additional comments, Estimated date pre-accident | true | | pending |
| SR5 | 2 | show_hide | Sitting | = Limited to | Hours (approx.) (sitting) | true | | pending |
| SR6 | 1 | show_hide | Standing | = Limited to | Hours (approx.) (standing) | true | | pending |
| SR7 | 2 | show_hide | Walking | = Limited to | Hours (approx.) (walking) | true | | pending |
| SR17 | 2 | show_hide | Lifting | = Limited to | Max of | true | | pending |
| SR21 | 1 | show_hide | Driving | = Limited to | Hours (approx.) (driving) | true | | pending |

Note: SR3 is the rule that actually collapses the capability block (engine spec Section 4.4). SR1, SR2,
SR3 form the RTW gate chain. Verify the whole chain against `5.03 - C050E - Min Fields.xml` (RTW block
minimal) and `5.01`/`5.02` (RTW block maximal).

### Section: Other Information, Attachments (pages 6 to 7)

| code | ord | type | trigger element | condition | affected elements | clears | VAL | ver |
|---|---|---|---|---|---|---|---|---|
| BR6 | 2 | business | Attachment Type | populated | File becomes required | n/a | | pending |
| BR7 | 1 | business | Attachment Type | = Other | Description becomes required | n/a | | pending |
| SR9 | 1 | business | attachments | max count per form (Form ID Maximum Attachments) | attachment count | n/a | | pending |
| SR11 | 1 | business | attachments | max size (Form ID To Attachment Codes) | attachment size | n/a | | pending |
| SR12 | 1 | business | attachments | allowed types per report (Form ID To Attachment Codes) | attachment type | n/a | | pending |

### Section: Invoice Details (page 7)

| code | ord | type | trigger element | condition | affected elements | clears | VAL | ver |
|---|---|---|---|---|---|---|---|---|
| BR1 | 3 | business | Modifier field 2, Modifier field 3 | field 2 requires field 1; field 3 requires 1 and 2 | Modifier fields | n/a | | pending |
| BR3 | 3 | business | Calls | numeric, > 0 and <= 9999.99 | Calls | n/a | | pending |
| BR6 | 3 | business | Encounters | > 0 and <= 9 | Encounters | n/a | | pending |
| BR18 | 1 | business | invoice line | if visible, all required line fields must be populated | invoice line | n/a | | pending |
| SR6 | 3 | business | Calls | empty on submit -> value 1 (invoice default, not a clinical value) | Calls | n/a | | pending |
| SR7 | 3 | business | Encounters | empty on submit -> value 1 (invoice default, not a clinical value) | Encounters | n/a | | pending |
| SR11 | 2 | business | Practitioner Role, Skill code | if a role to skill relationship exists, default Skill code to it | Skill code | n/a | | pending |
| SR13 | 2 | business | Submit Report | copy Facility type, Date of exam (From and To), Skill code to each completed invoice line | invoice line tabular fields | n/a | | pending |
| SR17 | 2 | help_text | invoice section | default | 3 invoice lines displayed by default | n/a | | pending |

## Open items surfaced by this document (Prompt 40 Section 9)

- BR2 page 2 to 3 cites a "NOI POB Relations tab" and BR5 page 3 cites a "SOB POB Relations tab". The
  workbook has `POB-NOI Validations` (for BR2) but no "SOB POB Relations" worksheet. Open item 3: use
  the `Side of Body Required` flag on `Part Of Body Codes` for BR5 and flag the discrepancy. Do not
  invent the worksheet.

## Definition of done for these rows (not yet met)

Each row's `verified_against_sample_xml` stays false until the rule is confirmed against the board's
`5.xx` sample XML. Next step: parse `5.03 - C050E - Min Fields.xml` and `5.01`/`5.02` and assert that
the SR1, SR2, SR3 RTW chain and the SR1 opioid gate produce exactly the elements those samples contain
and omit exactly the ones they omit. Then set ver true per rule.

## Remaining forms

C050S, C151, C151S each carry a comparable or larger rule set (C050S is the largest at 171 elements and
87 RTW fields; its SR2 and SR3 also contain the two board self contradictions, engine spec Section 4.5).
C568, C568A, C569, C570 are invoice forms with fewer show/hide rules. Transcribe each the same way,
one document at a time, verifying against its own `5.xx` sample XML.
