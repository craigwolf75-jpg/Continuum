# Prompt 63c acceptance (product-build draft)

Product build draft on branch
`cursor/prompt-63c-opt-in-save-b200`, from base tip
`18d416e91635ca952cc0df1f74b97fce1b259a2b`
(`Prompt 62 access gate and lead capture (do not
ship) (#171)`). This is a local/CI draft of the
opt-in save against SYNTH only. It is not a
live-platform product release. Athena does not
ship. Prompt 53 holds were released 2026-09-16
by Craig. Hold lift is not an auto-execute.

Do not claim Argus CLEAN. Do not claim
ship-ready. Hub authentication remains
UNVERIFIED: STOP for ship, not for this draft.

Calliope owns [REGISTER.md](REGISTER.md) and
[STOPS.md](STOPS.md). This file does not
overwrite REGISTER or STOPS. Athena copies
SAVE_EXPLAINER character for character. Gary
named strings stay unchanged.

No em dashes or en dashes anywhere.

---

## Product change this draft made

One visitor sentence, in
`deploy/assessment/assessment.js` `saveOfferInner`.

SAVE_EXPLAINER applied character for character:

Saving records an anonymous summary of the result you already see.

The forbidden explainer is gone:

Saving records an anonymous summary of your result to help improve the assessment.

That sentence invented aggregate / product
improvement use. It is forbidden under Prompt 63
Section 00 item 4. It is not restored.

Intro quote, unchanged, from
`deploy/assessment/assessment.js` `renderIntro`:

nothing is sent anywhere until you choose to save your result

Button, unchanged: Save my result

Confirm, unchanged: Your result is saved.

No new privacy or terms page. No return-to-result
feature. No prechecked state. No repeated
prompting. No schema change. No live apply. The
locked root `package.json` was not touched.

---

## Timestamp

The save timestamp is `created_at` on
`public.public_assessment_response`:
`timestamptz not null default now()`. File:
`supabase/migrations/20260815160000_public_assessment.sql`.
The RPC `submit_public_assessment` stores
`save_source` from the payload. The client tags
`save_source: 'user_initiated'` and does not send
a client clock. Server `now()` is the timestamp.

No new column. No migration edit. Schema changes
stop for Gary.

---

## Write path inventory

Searched: `deploy/assessment/**` (js, html, css,
config), `deploy/assessment-*.test.mjs`,
`deploy/supabase.js`, `deploy/config.js`, and
every `submit_public_assessment` /
`record_engagement` / `client.rpc` / `fetch` from
the assessment page. Line numbers are after this
draft's one string change.

| File | Line | Kept / removed | What triggers it |
|---|---|---|---|
| `deploy/assessment/assessment.js` | 246 (`persist`) | KEPT as write primitive | UI must not call it except via `saveResult`. Writes `submit_public_assessment` at line 251. |
| `deploy/assessment/assessment.js` | 263 (`taggedForSave`) | KEPT | No write. Copies the result and sets `save_source: 'user_initiated'`. |
| `deploy/assessment/assessment.js` | 273 (`saveResult`) | KEPT | User initiated. One write per activation. Calls `persist(taggedForSave(result), client)` at line 274. |
| `deploy/assessment/assessment.js` | 309 (`recordEngagement`) | KEPT | User initiated CTA. Writes `record_engagement` at line 313. No-op when `responseId` is falsy (no prior save). No write on render. |
| `deploy/assessment/assessment.js` | 456 (`handleSaveResult`) | KEPT | Save my result click. Builds the same anonymous summary, then calls `saveResult` at line 465. One write per activation. |
| `deploy/assessment/assessment.js` | 481 (`handleReviewResults`) | KEPT | Review my results click. Calls `recordEngagement` at line 484. No write without a prior save. |
| `deploy/assessment/assessment.js` | 496 (`handleBookADemo`) | KEPT | Book a Demo click. Calls `recordEngagement` at line 498. No write without a prior save. |
| `deploy/assessment/assessment.js` | 773 (`onClick` `save-result`) | KEPT | Routes Save my result to `handleSaveResult`. |
| `deploy/assessment/assessment.js` | 776 (`onClick` `review-results`) | KEPT | Routes Review my results to `handleReviewResults`. |
| `deploy/assessment/assessment.js` | 779 (`onClick` `book-a-demo`) | KEPT | Routes Book a Demo to `handleBookADemo`. |
| `deploy/assessment/assessment.js` | 687 (`render`) | KEPT as render only | Sets `innerHTML`. Does not call `persist`. |
| `deploy/assessment/assessment.js` | 539 (`renderSnapshot`) | KEPT as render only | Local state only. Offers save. Does not persist. |
| `deploy/assessment/assessment.js` | 589 (`renderResult`) | KEPT as render only | Local state only. Offers save. Does not persist. |
| Auto persist on snapshot or result render | (absent) | REMOVED | Must not exist. Not present after this draft. |
| Any other render or navigation write | (absent) | REMOVED | `start`, `to-snapshot`, `to-stage2`, `to-result`, and `restart` call `render` only. Abandon persists nothing. |
| `deploy/assessment/index.html` | (none) | no write | Loads scripts. Comment states nothing is sent on render or navigation. |
| `deploy/assessment/scoring.js` | (none) | no write | Scoring only. |
| `deploy/assessment/benchmark.js` | (none) | no write | Not loaded by the assessment page. |
| `deploy/assessment/config/crs-1.1.js` | (none) | no write | Config only. |
| `deploy/config.js` | (none) | no write | Client-safe URL and publishable key only. |
| `deploy/supabase.js` | (none) | no write | Builds the anon client. `persistSession` is auth session persistence, not an assessment write. |
| `deploy/site-links.js` | (none) | no write | Booking URL only. |
| Test spies in `deploy/assessment-persist.test.mjs` and `deploy/assessment-engagement.test.mjs` | (test only) | not a product write | Call `persist` / `saveResult` / `recordEngagement` with fake clients. No network. |

