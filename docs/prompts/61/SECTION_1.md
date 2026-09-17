# Prompt 61 Section 1: design decision and prerequisite inspection

Inspected on 2026-09-17 from tip
`5a94eb6cb62a8f1f12adf88b7cafaf1e9e63d1e9`
(`Prompt 53 holds released (do not ship) (#167)`).
Branch `cursor/prompt-61-psychological-injury-9b8c`.

Read only for this document. No write to product code, no
migration apply, no seed, no live apply, no credential use,
no test authoring in this dispatch. This file is written
first, before product code.

Calliope owns [REGISTER.md](REGISTER.md) and
[STOPS.md](STOPS.md). This inspection does not overwrite
those.

No em dashes or en dashes anywhere. Athena does not ship.
Do not claim Argus CLEAN. Prompt 53 holds were released
2026-09-16 by Craig. Hold lift is not an auto-execute.
Do not invent G1 closed. Do not invent REV 2.

**Headline.** Continuum must manage return to work for
psychological injury and collect nothing about the person's
mental health. The mechanism is schema absence, not a
toggle: for this case type the symptom check-in does not
exist. Worker surfaces that ask how the person feels,
symptoms, mood, sleep, energy, stress, wellbeing,
confidence, or whether anything made things worse are
REMOVED. Morning duty acknowledgment, secure messaging,
document upload, and hours confirmation are RETAINED.
There is still no first-class `case_type` on hub or
physician case records. Prompt 60 already built the C1447
matrix: verify and skip. Psych-specific restriction codes,
employer conduct measurement, claim-date snapshot, silent
days, named individual restriction, and board-form-only
evidence assembly are absent. Hub auth remains UNVERIFIED
(STOP for ship, not for this draft).

---

## Headline answers

1.1 **Symptom check-in exists today as a scored or
    provocation record, not as an absent capability.**
    `worker.check_in.reported_pain`,
    `clinical.prompt60_checkin` provocation fields, the
    worker-app CheckIn, `deploy/app/index.html` pain /
    mobility / fatigue / confidence sliders, and
    `deploy/worker/check-in.html` all exist. None of those
    is gated by a psychological injury case type. Gap, not
    a build in this file.
1.2 **REMOVED vs RETAINED (explicit).** See the surface
    table below. Removed: every symptom, mood, sleep,
    energy, stress, wellbeing, confidence, or "made worse"
    question. Retained: morning duty acknowledgment,
    secure messaging with the coordinator, document
    upload, hours confirmation.
1.3 **No first-class hub `case_type`.** `public.injuries`
    has free-text `injury_type`. `worker.pathway_type`
    already includes `PSYCHOLOGICAL`. That enum is not a
    schema-level removal of symptom check-in.
1.4 **C1447 Section 2 is present from Prompt 60.** Thirteen
    labels, retrieved intensity definitions, derived
    frequency bands, authorship sources, and SYNTH
    cognitive ratings are in repo. Accommodations
    vocabulary (Prompt 61 Section 2.4) is not. Verify and
    skip the built matrix. Do not rebuild it.
1.5 **Prompt 60 restriction catalogue is concussion-first.**
    Shared codes (`no_lone_work`,
    `no_night_or_rotating_shift`, `graduated_hours`,
    `supervised_or_partnered_only`, `scheduled_rest_breaks`,
    `no_safety_critical_decision_making`) exist. Psych
    codes (`no_contact_with_specified_individual`,
    `no_assignment_to_specified_site`,
    `no_public_facing_duty`,
    `no_conflict_or_crisis_response_duty`,
    `reduced_caseload_or_task_volume`,
    `predictable_schedule_required_no_on_call`) do not.
1.6 **Hours ladder exists and does not auto-advance.**
    Employer conduct report, claim-date snapshot, silent
    days module, named individual restriction, and
    board-form-only assembly for this case type do not.

---

## Prompt 53 holds were released 2026-09-16 by Craig

From [../53/HOLDS.md](../53/HOLDS.md). Former Prompt 53
holds are no longer binding under Prompt 53. Hold lift
is not an auto-execute. Not relaxed here as a ship.

Named human dispatch still required before Montreal,
Bedrock, non-SYNTH seed, or live schema apply.

- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands.
- Do not invent REV 2. Do not start a Prompt 47 redo
  from invented contents.
- Do not invent G1.
- Athena does not ship.

`PSYCH_CAPTURE_PRODUCTION_RELEASE` remains false
(`supabase/migrations/20260915140000_worker_schema.sql`
lines 66 to 71). This inspection does not flip it. A
later Prompt 61 build must not write
`worker.psych_capture` and must not add a code path that
flips the flag.

