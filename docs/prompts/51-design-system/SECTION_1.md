# Prompt 51 Design System Section 1: prerequisite inspection

**Prompt 54 / Prompt 58 cross-link.** The design-system /
surface-standard prompt is now unified Prompt 58. Prompt 54
remains the earlier sequenced review-and-build record. This
folder is the earlier #152/#153 landing. It is not Core Platform
Foundations. Prompt 58 [REGISTER.md](../58/REGISTER.md) is the
governing register. Prompt 58
[SECTION_1.md](../58/SECTION_1.md) is the current inspection.
Prompt 54 [SECTION_1.md](../54/SECTION_1.md) is the earlier
inspection (tip `3c256de`). This file stays as the pre-token
inspection of tip `fca8548`. Do not treat these line numbers as
current.

Inspected on 2026-09-16 from tip `fca85484916c5f95cbd707a1b1b7ccccd272435e`
(`Prompt 50a architecture decisions (do not ship) (#151)`).
Read only for this document. No write, seed, live apply, or credential use
in this inspection. No tokens, gates, HTML attributes, or tests were
implemented in this phase.

**Headline.** This is the Prompt 51 Design System / Surface Standard
inspection (Project ICON converted to surface requirements). It adds no
module, no dashboard, no AI component, and no screen. It is **not** Core
Platform Foundations. It does **not** touch `platform/db`, `docs/prompts/50/`,
or `docs/prompts/50a/`.

**Numbering.** Prompt 50a calls Core Platform Foundations "Prompt 51"
(Prompt 50 retired by supersession; repo comments on `0000` to `0018` still
say Prompt 51). This file is Prompt 51 Design System, the surface standard.
The two share a number and must stay separate. The token file already on
this tip titles itself "PROMPT 58 (unified stream; Craig's PROMPT 51)"
(`deploy/continuum_tokens.css` lines 1 to 6).

Standing holds unchanged: no live Bedrock, Prompt 44 Canada/no-train STOP,
no occupational seed, 0018/0019 unapplied, Athena does not ship, no live
schema apply, `package.json` locked. No em dashes or en dashes anywhere.

---

## Check 1. Hub authentication fix (Prompt 33), deployed and verified by Craig

**UNVERIFIED. STOP for ship.**

The hub authentication path is present on this tip and covered by Node
suites. Grep of `*.md`, `*.js`, `*.mjs`, and `*.html` for `verified by Craig`,
`Craig verified`, and `verified by Gary` returns **zero** records. Nothing
in this repository states that Craig verified the Prompt 33 hub
authentication fix. This inspection does **not** claim ship-ready.

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
| `deploy/middleware.js` | Site gate vs hub gate. Lines 195 to 201 allow `/api/hub-signin` and `/api/hub-signup` as hub-auth API paths. Line 328 reads `cookies.ct_session`. |

Suites present: `deploy/hub-auth.test.mjs`, `deploy/hub-signin.test.mjs`,
`deploy/hub-signup.test.mjs`, `deploy/hub-whoami.test.mjs`,
`deploy/hub-signout.test.mjs`, `deploy/hub-middleware-access.test.mjs`,
`deploy/site-middleware.test.mjs` (hub-auth path cases at lines 189 to 250).

`deploy/admin-portal.html` line 150 has an in-app Zeus status string
`Prompt 33 hub and the admin fix shipped`. That is demo copy, not a Craig
verification record.

**STOP for ship.** Athena may still author tokens and gates later on a
draft PR. This phase does neither. Do not claim ship-ready.

**Defect.** Craig verification of the Prompt 33 hub authentication fix is
absent from the repository.

---

## Check 2. Component library today

**No third-party component library is in the repository.** Grep of every
`package.json` for `@radix-ui`, `@mui/`, `antd`, `@chakra-ui`,
`@headlessui`, `shadcn`, and `@shadcn` returns zero matches.

There is therefore **nothing to replace**. STOP before replacing means:
do not introduce Radix, MUI, Ant, Chakra, shadcn, or Headless UI, and do
not replace Framer Motion or Tailwind. Retrofitting tokens onto what
exists is the correct path. Replacing a library would be a decision for
Craig. That decision does not arise here because no third-party
component library exists.

