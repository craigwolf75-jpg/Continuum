# PROPOSED occupational dataset v1 (tranche one frame only)

Status: PROPOSED. This file is a fallback FRAME for Craig's line-by-line review. It is not canon. It is not imported by the engine. It does not replace live synth data.

Proposed occupational data never seeds without line-by-line sign-off. Restated here because this is the standing rule for the whole document: no `PROP-` row enters a database, a seed SQL file, or an employer publish until Craig signs the frame line by line, then signs tranche two duties, and only then authorizes a seed mission.

Identifiers in this frame use `PROP-POS-`, `PROP-FAC-`, and `PROP-CAT-`. They are not `SYNTH-` and they are not canon. Live synth stays in `clinical/db/occupational_synth.data.mjs` (`SYNTH-POS-01` through `SYNTH-POS-06`). Do not edit that file in 45a. Do not invent 209 rated duty rows.

UNKNOWN is never rendered as 0. A missing rating is UNKNOWN. A rated zero-stress demand is LIMITED (see Section 3), which is a real band, not a missing value.

No em dashes and no en dashes.

## 1. Purpose and standing

Proposed occupational data never seeds without line-by-line sign-off.

Prompt 43a decided that the canonical 45 positions, 209 modified duties, and 27 demand factors come only from the canonical document, which is pending from Craig. The live repo holds a small synthetic fixture so duty-match verdicts can be tested without a single fake canon row. `clinical/engine/occupational.mjs` `assertCanonicalForPublish` refuses to publish an employer view against a synthetic dataset (`SYNTHETIC` flag or `SYNTH-` position IDs) unless a test override is set.

This markdown is the proposed frame that can become that canonical document after sign-off. It is tranche one: positions, demand factors, and duty categories. Tranche two (209 duty ratings) is scoped after frame approval. Drafting 209 ratings against an unapproved frame produces review debt that a single renamed factor invalidates.

What this file is not:

- Not a seed.
- Not an import the engine reads.
- Not a replacement for `occupational_synth.data.mjs`.
- Not a publishable employer dataset.
- Not 209 rated duty rows.

## 2. Positions (45), four divisions

Proposed occupational data never seeds without line-by-line sign-off.

Count: 45 positions. Split: Security 16, Cash 9, Aviation 10, Warehousing 10.

Titles that already exist in `clinical/db/occupational_synth.data.mjs` are reused exactly so the frame and the fixture stay aligned on those six names: Gatehouse Officer, Mobile Patrol, Warehouse Handler, Cash Room Clerk, Aviation Screener, Reception Desk. Remaining titles are plausible GardaWorld-adjacent role names, labeled PROPOSED.

Every row below is PROPOSED. IDs are `PROP-POS-01` through `PROP-POS-45`. They are not `SYNTH-` and they are not canon.

### 2.1 Security (16) `PROP-POS-01` through `PROP-POS-16`

| ID | Title | Alignment | Status |
| --- | --- | --- | --- |
| PROP-POS-01 | Gatehouse Officer | matches synth SYNTH-POS-01 | PROPOSED |
| PROP-POS-02 | Mobile Patrol | matches synth SYNTH-POS-02 | PROPOSED |
| PROP-POS-03 | Reception Desk | matches synth SYNTH-POS-06 | PROPOSED |
| PROP-POS-04 | Static Site Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-05 | Control Room Operator | GardaWorld-adjacent | PROPOSED |
| PROP-POS-06 | Access Control Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-07 | Alarm Response Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-08 | Concierge Security Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-09 | Night Watch Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-10 | Event Security Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-11 | Retail Loss Prevention Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-12 | Hospital Security Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-13 | Construction Site Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-14 | Supervisor, Site Security | GardaWorld-adjacent | PROPOSED |
| PROP-POS-15 | K9 Patrol Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-16 | Emergency Response Officer | GardaWorld-adjacent | PROPOSED |

### 2.2 Cash (9) `PROP-POS-17` through `PROP-POS-25`