---

## The design decision (read before any product code)

Continuum manages the return to work for psychological
injury claims and collects NOTHING about the person's
mental health.

The mechanism that makes that auditable: FOR
PSYCHOLOGICAL INJURY CASES THE SYMPTOM CHECK-IN DOES NOT
EXIST AT THE SCHEMA LEVEL. Not minimised. Not opt in.
Not disabled by configuration. There is no toggle a
customer, an administrator, or a support engineer can
find, because the capability is absent for this case type
rather than switched off.

Diagnosis is not Continuum territory. WSIB Ontario
Chronic Mental Stress (15-03-14) and Traumatic Mental
Stress (15-03-02) name a physician, nurse practitioner,
psychologist, or psychiatrist as the regulated
professional who makes a DSM diagnosis. Continuum holds
no position on causation. A meaningful share of these
claims sit inside a live dispute about the employer's
own conduct. The product measures employer conduct and
work assignment only.

Concussion symptoms are task linked. Psychological
setbacks are not. Asking daily would be intrusive,
clinically risky, and operationally useless. That is why
the symptom check-in is removed here and why Prompt 60
kept a task-linked provocation record.

---

## Surfaces: REMOVED vs RETAINED

Report required by Prompt 61 Section 1.1. Inspected on
this tip. These are the live surfaces, not a proposed
build.

### REMOVED for psychological injury (must become absent)

If any of these remain offered, writable, or present in
API responses for this case type, the promise is broken.

| Surface | File | Exact evidence | Why removed |
|---|---|---|---|
| Scored worker check-in (pain, movement, fatigue, confidence) | `deploy/app/index.html` lines 231 to 251 | `How is your pain?`, `How well can you move it?`, `How is your fatigue?`, `How confident are you using it?` | Symptom, energy, confidence questions |
| Scored recovery_logs write | `deploy/app/index.html` lines 322 to 324 | `S.submitCheckIn({pain, mobility, fatigue, confidence, notes})` | Symptom scores |
| Prompt 60 provocation check-in | `worker-app/src/components/CheckIn.tsx` lines 227, 238, 263 | `Did any of those duties make your symptoms worse?`, `Which duty or duties made your symptoms worse?`, `Had that worsening settled` | Symptom / made-worse questions |
| Prompt 60 follow-up | `worker-app/src/components/CheckIn.tsx` line 162 | `Yesterday you said ... made your symptoms worse` | Symptom follow-up |
| Prompt 60 History | `worker-app/src/components/History.tsx` lines 6 to 16 | `made your symptoms worse` | Symptom history |
| Prompt 60 check-in store | `worker-app/src/lib/prompt60_checkin_store.ts` | provocation / follow-up records | Symptom record |
| Prompt 60 engine capture | `clinical/engine/prompt60_checkin.mjs` | `worsened_duties`, `settled_end_of_shift`, `provocationRecords` | Symptom record |
| Prompt 60 SQL check-in | `clinical/db/023_migration_prompt60_restriction_and_hours.sql` lines 50 to 62 | `clinical.prompt60_checkin` with `worsened_duties`, `settled_end_of_shift` | Symptom schema |
| Worker schema pain check-in | `supabase/migrations/20260915140000_worker_schema.sql` lines 105 to 125 | `worker.check_in.reported_pain`, `worker.check_in_answer.made_worse`, `settled_by_end` | Symptom schema |
| Psych capture table | same file lines 135 to 142 | `worker.psych_capture` (`question_key`, `answer`) | Psych capture. Flag is false. Table must stay unused |
| Worker check-in HTML | `deploy/worker/check-in.html` | Prompt 60 / Prompt 56 check-in surface | Symptom surface |
| Home always mounts CheckIn | `worker-app/src/components/Home.tsx` line 22 | `{injury.status !== 'signed_off' && <CheckIn />}` | No case-type gate |

`worker.psych_capture` existing as a table is not a
production release. Prompt 56 ships
`PSYCH_CAPTURE_PRODUCTION_RELEASE` as false with no flip
path. Prompt 61 must not weaken that.

### RETAINED for psychological injury (must stay functional)

If any of these are removed, the feature is broken.

