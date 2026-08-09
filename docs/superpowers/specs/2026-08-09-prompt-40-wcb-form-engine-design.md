# Prompt 40: WCB Form Engine. Migration, Loader and Validation Spec.

Status: DESIGN. The schema and loader in Sections 2 and 3 are apply ready now (this prompt is self
contained). The rule transcription in Section 5 is a manual critical path, scoped here, not done here.
Date: 2026-08-09. Source of truth: WCB Alberta Vendor Accreditation Package, verified present on
2026-08-09 at D:\Continuim\Continuum\Continuum\VendorAccreditationPackage (1).zip (40 entries, all
referenced files present). Mapping workbook 3 - WCB Report Element to HL7 Element Mapping.xlsx opened,
43 worksheets confirmed by reading xl/workbook.xml.
House rule: no em dashes or en dashes anywhere. Commas, colons, parentheses only.

This document builds Prompt 40 Sections 2 through 6: the code list loader, form definitions, form
rules, and the three validation passes. It does NOT build screens (Screens prompt) or XML generation
(XML Generation and Submission prompt). See Section 11.

---

## 0. Preconditions and buildability

Unlike Prompt 39, this prompt is largely self contained. Its tables create the `clinical` schema and
reference only each other, so no external parent (clinic, wcb_case, practitioner, wcb_report) is
required. Its real dependency is the accreditation package, which is present. Therefore Sections 2 and
3 can be applied now.

One ordering fact worth stating: this prompt creates `clinical.form_definition` and
`clinical.form_element`, which Prompt 39's `resolve_axes` reads. Prompt 40 is therefore effectively a
prerequisite for Prompt 39's resolver, even though the two prompts are order independent as schemas.

Residency confirmed: project agzhnmunodrhsjbogzae is ca-central-1 (Canada). Not a stop condition.

---

## 1. Invariants this build enforces (Prompt 40 Section 0A and 7)

1. The board's material is the specification. Every board string, code, limit and rule is confirmed
   character for character against the open source document before it is stored. Where our documents
   and the board's disagree, the board wins and the discrepancy is reported (Section 10).
2. Everything from the board is data, nothing is code. No board code, limit, field name or rule is
   hard coded. A board change is a data load, never a deployment.
3. No lookup is keyed on `ui_mapping` (bracket identifiers differ across forms). No form element is
   keyed on sequence number (C050S seq 77 and C151S seq 80 each appear twice). The element key is
   `(form_definition_id, element_seq, element_name)`.
4. `conditionally_available` means the element is ABSENT from the payload when its condition is not
   met, never present and empty.
5. The New XPath column is used, never the Legacy XPath column.
6. Validation collects all failures, never stops at the first.
7. Banned vocabulary (predict, diagnose except the board field name Current diagnosis, auto correct,
   smart validation, assume, default clinical value) appears in no identifier, enum, comment, or log.

---

## 2. Migration part A: code lists and reference data (Prompt 40 Section 2)

Idempotent. Schema qualified into `clinical`. Apply as one transaction after a `create schema if not
exists clinical;`.

```sql
create schema if not exists clinical;

create table if not exists clinical.jurisdiction (
  code varchar(4) primary key, name varchar(80) not null,
  submission_channel varchar(30) not null, active boolean not null default false);

create table if not exists clinical.wcb_code_list (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null references clinical.jurisdiction(code),
  list_name varchar(80) not null,
  source_version varchar(20) not null,
  loaded_at timestamptz not null default now(),
  unique (jurisdiction_code, list_name, source_version));

create table if not exists clinical.wcb_code_value (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references clinical.wcb_code_list(id),
  list_name varchar(80) not null,
  code varchar(20) not null,
  description varchar(200) not null,
  sort_order int, extra jsonb,
  unique (list_id, code),
  unique (list_name, code, list_id));
create index if not exists ix_code_lookup on clinical.wcb_code_value(list_name, code);

create table if not exists clinical.wcb_pob_noi_forbidden (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null,
  noi_code varchar(20) not null, pob_code varchar(20) not null,
  source_version varchar(20) not null,
  unique (jurisdiction_code, noi_code, pob_code, source_version));
create index if not exists ix_pobnoi on clinical.wcb_pob_noi_forbidden(jurisdiction_code, pob_code, noi_code);

create table if not exists clinical.wcb_contract_role (
  contract_id varchar(10) not null, contract_desc varchar(80) not null,
  practitioner_role varchar(10) not null, role_desc varchar(80) not null,
  primary key (contract_id, practitioner_role));

create table if not exists clinical.wcb_contract_role_form (
  id uuid primary key default gen_random_uuid(),
  contract_id varchar(10) not null, practitioner_role varchar(10) not null,
  form_id varchar(6) not null,
  report_kind varchar(10) not null,
  created_from_form_ids varchar(6)[],
  source_version varchar(20) not null,
  foreign key (contract_id, practitioner_role)
    references clinical.wcb_contract_role(contract_id, practitioner_role),
  unique (contract_id, practitioner_role, form_id, report_kind, source_version));
create index if not exists ix_crf_lookup
  on clinical.wcb_contract_role_form(contract_id, practitioner_role, report_kind);

create table if not exists clinical.wcb_fee_schedule (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null, form_id varchar(6) not null,
  practitioner_role varchar(10) not null,
  fee_tier varchar(10) not null,
  amount numeric(10,2) not null,
  effective_from date not null, effective_to date,
  source varchar(200) not null);

create table if not exists clinical.statutory_holiday (
  jurisdiction_code varchar(4) not null, holiday_date date not null,
  name varchar(80) not null, primary key (jurisdiction_code, holiday_date));
```

