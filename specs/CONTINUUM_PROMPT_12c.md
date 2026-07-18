# CONTINUUM PROMPT 12c: The Sign-In Gate Inside the Worker App

**Deliverable:** ContinuumWorkerApp.tsx v3 (replaces the 12a file; fully backward compatible). Compile-verified (esbuild) and logic-tested this session.
**Fixes:** the OTP sign-in was not engaged on the worker app component; 12b built the standalone connector but the app itself opened straight into consent. The gate now lives inside the app.
**Date:** July 17, 2026

## 1. The three-step gate

1. Phone. Auto-formatting to (555) 555-5555 as typed, tel autocomplete, and the Text me a code button gated until ten digits. Verified: partial input renders (587) 555 and full input renders (587) 555-0123.
2. Code. Six boxes with auto-advance, backspace navigation back through empty boxes, one-time-code autocomplete on the first box, and the autofill distribution fix: multiple digits into one box spread across all six, focus lands on the last filled box, and six digits verify immediately. A configurable demo code (blank accepts any) adds the shake-clear-refocus failure beat.
3. Create your 6 character password. A live-validating checklist with three rules, each ticking gold as satisfied: exactly 6 characters, at least one consonant, at least one special character. The button stays dimmed until all three pass; completing fires the particle burst and opens the app. All four rule boundaries verified.

## 2. Flow and gating

Sign in precedes consent: gate, then the consent screen if Start at consent is on, then Today. The bottom tab bar renders only after both. Autoplay demo mode bypasses the gate entirely. Everything else from 12a is untouched: live mode, link chip, escalation, optimistic writes.

## 3. Demo posture

Stated in the component's own copy: demo sign-in, nothing is sent or stored. The phone number and password live only in component state, are never persisted, and never leave the browser. Real OTP with Twilio, rate limits, and expiry is the mainline's job (Prompt 07.2); the 6-character rule set here exists to demonstrate live validation, not as a production policy.

## 4. New property controls

Sign-in gate (boolean, default on) and Demo code (blank accepts any). All previous controls unchanged.

## 5. Verification summary

esbuild compile clean; imports limited to react, framer, framer-motion; SignIn defined before first use (function hoisting); gating expressions present; dash audit clean; logic suite green across phone formatting, all three password rule boundaries, and the paste distribution.

---

## Implementation record (this repo)

- framer/ContinuumWorkerApp.tsx updated in place to v3: adds the SignIn gate (phone, six-box code with autofill distribution and shake-clear on a wrong enforced demo code, six-character password with three live rules), gated before consent via signInGate and bypassed under autoplay. New controls signInGate (default true) and demoCode. 12a live mode, link chip, escalation, and optimistic writes are unchanged.
- Verified: esbuild clean (38.3kb); logic tests pass for phone partial/full formatting, password valid / missing-consonant / missing-special / wrong-length, and six-digit paste distribution.
- No em-dashes or en-dashes anywhere.
