# Prompt 68 stop notes

Real stops only. Prompt 68 is
REGISTERED NOT RELEASED. Draft PR.
Registration only. Not a Continuum
product release. Not a clinician
product PASS. No em dashes or en
dashes anywhere.

Companions:
[REGISTER.md](REGISTER.md),
[SECTION_00.md](SECTION_00.md),
[ACCEPTANCE.md](ACCEPTANCE.md),
[PACKAGE.md](PACKAGE.md).

---

## G1, platform decision, and hub
auth ship gate

The authenticated clinician product
is the platform lane. Section 00.1
places this package behind the G1
discovery audit, Craig's platform
decision, and the Prompt 53 hold
family.

Craig later released Prompt 53
programme holds on 2026-09-16. Hold
lift is not an auto-execute. Do not
invent a Prompt 68 release. Do not
invent G1 closed.

`G1_AUDIT_REPORT.md` exists
(2026-08-13, read-only discovery).
That file is not G1 closed.
`PROMPT_G1_DISCOVERY_AUDIT` is not
in this repository.

The package ship gate stands on top:
nothing ships before the hub
authentication fix is deployed and
verified by Craig. Source: Prompt 41
section 1, restated in BUILD ORDER.

Hub auth remains UNVERIFIED. Prompt
52 Check 1: no repository record that
Craig verified Prompt 33. Hub path is
email and password, not code
`000000`. Unit suites are green and
are not a live Craig re-test. An
unauthenticated live probe reached
the site holding page first.

**STOP.** G1 is not closed. Platform
decision is not recorded as GO for
this lane. Hub auth is UNVERIFIED.
Nothing in this prompt ships.

---

## Companions missing. NOT IN HAND

`clinician-home.html` expected md5
`64ff54939f597c8cee3cecb5f730d29d`.
`first-report.html` expected md5
`bb4a14c8c036d2990777612f02828511`.

Neither file was supplied in this
upload. A workspace walk finds zero
files under those names.

Do not invent them. Do not
reconstruct them. Do not rewrite
`deploy/measurement.html`,
`deploy/followup.html`, or
[../52/screens/PHYSICIAN.md](../52/screens/PHYSICIAN.md)
as if the companions arrived.

**STOP.** Artifacts NOT IN HAND.
Checkout presence of other clinician
screens is not in-hand for these
companions.

---

## Bulk accelerator withdrawal only
when the lane is released

The two zone model is superseded.
The bulk accelerator is withdrawn
package wide. Do not build it.

If it exists, remove it and migrate
any existing rows only when the lane
is released. Section 00.1 names that
removal as execute-on-release.

This registration does not search
production rows. This registration
does not migrate.

**STOP.** Do not apply the withdrawal
or any row migration while Prompt 68
is REGISTERED NOT RELEASED.

---

## SYNTH only while the hold stands

Section 00.6: SYNTH prefixed test
data only while the hold stands.
Prompt 53 hold lift is not an
auto-execute. Named human dispatch
still required before non-SYNTH seed.

**STOP.** SYNTH prefixed test data
only. Do not seed occupational or
reference data beyond SYNTH.

---

## No public site touch

Out of scope: the public website, the
marketing homepage, the public sign
in page, and all public branding.

Do not edit `deploy/index.html`,
`deploy/gate/holding.html`,
`deploy/middleware.js` allow lists,
or public marketing copy.

**STOP.** Public site lane stays
untouched.

---

## CRAIG DECISION OQ-016 before
consent text ships

Card A approved wording, from the
specification, includes: Recordings
are deleted after 30 days.

OQ-016 asks whether Continuum holds
ambient recordings at all, and for
how long. The number in that sentence
must match the answer before this
text is shown to a patient.

Consent language is a human gate.
Zeus does not decide it. This
registration records the
specification wording. It does not
ship it.

**STOP.** Do not ship Card A consent
text until Craig answers OQ-016.

---

## No dollar figures in clinician UI

No dollar figure appears anywhere in
the clinician experience. The
practitioner sees the fee tier
deadline, never the money. The dollar
figure exists only on the invoice
screen, which the practitioner does
not see.

No cost figures. No charts that read
as a report card on clinical
performance.

**STOP.** Do not put a dollar figure
in any clinician surface.

---

## Never-defaults and form resolution

`initial_for` and `follow_up_for`
read the board's contract and role to
form mapping, held as data.

If the pair resolves to more than one
candidate, present a choice. If it
resolves to none, block case creation
and raise. Never default to General
Practitioner.

Source: BR-WF-002. Silence is not
permission. A wrong form is an
instant rejection.

A resolver called with no
jurisdiction fails rather than
defaulting. An inactive jurisdiction
blocks with a named message. Never
fall back to Alberta. Never fabricate
board behaviour.

**STOP.** Never-defaults stand. Form
resolution never silently picks a
form. Jurisdiction never silently
falls back.

---

## Saskatchewan and Ontario are
architecture only

Alberta: form pack exists. The
clinician experience is fully
operable in the package's own
accounting.

Saskatchewan: architecture only. No
form definitions, no code lists, no
rule set, no fee schedule, no holiday
table. Not operable.

Ontario: architecture only. Same
missing pack. Uses a portal channel
rather than file upload, so a new
submission adapter is also required.
Not operable.

Do not seed speculative form packs.
An unverified form definition that
looks complete is more dangerous than
an absent one.

**STOP.** Saskatchewan and Ontario
stay architecture only until a real
form pack exists.

---

## Nurse practitioners stay blocked

The board's role code list holds nine
codes and does not include nurse
practitioner. Its contract mapping
table does reference the role. The
two board documents contradict each
other.

Until the board resolves it, nurse
practitioner support cannot be
claimed and must be blocked at
configuration with an explanatory
message. Do not work around this.

**STOP.** Do not claim NP support.
Do not submit as a role the board's
own material does not support.

---

## No live schema apply

Do not apply live schema. Do not
change schema. File only. Draft PR
only. Append only migrations when
the lane releases, not now.

**STOP.** Do not apply live schema.

---

## package.json locked

Do not edit the locked root
`package.json`. Do not edit any
`package.json`. Do not edit email
templates. Do not put credentials in
chat.

**STOP.** `package.json`, email
templates, and credentials stay
locked.

---

## Do not invent G1 or REV 2

Do not invent G1 closed. Do not
invent REV 2. Do not start G1.

**STOP.** Do not invent G1. Do not
invent REV 2.

---

## Unrelated Argus findings

Do not fix unrelated HYG findings
unless they block this PR.

**STOP.** Do not fix unrelated HYG
findings unless they block this PR.

---

## Do not claim Argus CLEAN

Do not claim Argus CLEAN in this
file. Argus will patrol separately.

**STOP.** Do not claim Argus CLEAN.

---

## Prompt 53 holds were released 2026-09-16 by Craig

From [../53/HOLDS.md](../53/HOLDS.md).
Hold lift is not an auto-execute.
Named human dispatch still required
before Montreal, Bedrock, non-SYNTH
seed, or live schema apply.

**STOP.** Hold lift is not an
auto-execute. Do not invent a Prompt
68 release.

---

## Deploy gate

Draft PR only. Athena does not
ship. Continuum ships only when
Craig names ship. Hermes ships
Continuum only when Craig names
ship. Do not treat this file as a
ship order.

**STOP.** Draft PR only. This file
is not a ship order.
