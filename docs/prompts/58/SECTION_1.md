# Prompt 58 Section 1: prerequisite inspection

Inspected on 2026-09-16 from tip `314951803a03521a70fca67576dccab184811b69`
(`fix(ARGUS): Prompt 56 merge/deploy honesty (#162)`).
Re-verified on this tip. Started from `docs/prompts/54/SECTION_1.md`
(tip `3c256de`) and re-read every claim that can drift. Do not reuse
line numbers from `docs/prompts/51-design-system/SECTION_1.md` (that
inspection was tip `fca8548`, before #153 tokens, html attrs, and CI
gates).

Read only for this document. No write, seed, live apply, or credential
use in this inspection. No tokens, gates, or tests were implemented in
this phase. This file is written first.

**Headline.** This is Prompt 58 Design System / Surface Standard,
sequenced for local/CI substrate. Craig original PROMPT 51 (8 Aug
2026). Supersedes unified Prompt 54. It is not Core Platform
Foundations. It adds no module, no dashboard, no AI component, and no
screen.

This is not a live-platform product release. Prompt 53 holds stand.

**Numbering.** Keep these separate.

1. Core Platform Foundations. Prompt 50a uses the number 51 for that
   governing copy (old stream 47). See `docs/prompts/50/` and
   `docs/prompts/50a/`. This file does not touch those trees.
