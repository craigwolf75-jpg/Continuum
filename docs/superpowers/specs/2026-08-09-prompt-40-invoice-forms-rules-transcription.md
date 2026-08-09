# Prompt 40 Increment 2: Invoice Forms Rule Transcription (C568, C568A, C569, C570)

Status: TRANSCRIBED, verification against sample XML PENDING per rule.
Source documents (read in full 2026-08-09):
- `2.05 - C568 - User Interface Design.pdf` (4 pages)
- `2.06 - C568A - User Interface Design.pdf` (5 pages)
- `2.07 - C569 - User Interface Design.pdf` (3 pages)
- `2.08 - C570 - User Interface Design.pdf` (4 pages)
Sample XML: `5.11 - C568.xml`, `5.12 - C568 - Attachment.xml`, `5.13 - C568A - Attached Text.xml`,
`5.14 - C568A - Attachment.xml`, `5.15 - C569.xml`, `5.16 - C570.xml`.
House rule: no em dashes or en dashes.

The four invoice forms are light on show/hide logic. They are dominated by field validation business
rules and by system rules that default values or perform fee calculations, with a small number of true
show/hide rules. This completes increment 2: all eight forms transcribed.

## Shared header sections (all four forms)

- Participant Details: BR5 (Alberta PHN, one of the two required, PHN polarity inversion source).
- Accident Details: BR1 (Date of Injury <= current and >= date of birth). C568A also has HT1.

## C568 (Medical Invoice, 61 elements, 3 attachments)

Injury Details: BR2 (POB-NOI, VAL-X03), BR3 (unique combos, VAL-X04), BR5 (POB-SOB, nonexistent SOB POB
Relations tab), BR8 (at least one row), BR9 (row completeness, VAL-X06), SR4 (five rows enable
additional injuries, VAL-X08).
Other Information, Attachments: BR6, BR7, SR9, SR11, SR12 (attachment count, size, types).

Invoice Details, the substance of this form:

| code | type | rule |
|---|---|---|
| BR1 | business | Modifier 2 requires 1; Modifier 3 requires 1 and 2 |
| BR2 | business | valid health service codes and modifiers (warning only, may still submit) |
| BR3 | business | Calls numeric, > 0 and <= 9999.99 |
| BR4 | business | Date of service From <= current, >= date of accident, <= Date of service To |
| BR6 | business | Encounters > 0 and <= 9 |
| BR7 | business | Fees submitted > 0 and <= 9999.99 |
| BR10 | business | Total Amount Billed <= 99999.99 |
| BR12 | business | Diagnostic code 2 requires 1; code 3 requires 1 and 2 (VAL-X05) |
| BR14 | business | FFS grid: no minimum line if at least one Medical Supplies line populated; per row required fields |
| BR18 | business | if an invoice line is visible, its required fields must be populated |
| BR20 | business | Billing number validated against Contract ID |
| SR1 | business | on Calculate/Save/Submit, compute Fees submitted, Invoice amount billed, Medical supplies amount billed, Total amount billed |
| SR6 | business | Calls empty on submit -> default 1 |
| SR7 | business | Encounters empty on submit -> default 1 |
| SR8 | help_text | if Calls and/or Modifier entered, warning that Fees submitted will not be accurate |
| SR9 | show_hide | if a Contract ID to Health service code relationship exists, show Health service code as a dropdown; else as a text box (validated by BR2) |
| SR14 | business | on Submit, copy Date of service From to Date of service To if To is blank |
| SR16 | show_hide | FFS grid: if Health service code is a dropdown (SR9), disable Fees submitted; if a text box, enable it. Medical Supplies grid: Fees submitted always enabled |

## C568A (Medical Consultation Report, 69 elements, 3 attachments)

Same as C568 for Participant, Accident, Injury (plus BR4 valid diagnostic codes), Other, and the
Invoice Details grid (BR1, BR2, BR3, BR4, BR6, BR7, BR10, BR12, BR14, BR18, BR20; SR1, SR6, SR7, SR8,
SR9, SR14, SR16). Differences:

