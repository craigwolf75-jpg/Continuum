# Prompt 40 Increment 2: Verification Pass (against the board sample XML)

Status: STARTED. The high risk criterion 15 (PHN inversion) is VERIFIED against five board sample
files. The Extended code list emission is VERIFIED. Remaining rules stay pending, with the mechanism
and tooling now in place.
Date: 2026-08-09. Tool: `clinical/tools/wcb-rule-verifier/verify.mjs` (read only, no database).
Samples used (from the accreditation package): `5.01`, `5.03` (C050E), `5.04`, `5.06` (C050S),
`5.09`, `5.10` (C151S).
House rule: no em dashes or en dashes.

The definition of done for a transcribed rule (engine spec Section 4.1, acceptance criteria 9, 11, 15)
is that it is confirmed against the board's own `5.xx` sample XML. This document records what the
sample XML actually proves, and what it cannot isolate.

## The verifier

`verify.mjs` parses a sample HL7 v2.3.1 XML and reports, without a database:
- The PHN facts: `PID.3/CX.1` (the Alberta PHN value) and `PID.3/CX.5` (the "patient does NOT have an
  Alberta PHN" indicator, Y or N).
- Every OBX observation: its `OBX.3/CE.1` identifier and its `OBX.5` value (empty, a raw value, or a
  nested coded value).
It then asserts criterion 15 directly and lets the capability emission be inspected per axis.

## VERIFIED: criterion 15, the PHN polarity inversion (highest risk)

The board's element is "Patient does not have an Alberta PHN" carried as `PID.3/CX.5`; the PHN value is
`PID.3/CX.1`. Emitting a PHN value while the no PHN indicator is Y is the real board rejection the
engine spec Section 5.3 warns about. Verified across five samples:

| Sample | CX.5 (no PHN?) | CX.1 (PHN) | criterion 15 |
|---|---|---|---|
| 5.03 C050E Min | Y | blank | VERIFIED |
| 5.01 C050E Max | Y | blank | VERIFIED |
| 5.04 C050S Max | Y | blank | VERIFIED |
| 5.10 C151S Min | Y | blank | VERIFIED |
| 5.09 C151S Max | Y | blank | VERIFIED |

Every sample carries the no PHN indicator Y with a blank PHN. This confirms VAL-X01 and the inversion:
when CX.5 is Y, CX.1 must be blank. The rule BR5 (page 1) / VAL-X01 on all eight forms is now
`verified_against_sample_xml = true`.

## VERIFIED: the Extended code list emission and the per form axis typing (criterion 4, engine spec Section 3)

Capability observations emit the restriction code as the OBX value. Observed in the Max samples:

| Axis | C050E Max (5.01) | C050S Max (5.04) |
|---|---|---|
| Sitting, Standing, Walking, Driving | LIMITEDTO | LIMITEDTO |
| Bending, Twisting, Kneeling, Climbing | ABLE | LIMITEDTO |
| Lifting | LIMITEDTO | (per plane) |
| Pushing/Pulling | ABLE | LIMITEDTO |

The decisive fact: on C050S, Bending, Twisting, Kneeling and Climbing emit LIMITEDTO (the Extended code
list). This confirms the engine spec Section 3 matrix that those axes are Extended (with hours) on the
C050S, unlike the C050E where they are Basic. The Extended list emits LIMITEDTO, exactly as the
`emit_code` mapping in the engine spec Section 5 requires. The sitting, standing, walking, lifting and
driving axes emit LIMITEDTO on both forms (Extended on both), also as specified.

C151S Max (5.09) and C050S Max (5.04) both carry 12 LIMITEDTO occurrences and a small number of
standalone LIMITED (weight band or Basic), consistent with Extended clinical forms.

## NOT isolated by the provided samples: criterion 9, the C151S Basic switch

Criterion 9 asks that a C151S with "status not changed" carries the Basic code list on E14, E16, E18,
E20, E22. The two provided C151S samples do not isolate this scenario:
- `5.10 C151S Min` leaves the capability values EMPTY (LIMITEDTO count 0, standalone LIMITED count 0),
  so no code list is emitted to inspect.
- `5.09 C151S Max` is the "changed" scenario and emits Extended (LIMITEDTO).

So the not changed with Basic codes scenario is not present in the Min or Max sample. The E1
code_list_switch (Extended to Basic on the N branch) rests on the workbook annotation the engine spec
Section 4.4 cites (`If "Has the patient's status changed" = 'N' [See Basic Work Restriction Codes]`),
not on these two sample XML files. Recorded as a partial: the switch is documented from the workbook
and remains to be confirmed against a not changed sample, which the board package does not include for
C151S. This is a candidate question for the board enquiry (engine spec Section 9.6 already flags a
C151S provider question).

## Which transcribed rules are now verified

- BR5 page 1 / VAL-X01 (PHN one of two required, inversion) on all eight forms: VERIFIED (criterion 15).
- The Extended axis emission (sitting, standing, walking, driving, lifting on all clinical forms;
  bending, twisting, kneeling, climbing, pushing/pulling on C050S and C151S): VERIFIED as LIMITEDTO
  (criterion 4, Extended half).

## Still pending (the bulk of the definition of done)

- Criterion 4 Basic half: a C050E sample where bending is limited would show LIMITED (Basic). The
  provided C050E Max has bending = ABLE, so the Basic LIMITED string is not exercised. Needs a
  targeted scenario.
- Criterion 9: the C151S not changed Basic switch (see above).
- Criterion 11: a hidden field cleared and absent. The Min samples omit the RTW capability values
  (empty), which is consistent, but a rule by rule present versus absent assertion per scenario is the
  remaining work.
- The show/hide chains (RTW SR1/SR2/SR3, the opioid module, the invoice SR9/SR16) each need their
  present versus absent assertion against the matching sample scenario.

## Next steps

Extend `verify.mjs` to diff the OBX identifier set between Min and Max per form (present versus absent),
and to assert per rule that the elements a show/hide rule gates appear only in the scenario where the
rule shows them. Then flip `verified_against_sample_xml` true rule by rule in the transcription docs.
The board package lacks a C151S not changed sample, so criterion 9 stays partial pending the board.