| ID | Title | Alignment | Status |
| --- | --- | --- | --- |
| PROP-POS-17 | Cash Room Clerk | matches synth SYNTH-POS-04 | PROPOSED |
| PROP-POS-18 | Cash in Transit Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-19 | Vault Attendant | GardaWorld-adjacent | PROPOSED |
| PROP-POS-20 | ATM Replenishment Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-21 | Armoured Vehicle Driver | GardaWorld-adjacent | PROPOSED |
| PROP-POS-22 | Armoured Vehicle Messenger | GardaWorld-adjacent | PROPOSED |
| PROP-POS-23 | Cash Processing Operator | GardaWorld-adjacent | PROPOSED |
| PROP-POS-24 | Coin Room Attendant | GardaWorld-adjacent | PROPOSED |
| PROP-POS-25 | Cash Logistics Supervisor | GardaWorld-adjacent | PROPOSED |

### 2.3 Aviation (10) `PROP-POS-26` through `PROP-POS-35`

| ID | Title | Alignment | Status |
| --- | --- | --- | --- |
| PROP-POS-26 | Aviation Screener | matches synth SYNTH-POS-05 | PROPOSED |
| PROP-POS-27 | Checkpoint Supervisor | GardaWorld-adjacent | PROPOSED |
| PROP-POS-28 | Hold Baggage Screener | GardaWorld-adjacent | PROPOSED |
| PROP-POS-29 | Access Point Controller | GardaWorld-adjacent | PROPOSED |
| PROP-POS-30 | Cabin Baggage Screener | GardaWorld-adjacent | PROPOSED |
| PROP-POS-31 | Aircraft Search Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-32 | Restricted Area Patrol | GardaWorld-adjacent | PROPOSED |
| PROP-POS-33 | Passenger Assistance Officer | GardaWorld-adjacent | PROPOSED |
| PROP-POS-34 | Screening Equipment Operator | GardaWorld-adjacent | PROPOSED |
| PROP-POS-35 | Aviation Shift Lead | GardaWorld-adjacent | PROPOSED |

### 2.4 Warehousing (10) `PROP-POS-36` through `PROP-POS-45`

| ID | Title | Alignment | Status |
| --- | --- | --- | --- |
| PROP-POS-36 | Warehouse Handler | matches synth SYNTH-POS-03 | PROPOSED |
| PROP-POS-37 | Forklift Operator | GardaWorld-adjacent | PROPOSED |
| PROP-POS-38 | Receiving Clerk | GardaWorld-adjacent | PROPOSED |
| PROP-POS-39 | Shipping Clerk | GardaWorld-adjacent | PROPOSED |
| PROP-POS-40 | Inventory Counter | GardaWorld-adjacent | PROPOSED |
| PROP-POS-41 | Order Picker | GardaWorld-adjacent | PROPOSED |
| PROP-POS-42 | Packing Station Attendant | GardaWorld-adjacent | PROPOSED |
| PROP-POS-43 | Loading Dock Attendant | GardaWorld-adjacent | PROPOSED |
| PROP-POS-44 | Returns Processor | GardaWorld-adjacent | PROPOSED |
| PROP-POS-45 | Warehouse Shift Lead | GardaWorld-adjacent | PROPOSED |

Count check: 16 + 9 + 10 + 10 = 45. If Craig drops or renames a title, the count must be re-proven in the same sign-off. Do not silently pad with a duplicate.

These 45 rows have no duty ratings attached. Positions without ratings are a frame, not a match surface.

## 3. Demand factors (27), three groups, one four-band scale

Proposed occupational data never seeds without line-by-line sign-off.

Count: 27 factors in three groups of 9. Axis keys reuse `ELEMENT_NAME_TO_AXIS` in `clinical/engine/measurement.mjs`, the `clinical.functional_axis` enum, `clinical.functional_grasping`, `clinical.functional_reaching`, `clinical.functional_environment`, and `clinical.functional_measurement.work_hours_per_day`.

