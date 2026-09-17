# Prompt 65. Site lane production readiness
and the staged data purge.

IN PROGRESS. Draft PR. Registration
plus verify reports. Not a Continuum
product release.

Date: 17 September 2026.

Authored in Gary stream 16 August 2026.
Craig named BUILD Prompt 65: SITE LANE
PRODUCTION READINESS AND THE STAGED
DATA PURGE.

No product or runtime change. Athena
does not ship. This file is not a
ship order.

No em dashes or en dashes anywhere.

---

## Status

Prompt 65 is IN PROGRESS.

Sections 1 and 2 are the read-only
verify. Section 3 is the human purge
gate. Section 4 purge is blocked and
must not run on this draft.

This prompt verifies the public site
lane. It does not rebuild it.

Do not invent G1 closed. Do not invent
REV 2. Do not claim Argus CLEAN.

---

## Scope

PUBLIC SITE LANE only at
continuumrtw.com:

- access gate
- lead capture
- public Injury Recovery Assessment

Out of scope:

- worker
- physician
- employer
- coordinator
- platform auth
- former Prompt 53 platform items

Former Prompt 53 platform items stay
out of this prompt's scope even though
holds lifted.

---

## Peer notes

This prompt verifies that lane. It
does not rebuild it.

- Prompt 62 access gate and lead
  capture, merged #171.
- Prompt 62a footer contact
  `info@continuumrtw.com`.
- Prompt 63c opt-in save, merged
  #172, tip `bcf16e4`.

---

## Base tip

This draft starts from
`bf69f17c462a64a3176ff1da7749dc6184a992da`
(Prompt 64 registered #175).

Branch:
`cursor/prompt-65-site-lane-fbe0`.

---

## What this draft may do

Docs evidence only.

- Write `docs/prompts/65/REGISTER.md`.
- Write `docs/prompts/65/STOPS.md`.
- Write `docs/prompts/65/SECTION_3_GATE.md`.
- Link Athena's
  [SECTION_1.md](SECTION_1.md) and
  [STAGED_DATA_INVENTORY.md](STAGED_DATA_INVENTORY.md)
  when those files exist.
- Record the Section 3 purge gate.
  Stop after inventory.

## What this draft must not do

- Run Section 4 purge. Do not delete
  any rows.
- Treat data deletion as a migration.
- Widen into platform, auth, worker,
  physician, employer, or coordinator.
- Commit credentials or
  `ACCESS_GATE_CODE` values. Env var
  NAMES only.
- Change schema. Edit any
  `package.json`. Add new services.
- Touch applied migrations or
  Supabase email templates.
- Invent G1 closed or REV 2.
- Claim Argus CLEAN.
- Ship. Athena does not ship.

Draft PR. Registration plus verify
reports. Not a Continuum product
release.

---

## Prompt 53 holds were released 2026-09-16 by Craig

From [../53/HOLDS.md](../53/HOLDS.md).
Former Prompt 53 holds are no longer
binding under Prompt 53. Hold lift is
not an auto-execute.

Former Prompt 53 platform items stay
out of this prompt's scope even though
holds lifted.

---

## Cross-links

Calliope docs in this folder:

- [STOPS.md](STOPS.md)
- [SECTION_3_GATE.md](SECTION_3_GATE.md)

Athena writes, do not overwrite:

- [SECTION_1.md](SECTION_1.md)
- [STAGED_DATA_INVENTORY.md](STAGED_DATA_INVENTORY.md)

Peer registers:

- [../62/REGISTER.md](../62/REGISTER.md)
- [../62a/REGISTER.md](../62a/REGISTER.md)
- [../63c/REGISTER.md](../63c/REGISTER.md)
- [../64/REGISTER.md](../64/REGISTER.md)

Prompt 53 RELEASE record:

- [../53/HOLDS.md](../53/HOLDS.md)
- [../53/RELEASE.md](../53/RELEASE.md)

---

## Do not claim Argus CLEAN

This registration does not run an Argus
patrol that closes findings. Do not claim
Argus CLEAN.

---

## Deploy gate

Draft PR. Registration plus verify
reports. Not a Continuum product
release. Athena does not ship. Do not
treat this file as a ship order.

STOP. Continuum ships only when Craig
names ship. Hermes ships Continuum
only when Craig names ship. Do not
dispatch Hermes. Do not treat this
draft as a Continuum ship.
