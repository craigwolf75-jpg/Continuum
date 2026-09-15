PROMPT 39. THE FUNCTIONAL MEASUREMENT MODEL
For Claude Code. Standalone and paste ready. Renumbered and revised July 23, 2026.
This prompt was previously numbered 36. It is renumbered to 39 because 36 is taken in both the chat stream and the site mission queue, and 39 is the next free number. Its companion prompts in the physician platform stream are referred to here by name to avoid cross stream collisions: the Form Engine prompt (formerly numbered 37 in the physician stream; it builds the form engine, code list loader, and validation), the Screens prompt (formerly 38; it builds the screens), and the Hub Authentication Fix prompt (formerly 33). Where this document says a companion may already have run, verify the objects it created and skip rather than rebuilding. These prompts are order independent and idempotent.
This prompt builds the core data object of the Continuum physician platform: the record of what an injured worker’s body can and cannot do. Everything downstream reads from it. If this is wrong, the board report, the employer duty match, and the worker plan are all wrong.

SECTION 0. EXECUTION DISCIPLINE FOR CLAUDE CODE. READ FIRST.
Report before you build. Section 1’s prerequisite checks are answered in writing, with query output as evidence, before any code is written. Where a check is marked a blocking gate, stop at it and report.
Credentials come from the environment only. SUPABASE_ACCESS_TOKEN and any Twilio values are read from the local environment or a local .env file. Never ask for a credential in chat, never print one in output, and treat any credential that has ever appeared in a chat as burned: report that it must be rotated.
Residency is a stop condition. Identifiable Canadian worker data must never leave Canada. Report the database project’s region as part of prerequisite check 7, and if the region is outside Canada, stop and report rather than proceeding.
No em dashes or en dashes in anything you write: code, comments, migrations, seeds, reports, or documents. Use commas, colons, parentheses, or restructured sentences.
Evidence means server responses, database rows, and exports. Never the interface. Every acceptance criterion in Section 8 is reported with the query or payload that proves it.
Stop conditions are not failures. Section 9 lists open items that are not yours to resolve. Hitting one and stopping with a clear report is correct execution.

SECTION 0A. LANGUAGE, CLAIM AND REGULATORY RULES. THESE OVERRIDE EVERYTHING BELOW.
0A.1 The regulatory line, quoted verbatim
From Health Canada, Software as a Medical Device (SaMD): Definition and Classification, 18 December 2019. Software is not a medical device where it meets all four:
“Software that is not intended to acquire, process, or analyze a medical image or a signal from an IVDD”
“Software that is intended to display, analyze, or print medical information about a patient or other medical information”
“Software that is only intended to support a health care professional, patient or non healthcare professional caregiver in making decisions”
“Software that is not intended to replace the clinical judgement of a health care professional”
This guidance is not law and is not a safe harbour. Field names, enum values, API responses and interface labels are all part of the regulatory surface. A column called predicted_capacity breaches the line as surely as a marketing page would.
0A.2 The hard rule for this prompt
No system, model or heuristic may ever author a capability value or a quantity. Ever.
The software may decide which axis to display. It may never decide what the answer is. A practitioner cannot meaningfully verify a number the system invented, so criterion 4 fails the moment we cross this.
There is no confidence threshold above which it becomes acceptable, no configuration flag that enables it, and no smart default exemption. If you find yourself writing code that puts a value into functional_axis_value.capability without a human action behind it, stop and report.
0A.3 Banned vocabulary, everywhere, including schema and API
predict, prediction, diagnose, diagnosis (except when transcribing the board’s own field name Current diagnosis), recommend a restriction, risk score, severity score, auto-assess, smart default, inferred capability.
Required replacements: proposes for practitioner review, not yet reviewed, practitioner confirmed, carried forward, worker reported.
These are the same vocabulary laws the rest of Continuum holds; the platform’s guard modal already states the Health Canada line and the independent gates verbatim, and nothing this prompt builds may contradict it.
0A.4 Who authors what
Data
Author
Never authored by
Capability value
Practitioner, always
Anything else
Quantity (hours, kilograms)
Practitioner, always
Anything else
Which axes are displayed
Configuration table
n/a
Derived band
System, at signature
Practitioner
Carried forward value
Prior measurement, marked as such
Presented as fresh