### 3.1 The measurement model this frame must not contradict

From `clinical/engine/measurement.mjs` and `clinical/engine/dutymatch.mjs`:

- `WEIGHT_BANDS` = LIMITED, LIGHT, MEDIUM, HEAVY. There is no fifth band.
- `BAND_CAPACITY_KG` = LIMITED 5, LIGHT 10, MEDIUM 20, HEAVY Infinity.
- `deriveWeightBand` rounds down. A measured 8 kg becomes LIMITED (5 kg capacity). A measured 12 kg becomes LIGHT (10 kg). A measured 20 kg is MEDIUM. Above 20 kg is HEAVY.
- Duty match (`dutymatch.mjs`) matches against the DERIVED band, never raw kilograms. Matching against raw kg would compute safe work above what the board was told.

Demand kinds already in the live synth fixture: `weight`, `hours`, `binary`.

This frame uses one four-band scale for all 27 factors: LIMITED, LIGHT, MEDIUM, HEAVY. Hours and binary / environment values map onto those four names so one scale feeds the match. Do not invent a fifth band (no MODERATE, no NONE, no N/A as a band). Missing values are UNKNOWN, not a band, and never display as 0.

### 3.2 How each demand kind maps onto LIMITED, LIGHT, MEDIUM, HEAVY

These mappings are PROPOSED for Craig's sign-off. They are not seeded.

Weight (kilograms the duty imposes), mapped through `deriveWeightBand` then `BAND_CAPACITY_KG`:

- LIMITED: derived band LIMITED, matching capacity 5 kg.
- LIGHT: derived band LIGHT, matching capacity 10 kg.
- MEDIUM: derived band MEDIUM, matching capacity 20 kg.
- HEAVY: derived band HEAVY, matching capacity Infinity.
- Missing kg: UNKNOWN. Do not store 0 to mean missing. In live synth, a demand of 0 on a weight axis means the duty rates the axis but does not stress it. That rated zero-stress case maps to LIMITED (lowest demand), not to UNKNOWN.

Hours (hours the duty demands), PROPOSED windows so hours share the same four names:

- LIMITED: more than 0 hours and up to 2 hours.
- LIGHT: more than 2 hours and up to 4 hours.
- MEDIUM: more than 4 hours and up to 6 hours.
- HEAVY: more than 6 hours, including a full shift.
- Missing hours: UNKNOWN, never 0.
- Rated 0 hours (synth "rates but does not stress"): LIMITED, not UNKNOWN.

Binary and environment / exposure, PROPOSED so a flag can feed the same match:

- LIMITED: rated, not required, or incidental only (synth binary `required: false`).
- LIGHT: brief or occasional exposure.
- MEDIUM: regular exposure during the shift.
- HEAVY: continuous, or essential to the duty (synth binary `required: true` is at least HEAVY until Craig rates intensity).
- Missing flag or unanswered axis: UNKNOWN, never 0, never coerced to LIMITED.

`work_hours_per_day` uses the hours mapping above. It lives on `clinical.functional_measurement.work_hours_per_day`, not on the `functional_axis` enum. It is still a demand factor in this frame.

### 3.3 Group 1: Posture and mobility (9)

| ID | Axis key | Source in the measurement model | Demand kind | Status |
| --- | --- | --- | --- | --- |
| PROP-FAC-01 | sitting | functional_axis / ELEMENT_NAME_TO_AXIS Sitting | hours | PROPOSED |
| PROP-FAC-02 | standing | functional_axis / Standing | hours | PROPOSED |
| PROP-FAC-03 | walking | functional_axis / Walking | hours | PROPOSED |
| PROP-FAC-04 | bending | functional_axis / Bending | hours or binary per Craig | PROPOSED |
| PROP-FAC-05 | twisting | functional_axis / Twisting | hours or binary per Craig | PROPOSED |
| PROP-FAC-06 | kneeling_squatting | functional_axis / Kneeling/Squatting | hours or binary per Craig | PROPOSED |
| PROP-FAC-07 | climbing | functional_axis / Climbing | binary (synth) or hours | PROPOSED |
| PROP-FAC-08 | driving | functional_axis / Driving | hours | PROPOSED |
| PROP-FAC-09 | work_hours_per_day | functional_measurement.work_hours_per_day | hours | PROPOSED |

