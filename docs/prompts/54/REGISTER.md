# Prompt 54. The Design System and the Surface Standard.

Sequenced for review and build. Local/CI surface work only.
Athena does not ship. Draft PR only. Not a live-platform release.

Craig said "review and build". That is the sequence release for
local/CI surface work. It is not a ship. It is not a merge. It is
not a deploy.

This prompt converts Project ICON design decisions into build
requirements. It governs the surface of screens that Prompts 40 and
41 and the Product Behaviour prompt define. It adds no module, no
dashboard, no AI component, and no screen.

No em dashes or en dashes anywhere.

---

## Status

Prompt 54 is sequenced for review and build (local/CI surface work).

Section 1 prerequisite checks are answered in
[SECTION_1.md](SECTION_1.md) on current tip `3c256de` before token or
other file edits. That inspection is the current one.

This is a draft PR. Athena does not ship. Hermes does not treat this
file as a ship order.

---

## Governing version CONFIRMED by Craig

Craig confirmed the attached Prompt 54 file is the governing version.

This Prompt 54 file is the governing version. Version canonicality is
no longer UNCONFIRMED for the surface-standard brief.

That confirmation does not invent Product Behaviour. It does not
release a live-platform build. It does not close G1.

---

## Prompt 53 live-platform HOLDS still apply

From `docs/prompts/53/HOLDS.md`. Unchanged. Not relaxed by review and
build.

- No Montreal. Do not create or modify a hosted Montreal project.
- No Bedrock go. Do not send a Bedrock go. Do not enable inference.
- No occupational or reference seed beyond SYNTH-prefixed fixtures.
- No Section 3 and onward live-platform work under Prompt 51
  foundations (the foundations lineage, not the design-system folder).
- 50a Decision 1 is SUSPENDED. Decision 2 stands.
- Prompt 47 redo waits REV 2.
- Do not invent G1.

`G1_AUDIT_REPORT.md` exists at repo root (2026-08-13, read-only
discovery). That file is not G1 closed.

---

## Product Behaviour prompt is still absent

The Product Behaviour prompt is not in this repository. Its ten
binding behavioural rules are not in hand. Do not invent them.

The Prompt 54 brief cites these Product Behaviour sections as
load-bearing: 0.2, 4.2, 6.1, 6.2, 6.5, 7.2, 7.4, 9, 9.2, 12, 14.

Where a cited rule's exact content matters beyond restatement in the
Prompt 54 brief, STOP and report. Do not invent Product Behaviour
sentences. Those STOPS remain. See [STOPS.md](STOPS.md).

---

## Relationship to docs/prompts/51-design-system/

`docs/prompts/51-design-system/` is earlier unified Prompt 51 Design
System work already on main. Section 1 prerequisite inspection plus
tokens and gates. It landed as #152 (Section 1) and #153 (tokens,
html attrs, CI gates).

The design-system / surface-standard prompt is now Prompt 54. This
mission amends that folder and the existing token/gate files
idempotently. It does not overwrite Core Platform Foundations
(`docs/prompts/50/`, `docs/prompts/50a/`, `platform/db`).

The `51-design-system` folder stays as the earlier inspection and
token/gate landing. It is not deleted. It is not Core Platform
Foundations. Prompt 54 [SECTION_1.md](SECTION_1.md) is the current
inspection.

Cross-links:

- [../51-design-system/SECTION_1.md](../51-design-system/SECTION_1.md)
- [../51-design-system/STOPS.md](../51-design-system/STOPS.md)
- [../51-design-system/SECTION_16.md](../51-design-system/SECTION_16.md)
- [../51-design-system/HUMAN_COPY_REVIEW.md](../51-design-system/HUMAN_COPY_REVIEW.md)

---

## Three things share or shared the number 51

Keep them separate.

1. Core Platform Foundations. Prompt 50a uses the number 51 for that
   governing copy (old stream 47, which superseded the briefly issued
   unified 50). See `docs/prompts/50a/` and `docs/prompts/50/`.
2. The earlier Design System folder at
   `docs/prompts/51-design-system/`. Inspection, tokens, and gates
   already on main. Amended here with a Prompt 54 cross-link only.
3. Old-stream 51, now Prompt 54. This register.

The folder in (2) is not (1) and is not (3). This file is (3).

---

## Dark theme and Compact density

Tokens only. Do not ship as features.

Dark theme (3.5) and Compact density (5.2) stay token blocks in
`deploy/continuum_tokens.css`. There is no theme or density
user-menu control. No product `<html>` defaults to dark or compact.

Shipping either as a feature is a defect.

---

## What this review and build may do

- Write Prompt 54 Section 1, STOPS, acceptance map.
- Amend `51-design-system` docs with a Prompt 54 cross-link.
- Amend token-file header comments so Prompt 54 is named as the
  governing surface-standard number. Keep Prompt 51 Design System /
  Prompt 58 comments as lineage.
- Add a Prompt 54 Node suite globbed by `suites.yml`.
- Mention Prompt 54 in existing suite comments where they still say
  only Prompt 51 Design System.

## What this review and build must not do

- Ship, merge, or deploy.
- Live-platform work (Montreal, Bedrock, seed, schema).
- New module, dashboard, AI component, or screen.
- Default any html to dark or compact.
- Add a font binary.
- Edit `package.json`, email templates, `platform/db`,
  `docs/prompts/50/`, `docs/prompts/50a/`, credentials, holding.html
  layout/copy, product portal screens, or `G1_AUDIT_REPORT.md`.

Athena does not ship. Draft PR only. Not a live-platform release.

---

## Standing holds

Unchanged. Not this mission.

- No Montreal.
- No Bedrock.
- No occupational seed beyond SYNTH.
- No live schema apply. `0018` and `0019` unapplied.
- `package.json` locked.

---

## Prompt 47 redo is a separate wait

Still waiting on Prompt 45 REV 2 for the Prompt 47 redo. Do not
start that redo. That wait is separate. Not this mission.

---

## Base tip

This review and build is from tip
`3c256dea4a4162bf0191d2cd7b130d0cbeb85084`
(`Prompt 53 sequencing order and the hold (do not ship) (#156)`).