Seed `jurisdiction` with AB active, every other province inactive (Alberta is row one, not the
schema). Seed `wcb_fee_schedule` with the Alberta general practitioner rates effective 2025-04-01
(C050E same_day 96.98, on_time 88.37, late 55.70; C151 same_day 58.91, on_time 53.69, late 33.85),
loaded as data, never hard coded elsewhere. These change annually.

## 2A. Migration part B: form definitions and rules (Prompt 40 Section 3 and 4)

```sql
do $enums$
begin
  if not exists (select 1 from pg_type where typname='optionality') then
    create type clinical.optionality as enum (
      'always_required','always_optional',
      'conditionally_available_required','conditionally_available_optional','dataset');
  end if;
end
$enums$;

create table if not exists clinical.form_definition (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null,
  form_id varchar(6) not null, form_name varchar(120) not null,
  version varchar(20) not null, element_count int not null,
  max_attachments int not null default 0,
  effective_from date not null,
  unique (jurisdiction_code, form_id, version));

create table if not exists clinical.form_element (
  id uuid primary key default gen_random_uuid(),
  form_definition_id uuid not null references clinical.form_definition(id),
  element_seq varchar(10) not null,
  element_name varchar(200) not null,
  ui_mapping varchar(10),
  section_name varchar(60) not null,
  data_type varchar(20) not null,
  length_min int, length_max int, format varchar(40),
  min_occurs int not null default 0,
  max_occurs int not null default 1,
  code_list_name varchar(80),
  optionality clinical.optionality not null,
  deprecated boolean not null default false,
  hl7_xpath text not null,
  unique (form_definition_id, element_seq, element_name));
create index if not exists ix_element_form on clinical.form_element(form_definition_id, section_name);

create table if not exists clinical.form_rule (
  id uuid primary key default gen_random_uuid(),
  form_definition_id uuid not null references clinical.form_definition(id),
  rule_code varchar(20) not null,
  ordinal int not null default 1,
  rule_type varchar(20) not null,
  source_document varchar(80) not null,
  source_page int,
  trigger_element_name varchar(200),
  trigger_condition jsonb not null,
  affected_element_names varchar(200)[] not null,
  clears_on_hide boolean not null default true,
  switches_code_list_to varchar(80),
  transcribed_by uuid, transcribed_at timestamptz,
  verified_against_sample_xml boolean not null default false,
  unresolvable boolean not null default false,
  unique (form_definition_id, source_document, source_page, rule_code, ordinal));
```

Deviations from the verbatim prompt, all cosmetic: enums and tables schema qualified into `clinical`;
an `unresolvable boolean` added to `form_rule` so a rule that references a nonexistent element can be
loaded and marked rather than dropped (Prompt 40 Section 6 and 9 item 4). No column removed or
retyped. `element_seq`, `ui_mapping`, and `hl7_xpath` keep their prompt types exactly.

---

## 3. The code list loader (Prompt 40 Section 2.1). Faithful mirror, not editor.

Load every lookup worksheet, all of them, including `Yes No Responses` (referenced 131 times) and
`Work Restriction Detail Codes` (referenced zero times). The loader is a mirror of the source, not a
curated subset.

### 3.1 The five loader traps. Each handled explicitly.

