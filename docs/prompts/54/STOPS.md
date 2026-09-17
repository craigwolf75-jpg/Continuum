# Prompt 54 stop notes

**Supersession.** Unified Prompt 58 now governs. This file remains
the Prompt 54 stop list. See [../58/STOPS.md](../58/STOPS.md).

Real stops only. Prompt 54 is sequenced for local/CI review and
build. This prompt adds no module, no dashboard, no AI component,
and no screen. No em dashes or en dashes
anywhere.

---

## Product Behaviour is not in hand. STOP, do not invent.

The Product Behaviour prompt is absent. Its ten binding behavioural
rules are not in this repository.

The Prompt 54 brief cites 0.2, 4.2, 6.1, 6.2, 6.5, 7.2, 7.4, 9,
9.2, 12, and 14 as load-bearing.

**STOP.** Do not invent Product Behaviour. Where a cited rule's
exact content matters beyond restatement in the Prompt 54 brief,
stop and report. Criteria that need that exact text stay not
attempted.

---

## Hub auth unverified by Craig. STOP for ship.

Section 1 Check 1: the Prompt 33 hub authentication path is present
and covered by Node suites. Nothing in this repository states that
Craig verified it. **UNVERIFIED. STOP for ship.**

Athena may still author tokens and gates on a draft PR. This work
is not ship-ready as a live-platform product release. Do not treat
the merge or Production deploy as that release.

---

## Prompt 53 live-platform holds

From `docs/prompts/53/HOLDS.md`. Still apply. Not relaxed here.

- No Montreal.
- No Bedrock go.
- No occupational or reference seed beyond SYNTH.
- No Section 3+ live-platform work under Prompt 51 foundations
  (foundations lineage, not the design-system folder).

---

## 50a Decision 1 SUSPENDED. Decision 2 stands.

Do not treat Decision 1 as an active GO. It survives as analysis
only. Decision 2 stands: platform schemas versus hub, site, demo,
and worker tables. Do not create `mpi.person`. Do not expand the
allow-list.

---

## Prompt 47 redo waits REV 2

Separate wait. Not this mission. Do not start the Prompt 47 redo
here.

---

## Do not invent G1

`G1_AUDIT_REPORT.md` exists (2026-08-13, read-only discovery). That
file is not G1 closed. Do not invent G1. Do not start G1.

---

## Dark and Compact are tokens only

Shipping either as a feature is a defect.

`[data-theme="dark"]` and `[data-density="compact"]` stay in
`deploy/continuum_tokens.css`. No product html defaults to dark or
compact. No theme or density user-menu control.

---

## No new module, dashboard, AI component, or screen

This prompt adds none. Do not create one to make a gate pass.

---

## Brand green retired from working UI

`#1E8A6E` stays comment/test-only (`continuum_tokens.css` comment;
`tokens-contrast.test.mjs` negative). Do not put it on working UI.

---

## Draft label is real DOM text, never ::before

`.provenance-label` is a real element. Generated `content:` /
`::before` is a defect. The treatment is not mounted on a product
page. Do not mount it here.

---

## Do not regress holding.html 44px targets

`min-height: 44px` and `min-width: 44px` stay on `.btn`,
`footer a`, `.gate-toggle`, `.gate-submit`. Inputs keep
`min-height: 44px`. Do not restyle holding.html.

---

## Inter woff2 is missing. Do not add a binary.

`deploy/continuum_tokens.css` still points at
`/fonts/inter-var-latin.woff2`. No font binary exists. Do not
download or add one.

---

## No RUM. Do not estimate.

No lab measurement exists. No field measurement exists. For FCP,
INP, and CLS say so. Do not invent numbers. Do not add a fake
800ms FCP gate. Do not add Playwright, axe, or Lighthouse
(`package.json` locked).

---

## Leftover hardcoded colour list is not migrated

Section 1 Check 4 is the baseline. Migrating it would rewrite
screens. Token-file defects only if any remain. Print hex and dark
`--state-*-text` were already fixed in #153.

---

## package.json is locked

Do not edit any `package.json`. Do not add a dependency to make a
gate pass.

---

## Deploy gate

Merged and deployed. Local/CI surface work. Not a live-platform
product release. Prompt 53 holds stand. Hermes ships only when
Craig names ship.