### Package roots (versions from the files)

| Package root | Role | Versions |
|---|---|---|
| `deploy/package.json` | Vercel static site gate | `@vercel/functions` 3.7.6, `xmllint-wasm` 4.0.2. No UI library. |
| `hub-roles/package.json` | Hub role-select bundle (Prompt 33) | React `^18.3.1`, React DOM `^18.3.1`, Framer Motion `^11.3.0`, Vite `^5.4.0`, `@vitejs/plugin-react` `^4.3.1` |
| `worker-app/package.json` | Worker app | Next.js `14.2.5`, React `18.3.1`, TypeScript `^5.5.0`, Tailwind CSS `^3.4.0`, Capacitor `^6.1.0` |

Framer Motion is a **motion library**, not a component library. Tailwind
is a **utility framework**. Both stay. STOP before replacing either.

### Components, by source

Every visitor-facing control below is **hand-written HTML/CSS/JS** unless
a named library is stated.

**Hub role cards** (`hub-roles/src/main.jsx`, bundled to `deploy/hub/roles.js`):
hand-written React. Seven cards (Worker, HSE, Employer, Clinical Partner,
WCB, Platform Admin, SIGMA Exchange) at lines 20 to 28. Brand badge,
wordmark, card, pill, and "soon" state are inline CSS (function `styleTag`,
lines 57 to 80). Motion uses Framer Motion `animate` and
`useReducedMotion` (line 8). Colours are a local hex object `T` (lines 10
to 13), not design tokens.

**Hub shell** (`deploy/hub/index.html`): hand-written login box, brand
mark, wordmark, `.btn`, role mount for the React IIFE.

**HTML product portals** (each file is a self-contained shell with inline
CSS and inline script; shared chrome is copied, not imported):

| Surface | File | Hand-written pieces |
|---|---|---|
| Clinical dashboard | `deploy/clinical-dashboard.html` | top bar, search, who-chip, sidebar, KPI tiles, claims table, worker list, analytics, settings, `.btn`, `.card`, pills, modal, toast |
| Worker dashboard | `deploy/worker-dashboard.html` | cards, `.btn`, sliders, chat, settings, signup wizard, recovery log |
| Employer dashboard | `deploy/employer-dashboard.html` | cards, tiles, tables, setup flow |
| HSE portal | `deploy/hse-portal.html` | coordinator queue, claims, workers, analytics, settings |
| WCB portal | `deploy/wcb-portal.html` | claims terminal, search, deadline alerts, analytics, settings |
| Admin portal | `deploy/admin-portal.html` | Olympus, tenants, users, grants, billing, audit, settings, modal, toast |
| Admin site codes | `deploy/admin-site-codes.html` | form, table |
| Admin hub users | `deploy/admin-hub-users.html` | form, table |
| SIGMA portal | `deploy/sigma-portal.html` | exchange cards, flags |
| SIGMA panel | `deploy/sigma-panel.html` | status pills, panel chrome |
| SIGMA CRTW | `deploy/sigma-crtw-connection.html` | connection explainer |
| Measurement | `deploy/measurement.html` | SCR-MEAS-01 fieldsets, radios, rail |
| Follow up | `deploy/followup.html` | SCR-FUP-01 fieldsets, sparklines, badges |
| Assessment | `deploy/assessment/index.html` plus `assessment.css` / `assessment.js` | public assessment form |
| Worker companion | `deploy/worker/*.html` | login/signup cards, today, check-in, first-run, duties, privacy, progress, movement-check, companion-settings, support-offer, get-help, clinician-handoff, employer-view |
| Worker embed | `deploy/worker-embed.html` | consent, check-in, `.btn`, `.card` |
| App demo | `deploy/app/index.html` | phone-frame worker demo |
| Screens index | `deploy/screens/index.html` | screen list |
| Book / access | `deploy/book.html` | request-access form |
| Site gate | `deploy/gate/holding.html` | holding page (the only HTML that links `continuum_tokens.css`) |