1. Space padded codes. Facility Type, State Province and Country codes are padded (for example
   `'C         '`). TRIM on load, store trimmed. Acceptance criterion 5: no stored code has a leading
   or trailing space.
2. Mixed numeric and text typing. `Part Of Body Codes` mixes integers (24000) and zero padded strings
   (01100, 00000, 03201). `Pain Scale` and `Function Level` are integers. Read every code cell as
   text. A naive numeric read produces `24000.0` or strips the leading zero. Acceptance criterion 6:
   `01100` loads as the string `01100`.
3. Duplicate sequence numbers. C050S sequence 77 appears twice (deprecated Pushing/Pulling Hours and
   current Pushing/Pulling Max of); C151S sequence 80 likewise. Do not key on sequence. Acceptance
   criterion 7: seq 77 loads as two distinct elements, one deprecated.
4. Board typo. A C568 invoice line sub element is numbered `35.06` where siblings are `36.0x`. A
   loader keyed on parent sequence orphans it. Attach it to the correct invoice line parent explicitly.
   Acceptance criterion 8.
5. Comma delimited form lists. `Contract ID Role Form ID Codes` Report Types column holds values like
   `"C568A, C568, C569, C570"`. The worksheet has 32 rows; normalised to one form per row it is 66
   rows over 14 contract and role pairs. Load both facts and always say which one you mean. Acceptance
   criterion 3.

### 3.2 Loader algorithm

```
load_workbook(xlsx_path, source_version):
  read every worksheet name (expect 43). Report the count actually seen.
  for each lookup worksheet (about thirty of them):
    insert one clinical.wcb_code_list row (list_name = EXACT worksheet name)
    for each data row (skip title and header rows):
      code = trim(read_cell_as_text(code_col))          # traps 1 and 2
      insert clinical.wcb_code_value (list_id, list_name, code, description, sort_order, extra)
        extra carries per row flags (side_of_body_required, expedite_allowed, ...)
  load clinical.wcb_pob_noi_forbidden from POB-NOI Validations
    (Alberta, expect EXACTLY 380 rows: row 1 title, row 2 header, 380 data rows; report the count)
  load clinical.wcb_contract_role and clinical.wcb_contract_role_form from Contract ID Role Form ID Codes
    (32 source rows, split comma lists into 66 normalised rows over 14 contract and role pairs)
```

Report on completion: worksheets seen (expect 43), POB-NOI rows (expect 380), contract role form
(expect 32 source and 66 normalised over 14 pairs). Any deviation is reported before proceeding.

### 3.3 Contract role facts that catch you out (Prompt 40 Section 2.2)

- Genuine crossover: contract 000065 Alberta Hospitals may create a C568 follow up from a C050E or a
  C151, neither of which it can create as an initial report. Do not build a rule requiring same
  contract ancestry.
- Two roles in `wcb_contract_role` (HP Hospital, NP Nurse Practitioners) are not in the nine
  `Practitioner Role Codes` (GP, OR, SP, ERS, ANE, DP, VSC, VSCFAC, OIS). Load both tables faithfully,
  add a separate check that a practitioner role is one of the nine, and block configuration of HP and
  NP with an explanatory message. Open item, Section 9.1.

---

## 4. Form definitions (Prompt 40 Section 3). Parse the eight form worksheets.

### 4.1 The eight forms and their verified counts. Loader must reproduce exactly.

| Form | Name | Elements | Always required | RTW fields | Max attachments |
|---|---|---|---|---|---|
| C050E | Physician's First Report | 111 | 38 | 27 | 3 |
| C050S | OIS Physician's First Report | 171 | 70 | 87 | 3 |
| C151 | Physician's Progress Report | 136 | 39 | 27 | 3 |
| C151S | OIS Physician's Progress Report | 153 | 39 | 67 | 3 |
| C568 | Medical Care Invoice | 61 | 17 | none | 3 |
| C568A | Medical Consultation Invoice | 69 | 19 | none | 3 |
| C569 | Medical Supplies Invoice | 37 | 18 | none | 0 |
| C570 | Medical Invoice Correction | 66 | 18 | none | 0 |

If the loader produces different counts, the loader is wrong. Report the numbers got before
proceeding (acceptance criterion 4). C569 and C570 accept no attachments at all: the attachment
control is ABSENT on those forms, not present and empty.

### 4.2 ui_mapping is a display label, never a key (Prompt 40 Section 3.2)

