# Continuum Decision Register (Prompt 21)

Tracks the eight open decisions from Prompt 21 section 20, resolved one at a time per the brief's discipline. Where a resolution here conflicts with an earlier document, this register governs that decision once it is dated and ruled by Gary. See [[continuum-mvp-governance]] and specs/CONTINUUM_PROMPT_21.md.

All eight ruled by Gary on 2026-07-20. Prompt 26 (the review of Craig's SIGMA-RH Enterprise Integration Blueprint) adds three open decisions, D9 through D11, carried as integration and diligence dependencies; none blocks the pilot.

## Resolved

### D1. Application stack
**Ruling: Next.js / Supabase / Capacitor.** Confirms the ratified series baseline (G1). The mainline continuum-app is already scaffolded and building on this stack: Next.js 14.2, Supabase client wired (server, browser, middleware), foundation schema migration in place (commit f3d5b9e). The v2 wiring specification's NestJS / PostgreSQL / React Native assumption is superseded. Supabase provides Postgres, so the database posture (row-level isolation as the projection-law floor) is unchanged. No rework; every migration already written stands. Prompt 27's CRTW Intelligence PRD is the second backend document written on the NestJS assumption and, like the v2 spec, is reconciled by this ruling rather than reopening it: the crtw schema, RLS, materialized rollups and scheduled jobs all have Supabase equivalents, so the spec translates rather than breaks, and the reply to Craig informs him of this ruling rather than asking for it.

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
**Ruling: illustrative concept + submission tracking.** Pilot materials present the SIGMA-embedded Recovery Intelligence panel as an illustrative, phase-two concept (labeled not-live). The pilot's actual claims experience is submission-and-acknowledgement tracking on the board seat, intake-level integration only. Consistent with Prompt 19/20 doctrine; avoids the integration-overreach risk.

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

## Counsel dependencies carried forward

D5 (actual retention periods), D6 (Ontario instrument and consent wording), and the D2 revisit trigger (NP-led clinical partner) are the items that must clear before first live data or on partner confirmation. Everything else is buildable now.
