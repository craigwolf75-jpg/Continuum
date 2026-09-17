# Prompt 61 Section 2: verify Prompt 60 C1447 and skip

Inspected 2026-09-17 from tip
`5a94eb6cb62a8f1f12adf88b7cafaf1e9e63d1e9`.
Companion to [SECTION_1.md](SECTION_1.md).

Prompt 61 Section 2 is shared with Prompt 60 (Craig's 27).
If Prompt 60 already ran, verify and skip. Never rebuild.

No em dashes or en dashes anywhere. Athena does not ship.
Do not claim customer-facing board alignment. Section 10.3
stays with Craig.

---

## Verdict

**VERIFY and SKIP Sections 2.1 to 2.3.**

The C1447 cognitive and psychosocial demand matrix is
already in this repository from Prompt 60. This dispatch
does not rewrite `clinical/engine/c1447_factors.mjs`,
does not rewrite `clinical/engine/c1447_factors.test.mjs`,
and does not rebuild SYNTH cognitive ratings.

**Section 2.4 accommodations vocabulary is missing.**
Adding that vocabulary only is allowed. A second factor
list is a defect.

---

## 2.1 Thirteen labels, character for character

Source of truth for the extract:
[../60/C1447_VERIFICATION.md](../60/C1447_VERIFICATION.md)
(PDF `C1447 REV NOV 2025`, 7 pages). Product module:
`clinical/engine/c1447_factors.mjs` `C1447_FACTORS`.

| Id | Label in module (must match form task name) |
|---|---|
| 1 | Short-term memory and recall |
| 2 | Attention to detail |
| 3 | Completing multiple tasks |
| 4 | Mental endurance |
| 5 | Problem solving and decision making |
| 6 | Self-supervision |
| 7 | Supervision of others |
| 8 | Time pressures |
| 9 | Exposure to environmental distractions |
| 10 | Interpersonal relationships (working cooperatively with others) |
| 11 | Exposure to emotional situations and/or distressed individuals |
| 12 | Exposure to confrontational situations |
| 13 | Verbal communication |

Custom slots keep retrieved wording without normalising:

- 14 summary: `14.Additional tasks:`
- 15 summary: `15. Additional tasks:`
- detail heading both: `Additional task`

No discrepancy against the Prompt 60 extract. This
dispatch does not re-download the PDF. The extract file
is the verification record.

---

## 2.2 Scoring model

Present and correct:

- intensity: low / moderate / high
- frequency_percent: raw number
- frequency_band: DERIVED (`frequencyBandFromPercent`)
  - 0 not_required
  - over 0 to 5 rare
  - over 5 to 33 occasional
  - over 33 to 66 frequent
  - over 66 constant
- not_daily: separate boolean
- missing percent is UNKNOWN, never 0
- 5.5 derives occasional (printed-key gap is reported)

Intensity path taken by Prompt 60: retrieved definitions
stored, including OCR artefacts. Per-tenant intensity
definition text was not chosen. No customer-facing board
alignment claim is present in the module.

---

## 2.3 Score authorship

Present: `tenant_authored` / `ai_drafted` / `unscored`.
`unscored` is explicit, never null, never treated as
zero. `ai_drafted` forces affected duties to conditional
in `clinical/engine/prompt60_match.mjs`.

---

## 2.4 Accommodations vocabulary

**Not present in Prompt 60 product code.** Grep of
`clinical/` for accommodation rows returns zero.

A later Prompt 61 fill may add the C1447 coordinator
vocabulary only:

- workplace level: environment, location, colleagues,
  populations, other
- task level: from caseload reduction through use of
  external aids

That fill is not a rebuild of Section 2.1 to 2.3.

---

## SYNTH honesty

`clinical/db/occupational_synth.data.mjs`:
`SYNTHETIC = true`, 6 positions, 13 duties, all SYNTH
prefixed. Do not invent 209. Do not seed beyond SYNTH.
A later build may amend one duty's factor 12 percent so
the conflict rule can show a not_required line. That is
an amend, not a rebuild.

---

## What this file is not

- Not a second C1447 module.
- Not a customer-facing board alignment claim.
- Not a live schema apply.
- Not permission to seed beyond SYNTH.