**Buttons in HTML.** Each portal defines its own `.btn` (and often
`.btn.ghost`) in a page-local `<style>` block. Examples:
`deploy/worker-dashboard.html` line 31, `deploy/wcb-portal.html` line 37,
`deploy/hub/index.html` line 29, `deploy/worker/today.html` line 77.
There is no shared button component.

**Cards.** Page-local `.card` rules. Examples:
`deploy/worker-dashboard.html` line 30, `deploy/wcb-portal.html` line 47,
`deploy/worker/login.html` line 12, `deploy/worker/today.html` line 59.

**Status icons.** Hand-written SVG contract in `deploy/status-icons.mjs`
(Prompt 58 section 6.6): five named silhouettes `ok`, `caution`, `stop`,
`draft`, `none`, plus `statusMarkup()`. Consumed by
`deploy/status-greyscale.test.mjs`. Grep of product HTML for
`statusMarkup`, `STATUS_ICONS`, and `data-provenance` returns **no live
markup**. The draft field treatment exists only as CSS in
`deploy/continuum_tokens.css` lines 536 to 565.

**Draft field.** Token CSS only: `.field[data-provenance="ai_draft"]`
(`continuum_tokens.css` line 536). Not mounted on a product page.

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
`framer/ContinuumWorkerApp.tsx`, `framer/ContinuumSignIn.tsx`. Hardcoded
hex (see Check 4).

**STOP.** Do not replace Framer Motion `^11.3.0`. Do not replace Tailwind
`^3.4.0`. Do not add a third-party component library.

**Defect.** None for "a library is already here and must not be replaced."
The gap is the opposite: there is no shared component library, only
copied page-local chrome.

---

## Check 3. Token layer

**Yes. Two CSS custom-property files, plus a separate Tailwind theme
object.** No JS theme object in the product shells.

### `deploy/continuum_tokens.css` (full Prompt 58 layer)

Header (lines 1 to 36) names it "CONTINUUM DESIGN TOKENS", Prompt 58
unified stream / Craig's Prompt 51. It is a token layer plus four
never-overridable rules (focus ring, target floors, draft treatment,
reduced motion). It is **not** a component library.

Shape:

- `:root` light palette (`--ink-*`, `--action-*`, `--ok-*`, `--warn-*`,
  `--stop-*`, `--draft-*`) then semantic aliases (`--bg-*`, `--text-*`,
  `--border-*`, `--state-*`, type, space, motion, targets).
- `[data-density="compact"]` at line 232, forced back to comfortable
  under `@media (any-pointer: coarse)` at line 244.
- `[data-theme="dark"]` at line 265: a `--d-*` palette layer, then
  semantic remaps.
- Base `html` / `body` rules at lines 337 to 348.
- `@media print` at line 356: **assigns raw hex to semantic tokens**
  (see Defects).
- Focus, targets, draft field, status, reduced motion, `.prose`,
  `@font-face` Inter Variable.

Colour-scheme at `:root` is `light` only (line 43). Dark is opt-in via
`[data-theme="dark"]`.

**Linked from one HTML page only:** `deploy/gate/holding.html` line 10.
Product portals link `continuum-vars.css` instead.

### `deploy/continuum-vars.css` (light variables only)

Header (lines 1 to 5): "VARIABLES ONLY (light). Single source for the
existing-page colour migration: no base rules." Same light palette and
semantic aliases as the token file through `--content-max` (line 191).
No dark block, no compact density, no focus/target/draft/motion rules,
no `@font-face`.

Linked by most product HTML (clinical, worker, employer, HSE, WCB,
admin, SIGMA, hub, measurement, followup, book, assessment, worker
companion pages, and others). See the `continuum-vars.css` grep in
`deploy/`.

### Tailwind theme object

`worker-app/tailwind.config.ts` lines 6 to 10 define hardcoded hex under
`theme.extend.colors`: `navy`, `panel`, `panel2`, `line`, `ink`,
`muted`, `gold`, `goldsoft`, `good`, `chipbg`. This is a second colour
source, not a consumer of `continuum_tokens.css`.