2. The earlier Design System folder at
   `docs/prompts/51-design-system/`. Inspection (#152) plus tokens,
   html attrs, and CI gates (#153). That folder stays. It is not
   overwritten. It is not Core Platform Foundations.
3. Unified Prompt 54 Design System / Surface Standard at
   `docs/prompts/54/`. Earlier review and build. Superseded lineage.
   The folder stays as history. It is not overwritten.
4. This inspection. Prompt 58 is the governing surface-standard
   number for local/CI substrate.
5. Prompt 56 (The Continuum Worker Experience) is a different prompt.
   Do not conflate it with this surface-standard.
6. Product Behaviour is Prompt 59, reserved or unseen. Do not invent
   it. See Product Behaviour STOPS below.

Token-file comments on this tip still say Prompt 54 is the governing
surface-standard number, and they keep Prompt 51 Design System /
Prompt 58 lineage. That is the pre-58-amendment state. This
inspection records it. Later substrate comments (not this file) may
name Prompt 58 as governing and Prompt 54 as superseded lineage.

**Version.** Craig sequenced local/CI substrate on 2026-09-16. That
is the sequence for this draft. It does not invent Product Behaviour
sentences. It does not close G1. It does not claim a live-platform
product release.

**Product Behaviour prompt is reserved or unseen (Prompt 59).** It
is not in this repository. The Prompt 58 brief cites Prompt 59
section 0.2 (ten rules). Conflict rule from the 58 brief: 59 wins on
behaviour, 58 wins on presentation. **STOP** where a cited rule's
exact content matters. Do not invent Product Behaviour sentences.
Those STOPS are recorded under Conflicts below.

`Continuum_Project_ICON.md` is cited in `deploy/continuum_tokens.css`
line 9 and is **not** a repo file. It is now being registered as
`docs/prompts/58a/` (not the original filename).
`Continuum_Project_Obsession.md` is not supplied. Do not invent
Obsession.md.

**Prompt 53 live-platform HOLDS still apply** (`docs/prompts/53/HOLDS.md`):

- No Montreal.
- No Bedrock go.
- No occupational or reference seed beyond SYNTH-prefixed fixtures.
- No Section 3 and onward live-platform work under Prompt 51
  foundations (the foundations lineage, not the design-system folder).
- 50a Decision 1 is SUSPENDED. Decision 2 stands.
- Prompt 47 redo waits REV 2.
- Do not invent G1.

`G1_AUDIT_REPORT.md` exists at repo root, dated 2026-08-13, read-only
discovery, no live access. That file is not G1 closed. Do not invent
G1.

Standing holds unchanged: no live schema apply, `0018` and `0019`
unapplied, Athena does not ship, `package.json` locked. No em dashes
or en dashes anywhere.

---

## Deltas from Prompt 54 Section 1 (tip `3c256de`)

Re-read on tip `3149518`. Record only what drifted.

1. **Token-file header grew.** `continuum_tokens.css` header is now
   lines 1 to 39 (54 inspection recorded 1 to 37). Prompt 54 added
   two governing-number lines after that inspection. Palette,
   density, dark, print, draft, and `@font-face` selectors in the
   token file are therefore **+2** from the 54 tables. Values are
   unchanged.
2. **`continuum-vars.css` header grew.** Now lines 1 to 7 (54
   recorded 1 to 5). `--font-ui` is lines 108 to 109 (54: 106 to
   107). `--content-max` is line 193 (54: 191). Palette hex starts
   at line 20 (54: 18). Values unchanged.
3. **`tokens-contrast.test.mjs` brand-green assertion** is line 144
   (54: 143). Same hex, same negative.
4. **`Continuum_Project_ICON.md` citation** is `continuum_tokens.css`
   line 9 (54: line 7).
5. **Four extra `package.json` roots** exist and were not named in
   the 54 table: `deploy/assessment/package.json`,
   `deploy/assessment/config/package.json`,
   `clinical/db/package.json`,
   `clinical/tools/wcb-code-list-loader/package.json`. None add a
   UI component library. See Check 2.
6. **Check 1 grep set grew.** 54 recorded absence in
   `51-design-system` and Prompt 52. This tip also has Prompt 54
   docs that record the same absence. Still no Craig verification
   record.
7. **Governing number on disk is still Prompt 54** in token and
   most gate headers. That is expected before this mission's later
   comment amendments. This inspection does not change those files.
8. **Leftover colour list (Check 4.B, 4.C, 4.D)** is unchanged.
   Eighteen spot-checks on this tip matched the 54 line and value.
   See Check 4.
9. **Product Behaviour is now numbered Prompt 59** in the 58 brief
   (reserved or unseen). 54 named it only as Product Behaviour.
10. **ICON** is being registered as `docs/prompts/58a/`, not
    `Continuum_Project_ICON.md`. Obsession.md remains absent.

Hub-auth paths, html-attrs contract, holding 44px targets, Google
Fonts table, CI workflow set, and the no-library finding did **not**
drift. Line numbers that still match after re-reading are kept.

---

## Check 1. Hub authentication fix (Prompt 33), deployed and verified by Craig?

**UNVERIFIED. STOP for ship.**

The hub authentication path is present on this tip and covered by Node
suites. Grep of `*.md`, `*.js`, `*.mjs`, and `*.html` for
`verified by Craig`, `Craig verified`, and `verified by Gary` returns
only documents that record the absence:

- `docs/prompts/51-design-system/SECTION_1.md`
- `docs/prompts/51-design-system/SECTION_16.md`
- `docs/prompts/51-design-system/STOPS.md`
- `docs/prompts/51-design-system/HUMAN_COPY_REVIEW.md`
- `docs/prompts/52/SECTION_1.md`
- `docs/prompts/52/STOPS.md`
- `docs/prompts/54/SECTION_1.md`
- `docs/prompts/54/SECTION_16.md`
- `docs/prompts/54/STOPS.md`
- `docs/prompts/54/ACCEPTANCE.md`

Nothing in this repository states that Craig verified the Prompt 33
hub authentication fix. This local/CI draft may still author tokens
and gates. This inspection does **not** claim ship-ready.

Code present (not a Craig verification):

| Path | Role |
|---|---|
| `deploy/api/hub-signin.js` | POST `/api/hub-signin`. HMAC cookie `ct_session` via `CONTINUUM_HUB_SESSION_SECRET`. Session TTL 7 days (`SESSION_TTL_SECONDS` line 39). Hard wall vs `ct_site`. |
| `deploy/api/hub-signup.js` | POST `/api/hub-signup`. Creates Auth user and `hub_profiles` pending. Never issues a cookie. |
| `deploy/api/hub-whoami.js` | GET `/api/hub-whoami`. Reads verified `ct_session` only. Never issues or refreshes a cookie. |
| `deploy/api/hub-signout.js` | Hub sign out |
| `deploy/api/hub-admin.js` | Hub admin |
| `deploy/api/_hub_auth.js` | Validators and GoTrue helpers |
| `deploy/api/_hub_session.js` | `ct_session` codec. Cookie name asserted as `ct_session` in `deploy/hub-auth.test.mjs` line 15. |
| `deploy/middleware.js` | Site gate vs hub gate. Lines 200 to 203 allow `/api/hub-signin` and `/api/hub-signup` as hub-auth API paths. Line 328 reads `cookies.ct_session`. |

Suites present: `deploy/hub-auth.test.mjs`, `deploy/hub-signin.test.mjs`,
`deploy/hub-signup.test.mjs`, `deploy/hub-whoami.test.mjs`,
`deploy/hub-signout.test.mjs`, `deploy/hub-middleware-access.test.mjs`,
`deploy/site-middleware.test.mjs` (hub-auth path cases at lines 189 to
204).

`deploy/admin-portal.html` line 150 has an in-app Zeus status string
`Prompt 33 hub and the admin fix shipped`. That is demo copy, not a
Craig verification record.

**STOP for ship.** Athena may still author tokens and gates on a
local/CI draft. This phase writes this file only. Do not claim
ship-ready.

**Defect.** Craig verification of the Prompt 33 hub authentication fix
is absent from the repository.

---

## Check 2. Component library today

**No third-party component library is in the repository.** Grep of
every `package.json` for `@radix-ui`, `@mui/`, `antd`, `@chakra-ui`,
`@headlessui`, `shadcn`, and `@shadcn` returns zero matches.

There is therefore **nothing to replace**. STOP before replacing means:
do not introduce Radix, MUI, Ant, Chakra, shadcn, or Headless UI, and
do not replace Framer Motion or Tailwind. Retrofitting tokens onto
what exists is the correct path. Replacing a library would be a
decision for Craig. That decision does not arise here because no
third-party component library exists.

### Package roots (versions from the files)

| Package root | Role | Versions |
|---|---|---|
| `deploy/package.json` | Vercel static site gate | `@vercel/functions` 3.7.6, `xmllint-wasm` 4.0.2. No UI library. |
| `hub-roles/package.json` | Hub role-select bundle (Prompt 33) | React `^18.3.1`, React DOM `^18.3.1`, Framer Motion `^11.3.0`, Vite `^5.4.0`, `@vitejs/plugin-react` `^4.3.1` |
| `worker-app/package.json` | Worker app | Next.js `14.2.5`, React `18.3.1`, TypeScript `^5.5.0`, Tailwind CSS `^3.4.0`, Capacitor `^6.1.0` |

Additional `package.json` files on this tip (not in the 54 table).
None are a UI component library:

| Package root | Role |
|---|---|
| `deploy/assessment/package.json` | `"type": "commonjs"` only |
| `deploy/assessment/config/package.json` | CommonJS scope for UMD scoring config. No UI dependency. |
| `clinical/db/package.json` | WCB seed SQL generator. `xlsx` 0.20.3 (build tool). |
| `clinical/tools/wcb-code-list-loader/package.json` | WCB workbook loader. `xlsx` 0.18.5 (build tool). |

Framer Motion is a **motion library**, not a component library.
Tailwind is a **utility framework**. Both stay. STOP before replacing
either.

`package.json` is locked. This inspection does not edit any of them.

### Components, by source (summary)

Re-verification on this tip: no third-party component library
appeared. The 54 Check 2 surface table is still the right summary.
Do not reprint it here. Every visitor-facing control remains
**hand-written HTML/CSS/JS** unless a named library is stated.

Confirmed still true after re-reading:

- Hub role cards (`hub-roles/src/main.jsx`): hand-written React.
  Seven cards at lines 20 to 28. Inline CSS in `styleTag` (lines 57
  to 80). Motion uses Framer Motion `animate` and `useReducedMotion`
  (line 8). Colours are local hex object `T` (lines 10 to 13).
- HTML product portals: page-local `.btn` and `.card`. No shared
  button or card component. `clinical-dashboard.html` `.card` line
  46, `.btn` line 47 (same as 54).
- Status icons: `deploy/status-icons.mjs` (Prompt 58 section 6.6
  comments). Five named silhouettes. Grep of product HTML for
  `statusMarkup`, `STATUS_ICONS`, and `data-provenance` returns
  **no live markup**.
- Draft field: token CSS only. `.field[data-provenance="ai_draft"]`
  at `continuum_tokens.css` line 542. Label is a real
  `.provenance-label` element (line 548). Not mounted on a product
  page.
- worker-app: hand-written React plus Tailwind utilities
  (`AppShell`, `BottomNav`, `Home`, `History`, `Duties`, `Settings`,
  `Login`, `ConsentGate`, `CheckIn`, session and sync providers).
- Framer exports: copied TSX, not a library.

**STOP.** Do not replace Framer Motion `^11.3.0`. Do not replace
Tailwind `^3.4.0`. Do not add a third-party component library.

**Defect.** None for "a library is already here and must not be
replaced." The gap is the opposite: there is no shared component
library, only copied page-local chrome.

---

## Check 3. Token layer

**Yes. Two CSS custom-property files, plus a separate Tailwind theme
object.** No JS theme object in the product shells.

Do not expand tokens so they style new live surfaces.

### `deploy/continuum_tokens.css` (full token layer)

Header (lines 1 to 39) names it "CONTINUUM DESIGN TOKENS". On this
tip, before later comment amendments, line 3 says Prompt 54 is the
governing surface-standard number (review and build). Lines 4 to 7
keep Prompt 51 Design System and Prompt 58 (unified stream; Craig's
PROMPT 51) as lineage. Line 6 still says "Released after Craig lifted
the hold." That wording is too strong if it is read as a live
release. This inspection records it. It does not rewrite it.

The file is a token layer plus four never-overridable rules (focus
ring, target floors, draft treatment, reduced motion). It is **not**
a component library.

Shape on this tip (selector lines re-read; values unchanged from 54):

- `:root` light palette (`--ink-*`, `--action-*`, `--ok-*`, `--warn-*`,
  `--stop-*`, `--draft-*`) then semantic aliases (`--bg-*`, `--text-*`,
  `--border-*`, `--state-*`, type, space, motion, targets).
- `[data-density="compact"]` at line 235, forced back to comfortable
  under `@media (any-pointer: coarse)` at line 247.
- `[data-theme="dark"]` at line 268: a `--d-*` palette layer, then
  semantic remaps. Dark `--state-*-text` maps to `--d-ink-000` (lines
  326 to 335). The first-draft conflation recorded on tip `fca8548`
  remains closed (#153).
- Base `html` / `body` rules at lines 343 to 354.
- `@media print` at line 362: **assigns from the palette layer**
  (`var(--ink-900)`, `var(--white)`, `var(--ok-800)`, and the rest).
  Token rule 2 (line 20) holds for theme and print blocks on this tip.
- Focus, targets, draft field (line 542), status, reduced motion,
  `.prose`, `@font-face` Inter Variable (line 647).

Colour-scheme at `:root` is `light` only (line 46). Dark is opt-in via
`[data-theme="dark"]`. Compact and dark stay tokens only. No product
`<html>` defaults to dark or compact (Check 8).

**Linked from one HTML page only:** `deploy/gate/holding.html` line 10.
Product portals link `continuum-vars.css` instead.

### `deploy/continuum-vars.css` (light variables only)

Header (lines 1 to 7): Prompt 54 as governing on this tip, then
"VARIABLES ONLY (light)." Same light palette and semantic aliases as
the token file through `--content-max` (line 193). No dark block, no
compact density, no focus/target/draft/motion rules, no `@font-face`.
No base `html` / `body` rules. Linking it does not restyle a page
until a value references a var.

Linked by the product shells listed in Check 8 (clinical, worker,
employer, HSE, WCB, admin, SIGMA, hub, measurement, followup, book,
worker companion pages, app/screens indexes). Assessment does **not**
link it. Marketing `index.html` mentions the token file in a comment
(line 32) and does not link either file.

### Tailwind theme object

`worker-app/tailwind.config.ts` lines 6 to 10 define hardcoded hex
under `theme.extend.colors`: `navy`, `panel`, `panel2`, `line`, `ink`,
`muted`, `gold`, `goldsoft`, `good`, `chipbg`. This is a second colour
source, not a consumer of `continuum_tokens.css`.

### Where colours are defined today

1. Token files (intended single home): `continuum_tokens.css`,
   `continuum-vars.css`.
2. Tailwind config and `worker-app/src/app/globals.css`.
3. Hub role-select local object `T` in `hub-roles/src/main.jsx`.
4. Page-local palettes: marketing `deploy/index.html` lines 45 to 70,
   assessment `deploy/assessment/assessment.css` lines 6 to 18,
   legal pages, 404, demo, presenter, support, Framer exports.
5. Raw `rgba(...)` shadows and overlays on product HTML that already
   consume token vars for solids.

Token comment rule 5 (`continuum_tokens.css` line 27): "This file is
the ONLY place hex literals live." That rule is already false on this
tip (see Check 4). Brand green `#1E8A6E` is cited at lines 31 to 32 as
retired from the working interface (4.27:1 on white, fails the text
floor). The hex itself does **not** appear as a CSS value in the token
file. `deploy/tokens-contrast.test.mjs` line 144 asserts that same hex
is below 4.5:1 on white. Grep of the working tree for `#1E8A6E` finds
the token comment, that test, `prompt54-design-system.test.mjs`, and
documentation. Comment/test-only. Not working UI.

**Defects recorded, not fixed in this inspection:**

1. Most product surfaces load `continuum-vars.css` (no base rules, no
   dark, no focus/target/draft/motion). The full token file is almost
   unused at runtime (holding page only). Do not expand it onto new
   live surfaces.
2. Leftover hardcoded colour list (Check 4) is not migrated. Migrating
   it would rewrite screens.

The two token-file defects recorded on tip `fca8548` (print hex on
semantics; dark `--state-*-text` conflation) are **not** present on
this tip. They were fixed in #153. Do not reopen them as live defects.

---

## Check 4. Hardcoded colour inventory (baseline for 3.6 and acceptance 1)

Method: started from the 54 leftover walk (tip `3c256de`), then
re-verified on tip `3149518`. Eighteen leftover rows were
spot-checked (admin, clinical, employer, hub, worker-dashboard,
assessment CSS, presenter, hub-roles, Tailwind, globals, Framer,
marketing, privacy, 404, demo, holding link, brand-green test).
**All eighteen still match the 54 file and line.** No new third-party
library colour source appeared.

**Leftover baseline:** `docs/prompts/54/SECTION_1.md` Check 4 (sections
4.B, 4.C, 4.D, 4.E, 4.F). That list still applies on this tip. Do not
migrate leftover colours (would rewrite screens).

**Token-file table (4.A) line-number delta only.** Palette hex values
are unchanged. Selector lines shifted +2 because the Prompt 54 header
grew after the 54 inspection. Current token-file examples, re-read:

| File | Line now | Value | Role |
|---|---|---|---|
| `continuum_tokens.css` | 49 | `#FFFFFF`, `#F5F7F9` | comment ratios |
| `continuum_tokens.css` | 53 | `#0E1B2C` | `--ink-900` |
| `continuum_tokens.css` | 66 | `#FFFFFF` | `--white` |
| `continuum_tokens.css` | 96 | `#6B3FA0` | `--draft-700` |
| `continuum-vars.css` | 16 | `#FFFFFF`, `#F5F7F9` | comment |
| `continuum-vars.css` | 20 | `#0E1B2C` | `--ink-900` |
| `tokens-contrast.test.mjs` | 144 | `#1E8A6E` | brand green negative |

Print block still assigns `var(--ink-900)`, `var(--white)`,
`var(--ok-800)`, and the rest. No raw hex on a semantic token in that
block.

`deploy/no-raw-hex.test.mjs` still gates **product HTML only**, and
excludes `index.html`, `privacy.html`, `terms.html`, `404.html` (line
17) plus `demo/index.html` (line 29). It does not scan JS, CSS other
than by linking, worker-app, hub-roles, or Framer.

Brand green `#1E8A6E` is comment/test-only (token comment at
`continuum_tokens.css` lines 31 to 32; negative in
`tokens-contrast.test.mjs` line 144). Absent from product HTML, CSS,
and JS working UI. Must stay comment/test-only.

**Defect.** Acceptance criterion 1 / 3.6 baseline is the 54 leftover
list, still true here. `no-raw-hex.test.mjs` does not cover JS,
worker-app, hub-roles, Framer, assessment CSS, or `rgba()`. Gold
`#C8972F` and navy/gold marketing hex remain on product-adjacent
surfaces. This leftover list is **not migrated** in Prompt 58 (would
rewrite screens). Token-file print and dark-text defects remain
closed (#153).

---

## Check 5. Build-time linter, CI, automated accessibility, RUM

### CI pipelines on this tip

| Workflow | Trigger | What it runs |
|---|---|---|
| `.github/workflows/suites.yml` | push and pull_request to `main` | Node 20, `npm ci` in `deploy/`, then every `deploy/*.test.mjs` |
| `.github/workflows/platform.yml` | push/PR paths `platform/**` | Postgres 15, platform/db only |
| `.github/workflows/exposure-proof.yml` | push and PR to `main` | Hub SQL exposure proofs on Postgres 15 |
| `.github/workflows/xsd-crosscheck.yml` | push and PR to `main` | Native xmllint vs board XSD |

There is **no** axe CI, **no** Lighthouse CI, **no** Playwright or
headless a11y workflow. `@playwright/test` appears only as a
transitive entry inside `worker-app/package-lock.json` (not a declared
dependency, not a job). Do not add those pipelines. `package.json` is
locked.

### Build-time linters that already exist (globbed by `suites.yml`)

| Suite | What it gates |
|---|---|
| `deploy/tokens-contrast.test.mjs` | Prompt 58 section 11.2 / acceptance criterion 2. WCAG 2.2 contrast on `continuum_tokens.css`. |
| `deploy/a11y-tokens.test.mjs` | Prompt 58 section 11 gates 2, 4, 6, 7, plus print. Token-file contracts only. |
| `deploy/banned-strings.test.mjs` | Prompt 58 sections 0.2 and 11.10 / acceptance criterion 16, plus criterion 24. `data-board` exemption. Tone/emoji/exclamation reported for section 11.7, not build-failing. |
| `deploy/no-raw-hex.test.mjs` | Prompt 58 section 13 / acceptance criterion 1. Product HTML only. Excludes marketing/legal/404/demo. |
| `deploy/status-greyscale.test.mjs` | Prompt 58 section 11.3 / acceptance criterion 4. Shape distinguishability. |
| `deploy/status-icons.mjs` | Icon contract consumed by the greyscale suite (not itself a `*.test.mjs`). |
| `deploy/html-attrs.test.mjs` | Check 8 attribute contract. Light and comfortable defaults. Added in #153. |
| `deploy/draft-700-reservation.test.mjs` | `--draft-700` reservation. Added in #153. |
| `deploy/lab-budget-reporter.test.mjs` | Records "no measurement exists" for FCP, INP, CLS. Does not fail the build. Added in #153. |
| `deploy/prompt54-design-system.test.mjs` | Prompt 54 honesty gate. File-text and token-file scans. |

`data-board` is the board-marker in `banned-strings.test.mjs`. Grep of
product HTML for `data-board` returns **zero** live attributes.

### Other lint scripts

`worker-app/package.json` line 6 declares `"lint": "next lint"`. There
is no `.eslintrc`, no `eslint` dependency, and no `eslint-config-next`
in that package.json. Suites.yml does not run it. No root ESLint,
Prettier, Stylelint, or Biome config.

### Real-user monitoring

**None.** Grep for `web-vitals`, `getCLS`, `getINP`, `getFCP`,
`lighthouse`, `@axe-core`, `playwright`, `pa11y`, and `lighthouse-ci`
in application source, workflows, and markdown returns no RUM, no
field INP/CLS/Lighthouse, and no axe runner. Hits are documentation
of the absence, plus the transitive `@playwright/test` lockfile
entry. `G1_AUDIT_REPORT.md` Section 2 already recorded no Sentry /
Datadog / PostHog / Vercel Analytics.

Only lab-shaped Node suites exist. No field measurement exists. Do
not invent FCP/INP/CLS numbers. Do not add a fake 800ms FCP gate.

### Map of section 11 gates 1 to 10

Gate numbers follow the Prompt 58 comments already on this tip
(`a11y-tokens.test.mjs` names gates 2, 4, 6, 7 and the rendered set;
`tokens-contrast.test.mjs` is section 11.2; `status-greyscale.test.mjs`
is section 11.3; `banned-strings.test.mjs` is 11.10 and 11.7).
`Continuum_Project_ICON.md` is cited in `continuum_tokens.css` line 9
and is **not** in this repository (58a register, not that filename).

| Gate | As named in the existing suites | Disposition |
|---|---|---|
| 1 / 11.2 Contrast | `tokens-contrast.test.mjs` | **Already in `suites.yml`** (Node). |
| 2 Focus ring | `a11y-tokens.test.mjs` (2px + 2px offset, never `:where()`) | **Already in `suites.yml`** (Node, token file only). Rendered-page check needs a headless workflow. Do not add that pipeline. |
| 3 / 11.3 Greyscale / status shape | `status-greyscale.test.mjs` | **Already in `suites.yml`** (Node silhouette proxy). Pixel screenshot at 1366x768 is named as the manual criterion-4 check. |
| 4 Target floors | `a11y-tokens.test.mjs` (24px, 44px, `any-pointer`, worker) | **Already in `suites.yml`** (Node, token file only). Rendered hit-testing needs a headless workflow. |
| 5 axe scan | Named in `a11y-tokens.test.mjs` as a RENDERED gate | **Needs a headless-browser workflow.** Not addable as a Node string test. Do not add that pipeline. |
| 6 Reduced motion | `a11y-tokens.test.mjs` (zero `--motion-*` and reset transitions) | **Already in `suites.yml`** (Node, token file only). JS/Web Animations call sites need a headless or Node scan of consumers. |
| 7 Draft treatment | `a11y-tokens.test.mjs` (real DOM text, never `::before`) | **Already in `suites.yml`** (Node, token file only). Markup on a live page needs a headless workflow. |
| 8 Reflow at 320 | Named as RENDERED `reflow@320` | **Needs a headless-browser workflow.** Do not add that pipeline. |
| 9 Zoom at 200 | Named as RENDERED `zoom@200` | **Needs a headless-browser workflow.** Do not add that pipeline. |
| 10 / 11.10 Banned strings | `banned-strings.test.mjs` | **Already in `suites.yml`** (Node, product HTML). Tone/emoji/exclamation are reported for 11.7 human copy review, not failing. |

Additional RENDERED gates named in `a11y-tokens.test.mjs` and **not**
in the 1 to 10 list above: `aria-live`, `sparkline alt`. Both need a
headless-browser workflow.

Print full-token reset is already in `a11y-tokens.test.mjs`
(criterion 19).

Section 13 no-raw-hex is already in `suites.yml` but scoped to product
HTML. Widening it to JS / worker-app / rgba is a Node-test extension,
not a new pipeline, and is **not** this mission (would rewrite
screens).

Section 10 FCP / INP / CLS field budgets **need RUM**. They cannot be
added to `suites.yml` as a substitute for field data. A lab Lighthouse
or Playwright trace would still be lab, not field, and would need
`package.json`.

---

## Check 6. Fonts, font-display, and worklist CLS

### Self-hosted Inter (token file only; file missing)

`deploy/continuum_tokens.css` lines 647 to 654:

```
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var-latin.woff2") format("woff2") tech(variations);
  font-weight: 400 600;
  font-style: normal;
  font-display: optional;
  unicode-range: U+0000-00FF, U+0100-017F, U+2000-206F, U+20A0-20BF, U+2212;
}
```

`--font-ui` at lines 141 to 142 (and `continuum-vars.css` lines 108 to
109) names Inter first, then system fallbacks.

**No `*.woff2` file exists in the repository.** There is no `fonts/`
tree. A workspace walk for `woff2` / `ttf` / `otf` returns no font
binary. With `font-display: optional`, an uncached first load (and
every load, because the file is absent) stays on the fallback and
Inter never appears. Do **not** download or add a font binary.

The `@font-face` rule is only in `continuum_tokens.css`, which only
`deploy/gate/holding.html` links. Holding then overrides body font to
`-apple-system, "Segoe UI", Roboto, system-ui, sans-serif`
(`holding.html` line 41).

### Google Fonts (`display=swap`, unless noted)

Re-read on this tip. Same set as 54. Line numbers still match.

| File | Families | `font-display` via URL |
|---|---|---|
| `deploy/worker-embed.html` 10 | Space Grotesk 500-700, Inter 400-700 | `display=swap` |
| `deploy/employer-dashboard.html` 10 | Space Grotesk 500-700, Inter 400-700 | `display=swap` |
| `deploy/sigma-crtw-connection.html` 10 | Space Grotesk 500-700, Inter 400-700 | `display=swap` |
| `deploy/demo/index.html` 10 | Space Grotesk 500-700, Inter 400-600 | `display=swap` |
| `deploy/screens/index.html` 11 | Space Grotesk 500-700, Inter 400-600 | `display=swap` |
| `deploy/privacy.html` 8 | Space Grotesk 500/700, Inter 400-600 | `display=swap` |
| `deploy/terms.html` 8 | Space Grotesk 500/700, Inter 400-600 | `display=swap` |
| `deploy/404.html` 13 | Space Grotesk 500-700, Inter 400-600 | `display=swap` |
| `deploy/assessment/index.html` 11 | Space Grotesk 500-700, Inter 400-600 | `display=swap` |
| `deploy/app/index.html` 11 | Space Grotesk 500-700, Inter 400-600 | `display=swap` |
| `deploy/hub/index.html` 11 | Space Grotesk 500-700, Inter 400-600, Instrument Sans 400-700 | `display=swap` |
| `deploy/worker-dashboard.html` 9 to 10 | Public Sans 300-800, Material Symbols Outlined | `display=swap` |
| `deploy/hse-portal.html` 9 to 10 | Public Sans 300-800, Material Symbols Outlined | `display=swap` |
| `deploy/clinical-dashboard.html` 9 to 10 | Public Sans 300-800, Material Symbols Outlined | Public Sans `display=swap`; Material Symbols `display=block` |
| `deploy/admin-portal.html` 9 to 10 | Public Sans 300-800, Material Symbols Outlined | Public Sans `display=swap`; Material Symbols `display=block` |
| `deploy/admin-site-codes.html` 9 | Public Sans 300-800 | `display=swap` |
| `deploy/admin-hub-users.html` 9 | Public Sans 300-800 | `display=swap` |
| `deploy/wcb-portal.html` 9 to 10 | Public Sans 400/700, Material Symbols Outlined | Public Sans `display=swap`; Material Symbols `display=block` |
| `deploy/sigma-portal.html` 9 to 10 | Public Sans 400/700, Material Symbols Outlined | Public Sans `display=swap`; Material Symbols `display=block` |
| `deploy/sigma-panel.html` 9 to 11 | Public Sans 400/600/700, Space Grotesk 500-700, Material Symbols | Public Sans/Space Grotesk `display=swap`; Material Symbols `display=block` |

`worker-app/src/app/globals.css` line 4:

`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`

### Pages that load no webfont

`deploy/index.html` uses `--font: -apple-system, BlinkMacSystemFont,
"Segoe UI", Roboto, system-ui, "Helvetica Neue", Arial, sans-serif`
(line 73). `deploy/book.html` line 18, `deploy/followup.html` line 24,
`deploy/measurement.html` line 24, and `deploy/gate/holding.html` line
41 use system stacks. Worker companion pages (`deploy/worker/*.html`)
set `font-family: var(--font-ui)` (Inter named in vars) but do **not**
load Google Fonts or the missing woff2, so they render the system
fallback. `deploy/worker/index.html` is a redirect with no font link.

### Worklist Cumulative Layout Shift

There is no page or suite named "worklist." The closest surfaces are
the claims / workers tables on `clinical-dashboard.html`,
`hse-portal.html`, and `wcb-portal.html`.

**Measured CLS on the worklist: No measurement exists (lab). No
measurement exists (field).** Do not estimate.

Token comment at `continuum_tokens.css` line 638 states a committed
budget "CLS <= 0.1". That is a requirement, not a measurement.

**Defect.** Token file specifies self-hosted Inter Variable with
`font-display: optional`; the woff2 is missing. Most portals load
Google Fonts with `display=swap` (swap is the value the token file
rejects because it causes layout shift). Material Symbols use
`display=block` on several clinical/admin/board shells.

---

## Check 7. Measured FCP, INP, CLS (lab or field)

| Metric | Lab | Field |
|---|---|---|
| Worklist first contentful paint at 500 open cases | No measurement exists | No measurement exists |
| Interaction to Next Paint | No measurement exists | No measurement exists |
| Cumulative Layout Shift | No measurement exists | No measurement exists |

No Lighthouse JSON, no Web Vitals beacon, no RUM store, no trace, no
suite that opens 500 cases. `deploy/lab-budget-reporter.test.mjs`
records the same three absences and does not fail the build.

Do not estimate.

---

## Check 8. Where `data-theme`, `data-density`, and `data-surface` live

Token contract (`continuum_tokens.css` lines 36 to 38): these three
attributes belong on `<html>`. Setting theme on `<body>` leaves the
root background light and shows a band on overscroll. Do not move
theme to `<body>`.

**Today (added in #153):** product shells that already link
`continuum-vars.css` or `continuum_tokens.css` set all three on
`<html>`. Contract suite: `deploy/html-attrs.test.mjs`. Re-read on
this tip: every contracted shell still sets light / comfortable.
No product html defaults to dark or compact.

Current attributes on those shells (line 2 in each unless noted):

| File | Attributes |
|---|---|
| `deploy/clinical-dashboard.html` | `class="light"` `data-theme="light"` `data-density="comfortable"` `data-surface="clinical"` |
| `deploy/worker-dashboard.html` | `class="light"` `data-theme="light"` `data-density="comfortable"` `data-surface="worker"` |
| `deploy/wcb-portal.html` | `class="light"` `data-theme="light"` `data-density="comfortable"` `data-surface="portal"` |
| `deploy/sigma-portal.html` | `class="light"` `data-theme="light"` `data-density="comfortable"` `data-surface="portal"` |
| `deploy/sigma-panel.html` | `class="light"` `data-theme="light"` `data-density="comfortable"` `data-surface="portal"` |
| `deploy/hse-portal.html` | `class="light"` `data-theme="light"` `data-density="comfortable"` `data-surface="portal"` |
| `deploy/admin-portal.html` | `class="light"` `data-theme="light"` `data-density="comfortable"` `data-surface="hub"` |
| `deploy/worker-embed.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="worker"` |
| Worker companion pages (13 files; not `index.html`) | `data-theme="light"` `data-density="comfortable"` `data-surface="worker"` |
| `deploy/measurement.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="clinical"` |
| `deploy/followup.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="clinical"` |
| `deploy/employer-dashboard.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="employer"` |
| `deploy/hub/index.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="hub"` |
| `deploy/admin-hub-users.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="hub"` |
| `deploy/admin-site-codes.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="hub"` |
| `deploy/book.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="hub"` |
| `deploy/sigma-crtw-connection.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="portal"` |
| `deploy/app/index.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="demo"` |
| `deploy/screens/index.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="demo"` |
| `deploy/gate/holding.html` | `data-theme="light"` `data-density="comfortable"` `data-surface="holding"` |

No listed shell defaults `data-theme` to `dark` or `data-density` to
`compact`. That is the html-attrs contract. Dark and Compact stay
tokens only. Do not add a user-menu control. Do not default any
`<html>` to dark or compact. Do not switch worker-app in this mission.

Grep for `data-theme` / `data-density` / `data-surface` on `<body>`
returns zero. Body tags are bare.

### Shells that do not set the three attributes

These do not link the token files, or are out of the html-attrs
contract:

- `deploy/index.html`: `<html lang="en">` (marketing; own palette)
- `deploy/privacy.html`, `deploy/terms.html`: `<html lang="en">`
- `deploy/404.html`, `deploy/demo/index.html`: `<html>`
- `deploy/assessment/index.html`: `<html lang="en">` (own CSS)
- `deploy/worker/index.html`: `<html lang="en">` (redirect)

`worker-app/src/app/layout.tsx` lines 14 to 15:

```
<html lang="en">
  <body>
```

`worker-app/src/app/globals.css` line 5 sets
`:root { color-scheme: dark; }` and line 6 paints `html, body` with
hardcoded `#0E1B2C` / `#E9EEF6`. That is a leftover dark
colour-scheme on `:root`, still not `data-theme`. Not switched in
this mission.

**Placement stands.** Attributes belong on `<html>`. Existing
`class="light"` on seven portals stays. Do not move theme to
`<body>`.

**Defect.** None for placement on the contracted shells. Assessment,
marketing, legal, 404, demo, worker redirect, and worker-app remain
unset. That is the leftover set, not a reason to move theme to body.

---

## Product Behaviour STOPS (do not invent)

Product Behaviour is Prompt 59. It is reserved or unseen. It is not
in this repository. Do not invent it.

The Prompt 58 brief cites:

- Prompt 59 section 0.2, ten rules. Exact text is not in hand.
- Conflict rule: 59 wins on behaviour, 58 wins on presentation.

The earlier Prompt 54 brief also cited Product Behaviour sections
0.2, 4.2, 6.1, 6.2, 6.5, 7.2, 7.4, 9, 9.2, 12, and 14. Those
citations stay STOP where exact content is needed.

Where Prompt 58 (or the 54 restatement it supersedes) already
restates a rule (draft label is real DOM text, never `::before`;
brand green retired from working UI; dark/Compact tokens only;
44px targets on holding; no new screen), this inspection uses that
restatement. Where exact Product Behaviour wording would be
required to accept or fail a criterion, the criterion stays STOP /
not attempted. Do not invent a substitute sentence.

`Continuum_Project_Obsession.md` is not supplied. Do not invent
Obsession.md.

---

## Prompt 53 holds (still apply)

Recorded from `docs/prompts/53/HOLDS.md` on this tip. Not relaxed by
Prompt 58 local/CI substrate.

- No Montreal project create.
- No Bedrock inference go.
- No occupational or reference seed beyond SYNTH.
- No Section 3+ live-platform work under Prompt 51 foundations
  (foundations lineage, not the design-system folder).
- 50a Decision 1 SUSPENDED. Decision 2 stands. Do not create
  `mpi.person`.
- Prompt 47 redo waits REV 2.
- Do not invent G1. `G1_AUDIT_REPORT.md` (2026-08-13) is read-only
  discovery, not G1 closed.
- Athena does not ship.

---

## Conflicts and defects this inspection must record

1. **Check 1 STOP.** Hub auth code and suites exist. Craig
   verification does not. Nothing ships. This local/CI draft may
   still author tokens and gates. Do not claim ship-ready.
2. **Product Behaviour (Prompt 59) reserved or unseen.** STOP where
   section 0.2 ten rules, or the earlier 54-cited sections, need
   exact content. Conflict rule (58 brief): 59 wins on behaviour,
   58 wins on presentation. Do not invent either side.
3. **Obsession.md absent.** `Continuum_Project_Obsession.md` is not
   supplied. Do not invent it.
4. **ICON is not a repo file.** `Continuum_Project_ICON.md` is cited
   in the token header (line 9). It is being registered as
   `docs/prompts/58a/`, not that filename.
5. **Inter woff2 missing.** Token `@font-face` cannot load. Google
   Fonts `display=swap` is the live path on most portals. Do not add
   a binary.
6. **`continuum_tokens.css` is almost unused at runtime.** Holding
   page only. Product surfaces use `continuum-vars.css` (light vars,
   no base rules). Do not expand tokens onto new live surfaces.
7. **`no-raw-hex` scope gap.** Product HTML solids are mostly tokens;
   `rgba()`, JS, worker-app, hub-roles, Framer, and assessment CSS
   still carry raw colour. That is the 54 leftover list, still true.
   Not migrated.
8. **No RUM, no lab or field FCP/INP/CLS.** Section 10 cannot be
   accepted on numbers that do not exist. Do not estimate.
9. **Status icons and draft field are CSS/module only.** Not mounted
   on product HTML. Do not mount them in this mission.
10. **`data-board` marker exists in the linter and not on live copy.**
11. **Brand green `#1E8A6E` is retired** in comments and proven below
    4.5:1. Comment/test-only. Do not reintroduce it on the working
    interface. Report, do not decide.
12. **Dark and Compact are tokens only.** Shipping either as a
    feature is a defect. No user-menu control. No html default to
    dark or compact. worker-app `:root { color-scheme: dark }` is a
    leftover, not `data-theme`. Do not switch it here.
13. **holding.html 44px targets** are already present (`.btn` lines
    109 to 110, `.req-form input` line 129, `footer a` lines 165 to
    166, `.gate-toggle` lines 186 to 187, `.gate-form input` line
    209, `.gate-submit` lines 225 to 226). Do not restyle holding
    to change them.
14. **Token header "Released after Craig lifted the hold"** can be
    read as a live release. Craig sequenced local/CI substrate on
    2026-09-16. Prompt 53 holds stand. Later comment work may reword
    that line. This inspection does not.

The print-hex and dark-text token defects from the `fca8548`
inspection are **closed** on this tip (#153). They are history, not
open defects.

---

## Human gates (untouched)

`package.json`, consent wording, legal pages, pricing, email
templates, credentials, live schema apply, occupational seed, live
Bedrock, Montreal, `platform/db`, `docs/prompts/50/`,
`docs/prompts/50a/`, `G1_AUDIT_REPORT.md`.
Athena does not ship. This phase wrote this file only.