SECTION 1. PREREQUISITE CHECKS. RUN AND REPORT BEFORE BUILDING.
Do not assume repository state. Report each of these in writing before you write code.
Does a restriction storage model exist today? Report its exact table and column names, whether it stores labels or values, and how many rows exist.
Are the 22 R codes hard coded anywhere in application logic? List every file that references R01 to R22.
Does the duty matching engine read a label or a value today? Name the function and the input type.
Do worker, employer, job_profile, duty and task_demand models exist? Report their field names.
Does any employer facing table, view, API response or export contain a diagnosis, symptom, medication, prescription or clinical narrative field? List every one. This is a blocking gate. Report before proceeding.
Is there an immutable audit log? Report whether UPDATE and DELETE are revoked at the database.
Where does the database physically sit? Report the hosting project’s region. Identifiable Canadian worker data must never leave Canada; a region outside Canada is a stop condition per Section 0.
Is the hub authentication fix from the Hub Authentication Fix prompt deployed and verified? Nothing ships before it is.

SECTION 2. THE CORE OBJECT
2.1 The principle, stated once so the rest follows
The board accepts four coarse weight bands: 11, 22, 44 and over 44 pounds. Every competing system stores the band, because filling in the form is all it needs to do.
Continuum stores what the practitioner actually measured, and derives the band at signature. You can always turn a measurement into a band. You can never turn a band back into a measurement.
2.2 Tables
CREATE TABLE clinical.functional_measurement (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  clinic_id uuid NOT NULL REFERENCES clinical.clinic(id),  case_id uuid NOT NULL REFERENCES clinical.wcb_case(id),  report_id uuid REFERENCES clinical.wcb_report(id),  practitioner_id uuid NOT NULL REFERENCES clinical.practitioner(id),  form_id varchar(6) NOT NULL,          -- which form shape this was captured against  version int NOT NULL,  measured_at timestamptz NOT NULL,  work_hours_per_day numeric(4,2),  modified_hours boolean,  modified_duties boolean,  fit_for_work varchar(10),             -- FIT | NOTFIT, board's Fit For Work Codes  fit_override_reason varchar(300),  effective_from date NOT NULL,  effective_to   date,  created_at timestamptz NOT NULL DEFAULT now(),  created_by uuid NOT NULL,  UNIQUE (case_id, version));-- NO updated_at. NO deleted_at. Immutable from creation.CREATE INDEX ix_measurement_case ON clinical.functional_measurement(case_id, version DESC);CREATE INDEX ix_measurement_clinic ON clinical.functional_measurement(clinic_id);CREATE TYPE capability AS ENUM ('able','limited_to','limited','unable','restricted_from');CREATE TYPE axis_source AS ENUM ('measured','carried_forward','bulk_marked_able');CREATE TYPE body_side AS ENUM ('left','right','both');CREATE TYPE reach_plane AS ENUM ('above','below');CREATE TYPE functional_axis AS ENUM (  'sitting','standing','walking','bending','twisting','kneeling_squatting',  'climbing','driving','pushing_pulling',  'lifting_general','overhead_reaching',  'lifting_floor_to_waist','lifting_waist_to_shoulder','lifting_above_shoulder');CREATE TABLE clinical.functional_axis_value (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  measurement_id uuid NOT NULL REFERENCES clinical.functional_measurement(id),  axis functional_axis NOT NULL,  answered boolean NOT NULL DEFAULT false,  skipped  boolean NOT NULL DEFAULT false,  skip_reason varchar(200),  capability capability,                  -- NULLABLE. NULL means not answered.  restriction_code_list varchar(60),      -- 'Basic Work Restriction Codes'                                          -- or 'Extended Work Restriction Codes'  measured_hours     numeric(4,2),        -- STORED. The real value.  measured_weight_kg numeric(6,2),        -- STORED. The real value.  derived_band varchar(20),               -- COMPUTED at signature. Never at entry.  derived_capability_code varchar(20),    -- the actual string emitted to the board  rounded_down boolean NOT NULL DEFAULT false,  below_lowest_band boolean NOT NULL DEFAULT false,  source axis_source NOT NULL,  created_at timestamptz NOT NULL DEFAULT now(),  created_by uuid NOT NULL,  UNIQUE (measurement_id, axis),  CONSTRAINT answered_or_skipped_not_both    CHECK (NOT (answered AND skipped)),  CONSTRAINT capability_requires_answered    CHECK (capability IS NULL OR answered),  CONSTRAINT skip_requires_reason    CHECK (NOT skipped OR skip_reason IS NOT NULL),  CONSTRAINT quantity_required_when_limited    CHECK (capability NOT IN ('limited_to','limited')           OR measured_hours IS NOT NULL           OR measured_weight_kg IS NOT NULL));CREATE TABLE clinical.functional_grasping (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  measurement_id uuid NOT NULL REFERENCES clinical.functional_measurement(id),  side body_side NOT NULL,  answered boolean NOT NULL DEFAULT false,  skipped boolean NOT NULL DEFAULT false, skip_reason varchar(200),  capability capability,                    -- able | unable only on this table  prolonged boolean, repetitive boolean, vibration boolean, specify boolean,  specific_restriction varchar(21),         -- the board's own limit is 21  UNIQUE (measurement_id, side));CREATE TABLE clinical.functional_reaching (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  measurement_id uuid NOT NULL REFERENCES clinical.functional_measurement(id),  side body_side NOT NULL, plane reach_plane NOT NULL,  answered boolean NOT NULL DEFAULT false,  skipped boolean NOT NULL DEFAULT false, skip_reason varchar(200),  capability capability,  UNIQUE (measurement_id, side, plane));CREATE TABLE clinical.functional_environment (  measurement_id uuid PRIMARY KEY REFERENCES clinical.functional_measurement(id),  answered boolean NOT NULL DEFAULT false,  skipped boolean NOT NULL DEFAULT false, skip_reason varchar(200),  restricted boolean,  cold boolean, hot boolean, wet boolean, dry boolean,  dust boolean, lighting boolean, noise boolean);CREATE TABLE clinical.functional_clinical_context (  measurement_id uuid PRIMARY KEY REFERENCES clinical.functional_measurement(id),  hospitalized boolean,  self_reported_pain boolean,  medication_side_effects boolean);CREATE TABLE clinical.internal_restriction (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  measurement_id uuid NOT NULL REFERENCES clinical.functional_measurement(id),  code varchar(10) NOT NULL REFERENCES clinical.internal_restriction_code(code),  note varchar(300),  emit_to_board_free_text boolean NOT NULL DEFAULT true);CREATE TABLE clinical.internal_restriction_code (  code varchar(10) PRIMARY KEY,  label varchar(120) NOT NULL,  free_text_phrase varchar(200) NOT NULL,   -- exact wording emitted to the board  active boolean NOT NULL DEFAULT true);
Seed internal_restriction_code with exactly these eight. These are the Continuum restrictions the board has no field for. Each is emitted into the board’s “Other restrictions or additional comments” element, which allows 2048 characters. That is a legitimate use of the field, not a workaround.
code
label
free_text_phrase
R05
No repetitive lifting
No repetitive lifting
R10
No use of force or physical intervention
No use of force or physical intervention
R11
No restraint or take downs
No restraint or take downs
R13
No night shift or shift work
No night shift or rotating shift work
R18
Concussion restrictions
Concussion protocol restrictions apply, see comments
R19
Psychological restrictions
Psychological injury restrictions apply, see comments
R20
Post surgical restrictions
Post surgical restrictions apply, see comments
R22
Weight bearing restriction
Weight bearing restriction, see comments

