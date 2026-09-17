# Prompt 62. The access gate and lead capture.

Docs first. This draft is the allowed product build after
Section 1 is on disk.
Still not a live-platform product release.
Athena does not ship. Prompt 53 holds were released
2026-09-16 by Craig.

Gary stream, 15 August 2026. Registers as unified
Prompt 62. Public marketing site continuumrtw.com only.
Touches no platform, auth, clinical, or worker code.

Amendment 62a is the footer contact. See
[../62a/REGISTER.md](../62a/REGISTER.md).

Section 0 language and claim rules override everything.
Continuum is a recovery support and coordination
platform. It does not diagnose, treat, or determine
fitness for work. The access gate is a velvet rope, not
authentication. Nothing clinical, personal, or
confidential may sit behind it.

This file and [STOPS.md](STOPS.md) are the Calliope docs
for this registration. Athena wrote
[SECTION_1.md](SECTION_1.md) before product code. Athena
writes [ACCEPTANCE.md](ACCEPTANCE.md) in the product-build
draft. Athena does not ship. Hermes does not treat this
file as a ship order.

Craig said build. Draft PR only.

No em dashes or en dashes anywhere.

---

## Status

Prompt 62 product-build DRAFT starts from main tip
`5a77e2c481f6666a11f3e1592e695aaedf6df00d`
(`fix(Prompt 61): get-help coordinator and helpnow
anchors (do not ship) (#170)`).
Branch: `cursor/prompt-62-access-gate-3c45`.
Section 1 is on disk. This is not a live-platform
product release. Prompt 53 holds were released 2026-09-16
by Craig. Former Prompt 53 holds are no longer binding
under Prompt 53. Hold lift is not an auto-execute.

Allowed scope this draft: docs first, then the public
marketing access gate and lead capture, plus the Prompt
62a footer contact swap. Public marketing site only.

Existing product code is already on this tip from earlier
commits `d06a5eb` (Prompt 62 lead capture) and `a7ebb8f`
(Prompt 62a footer swap). Section 1 reports that honestly.
This draft still fills remaining Prompt 62 gaps:
`ACCESS_GATE_CODE` env check, 30 day signed httpOnly
cookie, exact failure copy, and a modest per-minute rate
limit. Do not claim the product is already complete.

Mailbox `info@continuumrtw.com` confirmed LIVE by Craig
on 2026-09-17. That is the 62a sequencing gate. The
footer swap may be included in this draft. Still do not
ship.

Do not invent G1 closed. Do not invent REV 2. Do not
seed beyond SYNTH. Do not claim Argus CLEAN. Do not
apply live schema. Do not edit `package.json`.

---

## Numbering map

Left column is the stream name.

| Stream wrote | Unified | What it is |
|---|---|---|
| Gary stream, 15 August 2026 | 62 | This document. The access gate and lead capture. Public marketing site only. |
| Amendment 1, footer contact | 62a | Footer and address swap. Supersedes Section 3 item 6. [../62a/REGISTER.md](../62a/REGISTER.md). |

---

## Section 0 language and claim rules

These rules override every later section, every string, and
every field name.

Continuum is a recovery support and coordination
platform. Continuum does not diagnose. Continuum does
not treat. Continuum does not determine fitness for work.

Visitor copy is plain language, Grade 6 to 8. Calm.
Concrete. The next step is always visible.

The access gate is a velvet rope, not authentication.
It is not a login. It is not a clinical wall. It is not
a worker wall. Nothing clinical, personal, or
confidential may sit behind it.

The platform informs. People decide.

---

## Operating rule

This prompt may:

- hold a public marketing page behind a launch code
  checked only on the server
- take a work email from Request access and store it as
  a marketing lead
- forward that email to `info@continuumrtw.com` only if
  existing email capability is already present
- swap the public marketing contact address per Prompt 62a

This prompt may not authenticate a worker, an employer,
or a clinician. It may not open a portal. It may not
place clinical, personal, or confidential material
behind the rope.

---

## The design decision (binding)

The launch code lives in the server-side env var
`ACCESS_GATE_CODE`. The literal code is never in client
source, never in the repo, and never in the bundle.

A good code sets a signed httpOnly cookie for 30 days.
A bad code shows the exact plain failure message this
prompt requires. Attempts take a modest per-minute rate
limit.

Three-layer resilience holds: live source, then cached
or last-known, then a safe default. No surface renders
blank because one layer failed.

Keyboard and touch both work.

Request access is an inline email form, not a mailto.
The address is stored in `marketing_leads`. Forwarding
to `info@` happens only if existing email capability
already exists. No new third-party email provider.

Book a demo keeps its current destination. Do not alter
it.

---

## Prompt 53 holds were released 2026-09-16 by Craig

From [../53/HOLDS.md](../53/HOLDS.md). Former Prompt 53
holds are no longer binding under Prompt 53. Hold lift
is not an auto-execute. Not a live-platform product
release.

This prompt's own fence still applies: no new
third-party email provider, no new Supabase project, no
`package.json` change without Gary or Craig explicit
approval (they did not approve), no Bedrock, no
Montreal, no seed beyond SYNTH, no worker or clinical
surfaces, no live schema apply.

Named human dispatch still required before Montreal
project create, Bedrock go, non-SYNTH seed, or live
schema apply.

- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands.
- Do not invent REV 2. Do not start a Prompt 47 redo
  from invented contents.
- Do not invent G1.