### 3.4 Group 2: Handling and force (9)

| ID | Axis key | Source in the measurement model | Demand kind | Status |
| --- | --- | --- | --- | --- |
| PROP-FAC-10 | lifting_general | functional_axis / Lifting | weight | PROPOSED |
| PROP-FAC-11 | lifting_floor_to_waist | functional_axis / Lifting - Floor to waist | weight | PROPOSED |
| PROP-FAC-12 | lifting_waist_to_shoulder | functional_axis / Lifting - Waist to shoulder | weight | PROPOSED |
| PROP-FAC-13 | lifting_above_shoulder | functional_axis / Lifting - Above shoulder | weight | PROPOSED |
| PROP-FAC-14 | pushing_pulling | functional_axis / Pushing/Pulling | weight or binary | PROPOSED |
| PROP-FAC-15 | overhead_reaching | functional_axis / Overhead reaching | binary (synth) or weight | PROPOSED |
| PROP-FAC-16 | grasping_left | functional_grasping side left / Grasping - left | binary (able or unable on the form) | PROPOSED |
| PROP-FAC-17 | grasping_right | functional_grasping side right / Grasping - right | binary (able or unable on the form) | PROPOSED |
| PROP-FAC-18 | reaching_left_above | functional_reaching left + above / Reaching - Above left shoulder | binary (able or unable on the form) | PROPOSED |

Four sided reaching exists on C050S / C151S and in `ELEMENT_NAME_TO_AXIS`:

- `reaching_left_above`
- `reaching_left_below`
- `reaching_right_above`
- `reaching_right_below`

This frame picks `reaching_left_above` as the documented representative so the factor count stays exactly 27. The other three sided-reaching keys remain real measurement axes. They are not deleted. They are out of the tranche-one factor count. If Craig wants all four sided-reaching keys inside the 27, a different representative set must be chosen in the same sign-off so the count remains 27 (swap, do not add a 28th).

### 3.5 Group 3: Environment and exposure (9)

| ID | Axis key | Source in the measurement model | Demand kind | Status |
| --- | --- | --- | --- | --- |
| PROP-FAC-19 | environment_cold | functional_environment.cold | binary / exposure band | PROPOSED |
| PROP-FAC-20 | environment_hot | functional_environment.hot | binary / exposure band | PROPOSED |
| PROP-FAC-21 | environment_wet | functional_environment.wet | binary / exposure band | PROPOSED |
| PROP-FAC-22 | environment_dry | functional_environment.dry | binary / exposure band | PROPOSED |
| PROP-FAC-23 | environment_dust | functional_environment.dust | binary / exposure band | PROPOSED |
| PROP-FAC-24 | environment_lighting | functional_environment.lighting | binary / exposure band | PROPOSED |
| PROP-FAC-25 | environment_noise | functional_environment.noise | binary / exposure band | PROPOSED |
| PROP-FAC-26 | grasping_vibration | functional_grasping.vibration | binary / exposure band | PROPOSED |
| PROP-FAC-27 | grasping_repetitive | functional_grasping.repetitive | binary / exposure band | PROPOSED |

The measurement model also has a single `environment` axis on the form map (`environment_flags`) and `functional_grasping.prolonged`. Those are not extra factors in this 27. Prolonged grasping is a modifier, not a 28th factor, unless Craig swaps it in during sign-off.

Count check: 9 + 9 + 9 = 27.

### 3.6 Display rule for UNKNOWN

A surface that reads these factors must render UNKNOWN when the rating is missing. It must not render 0, 0 kg, 0 hours, or false as if those were measured. 0 is only lawful when a rater has rated the duty as zero-stress (LIMITED). That is a signed rating, not a default.

