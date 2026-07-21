# MISSION M3 / S13c: Dashboard deployment smoke gate

**Status:** spec authored (Zeus, 2026-07-20). Scope is authored to unblock the
queue; Gary confirms or adjusts before build.
**Lead:** hermes (12d) deploy and smoke, athena (12a) resilience wiring where
gaps are found. **Gates:** Heracles green, Argus clean.

## Why

Hermes runs a smoke check on every deploy by hand. This mission makes the smoke
check a gate that runs itself, so a dashboard that renders blank, crashes, or
shows a raw 0 when its data layer is empty fails the build rather than shipping.

## Scope

A Node smoke suite that, for each dashboard and portal surface, loads the file
and exercises its render path against three inputs:

1. live seed present (the normal demo state),
2. bridge or seed empty (last-known / cached layer),
3. malformed or absent state (safe default layer).

For each, assert the shell renders, the render function returns a non-empty
string, and no surface renders a raw 0 where UNKNOWN belongs. This proves the
three-layer resilience law on every surface, not just by inspection.

Where a surface fails a layer, athena wires the missing fallback (smallest
correct change).

## Deliverable

- `deploy/smoke.test.mjs`, wired into `.github/workflows/suites.yml` so it runs
  on every push and pull_request to main.
- Any resilience fixes the smoke suite surfaces.

## Acceptance

- Every dashboard and portal passes all three layers.
- The smoke suite is green in CI alongside the canon and portal suites.
- Argus clean: no clinical content or raw 0 in any fallback path.