### Where colours are defined today

1. Token files (intended single home): `continuum_tokens.css`,
   `continuum-vars.css`.
2. Tailwind config and `worker-app/src/app/globals.css`.
3. Hub role-select local object `T` in `hub-roles/src/main.jsx`.
4. Page-local palettes: marketing `deploy/index.html` lines 43 to 70,
   assessment `deploy/assessment/assessment.css` lines 6 to 18,
   legal pages, 404, demo, presenter, support, Framer exports.
5. Raw `rgba(...)` shadows and overlays on product HTML that already
   consume token vars for solids.

Token comment rule 5 (`continuum_tokens.css` line 24): "This file is the
ONLY place hex literals live." That rule is already false on this tip
(see Check 4). Brand green `#1E8A6E` is cited at lines 28 to 29 as
retired from the working interface (4.27:1 on white, fails the text
floor). `deploy/tokens-contrast.test.mjs` line 92 asserts that same hex
is below 4.5:1 on white.

**Defects recorded, not fixed:**

1. Print block (`continuum_tokens.css` lines 361 to 395) assigns raw hex
   to semantic tokens (`--text-primary: #0E1B2C`, `--state-ok: #0B5C40`,
   and the rest). Token rule 2 (line 18) says a theme block never
   assigns a raw hex to a semantic token. This is a §13 defect.
2. Dark theme maps `--state-*-text` to the same `--d-*` as `--state-*`
   (`continuum_tokens.css` lines 318 to 329). Light theme keeps them
   apart (`--state-ok` = `--ok-700`, `--state-ok-text` = `--ok-800`).
   First-draft conflation. Not fixed in this phase.
3. Most product surfaces load `continuum-vars.css` (no base rules, no
   dark, no focus/target/draft/motion). The full token file is almost
   unused at runtime.

---

## Check 4. Hardcoded colour inventory (baseline for §3.6 and acceptance criterion 1)

Method: repo walk on 2026-09-16, tip `fca8548`. Patterns:
`#[0-9A-Fa-f]{3}`, `#[0-9A-Fa-f]{6}`, `#[0-9A-Fa-f]{8}`, `rgb(`,
`rgba(`, `hsl(`, `hsla(`. HTML character entities (`&#8592;` and
similar) were stripped before matching so 4-digit entities are not
reported as colours. `node_modules`, `.git`, lockfiles, and binary
extensions were out of scope. `deploy/hub/roles.js` line 40 is a
minified Framer bundle; its `rgba("+js.transform` / `hsla("+Math.round`
hits are interpolator source, not authored colour literals, and are
omitted from the tables below. The seven hex values on that same line
are the compiled `T` palette and are listed under hub-roles.

`deploy/no-raw-hex.test.mjs` already gates **product HTML only**, and
excludes `index.html`, `privacy.html`, `terms.html`, `404.html`, and
`demo/index.html` (lines 17 to 29). It does not scan JS, CSS other than
by linking, worker-app, hub-roles, or Framer.

### 4.A Token files (lawful home of hex, per the token comments)

#### `deploy/continuum_tokens.css`

