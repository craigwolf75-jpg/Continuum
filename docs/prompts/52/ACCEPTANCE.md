# Prompt 52 acceptance map

Tip of this branch after the build. Not shipped. Do not merge.
Hermes ships only when Craig names ship. No em dashes
or en dashes anywhere.

Do not read intended work as completed work. Status below is what was
actually built and proven.

A criterion is passed only when a test proves it. Failed means the
written rule is not fully true in this repo. Not attempted means the
build did not try that proof, usually because of a STOP.

---

## 1. Summary of what was built

Prompt 52 is the feel specification that governs screens as they are
built. This build:

- Recorded Section 1 evidence for all eight prerequisite checks before
  landing buildable work.
- Recorded real STOPS: Check 1 auth unverified, Check 8 no coordinator
  screen ID, no Prompt 38 screens invented, no live telemetry invented.
- Landed voice, per-screen feel, friction, and priority documents
  under `docs/prompts/52/`.
- Scaffolded `deploy/strings/catalogue.mjs` with the Prompt 52 specified
  strings, including the protected five character for character.
- Extended the existing banned-string linter
  (`deploy/banned-strings.test.mjs`). Did not build a second linter.
- Added `deploy/prompt52-feel.test.mjs` as a docs and catalogue honesty
  gate for voice bans and [SPEC] / [NEW] / [CHANGE] markers.

Did not invent Prompt 38 screens. Did not build a coordinator daily
dashboard. Did not apply schema. Did not touch `package.json`. Did not
overwrite `docs/prompts/51-design-system/SECTION_1.md`.

Heracles: full deploy Node suite 83 files, 0 failed. Counted as
`deploy/*.test.mjs` on this tip (same glob as `.github/workflows/suites.yml`).
Banned-string suite 25 passed (live `node deploy/banned-strings.test.mjs`).
Feel honesty suite 44 passed. Verdict GREEN for the suites, not a claim
that product behaviour is complete.

Argus: not yet / pending. Do not read this file as Argus CLEAN. Patrol
on the Prompt 52 change set has not reported CLEAN.

---

## 2. Section 1 answers

See `docs/prompts/52/SECTION_1.md` and `docs/prompts/52/STOPS.md`.

| Check | Verdict | Disposition |
|---|---|---|
| 1 Auth re-test | UNVERIFIED | STOP ship. Unit suites green. Live credential re-test did not complete. Craig must verify. |
| 2 Thirty four screens | 4 legacy, 0 Prompt 38, 30 not built | Do not invent screens. |
| 3 String catalogue | Absent at inspection | Scaffolded. Existing surfaces remain inline. |
| 4 Voice baseline | Recorded | Linter extended over the catalogue. |
| 5 Empty / loading / error | Recorded; July QA report absent | Existing strings listed, not replaced. |
| 6 Forbidden pairs | 380 rows present | No change. |
| 7 Timing instrumentation | Absent for clinical timing | STOP inventing a sink. |
| 8 Coordinator dashboard | No screen ID | STOP. Not built. |

---

## 3. Files created or edited

Created:

- `docs/prompts/52/SECTION_1.md`
- `docs/prompts/52/STOPS.md`
- `docs/prompts/52/VOICE.md`
- `docs/prompts/52/FRICTION.md`
- `docs/prompts/52/PRIORITY.md`
- `docs/prompts/52/ACCEPTANCE.md`
- `docs/prompts/52/screens/ENTRY.md`
- `docs/prompts/52/screens/PHYSICIAN.md`
- `docs/prompts/52/screens/COORDINATOR.md`
- `docs/prompts/52/screens/ADMIN.md`
- `docs/prompts/52/screens/EMPLOYER.md`
- `docs/prompts/52/screens/WORKER.md`
- `deploy/strings/catalogue.mjs`
- `deploy/prompt52-feel.test.mjs`

Edited:

- `deploy/banned-strings.test.mjs` (extended; still the one linter)

---

## 4. Section 9 acceptance criteria

Verified against the running application, the string catalogue, and
the instrumentation, not against screenshots, except where a STOP
makes the running application proof unreachable.

