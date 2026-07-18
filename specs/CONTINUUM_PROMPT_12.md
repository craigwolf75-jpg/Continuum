# CONTINUUM PROMPT 12: Framer Code Component, the Worker App as a Living Demo

**Deliverable:** ContinuumWorkerApp.tsx, a single-file Framer code component. Compile-verified (esbuild, TSX) and spec-audited this session.
**Choice made:** of the three candidate shapes (single card, full self-contained app, marketing section), this ships the FULL WORKER APP as a self-contained demo component: internal state, no backend, droppable into any Framer site. It is the highest-leverage shape because a visitor can run Marcus's whole day themselves, including the escalation story.
**Date:** July 17, 2026

## 1. Framer spec compliance (audited)

Single file with one default export; imports limited to react, framer, and framer-motion; addPropertyControls with ControlType controls; layout annotations (any-prefer-fixed both axes, intrinsic 400 by 820); root and phone shell at position relative; all timers created inside useEffect behind a typeof window guard and cleared on unmount; no localStorage, no network, no external SDKs. Fonts load through a style-tag import with system-font fallback, safe under SSR.

## 2. What it does

Consent gate (optional, staggered plain-language reveal) into a three-tab app: Today (recovery ring plus the slider check-in), Trend (self-drawing pain and movement sparkline), Duties (restriction pin, duty cards, progress bar). Submitting a check-in fires the completion sequence; setting pain to 8 or more triggers the escalation banner, which is the product's wiring story compressed into one interaction a visitor can discover themselves. Next day resets the check-in window and advances the ring.

## 3. The motion system (nothing flat)

Ambient drifting gradient orbs behind the UI; the recovery ring draws itself with a spring and re-pops its center on every change; sliders carry a spring-following thumb with a glow, an animated track fill, and a value bubble that flares on change, with the pain fill heating from gold toward red-gold as the score rises; the save button collapses into a spring-loaded checkmark with a ten-particle radial burst; tab changes slide through AnimatePresence while a shared-layout ink bar springs between tabs; the sparkline draws in with pathLength; duty completion springs, strikes through, and animates the progress bar; the escalation banner enters with a breathing gold glow (gold, never red, per the worker-facing doctrine); the whole app sits in an optional phone bezel with depth shadow.

## 4. Property controls

Worker name, body part, start day, prognosis days, accent color (default #C8972F), background (default #0E1B2C), phone frame on or off, start at consent on or off, and Autoplay demo: a scripted, self-cleaning loop (set sliders, save, tour the tabs, complete a duty, advance the day, repeat) for hero sections where the component should perform hands-free.

## 5. Usage

In Framer: Assets, Code, New code file, paste the file contents, then drag ContinuumWorkerApp onto the canvas. Recommended placement at 400 by 820 with the phone frame on; for a hero background, frame off, autoplay on, pointer events optionally disabled on the layer so it reads as ambient motion. The component is presentational by design: production auth, RLS, and data live in the mainline (Prompt 07); this component shares its copy, mechanics, and thresholds with that build so the demo never lies about the product.

## 6. Copy law held

Grade-7 worker copy, 44px-plus touch targets, gold for attention states, no emojis, no em or en dashes anywhere in copy or comments, synthetic cast only.

---

## Implementation record (this repo)

- framer/ContinuumWorkerApp.tsx: the component. One default export; imports react, framer, framer-motion only; layout annotations present; timers guarded by typeof window and cleared on unmount; fonts via style-tag import with system fallback; no storage or network.
- Compile-verified with esbuild (loader tsx, esm), no errors.
- No em-dashes or en-dashes in code or comments.
