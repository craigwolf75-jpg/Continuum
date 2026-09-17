# Prompt 62 Section 1: prerequisite inspection

Inspected on 2026-09-17 from tip
`5a77e2c481f6666a11f3e1592e695aaedf6df00d`
(`fix(Prompt 61): get-help coordinator and helpnow anchors
(#170)`).
Branch `cursor/prompt-62-access-gate-3c45`.

Read only for this document. No write to product code, no
migration apply, no seed, no live apply, no credential use,
no test authoring in this dispatch. This file is written
first, before product code.

Scope is the public marketing site only. Do not re-open
platform, clinical, or worker product files for a later
build from this draft.

No em dashes or en dashes anywhere.
Do not claim Argus CLEAN. Prompt 53 holds were released
2026-09-16 by Craig. Hold lift is not an auto-execute.
Do not invent G1 closed. Do not invent a ship.

The literal launch access code is never written here.
`ACCESS_GATE_CODE` as an env var name is recorded as
absent. That is not a place to put the code.

**Headline.** Prompt 62 needs seven answers before any
product code. All seven are answerable from this tip.
The Request access form and the `marketing_leads` store
already exist (commit `d06a5eb` is an ancestor of this
tip). Remaining work is not that form. The Access code
path is the live Prompt 40 site gate, not a stub. Email
uses the existing Resend notifier. Storage uses the
existing platform/hub Supabase. The info@ mailbox is
live by Craig confirmation plus MX. Cookie TTL, launch
env check, failure copy, and site-access fail-open are
gaps for a later product dispatch on this same branch.

---

## Headline answers

1. **Marketing site lives here.** This Continuum repo.
   Live URL `https://continuumrtw.com` (`README.md`
   line 3). Plain HTML/CSS/JS static site. Vercel
   Framework preset Other. Root of the packaged site
   is `deploy/`. Project name `continuum-o51l` in
   source. Live project settings UNVERIFIED.
2. **Request access is a form, not mailto.** Holding
   and `/book` post to `/api/marketing-lead`. Commit
   `d06a5eb` already on this tip.
3. **Access code is wired to the live Prompt 40
   gate.** POST `/api/site-access` against
   `public.access_codes` via `validate_and_log_access`.
   Not a stub. Not wired to `ACCESS_GATE_CODE` (that
   name is absent). Cookie is a 30 minute session
   cookie, not 30 days. GAP.
4. **A valid code reveals the marketing homepage.**
   `ct_site` lets middleware allow `/`, which serves
   `deploy/index.html`. Not a pending booking fragment.
   Do not alter Book a demo.
5. **Email sending exists.** Resend in
   `deploy/api/_notify.js`. `sendLeadNotification`
   already forwards Prompt 62 leads. Do not provision
   a new provider. Production key set: UNVERIFIED.
6. **Storage home is `public.marketing_leads`** on the
   existing site-gate Supabase. File
   `supabase/migrations/20260815120000_marketing_leads.sql`.
   Live apply: UNVERIFIED. Do not create a new project.
7. **info@continuumrtw.com is live.** Craig confirmed
   the mailbox LIVE on 2026-09-17. MX this session:
   `1 smtp.google.com.` Do not send test mail.

---

## Prompt 53 holds were released 2026-09-16 by Craig

From [../53/HOLDS.md](../53/HOLDS.md). Former Prompt 53
holds are no longer binding under Prompt 53. Hold lift
is not an auto-execute. Not relaxed here as a ship.

Named human dispatch still required before Montreal,
Bedrock, non-SYNTH seed, or live schema apply.

- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands.
- Do not invent REV 2.
- Do not invent G1.

This inspection does not apply
`20260815120000_marketing_leads.sql` live.

---

## Check 1. Where the marketing site lives

**Repository.** This repo (Continuum).

**Live site.** `https://continuumrtw.com`
(`README.md` line 3: `Live site: https://continuumrtw.com`).

**Framework.** Plain HTML/CSS/JS static site. Vercel
Framework preset Other.

Evidence: `deploy/README.txt` line 5:
`No build step; this is a static site. Framework preset: Other.`

`deploy/package.json` line 2: `"name": "continuum-site-gate"`.
Line 3: `"type": "module"`. Description (line 5) says
the module type is required so Vercel registers ESM
`middleware.js` as Routing Middleware.

**Hosting.** Vercel. Packaged site root is `deploy/`.
Project name `continuum-o51l` in
`docs/DEPLOY-prompt-40-site-gate.md` line 26
(`Set these on the continuum-o51l project`) and
`G1_AUDIT_REPORT.md` line 27 (`deploy target
continuum-o51l (memory, UNVERIFIED live)`).