SECTION 3. THE AXIS SET IS PER FORM. THIS IS THE PART THAT WAS PREVIOUSLY WRONG.
An earlier version of the Continuum specification described one axis model and it was the C050S shape. It cannot produce a C050E or a C151. Verified directly against the board’s mapping workbook:

C050E and C151
C050S and C151S
Sitting, Standing, Walking, Driving
Extended codes plus hours
Extended codes plus hours
Bending, Twisting, Kneeling, Climbing
Basic codes. NO hours element exists
Extended codes plus hours
Pushing and pulling
Basic code. NO weight element exists
Extended code plus Max of weight
Lifting
ONE field plus one Max of
THREE planes, each with its own Max of
Reaching
ONE unsided “Overhead reaching”, Basic code
FOUR fields, above and below each shoulder
Grasping
Does not exist
Six fields per hand, twelve total
Environment
Does not exist
Parent flag plus seven booleans
Therefore: never hard code the axis set. Resolve it per form at runtime:
resolve_axes(form_id) -> AxisSpec[]  reads clinical.form_element for that form_definition  returns, for each axis present on that form:    { axis, ui_mapping, code_list_name, quantity_kind }  where quantity_kind is one of: none | hours | weight  determined by whether a paired quantity element exists on that form
A second trap, and it will cause board rejections if missed. The two code lists emit different strings for the same idea:
Basic Work Restriction Codes emit ABLE, UNABLE, LIMITED
Extended Work Restriction Codes emit ABLE, UNABLE, LIMITEDTO
And LIMITED is separately a Weight Category Code meaning 5 kg or 11 lb
So the same practitioner intent emits LIMITED on a C050E bending field and LIMITEDTO on a C050S bending field. Store restriction_code_list on every axis row and emit from it. Never map a single internal enum to a single output string.