| Surface | File | Exact evidence | Status on this tip |
|---|---|---|---|
| Morning duty acknowledgment | `deploy/app/index.html` lines 225 to 230 | `Today's restrictions`, button `I understand my duties today`, `cx_duty_ack` | Present on the demo worker app. **Absent from worker-app React.** Must be retained and made first-class for this case type |
| Hours confirmation (worker) | `worker-app/src/components/CheckIn.tsx` lines 272 to 276 | `Hours you worked today` | Present, but bundled inside the symptom check-in. Must be split out and retained without symptom questions |
| Hours confirmation (engine) | `clinical/engine/prompt60_hours_ladder.mjs` `recordActualHours` lines 174 to 183 | source `roster` or `worker_checkin`, `is_health_information: false` | Present. Psych path should record `roster` or `worker_confirmation` |
| Hours ladder, never auto-advance | `clinical/engine/prompt60_hours_ladder.mjs` `evaluateHoursStepDate` | planned date without authorisation HOLDS and raises outstanding action | Present. Reuse. Do not rebuild |
| Coordinator contact / get help | `deploy/worker/get-help.html` | `Reach a person`, `Ask to be contacted`, support resources for the province | Present. Closest existing secure-message / support surface. Not a full secure message thread |
| Document upload (board generator) | `supabase/functions/wcb-generator/index.ts` line 194 | storage upload of a generated file | Present as board generation, not as a worker document upload |
| Worker document upload | worker-app React | none | **Absent.** Must be retained as a capability: build it for this case type |
| Secure messaging thread | worker-app React | none | **Absent as a thread.** Get-help contact request exists. Must be retained as coordinator messaging |

**If you remove the morning duty acknowledgment you have
broken the feature. If you retain any symptom question you
have broken the promise.**

---

## Check 1. Case type field

**No `case_type` column on hub or physician case records.**

`public.injuries`
(`supabase/migrations/20260717120000_foundation_core.sql`
lines 109 to 126): `injury_type text` (free text),
`severity public.injury_severity`. No `case_type`.

`clinical.wcb_case`
(`clinical/db/016_migration_physician_foundation.sql`):
`part_of_body`, `nature_of_injury`. No `case_type`.

`worker.pathway_type`
(`supabase/migrations/20260915140000_worker_schema.sql`
lines 18 to 21):

```
'PHYSICAL', 'CONCUSSION', 'PSYCHOLOGICAL', 'CRITICAL_INCIDENT'
```

`worker.case_pathway` can store `PSYCHOLOGICAL`. That does
not remove `worker.check_in.reported_pain` for that
pathway. `worker.check_in.pathway_type` is a column on
the same symptom table. A pathway flag on a symptom table
is the opposite of schema-level absence.

POST `/cases` (`supabase/functions/cases/index.ts`) gates
on `severity` (`minor` / `moderate` / `major`), not on
type. A caller can persist any `injury_type` string.

Demo seed (`deploy/store.js` line 59):
`injury_type: 'msk_strain'`. Do not recast Worker 15 or
Worker 08 as psychological injury.

**Conclusion.** No first-class psychological injury case
type that makes symptom check-in absent. Record as a gap.

---

## Check 2. Prompt 60 C1447 matrix (verify, do not rebuild)

Present on this tip. Peer of this prompt. Section 2 of
Prompt 61 says: if Prompt 60 already ran, verify and skip.

| Prompt 61 Section 2 item | Present? | Evidence |
|---|---|---|
| 2.1 Thirteen C1447 labels | yes | `clinical/engine/c1447_factors.mjs` `C1447_FACTORS` ids 1 to 13. Labels match [../60/C1447_VERIFICATION.md](../60/C1447_VERIFICATION.md) |
| 2.1 Custom slots 14 and 15 | yes | `CUSTOM_DEMAND_SLOTS` keeps `14.Additional tasks:` and `15. Additional tasks:` without normalising |
| 2.2 intensity low / moderate / high | yes | Retrieved definitions stored, including OCR artefacts (`difference`, `ot be`, `and/r`, `attention of concentration`) |
| 2.2 frequency_percent raw, frequency_band derived | yes | `frequencyBandFromPercent`. 5.5 is occasional. Missing percent is UNKNOWN, never 0 |
| 2.2 not_daily independent boolean | yes | `makeCognitiveScore` |
| 2.3 scored_by, scored_on, source | yes | `tenant_authored` / `ai_drafted` / `unscored`. unscored is explicit |
| 2.3 SYNTH ratings on 6 positions, 13 duties | yes | `clinical/db/occupational_synth.data.mjs`. `SYNTHETIC = true` |
| 2.4 C1447 accommodations vocabulary | **no** | Grep of `clinical/` for accommodation / caseload / workplace-level returns zero product rows |

