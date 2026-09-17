# Prompt 62a. Footer contact.

Amendment 1 to unified Prompt 62.
The footer contact. Public marketing site only.

Supersedes Prompt 62 Section 3 item 6.

Craig confirmed 2026-09-17 that
`info@continuumrtw.com` mailbox is LIVE. The sequencing
gate is satisfied for including the swap on this draft
branch. Still DRAFT.

This file is a Calliope doc. Parent registration:
[../62/REGISTER.md](../62/REGISTER.md). Athena wrote
Section 1 on the parent draft. Athena writes acceptance
on the parent draft. Hermes does not treat this file as
a ship order.

No em dashes or en dashes anywhere.

---

## Status

Prompt 62a is the footer contact amendment to the
Prompt 62 product-build DRAFT. Base tip
`5a77e2c481f6666a11f3e1592e695aaedf6df00d`
(`fix(Prompt 61): get-help coordinator and helpnow
anchors (#170)`).
Branch: `cursor/prompt-62-access-gate-3c45`.

Earlier commit `a7ebb8f` already swapped public
marketing contact on this tip. Section 1 on the parent
draft reports that honestly. The 2026-09-17 mailbox
confirmation is the sequencing gate for keeping that
swap on this draft. Still DRAFT.

Not a live-platform product release. Prompt 53 holds
were released 2026-09-16 by Craig. Hold lift is not an
auto-execute.

---

## What this amendment does

Every `craig@continuumrtw.com` on the public marketing
site becomes `info@continuumrtw.com`.

Mailto behaviour may remain on the footer. The address
changes. The link shape may stay mailto.

Report every path and line. Public marketing site only.

---

## Public marketing paths and lines

These public marketing surfaces carry the contact
address. They read `info@continuumrtw.com`.

- `deploy/gate/holding.html` line 285, footer mailto
- `deploy/gate/holding.html` line 363, Request access
  failure fallback
- `deploy/index.html` line 848, Or email mailto
- `deploy/index.html` line 889, footer mailto
- `deploy/privacy.html` line 46, support-email span
- `deploy/terms.html` line 47, support-email span
- `deploy/legal-config.js` line 7, `supportEmail`
- `deploy/book.html` line 120, footer mailto
- `deploy/book.html` line 142, failure fallback

Tests that assert the public contact, not an admin
identity:

- `deploy/site-gate.test.mjs` line 20
- `deploy/phase-b-contact.test.mjs` line 28
- `deploy/phase-b-legal.test.mjs` line 16
- `deploy/book-access.test.mjs` lines 5 and 28

Privacy and terms are legal pages. This amendment
swaps the contact address only. It does not draft new
legal wording. Ship of legal pages still waits at the
human gate.

Athena reported the same paths in
[../62/SECTION_1.md](../62/SECTION_1.md).

---

## Hub admin identity is not this amendment

Hub admin allowlists that use `craig@continuumrtw.com`
as an admin identity are not the public marketing site.
They must not be rewritten.

Leave these as `craig@continuumrtw.com`:

- `deploy/api/_hub_session.js` line 33, `ADMIN_EMAILS`
- `deploy/admin-hub-users.html` line 58, admin roster
  copy
- `deploy/hub-signin.test.mjs` lines 38 to 39
- `deploy/hub-admin.test.mjs` lines 18 and 21
- `deploy/site-codes-admin.test.mjs` line 51

---

## What this amendment must not do

- Hermes ships only when Craig names ship.
- Rewrite hub admin identity.
- Touch worker, clinical, or platform auth surfaces.
- Add a third-party email provider.
- Invent G1 closed or REV 2.
- Claim Argus CLEAN.
- Decide a Prompt 62 Section 5 open item.

---

## Cross-links

- [../62/REGISTER.md](../62/REGISTER.md)
- [../62/STOPS.md](../62/STOPS.md)
- [../62/SECTION_1.md](../62/SECTION_1.md)
- [../62/ACCEPTANCE.md](../62/ACCEPTANCE.md)
- [../53/HOLDS.md](../53/HOLDS.md)
- [../53/RELEASE.md](../53/RELEASE.md)

---

## Base tip

`5a77e2c481f6666a11f3e1592e695aaedf6df00d`
(`fix(Prompt 61): get-help coordinator and helpnow
anchors (#170)`).

---

## Deploy gate

Mailbox confirmed LIVE 2026-09-17. Swap allowed on this
draft branch. Not a live-platform product release.
Prompt 53 holds were released 2026-09-16 by Craig.
Hold lift is not an auto-execute. Hermes ships only
when Craig names ship.