`G1_AUDIT_REPORT.md` exists at repo root (2026-08-13,
read-only discovery). That file is not G1 closed.
`PROMPT_G1_DISCOVERY_AUDIT` is not in this repository. Do
not invent G1. Do not start G1.

`package.json` is locked.

---

## What this draft may do

- [SECTION_1.md](SECTION_1.md) is written first, before
  product code, with evidence or UNVERIFIED.
- Report existing tip code from `d06a5eb` and `a7ebb8f`
  honestly. Do not claim completeness.
- Fill remaining Prompt 62 gaps on the public marketing
  site only: server-side `ACCESS_GATE_CODE` env check,
  signed httpOnly cookie 30 days, exact failure copy,
  modest per-minute rate limit, three-layer resilience,
  keyboard and touch.
- Keep Request access as an inline email form that
  stores in `marketing_leads`. Forward to `info@` only
  if existing email capability already exists.
- Include the Prompt 62a footer and address swap. Craig
  confirmed the mailbox LIVE on 2026-09-17.
- Keep the `marketing_leads` migration as a file only
  at `supabase/migrations/20260815120000_marketing_leads.sql`.
  SYNTH test only.
- Athena writes [ACCEPTANCE.md](ACCEPTANCE.md) in the
  product-build draft.

## What this draft must not do

- Live-platform product release. Hold lift is not an
  auto-execute. Craig said build. Draft PR only.
- New third-party email provider.
- New Supabase project.
- Edit `package.json`.
- Bedrock, Montreal, or seed beyond SYNTH.
- Worker, clinical, or platform auth surfaces.
- Alter the Book a demo destination.
- Put the access code or lead emails in client source,
  the repo, the bundle, or the logs.
- Live schema apply. The migration file already exists.
  File only. SYNTH test only.
- Invent G1 closed or REV 2.
- Claim Argus CLEAN.
- Decide a Section 5 open item in code.
- Ship.

Athena does not ship. Still not a live-platform product
release. Prompt 53 holds were released 2026-09-16 by
Craig. Hold lift is not an auto-execute.

---

## Standing independent STOPs

Not Prompt 53 holds. Hold lift is not an auto-execute.
Not this mission.

- Named human dispatch still required before Montreal,
  Bedrock, non-SYNTH seed, or live schema apply.
- 50a Decision 1 is RELEASED-from-53-hold. Platform GO
  still requires a Craig or Hermes named path. Do not
  invent live apply. Decision 2 stands.
- Do not invent REV 2. Do not start a Prompt 47 redo
  from invented contents.
- `package.json` locked.
- No new third-party email provider.
- No new Supabase project.

---

## Section 5 open items

Listed. Not resolved. REPORT AND STOP. Never decide in
code. See [STOPS.md](STOPS.md). Gary owns these, not
this draft.

### 5.1 Receiving domain confirmation

`continuumrtw.com` versus `continuum.com`. Craig
confirmed the mailbox live 2026-09-17 for
`info@continuumrtw.com`. `continuum.com` is not ours.
Gary still owns any remaining domain wording.

### 5.2 The mailbox itself

Craig confirmed LIVE 2026-09-17. Record that. Domain
admin remains Gary's if anything else is needed.

### 5.3 Email provider decision and residency

G1 audit item. Open if forwarding is not already wired
through existing Resend. Do not add a provider. Do not
invent G1 closed.

### 5.4 Booking URL behind Book a demo

Do not alter the Book a demo destination. The booking
URL behind it stays a Gary item.

### 5.5 Report to Craig with the G1 audit dispatch

Whether this gate change is reported to Craig alongside
the G1 audit dispatch. Gary decides. Do not invent that
dispatch.

---

## Hub authentication remains UNVERIFIED

The Prompt 33 hub authentication path is UNVERIFIED by
Craig. **STOP for ship.**

This is not a stop for this draft.

---

## Prompt 62a footer contact

Amendment 1. See [../62a/REGISTER.md](../62a/REGISTER.md).
Supersedes Section 3 item 6.

Craig confirmed 2026-09-17 that
`info@continuumrtw.com` is LIVE. The swap may be
included on this draft branch. Still do not ship.

Every `craig@continuumrtw.com` on the public marketing
site becomes `info@continuumrtw.com`. Hub admin
allowlists that use `craig@` as an admin identity are
not the public marketing site and must not be rewritten.

---

## Cross-links

Calliope docs in this folder:

- [STOPS.md](STOPS.md)

Athena wrote this:

- [SECTION_1.md](SECTION_1.md)

Athena writes this:

- [ACCEPTANCE.md](ACCEPTANCE.md) (product-build draft)

Amendment 62a:

- [../62a/REGISTER.md](../62a/REGISTER.md)

Prompt 53 RELEASE record:

- [../53/HOLDS.md](../53/HOLDS.md)
- [../53/RELEASE.md](../53/RELEASE.md)

---

## Do not claim Argus CLEAN

This registration does not run an Argus patrol that
closes findings. Do not claim Argus CLEAN.

---

## Base tip

`5a77e2c481f6666a11f3e1592e695aaedf6df00d`
(`fix(Prompt 61): get-help coordinator and helpnow
anchors (do not ship) (#170)`).

Branch: `cursor/prompt-62-access-gate-3c45`.

---

## Athena does not ship

Allowed product-build DRAFT. Docs first. Public
marketing site only. Not a live-platform product
release. Prompt 53 holds were released 2026-09-16 by
Craig. Hold lift is not an auto-execute. Hermes ships
only when Craig names ship.
