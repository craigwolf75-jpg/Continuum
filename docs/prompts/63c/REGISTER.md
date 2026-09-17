# Prompt 63c. The opt-in save.

THE BUILD. Companion to unified Prompt 63.
Gary chooses (b): an actual opt in save control.
Date: 2026-08-16.

This file and [STOPS.md](STOPS.md) are the
Calliope docs for this registration. Calliope
writes the one new visitor sentence, labeled
SAVE_EXPLAINER below. Athena writes
ACCEPTANCE.md after the product change. Do not
write ACCEPTANCE.md here.

Craig said build. Draft PR only.
Still not a live-platform product release.
Hermes does not treat this
file as a ship order. Prompt 53 holds were
released 2026-09-16 by Craig. Hold lift is not
an auto-execute.

No em dashes or en dashes anywhere.

---

## Status

Prompt 63c product-build DRAFT starts from main
tip `18d416e91635ca952cc0df1f74b97fce1b259a2b`
(`Prompt 62 access gate and lead capture
(#171)`).
Branch: `cursor/prompt-63c-opt-in-save-b200`.

This is the allowed product build for the opt-in
save. It closes the Prompt 63a must fix. It does
not open aggregate use. It does not invent
privacy or terms pages.

Not a live-platform product release. Prompt 53
holds were released 2026-09-16 by Craig. Hold
lift is not an auto-execute.

Do not invent G1 closed. Do not invent REV 2.
Do not apply live schema. Do not edit the locked
root `package.json`. Do not claim Argus CLEAN.

---

## Numbering map

Left column is the stream name.

| Stream wrote | Unified | What it is |
|---|---|---|
| Unified Prompt 63 | 63 | Parent. Step 2 scoring and benchmarking. Companion only. Not this file. |
| Step 2 build status and the consent copy gate | 63a | Must fix recorded. a/b/c now closed by this ruling. [../63a/REGISTER.md](../63a/REGISTER.md). |
| Seven rulings | 63b | Ruling 7 parked, now closed here. [../63b/REGISTER.md](../63b/REGISTER.md). |
| The opt-in save | 63c | This document. Gary ruled (b) on 2026-08-16. |

---

## The design decision (binding)

Gary chooses (b): an actual opt in save control.

The intro copy's promise stands word for word.
Do not rewrite it:

"nothing is sent anywhere until you choose to
save your result"

Remove auto persist. The result comes from local
state. Nothing is sent until the respondent
activates the save control.

Save control label, exact:

Save my result

Confirmation, exact:

Your result is saved

No prechecked state. No repeated prompting. One
offer on the result surface. Declining or
leaving persists nothing.

---

## Named visitor strings

Gary named strings stay exact. Athena copies
them character for character. Do not paraphrase.

INTRO_CLAUSE (stands, do not rewrite):

"nothing is sent anywhere until you choose to save your result."

SAVE_CONTROL (exact):

Save my result

SAVE_CONFIRMATION (exact):

Your result is saved

SAVE_EXPLAINER (Calliope, the only new visitor
sentence). Athena copies this character for
character into `deploy/assessment/assessment.js`,
replacing the invented aggregate sentence.

SAVE_EXPLAINER:

"Saving records an anonymous summary of the result you already see."

The current product string is forbidden:

"Saving records an anonymous summary of your
result to help improve the assessment."

That sentence invents aggregate / product
improvement use. It is forbidden under Section
00 item 4 until privacy and terms disclose
aggregate use with counsel. Do not restore it.

SAVE_EXPLAINER states only that saving records
an anonymous summary of the result the
respondent already sees. It does not claim the
save improves the assessment. It does not claim
the respondent can come back to the result. It
adds no legal vocabulary. Saving does not give
a way to return later. That fact is a product
rule, not extra visitor copy.

Do not add a new legal or consent page. Do not
rewrite the intro sentence.

---

## Section 00 item 4 binds

Saved results serve the respondent's own result
only until privacy and terms disclose aggregate
use with counsel review.

Do not invent that disclosure. Do not invent
privacy or terms pages. Option (b) does not
open aggregate use.

---

## What this draft may do

- Remove auto persist. Result from local state.
- Offer Save my result once on the result
  surface. No prechecked state. No repeated
  prompting.
- Confirm with Your result is saved.
- Place SAVE_EXPLAINER, character for character,
  on that offer.
- Persist only after the respondent chooses
  Save my result. Declining or leaving persists
  nothing.
- Athena writes ACCEPTANCE.md after the product
  change.

## What this draft must not do

- Rewrite the intro sentence.
- Restore auto persist.
- Precheck the save control. Prompt more than
  once. Persist on decline or leave.
- Change the Gary named strings.
- Restore the forbidden improve-the-assessment
  explainer.
- Invent privacy or terms pages, or aggregate-use
  disclosure.
- Write ACCEPTANCE.md in this Calliope pass.
- Live-platform product release. Hold lift is
  not an auto-execute. Craig said build. Draft
  PR only.
- Apply live schema.
- Edit the locked root `package.json`.
- Invent G1 closed or REV 2.
- Claim Argus CLEAN.
- Ship.

Still not a live-platform
product release. Prompt 53 holds were released
2026-09-16 by Craig. Hold lift is not an
auto-execute.

---

## Prompt 53 holds were released 2026-09-16 by Craig

From [../53/HOLDS.md](../53/HOLDS.md). Former
Prompt 53 holds are no longer binding under
Prompt 53. Hold lift is not an auto-execute.
Not a live-platform product release.

Named human dispatch still required before
Montreal project create, Bedrock go, non-SYNTH
seed, or live schema apply.

- 50a Decision 1 is RELEASED-from-53-hold.
  Platform GO still requires a Craig or Hermes
  named path. Do not invent live apply. Decision
  2 stands.
- Do not invent REV 2.
- Do not invent G1.

`G1_AUDIT_REPORT.md` exists at repo root
(2026-08-13, read-only discovery). That file is
not G1 closed. `PROMPT_G1_DISCOVERY_AUDIT` is
not in this repository. Do not invent G1. Do
not start G1.

The locked root `package.json` stays locked.

---

## Cross-links

Calliope docs in this folder:

- [STOPS.md](STOPS.md)

Companions:

- [../63a/REGISTER.md](../63a/REGISTER.md)
- [../63b/REGISTER.md](../63b/REGISTER.md)

Athena writes this after the product change:

- [ACCEPTANCE.md](ACCEPTANCE.md)

Prompt 53 RELEASE record:

- [../53/HOLDS.md](../53/HOLDS.md)
- [../53/RELEASE.md](../53/RELEASE.md)

---

## Do not claim Argus CLEAN

This registration does not run an Argus patrol
that closes findings. Do not claim Argus CLEAN.

---

## Base tip

`18d416e91635ca952cc0df1f74b97fce1b259a2b`
(`Prompt 62 access gate and lead capture
(#171)`).

Branch: `cursor/prompt-63c-opt-in-save-b200`.

---

## Deploy gate

Allowed product-build DRAFT for the opt-in save.
Not a live-platform product release. Prompt 53
holds were released 2026-09-16 by Craig. Hold
lift is not an auto-execute. Craig said build.
Draft PR only. Hermes ships only when Craig
names ship.
