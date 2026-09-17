# Prompt 61. Psychological injury.

Docs first. This draft is the allowed product build after
Section 1 is on disk.
Still not a live-platform product release.
Athena does not ship. Prompt 53 holds were released
2026-09-16 by Craig.

Craig original: BUILD PROMPT 28, edition 29 July 2026.
Registers as unified Prompt 61. Peer of unified Prompt 60
(Craig original BUILD PROMPT 27).

Section 0 language and claim rules override everything.
Continuum does not diagnose, treat, or determine fitness.
The treating physician makes every medical and return to
work decision.

This file and [STOPS.md](STOPS.md) are the Calliope docs
for this registration. Athena wrote
[SECTION_1.md](SECTION_1.md) before product code. Athena
writes [ACCEPTANCE.md](ACCEPTANCE.md) in the product-build
draft. Athena does not ship. Hermes does not treat this
file as a ship order.

No em dashes or en dashes anywhere.

---

## Status

Prompt 61 product-build DRAFT starts from main tip
`5a94eb6cb62a8f1f12adf88b7cafaf1e9e63d1e9`
(`Prompt 53 holds released (do not ship) (#167)`).
Section 1 is written first. This is not a live-platform
product release. Prompt 53 holds were released 2026-09-16
by Craig. Former Prompt 53 holds are no longer binding
under Prompt 53. Hold lift is not an auto-execute.

The registration block's old G1 / Prompt 53 freeze is no
longer binding. Hold lift is not auto-execute: do not
enable Bedrock, create Montreal, seed beyond SYNTH, or
apply live schema unless this prompt's allowed scope
requires SYNTH-only fixtures or file migrations.

Allowed scope this draft: psychological injury case type
pathway, restriction and match rules (named excluding
restriction), employer conduct report (case facts and
aggregates, never scores of named managers), silent days,
graduated hours ladder (never auto-advance), board
evidence assembly (form fields only, no auto submit),
named individual restriction per Section 6 pending counsel
(report and stop on counsel items), crisis support per
Section 8 (persistent support link plus coordinator
triggered escalation; no automated detection).

Section 2: Prompt 60 already built the C1447 matrix.
VERIFY and SKIP. Never rebuild. Section 2.4
accommodations vocabulary was not in Prompt 60 and may
be added as the only Section 2 fill.

This draft is not a live-platform product release.
Named human dispatch still required before a Montreal
project, a Bedrock go, a live schema apply, or a seed
beyond SYNTH-prefixed fixtures.

Do not invent G1 closed. Do not invent REV 2. Do not
seed beyond SYNTH. Do not claim Argus CLEAN. Do not
touch `deploy/clinical-dashboard.html` scored chrome
beyond what this prompt requires. Prefer amending
Prompt 60 structures over parallel systems.

---

## Numbering map

Left column is as Craig wrote it.

| Craig wrote | Unified | What it is |
|---|---|---|
| BUILD PROMPT 27 | 60 | Peer. Concussion and mTBI. Edition 29 July 2026. |
| BUILD PROMPT 28 | 61 | This document. Psychological injury. Edition 29 July 2026. |

---

## Section 0 language and claim rules

These rules override every later section, every string, and
every field name.

Continuum does not diagnose. Continuum does not treat.
Continuum does not determine fitness. The treating
physician makes every medical and return to work decision.

Do not use the word "patient" for a worker anywhere on the
employer side, including schemas. Say "worker".

Banned everywhere in code, copy, field names, APIs, and
schemas:

- predicts
- prediction
- readiness score
- recovery score
- severity
- regression detected
- clinical review recommended
- clears for duty
- at risk
- any wording in which software drives a medical call

Safe replacements if a later surface needs a phrase:

- surfaces for the doctor to review
- flagged for the doctor to review
- The doctor decides. Continuum shows the information.

The last replacement is the lawful form of the bound
phrase "the doctor decides; we show the information".

---

## Operating rule

Continuum may:

- transcribe what a clinician wrote
- describe what a job demands
- match one against the other while always naming the
  specific restriction responsible
- record what a worker confirms about duties and hours
- show a human what changed
- measure employer conduct as case facts

Continuum may not total, score, band, grade, rank,
interpret, predict, or recommend a change to anyone's care
or work capacity. Continuum may not measure mental health
in an employer-adjacent system.

The platform informs. People decide.

---

## The design decision (binding)

For psychological injury cases the symptom check-in does
not exist at the schema level.

REMOVED: any question about how the worker feels, their
symptoms, mood, sleep, energy, stress, wellbeing,
confidence, or whether anything made things worse.

RETAINED: morning duty acknowledgment, secure messaging
with the coordinator, document upload, and confirmation
of hours actually worked.

If you remove the morning duty acknowledgment you have
broken the feature. If you retain any symptom question
you have broken the promise.

This case type captures no mood, no stress, no wellbeing
signal of any kind, and runs no content classification or
sentiment analysis anywhere. It measures the employer's
conduct instead. Prompt 56 ships
`PSYCH_CAPTURE_PRODUCTION_RELEASE` as FALSE with no code
path that flips it. Prompt 44 bounds what AI may touch.
Nothing in this build may weaken any of the three.

---

## Prompt 53 holds were released 2026-09-16 by Craig

From [../53/HOLDS.md](../53/HOLDS.md). Former Prompt 53
holds are no longer binding under Prompt 53. Hold lift
is not an auto-execute. Not a live-platform product
release.

Named human dispatch still required before Montreal
project create, Bedrock go, non-SYNTH seed, or live
schema apply.

- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands.
- Do not invent REV 2. Do not start a Prompt 47 redo
  from invented contents.
- Do not invent G1.

