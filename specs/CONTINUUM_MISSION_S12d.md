# MISSION M1 / S12d: Fold-in, single-source the worker bridge projection

**Status:** spec authored (Zeus, 2026-07-20). Scope is authored to unblock the
queue; Gary confirms or adjusts before build.
**Lead:** athena (12a). **Gates:** Heracles green, Argus clean, canon consistency.

## Why

Argus's M5 patrol (finding M5-F02) found the functional-only cross-tab bridge
key `continuum_worker_bridge_v1` written by three worker surfaces, each with its
own hand-rolled projection: `worker-dashboard.html`, `continuum_workflow_app.html`,
and `worker-embed.html`. Three copies of a privacy-critical projection is three
places for a clinical field to leak. The fold-in gives the projection one home.

## Scope

- Extract a single shared functional-only projection, `writeBridge(state)`, that
  emits only the lawful functional fields (name, trade, injury-nature, day,
  status, restrictions, duty-ack, check-in flag) and never a clinical field
  (pain, mobility, fatigue, confidence, notes, diagnosis).
- Route all three worker surfaces through that one function.
- Smallest correct change: do not alter what the surfaces display, only how they
  write the bridge.

## Deliverable

- One shared `writeBridge` projection used by all three writers.
- A Node bridge test (`deploy/bridge.test.mjs`, wired into `suites.yml`) that
  asserts the projected payload carries only the functional allowlist and no
  clinical field, for each of the three surfaces.

## Acceptance

- The three surfaces produce byte-identical functional payloads for the same
  state.
- Argus re-scan confirms functional-only preserved (closes M5-F02 at code level).
- Heracles green on the new bridge test and the full suite.