SECTION 4. BAND DERIVATION
4.1 When
At signature, inside the same database transaction that sets wcb_report.snapshot_hash. Not at entry, because the practitioner must see and confirm what will be emitted. Not after submission, because the signed snapshot must reproduce the submitted payload exactly.
4.2 The weight band function, complete, including both open ends
The board’s Weight Category Codes are the only permitted outputs: LIMITED (5 kg / 11 lb), LIGHT (10 kg / 22 lb), MEDIUM (20 kg / 44 lb), HEAVY (over 20 kg / 44 lb).
Measured
Emit
Flags
Under 5 kg
LIMITED
below_lowest_band = true
Exactly 5 kg
LIMITED
none
Over 5, under 10
LIMITED
rounded_down = true
Exactly 10 kg
LIGHT
none
Over 10, under 20
LIGHT
rounded_down = true
Exactly 20 kg
MEDIUM
none
Over 20 kg
HEAVY
none. HEAVY is defined as “over 20 kg”, so this is not a rounding case
Round down always. A worker told they can lift less than they can is inconvenienced. A worker told they can lift more than they can is injured again.
Every derivation writes an audit event carrying the measured value, the emitted band, and both flags.
4.3 Which value governs downstream. Get this right or the employer computes against the wrong capacity.
The derived band governs every downstream output. The raw measurement never leaves Continuum.
A practitioner measures 8 kg floor to waist. The board is told LIMITED, which is 5 kg. Therefore:
The worker’s plain language plan says about 5 kilograms, not 8.
The employer duty match runs against 5 kg, not 8.
The raw 8 is stored for trend, for precision at the next visit, and for audit only.
Telling the worker 8 while telling the board 5 puts a 60 percent discrepancy into the employer’s safe duty computation. That is a safety defect, not a rounding detail.

SECTION 5. THE R CODE MIGRATION
The legacy 22 R codes become derived labels computed from a measurement, never stored facts.
CREATE TABLE clinical.legacy_restriction_label (  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  case_id uuid NOT NULL,  r_code varchar(10) NOT NULL,  has_underlying_measurement boolean NOT NULL DEFAULT false,  migrated_at timestamptz NOT NULL DEFAULT now(),  note text NOT NULL DEFAULT    'Legacy label. No measurement was ever captured. Do not infer one.');
Never fabricate a measurement from a label. The old labels were 10, 20, 25 and 50 pounds. The board’s bands are 11, 22, 44 and over 44. The 25 pound label collides: it either drops to 22 and loses three pounds or jumps to 44 and becomes unsafe. There is no mapping that is both safe and lossless, which is the entire reason this prompt exists.
Migrate every existing record with has_underlying_measurement = false and leave it visibly marked in the interface as a historical label.

SECTION 6. WHAT MUST FAIL LOUDLY
Silence is never permission. Each of these raises to a named human and is logged. None of them resolves to a safe default.
Condition
Resolution
An axis with no answered and no skipped at signature time
Block signature, list the axes by name
A measured weight above 100 kg
Warn, do not block. Practitioner may confirm
A measured hours value exceeding work_hours_per_day
Block, name both values
An axis present in the form definition but absent from resolve_axes output
Fail the build of that form, do not silently omit
A duty with no demand rating on a restricted axis
conditional, routed to the coordinator. Never safe
A carried forward measurement older than 90 days
Mark stale, require explicit confirmation before signature
A legacy R code with no underlying measurement reaching the duty match
Suppress the match and surface the reason. Do not guess

