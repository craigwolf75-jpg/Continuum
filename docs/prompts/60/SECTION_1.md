# Prompt 60 Section 1: prerequisite inspection

Inspected on 2026-09-17 from tip
`cd841f98dc94b991ede869114d942b87df225ad9`
(`Prompt 58 design system local/CI build (#163)`).
Branch `cursor/prompt-60-concussion-mtbi-15a0`.

Read only for this document. No write to product code, no
migration, no seed, no live apply, no credential use, no
test authoring in this dispatch. This file is written
first, before product code.

Calliope owns [REGISTER.md](REGISTER.md), [STOPS.md](STOPS.md),
and [CHECK_IN_COPY.md](CHECK_IN_COPY.md). This inspection
does not overwrite those.

C1447 form extract lives in
[C1447_VERIFICATION.md](C1447_VERIFICATION.md) so this
file can stay on the 1.1 to 1.6 checks.

No em dashes or en dashes anywhere.
Do not claim Argus CLEAN. Prompt 53 holds were released
2026-09-16 by Craig. Hold lift is not an auto-execute.

**Headline.** There is no first-class case type, no C1447
cognitive or psychosocial demand matrix in repo, no Prompt
60 restriction codes, no named-code exclude reason, and no
days-per-week hours ladder. The live occupational fixture
is SYNTH only: 6 positions, 13 duties, 8 physical axes.
Prompt 61 Section 2 is absent and must not be skipped.
Hub auth remains UNVERIFIED (STOP for ship, not for this
draft).

---

## Headline answers

1.1 **No `case_type` field.** A case can be opened with a
    non-MSK `injury_type` because that column is free text
    and is not gated. The named gate is on `severity`
    (`minor` / `moderate` / `major`), not on type. No
    first-class concussion case type. Gap, not a build.
1.2 **Physical SYNTH matrix only.** 6 positions, 13 duties,
    **8** distinct physical axes. In-memory JS fixture,
    not a SQL demand-factor table. 45 / 209 / 27 remain
    PENDING from Craig. PROPOSED frame is not imported.
    No C1447 factors in repo. Do not invent 27 or 209 as
    live.
1.3 **8 restriction codes, label plus phrase, no numeric
    VALUE.** R18 is a free-text concussion board phrase.
    Prompt 60 codes (`max_continuous_screen_minutes`,
    `no_lone_work`, and the rest) do not exist. Match
    consumes axis capability objects, not those R codes.
1.4 **Status plus functional-axis prose.**
    `excluded_because` names the axis in prose. It does
    not name a restriction code. Three-way split exists
    (safe / conditional / excluded). `effective_to` is
    expired, not a review-date move from safe to
    conditional.
1.5 **`hours_per_day` only.** No `days_per_week`. No
    week-by-week ladder. No clinician-authorised step
    advancement. No auto-advance of hours (and nothing to
    hold).
1.6 **`readiness` exists in platform, onboarding, ops, and
    specs.** Clinical and homepage suites ban the word on
    product surfaces. Section 6 must not require removal
    of workforce, site, or onboarding readiness.

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

Scoring, importing, or implying a score of 209 GardaWorld
duties is STOPPED. Do not invent 209. Do not seed beyond
SYNTH. Named dispatch required. Those 209 duties are not
in this repository.

---

## Check 1.1 Case type field, and opening a non-MSK case

**No `case_type` column exists on either case record.**
Grep of the working tree for `case_type` returns zero
matches.

Hub case record is `public.injuries`
(`supabase/migrations/20260717120000_foundation_core.sql`
lines 109 to 126):

```
create table public.injuries (
  ...
  injury_type text,
  severity public.injury_severity,
  ...
);
```

Exact strings:

- Line 115: `injury_type text` (free text, not an enum).
- Line 116: `severity public.injury_severity`.
- Line 30: `create type public.injury_severity as enum
  ('minor', 'moderate', 'major');`