`G1_AUDIT_REPORT.md` exists at repo root (2026-08-13,
read-only discovery). That file is not G1 closed.
`PROMPT_G1_DISCOVERY_AUDIT` is not in this repository. Do
not invent G1. Do not start G1.

`package.json` is locked.

---

## What this draft may do

- Write [SECTION_1.md](SECTION_1.md) first, before product
  code, with evidence or UNVERIFIED.
- Verify Prompt 60 C1447 Section 2.1 to 2.3 and skip.
- Add Section 2.4 accommodations vocabulary only if
  missing. Do not rebuild the factor list.
- Build the allowed product-build DRAFT against SYNTH
  only: case type pathway, restriction and match rules,
  employer conduct report, silent days, hours ladder
  reuse, board evidence assembly, named individual
  restriction pending counsel, crisis support without
  automated detection.
- Amend Prompt 60 catalogues and maps rather than invent
  a parallel match engine.
- Athena writes [ACCEPTANCE.md](ACCEPTANCE.md) in the
  product-build draft.

## What this draft must not do

- Live-platform product release. Hold lift is not an
  auto-execute.
- Montreal, Bedrock, seed beyond SYNTH, or live schema.
- Rebuild the C1447 matrix.
- Invent G1 closed or REV 2.
- Flip `PSYCH_CAPTURE_PRODUCTION_RELEASE`.
- Capture mood, symptom, distress, wellbeing, stress,
  sleep, energy, or confidence.
- Implement PHQ, GAD, DASS, Kessler, WHO-5, WHODAS, or
  C-SSRS, even as paraphrase.
- Classify or score free text.
- Infer a psychological state from behaviour.
- Rank, colour, or flag individuals except on
  administrative facts.
- Auto-advance an hours step.
- Auto-submit a board form.
- Score a named manager.
- Decide a Section 10 open item in code.
- Invent privacy officer wording or the live crisis
  resource list.
- Touch `deploy/clinical-dashboard.html` scored chrome
  beyond this prompt.
- Claim Worker 15 or Worker 08 is a psychological injury
  case.
- Edit `package.json`, email templates, credentials, or
  live schema.
- Claim Argus CLEAN.
- Repeat any of this prompt in outbound sales material.

Athena does not ship. Still not a live-platform product
release. Prompt 53 holds were released 2026-09-16 by
Craig. Hold lift is not an auto-execute.

---

## Standing independent STOPs

Not Prompt 53 holds. Hold lift is not an auto-execute.
Not this mission.

- Named human dispatch still required before Montreal,
  Bedrock, non-SYNTH seed, or live schema apply.
- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands.
- Do not invent REV 2. Do not start a Prompt 47 redo
  from invented contents.
- `package.json` locked.

---

## Section 10 open items

Listed. Not resolved. REPORT AND STOP. Never decide in
code. See [STOPS.md](STOPS.md).

### 10.1 Named individual restriction and privacy officer wording

Counsel. Build the specified shape pending counsel. Do
not invent the privacy officer wording. Do not ship to a
real tenant.

### 10.2 Non device position and employer-side users

Whether an employer side user falling outside Health
Canada's "health care professional, patient or non
healthcare professional caregiver" wording weakens the
non device position for any clinically adjacent surface.

Legal opinion. Stop for Gary and counsel.

### 10.3 WCB Alberta Cognitive-Psychosocial Job Demands Analysis

Whether Continuum may describe itself in customer facing
material as aligned to that form. Craig. Intensity
definitions from C1447 do not authorise that claim.

### 10.4 Crisis routing recipient and per jurisdiction resource list

Craig, before Section 8 ships. Software never stands
between a person in distress and a person who can help.
Build the persistent link and the coordinator trigger.
Do not invent the live list.

### 10.5 Outbound sales material

Nothing in this prompt may be repeated in outbound sales
material until the Section 9 criteria actually pass.
Section 9 is not closed here as a sales pass.

---

## Hub authentication remains UNVERIFIED

The Prompt 33 hub authentication path is UNVERIFIED by
Craig. **STOP for ship.**

This is not a stop for this draft.

---

## Occupational fixture honesty

Existing 209 GardaWorld duties are not in this
repository. The live fixture is SYNTH only: 6 positions
in `clinical/db/occupational_synth.data.mjs`
(SYNTH-POS-01 through SYNTH-POS-06). Scoring 209 is
STOPPED. Do not invent 209. Do not seed beyond SYNTH.
Named dispatch required.

---

## Cross-links

Calliope docs in this folder:

- [STOPS.md](STOPS.md)

Athena wrote these:

- [SECTION_1.md](SECTION_1.md)
- [ACCEPTANCE.md](ACCEPTANCE.md) (product-build draft)

Peer Prompt 60:

- [../60/C1447_VERIFICATION.md](../60/C1447_VERIFICATION.md)
- [../60/REGISTER.md](../60/REGISTER.md)

Prompt 53 RELEASE record:

- [../53/HOLDS.md](../53/HOLDS.md)
- [../53/RELEASE.md](../53/RELEASE.md)
- [../53/STOPS.md](../53/STOPS.md)

---

## Do not claim Argus CLEAN

This registration does not run an Argus patrol that
closes findings. Do not claim Argus CLEAN.

---

## Base tip

`5a94eb6cb62a8f1f12adf88b7cafaf1e9e63d1e9`
(`Prompt 53 holds released (do not ship) (#167)`).

---

## Athena does not ship

Allowed product-build DRAFT against SYNTH only. Not a
live-platform product release. Prompt 53 holds were
released 2026-09-16 by Craig. Hold lift is not an
auto-execute. Hermes ships only when Craig names ship.
