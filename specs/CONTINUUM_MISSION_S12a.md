# MISSION M4 / S12a: Demo edge function, operational status endpoint

**Status:** spec authored (Zeus, 2026-07-20). Scope is authored to unblock the
queue; Gary confirms or adjusts before build.
**Lead:** athena (12a). **Gates:** Heracles green, Argus clean, canon consistency.
**Human gate:** if the function ever reads or writes schema, stop for Gary. This
scope reads nothing case-related, so no human gate is expected.

## Why

The demo is buildless static HTML, but Vercel runs serverless and edge functions
natively. A small operational endpoint gives the Olympus feed and any future
integration a real server shape to point at, while proving the telemetry law in
code: operational only, never case content, never worker facts.

## Scope

- A Vercel function at `api/status` returning JSON operational telemetry only:
  `{ ok, region, surfaces: [...names...], generatedAt }`. No case data, no worker
  facts, no clinical fields, ever.
- Three-layer resilience on the data path: live value, then a cached or
  last-known value, then a safe default. The endpoint never throws to the caller;
  a failed layer degrades to the next.
- UNKNOWN is never rendered as 0: a missing count returns the string UNKNOWN or
  its designed placeholder, never a numeric zero that reads as real data.

## Deliverable

- `api/status` function (Node runtime, Fluid Compute default).
- A Node test asserting the response is operational-only (no clinical or
  case-content keys) and that the fallback path returns UNKNOWN not 0.

## Acceptance

- The endpoint returns valid operational JSON under normal, degraded, and failed
  data layers, and never 500s to the caller.
- Argus clean: the payload carries no case content and no worker facts, matching
  the Olympus telemetry law.
- Documented as demo-only in the function header.
