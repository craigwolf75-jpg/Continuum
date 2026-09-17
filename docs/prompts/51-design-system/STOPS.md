# Prompt 51 Design System STOPS

**Prompt 54 / Prompt 58 cross-link.** The design-system /
surface-standard prompt is now unified Prompt 58. Prompt 54
remains the earlier sequenced review-and-build record. This
folder is the earlier #152/#153 landing. It is not Core Platform Foundations.
Prompt 58 [REGISTER.md](../58/REGISTER.md) is the
governing register. Prompt 58 [STOPS.md](../58/STOPS.md) is the
current stop list. Prompt 54
[SECTION_1.md](../54/SECTION_1.md) is the earlier inspection.
Prompt 54 [STOPS.md](../54/STOPS.md) remains the earlier stop
list.

Real stops only. Athena authored tokens and gates on this draft.
Do not deploy. Do not claim ship-ready.

No em dashes or en dashes anywhere.

This file is Prompt 51 Design System, the surface standard. It is not
Core Platform Foundations. Open items 1 to 7 in the brief stay open.
They are not resolved here.

---

## Check 1. Hub authentication unverified by Craig. STOP for ship.

Section 1 recorded that the Prompt 33 hub authentication path is present
and covered by Node suites, and that nothing in this repository states
that Craig verified it. That remains true. This draft does not claim
Craig verified hub auth. This draft is not ship-ready. Do not push to
main as a ship. Do not deploy.

---

## Do not replace Framer Motion or Tailwind

Section 1 check 2: no third-party component library exists. Framer Motion
`^11.3.0` and Tailwind `^3.4.0` stay. Retrofit only. This draft does not
replace either and does not add Radix, MUI, Ant, Chakra, shadcn, or
Headless UI.

---

## Dark theme and Compact density are tokens only. Not shipped.

Brief section 16 open item 1 is not closed. Light is live
(`data-theme="light"`, `data-density="comfortable"` on product-shell
`<html>`). Dark tokens and Compact tokens remain in
`deploy/continuum_tokens.css`. There is no theme or density user-menu
control. Adding one would ship dark and Compact. That is not this
mission.

---

## Inter woff2 is missing

`deploy/continuum_tokens.css` still points at
`/fonts/inter-var-latin.woff2`. No font binary was added. Do not
download or add one in this draft. Most portals still load Google Fonts
with `display=swap`. Acceptance criterion 9 (cold-load font CLS) has no
measurement.

---

## No RUM. Section 10 field metrics are unavailable.

No real-user monitoring exists. FCP, INP, and CLS have no lab
measurement and no field measurement. Do not estimate. The reporter
suite `deploy/lab-budget-reporter.test.mjs` records "no measurement
exists" and does not fail the build on that absence. There is no fake
800 ms FCP gate. Lab budgets in section 10 are not enforceable without
a new pipeline and likely a `package.json` change. `package.json` is
locked.

---

## Leftover hardcoded colour list is Section 1 check 4. Not migrated.

Acceptance criterion 1 asked for zero hard-coded colour outside the
token file. Migrating every leftover hex and rgba would rewrite
screens. The baseline remains Section 1 check 4. This draft fixes
token-file defects only (print hex, dark `--state-*-text` conflation).
`deploy/no-raw-hex.test.mjs` still covers product HTML solids and still
excludes marketing, legal, 404, and `demo/index.html`. rgba, JS,
worker-app, hub-roles, Framer, and assessment CSS still carry raw
colour.

---

## No live schema apply

No schema was applied. `platform/db` was not touched. Athena does not
live-apply schema.

---

## Deploy gate

Hermes ships only when Craig names ship. This draft stops at tokens,
gates, and the html attribute contract. No merge. No push to main. No
deploy.

---

## Tone, emoji, and exclamation stay reported, not hard-fail

Live product copy would go red if tone, emoji, or exclamation flipped
to a hard fail. They stay reported for the section 11.7 human copy
review. Pair: `deploy/banned-strings.test.mjs` and
`docs/prompts/51-design-system/HUMAN_COPY_REVIEW.md` (Calliope).

---

## Weekday copy on worker companion pages (criterion 24 leftover)

The existing banned-string walk is top-level `deploy/*.html` only. That
walk is green for weekdays (script-built labels are stripped). These
worker companion pages still contain hard-coded weekdays in visible
copy. Calliope owns visitor words. They were not rewritten here. They
were not marked `data-board` (they are not board-sourced).

- `deploy/worker/get-help.html`: "Monday to Friday"
- `deploy/worker/clinician-handoff.html`: "Monday to Friday"
- `deploy/worker/check-in.html`: "Wednesday 26 August 2026"

---

## Rendered section 11 gates need a headless pipeline

axe, reflow at 320, zoom at 200, aria-live, sparkline alt, and rendered
target hit-testing need a headless-browser workflow. That would add a
pipeline and likely `package.json` dependencies. Not added. Token-file
Node gates stay.

---

## Status icons and draft field are not mounted

The draft field treatment and the draft status icon remain CSS and
module only. This draft does not mount them on a product page.

---

## Open items 1 to 7 stay open

From the brief, section 16. Not resolved here:

1. Clinic visits unverified. Defer Compact and dark until then.
2. Prompt 38 open item 1: who completes the return-to-work section.
3. Retrofit versus replace a component library: Craig. Nothing to
   replace today.
4. Whether the brand may appear on the working interface: Craig.
5. Worker-surface reading level untested with a real user.
6. Whether a worklist prefetch is an auditable access event.
7. Three cited figures unverified to primary source.