## 4. Duty categories (26)

Proposed occupational data never seeds without line-by-line sign-off.

Count: 26 categories. Categories 1, 2, and 3 are deliberately the GardaWorld universal offer from P38-07 (`specs/CONTINUUM_PROMPT_38.md`, `deploy/CONTINUUM_38A_MODULE_TESTS.js`): (1) online training modules, (2) completing sales leads, (3) office duties. Those three are the day-zero universal offer made to every injured worker at claim start, distinct from site-specific duty matching.

The remaining 23 are frame categories only (gatehouse, patrol, cash, aviation screening, warehouse handling, and related). They have no rated duty rows.

No category below is a match line. A category is a bucket Craig will later hang tranche-two duties on.

| ID | Category name | Source | Status |
| --- | --- | --- | --- |
| PROP-CAT-01 | online training modules | P38-07 GardaWorld universal offer | PROPOSED |
| PROP-CAT-02 | completing sales leads | P38-07 GardaWorld universal offer | PROPOSED |
| PROP-CAT-03 | office duties | P38-07 GardaWorld universal offer | PROPOSED |
| PROP-CAT-04 | gatehouse monitoring | frame | PROPOSED |
| PROP-CAT-05 | camera and access control | frame | PROPOSED |
| PROP-CAT-06 | visitor processing | frame | PROPOSED |
| PROP-CAT-07 | foot patrol | frame | PROPOSED |
| PROP-CAT-08 | vehicle patrol | frame | PROPOSED |
| PROP-CAT-09 | alarm response | frame | PROPOSED |
| PROP-CAT-10 | cash counting and reconcile | frame | PROPOSED |
| PROP-CAT-11 | coin and bag transfer | frame | PROPOSED |
| PROP-CAT-12 | vault operations | frame | PROPOSED |
| PROP-CAT-13 | cash in transit | frame | PROPOSED |
| PROP-CAT-14 | ATM service | frame | PROPOSED |
| PROP-CAT-15 | aviation screening station | frame | PROPOSED |
| PROP-CAT-16 | bag handling at screening | frame | PROPOSED |
| PROP-CAT-17 | aircraft search | frame | PROPOSED |
| PROP-CAT-18 | hold baggage screening | frame | PROPOSED |
| PROP-CAT-19 | warehouse floor handling | frame | PROPOSED |
| PROP-CAT-20 | overhead shelf work | frame | PROPOSED |
| PROP-CAT-21 | receiving and putaway | frame | PROPOSED |
| PROP-CAT-22 | shipping and load out | frame | PROPOSED |
| PROP-CAT-23 | forklift and powered equipment | frame | PROPOSED |
| PROP-CAT-24 | inventory count | frame | PROPOSED |
| PROP-CAT-25 | packing and sort | frame | PROPOSED |
| PROP-CAT-26 | control room monitoring | frame | PROPOSED |

Count check: 3 universal + 23 frame = 26.

These 26 categories do not contain ratings. A later tranche that adds duties must name a category ID from this list (or a Craig-signed replacement) so a renamed factor cannot silently orphan a rating.

## 5. Duty ratings (209): tranche two, after frame approval

Proposed occupational data never seeds without line-by-line sign-off.

Scope: 209 duty ratings are TRANCHE TWO AFTER frame approval. This file does not invent the 209 rated rows.

Why not draft them now:

1. The 27 factors are unapproved. If Craig renames `reaching_left_above`, splits environment lighting, or moves `work_hours_per_day` out of the 27, every rating that cited the old key is wrong.
2. The 26 categories are unapproved. If Craig merges cash categories or splits patrol, ratings hung on the old buckets become review debt.
3. The 45 titles are unapproved. A dropped title orphans its duties. An added title needs duties the draft would not have.
4. Duty match is safety-critical. A guessed 18 kg stocking demand that never went through Craig is how a worker gets put on a duty above the board band.
5. `assertCanonicalForPublish` exists so invented canon never reaches an employer. Drafting 209 rows in markdown makes them look like a dataset. They are not.