Physician-stream case record is `clinical.wcb_case`
(`clinical/db/016_migration_physician_foundation.sql`
lines 124 to 134). Columns include `part_of_body
varchar(60)` and `nature_of_injury varchar(60)`. No
`case_type`. `nature_of_injury` is also free text.

POST `/cases` (`supabase/functions/cases/index.ts`):

- Lines 10 to 11 contract: `injury: { date_of_injury,
  body_part, injury_type, severity, prognosis_days, ... }`.
- Line 151 write: `injury_type: injury.injury_type ?? null`.
- Lines 57 to 67 named gate:

```
if (!b.nexus_case_ref || !severity || !tenant.wcb_account_number) {
  return json({ error: "missing required fields" }, 400);
}
if (severity === "minor") {
  return json({ engaged: false });
}
if (severity !== "moderate" && severity !== "major") {
  return json({ error: `invalid severity ${severity}` }, 400);
}
```

That gate is on the existing field `severity`. It is not
on `injury_type` being musculoskeletal. A caller can send
`injury_type` as any string, including a non-MSK value,
and the handler will persist it when `severity` is
`moderate` or `major`.

Demo and seed use `msk_strain` as data, not as a gate:

- `deploy/store.js` line 59: `injury_type: 'msk_strain'`
  (Worker 15 demo row). Lines 70 to 73 repeat the same
  string on co-worker rows.
- `supabase/seed.sql` line 79:
  `'right shoulder', 'msk_strain', 'moderate'`.

**Conclusion.** No case type field. Opening a non-MSK type
is not blocked by a named gate. There is also no
first-class concussion case type. Record that as a gap,
not a build in this dispatch.

---

## Check 1.2 Duty demand matrix: existence, count, shape

**Physical duty match only. Live data is the SYNTH
fixture. Not a SQL demand-factor table.**

`clinical/db/occupational_synth.data.mjs`:

- Line 18: `export const SYNTHETIC = true;`
- Line 19: `SOURCE = "SYNTHETIC FIXTURE, NOT the canonical
  occupational document (pending Craig)"`
- Lines 3 to 6 comment: canonical `45 positions`, `209
  modified duties` and `27 demand factors` come ONLY from
  the canonical document, pending Craig. This file is not
  that document.
- Line 21 comment says `A dozen positions`. The array has
  six. The live count is 6, not 12.

Positions actually present (lines 25 to 49):
`SYNTH-POS-01` through `SYNTH-POS-06` (6).

Duties actually present (13): `SYNTH-DUTY-0101` through
`SYNTH-DUTY-0103`, `0201`, `0202`, `0301` through `0303`,
`0401`, `0402`, `0501`, `0502`, `0601`.

Demand shape on each duty: `demands: [{ axis, kind,
required }]`. Kinds in the fixture are `hours`, `weight`,
and `binary` (header lines 14 to 16).

**Distinct physical axes actually present in SYNTH: 8.**

`climbing`, `lifting_above_shoulder`,
`lifting_floor_to_waist`, `lifting_waist_to_shoulder`,
`overhead_reaching`, `sitting`, `standing`, `walking`.

Do not invent 27 or 209 as live. 27 and 209 are the
Prompt 43a pending counts, not rows on this tip.

The match engine can name more physical axes than SYNTH
rates. `clinical/engine/dutymatch.mjs` `AXIS_LABEL` (lines
34 to 41) lists 14 physical labels, including `driving`,
`bending`, `twisting`, `kneeling_squatting`,
`pushing_pulling`, `lifting_general`. Those extra labels
are not present as SYNTH demand axes.

`clinical.functional_axis` (`clinical/db/011_migration_functional_measurement_model.sql`
lines 70 to 74) is the same 14 physical members. None of
the C1447 thirteen cognitive or psychosocial task names
appear in that enum.

Storage shape: in-memory JavaScript objects exported from
`occupational_synth.data.mjs`. Grep for `create table`
plus `demand` / `demand_factor` / `duty_demand` returns
zero SQL tables. Match consumes `duty.demands` arrays
(`clinical/engine/dutymatch.mjs` `matchDuty`, line 60:
`(duty.demands || []).find((d) => d.axis === axis)`).
`clinical/engine/occupational.mjs` `publishDutyMatch`
(lines 46 to 57) reads `profile.duties` from that fixture.