Bracket identifiers are not stable across forms. Verified examples: part of body is C8 on C050E but
C10 on C151 and C151S; nature of injury is C10 on C050E but C12 on the C151 family; treatment plan is
D5 on C050E but D28 on the C151 family. Key everything on
`(form_definition_id, element_seq, element_name)`. Any lookup by bracket identifier alone is a defect.

### 4.3 Occurrence limits (Prompt 40 Section 3.3). Parse both bounds into min_occurs and max_occurs.

Injuries 1 to 5. Prescriptions 1 to 5. Consultations, referrals, investigations 0 to 5. Attachments
0 to 3, and 0 to 0 on C569 and C570. Invoice lines 1 to 25. The difference between 1 to 5 and 0 to 5
is what makes "at least one injury is required" a data fact rather than prose.

### 4.4 Use the New XPath column only

`form_element.hl7_xpath` is loaded from the New XPath column. Never the Legacy XPath column (it targets
the old system). Acceptance and validation both depend on this.

---

## 5. Show and hide rules (Prompt 40 Section 4). The critical path. Not a data load.

### 5.1 Why this is manual

The mapping workbook records THAT a field is Conditionally Available. It does not record WHAT the
condition is; the Business Processing Rule column is empty for essentially every gated field. The
rules exist only as prose in the eight UI design PDFs (2.01 to 2.08), numbered SR, IBR and BR. This is
a manual transcription of roughly forty prose rules per form across eight PDFs, on the order of 300
plus rules total. Estimate it after reading one document in full, not before. Nothing about
accreditation works without it.

### 5.2 The definition of done for a transcribed rule

Every rule is verified against the board's own `5.xx` Min Fields and Max Fields sample XML before
`verified_against_sample_xml` is set true (acceptance criteria 9, 11, 17). Transcription without that
verification is not done.

### 5.3 The board reuses rule codes within one document (Prompt 40 Section 4.2)

In `2.01 - C050E - User Interface Design.pdf`, BR5 appears twice with unrelated meanings (page 1 the
Alberta PHN rule, page 2 the part and side combination rule). The unique key includes source_page and
ordinal; `rule_code` alone is never a key.

### 5.4 Mandatory clearing behaviour (Prompt 40 Section 4.3)

When a triggering response hides a dynamically shown field, the data entered in that field is cleared
and not submitted. Implement exactly. Warn the practitioner before any collapse that would discard
entered data. `form_rule.clears_on_hide` carries this per rule.

### 5.5 The C151S no change chain, transcribed correctly (Prompt 40 Section 4.4)

An earlier Continuum specification claimed answering no change on C151S element E1 collapses the entire
66 field return to work block in two interactions. That is false. Verified:

- SR30 (2.04): selecting either Yes or No on "Has the patient's Return to Work status changed" ENABLES
  the miss work field.
- SR28 (2.04): answering "not changed" hides only the OIS disposition questions and shows the
  pre-accident date field. Six fields, not sixty six.
- The workbook confirms it: elements E14, E16, E18, E20, E22 carry `If "Has the patient's status
  changed" = 'N' [See Basic Work Restriction Codes]`. A hidden field would not carry a code list for
  the hidden branch. E1 SWITCHES the code list from Extended to Basic; it does not hide the fields.
- What collapses the capability block is SR3: modified duties and modified hours both answered No.

Therefore E1 is BOTH a `code_list_switch` rule and a `show_hide` rule, and the engine supports both
types (`form_rule.rule_type` and `switches_code_list_to`). Build the full chain SR30, SR1, SR2, SR3,
SR28 and verify the payload against `5.10 - C151S - Min Fields.xml`. Acceptance criteria 9 and 10.

### 5.6 Two board self contradictions. Do not resolve in code (Prompt 40 Section 4.5, Section 9).

One: C050S rules SR2 and SR3 reference fields that do not exist on the C050S (for example "Estimated
date you expect the patient will be able to perform pre-accident work", which exists on C050E, C151,
C151S but not C050S; and "Current Capabilities" and "Other reasons why the patient cannot work",
which are not element names on any clinical form). Load these rules, mark `unresolvable = true`,
report. Never guess.

Two: about twenty C050S capability elements are marked Always Required in the workbook while SR2 hides
and clears the same block when the worker has returned to work. Taken literally, a legitimate C050S is
unsubmittable. Interim handling: an element hidden by an applicable rule is EXEMPT from the always
required check, regardless of workbook optionality. Write an exemption record every time (acceptance
criterion 16). Craig is raising both with the board.

