# Prompt 67. Section 00. Registration
notes.

REGISTERED NOT RELEASED. Draft PR.
Registration plus honesty STOP. Not a
Continuum product release.

Write date: 19 September 2026.
Registration date in the stream:
20 August 2026.

Registration notes only. Identity,
what is not in hand, Gary's two gate
rulings, route confirmations,
Calendly / booking-url-pending close,
Craig ICON hero approval,
conformance endorsed by the other
session (Continuum UNVERIFIED),
unseen docs, Nexus ask, og-image
blocker carried, and
deployment-when-unblocked.

The complete 48 KB self contained
`index.html` was not supplied to this
stream. Do not invent it here.

No em dashes or en dashes anywhere.

---

## What this is, and what is not in
hand

The note records a complete
`index.html` (48 KB, self contained,
no dependencies) built to an approved
specification and verified in real
Chromium at eight widths. THE FILE
ITSELF WAS NOT SUPPLIED to this
stream and was not committed
anywhere, as of the 20 August note:
it exists only with Gary and that
session.

Preserve it now: commit it to the
site repository on a branch, or
upload it here, so the artifact
cannot be lost.

The building session confirmed live
site facts:

- every path currently serves the
  access gate to unauthenticated
  visitors
- POST `/api/site-access` and
  `/api/marketing-lead` are live
- a shared token stylesheet exists
  but its values are unreadable from
  outside the gate
- the Vercel project `continuum-o51l`
  refuses its API (403 on
  deployments, 404 on the record)

Those are the other session's
confirmations. Continuum has not
verified that session's browser pass.

---

## The gate decision is the blocker,
and it is Gary's

The new page cannot do its job while
every path is gated. Two rulings
before any deployment:

1. Does `/` and its static assets
   join the gate middleware's allow
   list, becoming publicly readable?
2. Does the access code experience
   move behind Sign In, reusing the
   existing markup and the untouched
   `/api/site-access` endpoint?

Deploying before both are ruled
would replace the gate page and drop
the code box, a regression. This
ruling also completes Prompt 65's
open item on the gate's future at
launch, per the note.

Prompt 65 docs in this checkout
verify the live holding-page gate.
They do not contain a separately
titled "gate future at launch" line.
The sentence above is the note's
claim. It is not a Prompt 65 quote.

---

## Route confirmations before go live

`ROUTES.assessment` needs the real
assessment path (the built in
fallback scrolls instead of 404ing
until it is set).

`ROUTES.signIn` assumes `/hub` from
the July 30 walkthrough, unverifiable
from outside the gate.

The Talk to Our Team link is the
Continuum Calendly at
`calendly.com/craig-continuumrtw`:
open it once by hand before go live,
because the account's Teams trial
expired around July 31 and the free
plan keeps one event type.

Confirmed as is: `/privacy`,
`/terms`, the mailto, the in page
anchors.

---

## One open item closes, one brand
change needs Craig's name on it

The Calendly link closes the
booking-url-pending placeholder
recorded since Prompt 62.

The hero retires "Where care ends,
Continuum begins" in favour of
"Where medical decisions become safe
work" with the AI powered positioning
line. The note calls this the
approved wording. Confirm the
approval is Craig's (the ICON
lineage) before it ships, because it
retires the founding line of the
live site.

---

## Conformance, endorsed

Endorsed by the other session.
Continuum UNVERIFIED. Continuum has
not verified that session's browser
pass.

- No statistic, dollar figure,
  testimonial, or claim needing a
  source anywhere.
- No mechanism exposure (no scoring,
  matching, WCB mapping, or data
  model on the page).
- Fictional product data visibly
  captioned as fictional.
- WCAG AA measured with zero
  failures.
- The page renders fully with
  JavaScript disabled.
- No browser storage.
- One external request.

This is the stream's own law set,
independently kept.

---

## Names and documents logged

Unseen by this stream and joining
the ask list: the approved landing
specification and
`Continuum_MVP.html` (the product
prototype the palette was checked
against).

The note distinguishes the Continuum
Calendly from "the Nexus one". Nexus
is not a registered name in this
stream. Gary confirms what it is.

The `og-image.png` blocker (1200 by
630, referenced by meta tags, does
not exist) carries forward
unresolved.

---

## Deployment, when unblocked

The note's own steps govern: rule
the gate, replace the site root, set
and confirm the routes, move the
code box to Sign In leaving
`/api/site-access` alone. Deployment
then follows the standing site lane
process and Gary's direct push or PR
word.

Athena does not ship. Hermes ships
Continuum only when Craig names
ship. These files are not a ship
order.

---

## Checkout observation

Later-repo observations on tip
`a29084ea96782b3930b6919f9e60d49a313f4523`
(PR 178: ARGUS-HYG-177-001). Write
date 19 September 2026.

These do NOT close the NOT IN HAND
stop. They do NOT authorize ship.
Identity of the checkout file as THE
August 21 session artifact is
UNVERIFIED.

- `docs/prompts/67/` did not exist
  before this pass.
- `deploy/index.html` exists,
  48965 bytes. Git:
  `94e3a9947b9b8508e1962a635d5652cf3a4a4280`
  (20 August 2026), author Gary
  Ferenczi, "Add public landing page
  (Prompt 67), as built, on a
  branch" (48831 bytes on that
  commit). Later header tweak
  `fd52d0babdaf61064661eb95fd5d77fb4e87c96c`.
- Gate was opened then re-closed:
  `0cd7c77f4e9d290de1f73d7294f62d0f8f419be0`
  opened `/` for Prompt 67.
  `f9cf2b3bee269c9e2d727f496943746f041749e0`
  (2 September 2026, Gary) re-gated
  `/` and `/index.html` behind the
  holding page with the code box.
  Current `deploy/middleware.js`
  comments say the landing is GATED
  again. `/` is not on
  `ALWAYS_PUBLIC_EXACT`.
- `deploy/og-image.png` now exists
  (34817 bytes, PNG 1200 by 630,
  commit
  `622eb2eb5ed7741190424f73cf312512ad8b8344`).
  The NOTE still carried "missing"
  as a BLOCKER. Record both: the
  note's carried blocker, and the
  checkout file's presence. Whether
  that PNG is the intended asset
  (Prompt 40 handoff said locked
  logo plus the founding line) is
  UNVERIFIED. Do not close the
  blocker.
- Holding page
  `deploy/gate/holding.html` still
  has the access-code box and posts
  to `/api/site-access`.
- Prompt 65 docs in this checkout
  verify the live holding-page gate.
  They do not contain a separately
  titled "gate future at launch"
  line. Record the note's claim that
  Gary's two rulings complete Prompt
  65's open item on the gate's
  future at launch. Do not invent a
  Prompt 65 quote that is not in
  those files.

Do not paste or reconstruct
landing-page HTML. Paths, SHAs, and
byte sizes only.

---

## Cross-links

- [REGISTER.md](REGISTER.md)
- [STOPS.md](STOPS.md)
- [ACCEPTANCE.md](ACCEPTANCE.md)
- [../62/REGISTER.md](../62/REGISTER.md)
- [../62a/REGISTER.md](../62a/REGISTER.md)
- [../65/REGISTER.md](../65/REGISTER.md)
- [../65/SECTION_1.md](../65/SECTION_1.md)