| Line | Value | Role |
|---|---|---|
| 46 | `#FFFFFF`, `#F5F7F9` | comment ratios |
| 50 | `#0E1B2C` | `--ink-900` |
| 51 | `#2C3E52` | `--ink-700` |
| 52 | `#41556B` | `--ink-600` |
| 53 | `#55697E` | `--ink-500` |
| 54 | `#6E7E8E` | `--ink-400` |
| 56 | `#AFBBC7` | `--ink-300` |
| 57 | `#D6DDE4` | `--ink-200` |
| 61 | `#EAEFF3` | `--ink-100` |
| 62 | `#F5F7F9` | `--ink-050` |
| 63 | `#FFFFFF` | `--white` |
| 66 | `#0E4680` | `--action-800` |
| 67 | `#12559E` | `--action-700` |
| 68 | `#1A66BC` | `--action-600` |
| 70 | `#418ED6` | `--action-500` |
| 71 | `#EAF2FB` | `--action-050` |
| 74 | `#0B5C40` | `--ok-800` |
| 75 | `#0F7A55` | `--ok-700` |
| 76 | `#E6F5EE` | `--ok-050` |
| 79 | `#6B4100` | `--warn-800` |
| 80 | `#8A5300` | `--warn-700` |
| 81 | `#C67A00` | `--warn-500` |
| 82 | `#FDF3E3` | `--warn-050` |
| 85 | `#8C1A15` | `--stop-800` |
| 86 | `#A8201A` | `--stop-700` |
| 87 | `#C62828` | `--stop-600` |
| 88 | `#FDECEA` | `--stop-050` |
| 92 | `#4E2E78` | `--draft-800` |
| 93 | `#6B3FA0` | `--draft-700` |
| 94 | `#F2EDF9` | `--draft-050` |
| 188 | `rgb(14 27 44 / 12%)` | `--shadow-popover` |
| 189 | `rgb(14 27 44 / 20%)` | `--shadow-dialog` |
| 261 | `#000` | comment (dark never uses it) |
| 268 | `#151C26`, `#0F141B`, `#1D2732` | comment ratios |
| 269 | `#0F141B` | `--d-page` |
| 270 | `#151C26` | `--d-surface` |
| 271 | `#1D2732` | `--d-raised` |
| 272 | `#1B2E45` | `--d-selected` |
| 274 | `#F2F5F8` | `--d-ink-000` |
| 275 | `#C9D3DD` | `--d-ink-100` |
| 276 | `#9AA8B6` | `--d-ink-200` |
| 278 | `#6FB0F2` | `--d-action` |
| 279 | `#8CC2F7` | `--d-action-hover` |
| 281 | `#4FC08D` | `--d-ok` |
| 282 | `#E9A93C` | `--d-warn` |
| 283 | `#F2726A` | `--d-stop` |
| 284 | `#B08BE0` | `--d-draft` |
| 286 | `#12291F` | `--d-ok-bg` |
| 287 | `#2C2213` | `--d-warn-bg` |
| 288 | `#2E1917` | `--d-stop-bg` |
| 289 | `#241C33` | `--d-draft-bg` |
| 291 | `#70849A` | `--d-border` |
| 292 | `#2A3644` | `--d-divider` |
| 293 | `#2A3644` | `--d-card` |
| 332 | `rgb(0 0 0 / 45%)` | dark `--shadow-popover` |
| 333 | `rgb(0 0 0 / 60%)` | dark `--shadow-dialog` |
| 361 to 395 | raw hex on semantic tokens | **print block, §13 defect** (full list in Check 3) |

Print-block hex at lines 361 to 395: `#FFFFFF` on `--bg-page`,
`--bg-surface`, `--bg-raised`, `--bg-subtle`, `--bg-selected`,
`--text-on-fill`, `--state-ok-bg`, `--state-caution-bg`,
`--state-stop-bg`, `--state-draft-bg`; `#0E1B2C` on `--text-primary`,
`--text-body`; `#2C3E52` on `--text-secondary`, `--border-strong`;
`#41556B` on `--text-tertiary`, `--state-none`; `#0E4680` on
`--text-link`, `--text-link-hover`, `--border-selected`, `--focus-ring`;
`#55697E` on `--border-control`; `#6E7E8E` on `--border-divider`,
`--border-card`; `#0B5C40` on `--state-ok`, `--state-ok-text`;
`#6B4100` on `--state-caution`, `--state-caution-text`; `#8C1A15` on
`--state-stop`, `--state-stop-text`; `#4E2E78` on `--state-draft`,
`--state-draft-text`.

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
gate never opens.

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
`deploy/continuum-logo-dark.svg` line 1 repeats `#0E1B2C` (15 times) and
`#bf912f` (9 times).

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

