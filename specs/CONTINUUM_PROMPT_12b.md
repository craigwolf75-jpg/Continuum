# CONTINUUM PROMPT 12b: The Sign-In Connector, a Link Button Into the Worker App

**Deliverable:** ContinuumSignIn.tsx, single-file Framer code component. Compile-verified (esbuild) and spec-audited this session.
**Extends:** the Prompt 12 family. This is the marketing site's front door: a demo sign-in flow that ends in a link button opening the worker app.
**Date:** July 17, 2026

## 1. What it is

A three-step card: mobile number entry (auto-formatting, tel autocomplete, button disabled until ten digits), a six-box code screen (auto-advance, backspace navigation, one-time-code autocomplete on the first box, optional enforced demo code with a shake-and-clear on mismatch), and the payoff: a checkmark spring with a particle burst into a softly breathing gold button labelled Open your worker app, linked to the configured URL. An optional secondary link routes employers and clinics to the hub. Start over resets the flow.

## 2. The guardrail, stated plainly on the surface

This is a DEMO sign-in and says so in its own copy: no message is sent, no real account exists here, no credential is collected or transmitted. The phone number lives only in component state and is never stored or posted anywhere. Real OTP authentication is the mainline's job (Prompt 07.2: Supabase Auth with Twilio, rate limits, expiry).

## 3. Where the button points

The Worker app URL control accepts any destination: the deployed demo, a Framer page hosting the Prompt 12a component in Live mode, or eventually the production app. Open in new tab is a control; the hub link inherits the same behavior. When the mainline exists, this same component becomes the marketing-to-product handoff by changing the URL.

## 4. Motion inventory

Ambient gradient orbs; spring-slide transitions between the three steps through AnimatePresence; code boxes that pop and turn gold as they fill; a shake with automatic clear and refocus on a wrong demo code; the success checkmark springing in with a twelve-particle radial burst; the link button entering on a spring and then breathing a gold glow on a 2.4 second cycle; hover and tap scaling on every actionable element; 48px minimum targets throughout.

## 5. Property controls

Headline, Worker app URL, Button label, Hub URL (optional, hides the secondary link when empty), Demo code (blank accepts any code; set to force a specific one and demonstrate the failure shake), Accent (#C8972F), Background (#0E1B2C), Card frame, Open in new tab.

## 6. Composition recipe

The marketing arc assembles from the family: hero with the autoplay worker phone (12), the sign-in connector (12b) as the call to action, and the live pair (12a plus 13) as the proof section.

## 7. Law held

Grade-7 copy, gold attention states, client hexes as defaults, no emojis, no em or en dashes in copy or comments, synthetic only, imports limited to react, framer, and framer-motion, SSR-guarded window access, layout annotations at intrinsic 400 by 560.

---

## Implementation record (this repo)

- framer/ContinuumSignIn.tsx: the three-step demo sign-in (phone, six-box code with autofill distribution and shake-clear on a wrong enforced demo code, success with checkmark + 12-particle burst + breathing gold link button). Property controls per section 5; window access guarded (setTimeout for the shake reset only). Compile-verified with esbuild.
- No em-dashes or en-dashes anywhere.
