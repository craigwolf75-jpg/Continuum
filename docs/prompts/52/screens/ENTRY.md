# Prompt 52 Entry screens: feel specification

Specification for builders. Not a visitor-facing product screen.
Source: Prompt 52 section 3.1. Each screen carries what it must feel
like, where the eye lands first, the one thing that must be true, and
only those state behaviours that an existing specification omits or
gets wrong. Field lists, validation rules and business rules are
unchanged and are not restated.

Reading convention, used throughout:

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

## SCR-AUTH-01, Sign in

**No section 4 specification. Everything below is [NEW] unless
marked.**

- **Feels like: unremarkable.** **[NEW]** This is the first thing a
  physician sees every morning and it must never be the most
  interesting thing that happens to them. No illustration, no hero
  image, no marketing, no product tour, no version number, no
  "welcome back".
- **Eye lands on:** **[NEW]** the email field, already focused.
- **The one thing that must be true:** **[NEW]** a returning
  practitioner reaches the worklist without being asked to choose
  anything. How many interactions that takes depends on the multi
  factor policy, which this prompt does not set. See open item 3.
- **Loading:** **[NEW]** the submit control shows an in place busy
  state, the form does not move, nothing that was enabled becomes
  disabled.
- **Error:** **[SPEC]** `Email or password is not right.` Never
  reveal which. **[NEW]** The email value is preserved, the password
  field is cleared and refocused, and the error appears immediately
  above the submit control, so a reader on a laptop does not scroll
  to find out what happened.
- **Locked, after ten attempts:** **[SPEC]** lockout after 10, unlock
  after 15 minutes. **[NEW]** State the minutes remaining and
  recompute on each render, never "try again later".
- **Session expiry:** **[SPEC]** the copy is `"You have been signed
  out for security."` and `"Your draft is held for 15 minutes."`
  **[CHANGE]**, overriding the build package's global rule that
  session expiry routes to SCR-AUTH-01 and returns after
  re-authentication: re-authenticate in place, in a modal over the
  screen the user was on, and return them to the exact field. A
  physician who loses their place mid encounter loses the encounter,
  not the session. This is a change to a global navigation rule and
  should be confirmed by Craig.

---

## SCR-AUTH-02, Multi factor challenge

**No specification. [NEW].**

- **Feels like: over already.** **[NEW]**
- **Eye lands on:** **[NEW]** the code field, focused, with the
  numeric keyboard on mobile.
- **The one thing that must be true:** **[NEW]** the field accepts a
  paste of the whole code and submits on the last digit without a
  button press.
- **Error:** **[NEW]** `That code is not right. Codes expire after
  five minutes.` Offer resend with a visible cooldown counter, never
  a disabled control with no explanation.

---

## SCR-AUTH-03, Password reset

**No specification. [NEW].**

- **Feels like: closed loop.** **[NEW]**
- **The one thing that must be true:** **[SPEC]** the response is
  always 202, never revealing whether the account exists. **[NEW]**
  The copy says so plainly rather than implying an email is on its
  way that may not be: `If that address has an account, a reset link
  is on its way. It expires in one hour.`

---

## SCR-AUTH-04, Break glass access request

**No specification. Continuum support only. [NEW].**

- **Feels like: consequential.** **[NEW]** The only screen in the
  product that should feel heavier than the task.
- **The one thing that must be true:** **[NEW]** the requesting user
  sees, before submitting, exactly who will be notified and that the
  notification cannot be muted. **[SPEC]** N14 is the one
  notification type that can never be muted, and the default state is
  no access at all. Say that on the screen, not in a policy document.