#### `deploy/index.html` (marketing landing; own palette at lines 43 to 70)

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
| `deploy/tokens-contrast.test.mjs` | 40 | `#FFFFFF`, `#F5F7F9` | contrast fixtures |
| `deploy/tokens-contrast.test.mjs` | 92 | `#1E8A6E` | brand green, must fail 4.5:1 |
| `deploy/tokens-contrast.test.mjs` | 93 | `#949494` | fabricated sub-floor |
| `deploy/tokens-contrast.test.mjs` | 94 | `#000000` | sanity (21:1) |

### 4.F Docs and specs (not the working interface)

Hex and rgb also appear as documentation examples, not shipped UI:

| File | Hit count |
|---|---|
| `docs/superpowers/plans/2026-07-30-hub-email-password-auth.md` | 29 |
| `docs/superpowers/plans/2026-07-18-worker-app-increment-1.md` | 21 |
| `docs/superpowers/specs/2026-07-18-worker-app-design.md` | 9 |
| `specs/CONTINUUM_PROMPT_05_RECONCILIATION.md` | 6 |
| `specs/CONTINUUM_ASSESSMENT_STEP1_PLAN.md` | 4 |
| `specs/CLAUDE_CODE_PROMPT_04.md` | 2 |
| `specs/CONTINUUM_ASSESSMENT_STEP1_DESIGN.md` | 2 |
| `specs/CONTINUUM_PROMPT_06.md` | 2 |
| `specs/CONTINUUM_PROMPT_07.md` | 2 |
| `specs/CONTINUUM_PROMPT_12.md` | 2 |
| `specs/CONTINUUM_PROMPT_12b.md` | 2 |
| `docs/prompts/50/SECTION_1.md` | 1 |
| `zeus-missions.md` | 1 |

Out of scope: `node_modules` (not walked), `package-lock.json`,
`.git`, binaries.

**Defect.** Acceptance criterion 1 / §3.6 baseline is this list.
`no-raw-hex.test.mjs` does not cover JS, worker-app, hub-roles, Framer,
assessment CSS, or `rgba()`. Gold `#C8972F` and navy/gold marketing
hex remain on product-adjacent surfaces.

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
headless a11y workflow. `@playwright/test` appears only as a transitive
entry inside `worker-app/package-lock.json` (not a declared dependency,
not a job).

### Build-time linters that already exist (globbed by `suites.yml`)

| Suite | What it gates |
|---|---|
| `deploy/tokens-contrast.test.mjs` | Prompt 58 section 11.2 / acceptance criterion 2. WCAG 2.2 contrast on `continuum_tokens.css`. |
| `deploy/a11y-tokens.test.mjs` | Prompt 58 section 11 gates 2, 4, 6, 7, plus print. Token-file contracts only. |
| `deploy/banned-strings.test.mjs` | Prompt 58 sections 0.2 and 11.10 / acceptance criterion 16. `data-board` exemption. Tone/emoji/exclamation reported for section 11.7, not build-failing. |
| `deploy/no-raw-hex.test.mjs` | Prompt 58 section 13 / acceptance criterion 1. Product HTML only. Excludes marketing/legal/404/demo. |
| `deploy/status-greyscale.test.mjs` | Prompt 58 section 11.3 / acceptance criterion 4. Shape distinguishability. |
| `deploy/status-icons.mjs` | Icon contract consumed by the greyscale suite (not itself a `*.test.mjs`). |

`data-board` is the board-marker in `banned-strings.test.mjs` lines 12,
48 to 49, and 89 to 90. Grep of product HTML for `data-board` returns
**zero** live attributes. Grep for a live `board:` key prefix on copy
returns only test labels (`board: nineteen open claims` in presenter
suites) and engine/admin objects, not visitor-facing `board:` copy.

### Other lint scripts

`worker-app/package.json` line 7 declares `"lint": "next lint"`. There
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

§10 depends on the lab vs field distinction. **Only lab-shaped Node
suites exist. No field measurement exists.**

### Map of §11 gates 1 to 10