G1 line 27: VERIFIED (source) that Vercel is the host;
tier UNVERIFIED.

The dashboard field "Root Directory = deploy" is the
standing packaged-site path from source. Live Vercel
project settings: UNVERIFIED.

**Deploy path.** Push to `main`, Vercel auto-deploy
(`G1_AUDIT_REPORT.md` line 39: deploys automatically
from `main` via the Git integration; auto-deploy
trigger UNVERIFIED live). This draft stays DRAFT.

**Public marketing surfaces on this tip.**

- `deploy/index.html` (gated homepage)
- `deploy/gate/holding.html` (Layer 0 holding at `/`
  without cookie)
- `deploy/book.html`
- `deploy/privacy.html`
- `deploy/terms.html`
- `deploy/legal-config.js`
- `deploy/site-links.js`

---

## Check 2. How Request access is wired today

**It is not a mailto anymore.** Quote the current
markup.

`deploy/gate/holding.html` lines 264 to 268:

```
      <form class="req-form" id="reqForm" novalidate>
        <label for="reqEmail" class="sr-only">Your work email</label>
        <input type="email" id="reqEmail" name="email" placeholder="Your work email" autocomplete="email" required>
        <button type="submit" class="btn btn-primary" id="reqSubmit">Request access</button>
      </form>
```

Posts to `/api/marketing-lead`
(`holding.html` line 376:
`fetch("/api/marketing-lead", {`).
Source `"/gate"` (line 379:
`body: JSON.stringify({ email: email, source: "/gate" })`).

`deploy/book.html` is the same form pattern
(lines 112 to 116). Posts to `/api/marketing-lead`
(line 155). Source `"/book"` (line 158).

This already replaced the old mailto. Commit
`d06a5eb` (`Prompt 62: access-gate lead capture
(Request access form)`, 2026-08-15) is an ancestor
of this tip. Also on the tip: `4baac0f` (allowlist
`/api/marketing-lead` in the site gate) and
`a7ebb8f` (Prompt 62a public contact swap).

Report that honestly. Remaining work is not this
form.

Middleware already allows the lead POST without a
cookie (`deploy/middleware.js` line 82:
`"/api/marketing-lead"` in `ALWAYS_PUBLIC_EXACT`).

---

## Check 3. What the Access code field does on submit

**WIRED TO SOMETHING LIVE (Prompt 40 site gate), not
a stub, not nothing.**

`holding.html` lines 323 to 326 post
`POST /api/site-access` with `{ code, path: "/" }`:

```
    fetch("/api/site-access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: code, path: "/" })
```

`deploy/api/site-access.js` header (lines 3 to 6):
validates against `public.access_codes` via the
`validate_and_log_access` RPC. On match, signs a
`ct_site` session via `issueSiteCookie` (line 245)
and returns Set-Cookie. On miss, 401 (lines 240 to
242: `res.status(401).json({ ok: false, error: "invalid code" })`).

**It is not yet wired to `ACCESS_GATE_CODE`.** Grep
of the repository for `ACCESS_GATE_CODE` returns
zero hits. The Prompt 62 launch-period env check
is a GAP. The literal launch code must never be
written into this file or any file.

**Failure copy today** (`holding.html` line 333):
`That code was not recognized.`
Prompt 62 wants:
`That code was not recognized. Check it and try again.`
GAP.

**Rate limit today:** 10 attempts per IP per hour.
`site-access.js` line 36: `const MAX_ATTEMPTS = 10;`
line 37: `const WINDOW_SECONDS = 60 * 60; // 1 hour`
Comment line 39: `10 attempts per IP per hour`.
Prompt 62 example is ten per minute. Existing
10/hour is more strict. A Prompt 62 per-minute
modest limit is still a GAP if we need the stated
example.

---

## Cookie gap (part of check 3 / check 2)

`deploy/api/_site_session.js`:

- Cookie name `ct_site`, HttpOnly, Secure,
  SameSite=Lax, Path=/
  (line 110:
  `return "ct_site=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/";`)
- `serializeSiteCookie` has NO Max-Age and NO
  Expires (session cookie). Lines 104 to 108:
  `No Max-Age and no Expires, so it is a true
  session cookie`.
- `SITE_SESSION_TTL_SECONDS = 30 * 60`
  (line 119: 30 minute idle). Middleware slides
  it (`middleware.js` lines 308 to 310).
