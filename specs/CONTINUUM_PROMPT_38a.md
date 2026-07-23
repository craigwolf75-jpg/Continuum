# CONTINUUM PROMPT 38a: The Additions, Wired and Accounted For

Every P38 item implemented as testable logic, specified for binding, or routed to its owner, with no item marked active that is not.

*Where care ends, Continuum begins.*

**Deliverable:** The honest execution of "make sure all additions are active and wired." Active means one of three provable states, and every one of the sixteen P38 items now sits in exactly one: WIRED IN LOGIC (implemented in CONTINUUM_38A_GARDA_CONFIG_MODULE.js and proven by the headless suite run green this session), SPECIFIED FOR BINDING (fully designed, installation held only by the anchored-patch law until the portal artifacts are in session, the same seam by which 12k and 37 were installed), or ROUTED TO OWNER (a document or decision lane where code is not the deliverable). The module carries one deliberately pointed rule from the July 23 correction: the pilot scope validator refuses any start date outright, with the refusal text stating that no start date was specified in the meeting and that Andree-Anne's review sets one. The status board below is the single answer to what is wired; nothing on it claims artifact installation, because no artifact was available to install into.
**Date:** July 23, 2026

## 1. Wired in logic, proven this session

**P38-01, division-aware model.** Division registry with duplicate and empty refusal; pilot scope binds to exactly one registered division. Tested.

**P38-02, hybrid role access.** Employer plus HSSE composition implemented as a field union that widens convenience and never the wall: clinical fields cannot survive composition regardless of the seats combined, and unknown seats are refused. Tested.

**P38-03, objective-first check-in configuration.** The objective_first preset ships duty completion and streaks to the employer view and mobility trend to the claims and HSSE hybrid view; pain stays a clinical signal only, keeping the pain-8 escalation's input intact; the employer view is an allowlist and the claims view a hardened clinical filter, so neither is trusted. Tested seven ways.

**P38-04, MSK eligibility scope.** The scope validator enforces the July 23 agreement exactly (Ontario, one division, MSK, 90 days) and refuses any start date because none was specified; the intake decision routes MSK categories to coordination and everything else to the existing process with a polite note. Tested three ways.

**P38-05, post-Form-7 intake trigger.** Intake validation makes claim number and board report filing date first-class required fields, states why in the error, and routes out-of-division or out-of-province intakes to the existing process. Tested twice.

**P38-07, universal modified duties offer.** Offer construction from tenant items (Garda's three: online training modules, completing sales leads, office duties), one signed response recorded once with a timestamp, re-answers refused, empty offers refused. Tested twice.

**P38-09, check-in lapse nudges.** Threshold-based nudges addressed to the claims or HSSE team, never the worker, with the suite asserting no clinical content can appear in a nudge. Tested.

**P38-14, pilot event metering.** A billable event is defined in code (an eligible MSK case in the pilot division that entered coordination), counted once per case id, refusing an invalid scope. The live ROI view remains with the Executive Dashboard queue item; its counter now exists. Tested.

## 2. Specified for binding, held by the anchored-patch law

**P38-06, per-worker document archive.** Fully specified in Prompt 38 (archive contents, role visibility, wall placement); binding needs the artifact's worker file structure in session. Installs beside the already-live 12k and 37 surfaces when the portal files are uploaded.

**P38-10, physician read-only summary view.** Specified (clinician-approved content only, no login friction, expiring link); the share surface is an artifact addition.

**P38-11, white-label theming.** Specified (tenant name, logo, colors on worker app and login, Continuum in the footer); a theming layer is an artifact patch by nature. Extends the 37 org name seam.

**P38-12, Alberta portal-assist ingestion.** Honesty-scoped in Prompt 38 (a person downloads from myWCB, the platform files to the right worker and notifies; no retrieval API is claimed because none exists); the filing flow binds into the archive from P38-06, so the two install together.

## 3. Routed to owner, with the document as the deliverable

**P38-08, division duty libraries.** Routed to Craig: reconcile the room's already-built claim against the 209-duty canon before anyone repeats it; the expansion project is scoped after his answer. The registry from P38-01 is where his libraries will land.

**P38-13, Nexus handoff seam.** Routed to Simon as a documented integration point, not a dependency; Garda is not a Nexus customer today and the platform works with any doctor.

**P38-15, consent alignment.** Routed to counsel as one package: Garda's doctor-contact consent form, the worker consent (12j), and the pilot consent text together, so no worker is consented twice in conflicting words. This remains the true critical path for any start date Andree-Anne picks.

**P38-16, naming.** Ledgered: GardaWorld in documents, Garda in speech; SIGMA-HR versus SIGMA-RH routed to Angelina in the follow-up.

## 4. What binding day looks like

The worker sign-up sub-section (12k) and the employer onboarding (37) are already installed and live in this repository, so binding day for 38a is narrower than a from-scratch install. The mechanical order: bind 38a's configuration module beside the live surfaces (one script block, the same single-anchor pattern the 12k and 37 installs used), add the division step to the 37 onboarding from P38-01, connect the archive and ingestion surfaces (P38-06, P38-12), then run the full ladder: the module suites live, both portal suites, the six-portal canon regression, and the dash audit. Nothing in today's logic layer needs rewriting on binding day; that is the point of building it as logic.

## 5. The mobility wall and the hardening an adversarial review forced

The module was adjusted from the series draft to hold the wall the platform already ships, and an adversarial review pass then found and fixed two more real defects before this record was fixed. On the wall: the draft's objective_first preset placed mobility on a single employer_visible list, and its clinical-field set did not name mobility, so mobility would have reached the generic employer surface, which the live 13b bridge (continuum_worker_bridge_v1) forbids the employer dashboard consumer from reading. So the preset is split into an employer_visible list (duty completion and streaks, no mobility) and a claims_visible list (mobility trend for the claims and HSSE hybrid seat). The review then showed a substring denylist has clinical false-negatives (a preset naming symptom, soreness, dx, or clinical_note would dodge every token), so the employer view is now an allowlist, the safest wall: only known functional fields appear, and no clinical field or mobility can reach the generic employer surface whatever a preset claims. The claims view and the role composition use a hardened stem matcher that catches singular, plural, and abbreviated clinical names per name segment while keeping mobility for the clinical-grade hybrid seat. The other review fixes: event metering now counts a case once if any of its rows qualifies (order-independent, so an intake-then-coordination event log counts correctly, where the draft undercounted); the scope validator returns an error instead of throwing when the division registry is absent; and a zero-day nudge threshold is honored instead of silently becoming the default.

## 6. Verification summary

Both code files pass the node syntax gate. The suite is green this session: thirty four hard-failing assertions across the wired items, including the start-date refusal carrying the July 23 correction verbatim, the employer allowlist proven against both a misconfigured preset and non-obvious clinical names (singular, abbreviated, synonym), mobility kept off the employer view and allowed on the claims hybrid view, a non-vacuous clinical-field strip across role composition, the unregistered-division and out-of-province routing, the order-independent single-count event metering, the zero-day threshold, and the functional-only nudge content assertion. The series draft suite required the authoring sandbox path and node:assert; this repository suite loads the module in the standing window-shim sandbox, carries every draft assertion intent, and adds the wall-hardening and edge-case assertions the review forced. Dash audit clean on the module, the suite, and this companion; issued in the repository. Numbering: 38a is the first letter under 38.
