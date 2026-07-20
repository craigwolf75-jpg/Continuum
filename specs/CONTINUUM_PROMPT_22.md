# CONTINUUM PROMPT 22: Re-evaluation of the Built Application Against the Platform Build Brief

**Mandate:** hold the six-portal application family (worker dashboard, employer dashboard, board portal, HSE portal, clinical dashboard, platform admin, plus the demo runner) against Craig's Platform Build Brief, section by section, and say plainly what already satisfies the brief, what partially satisfies it, and what is missing, with a prioritized remediation backlog. Evidence discipline: every satisfied claim below corresponds to behavior the existing test suites assert, not to intention.
**Numbering:** requested as Prompt 21, shipped as Prompt 22 because 21 is the blueprint.
**Date:** July 20, 2026

## 1. Verdict in three sentences

The built system is remarkably aligned with the brief's philosophy for one reason: both descend from the same visibility law, and the brief's hardest requirements (role-appropriate views of one journey, the platform informs and people decide, trust as a product requirement) are not aspirations in the artifacts but tested mechanics. The genuine gaps cluster in three places: the Insight layer (the system has signals and indicators but not yet the explainable insight anatomy the brief specifies), provenance (the brief demands source attribution on every important fact, and the surfaces do not yet carry it), and a handful of per-role requirement lines (the supervisor's concern channel, the professional's since-last-visit delta, the worker's morning acknowledgement) that are specified and scripted but not yet wired. Nothing in the built system violates the brief's strategic discipline; the scope has held.

## 2. The six non-negotiable principles, evaluated

**Recovery comes before technology: satisfied.** The feature set maps to decisions (check-in to escalation to review; restrictions to matched duties to acknowledgement), and the system's most celebrated behaviors are refusals: the employer cannot see scores, HSE cannot force acceptance, nobody but the physician moves status.

**The journey is the product: satisfied with one caveat.** All portals render the same canon (Prompt 17 enforced it mechanically: one Marcus, one Cardinal, per-tenant counts that sum), and the bridge makes one event appear as role-appropriate projections across four surfaces at once, which is the brief's different views of the same connected journey made literal. The caveat: the journey is not yet visible as a single chronological record anywhere; each portal shows its slice, but the Recovery Journey Record as one timeline exists only in the worker's milestone view. That is a blueprint-phase build, noted as such.

**Every screen must improve understanding: satisfied.** The brief's five understanding statements map one-to-one onto built surfaces, and Prompt 20's runner already answers who becomes smarter on every screen.

**The platform informs, people decide: satisfied, and test-asserted.** The transition legality matrix (physician-only, illegal jumps rejected), the hazard gate, the worker-owned acceptance, and the per-program-rules escalation phrasing are all suite-verified. The one wording class the brief would fail, detected-and-recommended on an employer surface, was already repaired in Prompt 19 and is mechanically asserted absent in the demo script.

**Continuity must reduce friction: satisfied at demo scale, unproven at field scale.** The check-in is under thirty seconds by design; duties arrive, not forms. But friction is an empirical property; the pilot instrumentation (time to first suitable duty, completion rates) is the honest measure, and it is built into the HSE analytics.

**Trust must be designed in: largely satisfied, two gaps.** Consent gates capture and withdrawal genuinely stops it (suite-verified on the worker surface); the projection law is structural; audit exists where it matters most (clinical actions, admin actions, video views). The gaps: provenance tagging is absent (section 6 below), and audit is uneven across portals: the clinical and admin surfaces write audit trails, the HSE and employer surfaces do not yet record their reads, which the brief's access logging line requires of the real platform.

## 3. The user groups, requirement by requirement

**Worker: 9 of 10 lines present.** Today's priorities, check-ins, symptom and functional updates, appointments, restrictions in plain words, progress over time, questions via chat, secure-communication posture, and the supported-not-monitored tone (gold never red, the paused state that says nothing is being recorded, escalation copy that praises honesty) are all live. Missing: prescribed recovery activities as a first-class list with completion events (exercises are referenced, not tracked), which matters because missed-exercise is one of the brief's canonical signals. The morning acknowledgement and the fatigue and confidence dimensions are scripted in the runner and queued as check-in v2, not yet wired.

**Supervisor: 6 of 8 lines present.** Functional restrictions, permitted and restricted activities, modified-duty guidance, effective and review dates, and accommodation status are the employer dashboard's substance. Missing: workplace observations as an input (the supervisor can see, not report), and a way to raise concerns, which the brief lists explicitly; today the concern path exists only in the worker's chat. This is remediation item R3, a small build with outsized trust value, because supervisor-reported difficulty with a duty is itself a canonical signal in the brief's model.

**Treating healthcare professional: 8 of 11 lines present.** Timeline, worker-reported symptoms, functional progression, response to duties, indicators, current restrictions, previous direction, and the entry surface for restrictions all exist. Partial: changes since the previous appointment exists as sparkline inference, not as the explicit delta card the brief describes; participation in prescribed activities awaits the activity entity; unresolved questions has no home yet.

**RTW and occupational health: 10 of 11 lines present.** The attention queue, journey stage, restrictions, reviews, duty status, documentation status, escalations, and instrumentation are the HSE portal's core. Ownership of next steps is implicit (one coordinator) rather than modeled, fine at pilot scale, flagged for multi-coordinator tenants.

**Claims professionals: satisfied within scope.** Approved status, documentation, dates, restrictions inside submitted packages, and milestones are the board portal; the brief's should-not-replace-the-claims-system line is honored so thoroughly that the portal footer states it.

**Leadership: satisfied as descriptive.** Aggregates, stage distributions, location comparisons, and trend views exist in the employer analytics and admin platform view; the brief's unresolved-barriers and recovery-continuity measures join the indicator work; predictive remains flagged roadmap, which the brief's certainty prohibition endorses.

## 4. The workflow, seventeen steps

Fifteen of seventeen are demonstrable today end to end, and the non-linearity requirement is genuinely met: the transition table permits backward moves and the suites test them. The two thin steps: step seven's prescribed recovery activities (the activity entity again), and step seventeen, the completed journey contributing to organizational learning, which today is a closed row and a retired card rather than a de-identified learning record; that is future-phase by the blueprint and correctly absent now.

## 5. The intelligence model: the largest real gap

Signals: present and richer than the brief's minimum (check-ins, duty feedback, keywords, consent events). Indicators: present as named rules with the right character: they bring matters to a person, never conclude, and the one-signal-one-escalation semantics are suite-proven. **Insights: not yet built to the brief's anatomy.** Today an escalation carries a reason sentence; the brief requires the six-part explainable card: what changed, contributing information, period, why it may matter, what remains uncertain, and who holds authority. Nothing violates the no-unexplained-scores law on decision surfaces (the one borderline case, the clinical progress-versus-prognosis percentage, is clinician-entered, not computed, but it should carry its explanation anyway), yet the affirmative insight layer is the brief's centerpiece and the system's thinnest area. This is remediation item R1 and should precede any new surface work.

## 6. Provenance: the second real gap

The brief requires every important fact to identify its source, and enumerates the vocabulary. The data behind the portals is single-source per surface today, so nothing misleads, but no surface displays provenance chips, and the demo's power moments would be stronger with them: the employer seeing employer-visible facts labeled derived functional status, the clinician seeing worker reported beside each symptom line. Remediation item R2: a provenance field in every seed and a small chip component in every portal, a day of work across the family, and the single highest-leverage alignment with the brief's trust section.

## 7. Architecture, privacy, AI, and discipline

Enterprise architecture lines (APIs, FHIR, IAM, integrations) are blueprint-phase by the brief's own framing and are addressed in Prompt 21; the demo family neither has nor pretends them, and the SIGMA panel's illustrative labeling is the honesty the brief demands. Privacy and permissions: the separation of clinical and operational information is the system's signature, structurally enforced and CI-tested in the blueprint; data minimization is practiced (the bridge schema is the projection law in miniature). AI boundaries: no generative capability exists in the demos, so compliance is trivially true, and the phrasing law keeps even the rules-based intelligence on the right side of every prohibited line. Strategic discipline: audited against the ten questions, no built feature fails; the closest calls (board acknowledgement tracking, admin billing meter) both pass as continuity and governance, not adjacent-system creep.

## 8. Scorecard

Worker application: strong, two wired gaps (activities, check-in v2). Employer and supervisor: strong, one missing channel (concerns and observations). Professional: strong, delta card and unresolved-questions thin. RTW coordination: strongest surface in the family. Claims-facing: complete within scope. Leadership: adequate descriptive, correctly humble. Admin and governance: strong for its phase. Intelligence layer: signals strong, indicators strong, insights not yet to specification. Provenance: absent, high leverage. Audit: uneven across portals. Overall: the application is the brief's philosophy running ahead of the brief's mechanics in two named places, insights and provenance, and behind it nowhere that violates a non-negotiable.

## 9. Remediation backlog, prioritized

R1, the Insight card: implement the six-part explainable anatomy on every escalation in the HSE and clinical portals, sourced from the existing rule engine. R2, provenance chips across all portals with the brief's source vocabulary. R3, the supervisor concern and observation channel on the employer dashboard, flowing to the HSE queue as a signal. R4, worker check-in v2: fatigue, confidence, morning duty acknowledgement, already scripted in the runner. R5, prescribed activities as a first-class list with completion and missed events feeding the signal stream. R6, the professional's since-last-visit delta card and an unresolved-questions slot. R7, demo-grade read-audit lines on the HSE and employer surfaces for symmetry with the clinical and admin trails. R8, an explanation popover on the clinical progress percentage. Items R1 through R4 are the recommended next build prompt; R5 through R8 follow without dependency conflicts.

## 10. Closing

The brief asks whether every capability strengthens continuity, improves understanding, supports a decision, reduces friction, respects authority, complements incumbents, protects trust, and can be explained. The built application passes that gate today; what it owes the brief is the affirmative intelligence layer and the provenance surface that turn its discipline from something the team knows into something every user can see.
