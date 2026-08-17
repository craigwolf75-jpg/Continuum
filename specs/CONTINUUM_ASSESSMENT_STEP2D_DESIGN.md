# Continuum Public Assessment, Step 2D: Internal Opportunity Score. Design Spec

Date: 2026-08-17. Status: DESIGN, awaiting Gary's review. Lane: public marketing
site plus its internal storage. No em dashes or en dashes anywhere.

Sub-project D of Prompt 63 Step 2 (Sections 18 to 20). Builds the internal
Continuum Opportunity Score: 0 to 100, estimates how commercially relevant an
organization may be, NEVER shown to the respondent, computed server-side from
data already collected, no individual PII. Gary approved this design and its two
scope decisions (server-side internal columns; include Book a Demo) on
2026-08-17.

## 1. Scope and decisions

- The Opportunity Score is computed SERVER-SIDE in the submit RPC (PL/pgSQL) and
  stored in internal columns that no client-reachable RPC or view ever returns.
  The score never exists in the browser (Gary's ruling).
- Weights live in a small config table, editable without code (Section 19).
- All factors derive from data already collected (org-level bands and maturity
  answers) plus engagement signals. NO individual PII feeds it (Section 00.4).
- Engagement includes Book a Demo: the click is captured and feeds the score,
  but the actual outbound (email, CRM, booking backend) is OFF and gated on
  Craig (Section 00.3). Only the click-capture and a link are built here.
- The public Recovery Readiness score and the Opportunity Score never mix and
  are never shown together to the respondent (Sections 18, 20).
- Schema migration required (columns, a weights table, two RPCs). Gary cleared
  the schema gate by choosing server-side internal columns.

## 2. Schema (new migration, append only)

Add to `public.public_assessment_response` (columns, not a rewrite):

```sql
alter table public.public_assessment_response
  add column if not exists opportunity_score int
    check (opportunity_score is null or (opportunity_score >= 0 and opportunity_score <= 100)),
  add column if not exists opportunity_factors jsonb,   -- {scale,exposure,process_pain,complexity,engagement,fit} sub-scores
  add column if not exists engagement_signals jsonb default '{}'::jsonb; -- {completed_stage_2,review_clicked,book_a_demo_clicked}
```

Weights config table (Section 19), seeded, editable:

```sql
create table if not exists public.opportunity_weights (
  factor text primary key,   -- scale | exposure | process_pain | complexity | engagement | fit
  weight int not null check (weight >= 0 and weight <= 100)
);
insert into public.opportunity_weights(factor, weight) values
  ('scale',25),('exposure',20),('process_pain',25),('complexity',15),('engagement',15),('fit',0)
  on conflict (factor) do nothing;
```

(The Section 19 groups sum to 100 across scale/exposure/process_pain/complexity/
engagement; `fit` starts at weight 0 so it is defined but does not affect V1
until Craig sets a target-fit policy. Weights are editable and re-validated to
sum to 100 by the compute function.)

RLS: `opportunity_weights` has RLS enabled, no anon or authenticated policy
(internal only). The internal columns on `public_assessment_response` inherit the
table's existing deny-all posture; they are never granted or projected to a
client-reachable surface.

## 3. Server-side scoring (PL/pgSQL, deterministic)

A SECURITY DEFINER helper `public.compute_opportunity_score(p_row public.public_assessment_response)`
returns `{ score int, factors jsonb }`. It:

1. Derives six factor sub-scores (0 to 100) from the row's org-level fields and
   maturity answers (deterministic band-to-subscore mappings documented in the
   function):
   - scale: workforce_size band and lost-time volume.
   - exposure: injury/claim volume band.
   - process_pain: 100 minus the average maturity of MODIFIED_DUTY,
     RESTRICTIONS_WORKFLOW, RECOVERY_VISIBILITY, CLAIMS_COORDINATION (low
     maturity means high pain means high opportunity). Unknown dimensions are
     excluded from the average, never treated as 0 (UNKNOWN is not 0).
   - complexity: site_count band, jurisdiction breadth, and the
     WORKFLOW_INTEGRATION answer (low integration means high complexity).
   - engagement: completed Stage 1 (base), completed Stage 2, review_clicked,
     book_a_demo_clicked, each adding to the engagement sub-score.
   - fit: reserved (weight 0 in V1).
2. Reads the weights from `public.opportunity_weights`, renormalizes them over
   the factors that have a sub-score, and returns the weighted average as
   `score` plus the per-factor `factors` breakdown.

No LLM. No individual PII is read (only org-level bands, maturity sub-scores,
and boolean engagement flags). The band-to-subscore mappings are documented in
the function; the top-level weights are the config-table editable layer per
Section 19. Finer per-band configuration is a follow-up.

## 4. Submit RPC update

`public.submit_public_assessment(p_payload jsonb)` (existing, replaced in this
migration) additionally, after the insert:
- Sets `engagement_signals` from the payload's known-at-save signals
  (`completed_stage_2` from stage_reached; review/demo default false).
- Calls `compute_opportunity_score` on the new row and stores `opportunity_score`
  and `opportunity_factors`.
- STILL returns only `response_id` to the client. The opportunity fields are
  never in the RPC result. No behavior change for the client.

## 5. Engagement RPC

`public.record_engagement(p_response_id uuid, p_signal text)` returns void,
SECURITY DEFINER, `search_path` pinned, anon EXECUTE:
- Validates `p_signal in ('review_clicked','book_a_demo_clicked')` (rejects
  anything else).
- Sets that flag true in `engagement_signals` for the given response, then
  recomputes and updates `opportunity_score` and `opportunity_factors`.
- Reads and writes only the internal engagement and opportunity fields; returns
  nothing. `p_response_id` is a random uuid the client received from its own
  save, so an attacker cannot enumerate other responses; the function exposes no
  data either way.

## 6. Result surface (client)

On the Stage 2 detailed result (Section 24), two CTAs, only after a Save (when a
`response_id` exists):
- Review my results (primary): calls `record_engagement(id,'review_clicked')`,
  best effort, then shows a brief neutral confirmation.
- Book a Demo (secondary): calls `record_engagement(id,'book_a_demo_clicked')`,
  best effort, then navigates to the site demo-booking destination (a configured
  URL; reuse the marketing site's existing or pending demo link). No email, CRM,
  lead capture, or booking backend is built here; that outbound stays gated on
  Craig (Section 00.3).

If the respondent did not Save, the CTAs still render; Book a Demo still
navigates, but no engagement is recorded (there is no response to attach it to).
The Opportunity Score is never shown, referenced, or hinted at on any client
surface.

## 7. Internal-only enforcement

- The opportunity and engagement columns are never granted to anon or
  authenticated, never returned by `submit_public_assessment` or
  `record_engagement`, and never placed in any view a client can reach.
- `opportunity_weights` is internal (RLS deny-all).
- A future internal admin or ops surface reads these via service_role; that
  surface is NOT built here.
- The exposure_proof release gate gains assertions: anon and authenticated
  cannot read `public_assessment_response` at all (already true) and
  `opportunity_weights`; and neither `submit_public_assessment` nor
  `record_engagement` returns an opportunity field.

## 8. No PII

Stored: org-level bands, maturity sub-scores, boolean engagement flags, and the
derived opportunity score and factors. No name, email, company, IP, user agent,
or health data. The Book a Demo click is a boolean, not a contact detail.

## 9. Testing

- Server-side scoring proven via the exposure_proof CI DB (which applies the
  migration): SYNTH Employer A (12000 workers, 250 plus injuries, multiple
  sites, manual matching, poor visibility, completed Stage 2, review requested)
  yields a HIGH opportunity score; SYNTH Employer B (75 workers, under 10
  injuries, manual, one site) yields a LOW score. The two illustrate that scale
  and process pain drive opportunity independently of the public readiness score
  (Section 20). Assert A is materially higher than B.
- `record_engagement` recompute: a demo click raises the engagement factor and
  the overall score for that response; an invalid signal is rejected.
- Internal-not-exposed: the exposure_proof assertions in section 7.
- Weights are read from the config table (changing a weight changes the score);
  weights renormalize over present factors; UNKNOWN maturity is excluded, never
  scored 0.
- No-PII: the stored row carries no personal or contact field.
- Client CTA wiring smoke-tested (record_engagement called on click, best
  effort, score never rendered).
- SYNTH fixtures; dash-clean (charCodeAt 0x2013/0x2014).

## 10. Constraints and gates

Dash law. Deterministic, no LLM. Three layer resilience (client CTAs are best
effort). Append-only migration (adds columns, a table, and replaces two
functions). No package.json change. Storage stays opt-in and own-result-only for
the public data; the internal opportunity fields are derived server-side and are
never public. Schema gate cleared by Gary. Book a Demo outbound gated on Craig
(only click-capture and a link built). No PII.

## 11. Open items and handoffs

1. The internal admin or ops surface that reads the Opportunity Score is not
   built here; it is the consumer of these columns.
2. Book a Demo outbound (email, CRM, booking backend) is Craig's gated decision;
   only the click-capture and destination link are built.
3. Band-to-subscore mappings are in the compute function; finer per-band config
   (beyond the editable weight groups) is a follow-up.
4. This sub-project requires a live migration apply after merge (like Step 1),
   so the assessment's save computes and stores the opportunity score in
   production.
5. The Section 19 `fit` factor is reserved at weight 0 pending Craig's
   target-fit policy (which industries and operational environments score higher).
