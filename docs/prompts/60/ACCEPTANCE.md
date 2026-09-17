# Prompt 60 acceptance (product-build draft)

Product build draft follows docs-only PR 164. This is a local/CI draft
of Sections 2 to 5 against SYNTH only, plus the worker check-in path.
It is not a live-platform product release. Athena does not ship.
Prompt 53 holds were released 2026-09-16 by Craig. Hold lift
is not an auto-execute.

Do not claim Argus CLEAN. Do not claim ship-ready. Hub authentication
remains UNVERIFIED: STOP for ship, not for this draft.

`deploy/clinical-dashboard.html` was not touched. Clinical dashboard
redesign is a separate PR.

Worker CheckIn.tsx and `deploy/worker/check-in.html` replaced scored
AM/PM pain and mobility questions with [CHECK_IN_COPY.md](CHECK_IN_COPY.md)
task-linked provocation copy on the worker check-in screens.

Worker History uses the CHECK_IN_COPY worker History lines.

Calliope owns [REGISTER.md](REGISTER.md). REGISTER already records that
this product-build DRAFT follows docs-only PR 164. This file does not
overwrite REGISTER, CHECK_IN_COPY, STOPS, SECTION_1, or
C1447_VERIFICATION.

Intensity path: retrieved C1447 definitions are stored on the factor
module, including OCR artefacts. No customer-facing board alignment
is claimed. Section 8.2 stays with Craig.

No em dashes or en dashes anywhere.

---

## Section 7 (brief numbering)

| Item | Verdict | Evidence |
|---|---|---|
| 7.1 Thirteen factor labels character for character | pass | `clinical/engine/c1447_factors.test.mjs`; labels in `c1447_factors.mjs` match [C1447_VERIFICATION.md](C1447_VERIFICATION.md) |
| 7.2 Intensity definitions retrieved and stored; no customer-facing board alignment | pass | `c1447_factors.test.mjs` (difference, ot be, attention of concentration, and/r). Definitions stored. No customer-facing board alignment string |
| 7.3 frequency_percent raw, frequency_band derived, not_daily separate, 5.5 to occasional | pass | `c1447_factors.test.mjs`; SYNTH visitor log factor 2 uses 5.5. Missing percent is UNKNOWN, never 0 |
| 7.4 Open a concussion case, apply restriction set including no_lone_work, max_continuous_screen_minutes and no_night_or_rotating_shift, receive a correct three-way split in which every excluded and conditional duty names the specific restriction | pass (gap noted) | `prompt60_match.test.mjs` and `deploy/prompt60-concussion.test.mjs` on SYNTH. No first-class `case_type` exists. Gap recorded in [SECTION_1.md](SECTION_1.md) Check 1.1 |
| 7.5 Security case: a lone night post at a remote site is excluded, and the result names both the restriction and the factor rating that produced it | pass | `prompt60_match.test.mjs`: Yard foot patrol, `Excluded by: No lone work`, Self-supervision rated high |
| 7.6 Add a restriction code with no mapping entry and confirm the engine fails loudly to the coordinator rather than returning the duty as safe | pass | `loudUnmappedFail`, `matchPrompt60Duties.employer_lines` |
| 7.7 Set a duty's factor score to unscored on a factor tested by an active restriction and confirm it returns conditional, not safe | pass | `prompt60_match.test.mjs` |
| 7.8 Let a restriction pass its review date and confirm affected duties move from safe to conditional with the reason restriction past review date | pass | `prompt60_match.test.mjs`. Face text: `Conditional: restriction past review date` |
| 7.9 All 209 modified duties | NOT ATTEMPTED | 209 duties are not in this repository. SYNTH coverage is 6 positions, 13 duties. Scoring 209 is STOPPED. Do not invent 209. Do not seed beyond SYNTH. Named dispatch required. SYNTH coverage by factor may pass 7.1 to 7.3 |
| 7.10 Run seven days of check-ins including one worsening that settles inside 24 hours, one that does not, and one where the next day's check-in is missed. Coordinator prompted on the second and third only. Nothing produces a total, average, band or colour | pass | `prompt60_checkin.test.mjs` `sevenDayFixture` spans 10 to 16 Sep 2026. Coordinator two prompts only |
| 7.11 Build a four step graduated plan, let the planned progression date pass with no clinician authorisation, and confirm the platform holds at the current step and raises an outstanding action instead of advancing | pass | `prompt60_hours_ladder.test.mjs`; `SYNTH_HOURS_LADDER_STEPS` length 4; Calliope hours-hold line exact |
| 7.12 Schedule a shift exceeding the current step and confirm the conflict surfaces before the shift begins | pass | `shiftConflictsCurrentStep` in `prompt60_hours_ladder.test.mjs` (`before_shift: true`) |
| 7.13 Employer view: no check-in content, symptom wording or provocation record (API/export shaped payloads) | pass | `employerProjection` / `employerPrompt60Leak` in `prompt60_checkin.test.mjs` |
| 7.14 Case sensitive word-bounded search of the concussion pathway for the named instrument and score-field identifiers returns zero hits. Do not flag platform readiness | pass | `deploy/prompt60-concussion.test.mjs`. Does not scan `clinical-dashboard.html`. Does not flag platform readiness |
| 7.15 On a safety_sensitive or decision_critical position, a conditional duty cannot be assigned without a recorded coordinator acknowledgment | pass | `assignConditionalDuty` / `assignDuty` in `prompt60_match.test.mjs` |

---

## Section 8 (reported unchanged, not decided)

| Item | Status |
|---|---|
| 8.1 Non device position and employer-side users | unchanged, not decided. Stop for Gary and counsel |
| 8.2 WCB Alberta Cognitive-Psychosocial Job Demands Analysis alignment | unchanged, not decided. Intensity definitions stored. No customer-facing board alignment |
| 8.3 Outbound sales material | unchanged, not decided. Section 7 is a draft record, not a sales pass |

---

## Independent STOPs still standing

Prompt 53 holds were released 2026-09-16 by Craig. Former
Prompt 53 holds are no longer binding under Prompt 53.
Hold lift is not an auto-execute.

- Named human dispatch still required before Montreal,
  Bedrock, non-SYNTH seed, or live schema apply.
- No package.json edits (any package.json).
- No live schema apply. `clinical/db/023_migration_prompt60_restriction_and_hours.sql` is a file only.
- No seed beyond SYNTH. SYNTH remains 6 positions, 13 duties, SYNTH- prefixed.
- Hub auth UNVERIFIED: STOP for ship.
- Athena does not ship.

---

## What this draft did not do

- Did not edit `deploy/clinical-dashboard.html`.
- Did not edit `deploy/store.js` Worker 15 / Worker 08 seed.
- Did not claim Worker 15 is a concussion case.
- Did not invent 209 duties or Prompt 61.
- Did not run an Argus patrol that closes findings.