---

## 6. Validation, three passes (Prompt 40 Section 5)

Client side validation is a courtesy. Server side validation is the contract. Never rely on the first.

| Pass | When | Scope |
|---|---|---|
| P1 field | On blur, client and server | Type, length, format, code list membership |
| P2 cross field | On section exit, server | Conditional requirements, date logic, consistency |
| P3 submission | At review and before XML generation, server only | Everything |

### 6.1 P3 checks, in order. Collect all failures, never stop at the first (acceptance criterion 12).

1. Every always_required element present and non empty, except those exempted under 5.6.
2. Every conditionally_available_required element whose condition is met is present, and every one
   whose condition is not met is ABSENT from the payload (absent, not empty).
3. Every coded value is a current member of its list for THAT form.
4. Every dataset respects min_occurs and max_occurs, including invoice lines 1 to 25.
5. Every length and format matches the element definition.
6. Part of body and nature of injury pairs are not among the 380 forbidden combinations.
7. The contract, role and form triple is permitted.
8. A follow up's parent form is a permitted ancestor.
9. Attachments are a permitted type and under 1 MB. C569 and C570 permit none.
10. Zero fields remain draft and untouched.
11. Zero stale carried forward values unconfirmed.
12. XSD validation against BOTH `6 - WCBhl7_v231_modern_v100.xsd` and `6.01 - ..._validate.xsd`.

### 6.2 Named cross field rules (Prompt 40 Section 5.2). Each carries its board source.

| ID | Rule | Source |
|---|---|---|
| VAL-X01 | Alberta PHN blank when the no PHN indicator is Yes, present when No | C050E BR5 page 1 |
| VAL-X02 | Side of body required where the part of body flag says so | Part Of Body Codes, Side of Body Required |
| VAL-X03 | Part of body and nature of injury not among the 380 forbidden pairs | POB-NOI Validations |
| VAL-X04 | Each combination of part, side and nature in the injury table must be unique | C050E BR3 |
| VAL-X05 | Diagnostic code 2 requires code 1. Code 3 requires codes 1 and 2 | C050E BR6 |
| VAL-X06 | Within an injury row, if any of part, side or nature is populated the others must be | C050E BR9 |
| VAL-X07 | Dominant hand enabled only for Arm, Elbow, Finger, Hand, Shoulder, Wrist, Thumb, Neck | C050E SR3 |
| VAL-X08 | Additional injuries free text enabled only when five injury rows are used | C050E SR4 |
| VAL-X09 | Prescriptions required when opioids prescribed is Yes | C050E |
| VAL-X10 | Expedite permitted only where the board's per row flag allows it for that type | Category Type Expedite Codes |
| VAL-X11 | Referral type list filtered by report type AND selected category, not report type alone | Category Type Expedite Codes |
| VAL-X12 | Hours on any axis cannot exceed hours capable of working per day | Consistency |

Rules X04 through X08 were missing from an earlier Continuum specification. They sit on the same board
document page as rules that were captured. Acceptance criteria 13 (X04) and 14 (X07).

### 6.3 The PHN polarity inversion (Prompt 40 Section 5.3). A production rejection if missed.

The board element is "Patient does not have an Alberta PHN". Yes means the patient has NO PHN. The New
XPath target is `/.../Claimant/HavePersonalHealthNumber/`, whose name is the inverse. Emitting `Y` into
`HavePersonalHealthNumber` when the patient has no PHN produces the real rejection "Worker Personal
Health Number must be BLANK since Worker Personal Health Number Indicator is No". Put a comment at the
mapping, invert deliberately, add a test. Acceptance criterion 15.

---

## 7. What must fail loudly (Prompt 40 Section 6). Enforcement map.

| Condition | Behavior |
|---|---|
| Part of body and nature pair not in the validation table | Fail. Do not pass. |
| Contract and role pair not in the matrix | Fail. Never default to General Practitioner. |
| A code value not in the loaded list for THIS form | Fail. Never fall back to another form's list. |
| A conditionally_available element with no rule | Fail the form load. Ungated conditional is a transcription gap. |
| XML failing either XSD | Block the batch, raise to a named human. Never a silent drop. |
| A rule referencing a nonexistent element | Load it, mark `unresolvable`, report. |
| A code list referenced by an element but absent from the workbook | Fail the load, name both (Section 9.2, 9.3). |

---

