# Step 2D Internal Opportunity Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute an internal Opportunity Score server-side from data already collected, store it in internal columns the client never sees, capture Review and Book-a-Demo engagement, and never show it to the respondent.

**Architecture:** One append-only Postgres migration (columns, a weights config table, a deterministic compute function, the updated submit RPC, and a record_engagement RPC) plus client CTA wiring in `assessment.js`. Verified by the exposure-proof CI job.

**Tech Stack:** PL/pgSQL (server-side scorer), plain JS (client CTAs), Node `.mjs` tests, the exposure-proof SQL gate.

**Spec:** `specs/CONTINUUM_ASSESSMENT_STEP2D_DESIGN.md` (authority).

## Global Constraints

- No em dashes and no en dashes anywhere (SQL, JS, comments, commit messages). Tests detect dashes by `charCodeAt(0) === 0x2013` or `0x2014`.
- Deterministic, no LLM. UNKNOWN maturity is excluded from averages, never scored 0.
- The Opportunity Score is NEVER returned to the client and NEVER rendered. `submit_public_assessment` still returns only `response_id`; `record_engagement` returns void.
- No individual PII feeds the score or is stored (org-level bands, maturity sub-scores, boolean engagement flags only).
- Weights live in `public.opportunity_weights` (editable); the compute function reads them and renormalizes over present factors.
- Append-only migration (adds columns, a table, replaces two functions). Book a Demo outbound (email/CRM/booking backend) is NOT built (gated on Craig); only the click-capture and a link.
- Tests are `deploy/assessment-*.test.mjs` and additions to `supabase/tests/exposure_proof.sql`. SYNTH fixtures.
- No migration is applied to the live DB in this build; the exposure-proof CI applies it to a throwaway Postgres. The controller applies it live after merge.

---

### Task 1: Migration (schema, weights, scorer, RPCs) + exposure-proof

**Files:**
- Create: `supabase/migrations/20260817120000_opportunity_score.sql`
- Modify: `supabase/tests/exposure_proof.sql`

**Interfaces:**
- Produces columns `opportunity_score`, `opportunity_factors`, `engagement_signals` on `public.public_assessment_response`; table `public.opportunity_weights`; functions `public.compute_opportunity_score(public.public_assessment_response) returns jsonb` (returns `{score, factors}`), updated `public.submit_public_assessment(jsonb) returns uuid`, and `public.record_engagement(uuid, text) returns void` (anon EXECUTE).

- [ ] **Step 1: Write the migration.** Use the DDL in spec section 2 (columns, `opportunity_weights` table + seed). Then the deterministic scorer (band-to-subscore mappings in the function; weights from the table):