| AC | Status | Proof |
|---|---|---|
| 1 String catalogue exists and every user facing string resolves from it | not attempted | Catalogue exists (`deploy/strings/catalogue.mjs`, 26 seeded entries, `getString` resolver). Existing surfaces stay inline. Full migration would rewrite screens this prompt does not build. |
| 2 Linter passes over the catalogue for regulatory, tone, first person software voice, and emoji including U+26A0 | passed | `deploy/banned-strings.test.mjs`: catalogue hits are zero and hard-fail. |
| 3 Five protected strings character for character; measured value note in Prompt 38 wording | passed | `deploy/banned-strings.test.mjs` and `deploy/prompt52-feel.test.mjs`. Catalogue holds `Limited to, LIMITED (5 kg / 11 lb)` and `you measured 8 kg, rounded down for safety`. |
| 4 Every one of the thirty four screens has loading, error, success, and empty where reachable | not attempted | No screens invented. 30 of 34 IDs are not built. Feel docs are not a running-app proof. |
| 5 Every reachable empty state says what will appear and what causes it | not attempted | No screens invented. July QA report is not in the repo. |
| 6 Session expiry re-authenticates in place and returns to the exact field | not attempted | Check 1 UNVERIFIED. SCR-AUTH-01 is not built. |
| 7 Case start for a known worker at a known employer is single-digit human inputs | not attempted | SCR-CASE-01 is not built. Touched-input count was not measured. |
| 8 Skill code [G1] and facility type [G5] resolve at report creation with `system` provenance | not attempted | No schema apply. Errata D4 is with Prompt 38. |
| 9 The three refuted errata follow-up phrases (wireframe 5.8 / journey 6.3 / clearing modal) return zero product-claim results | passed | `deploy/prompt52-feel.test.mjs`. Remaining hits are refuted-errata context in `PHYSICIAN.md`. Those three places are not in this repo. |
| 10 On coordinator and clinic owner surfaces, every metric value links to an action | not attempted | Check 8 STOP. No screen ID. |
| 11 Employer surface error renders no data and states that it has failed | not attempted | SCR-EMP-01 is not built. |
| 12 Worker whose employer has no job profile: Pink Copy, no employer view, no error | not attempted | Not built. |
| 13 Expired restriction set renders at the same visual weight as work status | not attempted | SCR-EMP-02 is not built. |
| 14 Disclosure line present on every employer screen | not attempted | Catalogue holds the line. Screens are not built, so render verification was not done. |
| 15 Worker first screen carries next appointment plus medical-record and withdraw statements | not attempted | SCR-WRK-01 Prompt 38 form is not built. Legacy Prompt 56 Today is not this proof. |
| 16 Completed worker check in renders as complete | not attempted | Recorded as a live defect. Not fixed here. |
| 17 Same worker record identical on Today, History, and practitioner follow up | not attempted | Recorded as a live defect. Not fixed here. |
| 18 Unanswered Consent B stored as `not_asked`, declined as `declined` | not attempted | No schema apply. No screens invented. |
| 19 Consent revocation completes within 60 seconds and states disclosed information cannot be recalled | not attempted | Catalogue draft only (`worker.employer_view_clears`). Not built. |
| 20 Return to work announcement reaches all three surfaces the same day | not attempted | Not built. |
| 21 Documentation time median, warnings per session per role, notifications per role per week instrumented | not attempted | Clinical timing instrumentation of behaviour-prompt 50 section 12 is absent. See STOPS. |
| 22 Four minute test with a real physician; first unprompted sentence recorded | not attempted | Requires a Phase 3 clinic orientation. Not run. |

Counts: 3 passed (2, 3, 9). 0 failed. 19 not attempted.

---

## 5. Gates

| Gate | Status |
|---|---|
| Heracles green | GREEN. 83 deploy Node suites, 0 failed. |
| Argus clean | not yet / pending. Argus has not reported CLEAN. |
| Canon consistency | No canon numbers moved. Duty-count examples are Prompt 52 examples, not Worker 15 / Worker 08 canon. |
| Human gate | Consent, legal, and pricing language in the feel docs is recorded [SPEC], not rewritten. Check 1 and Check 8 wait for Craig. Hub-card publication is not in scope. |

---

## 6. What this pull request must not be read as

- Not a Prompt 33 verification.
- Not a Prompt 38 screen build.
- Not a coordinator or clinic owner dashboard.
- Not a ship to main.
- Not a claim that every user-facing string already resolves from the
  catalogue.