Publish guard (`occupational.mjs` lines 27 to 32):
`Refusing to publish an employer view against a synthetic
occupational dataset.` Code `SYNTHETIC-NOT-AUTHORIZED`.
SYNTH never becomes a published employer library without
an explicit test override.

PROPOSED frame
(`docs/prompts/45a/PROPOSED_OCCUPATIONAL_DATASET_V1.md`
lines 1 to 7): `Status: PROPOSED.` `It is not imported by
the engine.` `Proposed occupational data never seeds
without line-by-line sign-off.` Must not be seeded. Prompt
53 holds that rule.

Prompt 43a request
(`docs/prompts/45a/CONTINUUM_45A_CRAIG_OCCUPATIONAL_REQUEST.md`
lines 20 to 24) still treats `45 positions`, `27 demand
factors`, and later `209 duty ratings` as pending Craig.
Not live.

**No C1447 cognitive or psychosocial factors in repo.**
Grep for `C1447`, `max_continuous_screen`, and
`no_lone_work` in product code and SQL returns zero.
`clinical/db/provincial_rules.data.mjs` line 37
`cognitive_fields: true` is an Alberta disclosure-profile
flag, not a C1447 factor list.

**Prompt 61 shared Section 2: not present.**

- No `docs/prompts/61/` tree.
- No C1447 product file in the repository.
- GitHub `gh pr list` for concussion / C1447 / Prompt 61
  returned unrelated hits (PR 61 is SITE-34a; PR 66 is
  Prompt 40). No concussion demand-matrix PR.
- `git ls-remote --heads origin` has no
  `prompt-61` / `c1447` / `concussion` branch.

Do not skip Section 2 because 61 is absent. A later build
extends SYNTH. It never invents 209 live duties. This
dispatch does not author Section 2.

---

## Check 1.3 Restriction code taxonomy

**Eight seeded codes. Value is a label plus a free-text
phrase. No numeric VALUE column. Boolean `active` only.**

`clinical.internal_restriction_code`
(`clinical/db/011_migration_functional_measurement_model.sql`
lines 173 to 178):

```
create table if not exists clinical.internal_restriction_code (
  code varchar(10) primary key,
  label varchar(120) not null,
  free_text_phrase varchar(200) not null,
  active boolean not null default true
);
```

No `value` / `VALUE` / numeric magnitude column on that
table. `active` is the only boolean.

Seeded in `clinical/db/012_seed_functional_measurement.sql`
lines 8 to 16 (8 rows):

| Code | Label |
|---|---|
| R05 | No repetitive lifting |
| R10 | No use of force or physical intervention |
| R11 | No restraint or take downs |
| R13 | No night shift or shift work |
| R18 | Concussion restrictions |
| R19 | Psychological restrictions |
| R20 | Post surgical restrictions |
| R22 | Weight bearing restriction |

Exact R18 row (line 13):
`('R18','Concussion restrictions','Concussion protocol
restrictions apply, see comments')`.

R18 is a free-text board phrase, not a structured
concussion code set. It is not
`max_continuous_screen_minutes`, `no_lone_work`, or any
other Prompt 60 code.

Match engine does not consume those R codes as the match
key. `clinical/engine/dutymatch.mjs` lines 44 to 48:
`restrictionByAxis` maps an axis to `{ capability:
'limited' | 'unable', quantity_kind, capacityKg,
hoursLimit, legacyNoMeasurement }`. A legacy R code with
no measurement sets `legacyNoMeasurement` and suppresses
the match (lines 54 to 58), it does not emit
`Excluded by: R18`.

Prompt 60 codes do not exist. Grep for
`max_continuous_screen_minutes`, `no_lone_work`,
`lone_work`, and `screen_minutes` returns zero.

Environment fields that do exist, and those that do not:

- `clinical.functional_environment`
  (`011` lines 155 to 162): `cold`, `hot`, `wet`, `dry`,
  `dust`, `lighting`, `noise`. Booleans. No `scents`. No
  `glare`.
- Vibration is not on that environment table. It is on
  `clinical.functional_grasping` (`011` line 140):
  `prolonged boolean, repetitive boolean, vibration
  boolean, specify boolean`.

Scents and glare as named FAF fields are not first-class
columns in `clinical.functional_environment`.

---

## Check 1.4 Does the match name the excluding restriction?

**No. It returns a three-way verdict plus functional-axis
prose. It does not name a restriction code.**

`clinical/engine/dutymatch.mjs` `matchDuty` (lines 49 to
91) returns
`{ verdict, condition_text, excluded_because,
unmapped_demand }`.

`employer.duty_match_line`
(`clinical/db/015_migration_employer_view.sql` lines 46 to
56) stores the same four: `verdict` check
`('safe', 'conditional', 'excluded')`,
`condition_text`, `excluded_because`, `unmapped_demand`.
Comment on line 54: `FUNCTIONAL reason, never clinical`.

Exact exclude strings (dutymatch.mjs):

- Line 73: `"requires " + pretty(axis) + ", which the
  worker cannot do now"`
- Lines 77 to 79 (limited, over capacity): `"requires more
  hours of " + pretty(axis) + " than the worker can
  currently manage"` or `"requires " + pretty(axis) +
  " above the worker's current capacity"`

Example meaning: an unable `overhead_reaching` duty
becomes `requires overhead reaching, which the worker
cannot do now`. That is axis prose. It is not
`Excluded by: No lone work` and it is not `Excluded by:
R18`.

`clinical/engine/dutymatch.test.mjs` line 33 asserts the
unable reason `includes("overhead reaching")` and
`includes("cannot do")`. Line 78 asserts no verdict
reason leaks a number.

Three-way split exists and is tested (lines 73 to 74):
safe, conditional, excluded.

Expired vs Prompt 60 review-date behaviour:

- `restrictionSetState` (`dutymatch.mjs` lines 118 to 121):
  `withdrawn_at` returns `"withdrawn"`;
  `effective_to` earlier than `asOfDate` returns
  `"expired"`; else `"current"`.
- Test (`dutymatch.test.mjs` line 81): `a set past
  effective_to renders as expired, never current`.

That is **expired**. It is not Prompt 60 "restriction past
review date" moving a safe duty to conditional. No
`review_date` field participates in the match.

---

## Check 1.5 RTW plan: hours per day and days per week

**Hours per day exists. Days per week does not. No
graduated hours ladder. No clinician-authorised step
advancement. No auto-advance of hours.**

`clinical/engine/worker_plan.mjs` `workerPlanPayload`
(lines 26 to 42):

- Line 33: `hours_per_day: (input && input.hours_per_day)
  != null ? input.hours_per_day : null`
- Keys returned: `case_ref`, `form_id`,
  `measurement_version`, `work_status`, `hours_per_day`,
  `axes`. No `days_per_week`. No week index. No step id.

`employer.published_restriction_set`
(`clinical/db/015_migration_employer_view.sql` line 36):
`hours_per_day numeric(4,2)`. No `days_per_week` column
on that table.

`clinical.functional_measurement`
(`clinical/db/011_migration_functional_measurement_model.sql`
line 91): `work_hours_per_day numeric(4,2)`. Lines 92 to
93 have `modified_hours boolean` and
`modified_duties boolean`. Those flags are not a ladder.

Grep for `days_per_week` in `clinical/` returns zero.
Grep for a week-by-week hours ladder, a clinician
authorised step table, or an hours auto-advance in the
plan modules returns none.

Other "auto-advance" strings in the wider repo (OTP box
advance, injury status `reported` to `off_work`) are not
an hours ladder and are not a hold target for Prompt 60
hours steps. There is no hours step to hold.

---

## Check 1.6 Existing use of "readiness"