Intensity path taken by Prompt 60: retrieved definitions
stored. No customer-facing board alignment claim.
Prompt 60 Section 8.2 / Prompt 61 Section 10.3 stay with
Craig.

**Verdict.** Section 2.1 to 2.3: VERIFY and SKIP. Do not
rebuild `c1447_factors.mjs`. Section 2.4 is a gap: a later
build may add accommodations vocabulary only. Do not
invent a second matrix.

`gh` / remote Prompt 61 product tree: this folder did not
exist at inspection start. Prompt 60 REGISTER still said
Prompt 61 was not in the repository. That is no longer
true once this folder is written. Do not invent a second
C1447.

---

## Check 3. Restriction codes

Prompt 60 catalogue
(`clinical/engine/prompt60_restriction_codes.mjs`
`PROMPT60_RESTRICTION_CODES`):

Present and reusable: `no_lone_work`,
`no_night_or_rotating_shift`, `graduated_hours`,
`supervised_or_partnered_only`, `scheduled_rest_breaks`,
`no_safety_critical_decision_making`.

Absent (Prompt 61 Section 3):
`no_contact_with_specified_individual`,
`no_assignment_to_specified_site`,
`no_public_facing_duty`,
`no_conflict_or_crisis_response_duty`,
`reduced_caseload_or_task_volume`,
`predictable_schedule_required_no_on_call`.

Legacy `clinical.internal_restriction_code` still has R19
`Psychological restrictions` as a free-text phrase
(`clinical/db/012_seed_functional_measurement.sql`). That
is not this catalogue. Do not rewrite the varchar(10)
table. Prefer amending the Prompt 60 catalogue.

Ontario FAF 2647A note already recorded in Prompt 60:
no cognitive or psychological fields. Transcription must
accept functional abilities form, clinic note, specialist
letter, or other.

---

## Check 4. Match engine

`clinical/engine/prompt60_match.mjs` already:

- three-way split: safe / conditional / excluded
- every exclude names `Excluded by: [restriction]`
- unmapped restriction is a loud coordinator fail
- unscored tested factor is
  `Conditional: not yet assessed on this demand factor`
- past `review_or_expiry_date` is
  `Conditional: restriction past review date`
- assignment-only night / rotating shift
- binding constraint fact when more than half of duties
  are excluded

Missing mappings (Prompt 61 Section 4.3):

- `no_public_facing_duty` tests factors 10 and 11, exclude
  moderate or high
- `no_conflict_or_crisis_response_duty` tests factor 12,
  exclude any intensity above not_required (low, moderate,
  or high)
- `reduced_caseload_or_task_volume` tests factors 3 and 8,
  conditional not excluded, value shown
- `predictable_schedule_required_no_on_call` tests the
  assignment, not the duty
- `no_assignment_to_specified_site` tests assignment site
- `no_contact_with_specified_individual` tests the roster
  (Section 6)

SYNTH default cognition sets every factor to low / 10
percent unless overridden. Factor 12 is therefore present
above not_required on every current SYNTH duty. A later
build may amend one SYNTH duty to frequency 0
(not_required) so the conflict rule can show a safe line.
That is an amend, not a rebuild of C1447.

---

## Check 5. What exists instead of a check-in

| Prompt 61 Section 5 item | Present? | Evidence |
|---|---|---|
| 5.1 Employer conduct: days since last contact, longest gap | no | No module |
| 5.1 Modified role formally offered vs discussed (two fields) | no | No module |
| 5.1 Days from restriction issued to first modified shift | no | No module |
| 5.1 Hours plan followed or departed, by how much | no | Hours ladder exists; conduct comparison does not |
| 5.1 Same site / shift pattern / supervisor vs claim-date snapshot | no | Worker record has no claim-date snapshot of site, shift, or supervisor |
| 5.1 Aggregate site report, never a named manager score, k-min suppress | no | `k_min` default 5 lives in Prompt 21 / 27 specs, not in a psych conduct report |
| 5.2 Silent days (no contact, no clinical update, no duty change, no employer touch) | no | No silent-days module |
| 5.3 Graduated hours ladder, never auto-advance | yes | `prompt60_hours_ladder.mjs`. Reuse |
| 5.3 Actual hours source recorded | partial | `recordActualHours` exists; psych path must not depend on symptom check-in |
| 5.4 Board evidence assembly, form fields only, no auto submit | no | `wcb-generator` generates a file. No psych-specific form-field assembler that refuses to widen or auto-submit |

---

## Check 6. Named individual restriction

