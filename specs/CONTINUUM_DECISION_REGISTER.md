# Continuum Decision Register (Prompt 21)

Tracks the eight open decisions from Prompt 21 section 20, resolved one at a time per the brief's discipline. Where a resolution here conflicts with an earlier document, this register governs that decision once it is dated and ruled by Gary. See [[continuum-mvp-governance]] and specs/CONTINUUM_PROMPT_21.md.

All eight ruled by Gary on 2026-07-20. Prompt 26 (the review of Craig's SIGMA-RH Enterprise Integration Blueprint) adds three open decisions, D9 through D11, carried as integration and diligence dependencies; none blocks the pilot. Prompt 30 adds D12 (the July 23 pilot-minimum definition), ruled by Gary the same day and recorded in Prompt 31.

## Resolved

### D1. Application stack
**Ruling: Next.js / Supabase / Capacitor.** Confirms the ratified series baseline (G1). The mainline continuum-app is already scaffolded and building on this stack: Next.js 14.2, Supabase client wired (server, browser, middleware), foundation schema migration in place (commit f3d5b9e). The v2 wiring specification's NestJS / PostgreSQL / React Native assumption is superseded. Supabase provides Postgres, so the database posture (row-level isolation as the projection-law floor) is unchanged. No rework; every migration already written stands. Prompt 27's CRTW Intelligence PRD is the second backend document written on the NestJS assumption and, like the v2 spec, is reconciled by this ruling rather than reopening it: the crtw schema, RLS, materialized rollups and scheduled jobs all have Supabase equivalents, so the spec translates rather than breaks, and the reply to Craig informs him of this ruling rather than asking for it. Prompt 28's Platform Master PRD is the third such document and escalates D1 to blocking for Phase 1; this ruling already clears the block, so Phase 1 planning proceeds on Next.js and Supabase, the relational core and warehouse translating to Supabase equivalents.

Two Prompt 28 register notes ride alongside D1, both design-and-marketing commitments rather than open decisions: the Digital Twin's simulation use is named in the tenant's committee transparency material, since a stored scenario used to justify a workforce decision is discoverable in a labour dispute and crtw_simulation's reproducibility is the defense; and Tier 4's crtw_predictive licensing is sold as governed readiness, never as prediction, until the Health Canada pathway clears, which is the marketing law applied to the price list.

Prompt 30's Complete Build Spec v5 presupposes the NestJS and PostgreSQL stack a fourth time. With the July 23 pilot date three days out, this ceases to be a paper question: D1 is answered de facto by whatever actually runs on the 23rd, and per this ruling that is Next.js and Supabase; it should be stated aloud to Craig rather than inherited. Prompt 31 records the corollary of the D12 ruling: the July 23 pilot minimum has zero backend dependency, so D1 stops blocking the pilot and becomes a Phase 2 planning gate, with a recommended ruling date of August 1 before any Part II schema work.

### D2. Transition authority beyond physicians
**Ruling: physician-only for MVP, authority modeled as data.** Requirement F8 stays physician-only for the pilot: only the physician seat moves medical status through the legal transition table, all else rejected server-side. Build the transition-authority table as data (per-role, per-transition) so physiotherapist or nurse-practitioner authority can be enabled later as an insert, not a refactor. Revisit if the pilot's clinical partner is NP-led.

### D3. FHIR phase placement
**Ruling: phase 2, gated on EMR need; out of MVP.** Nothing in MVP depends on FHIR; the pilot clinical workflow runs on Continuum's own physician seat. Target phase 2 for the FHIR resource mappings (DocumentReference, Condition, CarePlan, Task, ServiceRequest) and SMART-on-FHIR launch, built only when a clinical partner's EMR supports it and wants the in-EMR seat.

### D4. Coordinator default access to consented video
**Ruling: professional-only by default.** Movement video is viewable only by the treating professional by default. The coordinator does not get default video access; a specific case that genuinely needs it requires an explicit, audited per-case grant. Satisfies the counsel flag and data minimization.

### D5. Retention schedules per record class
**Ruling: build configurable per-class retention with conservative interim defaults, counsel-gated.** Implement per-record-class retention as config now (video shortest, audit longest), hard-gated so counsel confirms the actual statutory minimums (PIPEDA + Alberta HIA + Ontario) before ANY first live data. Unblocks the build without a premature legal commitment. Actual periods remain a counsel dependency.

### D6. Ontario privacy instrument mapping for consent text
**Ruling: working posture + configurable consent, counsel-gated (assumption).** Build consent text as versioned and jurisdiction-configurable against a working assumption: Continuum operates as an agent/processor beside the authoritative health-information custodian, Ontario PHIPA-oriented with PIPEDA fallback. Logged in the assumption register; counsel confirms the actual instrument, Continuum's status under it, and the consent wording before first live data.

### D7. Claims-panel scope promised to GardaWorld
**Ruling: illustrative concept + submission tracking.** Pilot materials present the SIGMA-embedded Recovery Intelligence panel as an illustrative, phase-two concept (labeled not-live). The pilot's actual claims experience is submission-and-acknowledgement tracking on the board seat, intake-level integration only. Consistent with Prompt 19/20 doctrine; avoids the integration-overreach risk. Prompt 29's board integration matrix refines this: the Ontario pilot board (WSIB) exposes a true B2B XML machine channel, so its adapter transmits machine to machine with a returned confirmation number under the same human-authorizes-the-send gate, while eight of the remaining boards stay portal-assist and one (Yukon) is paper. No Canadian board publishes a retrieval API, which reinforces the receive-only posture: the board seat submits and tracks acknowledgement, it never pulls claim data.

### D8. Marketing boundary for the word intelligence
**Ruling: keep the term, bound it by a verb lexicon.** "Recovery Intelligence" / "Continuous Recovery Intelligence" stays as the category (per Prompt 19). Allowed verbs: surfaces, organizes, connects, routes, informs, flags for review. Banned verbs: diagnoses, predicts, recommends, determines, detects, guarantees. Enforced by a standing marketing-review gate, preserving the framing while holding the device posture.

## Open (Prompt 26, SIGMA-RH integration)

Added by the Prompt 26 review of Craig's SIGMA Enterprise Integration Blueprint on 2026-07-20. None blocks the pilot; each is a target-state or diligence dependency owned outside the build, lifted directly from the blueprint's own appendix.

### D9. SIGMA-RH programmatic API beyond the connector
**Open (Craig's SIGMA-RH relationship).** Confirm whether SIGMA-RH exposes a REST or SOAP API beyond the Power Automate connector. The ideal bidirectional integration needs it; the pragmatic connector-plus-file-exchange state and the pilot manual export do not, so this gates the target state only, never the pilot.

### D10. Enterprise identity federation
**Open (Craig's SIGMA-RH relationship).** Confirm SAML or Microsoft Entra federation for single sign-on into the integration views. Needed for the ideal state and for enterprise trust; the pilot does not depend on it.

### D11. Vendor security diligence artifacts
**Open (diligence).** Obtain the SIGMA-RH SOC 2 report and ISO 27001 certificate directly in diligence rather than from vendor marketing pages, to substantiate the per-customer isolation and Canadian residency posture before any enterprise commitment.

## Ruled after Prompt 30 (pilot minimum)

Opened by the Prompt 30 review of the Complete Build Spec v5 and ruled by Gary the same day, recorded in Prompt 31.

### D12. The July 23 pilot-minimum definition
**Ruling: the achievable pilot minimum, ruled by Gary on 2026-07-20 (recorded in Prompt 31).** July 23 is the program start running on what exists and is tested today: enrollment and consent on paper or portal, the six-portal demo family as the working surfaces (worker check-ins, coordinator queue with the hazard gate, clinician transitions, employer functional view, board submission tracking), coordinator-operated manual processes where the backend is not yet live, and the Ontario filing on the human path with the WSIB B2B adapter as a Phase 2 upgrade. The coordinator is the pilot network (workers report by phone, text, or in person; the coordinator records proxy entries), so the date is real and the risk is staffing, not software. Prompt 31 shipped the HSE pilot pack this ruling required (blank-slate pilot mode, the New Case form, and the working proxy check-in with the escalation rule), giving Phase 1 zero backend dependency and standing down the D1 blocking escalation.

## Counsel dependencies carried forward

D5 (actual retention periods), D6 (Ontario instrument and consent wording), and the D2 revisit trigger (NP-led clinical partner) are the items that must clear before first live data or on partner confirmation. Everything else is buildable now.
