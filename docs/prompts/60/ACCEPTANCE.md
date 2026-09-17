# Prompt 60 acceptance (product-build draft)

Product build draft follows docs-only PR 164. This is a local/CI draft
of Sections 2 to 5 against SYNTH only, plus the worker check-in path.
It is not a live-platform product release. Athena does not ship.
Prompt 53 holds stand.

Do not claim Argus CLEAN. Do not claim ship-ready. Hub authentication
remains UNVERIFIED: STOP for ship, not for this draft.

`deploy/clinical-dashboard.html` was not touched. Clinical dashboard
redesign is a separate PR.

Worker check-in (worker-app CheckIn and History, and
`deploy/worker/check-in.html`) replaced scored AM/PM pain and mobility
questions with [CHECK_IN_COPY.md](CHECK_IN_COPY.md) task-linked
provocation copy, character for character on the worker screens.

Calliope owns [REGISTER.md](REGISTER.md). REGISTER still needs the
product-build-follows-164 line. This file does not overwrite REGISTER,
CHECK_IN_COPY, STOPS, SECTION_1, or C1447_VERIFICATION.

Intensity path: retrieved C1447 definitions are stored on the factor
module, including OCR artefacts. No customer-facing board alignment
is claimed. Section 8.2 stays with Craig.

No em dashes or en dashes anywhere.

---

## Section 7

| Item | Verdict | Evidence |
|---|---|---|
| 7.1 Thirteen C1447 labels character for character | pass | `clinical/engine/c1447_factors.test.mjs`; labels in `c1447_factors.mjs` match [C1447_VERIFICATION.md](C1447_VERIFICATION.md) |
| 7.2 Intensity definitions stored as retrieved, OCR artefacts kept, no board alignment claim | pass | `c1447_factors.test.mjs` (difference, ot be, attention of concentration, and/r). Definitions stored. No customer-facing board alignment string |
| 7.3 Frequency percent raw, band derived, 5.5 to occasional, missing is UNKNOWN never 0, not_daily independent | pass | `c1447_factors.test.mjs`; SYNTH visitor log factor 2 uses 5.5 |
| 7.4 Match behaviour on a SYNTH restriction set without a first-class case_type | pass (gap noted) | `prompt60_match.test.mjs` three-way split on SYNTH. No `case_type` field was added. Gap recorded in [SECTION_1.md](SECTION_1.md) Check 1.1 |
| 7.5 Three-way split names the excluding restriction | pass | `prompt60_match.test.mjs`: `Excluded by: No lone work` and other display labels |
| 7.6 Unmapped restriction fails loud to the coordinator, never safe, not sent to employer as safe | pass | `loudUnmappedFail`, `matchPrompt60Duties.employer_lines` |
| 7.7 Unscored and ai_drafted factors tested by an active restriction are conditional, never safe | pass | `prompt60_match.test.mjs` |
| 7.8 Review date passed: would-be-safe duties become conditional (`Conditional: restriction past review date`); exclusion does not lapse into permission | pass | `prompt60_match.test.mjs` |
| 7.9 209 duties | NOT ATTEMPTED | 209 duties are not in this repository. SYNTH coverage is 6 positions, 13 duties. Scoring 209 is STOPPED under Prompt 53. SYNTH coverage by factor may pass 7.1 to 7.3 |
| 7.10 Hours ladder: graduated_hours populates the plan; platform never auto-advances; hold plus outstanding action | pass | `prompt60_hours_ladder.test.mjs`; Calliope hours-hold line exact |
| 7.11 Task-linked check-in, 24h settle only, no score / total / band | pass | `prompt60_checkin.test.mjs`; worker CheckIn.tsx and `deploy/worker/check-in.html` |
| 7.12 Visibility walls: clinician table plus required line; coordinator contact prompts only; employer functional status and safe duties | pass | `prompt60_checkin.test.mjs` clinician / coordinator / employer projections; `employerPrompt60Leak` |
| 7.13 Binding constraint fact, descriptive only | pass | `bindingConstraintFact` in `prompt60_match.test.mjs`; missing counts UNKNOWN |
| 7.14 Conditional assignment on safety_sensitive or decision_critical requires recorded coordinator acknowledgment | pass | `assignConditionalDuty` / `assignDuty` in `prompt60_match.test.mjs` |
| 7.15 Section 6 instrument and score-field identifiers: zero hits on the Prompt 60 pathway files | pass | `deploy/prompt60-concussion.test.mjs` word-bounded scan. Does not scan `clinical-dashboard.html`. Does not flag platform readiness |

---

## Section 8 (reported unchanged, not decided)

| Item | Status |
|---|---|
| 8.1 Non device position and employer-side users | unchanged, not decided. Stop for Gary and counsel |
| 8.2 WCB Alberta Cognitive-Psychosocial Job Demands Analysis alignment | unchanged, not decided. Intensity definitions stored. No customer-facing board alignment |
| 8.3 Outbound sales material | unchanged, not decided. Section 7 is a draft record, not a sales pass |

---

## Holds still standing

- No Montreal. No Bedrock go.
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