| code | type | rule |
|---|---|---|
| SR1 (treatment) | show_hide | Prescription name, Strength, Daily intake hidden until Were narcotics/opioids prescribed = Yes (VAL-X09) |
| BR2 (treatment) | business | any of Prescription name, Strength, Daily intake populated -> other two required |
| SR8 (treatment) | show_hide | Consultation letter text area hidden by default; if Please select the format of consultation letter = Plain text, enable it (uses Consultation Letter Formats code list) |
| SR17 (invoice) | help_text | 5 Fee for Service lines and 1 Medical Supplies line displayed by default |

SR8 (consultation letter format) is the one genuinely new show/hide rule the invoice family adds, and
it is why the `Consultation Letter Formats` worksheet (sheet 37) is loaded.

## C569 (Medical Supplies Invoice, 37 elements, ZERO attachments)

No Injury Details, no Treatment Plan, and NO Attachments section at all. The attachment control is
ABSENT, not present and empty (engine spec Section 3.1). Confirmed: the C569 document has no attachment
fields and no SR9/SR11/SR12 attachment rules.

| code | type | rule |
|---|---|---|
| BR8 | business | Date of service >= date of accident and <= current date |
| BR10 | business | Total Amount Billed <= 99999.99 |
| BR15 | business | Non-integrated Medical Supplies grid: minimum one invoice line required; if any of Date of service, Quantity, Type and description, or Amount is populated, the other three are required |
| SR2 | business | on Calculate/Save/Submit, Total amount billed = sum of Amount across invoice lines |
| SR11 | business | Skill code defaults from the Practitioner Role to Skill relationship, else Please choose |

## C570 (Medical Invoice Correction, 66 elements, ZERO attachments)

The correction form, with a WAS section and a SHOULD BE section. No Attachments section (zero
attachments confirmed).

| code | type | rule |
|---|---|---|
| BR2 | business | valid health service codes and modifiers (warning only) |
| BR4 | business | Date of service From <= current, >= date of accident, <= Date of service To |
| BR5 | business | Diagnostic code 1, 2, 3 may not be duplicates |
| BR6 | business | Encounters > 0 and <= 9 |
| BR7 | business | Fees submitted > 0 and <= 9999.99 |
| BR12 | business | Diagnostic code 2 requires 1; code 3 requires 1 and 2 (VAL-X05) |
| BR21 | business | minimum one invoice line; WAS Date of service From required per populated WAS row; SHOULD BE Date of service From required per populated SHOULD BE row |
| BR23 | business | each invoice line requires at least one of the WAS Date of service or the SHOULD BE Date of service |
| SR6 | business | Calls empty on submit -> default 1 |
| SR7 | business | Encounters empty on submit -> default 1 |
| SR11 | business | Skill code defaults from the Practitioner Role to Skill relationship, else Please choose |

## Open items and loader facts surfaced (Prompt 40 Section 9 and Section 2.1)

- C570 element 32.12 references a `Location Codes` code list, which is NOT one of the 43 worksheets.
  Open item 9.2: assume `Facility Types`, flag it, do not proceed silently. (The reference is in the
  mapping workbook, not the UI design PDF; carry it as a loader concern.)
- C568 element `35.06` (loader trap 4) is a mapping workbook fact, handled in the loader spec.
- Invoice line occurrence range is 1 to 25 (engine spec Section 3.3), a workbook fact.
- C569 and C570 confirmed to carry NO attachment section, matching `Form ID Maximum Attachments` and
  `Form ID To Attachment Codes` omitting them (engine spec Section 3.1).

## Verification (definition of done, not yet met)

`verified_against_sample_xml` stays false per rule until confirmed against `5.11` (C568), `5.13`/`5.14`
(C568A), `5.15` (C569), `5.16` (C570). The show/hide rules to assert are SR9/SR16 (health service code
display and Fees enablement) on C568 and C568A, and SR8 (consultation letter) on C568A.

## Increment 2 complete: all eight forms transcribed

C050E ~48, C050S ~71, C151 ~52, C151S ~68, plus the four invoice forms (C568, C568A, C569, C570). The
running total sits in the ~300 plus rule range the engine spec predicted. The remaining work is
increment 2's definition of done (verify every transcribed rule against its `5.xx` sample XML and set
`verified_against_sample_xml` true) and increment 3 (wire the three validation passes and VAL-X01 to
X12, including the PHN inversion).