```sql
create or replace function public.compute_opportunity_score(p_row public.public_assessment_response)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ex jsonb := coalesce(p_row.exposure, '{}'::jsonb);
  v_ds jsonb := coalesce(p_row.dimension_scores, '{}'::jsonb);
  v_eng jsonb := coalesce(p_row.engagement_signals, '{}'::jsonb);
  v_wf numeric := nullif(v_ex #>> '{workforce_size,value}','')::numeric;
  v_inj numeric := nullif(v_ex #>> '{annual_lost_time_cases,value}','')::numeric;
  v_sites numeric := nullif(v_ex #>> '{site_count,value}','')::numeric;
  v_scale int; v_exposure int; v_pain int; v_complexity int; v_engagement int;
  v_pain_vals numeric[]; v_avg numeric; v_wi int;
  v_num numeric := 0; v_den numeric := 0; v_w int; v_factors jsonb := '{}'::jsonb;
  r record;
begin
  -- scale from workforce size value
  v_scale := case when v_wf is null then null when v_wf >= 10000 then 100 when v_wf >= 2000 then 75 when v_wf >= 500 then 50 when v_wf >= 100 then 25 else 0 end;
  -- exposure from injury/claim volume value
  v_exposure := case when v_inj is null then null when v_inj >= 1000 then 100 when v_inj >= 200 then 75 when v_inj >= 50 then 50 when v_inj >= 10 then 25 else 0 end;
  -- process pain = 100 - avg maturity of the four pain dimensions (non-null only)
  v_pain_vals := array_remove(array[
    nullif(v_ds->>'MODIFIED_DUTY','')::numeric,
    nullif(v_ds->>'RESTRICTIONS_WORKFLOW','')::numeric,
    nullif(v_ds->>'RECOVERY_VISIBILITY','')::numeric,
    nullif(v_ds->>'CLAIMS_COORDINATION','')::numeric], null);
  if array_length(v_pain_vals,1) is null then v_pain := null;
  else select 100 - round(avg(x)) into v_pain from unnest(v_pain_vals) x; end if;
  -- complexity from sites + low workflow integration
  v_wi := nullif(v_ds->>'WORKFLOW_INTEGRATION','')::int;
  v_complexity := case
    when v_sites is null and v_wi is null then null
    else round((
      coalesce(case when v_sites is null then null when v_sites >= 21 then 100 when v_sites >= 6 then 66 when v_sites >= 2 then 33 else 0 end, 0)
      + coalesce(case when v_wi is null then null else 100 - v_wi end, 0)
    ) / greatest(1, (case when v_sites is null then 0 else 1 end) + (case when v_wi is null then 0 else 1 end)))
  end;
  -- engagement from stage completion + clicks
  v_engagement := 25
    + case when p_row.stage_reached >= 2 or (v_eng->>'completed_stage_2') = 'true' then 25 else 0 end
    + case when (v_eng->>'review_clicked') = 'true' then 25 else 0 end
    + case when (v_eng->>'book_a_demo_clicked') = 'true' then 25 else 0 end;
  -- weighted average over factors that have a sub-score, weights renormalized
  for r in select factor, weight from public.opportunity_weights loop
    v_w := r.weight;
    if v_w = 0 then continue; end if;
    declare v_sub int;
    begin
      v_sub := case r.factor
        when 'scale' then v_scale when 'exposure' then v_exposure
        when 'process_pain' then v_pain when 'complexity' then v_complexity
        when 'engagement' then v_engagement else null end;
      if v_sub is not null then
        v_num := v_num + v_w * v_sub; v_den := v_den + v_w;
        v_factors := v_factors || jsonb_build_object(r.factor, v_sub);
      end if;
    end;
  end loop;
  return jsonb_build_object(
    'score', case when v_den = 0 then null else round(v_num / v_den) end,
    'factors', v_factors);
end;
$function$;
```

Then update `submit_public_assessment` (after the insert, set `engagement_signals` from the payload and store the score):

```sql
-- inside submit_public_assessment, after "returning response_id into v_id;"
update public.public_assessment_response r
   set engagement_signals = jsonb_build_object('completed_stage_2', (r.stage_reached >= 2)),
       opportunity_score = (public.compute_opportunity_score(r)->>'score')::int,
       opportunity_factors = public.compute_opportunity_score(r)->'factors'
 where r.response_id = v_id;
```

Then `record_engagement`:

```sql
create or replace function public.record_engagement(p_response_id uuid, p_signal text)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_row public.public_assessment_response;
begin
  if p_signal not in ('review_clicked','book_a_demo_clicked') then
    raise exception 'invalid engagement signal';
  end if;
  update public.public_assessment_response
     set engagement_signals = coalesce(engagement_signals,'{}'::jsonb) || jsonb_build_object(p_signal, true)
   where response_id = p_response_id
   returning * into v_row;
  if v_row.response_id is null then return; end if;
  update public.public_assessment_response
     set opportunity_score = (public.compute_opportunity_score(v_row)->>'score')::int,
         opportunity_factors = public.compute_opportunity_score(v_row)->'factors'
   where response_id = p_response_id;
end;
$function$;
revoke all on function public.record_engagement(uuid, text) from public;
grant execute on function public.record_engagement(uuid, text) to anon;
```

Keep `opportunity_weights` RLS-enabled with no anon/authenticated policy. Dash-clean. Timestamp sorts after the latest existing migration.

- [ ] **Step 2: Add exposure_proof assertions** (before the final `reset role;`), after the existing blocks: insert SYNTH Employer A (large, high-volume, weak processes, stage 2) and Employer B (tiny, low volume, one site) directly, run `compute_opportunity_score` on each, and assert A's score is materially higher than B's; assert `record_engagement(A, 'book_a_demo_clicked')` raises A's score (or engagement factor); assert an invalid signal raises; assert `set role anon; select ... from public.opportunity_weights` is denied; assert `submit_public_assessment` and `record_engagement` return no opportunity field. Use SYNTH-prefixed identifiers.

- [ ] **Step 3: Self-review the SQL** (cannot run locally, no Postgres): check syntax, that the scorer reads only org-level and maturity fields (no PII), weights renormalize, UNKNOWN excluded. State that live verification is the exposure-proof CI at PR.

