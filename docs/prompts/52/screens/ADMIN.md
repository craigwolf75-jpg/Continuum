# Prompt 52 Clinic administration screens: feel specification

Specification for builders. Not a visitor-facing product screen.
Source: Prompt 52 section 3.4.

**[SPEC]** The four administration screens share a single thin
section 4 block. Errata D19's stated fix is "Say seventeen, and
expand the administration screens to the full template." That
expansion is not present anywhere in the build package, which is an
observation, not a quotation.

Reading convention:

- **[SPEC]** reports what an existing document already requires.
  Verify it, do not redecide it.
- **[NEW]** is authored by this prompt because no specification
  exists.
- **[CHANGE]** overrides an existing specification, and says what it
  overrides and why.

No em dashes or en dashes anywhere. Standing holds: no live Bedrock,
no occupational seed, no schema apply, `package.json` locked. This
file does not invent Prompt 38 screens.

---

## SCR-ADM-01, Clinic setup

- **Feels like: done in one sitting, once.** **[SPEC, Prompt 50
  section 9.1]** The provisioning default is one bundle, Alberta,
  OIS, single location, every value defaulted, visible and
  changeable. A clinic that matches the bundle sees zero mandatory
  decisions.
- **The one thing that must be true:** **[NEW]** the batch schedule
  and the safety margin drive the countdown on every other screen, so
  this screen states what the current values mean in practice.
  Compute the sentence from the configured values; do not hard code
  an example. With the default schedule of 09:00, 14:00, 17:00 and
  00:05 and a sixty minute margin, the correct statement is that the
  last batch of the day departs at 00:05, well inside the same day
  cutoff of 10:00 the next business day, so a report signed in the
  afternoon still makes same day. An earlier draft of this prompt
  supplied a worked example that was arithmetically wrong. Compute,
  do not illustrate.

---

## SCR-ADM-02, Practitioner profiles

- **Feels like: a credential check that answers immediately.**
  **[SPEC, Prompt 45]** Live validation of the contract and role
  pair, blocking rather than warning.
- **The one thing that must be true:** **[SPEC]** the nurse
  practitioner block is explained, not merely enforced. The board's
  two documents contradict each other: contract 000084 permits nurse
  practitioners and `NP` is absent from the board's nine Practitioner
  Role Codes. The existing wireframe blocking message states all of
  that and must not be shortened, because a clinic administrator
  blocked without a reason will phone.

---

## SCR-ADM-03, User management

- **Feels like: three actions and no ceremony.** **[SPEC]** Invite by
  email, assign roles, deactivate.
- **The one thing that must be true:** **[SPEC]** a practitioner with
  signed reports cannot be deleted, only deactivated. **[NEW]** When
  someone attempts it, say why in terms of the ten year retention
  obligation, not a database constraint.

---

## SCR-ADM-04, myWCB credentials

- **Feels like: a safe.** **[SPEC]** The value goes in and never
  comes out; no role at all may read it.
- **The one thing that must be true:** **[SPEC]** the `Verify` action
  attempts a no operation authentication and reports success or
  failure. **[NEW]** In plain words. A credential screen with no
  verify action asks the clinic to find out at the worst possible
  moment, which is the first batch.
- **[SPEC]** The vendor is responsible for creating and maintaining
  myWCB users for its customers. **[NEW]** State that on this screen,
  because the clinic administrator will not know it otherwise.

---

## SCR-PRIV-01, Privacy pack

Privacy pack copy is legal and consent adjacent. This file records
the feel and the red flag list as [SPEC]. It does not draft a new
pack. Human gate for Gary if anyone proposes a change to pack
wording.

- **Feels like: relief.** **[SPEC]** "This is a sales asset that
  happens to live in the product."
- **Eye lands on:** the count of fields left to complete.
- **The one thing that must be true:** **[SPEC]** three red flag
  provisions must never appear: no HIPAA or PIPEDA as the governing
  regime, no model training on the health information, and return or
  destruction on termination with no vendor copy retained. The build
  fails if a red flag phrase appears.
- **The banner on every sign in until filed** **[SPEC]** is correct
  and **[NEW]** must not be dismissible, because submission is
  blocked behind it and a clinic that dismisses it will not know why
  nothing sends.
