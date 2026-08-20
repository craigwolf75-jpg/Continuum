# Prompt 40 reconciliation with Prompt 39A (HL7 facts and corrections)

Date: 2026-08-10. Source: `PROMPT_39A_ADDENDUM_XML_FACTS_AND_CORRECTIONS.md` (written 2026-08-10),
which reads facts out of the board package (`WCB_Vendor_Accreditation_Package.zip`) and states, as its
own rule, that where it and Prompt 39 disagree it wins because every statement was read from the board
files rather than reasoned from them. This document records what 39A changes for the Prompt 40 build
that already shipped, and what it leaves as new work. House rule: no em or en dashes.

## 1. Confirmed by 39A (already built correctly, no change)

- **PHN polarity inversion** (39A Section 1). `clinical/engine/validation.mjs` `valX01`, `phnFields`,
  `havePhnXpathValue`: CX.5 = Y means the patient has NO PHN and CX.1 is blank; CX.5 = N means a PHN is
  present. 39A confirms this against all 24 identity blocks in 17 samples.
- **Real calendar date validation** (39A Section 4). `clinical/engine/p1.mjs` `isRealCalendarDate`
  validates against a real calendar (rejects 2026-02-30) rather than trusting a regex. 39A specifically
  says do NOT lift the validation schema's date regex (its `(02[0-2][0-8])` rejects 9 and 19 February
  every year and a real 2000 leap day, and accepts a nonexistent 1900 leap day). Our approach is the
  one 39A prescribes.
- **LIMITED versus LIMITEDTO** (39A Section 2.2). `emitCode` emits LIMITED for the Basic list and
  LIMITEDTO for the Extended list. 39A confirms the two lists differ by exactly that one token.
- **The C151S conditional code set** (39A Section 2.4). The `form_rule` E1 code_list_switch we authored
  in `clinical/db/form_rules.data.mjs` (E1 = No switches E14, E16, E18, E20, E22 to Basic Work
  Restriction Codes) matches 39A exactly. 39A removes this from the board enquiry list and says treat
  it as fully specified against the workbook, which is what we did.

## 2. Corrected by 39A (shipped code changed in this pass)

- **Present and empty is the board convention, not absent** (39A Section 3). `clinical/engine/p2.mjs`
  `conditionalRequirement` previously enforced "absent when the condition is not met". 39A counted the
  OBX segments in every sample and found the board emits the form's full OBX skeleton in fixed order
  with `<OBX.5 />` for unused observations (5.03 C050E Min has the same 98 OBX as the Max sample, 73 of
  them empty). Corrected: an unmet conditional observation must be CLEARED (present and empty); a stale
  non empty value is the violation, not the presence of an empty element. A whole container not
  applicable to the form is still absent (C569 and C570 carry no attachment container), kept as the new
  `mode: "absent"`. Tests updated (`p2.test.mjs`), full engine suite green (128). The engine spec
  Section 6.1 check 2 and acceptance criterion 11 are corrected in place with a pointer to 39A.
- **The HL7 null `""` is never correct** (39A Section 3.1 item 4). Recorded for the XML generation
  prompt: unused observations use an empty element, never the HL7 null, which would be a third message
  meaning "set the stored value to null".

## 3. New work 39A introduces (follow up, not built here)

These belong to the XML generation prompt and the reference data load, not the validation engine that
is complete. Listed so none is lost.

1. DONE. **The (form, element) Basic versus Extended table** (39A Section 2.3). Built as
   `clinical.wcb_capability_code_set` (migration 005, seed 006 from `capability_code_set.data.mjs`, 58
   rows) and read by `clinical/engine/capability.mjs`. C050S moves bending, twisting, kneeling, climbing
   and pushing from Basic to Extended; C151S makes those five conditional on RTWPATIENTSTATUSCHANGED;
   overhead reaching and single field lifting are C050E and C151 only, replaced by four reaching and
   three lifting elements on C050S and C151S; grasping and reaching take ABLE or UNABLE only; a not on
   form element fails loudly.
