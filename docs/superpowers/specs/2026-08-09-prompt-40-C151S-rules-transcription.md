# Prompt 40 Increment 2: C151S Rule Transcription

Status: TRANSCRIBED, verification against sample XML PENDING per rule.
Source document: `2.04 - C151S - User Interface Design.pdf` (8 pages), read in full 2026-08-09.
Sample XML: `5.10 - C151S - Min Fields.xml` (cited in engine acceptance criterion 9),
`5.09 - C151S - Max Fields.xml`.
Companions: OIS RTW block mirrors C050S; injury and treatment mirror C151.
House rule: no em dashes or en dashes.

C151S (OIS Physician's Progress Report) has 153 elements, 39 always required, 67 return to work
fields, about 68 numbered rules. Its uniquely important content is the OIS Return to Work no change
chain (SR30, SR28, E1), which an earlier Continuum specification transcribed WRONG. This document
records the correct behaviour, verbatim from the board.

## The no change chain, transcribed verbatim (engine spec Section 4.4)

An earlier Continuum spec claimed answering "no change" on E1 collapses the entire 66 field return to
work block in two interactions. That is FALSE. Verbatim from `2.04`:

> SR30 - For the field Has the patient's Return to Work status changed, selecting either the Yes or
> the No option will enable the field Will/has the patient miss(ed) work beyond the date of accident?

So E1 answered EITHER way enables the miss work field. It never short circuits to signature.

> SR28 - When it has been indicated that a patient's status has not changed:
> all the OIS specific questions are hidden; Estimated date you expect the patient will be able to
> perform pre-accident work will be shown; Reviewed work capabilities with patient will be hidden;
> Patient was assessed and now deemed will be hidden; OIS follow up visit required will be hidden.
> If they indicate that the patient's status has changed: all the OIS specific questions are shown;
> Estimated date pre-accident work will be hidden; Reviewed work capabilities shown; Patient was
> assessed shown; OIS follow up visit required shown.

So SR28 toggles about five OIS specific fields and shows or hides the pre-accident date. It hides FIVE
fields, not sixty six.

E1 is ALSO a code_list_switch, sourced from the workbook (not the UI design PDF): elements E14, E16,
E18, E20, E22 carry `If "Has the patient's status changed" = 'N' [See Basic Work Restriction Codes]`.
A hidden field would not carry a code list for the hidden branch. So when E1 = No (not changed), the
capability axes switch from Extended to Basic Work Restriction Codes; the fields are NOT hidden.

What actually collapses the capability block is SR3 (modified duties and modified hours both No), the
same as every other clinical form.

| code | ord | type | trigger element | condition and effect | switches_code_list_to | clears | ver |
|---|---|---|---|---|---|---|---|
| SR30 | 1 | show_hide | Has the patient's Return to Work status changed | Yes or No -> enable Will/has the patient miss(ed) work beyond the date of accident | | false | pending |
| SR28 | 1 | show_hide | Has the patient's Return to Work status changed (E1) | not changed -> hide the OIS specific questions, Reviewed work capabilities, Patient was assessed and now deemed, OIS follow up visit required; show Estimated date pre-accident. changed -> the inverse | | true | pending |
| E1 | 1 | code_list_switch | Has the patient's Return to Work status changed (E1) | = No (N) -> the capability axes E14, E16, E18, E20, E22 use Basic Work Restriction Codes instead of Extended. Does NOT hide the fields | Basic Work Restriction Codes | false | pending |
| SR1 | 1 | show_hide | Will/has the patient miss(ed) work beyond the date of accident | Yes -> enable Has the patient returned to work, hide Modified duties and Modified hours. No -> enable Modified duties and Modified hours, clear and hide Has the patient returned to work | | true | pending |
| SR2 | 1 | show_hide | Has the patient returned to work | Yes -> enable Date returned, Modified duties, Modified hours; hide Current Capabilities, Other reasons, Other restrictions, Estimated date. No -> the inverse | | true | pending |
| SR3 | 1 | show_hide | Modified duties, Modified hours | both No -> collapse the capability block (enable Other restrictions; clear and hide Number of hours, Current Capabilities, Other reasons, Estimated date). both Yes and the two mixed branches per the board text | | true | pending |

Build the full chain SR30, SR1, SR2, SR3, SR28, plus the E1 code_list_switch, and verify against
`5.10 - C151S - Min Fields.xml`, asserting the Basic code list appears on E14, E16, E18, E20, E22 in
the not changed scenario (engine acceptance criteria 9 and 10). The engine must support both the
show_hide and code_list_switch rule types (engine spec form_rule.rule_type and switches_code_list_to).

## OIS per axis, grasping, lifting, environment, disposition (same shape as C050S)

Verbatim on this document, identical structure to C050S:
- SR5 Sitting, SR6 Standing, SR7 Walking: Limited to -> hours.
- SR8 Bending, SR9 Twisting, SR10 Kneeling/Squatting, SR11 Climbing, SR12 Pushing/Pulling: Limited to
  -> hours; Able or Unable -> hide and clear the hours.
- SR13, SR14 Grasping right (Unable -> prolonged, repetitive, vibration, specify; specify checkbox ->
  text box); SR15, SR16 Grasping left (same). Twelve grasping fields.
- SR18, SR19, SR20 Lifting floor to waist, waist to shoulder, above shoulder: Limited to -> Max of;
  Able or Unable -> hide and clear. Three lifting planes.
- SR21 Driving: Limited to -> hours.
- SR22 Environment: Restricted from -> enable seven booleans; No restrictions -> hide and clear.
- SR23 patient assessed and now deemed: Not fit for any work today -> Estimated return date and Level;
  Fit with limitations -> hide and clear.
- SR24 OIS follow up visit required: Yes -> Date of follow up visit.
- SR25 Modified work is required: Yes -> From and To. SR26 modified work is available: Yes -> From and
  To.
- SR27 Patient has family physician: Yes -> enable the nine physician fields; No -> hide and clear.

### RTW business rules (dates and environment)

BR2 (Estimated date pre-accident >= exam), BR3 (Date of follow up visit >= exam), BR8 (Date returned
to work > injury), BR9 (Number of hours > 0 and <= 24, VAL-X12), BR11 (Environment Restricted from
requires at least one of the seven booleans).

## Sections that mirror C151 (see the C151 transcription for full rows)

- Participant Details: BR5 (Worker 36 one of two required, PHN inversion).
- Accident Details: BR1 (Date of Injury range).
- Injury Details: BR1, BR2, BR3, BR4, BR5, BR6, BR8, BR9, SR1 (prior conditions), SR2 (diagnosis
  changed show_hide), SR3 (dominant hand, VAL-X07), SR4 (five rows, VAL-X08), IBR1, IBR2. Same
  ui_mapping bracket shift as C151 (part of body C10, etc.).
- Treatment Plan Details: the opioid and Medication Management module (SR1 opioid fields, SR2 the
  D8 to D27 block gated by the three screening questions, SR3 reduction field, SR12 the screening
  question gate at 60 plus days), plus SR5, SR7, SR13, SR17 and BR1, BR2, BR3. Same as C151.
- Other Information, Attachments: BR6, BR7, SR9, SR11, SR12.
- Invoice Details: BR1, BR3, BR6, BR18, SR6, SR7, SR11, SR13, SR17.

## Open item (Prompt 40 Section 9.6)

Is the C151S for OIS providers or emergency physicians? The board's description says emergency
physicians; the contract matrix assigns it solely to contract 000053 OIS. Build to the contract
matrix (the machine readable one) and report. Not resolved here.

## Verification (definition of done, not yet met)

`verified_against_sample_xml` stays false per rule until confirmed against `5.10 - C151S - Min
Fields.xml` and `5.09 - C151S - Max Fields.xml`. The two chains to assert are the no change chain
(SR30, SR28, E1 code list switch with Basic codes on E14, E16, E18, E20, E22) and the capability
collapse (SR3), plus the opioid module.

## Estimate update

C151S ~ 68 rules. FOUR of eight forms transcribed (C050E ~48, C050S ~71, C151 ~52, C151S ~68). The
four clinical forms are done. The four invoice forms remain (C568, C568A, C569, C570), which are
lighter, mostly BR field validations and SR defaults with few show/hide rules. Running total
consistent with ~300 to 380 across all eight.