## 8. Acceptance criteria (Prompt 40 Section 8) with the proving evidence

1. Loader reports 43 worksheets and loads every lookup list including Yes No Responses. Proven at load.
   (Confirmed 43 on 2026-08-09 by reading workbook.xml.)
2. `wcb_pob_noi_forbidden` contains exactly 380 Alberta rows. `select count(*) ...`. Report the number.
3. `wcb_contract_role_form` reports 32 source rows and 66 normalised rows over 14 pairs.
4. All eight form definitions load with the Section 4.1 counts. Any mismatch reported before proceeding.
5. No stored code has a leading or trailing space:
   `select count(*) from clinical.wcb_code_value where code <> btrim(code); -- expect 0`.
6. Part of body `01100` loads as the string `01100`, not 1100 or 1100.0.
7. C050S seq 77 loads as two distinct elements, one deprecated.
8. C568 element `35.06` loads under the correct invoice line parent.
9. A C151S with status not changed produces a payload matching `5.10 - C151S - Min Fields.xml`,
   including the Basic code list on E14, E16, E18, E20, E22.
10. Answering no change does not remove the capability block unless modified duties and modified hours
    are both No.
11. A hidden field's data is cleared and absent from the payload, verified in the XML.
12. A run with five distinct errors reports all five, each against its element.
13. Two identical part, side, nature injury rows are rejected under VAL-X04.
14. Dominant hand enabled for Shoulder, disabled for Back, per VAL-X07.
15. A patient with no Alberta PHN yields a correct `HavePersonalHealthNumber`, with a test asserting
    the inversion.
16. Every C050S element hidden by an applicable rule but marked Always Required generates an exemption
    log record.
17. `verified_against_sample_xml` is true for every transcribed rule on every form built.
18. A form version can be added by loading data, zero code changes. Prove by loading a synthetic
    version.
19. A code list value added to the workbook appears after a reload with no deployment.

---

## 9. Open items carried forward (Prompt 40 Section 9). Not resolved here.

1. Role codes HP and NP appear in the contract table but not the nine Practitioner Role Codes. Block
   both at configuration with an explanatory message.
2. C570 element 32.12 references a code list `Location Codes`. No such worksheet exists among the 43.
   Assume `Facility Types`, flag it, do not proceed silently.
3. The C050E document cites an "SOB POB Relations tab" that does not exist. Use the Side of Body
   Required flag on Part Of Body Codes and flag the discrepancy.
4. C050S rules SR2 and SR3 reference fields that do not exist on the C050S. Load, mark unresolvable,
   report.
5. About twenty C050S elements are both Always Required and hidden by SR2. Apply the interim exemption
   in 5.6 and log every instance.
6. Is the C151S for OIS providers or emergency physicians? The description says emergency physicians;
   the contract matrix assigns it solely to contract 000053 OIS. Build to the contract matrix and
   report.
7. No board error code catalogue exists in the package. Build the catalogue table empty and grow it
   from real rejections. Unmapped codes show the board's raw text to a human.

---

## 10. Deviations from the verbatim prompt, listed for review

1. Enums and tables schema qualified into `clinical` (prompt wrote some unqualified). No value changed.
2. `create schema if not exists clinical;` added at the top (self contained build).
3. `form_rule` gains `unresolvable boolean` so a rule referencing a nonexistent element is loaded and
   marked rather than dropped (Section 6 and 9.4 require it survive and be reported).
4. Nothing else changed. Every board string, code, limit and rule is loaded from the package verbatim,
   never transcribed from memory.

## 11. Not built here (Prompt 40 Section 10)

Screens (Screens prompt) and XML generation and submission (XML Generation and Submission prompt).
This prompt builds the loader, form definitions, rules, and the three validation passes only. If a
screen or XML generation appears in the work, it is in the wrong prompt.

## 12. Build increments

- Increment 1 (low risk, buildable now): apply Section 2 and 2A schema, run the Section 3 loader
  against the live package, verify acceptance criteria 1, 2, 3, 4, 5, 6, 7, 8 against real data. Hand
  Gary the migration plus generated seed SQL to apply (per the standing Supabase rule).
- Increment 2 (critical path): transcribe the Section 5 rules from the eight UI design PDFs, verify
  each against the `5.xx` sample XML (criteria 9, 10, 11, 16, 17).
- Increment 3: wire the three validation passes and VAL-X01 to X12, including the PHN inversion
  (criteria 12, 13, 14, 15).