- [ ] **Step 4: Commit** (`git add supabase/migrations/20260817120000_opportunity_score.sql supabase/tests/exposure_proof.sql; git commit -m "feat(assessment): internal Opportunity Score (server-side scorer, weights, engagement RPC)"`).

---

### Task 2: Client CTAs and engagement wiring

**Files:**
- Modify: `deploy/assessment/assessment.js`
- Test: `deploy/assessment-engagement.test.mjs`

**Interfaces:**
- Consumes the `response_id` returned by the existing save. Adds, to the Stage 2 detailed result, two CTAs that call `record_engagement` best effort.

- [ ] **Step 1: Write the smoke/sandbox test**

```js
// deploy/assessment-engagement.test.mjs
import { readFileSync } from 'fs';
const js = readFileSync(new URL('./assessment/assessment.js', import.meta.url), 'utf8');
let failures = 0; function ok(n,c){ if(!c){ failures++; console.error('FAIL', n); } }
ok('has a Review my results control', /Review my results/i.test(js));
ok('has a Book a Demo control', /Book a Demo/i.test(js));
ok('calls record_engagement rpc', js.includes("record_engagement"));
ok('records review_clicked and book_a_demo_clicked', js.includes('review_clicked') && js.includes('book_a_demo_clicked'));
ok('never renders an opportunity score', !/opportunity/i.test(js));
ok('engagement is best effort (guarded)', js.includes('try') && js.includes('catch'));
ok('no em or en dashes', ![...js].some(c => c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014));
if (failures) { console.error(failures + ' checks failed'); process.exit(1); }
console.log('assessment-engagement: PASS');
```

- [ ] **Step 2: Run and watch it fail.**

- [ ] **Step 3: Wire the CTAs in `assessment.js`.** On the Stage 2 detailed result, render "Review my results" (primary) and "Book a Demo" (secondary), shown only when a `response_id` exists (after a save). Add `window.ContinuumAssessment.recordEngagement(responseId, signal, client)` that calls `client.rpc('record_engagement', { p_response_id: responseId, p_signal: signal })`, never throws (try/catch, resolves regardless), and returns a Promise. Review my results calls it with `review_clicked` then shows a brief neutral confirmation. Book a Demo calls it with `book_a_demo_clicked` then navigates to the site demo-booking destination (reuse the marketing demo link or a placeholder constant; no email/CRM/lead capture). The opportunity score is never fetched, referenced, or rendered. Best effort: a failed call never blocks the CTA. Dash-clean.

- [ ] **Step 4: Run the smoke test to green.**

- [ ] **Step 5: Manual browser verification (controller does this).** Note that live CTA behavior (record_engagement fired, demo link navigates, no score visible) is pending a browser check.

- [ ] **Step 6: Run the whole assessment suite** and confirm every assessment suite passes.

- [ ] **Step 7: Commit** (`git add deploy/assessment/assessment.js deploy/assessment-engagement.test.mjs; git commit -m "feat(assessment): Review and Book a Demo CTAs with best-effort engagement capture"`).

---

## Self-Review

Spec coverage: internal columns + weights table (Task 1), server-side deterministic scorer with UNKNOWN-excluded and renormalized weights (Task 1), updated submit RPC storing the score and returning only response_id (Task 1), record_engagement RPC (Task 1), exposure-proof SYNTH A-vs-B and internal-not-exposed assertions (Task 1 Step 2), client CTAs with best-effort engagement and no score rendering (Task 2), Book a Demo click-capture with outbound left gated (Task 2), no PII (throughout), dash law and no-LLM (throughout). The internal admin surface and the Book a Demo outbound backend are explicitly out of scope (spec section 11).

Placeholder scan: the compute function's band thresholds are concrete in Task 1 Step 1; the exposure-proof SYNTH rows are described with their exact shape in Step 2 (the implementer builds them from the row columns). No TBDs.

Type consistency: `compute_opportunity_score` returns `jsonb {score, factors}`, consumed by both `submit_public_assessment` and `record_engagement` via `->>'score'` and `->'factors'`; `record_engagement(uuid, text)` signature matches the client call `{ p_response_id, p_signal }`; the client `recordEngagement(responseId, signal, client)` maps to that RPC; engagement_signals keys (`completed_stage_2`, `review_clicked`, `book_a_demo_clicked`) are consistent between the scorer, the RPCs, and the client.