No `fetch` to Supabase from the assessment page.
The only product RPCs are `submit_public_assessment`
(via `persist`) and `record_engagement` (via
`recordEngagement`).

---

## 63c acceptance items

| Item | Verdict | Evidence |
|---|---|---|
| SAVE_EXPLAINER character for character | pass (product) | `saveOfferInner` in `assessment.js`. Heracles must re-assert; persist suite still quotes the forbidden sentence |
| Intro clause unchanged | pass (product) | `renderIntro`: nothing is sent anywhere until you choose to save your result |
| Save my result / Your result is saved. unchanged | pass (product) | `saveOfferInner` and `handleSaveResult` |
| SYNTH run: zero writes until save | pass (product, suite must prove) | `render` / snapshot / result / navigation do not call `persist`. `assessment-persist.test.mjs` already walks intro through both result surfaces with a spy client |
| One write tagged `user_initiated` | pass (product, suite must prove) | `saveResult` -> `taggedForSave` -> `persist`. Timestamp is `created_at` (server `now()`) |
| Abandon persists nothing | pass (product) | No write on leave, decline, or navigation. Declining leaves the offer; leaving never calls `persist` |
| No prechecked state, no repeated prompting | pass (product) | One offer per result surface. Button is not a checked control |
| No auto persist restored | pass (product) | Absent from `render`, `renderSnapshot`, `renderResult`, and navigation |
| Forbidden improve-the-assessment sentence gone | pass (product) | Replaced. Persist suite still asserts the old string; Heracles owns that update |
| Timestamp is `created_at` | pass (schema already) | `20260815160000_public_assessment.sql`. No new column |
| No invented privacy or terms | pass | Not added |
| No live schema apply | pass | File only. Not applied |
| Locked root `package.json` untouched | pass | Not edited |

---

## Tests (Heracles owns)

Athena does not write or edit test files.
Heracles owns tests and the green verdict.

Suites that must prove 63c:

- `deploy/assessment-persist.test.mjs` (zero writes
  on render and navigation; one write tagged
  `user_initiated`; confirmation; retry)
- `deploy/assessment-engagement.test.mjs` (CTA
  writes only after a prior save; no-op without
  a save)
- `deploy/assessment-smoke.test.mjs` and
  `deploy/assessment-smoke-11.test.mjs` (load
  order, dash rule, no-benchmark)
- `deploy/assessment-guardrails.test.mjs` and
  `deploy/assessment-guardrails-11.test.mjs`
  (config not in presentation, dash rule)

Gap for Heracles:
`deploy/assessment-persist.test.mjs` currently
asserts the forbidden explainer
("Saving records an anonymous summary of your
result to help improve the assessment."). That
assertion will fail after this product change.
Heracles must update it to SAVE_EXPLAINER
character for character. Athena does not edit
that file.

---

## Independent STOPs still standing

Prompt 53 holds were released 2026-09-16 by Craig.
Former Prompt 53 holds are no longer binding
under Prompt 53. Hold lift is not an auto-execute.

- Named human dispatch still required before
  Montreal, Bedrock, non-SYNTH seed, or live
  schema apply.
- No live schema apply.
  `supabase/migrations/20260815160000_public_assessment.sql`
  is a file only.
- Locked root `package.json` stays locked.
- Hub auth UNVERIFIED: STOP for ship.
- Section 00 item 4 still binds. Saved results
  serve the respondent's own result only until
  privacy and terms disclose aggregate use with
  counsel review. This draft does not invent that
  disclosure.
- Athena does not ship.

---

## What this draft did not do

- Did not rewrite the intro sentence.
- Did not restore auto persist.
- Did not restore the improve-the-assessment
  explainer.
- Did not invent privacy or terms pages, or
  aggregate-use disclosure.
- Did not add a return-to-result feature.
- Did not add prechecked state or repeated
  prompting.
- Did not edit test files.
- Did not edit Calliope REGISTER or STOPS.
- Did not edit the locked root `package.json`.
- Did not apply live schema.
- Did not invent G1 or REV 2.
- Did not run an Argus patrol that closes
  findings.
- Did not ship.