**Absent.** Grep for
`no_contact_with_specified_individual`,
`named_individual`, and `co rostered` in product code
returns zero.

Section 6 is operationally necessary and legally
delicate. A later build may implement the specified
shape pending counsel (restricted field, coordinator and
roster visibility, scheduler constraint without a reason,
access log, no aggregate or export, tenant disable flag).
Counsel must review the field and the privacy officer
wording before any real tenant. REPORT AND STOP. Do not
invent the privacy officer wording. Do not resolve
Section 10.1 in code.

---

## Check 7. Prohibited instruments and inference

Grep of product pathway files on this tip:

- PHQ / GAD / DASS / Kessler / WHO-5 / WHODAS / C-SSRS:
  zero product hits. `clinical/db/003_seed_form_elements.sql`
  has a C151 `Depressed mood` form element (board form
  seed, not a Prompt 61 pathway). Do not import it.
- Sentiment / emotion / tone classification on free text:
  no psych-case classifier found.
- `PSYCH_CAPTURE_PRODUCTION_RELEASE` is false.
- Prompt 44 AI bounds remain. Do not weaken them.
- Behavioural inference from login frequency, typing, or
  acknowledgment timing: no such module found. Do not
  add one.
- `at risk` is banned on product surfaces
  (`deploy/lockdown-guard.test.mjs` does not list it;
  Prompt 60 / Section 0 do).

A later Prompt 61 pathway search (Section 9.10) must
return zero word-bounded hits for phq, gad7, gad-7, dass,
kessler, k10, who5, whodas, cssrs, mood, wellbeing,
distress, sentiment, risk_score. C1447 factor 11 contains
the word `distressed` inside Prompt 60 files. Word-bounded
`distress` does not match `distressed`. Do not copy
banned tokens into Prompt 61 product files.

---

## Check 8. Crisis support

`deploy/worker/get-help.html` already has:

- a persistent emergency dial
- worker-initiated routes to a coordinator or care team
- a support-resources link for the worker's province
- no automated scan of message text

That is closer to Section 8.2 than to a detector. Gaps:

- the link is not on every worker surface for every case
  type (worker-app React has no persistent support link)
- coordinator-triggered escalation (one click by a human
  coordinator to a named human recipient) is not a first-
  class engine action
- per-jurisdiction resource list is not confirmed by
  Craig (Section 10.4). STOP. Do not invent the live list
- no automated detection module was found. Do not build
  one. Scanning messages is content classification
  (Section 7.3)

---

## Hub authentication

**UNVERIFIED. STOP for ship. Not a stop for this draft.**

Nothing in the repository states that Craig verified the
Prompt 33 hub authentication fix. Same finding as
[../60/SECTION_1.md](../60/SECTION_1.md) and
[../58/SECTION_1.md](../58/SECTION_1.md).

---

## Occupational fixture honesty

Live fixture is SYNTH only: 6 positions, 13 duties, all
`SYNTH-` prefixed, `SYNTHETIC = true`. Scoring, importing,
or implying a score of 209 GardaWorld duties is STOPPED.
Those 209 duties are not in this repository. Do not seed
beyond SYNTH. Named dispatch required.

---

## Gaps recorded (not a build in this dispatch)

1. No first-class `case_type` that makes symptom check-in
   absent at schema level for psychological injury.
2. Symptom check-in surfaces listed above are live and
   ungated.
3. Morning duty acknowledgment is demo-only
   (`cx_duty_ack`), not in worker-app React.
4. Secure message thread and worker document upload are
   absent.
5. Hours confirmation is bundled inside symptom check-in.
6. Psych restriction codes and mappings are absent.
7. Employer conduct report and claim-date snapshot are
   absent.
8. Silent days module is absent.
9. Named individual restriction is absent (counsel STOP).
10. C1447 accommodations vocabulary (Section 2.4) is
    absent. Matrix 2.1 to 2.3 must not be rebuilt.
11. Hub auth UNVERIFIED remains STOP for ship.

This inspection does not close those gaps. It does not
author product code, migrations, or tests.

---

## Human gates (untouched)

`package.json`, consent wording, legal pages, pricing,
email templates, credentials, live schema apply,
occupational seed beyond SYNTH, live Bedrock, Montreal,
`platform/db`, `docs/prompts/50/`, `docs/prompts/50a/`,
`G1_AUDIT_REPORT.md`. Section 10 open items stay with
Gary / Craig / counsel (see [STOPS.md](STOPS.md)).

Athena does not ship. This dispatch wrote this file only.