Grep of the working tree for `readiness` (this tip, plus
Calliope's Prompt 60 docs already on disk). **Do not
propose deleting workforce, site, or onboarding
readiness.** Section 6 must not require removal of those.

### Platform, site, and onboarding (keep)

| File | Line | Exact string | Meaning |
|---|---|---|---|
| `platform/service/observability_spec.mjs` | 18 | `readiness_all_down` / `ready failing across all instances for 2 minutes` | Site / instance health alert. Not a worker score. |
| `platform/db/0017_prompt47_clinic_ops.sql` | 85 | `blocking readiness stored as flags` | Clinic onboarding run. |
| `platform/db/0017_prompt47_clinic_ops.sql` | 100, 107, 117 | stage/status includes `'ready'` | Onboarding stage name. |
| `platform/db/0019_prompt50_foundations.sql` | 547 to 548 | `Migrations current: readiness must fail when the head is missing` | Schema-head health check. |
| `platform/db/tests/prompt50_foundations.sql` | 210 | `a missing head must make readiness fail` | Same health check, test. |
| `clinical/engine/onboarding.mjs` | 102 to 104 | `export function readinessGate` / `readinessGate requires a run.` | Go-live blockers for a clinic onboarding run. |
| `clinical/engine/onboarding.test.mjs` | 4, 29, 37, 42, 45, 49 | imports and calls `readinessGate` | Onboarding suite. |
| `deploy/prompt47-clinic-ops.test.mjs` | 10, 79, 84, 86, 88 | `readinessGate(...)` | Same onboarding gate, deploy suite. |
| `clinical/engine/orchestrator.mjs` | 77 | `PROVE readiness` | Batch dry-run proves submission readiness. Does not transmit. |

### Specs and programme notes (keep; do not promote onto clinical surfaces)

| File | Line | Exact string | Meaning |
|---|---|---|---|
| `specs/CONTINUUM_DECISION_REGISTER.md` | 12 | `sold as governed readiness, never as prediction` | Marketing law for Tier 4 licensing. Existing spec text. |
| `specs/CONTINUUM_PROMPT_28.md` | 21 | `worded as governed readiness; the marketing corollary belongs beside it in the canon: sell the readiness, never the prediction` | Same marketing law in the Prompt 28 review. |
| `specs/CONTINUUM_ASSESSMENT_STEP2D_DESIGN.md` | 158 | `independently of the public readiness score` | Assessment design contrast. Names the public score so opportunity can stay independent of it. |
| `zeus-missions.md` | 154 | `never reads below functional readiness on the employer surface` | S-DESIGN-A hold-last-functional-value note. Workforce / employer-surface floor, not a Prompt 60 check-in score. |

### Product-surface bans (keep the bans)

| File | Line | Exact string | Meaning |
|---|---|---|---|
| `deploy/lockdown-guard.test.mjs` | 66 | `["readiness", /\breadiness\b/i]` | Bans the word on named HTML product surfaces. |
| `deploy/clinical-dashboard.test.mjs` | 37 | `banned = /...\|readiness\|.../` | Bans the word on `clinical-dashboard.html`. |
| `deploy/phase-b-homepage.test.mjs` | 45 | `"readiness score"` in the banned list | Bans that phrase on the homepage. |

### This folder (Calliope; do not overwrite)

| File | Line | Meaning |
|---|---|---|
| `docs/prompts/60/REGISTER.md` | 91 | Lists `readiness score` as a Section 0 banned phrase. |
| `docs/prompts/60/STOPS.md` | 105, 124 | Same ban, plus `readiness from check-in`. |

**Section 6 implication.** Platform may keep workforce,
site, and onboarding readiness (`readiness_all_down`,
`readinessGate`, migrations-current, onboarding `ready`
stage, orchestrator dry-run). A later Prompt 60 surface
must not introduce a worker `readiness score`. Removing
the platform and onboarding uses is out of scope and
would be a defect.

---

## C1447 (brief; later build depends on it)

Verified 2026-09-17. Full extract:
[C1447_VERIFICATION.md](C1447_VERIFICATION.md).

- PDF: 7 pages, 2476632 bytes, printed header
  `C1447 REV NOV 2025`. Metadata `/Title` is
  `C1447 - REV JAN 2025` (do not treat metadata as a
  second edition).
- Thirteen prompt labels match the form task names when
  wraps are joined.
- Summary item 14 extract: `14.Additional tasks:` (no
  space, plural, colon). Item 15: `15. Additional tasks:`
  (space, plural). Detail headings extract as
  `Additional task` (singular).
- Printed frequency key: Not required 0%; Rare 1-5%;
  Occasional 6-33%; Frequent 34-66%; Constant 67-100%;
  Not daily is a separate row. Printed gaps exist
  (example: 5.5 belongs to no printed percent band).
  Build must use Prompt 2.2 derivation and report the
  printed-key gap.
- Intensity definitions were retrieved (low / moderate /
  high per factor). Path: store ratings plus the
  retrieved definitions. Do not claim customer-facing
  board alignment. Section 8.2 is Craig's.
- Position classification on the form:
  `safety-sensitive, risk sensitive or decision critical`
  (hyphenation inconsistent on the form).
- Task descriptors on the form include more than the
  prompt minimum (driving; working with and around
  equipment; tool usage; providing direct care to
  persons; plus animals, heights, decision-making
  affecting another individual, confidentiality / legal /
  financial errors).

Prompt 61 shared Section 2 is not present. Do not skip
it. A later build extends SYNTH, never invents 209 live
duties.

---

## Worker check-in (do not reuse for concussion)

Existing worker-app check-in is pain / mobility scored.
Path is `worker-app/src/components/CheckIn.tsx` (not
`src/app/CheckIn.tsx`).

- Lines 15 to 16: `useState(3)` pain, `useState(6)`
  mobility.
- Lines 43 to 44 submit: `pain_score: pain`,
  `mobility_score: mob`.
- Lines 63 to 70 UI: `How is your pain?` range
  `min={0} max={10}`; `How is your movement?` range
  `min={0} max={10}`.

`public.recovery_logs`
(`20260717120000_foundation_core.sql` lines 134 to 135)
stores `pain_score` and `mobility_score`.

Prompt 60 check-in is a separate task-linked provocation
record. Do not reuse pain / mobility scoring for
concussion. Do not implement SCAT6, ImPACT, Rivermead, or
GSC. Grep for those four names in product code returns
zero.

---

## Hub authentication

**UNVERIFIED. STOP for ship. Not a stop for this draft.**

Re-checked on this tip. Nothing in the repository states
that Craig verified the Prompt 33 hub authentication fix.
Same finding as [../58/SECTION_1.md](../58/SECTION_1.md)
Check 1 and [STOPS.md](STOPS.md). Athena may still author
this file. Do not claim ship-ready.

---

## Gaps recorded (not a build in this dispatch)

1. No `case_type`. No first-class concussion case type.
2. No C1447 cognitive / psychosocial demand factors in
   the live fixture. SYNTH is 8 physical axes.
3. No Prompt 60 restriction codes. R18 is a free-text
   phrase only.
4. Match does not name a restriction code on exclude.
5. No `days_per_week`, no hours ladder, no clinician
   authorised step.
6. Prompt 61 Section 2 absent. Must be built later in
   this Prompt 60 tree against SYNTH only.
7. Hub auth UNVERIFIED remains STOP for ship.

This inspection does not close those gaps. It does not
author product code, migrations, or tests.

---

## Human gates (untouched)

`package.json`, consent wording, legal pages, pricing,
email templates, credentials, live schema apply,
occupational seed beyond SYNTH, live Bedrock, Montreal,
`platform/db`, `docs/prompts/50/`, `docs/prompts/50a/`,
`G1_AUDIT_REPORT.md`. Section 8.1, 8.2, and 8.3 stay
with Gary / Craig / counsel (see [STOPS.md](STOPS.md)).

This dispatch wrote this file and
[C1447_VERIFICATION.md](C1447_VERIFICATION.md) only.