SECTION 7. PROHIBITED, WITH THE REASON ATTACHED
A prohibition with the wrong reason attached produces the wrong workaround. Each of these states why.
Prohibited
Reason
Populating capability or a quantity from any non human source
Fails Health Canada criterion 4. The practitioner cannot verify a number the system invented. This is the line that keeps Continuum a non device
Defaulting unassessed axes to able
A system generated clinical value in a signed report is a false attestation by the practitioner. It is also what the board’s clearing rules forbid
Storing the band instead of the measurement
Bands are lossy and irreversible. The longitudinal record is the only asset that compounds, and it cannot be reconstructed later
Updating a measurement in place
Every visit must leave a point on the trend. An update destroys the history that is the entire long term value
Emitting the raw measurement to a worker or employer surface
It disagrees with what the board was told, by up to 60 percent, and the employer computes safe work from it
Mapping one internal enum to one output code string
Basic and Extended lists emit different strings, and LIMITED means two different things in two different lists
Hard coding the axis set
It differs per form. A hard coded set cannot produce a C050E, which is the form every non OIS clinic files

SECTION 8. ACCEPTANCE CRITERIA
Numbered, pass or fail, verified against server responses, database rows and exports, not against the interface. Report each with the evidence.
Every axis row on a completed report has source of measured, carried_forward or bulk_marked_able, and zero rows exist with a system authored capability. Prove it with a query over a full test case.
resolve_axes('C050E') returns lifting_general and overhead_reaching and does not return the three lifting planes, grasping, sided reaching or environment.
resolve_axes('C050S') returns the three lifting planes, four sided reaching values, grasping per hand and environment.
A bending axis on a C050E emits LIMITED. The same practitioner intent on a C050S emits LIMITEDTO. Verified in the generated payload, not in the interface.
Measured 8 kg emits LIMITED. The audit log contains 8, the emitted band, and rounded_down = true.
Measured 25 kg emits HEAVY and rounded_down = false.
Measured 3 kg emits LIMITED and below_lowest_band = true.
The worker plan payload and the employer duty match payload both contain the band and contain no raw measurement anywhere. Verified by a schema level test that fails the build if a raw value appears.
An attempt to UPDATE any row in functional_measurement fails at the database.
An unanswered axis is distinguishable in the database from a skipped axis and from an axis answered able. Three distinct states, queryable.
A skipped axis has a non null reason, enforced by constraint.
Migrating a legacy R code produces has_underlying_measurement = false and no fabricated measurement anywhere.
A network failure at any point during entry loses no data. Test with a simulated partition at each field.
Signature is blocked while any axis is neither answered nor skipped, enforced server side, verified by calling the API directly with the interface bypassed.

SECTION 9. OPEN ITEMS. NOT YOURS TO RESOLVE. REPORT AND STOP.
Do not invent an answer to any of these. If one blocks you, report it and stop.
Board contradiction on C050S required fields. The workbook marks about twenty capability elements Always Required, while the board’s own interface design document rule SR2 hides and clears the same block when the worker has returned to work. Until the board answers, treat an element hidden by an applicable rule as exempt from the required check and log every exemption. Craig is asking the board.
Role code NP. The board’s contract table permits nurse practitioners on contract 000084, but NP is absent from the board’s nine Practitioner Role Codes. Block nurse practitioner configuration with an explanatory message. Do not work around it.
Ambient recording retention. Specified as 30 days pending counsel. Do not implement a different figure.
Whether practitioner_sees_all defaulting to true is correct under the Health Information Act. Build the flag, default it true, and flag the question.
Who the named human is that a batch failure raises to at 2 AM in a five person clinic. Build the notification, leave the recipient configurable.

SECTION 10. WHAT THIS PROMPT DOES NOT BUILD
The Form Engine prompt builds the form engine, code list loader and validation. The Screens prompt builds the screens. This prompt builds the measurement model, band derivation, the R code migration and the axis resolver only.
If you find yourself building a screen, stop. You are in the wrong prompt.