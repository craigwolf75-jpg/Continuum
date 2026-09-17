# Prompt 61 acceptance (product-build draft)

Product build draft follows the docs-first commit on this
branch. This is a local/CI draft of the psychological
injury pathway against SYNTH only. It is not a
live-platform product release. Athena does not ship.
Prompt 53 holds were released 2026-09-16 by Craig. Hold
lift is not an auto-execute.

Do not claim Argus CLEAN. Do not claim ship-ready. Hub
authentication remains UNVERIFIED: STOP for ship, not
for this draft.

`deploy/clinical-dashboard.html` was not touched.

Calliope owns [REGISTER.md](REGISTER.md) and
[STOPS.md](STOPS.md). This file does not overwrite
REGISTER, STOPS, SECTION_1, or SECTION_2_VERIFY.

Intensity path: retrieved C1447 definitions already
stored by Prompt 60. No customer-facing board alignment
is claimed. Section 10.3 stays with Craig.

No em dashes or en dashes anywhere.

---

## Surfaces removed vs retained

REMOVED for this case type (schema and API, not a hide):

- symptom check-in
- pain / mobility / fatigue / confidence questions
- feeling-state, sleep, energy, stress, and how-you-are
  questions
- made-worse / provocation records

RETAINED and functional in the psych pathway:

- morning duty acknowledgment
- secure messaging with the coordinator
- document upload
- hours confirmation (source: roster or
  worker_confirmation)

---

## Section 9 (brief numbering)

| Item | Verdict | Evidence |
|---|---|---|
| 9.1 Thirteen factor labels character for character | pass (verify-skip) | Prompt 60 `c1447_factors.test.mjs` plus [SECTION_2_VERIFY.md](SECTION_2_VERIFY.md). Not rebuilt |
| 9.2 Intensity definitions retrieved and stored; no customer-facing board alignment | pass (verify-skip) | Same. Path: retrieved definitions. Section 10.3 stays with Craig |
| 9.3 Open a psychological injury case through closure with no symptom check-in, enforced server side | pass | `walkPsychPathway` in `prompt61_pathway.test.mjs`. `acceptSymptomCheckIn` returns `symptom_checkin_does_not_exist`. `clinical.prompt61_*` migration has no check-in table |
| 9.4 Morning duty acknowledgment, secure messaging, document upload, hours confirmation retained | pass | Same suite plus `deploy/worker/psych-day.html` and `worker-app/src/components/PsychDay.tsx` |
| 9.5 Security case three-way split, every exclusion names its restriction | pass | `no_lone_work`, `no_night_or_rotating_shift`, `no_assignment_to_specified_site`, `graduated_hours` on SYNTH. Face: `Excluded by: [restriction]` |
| 9.6 no_conflict_or_crisis_response_duty excludes factor 12 above not_required | pass | Yard excluded. Visitor log factor 12 frequency 0 (not_required) is not excluded |
| 9.7 Unmapped restriction fails loudly | pass | `matchPrompt61Duty` plus Prompt 60 loud fail |
| 9.8 Restriction past review date moves duties to conditional | pass | Face text: `Conditional: restriction past review date` |
| 9.9 Employer conduct report and claim-date snapshot | pass | `prompt61_conduct.mjs`. Offered distinct from discussed. Snapshot comparison computes. Aggregates suppressed below k_min 5. Never a score or named manager assessment |
| 9.10 Word-bounded pathway search returns zero banned hits | pass | `deploy/prompt61-psych-injury.test.mjs` PATHWAY list |
| 9.11 No free text reaches a classification service | pass (local) | `inspectOutboundCalls` / `psychFreeTextOutbound`. This environment has no live outbound calls to inspect. The modules emit zero outbound calls |
| 9.12 No automated detection; persistent support link and coordinator escalation | pass | `AUTOMATED_DETECTION_EXISTS === false`. Support link on PsychDay, Home, and psych-day.html. Coordinator escalation is not a clinical finding. Live list STOPPED (10.4) |
| 9.13 Named individual restriction visibility, log, tenant flag | pass (counsel STOP remains) | Hidden on employer dashboard and exports. Scheduler constraint without a reason. Access logged. Tenant disable works. Privacy officer wording is null. Section 10.1 not decided |
| 9.14 No ranking or colouring except administrative facts | pass | `sortPsychCases` allows outstanding_actions, days_since_contact, days_since_restriction_issued only |
| 9.15 Graduated plan holds without clinician authorisation | pass | Reuses Prompt 60 `evaluateHoursStepDate`. Plan holds. Outstanding action |

---

## Section 2 verify-or-build

| Item | Action |
|---|---|
| 2.1 to 2.3 C1447 matrix | VERIFY and SKIP. Already built by Prompt 60 |
| 2.4 Accommodations vocabulary | BUILT only this gap (`prompt61_accommodations.mjs`). Not a rebuild |

---

## Section 10 (reported unchanged, not decided)

| Item | Status |
|---|---|
| 10.1 Named individual restriction and privacy officer wording | unchanged, not decided. Stop for counsel. Shape built pending counsel. Wording is null |
| 10.2 Non device position and employer-side users | unchanged, not decided. Stop for Gary and counsel |
| 10.3 WCB Alberta Cognitive-Psychosocial Job Demands Analysis alignment | unchanged, not decided. Intensity definitions stored. No customer-facing board alignment |
| 10.4 Crisis routing recipient and per jurisdiction resource list | unchanged, not decided. Stop for Craig. Structure built. Live list is null |
| 10.5 Outbound sales material | unchanged, not decided. Section 9 is a draft record, not a sales pass |

---

## Independent STOPs still standing

Prompt 53 holds were released 2026-09-16 by Craig. Former
Prompt 53 holds are no longer binding under Prompt 53.
Hold lift is not an auto-execute.

- Named human dispatch still required before Montreal,
  Bedrock, non-SYNTH seed, or live schema apply.
- No package.json edits (any package.json).
- No live schema apply.
  `clinical/db/024_migration_prompt61_psych_injury.sql`
  is a file only.
- No seed beyond SYNTH. SYNTH remains 6 positions, 13
  duties, SYNTH- prefixed. Visitor log factor 12 percent
  was amended to 0 so the conflict rule can show a
  not_required line.
- Hub auth UNVERIFIED: STOP for ship.
- Athena does not ship.

---

## What this draft did not do

- Did not rebuild C1447 Sections 2.1 to 2.3.
- Did not edit `deploy/clinical-dashboard.html`.
- Did not edit `deploy/store.js` Worker 15 / Worker 08 seed.
- Did not claim Worker 15 is a psychological injury case.
- Did not flip `PSYCH_CAPTURE_PRODUCTION_RELEASE`.
- Did not invent G1 or REV 2.
- Did not invent privacy officer wording or the live
  support-resource list.
- Did not run an Argus patrol that closes findings.
- Did not live-apply schema.