- `signSession` comment (lines 60 to 62) still
  mentions `exp = iat + 30 days in seconds`, but
  the issuer uses 30 minutes (`issueSiteCookie`
  line 126:
  `signSession({ iat, exp: iat + SITE_SESSION_TTL_SECONDS }`).

Prompt 62 requires a signed httpOnly cookie valid
for 30 days. GAP.

`deploy/site-session.test.mjs` lines 79 to 82
already assert the 30 minute session cookie (no
Max-Age, no Expires). A later product dispatch
that changes TTL must update those tests. This
dispatch does not.

---

## Check 4. What a valid access code reveals

A valid `ct_site` cookie lets middleware
`decideSiteAccess` allow the originally requested
path (`deploy/middleware.js` line 242:
`return hasValidCookie ? "allow" : "holding";`).
`/` is not in `ALWAYS_PUBLIC_EXACT`. No cookie
rewrites to `/gate/holding`
(`rewriteToHolding`, lines 367 to 368).

Success on the holding form does `location.reload()`
(`holding.html` line 329), so `/` then serves
`deploy/index.html` (the full marketing homepage),
not a pending booking fragment.

**Book a demo** on the holding page already points
at `/book` (`holding.html` line 269:
`<a class="btn btn-secondary" href="/book">Book a demo</a>`).
Not `#booking-url-pending`.
`deploy/book-access.test.mjs` line 31 asserts
`holding Book a demo CTA points at /book`.
Line 32 asserts holding no longer uses the
pending booking placeholder.
**DO NOT ALTER Book a demo.**

`#booking-url-pending` remains only as a comment
in `deploy/index.html` lines 914 to 916
(`This replaces the "#booking-url-pending"
placeholder that was left on the previous
homepage.`) and in
`docs/DEPLOY-prompt-40-site-gate.md`.
`index.html` Talk to Our Team uses Calendly
(line 846:
`href="https://calendly.com/craig-continuumrtw"`,
`data-route="contact"`). That is behind the site
gate. Leave it.

**Gated destination exists:** the marketing
homepage (`deploy/index.html`) plus other
site-gated marketing/demo surfaces. Hub portals
(employer / clinical / wcb / admin) still require
a second hub session
(`middleware.js` lines 114 to 116:
`HUB_GROUP1_PREFIXES`, `HUB_GROUP2_PREFIXES`,
`HUB_ADMIN_PREFIXES`). Nothing clinical is served
by the holding-page success path itself. Method:
middleware allowlist plus hub second gate.

**Report.** Destination is the existing marketing
homepage at `/`, not a Gary-supplied booking URL.
A placeholder internal page is not required. If
Gary later supplies a different reveal URL, that
is a Section 5 item, not this draft.

---

## Check 5. Existing email sending capability

**YES. Do not provision a new provider.**

`deploy/api/_notify.js`: Resend via `fetch` to
`https://api.resend.com/emails`
(line 18: `RESEND_ENDPOINT`).

Env var names only (no secret values):
`RESEND_API_KEY`, `SIGNUP_NOTIFY_TO` (normally
`info@continuumrtw.com`), `SIGNUP_NOTIFY_FROM`.

Gated: no-op if either key or recipient unset
(lines 8 to 11, `readNotifyConfig` lines 41 to 46).

`sendLeadNotification` already exists for
Prompt 62 leads (lines 73 to 106). Storage first:
`deploy/api/marketing-lead.js` line 91 calls
`sendLeadNotification` after a successful store,
best effort, never fails the request
(`Best effort forward; never blocks or fails
the request.`).

Whether production has `RESEND_API_KEY` set is
UNVERIFIED (do not read live env). If
unconfigured, storage still succeeds and
forwarding awaits the existing provider being
switched on. Not a new provider.

---

## Check 6. Storage home for marketing_leads

**Existing platform/hub database** (same Supabase
the site gate already uses).

File:
`supabase/migrations/20260815120000_marketing_leads.sql`

Table `public.marketing_leads`
(lines 8 to 13: `id bigserial`, `email text not null`,
`source_page text`, `created_at timestamptz default now()`).
RLS on (line 17). No anon/authenticated policies
(lines 18 to 19). Service key only from
`/api/marketing-lead`.

Env var names:
`CONTINUUM_SUPABASE_URL` or `SUPABASE_URL`,
`CONTINUUM_SUPABASE_SERVICE_KEY` or
`SUPABASE_SERVICE_ROLE_KEY`
(`marketing-lead.js` lines 72 to 73).

Do not create a new Supabase project. Do not apply
this migration live in this draft. File only.
SYNTH test only. Whether the migration is already
applied on the live project is UNVERIFIED.

Site-local storage (`localStorage`) is not the
home.

---