Tranche two, when opened, will rate duties against the signed frame: each duty names one `PROP-CAT-*` (or a signed successor), one or more `PROP-POS-*`, and a LIMITED / LIGHT / MEDIUM / HEAVY (or UNKNOWN) value on each of the 27 factors that apply. Missing factor: UNKNOWN, never 0. Until that mission exists, the rating count is 0 rows, and the scoped total remains 209 after approval, not 209 invented now.

Live synth duties (the small fixture under `SYNTH-DUTY-*`) stay where they are. They exercise verdict paths. They are not the 209.

## 6. Approval workflow

Proposed occupational data never seeds without line-by-line sign-off.

Order is binding. Do not skip a step. Do not seed in parallel with review.

1. Craig line-by-line sign-off of this frame: 45 positions, 27 factors (including the hours and binary mappings onto LIMITED / LIGHT / MEDIUM / HEAVY), and 26 duty categories. Corrections land in this document (or a successor frame file) in the same mission as the sign-off. Partial sign-off is not sign-off.
2. Tranche two: Craig line-by-line sign-off of the 209 duty ratings written against the signed frame. A factor rename in step 1 forces a rewrite of tranche two, which is why tranche two waits.
3. Seed only after that sign-off, in a later human-approved mission. Seed IDs must not be `SYNTH-` and must not pretend they were always canon. The live synth fixture is not replaced until Craig says the canonical set supersedes it. 45a does not seed.
4. Publish only after seed and only through `clinical/engine/occupational.mjs` `assertCanonicalForPublish`. That function refuses a synthetic dataset (`SYNTHETIC` or `SYNTH-` prefix) without an explicit test override. Proposed data is the same class of refuse: it must not publish until it is the signed canonical set. Current code keys the refuse on `SYNTHETIC` / `SYNTH-`. This markdown is not imported, so `PROP-` rows cannot publish from 45a. A later seed mission that introduces `PROP-` or drops the SYNTH flag must keep the publish guard closed until Craig's canonical IDs replace them. 45a does not edit `occupational.mjs`.

Craig sign-off box (frame only):

- [ ] 45 positions (16 Security, 9 Cash, 10 Aviation, 10 Warehousing), titles accepted or corrected in this file
- [ ] 27 factors, three groups of 9, four-band scale accepted, UNKNOWN never 0
- [ ] Representative reaching key `reaching_left_above` accepted, or swapped inside the 27
- [ ] 26 duty categories, including P38-07 items 1 through 3, accepted
- [ ] No 209 ratings were smuggled into this frame
- [ ] No seed, no synth replacement, no employer publish

Signed (Craig): ________________________  Date: __________

## 7. What this file must not cause

Proposed occupational data never seeds without line-by-line sign-off.

- Do not replace live synth data.
- Do not import this markdown into the engine.
- Do not add a generator that reads this file.
- Do not apply SQL for occupational rows in the Montreal project (which does not exist in this 45a run).
- Do not widen Prompt 45. No Ontario or BC occupational packs.
- Do not treat a PROPOSED title as a worker fact or as Olympus telemetry.

## 8. Count ledger (re-prove after any edit)

Proposed occupational data never seeds without line-by-line sign-off.

- Positions: 45 (Security 16, Cash 9, Aviation 10, Warehousing 10)
- Demand factors: 27 (Group 1: 9, Group 2: 9, Group 3: 9)
- Duty categories: 26 (P38-07 universal 3, frame 23)
- Duty ratings in this file: 0 (209 scoped as tranche two after frame approval)
- Four-band scale: LIMITED, LIGHT, MEDIUM, HEAVY (no fifth band)
- Band capacities (weight): 5, 10, 20, Infinity
- Live synth positions left untouched: 6 (`SYNTH-POS-01` through `SYNTH-POS-06`)
