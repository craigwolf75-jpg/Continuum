# Prompt 54 Section 1: prerequisite inspection

**Supersession.** Unified Prompt 58 now governs the
design-system / surface-standard brief. This file remains the
Prompt 54 inspection. See [../58/SECTION_1.md](../58/SECTION_1.md).

Inspected on 2026-09-16 from tip `3c256dea4a4162bf0191d2cd7b130d0cbeb85084`
(`Prompt 53 sequencing order and the hold (do not ship) (#156)`).
Re-verified on this tip. Do not reuse line numbers from
`docs/prompts/51-design-system/SECTION_1.md` (that inspection was tip
`fca8548`, before #153 tokens, html attrs, and CI gates).

Read only for this document. No write, seed, live apply, or credential
use in this inspection. No tokens, gates, or tests were implemented in
this phase. This file is written first.

**Headline.** This is Prompt 54 Design System / Surface Standard,
sequenced for local/CI review and build. It is not Core Platform
Foundations. It adds no module, no dashboard, no AI component, and no
screen.

**Numbering.** Three things share or shared the number 51. Keep them
separate.

1. Core Platform Foundations. Prompt 50a uses the number 51 for that
   governing copy (old stream 47). See `docs/prompts/50/` and
   `docs/prompts/50a/`. This file does not touch those trees.
2. The earlier Design System folder at
   `docs/prompts/51-design-system/`. Inspection (#152) plus tokens,
   html attrs, and CI gates (#153). That folder stays. It is not
   overwritten. It is not Core Platform Foundations.
3. Old-stream 51, now Prompt 54. This inspection. The design-system /
   surface-standard prompt is now Prompt 54.

Token-file comments still say Prompt 51 Design System and Prompt 58
(unified stream; Craig's Prompt 51). That is lineage, not a second
governing number.

**Version.** Craig confirmed the attached Prompt 54 file is the
governing version. This inspection uses that confirmation. It does not
invent Product Behaviour sentences from that file beyond what
`docs/prompts/54/REGISTER.md` already restates.

**Product Behaviour prompt is absent.** It is not in this repository.
The Prompt 54 brief cites sections 0.2, 4.2, 6.1, 6.2, 6.5, 7.2, 7.4,
9, 9.2, 12, and 14. **STOP** where a cited rule's exact content matters
beyond restatement in Prompt 54. Do not invent Product Behaviour
sentences. Those STOPS are recorded under Conflicts below.

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

## Check 1. Hub authentication fix (Prompt 33), deployed and verified by Craig?

**UNVERIFIED. STOP for ship.**

The hub authentication path is present on this tip and covered by Node
suites. Grep of `*.md`, `*.js`, `*.mjs`, and `*.html` for
`verified by Craig`, `Craig verified`, and `verified by Gary` returns
only documents that record the absence (this file's predecessors in
`docs/prompts/51-design-system/`, `docs/prompts/52/SECTION_1.md`, and
`docs/prompts/52/STOPS.md`). Nothing in this repository states that
Craig verified the Prompt 33 hub authentication fix. This inspection
does **not** claim ship-ready.

Athena may still author tokens and gates on a draft PR. Do not claim
ship-ready.

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
`deploy/site-middleware.test.mjs` (hub-auth path cases at lines 187 to
204).

`deploy/admin-portal.html` line 150 has an in-app Zeus status string
`Prompt 33 hub and the admin fix shipped`. That is demo copy, not a
Craig verification record.

**STOP for ship.** Athena may still author tokens and gates on a draft
PR. This phase writes this file only. Do not claim ship-ready.

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

Framer Motion is a **motion library**, not a component library.
Tailwind is a **utility framework**. Both stay. STOP before replacing
either.

`package.json` is locked. This inspection does not edit any of them.

### Components, by source

Every visitor-facing control below is **hand-written HTML/CSS/JS**
unless a named library is stated.

**Hub role cards** (`hub-roles/src/main.jsx`, bundled to
`deploy/hub/roles.js`): hand-written React. Seven cards (Worker, HSE,
Employer, Clinical Partner, WCB, Platform Admin, SIGMA Exchange) at
lines 20 to 28. Brand badge, wordmark, card, pill, and "soon" state
are inline CSS (function `styleTag`, lines 57 to 80). Motion uses
Framer Motion `animate` and `useReducedMotion` (line 8). Colours are a
local hex object `T` (lines 10 to 13), not design tokens.

**Hub shell** (`deploy/hub/index.html`): hand-written login box, brand
mark, wordmark, `.btn` (line 29), role mount for the React IIFE.

**HTML product portals** (each file is a self-contained shell with
inline CSS and inline script; shared chrome is copied, not imported):

| Surface | File | Hand-written pieces |
|---|---|---|
| Clinical dashboard | `deploy/clinical-dashboard.html` | top bar, search, who-chip, sidebar, KPI tiles, claims table, worker list, analytics, settings, `.btn` (line 47), `.card` (line 46), pills, modal, toast |
| Worker dashboard | `deploy/worker-dashboard.html` | cards (line 30), `.btn` (line 31), sliders, chat, settings, signup wizard, recovery log |
| Employer dashboard | `deploy/employer-dashboard.html` | cards (line 46), `.btn` (line 43), tiles, tables, setup flow |
| HSE portal | `deploy/hse-portal.html` | coordinator queue, claims, workers, analytics, settings, `.card` (line 41), `.btn` (line 42) |
| WCB portal | `deploy/wcb-portal.html` | claims terminal, search, deadline alerts, analytics, settings, `.btn` (line 37), `.card` (line 47) |
| Admin portal | `deploy/admin-portal.html` | Olympus, tenants, users, grants, billing, audit, settings, modal, toast, `.card` (line 36), `.btn` (line 37) |
| Admin site codes | `deploy/admin-site-codes.html` | form, table, `.card` (line 25), `.btn` (line 31) |
| Admin hub users | `deploy/admin-hub-users.html` | form, table, `.card` (line 25), `.btn` (line 27) |
| SIGMA portal | `deploy/sigma-portal.html` | exchange cards (line 37), `.btn` (line 64) |
| SIGMA panel | `deploy/sigma-panel.html` | status pills, panel chrome |
| SIGMA CRTW | `deploy/sigma-crtw-connection.html` | connection explainer |
| Measurement | `deploy/measurement.html` | SCR-MEAS-01 fieldsets, radios, rail |
| Follow up | `deploy/followup.html` | SCR-FUP-01 fieldsets, sparklines, badges |
| Assessment | `deploy/assessment/index.html` plus `assessment.css` / `assessment.js` | public assessment form. Does not link the token files. |
| Worker companion | `deploy/worker/*.html` | login, signup, today, check-in, first-run, privacy, progress, movement-check, companion-settings, support-offer, get-help, clinician-handoff, employer-view. `worker/index.html` is a redirect. No `duties.html` on this tip. |
| Worker embed | `deploy/worker-embed.html` | consent, check-in, `.btn` (line 27), `.card` (line 25) |
| App demo | `deploy/app/index.html` | phone-frame worker demo |
| Screens index | `deploy/screens/index.html` | screen list |
| Book / access | `deploy/book.html` | request-access form |
| Site gate | `deploy/gate/holding.html` | holding page (the only HTML that links `continuum_tokens.css`, line 10) |

**Buttons in HTML.** Each portal defines its own `.btn` (and often
`.btn.ghost`) in a page-local `<style>` block. There is no shared
button component.

**Cards.** Page-local `.card` rules. There is no shared card
component.

**Status icons.** Hand-written SVG contract in `deploy/status-icons.mjs`
(Prompt 58 section 6.6 comments): five named silhouettes `ok`,
`caution`, `stop`, `draft`, `none`, plus `statusMarkup()`. Consumed by
`deploy/status-greyscale.test.mjs`. Grep of product HTML for
`statusMarkup`, `STATUS_ICONS`, and `data-provenance` returns **no
live markup**. The draft field treatment exists only as CSS in
`deploy/continuum_tokens.css` lines 540 to 569.

**Draft field.** Token CSS only: `.field[data-provenance="ai_draft"]`
(`continuum_tokens.css` line 540). Label is a real `.provenance-label`
element (line 546). Not mounted on a product page.

**worker-app** (hand-written React plus Tailwind utilities, not a
component library):

| File | Component |
|---|---|
| `worker-app/src/components/AppShell.tsx` | App shell, header, tab switch |
| `worker-app/src/components/BottomNav.tsx` | Bottom tab nav (Home, History, Duties, Settings) |
| `worker-app/src/components/Home.tsx` | Home |
| `worker-app/src/components/History.tsx` | History plus inline SVG sparkline |
| `worker-app/src/components/Duties.tsx` | Duties |
| `worker-app/src/components/Settings.tsx` | Settings |
| `worker-app/src/components/Login.tsx` | Login |
| `worker-app/src/components/ConsentGate.tsx` | Consent gate |
| `worker-app/src/components/CheckIn.tsx` | Check-in |
| `worker-app/src/state/SessionProvider.tsx` | Session |
| `worker-app/src/state/SyncProvider.tsx` | Sync |

**Framer exports** (copied TSX, not a library):
`framer/ContinuumWorkerApp.tsx`, `framer/ContinuumSignIn.tsx`.
Hardcoded hex (see Check 4).

**STOP.** Do not replace Framer Motion `^11.3.0`. Do not replace
Tailwind `^3.4.0`. Do not add a third-party component library.

**Defect.** None for "a library is already here and must not be
replaced." The gap is the opposite: there is no shared component
library, only copied page-local chrome.

---

## Check 3. Token layer

**Yes. Two CSS custom-property files, plus a separate Tailwind theme
object.** No JS theme object in the product shells.

### `deploy/continuum_tokens.css` (full token layer)

Header (lines 1 to 37) names it "CONTINUUM DESIGN TOKENS", Prompt 51
Design System, and Prompt 58 (unified stream; Craig's Prompt 51).
Prompt 54 is the governing surface-standard number for this review and
build. The Prompt 51 Design System / Prompt 58 comments are lineage.
The file is a token layer plus four never-overridable rules (focus
ring, target floors, draft treatment, reduced motion). It is **not**
a component library.

Shape on this tip:

- `:root` light palette (`--ink-*`, `--action-*`, `--ok-*`, `--warn-*`,
  `--stop-*`, `--draft-*`) then semantic aliases (`--bg-*`, `--text-*`,
  `--border-*`, `--state-*`, type, space, motion, targets).
- `[data-density="compact"]` at line 233, forced back to comfortable
  under `@media (any-pointer: coarse)` at line 246.
- `[data-theme="dark"]` at line 266: a `--d-*` palette layer, then
  semantic remaps. Dark `--state-*-text` maps to `--d-ink-000` (lines
  319 to 333). That first-draft conflation recorded on tip `fca8548`
  was fixed in #153.
- Base `html` / `body` rules at lines 341 to 352.
- `@media print` at line 360: **assigns from the palette layer**
  (`var(--ink-900)`, `var(--white)`, `var(--ok-800)`, and the rest,
  lines 365 to 399). The raw-hex-on-semantic print defect recorded on
  tip `fca8548` was fixed in #153. Token rule 2 (line 18) holds for
  theme and print blocks on this tip.
- Focus, targets, draft field (line 540), status, reduced motion,
  `.prose`, `@font-face` Inter Variable (line 645).

Colour-scheme at `:root` is `light` only (line 44). Dark is opt-in via
`[data-theme="dark"]`. Compact and dark stay tokens only. No product
`<html>` defaults to dark or compact (Check 8).

**Linked from one HTML page only:** `deploy/gate/holding.html` line 10.
Product portals link `continuum-vars.css` instead.

### `deploy/continuum-vars.css` (light variables only)

Header (lines 1 to 5): "VARIABLES ONLY (light). Single source for the
existing-page colour migration: no base rules." Same light palette and
semantic aliases as the token file through `--content-max` (line 191).
No dark block, no compact density, no focus/target/draft/motion rules,
no `@font-face`.

Linked by the product shells listed in Check 8 (clinical, worker,
employer, HSE, WCB, admin, SIGMA, hub, measurement, followup, book,
worker companion pages, app/screens indexes). Assessment does **not**
link it.

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

Token comment rule 5 (`continuum_tokens.css` line 25): "This file is
the ONLY place hex literals live." That rule is already false on this
tip (see Check 4). Brand green `#1E8A6E` is cited at lines 29 to 30 as
retired from the working interface (4.27:1 on white, fails the text
floor). The hex itself does **not** appear as a CSS value in the token
file. `deploy/tokens-contrast.test.mjs` line 143 asserts that same hex
is below 4.5:1 on white. Grep of the working tree for `#1E8A6E` finds
only that test and documentation. Comment/test-only. Not working UI.

**Defects recorded, not fixed in this inspection:**

1. Most product surfaces load `continuum-vars.css` (no base rules, no
   dark, no focus/target/draft/motion). The full token file is almost
   unused at runtime (holding page only).
2. Leftover hardcoded colour list (Check 4) is not migrated. Migrating
   it would rewrite screens.

The two token-file defects recorded on tip `fca8548` (print hex on
semantics; dark `--state-*-text` conflation) are **not** present on
this tip. They were fixed in #153. Do not reopen them as live defects.

---

## Check 4. Hardcoded colour inventory (baseline for 3.6 and acceptance 1)

Method: repo walk on 2026-09-16, tip `3c256de`. Patterns:
`#[0-9A-Fa-f]{3}`, `#[0-9A-Fa-f]{6}`, `#[0-9A-Fa-f]{8}`, `rgb(`,
`rgba(`, `hsl(`, `hsla(`. HTML character entities (`&#8592;` and
similar) were stripped before matching so 4-digit entities are not
reported as colours. `node_modules`, `.git`, lockfiles, binaries, and
`hero-video.mp4` were out of scope. `deploy/hub/roles.js` line 40 is a
minified Framer bundle; its `rgba("+js.transform` / `hsla("+Math.round`
hits are interpolator source, not authored colour literals, and are
omitted from the tables below. The seven hex values on that same line
are the compiled `T` palette and are listed under hub-roles.

`deploy/no-raw-hex.test.mjs` already gates **product HTML only**, and
excludes `index.html`, `privacy.html`, `terms.html`, `404.html`, and
`demo/index.html` (lines 17 to 29). It does not scan JS, CSS other than
by linking, worker-app, hub-roles, or Framer.

Brand green `#1E8A6E` is comment/test-only (token comment at
`continuum_tokens.css` lines 29 to 30; negative in
`tokens-contrast.test.mjs` line 143). Absent from product HTML, CSS,
and JS working UI.

### 4.A Token files (lawful home of hex, per the token comments)

#### `deploy/continuum_tokens.css`

| Line | Value | Role |
|---|---|---|
| 47 | `#FFFFFF`, `#F5F7F9` | comment ratios |
| 51 | `#0E1B2C` | `--ink-900` |
| 52 | `#2C3E52` | `--ink-700` |
| 53 | `#41556B` | `--ink-600` |
| 54 | `#55697E` | `--ink-500` |
| 55 | `#6E7E8E` | `--ink-400` |
| 57 | `#AFBBC7` | `--ink-300` |
| 58 | `#D6DDE4` | `--ink-200` |
| 62 | `#EAEFF3` | `--ink-100` |
| 63 | `#F5F7F9` | `--ink-050` |
| 64 | `#FFFFFF` | `--white` |
| 67 | `#0E4680` | `--action-800` |
| 68 | `#12559E` | `--action-700` |
| 69 | `#1A66BC` | `--action-600` |
| 71 | `#418ED6` | `--action-500` |
| 72 | `#EAF2FB` | `--action-050` |
| 75 | `#0B5C40` | `--ok-800` |
| 76 | `#0F7A55` | `--ok-700` |
| 77 | `#E6F5EE` | `--ok-050` |
| 80 | `#6B4100` | `--warn-800` |
| 81 | `#8A5300` | `--warn-700` |
| 82 | `#C67A00` | `--warn-500` |
| 83 | `#FDF3E3` | `--warn-050` |
| 86 | `#8C1A15` | `--stop-800` |
| 87 | `#A8201A` | `--stop-700` |
| 88 | `#C62828` | `--stop-600` |
| 89 | `#FDECEA` | `--stop-050` |
| 93 | `#4E2E78` | `--draft-800` |
| 94 | `#6B3FA0` | `--draft-700` |
| 95 | `#F2EDF9` | `--draft-050` |
| 189 | `rgb(14 27 44 / 12%)` | `--shadow-popover` |
| 190 | `rgb(14 27 44 / 20%)` | `--shadow-dialog` |
| 262 | `#000` | comment (dark never uses it) |
| 269 | `#151C26`, `#0F141B`, `#1D2732` | comment ratios |
| 270 | `#0F141B` | `--d-page` |
| 271 | `#151C26` | `--d-surface` |
| 272 | `#1D2732` | `--d-raised` |
| 273 | `#1B2E45` | `--d-selected` |
| 275 | `#F2F5F8` | `--d-ink-000` |
| 276 | `#C9D3DD` | `--d-ink-100` |
| 277 | `#9AA8B6` | `--d-ink-200` |
| 279 | `#6FB0F2` | `--d-action` |
| 280 | `#8CC2F7` | `--d-action-hover` |
| 282 | `#4FC08D` | `--d-ok` |
| 283 | `#E9A93C` | `--d-warn` |
| 284 | `#F2726A` | `--d-stop` |
| 285 | `#B08BE0` | `--d-draft` |
| 287 | `#12291F` | `--d-ok-bg` |
| 288 | `#2C2213` | `--d-warn-bg` |
| 289 | `#2E1917` | `--d-stop-bg` |
| 290 | `#241C33` | `--d-draft-bg` |
| 292 | `#70849A` | `--d-border` |
| 293 | `#2A3644` | `--d-divider` |
| 294 | `#2A3644` | `--d-card` |
| 336 | `rgb(0 0 0 / 45%)` | dark `--shadow-popover` |
| 337 | `rgb(0 0 0 / 60%)` | dark `--shadow-dialog` |

Print block (lines 365 to 399) assigns `var(--ink-900)`,
`var(--white)`, `var(--ok-800)`, and the rest. No raw hex on a
semantic token in that block.

#### `deploy/continuum-vars.css`

| Line | Value |
|---|---|
| 14 | `#FFFFFF`, `#F5F7F9` (comment) |
| 18 | `#0E1B2C` |
| 19 | `#2C3E52` |
| 20 | `#41556B` |
| 21 | `#55697E` |
| 22 | `#6E7E8E` |
| 24 | `#AFBBC7` |
| 25 | `#D6DDE4` |
| 29 | `#EAEFF3` |
| 30 | `#F5F7F9` |
| 31 | `#FFFFFF` |
| 34 | `#0E4680` |
| 35 | `#12559E` |
| 36 | `#1A66BC` |
| 38 | `#418ED6` |
| 39 | `#EAF2FB` |
| 42 | `#0B5C40` |
| 43 | `#0F7A55` |
| 44 | `#E6F5EE` |
| 47 | `#6B4100` |
| 48 | `#8A5300` |
| 49 | `#C67A00` |
| 50 | `#FDF3E3` |
| 53 | `#8C1A15` |
| 54 | `#A8201A` |
| 55 | `#C62828` |
| 56 | `#FDECEA` |
| 60 | `#4E2E78` |
| 61 | `#6B3FA0` |
| 62 | `#F2EDF9` |
| 156 | `rgb(14 27 44 / 12%)` |
| 157 | `rgb(14 27 44 / 20%)` |

### 4.B Working interface: product HTML / CSS / JS (outside the token files)

These remain after `no-raw-hex` on product HTML, or live in files that
gate never opens. Leftover list. Not migrated in this mission
(migrating would rewrite screens).

| File | Line | Value |
|---|---|---|
| `deploy/admin-hub-users.html` | 25 | `rgba(14,27,44,.06)` |
| `deploy/admin-portal.html` | 36 | `rgba(14,27,44,.08)` |
| `deploy/admin-portal.html` | 43 | `rgba(14,27,44,.06)` |
| `deploy/admin-portal.html` | 73 | `rgba(11,28,48,.45)` |
| `deploy/admin-portal.html` | 75 | `rgba(11,28,48,.35)` |
| `deploy/admin-site-codes.html` | 25 | `rgba(14,27,44,.06)` |
| `deploy/app/index.html` | 16 | `rgba(22,32,46,.10)`, `rgba(255,255,255,.08)` |
| `deploy/app/index.html` | 25 | `rgba(200,151,47,.16)` |
| `deploy/app/index.html` | 30 | `rgba(22,32,46,.04)` |
| `deploy/app/index.html` | 34 | `rgba(200,151,47,.14)` |
| `deploy/app/index.html` | 45 | `rgba(200,151,47,.12)`, `rgba(200,151,47,.35)` |
| `deploy/app/index.html` | 48 | `rgba(22,32,46,.25)` |
| `deploy/assessment/assessment.css` | 2 | `#0E1B2C`, `#C8972F` (comment) |
| `deploy/assessment/assessment.css` | 7 | `#0E1B2C` |
| `deploy/assessment/assessment.css` | 8 | `#16233A` |
| `deploy/assessment/assessment.css` | 9 | `#16233A` |
| `deploy/assessment/assessment.css` | 10 | `#C8972F` |
| `deploy/assessment/assessment.css` | 11 | `#E3B968` |
| `deploy/assessment/assessment.css` | 12 | `#E8ECF2` |
| `deploy/assessment/assessment.css` | 13 | `#AAB6C6` |
| `deploy/assessment/assessment.css` | 14 | `rgba(255, 255, 255, 0.12)` |
| `deploy/assessment/assessment.css` | 15 | `#C8972F` |
| `deploy/assessment/assessment.css` | 37 | `#FFFFFF` |
| `deploy/assessment/assessment.css` | 199 | `#FFFFFF` |
| `deploy/assessment/assessment.css` | 263 | `#FFFFFF` |
| `deploy/assessment/assessment.css` | 268 | `#FFFFFF` |
| `deploy/clinical-dashboard.html` | 46 | `rgba(14,27,44,.08)` |
| `deploy/clinical-dashboard.html` | 54 | `rgba(14,27,44,.06)` |
| `deploy/clinical-dashboard.html` | 60 | `rgba(14,27,44,.14)` |
| `deploy/clinical-dashboard.html` | 61 | `rgba(255,218,214,.35)` |
| `deploy/clinical-dashboard.html` | 67 | `rgba(255,255,255,.65)` |
| `deploy/employer-dashboard.html` | 28 | `rgba(255,255,255,.06)` |
| `deploy/employer-dashboard.html` | 30 | `rgba(255,255,255,.06)`, `rgba(255,255,255,.1)` |
| `deploy/employer-dashboard.html` | 64 | `rgba(200,151,47,.14)` |
| `deploy/employer-dashboard.html` | 65 | `rgba(31,53,87,.12)` |
| `deploy/employer-dashboard.html` | 66 | `rgba(62,154,100,.14)` |
| `deploy/employer-dashboard.html` | 67 | `rgba(154,165,180,.2)` |
| `deploy/employer-dashboard.html` | 68 | `rgba(62,154,100,.18)` |
| `deploy/employer-dashboard.html` | 91 | `rgba(200,151,47,.1)` |
| `deploy/employer-dashboard.html` | 95 | `rgba(14,27,44,.35)` |
| `deploy/employer-dashboard.html` | 110 | `rgba(62,154,100,.14)` |
| `deploy/employer-dashboard.html` | 111 | `rgba(154,165,180,.2)` |
| `deploy/employer-dashboard.html` | 115 | `rgba(200,151,47,.16)`, `rgba(200,151,47,.4)` |
| `deploy/employer-dashboard.html` | 116 | `rgba(200,151,47,0)`, `rgba(200,151,47,.5)` |
| `deploy/employer-dashboard.html` | 117 | `rgba(200,151,47,.18)` |
| `deploy/employer-dashboard.html` | 341 | `rgba(200,151,47,.07)` |
| `deploy/followup.html` | 57 | `rgba(20,30,40,.45)` |
| `deploy/hse-portal.html` | 20 | `rgba(80,140,156,.12)` |
| `deploy/hse-portal.html` | 26 | `rgba(59,71,90,.35)` |
| `deploy/hse-portal.html` | 34 | `rgba(255,255,255,.1)` |
| `deploy/hse-portal.html` | 41 | `rgba(14,27,44,.08)` |
| `deploy/hse-portal.html` | 42 | `rgba(14,27,44,.12)` |
| `deploy/hse-portal.html` | 47 | `rgba(186,26,26,.2)`, `rgba(14,27,44,.08)` |
| `deploy/hse-portal.html` | 50 | `rgba(255,255,255,.55)`, `rgba(186,26,26,.2)` |
| `deploy/hse-portal.html` | 87 | `rgba(11,28,48,.4)` |
| `deploy/hub/index.html` | 17 | `rgba(255,255,255,.08)` |
| `deploy/hub/index.html` | 33 | `rgba(200,151,47,.4)` |
| `deploy/hub/index.html` | 36 | `rgba(200,60,60,.14)`, `rgba(200,60,60,.35)` |
| `deploy/hub/index.html` | 40 | `rgba(14,27,44,.35)` |
| `deploy/hub/index.html` | 62 | `rgba(22,32,46,.08)` |
| `deploy/hub/index.html` | 66 | `rgba(22,32,46,.07)` |
| `deploy/hub/index.html` | 69 | `rgba(200,151,47,.16)`, `rgba(94,107,124,.16)` |
| `deploy/hub/index.html` | 70 | `rgba(60,120,90,.14)`, `rgba(60,120,90,.2)`, `rgba(200,120,40,.18)` |
| `deploy/hub/index.html` | 74 | `rgba(200,120,40,.12)`, `rgba(200,120,40,.35)` |
| `deploy/hub/index.html` | 76 | `rgba(22,32,46,.15)` |
| `deploy/hub/index.html` | 78 | `rgba(22,32,46,.1)` |
| `deploy/measurement.html` | 68 | `rgba(20, 30, 40, .45)` |
| `deploy/presenter.js` | 36 | `#fff`, `#C8972F`, `#C8972F`, `rgba(14,27,44,.25)` |
| `deploy/presenter.js` | 37 | `#0E1B2C` |
| `deploy/presenter.js` | 38 | `#26333f` |
| `deploy/presenter.js` | 39 | `#5E6B7C` |
| `deploy/presenter.js` | 40 | `#0E1B2C` |
| `deploy/screens/index.html` | 13 | `rgba(255,255,255,.08)` |
| `deploy/sigma-crtw-connection.html` | 12 | `rgba(255,255,255,.09)` |
| `deploy/sigma-crtw-connection.html` | 43 | `rgba(255,255,255,.04)` |
| `deploy/sigma-crtw-connection.html` | 69 | `rgba(255,255,255,.08)` |
| `deploy/sigma-crtw-connection.html` | 86 | `rgba(255,255,255,.03)` |
| `deploy/sigma-crtw-connection.html` | 96 | `rgba(200,151,47,.05)` |
| `deploy/sigma-panel.html` | 15 | `rgba(255,255,255,.09)` |
| `deploy/sigma-panel.html` | 29 | `rgba(255,255,255,.12)` |
| `deploy/sigma-panel.html` | 58 | `rgba(255,255,255,.12)` |
| `deploy/sigma-panel.html` | 60 | `rgba(0,0,0,.18)` |
| `deploy/sigma-portal.html` | 37 | `rgba(11,28,48,.05)` |
| `deploy/sigma-portal.html` | 59 | `rgba(0,0,0,.06)` |
| `deploy/support.js` | 98 | `rgba(217,119,87,0)`, `rgba(247,225,211,.95)`, `rgba(217,119,87,0)` |
| `deploy/support.js` | 106 | `rgba(255,255,255,.3)`, `rgba(0,0,0,.5)` |
| `deploy/support.js` | 115 | `#b00020`, `#fff` |
| `deploy/support.js` | 1254 | `#f0eee6` |
| `deploy/support.js` | 1255 | `#2e2c26` |
| `deploy/wcb-portal.html` | 22 | `rgba(11,28,48,.15)` |
| `deploy/wcb-portal.html` | 37 | `rgba(11,28,48,.15)` |
| `deploy/wcb-portal.html` | 41 | `rgba(11,28,48,.06)` |
| `deploy/wcb-portal.html` | 47 | `rgba(11,28,48,.06)` |
| `deploy/wcb-portal.html` | 80 | `rgba(11,28,48,.4)` |
| `deploy/worker-dashboard.html` | 17 | `rgba(14,27,44,.2)` |
| `deploy/worker-dashboard.html` | 30 | `rgba(14,27,44,.10)` |
| `deploy/worker-dashboard.html` | 31 | `rgba(14,27,44,.12)` |
| `deploy/worker-dashboard.html` | 108 | `rgba(14,27,44,.4)` |
| `deploy/worker-dashboard.html` | 116 | `rgba(255,255,255,.14)` |
| `deploy/worker-dashboard.html` | 121 | `rgba(11,28,48,.55)` |
| `deploy/worker-dashboard.html` | 123 | `rgba(14,27,44,.4)` |
| `deploy/worker-dashboard.html` | 142 | `rgba(11,28,48,.5)` |
| `deploy/worker-dashboard.html` | 144 | `rgba(14,27,44,.4)` |
| `deploy/worker-embed.html` | 40 | `rgba(200,151,47,.08)` |
| `deploy/worker-embed.html` | 42 | `rgba(200,151,47,0)`, `rgba(200,151,47,.45)` |
| `deploy/worker/first-run.html` | 39 | `rgba(255,255,255,.5)` (twice) |
| `deploy/worker/login.html` | 15 | `rgba(255,255,255,.45)` (twice) |
| `deploy/worker/movement-check.html` | 34 | `rgba(198,40,40,.92)` |
| `deploy/worker/movement-check.html` | 36 | `rgba(14,27,44,.75)` |
| `deploy/worker/signup.html` | 15 | `rgba(255,255,255,.45)` (twice) |
| `deploy/worker/today.html` | 43 | `rgb(14 27 44/15%)` |

Logo SVGs (brand marks, not UI tokens): `deploy/continuum-logo.svg`
line 1 repeats `#ffffff` (15 times) and `#bf912f` (9 times);
`deploy/continuum-logo-dark.svg` line 1 repeats `#0E1B2C` (15 times)
and `#bf912f` (9 times).

`supabase/seed.sql` line 23: `#0E1B2C`, `#C8972F` (seed data, not a
surface).

### 4.C worker-app, hub-roles, Framer, root demo HTML

| File | Line | Value |
|---|---|---|
| `hub-roles/src/main.jsx` | 11 | `#0E1A2F`, `#182642`, `#26375C`, `#E8A33D` |
| `hub-roles/src/main.jsx` | 12 | `#DFE7F4`, `#8FA3C2`, `#22314F` |
| `deploy/hub/roles.js` | 40 | same seven hex (compiled bundle) |
| `deploy/hub-roles.test.mjs` | 42 | same seven hex (suite asserts the source) |
| `worker-app/tailwind.config.ts` | 7 | `#0E1B2C`, `#16243B`, `#1C2C47`, `#27395A` |
| `worker-app/tailwind.config.ts` | 8 | `#E9EEF6`, `#9AA9BF`, `#C8972F`, `#E3B85C` |
| `worker-app/tailwind.config.ts` | 9 | `#6FBF8F`, `#122036` |
| `worker-app/src/app/globals.css` | 6 | `#0E1B2C`, `#E9EEF6` |
| `worker-app/src/components/History.tsx` | 26 | `#9AA9BF` |
| `worker-app/src/components/History.tsx` | 27 | `#C8972F` |
| `framer/ContinuumSignIn.tsx` | 24 | `#E9EEF6` |
| `framer/ContinuumSignIn.tsx` | 25 | `#9AA9BF` |
| `framer/ContinuumSignIn.tsx` | 26 | `#16243B` |
| `framer/ContinuumSignIn.tsx` | 27 | `#1C2C47` |
| `framer/ContinuumSignIn.tsx` | 28 | `#27395A` |
| `framer/ContinuumSignIn.tsx` | 59 | `#C8972F` |
| `framer/ContinuumSignIn.tsx` | 60 | `#0E1B2C` |
| `framer/ContinuumSignIn.tsx` | 213 | `rgba(200,151,47,0.12)` |
| `framer/ContinuumSignIn.tsx` | 228 | `rgba(200,151,47,0.0)`, `rgba(200,151,47,0.5)`, `rgba(200,151,47,0.0)` |
| `framer/ContinuumSignIn.tsx` | 254 | `rgba(0,0,0,0.5)` |
| `framer/ContinuumSignIn.tsx` | 277 | `#14100a` |
| `framer/ContinuumSignIn.tsx` | 307 | `#2E5A8C` |
| `framer/ContinuumSignIn.tsx` | 338 | `#C8972F` |
| `framer/ContinuumSignIn.tsx` | 339 | `#0E1B2C` |
| `framer/ContinuumWorkerApp.tsx` | 35 | `#E9EEF6` |
| `framer/ContinuumWorkerApp.tsx` | 36 | `#9AA9BF` |
| `framer/ContinuumWorkerApp.tsx` | 37 | `#16243B` |
| `framer/ContinuumWorkerApp.tsx` | 38 | `#1C2C47` |
| `framer/ContinuumWorkerApp.tsx` | 39 | `#27395A` |
| `framer/ContinuumWorkerApp.tsx` | 40 | `#6FBF8F` |
| `framer/ContinuumWorkerApp.tsx` | 113 | `#C8972F` |
| `framer/ContinuumWorkerApp.tsx` | 114 | `#0E1B2C` |
| `framer/ContinuumWorkerApp.tsx` | 600 | `rgba(0,0,0,0.55)` |
| `framer/ContinuumWorkerApp.tsx` | 672 | `#2E5A8C` |
| `framer/ContinuumWorkerApp.tsx` | 718 | `#14100a` |
| `framer/ContinuumWorkerApp.tsx` | 735 | `#14100a` |
| `framer/ContinuumWorkerApp.tsx` | 950 | `rgba(200,151,47,0.0)`, `rgba(200,151,47,0.45)`, `rgba(200,151,47,0.0)` |
| `framer/ContinuumWorkerApp.tsx` | 952 | `rgba(200,151,47,0.08)` |
| `framer/ContinuumWorkerApp.tsx` | 987 | `#14100a` |
| `framer/ContinuumWorkerApp.tsx` | 992 | `#14100a` |
| `framer/ContinuumWorkerApp.tsx` | 1025 | `#14100a` |
| `framer/ContinuumWorkerApp.tsx` | 1180 | `#14100a` |
| `framer/ContinuumWorkerApp.tsx` | 1276 | `#C8972F` |
| `framer/ContinuumWorkerApp.tsx` | 1277 | `#0E1B2C` |
| `worker-app-section.html` | 9 | `#0E1B2C`, `#E9EEF6` |
| `worker-app-section.html` | 13 | `#C8972F` |
| `worker-app-section.html` | 15 | `#AAB6C6` |
| `worker-app-section.html` | 16 | `#6E87AD`, `#27395A` |
| `worker-app-section.html` | 19 | `#C8972F`, `#14100a` |
| `worker-app-section.html` | 20 | `#E3B85C` |
| `worker-app-section.html` | 21 | `#E9EEF6`, `#27395A` |
| `worker-app-section.html` | 22 | `#6E87AD` |
| `worker-app-section.html` | 23 | `#27395A`, `#0E1B2C`, `rgba(0,0,0,.55)` |
| `worker-app-section.html` | 25 | `#AAB6C6` |
| `worker-app-section.html` | 26 | `#E9EEF6` |

### 4.D Appendix: marketing, legal, demo (excluded by `no-raw-hex.test.mjs`)

#### `deploy/index.html` (marketing landing; own palette at lines 45 to 70)

| Line | Value |
|---|---|
| 45 | `#FBF8F3` |
| 46 | `#F6F0E6` |
| 47 | `#FFFFFF` |
| 48 | `#F4F6F8` |
| 51 | `#0E1B2C` |
| 52 | `#1B2C3F` |
| 53 | `#2C3E52` |
| 54 | `#41556B` |
| 55 | `#5A6D80` |
| 56 | `#5D7085` |
| 59 | `#E3DCCF` |
| 60 | `#E4EAF0` |
| 61 | `#CFD8E1` |
| 64 | `#C39A45` |
| 65 | `#8A6414` |
| 66 | `#FAF3E4` |
| 69 | `#0F7A55` |
| 70 | `#E6F5EE` |
| 80 | `rgba(14,27,44,.04)` |
| 81 | `rgba(14,27,44,.22)` |
| 82 | `rgba(14,27,44,.34)` |
| 112 | `#fff` |
| 134 | `#fff` |
| 137 | `rgba(14,27,44,.03)` |
| 138 | `#fff` (twice) |
| 154 | `rgba(251,248,243,.86)` |
| 159 | `rgba(14,27,44,.02)` |
| 171 | `rgba(14,27,44,.04)` |
| 177 | `rgba(14,27,44,.03)` |
| 186 | `rgba(195,154,69,.10)` |
| 210 | `#fff` |
| 214 | `#fff` |
| 215 | `rgba(255,255,255,.45)` (twice) |
| 227 | `#fff` |
| 234 | `rgba(15,122,85,.32)` |
| 313 | `rgba(195,154,69,.55)` |
| 324 | `rgba(195,154,69,.34)` |
| 332 | `rgba(195,154,69,.75)` |
| 364 | `#fff` |
| 379 | `rgba(15,122,85,.3)` |
| 380 | `rgba(195,154,69,.45)` |
| 386 | `#fff` |
| 389 | `rgba(195,154,69,.20)` |
| 392 | `#fff` |
| 393 | `rgba(255,255,255,.76)` |
| 395 | `rgba(255,255,255,.6)` |
| 396 | `rgba(255,255,255,.86)` |
| 397 | `#fff` |
| 448 | `rgba(195,154,69,.34)`, `rgba(195,154,69,.8)` |
| 624 | `#0F7A55` |
| 625 | `#0F7A55` |
| 630 | `#0F7A55` |
| 632 | `#0F7A55` |
| 733 | `#C39A45` |
| 734 | `#C39A45` |
| 735 | `#0E1B2C` |

#### Legal and 404

| File | Line | Value |
|---|---|---|
| `deploy/privacy.html` | 10 | `#0E1B2C`, `#16243B`, `#27395A`, `#E9EEF6`, `#9AA9BF`, `#C8972F` |
| `deploy/privacy.html` | 16 | `rgba(200,151,47,.1)` |
| `deploy/privacy.html` | 21 | `#D5DEEA` |
| `deploy/privacy.html` | 23 | `#D5DEEA` |
| `deploy/terms.html` | 10 | `#0E1B2C`, `#16243B`, `#27395A`, `#E9EEF6`, `#9AA9BF`, `#C8972F` |
| `deploy/terms.html` | 16 | `rgba(200,151,47,.1)` |
| `deploy/terms.html` | 21 | `#D5DEEA` |
| `deploy/terms.html` | 23 | `#D5DEEA` |
| `deploy/404.html` | 15 | `#0E1B2C` |
| `deploy/404.html` | 17 | `#C8972F` |
| `deploy/404.html` | 18 | `#E3B968` |
| `deploy/404.html` | 22 | `#0E1B2C`, `#0A1526` |
| `deploy/404.html` | 24 | `#14243B`, `#C8972F`, `rgba(255,255,255,.08)` |
| `deploy/404.html` | 25 | `#C8972F` |
| `deploy/404.html` | 26 | `#fff`, `#C8972F` |
| `deploy/404.html` | 27 | `#AAB6C6` |
| `deploy/404.html` | 28 | `#C8972F`, `#0E1B2C`, `#E3B968`, `#0E1B2C` |

#### Demo

| File | Line | Value |
|---|---|---|
| `deploy/demo/index.html` | 12 | `#0E1B2C` |
| `deploy/demo/index.html` | 14 | `#C8972F` |
| `deploy/demo/index.html` | 15 | `#E3B968` |
| `deploy/demo/index.html` | 19 | `#0E1B2C`, `#0A1526` |
| `deploy/demo/index.html` | 21 | `#14243B`, `#C8972F`, `rgba(255,255,255,.08)` |
| `deploy/demo/index.html` | 22 | `#C8972F` |
| `deploy/demo/index.html` | 23 | `#fff`, `#C8972F` |
| `deploy/demo/index.html` | 24 | `#AAB6C6` |
| `deploy/demo/index.html` | 25 | `#C8972F`, `#0E1B2C` |

### 4.E Test files that plant hex (not product colour)

| File | Line | Value | Why |
|---|---|---|---|
| `deploy/no-raw-hex.test.mjs` | 43 | `#1A66BC` | self-test that the gate matches |
| `deploy/tokens-contrast.test.mjs` | 41 | `#FFFFFF`, `#F5F7F9` | contrast fixtures |
| `deploy/tokens-contrast.test.mjs` | 143 | `#1E8A6E` | brand green, must fail 4.5:1 |
| `deploy/tokens-contrast.test.mjs` | 144 | `#949494` | fabricated sub-floor |
| `deploy/tokens-contrast.test.mjs` | 145 | `#000000` | sanity (21:1) |

### 4.F Docs and specs (not the working interface)

Hex also appears as documentation examples, not shipped UI. Counts
from this tip's walk (docs trees only, excluding the inventory tables
themselves once this file lands):

| File | Hit count |
|---|---|
| `docs/prompts/51-design-system/SECTION_1.md` | 220 (stale inspection tables) |
| `docs/superpowers/plans/2026-07-30-hub-email-password-auth.md` | 9 |
| `docs/superpowers/plans/2026-07-18-worker-app-increment-1.md` | 7 |
| `docs/superpowers/specs/2026-07-18-worker-app-design.md` | 3 |
| `specs/CONTINUUM_PROMPT_05_RECONCILIATION.md` | 3 |
| `specs/CONTINUUM_ASSESSMENT_STEP1_PLAN.md` | 2 |
| `specs/CLAUDE_CODE_PROMPT_04.md` | 1 |
| `specs/CONTINUUM_ASSESSMENT_STEP1_DESIGN.md` | 1 |
| `specs/CONTINUUM_PROMPT_06.md` | 1 |
| `specs/CONTINUUM_PROMPT_07.md` | 1 |
| `specs/CONTINUUM_PROMPT_12.md` | 1 |
| `specs/CONTINUUM_PROMPT_12b.md` | 1 |
| `docs/prompts/50/SECTION_1.md` | 1 |
| `docs/prompts/52/SECTION_1.md` | 1 |
| `zeus-missions.md` | 1 |

Out of scope: `node_modules` (not walked), `package-lock.json`,
`.git`, binaries.

**Defect.** Acceptance criterion 1 / 3.6 baseline is this list.
`no-raw-hex.test.mjs` does not cover JS, worker-app, hub-roles, Framer,
assessment CSS, or `rgba()`. Gold `#C8972F` and navy/gold marketing
hex remain on product-adjacent surfaces. This leftover list is **not
migrated** in Prompt 54 (would rewrite screens). Token-file defects
only if any remain. On this tip, the print and dark-text token-file
defects are already closed.

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
dependency, not a job). Do not add that pipeline. `package.json` is
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
field INP/CLS/Lighthouse, and no axe runner. `G1_AUDIT_REPORT.md`
Section 2 already recorded no Sentry / Datadog / PostHog / Vercel
Analytics.

Only lab-shaped Node suites exist. No field measurement exists. Do
not invent FCP/INP/CLS numbers. Do not add a fake 800ms FCP gate.

### Map of section 11 gates 1 to 10

Gate numbers follow the Prompt 58 comments already on this tip
(`a11y-tokens.test.mjs` names gates 2, 4, 6, 7 and the rendered set;
`tokens-contrast.test.mjs` is section 11.2; `status-greyscale.test.mjs`
is section 11.3; `banned-strings.test.mjs` is 11.10 and 11.7).
`Continuum_Project_ICON.md` is cited in `continuum_tokens.css` line 7
and is **not** in this repository.

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

`deploy/continuum_tokens.css` lines 645 to 652:

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

`--font-ui` at lines 139 to 140 (and `continuum-vars.css` lines 106 to
107) names Inter first, then system fallbacks.

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

Token comment at `continuum_tokens.css` line 636 states a committed
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

Token contract (`continuum_tokens.css` lines 34 to 36): these three
attributes belong on `<html>`. Setting theme on `<body>` leaves the
root background light and shows a band on overscroll. Do not move
theme to `<body>`.

**Today (added in #153):** product shells that already link
`continuum-vars.css` or `continuum_tokens.css` set all three on
`<html>`. Contract suite: `deploy/html-attrs.test.mjs`.

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
`<html>` to dark or compact.

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
hardcoded `#0E1B2C` / `#E9EEF6`. That is a dark colour-scheme on
`:root`, still not `data-theme`. Not switched in this mission.

**Placement stands.** Attributes belong on `<html>`. Existing
`class="light"` on seven portals stays. Do not move theme to
`<body>`.

**Defect.** None for placement on the contracted shells. Assessment,
marketing, legal, 404, demo, worker redirect, and worker-app remain
unset. That is the leftover set, not a reason to move theme to body.

---

## Product Behaviour STOPS (do not invent)

The Product Behaviour prompt is not in this repository. Cited
sections whose exact content this inspection refused to invent:

- 0.2
- 4.2
- 6.1
- 6.2
- 6.5
- 7.2
- 7.4
- 9
- 9.2
- 12
- 14

Where Prompt 54 restates a rule (draft label is real DOM text, never
`::before`; brand green retired from working UI; dark/Compact tokens
only; 44px targets on holding; no new screen), this inspection uses
that restatement. Where exact Product Behaviour wording would be
required to accept or fail a criterion, the criterion stays STOP /
not attempted. Do not invent a substitute sentence.

---

## Prompt 53 holds (still apply)

Recorded from `docs/prompts/53/HOLDS.md` on this tip. Not relaxed by
Prompt 54 review and build.

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
   verification does not. Nothing ships.
2. **Product Behaviour absent.** STOP where cited sections 0.2, 4.2,
   6.1, 6.2, 6.5, 7.2, 7.4, 9, 9.2, 12, 14 need exact content beyond
   Prompt 54 restatement.
3. **Inter woff2 missing.** Token `@font-face` cannot load. Google
   Fonts `display=swap` is the live path on most portals. Do not add
   a binary.
4. **`continuum_tokens.css` is almost unused at runtime.** Holding
   page only. Product surfaces use `continuum-vars.css` (light vars,
   no base rules).
5. **`no-raw-hex` scope gap.** Product HTML solids are mostly tokens;
   `rgba()`, JS, worker-app, hub-roles, Framer, and assessment CSS
   still carry raw colour. That is the 3.6 leftover list. Not
   migrated.
6. **No RUM, no lab or field FCP/INP/CLS.** Section 10 cannot be
   accepted on numbers that do not exist. Do not estimate.
7. **Status icons and draft field are CSS/module only.** Not mounted
   on product HTML. Do not mount them in this mission.
8. **`data-board` marker exists in the linter and not on live copy.**
9. **Brand green `#1E8A6E` is retired** in comments and proven below
   4.5:1. Comment/test-only. Do not reintroduce it on the working
   interface.
10. **Dark and Compact are tokens only.** Shipping either as a
    feature is a defect. No user-menu control. No html default to
    dark or compact.
11. **holding.html 44px targets** are already present (`.btn` lines
    109 to 110, `.req-form input` line 129, `footer a` lines 165 to
    166, `.gate-toggle` lines 186 to 187, `.gate-form input` line
    209, `.gate-submit` lines 225 to 226). Do not restyle holding
    to change them.

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