## Check 7. Is info@continuumrtw.com deliverable

Craig confirmed the mailbox is LIVE on 2026-09-17
(user dispatch). That is a human confirmation.

MX check run this session (do not send test mail):

- continuumrtw.com MX: `1 smtp.google.com.`
- A: `216.150.1.1`
- NS: Squarespace DNS
  (`nsb1.squarespacedns.com.`,
  `nsb2.squarespacedns.com.`,
  `nsb3.squarespacedns.com.`,
  `nsb4.squarespacedns.com.`)

MX presence: YES, Google Workspace mail. Combined
with Craig's 2026-09-17 confirmation, treat the
mailbox as live for the 62a sequencing gate. Still
do not send test mail. Still DRAFT.

---

## 62a address survey

Public marketing site already uses
`info@continuumrtw.com` (commit `a7ebb8f` already
on this tip):

- `deploy/gate/holding.html` line 285
  `mailto:info@continuumrtw.com`
- `deploy/book.html` line 120 same
- `deploy/index.html` lines 848 and 889
- `deploy/privacy.html` line 46
- `deploy/terms.html` line 47
- `deploy/legal-config.js` line 7
  `supportEmail: 'info@continuumrtw.com'`
- `deploy/worker/signup.html` line 54
  (worker surface, out of scope for 62a rewrite)

`craig@continuumrtw.com` remaining, NOT public
marketing (do not rewrite):

- `deploy/api/_hub_session.js` line 33
  `ADMIN_EMAILS`
- `deploy/admin-hub-users.html` line 58
- tests: `deploy/hub-signin.test.mjs` line 38,
  `deploy/hub-admin.test.mjs` lines 18 to 21,
  `deploy/site-codes-admin.test.mjs` line 51

62a asks to report every path/line. Record the
already-swapped marketing locations and the
out-of-scope admin identity uses.

---

## Fail-open / three-layer resilience

`marketing-lead.js` already has timeout 8000ms
(`STORE_TIMEOUT_MS = 8000`, line 18), fail-open
to plain failure JSON (lines 94 to 97:
`fail open to the plain failure, not an error
screen`), structured log without the address
(line 86: `never the address`).

`site-access.js` is Prompt 40 fail-CLOSED
(missing env or error returns 503:
lines 210 to 214 `gate not configured`,
lines 249 to 251 `fail closed on any unexpected
error`). Prompt 62 wants fail-open to the plain
failure message, timeout, structured log without
the submitted code. GAP on the `ACCESS_GATE_CODE`
path.

---

## What this inspection does not authorise

- Putting the launch code in any file
- `package.json` edits
- New email provider
- New Supabase project
- Live schema apply
- Touching platform auth, worker, clinical,
  physician
- Altering Book a demo
- Ship

---

## Gaps recorded (not a build in this dispatch)

1. `ACCESS_GATE_CODE` env check is absent. The
   launch-period env path is a GAP. Do not write
   the literal code into any file.
2. Access-code failure copy is
   `That code was not recognized.` Prompt 62 wants
   `That code was not recognized. Check it and try again.`
3. Cookie is a 30 minute idle session cookie
   (no Max-Age, no Expires). Prompt 62 wants a
   signed httpOnly cookie valid for 30 days.
4. `site-access.js` is fail-CLOSED (503 on missing
   env or error). Prompt 62 wants fail-open to the
   plain failure message, timeout, and a structured
   log that never includes the submitted code.
5. A Prompt 62 per-minute modest rate limit is a
   GAP if the stated example (ten per minute) must
   be implemented. Existing 10/hour is stricter.
6. Whether `RESEND_API_KEY` is set in production
   is UNVERIFIED. Forwarding waits on the existing
   provider. Not a new provider.
7. Whether
   `20260815120000_marketing_leads.sql` is applied
   on the live project is UNVERIFIED. File only
   in this draft. SYNTH test only later.
8. Live Vercel project settings (Root Directory,
   auto-deploy trigger, host tier) remain
   UNVERIFIED. G1 host is VERIFIED (source) only.
9. If Gary later supplies a different reveal URL,
   that is a Section 5 item. Not this draft.

This inspection does not close those gaps. It does
not author product code, migrations, or tests. A
later product dispatch on this same branch may
fill them.

---

## Human gates (untouched)

`package.json`, consent wording, legal pages,
pricing, email templates, credentials, live schema
apply, occupational seed beyond SYNTH, live
Bedrock, Montreal. Hub admin identity
(`craig@continuumrtw.com` in `ADMIN_EMAILS`) is
out of scope.

This dispatch wrote this
file only.