Gate numbers below follow the Prompt 58 comments already on this tip
(`a11y-tokens.test.mjs` names gates 2, 4, 6, 7 and the rendered set;
`tokens-contrast.test.mjs` is section 11.2; `status-greyscale.test.mjs`
is section 11.3; `banned-strings.test.mjs` is 11.10 and 11.7).
`Continuum_Project_ICON.md` is cited in `continuum_tokens.css` line 6
and is **not** in this repository.

| Gate | As named in the existing suites | Disposition |
|---|---|---|
| 1 / 11.2 Contrast | `tokens-contrast.test.mjs` | **Already in `suites.yml`** (Node). |
| 2 Focus ring | `a11y-tokens.test.mjs` (2px + 2px offset, never `:where()`) | **Already in `suites.yml`** (Node, token file only). Rendered-page check can be added as a headless workflow. |
| 3 / 11.3 Greyscale / status shape | `status-greyscale.test.mjs` | **Already in `suites.yml`** (Node silhouette proxy). Pixel screenshot at 1366x768 is named as the manual criterion-4 check. |
| 4 Target floors | `a11y-tokens.test.mjs` (24px, 44px, `any-pointer`, worker) | **Already in `suites.yml`** (Node, token file only). Rendered hit-testing needs a headless workflow. |
| 5 axe scan | Named in `a11y-tokens.test.mjs` as a RENDERED gate | **Needs a headless-browser workflow.** Not addable as a Node string test. |
| 6 Reduced motion | `a11y-tokens.test.mjs` (zero `--motion-*` and reset transitions) | **Already in `suites.yml`** (Node, token file only). JS/Web Animations call sites need a headless or Node scan of consumers. |
| 7 Draft treatment | `a11y-tokens.test.mjs` (real DOM text, never `::before`) | **Already in `suites.yml`** (Node, token file only). Markup on a live page needs a headless workflow. |
| 8 Reflow at 320 | Named as RENDERED `reflow@320` | **Needs a headless-browser workflow.** |
| 9 Zoom at 200 | Named as RENDERED `zoom@200` | **Needs a headless-browser workflow.** |
| 10 / 11.10 Banned strings | `banned-strings.test.mjs` | **Already in `suites.yml`** (Node, product HTML). Tone/emoji/exclamation are reported for 11.7 human copy review, not failing. |

Additional RENDERED gates named in `a11y-tokens.test.mjs` and **not** in
the 1 to 10 list above: `aria-live`, `sparkline alt`. Both need a
headless-browser workflow.

Print full-token reset is already in `a11y-tokens.test.mjs` (criterion 19).

§13 no-raw-hex is already in `suites.yml` but scoped to product HTML.
Widening it to JS / worker-app / rgba is a Node-test extension, not a
new pipeline.

§10 FCP / INP / CLS field budgets **need RUM**. They cannot be added to
`suites.yml` as a substitute for field data. A lab Lighthouse or
Playwright trace would still be lab, not field.

---

## Check 6. Fonts, font-display, and worklist CLS

### Self-hosted Inter (token file only; file missing)

`deploy/continuum_tokens.css` lines 641 to 648:

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

`--font-ui` at lines 138 to 139 (and `continuum-vars.css` lines 106 to
107) names Inter first, then system fallbacks.

**No `*.woff2` file exists in the repository.** There is no `fonts/`
tree. `find` for `inter` / `woff2` under the workspace returns no font
binary. With `font-display: optional`, an uncached first load (and
every load, because the file is absent) stays on the fallback and Inter
never appears.

The `@font-face` rule is only in `continuum_tokens.css`, which only
`deploy/gate/holding.html` links. Holding then overrides body font to
`-apple-system, "Segoe UI", Roboto, system-ui, sans-serif`
(`holding.html` line 42).

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
42 use system stacks. Worker companion pages (`deploy/worker/*.html`)
set `font-family: var(--font-ui)` (Inter named in vars) but do **not**
load Google Fonts or the missing woff2, so they render the system
fallback. `deploy/worker/index.html` is a redirect with no font link.

### Worklist Cumulative Layout Shift

There is no page or suite named "worklist." The closest surfaces are
the claims / workers tables on `clinical-dashboard.html`,
`hse-portal.html`, and `wcb-portal.html`.