2. DONE. **Namespaced code enums** (39A Section 2.6). Built as `clinical/engine/codes.mjs`: each board
   code carries its workbook sheet as a namespace and is branded so a bare string cannot pass a type
   guard. `assignCapabilityCode` and `assignWeightCode` check the namespace tag, not the string, so a
   weight LIMITED can never be assigned to a capability element and a restriction LIMITED can never be
   assigned to a weight element (acceptance criterion 14). The capability resolver's list names are the
   same strings as the code namespaces, so the two modules compose without wiring.
3. DONE (except the board enquiry). **PHN length and check digit** (39A Section 1.4, 1.5, board enquiry
   B1). Built as `clinical/engine/phn.mjs`: `phnLength` enforces exactly nine digits in application code
   (the schema `\d{0,9}` permits a short PHN, criterion 8), `phnCheckDigit` is a default off, pluggable
   stage that refuses to guess an algorithm when enabled without a board confirmed validator, `phnGate`
   runs both, and `claimReferenceFormat` handles the PID.2/CX.1 max seven trap. The nine digit check
   ships now; the check digit validator stays off until the board publishes the algorithm (B1 open,
   Craig to ask the board).
4. DONE (except the board enquiry). **Date defect passthrough** (39A Section 4, board enquiry B2). Built
   as `clinical/engine/date_defect.mjs`: `reconcileDate` treats Continuum's real calendar check
   (`isRealCalendarDate`, now exported from p1.mjs) as authoritative. A date that never existed is
   blocked regardless of either schema (criterion 16: 29 February 1900 and 31 September 2026); a real
   date the schema wrongly rejects (9 and 19 February every year, and a real 29 February the schema's
   leap list omits) passes and is logged as the known B2 defect without blocking (criterion 15); a real
   date the schema rejects outside the four documented patterns is raised as a discrepancy, not silently
   passed. Whether the live board application shares the defect stays unverified (B2 open).
5. DONE. **Error catalogue maps code to element only** (39A Section 5). Built as
   `clinical.wcb_error_catalogue` (migration 007, seed 008 from `error_catalogue.data.mjs`) and
   `clinical/engine/errors.mjs`. The table has no column for a value, polarity or correction, so it
   cannot store one; the generator also rejects any such field in the source. The one real board code
   in the package (121023) is seeded mapping to the Worker 36 element only, with the 2007 inverted
   polarity caveat as a human note and no value. An unmapped or below 0.80 confidence code surfaces the
   board's raw text to a human. The catalogue grows from real rejections.
6. DONE. **OBX skeleton per form as stored configuration** (39A Section 3.1 item 1, acceptance criterion
   4 replacement). Built as `clinical.wcb_obx_skeleton` (migration 009, seed 010 from
   `obxskeletongen.mjs`, which reads each form's board sample XML) and `clinical/engine/obx.mjs`. The
   skeleton and its fixed order are read from the samples: C050E is the 98 OBX of 5.03 in order
   (criterion 4, gated in the generator), C569 and C570 carry two each, 521 across the eight forms.
   `verifySkeleton` asserts a generated OBX set matches the skeleton exactly, and `assertNoHl7Null`
   rejects the HL7 null. 16 tests.
7. **Attachment block when there are no attachments** (39A board enquiry B3). Either shape validates;
   build to omission and make it one configuration flag.

## 4. Acceptance criteria movement (39A Section 6)

Prompt 39A withdraws its criterion 4 (unmet conditionals absent) and replaces it with a present and
empty OBX skeleton criterion, and adds criteria 12 through 20 for the code set enforcement, the date
defect passthrough, and the namespaced enums. In this Prompt 40 spec the affected criterion is 11 (the
hidden field one), corrected in place. The new 39A criteria that are engine testable (date calendar
check, LIMITED versus LIMITEDTO, the C151S conditional) are already covered by the engine suite; the
rest are XML generation criteria.

## 5. Open board enquiries after 39A (Craig, not ours to resolve)

- B1: the PHN check digit algorithm (absent from the package).
- B2: whether the live board application carries the validation schema date defect.
- B3: the preferred attachment block shape when there are no attachments.
The C151S Basic and Extended switch is REMOVED from the enquiry list; it is fully specified.
