# CONTINUUM PROMPT 23: Wiring Every Graph, Table, and Chart

**Deliverable:** all portal graphs, tables, and charts audited and wired: hse-portal.html, wcb-portal.html, clinical-dashboard.html, and admin-portal.html patched in place; the worker and employer surfaces audited and confirmed already fully computed. Every new behavior suite-tested, all prior suites rerun green, and the six-portal canon regression passed after patching.
**Date:** July 20, 2026

## 1. The audit came first

Before patching, every chart in the family was inspected for hardcoded values. Findings: the worker dashboard's week chart, ring, and milestone meter are state-driven; the employer dashboard's trend and benchmark charts compute every bar width from the seed (zero hardcoded percentages in the artifact); the board, clinical, and admin charts compute from their seeds. Exactly two static offenders existed, both in the HSE analytics: the restrictions-to-first-suitable-duty figure (a hardcoded 1.8 days) and the step-up count (a hardcoded 1). Both are now computed, and the sweep then went beyond repair into responsiveness: tables that sort, and charts that answer clicks.

## 2. HSE portal: metrics that move

The restrictions-to-first-suitable metric now computes from a new per-worker seed field recording each duty-holding worker's actual gap (2, 1, 2, and 2 days), averaging to the same 1.8 the surface previously asserted, except now it is true. Step-ups became an event stream: the seeded period holds one (Okafor's vehicle inspection logbooks), and the assignment workflow itself now fires the event live: assigning a suitable-onsite duty to a worker currently holding standard-precaution work records a step-up, the analytics KPI climbs, and the latest step-up renders under the figure; the suite proves a non-qualifying assignment does not fire it. The case queue gained a sort toggle: attention (the default, escalations first), day, and pain, each proven to reorder (pain puts Cardinal first, day puts the day-24 case first), with the hazard gate and escalation semantics regression-tested after the patch.

## 3. Board portal: the claims table sorts, the status chart filters

The claims table headers (worker, status, claim phase) are clickable in the Claims section: first click sorts, second reverses, with direction indicators, all suite-proven including the ascending-then-descending flip. The analytics claims-by-status bars are now clickable: clicking a bar opens the Claims section pre-filtered to that status, and the suite asserts the filter chip renders with the canonical count (light duty, 11). Dashboard KPI reconciliation (19 open, 7 to acknowledge) re-asserted after patching.

## 4. Clinical dashboard: the census sorts, the buckets open

The Workers census gained sortable headers (name, pain, tenant and day), with pain descending proven to put Cardinal first. The analytics progress-versus-prognosis buckets are now clickable: clicking Stalled opens the Workers census filtered to stalled patients, with a visible filter state and a clear link, and the suite proves the filter shows Cardinal while excluding the ahead-of-plan patient. The bucket mapping itself (ahead, on track, behind, stalled) is a tested function. Canon KPIs (24 active, 68 recovery score) and the transition legality matrix re-asserted after patching.

## 5. Admin portal: the aggregate bars navigate

The cases-by-tenant bars now open the Tenants section on click; the users-by-role bars open Users with that role's filter applied, and the suite proves the filtered list renders the right people. Canon KPIs (24 cases, 75 percent completion) re-asserted.

## 6. What was deliberately left alone

The Garda demo runner's vignettes are presentation props by design and stay static. The employer dashboard needed no patch: its charts were already computed, and patching a verified surface for symmetry's sake would be risk without value; its interactivity (confirm-return updating KPIs and costs) was wired in its own build.

## 7. Verification summary

Four portal suites green covering: computed 1.8 from seed truth, live step-up firing on qualifying assignment and refusing a non-qualifying one, three queue sort modes each reordering correctly, board sorting in both directions with indicators, bar-to-filter routing with canonical counts, clinical bucket mapping, filtering, sorting, and clear, admin bar navigation with role filters, plus the standing regressions: hazard gate, escalation semantics, board KPI reconciliation, clinical KPIs and legality matrix, admin canon. The six-portal cross-reference canon suite rerun after all patches: per-tenant numbers, cast, clinical-vocabulary absence on admin, both deliberate bridge absences, and distinct storage keys, all holding. One patch-script defect (a Python string literal error that prevented the first run entirely) was caught because the patch prints never appeared, and the corrected script applied cleanly. Dash audit clean on all four patched files.