**Measured CLS on the worklist: No measurement exists (lab). No
measurement exists (field).** Do not estimate.

Token comment at `continuum_tokens.css` line 632 states a committed
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
suite that opens 500 cases. Grep for those metric names as measurements
(not as font-comment aspirations) returns nothing.

Do not estimate.

---

## Check 8. Where `data-theme`, `data-density`, and `data-surface` would live

Token contract (`continuum_tokens.css` lines 33 to 35): these three
attributes belong on `<html>`. Setting theme on `<body>` leaves the
root background light and shows a band on overscroll.

**Today:** grep of `*.html`, `*.js`, `*.mjs`, `*.tsx`, `*.ts`, `*.css`
for `data-theme`, `data-density`, and `data-surface` finds them **only**
inside `deploy/continuum_tokens.css` (selectors at lines 232, 245, 265,
358, 505 to 513) and the matching assertions in
`deploy/a11y-tokens.test.mjs`. **No HTML document sets them.**

Theme class today is on `<html>`, not `<body>`:

```
<html lang="en" class="light">
```

Files (line 2 in each): `deploy/clinical-dashboard.html`,
`deploy/worker-dashboard.html`, `deploy/wcb-portal.html`,
`deploy/sigma-portal.html`, `deploy/sigma-panel.html`,
`deploy/hse-portal.html`, `deploy/admin-portal.html`.

Grep for `class="light"` on `<body>` returns zero. Body tags are bare
(`<body>` or `<body>` with no theme class) across the HTML set.

Other shells use `<html lang="en">` or `<html>` with no theme class:
hub, worker companion, measurement, followup, book, assessment, index,
legal, 404, demo, holding, employer-dashboard, sigma-crtw-connection,
admin helpers, app/screens indexes.

`worker-app/src/app/layout.tsx` lines 14 to 15:

```
<html lang="en">
  <body>
```

`worker-app/src/app/globals.css` line 5 sets `:root { color-scheme: dark; }`
and line 6 paints `html, body` with hardcoded `#0E1B2C` / `#E9EEF6`.
That is a dark colour-scheme on `:root`, still not `data-theme`.

**Placement for a later phase (not this one):** add
`data-theme`, `data-density`, and `data-surface` on `<html>`. Existing
`class="light"` on `<html>` is the current theme hook and is already on
the correct element. Do not move theme to `<body>`.

**Defect.** The attribute contract is written and tested against the
token file, and is unset on every live document.

---

## Conflicts and defects this inspection must record

1. **Check 1 STOP.** Hub auth code and suites exist. Craig verification
   does not. Nothing ships.
2. **Print block assigns raw hex to semantic tokens**
   (`continuum_tokens.css` 361 to 395). §13 defect. Not fixed here.
3. **Dark `--state-*-text` conflated with `--state-*`**
   (`continuum_tokens.css` 318 to 329). Not fixed here.
4. **Inter woff2 missing.** Token `@font-face` cannot load. Google Fonts
   `display=swap` is the live path on most portals.
5. **`continuum_tokens.css` is almost unused at runtime.** Holding page
   only. Product surfaces use `continuum-vars.css` (light vars, no base
   rules).
6. **`no-raw-hex` scope gap.** Product HTML solids are mostly tokens;
   `rgba()`, JS, worker-app, hub-roles, Framer, and assessment CSS still
   carry raw colour. That is the §3.6 leftover list.
7. **No RUM, no lab or field FCP/INP/CLS.** §10 cannot be accepted on
   numbers that do not exist.
8. **Status icons and draft field are CSS/module only.** Not mounted on
   product HTML.
9. **`data-board` marker exists in the linter and not on live copy.**
10. **Brand green `#1E8A6E` is retired in comments and proven below
    4.5:1.** Do not reintroduce it on the working interface.

## Human gates (untouched)

`package.json`, consent wording, legal pages, pricing, email templates,
credentials, live schema apply, occupational seed, live Bedrock.
Athena does not ship. This phase wrote this file only.
