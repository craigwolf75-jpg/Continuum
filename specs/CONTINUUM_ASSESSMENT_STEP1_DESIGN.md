# Continuum Public Injury Recovery Assessment, Step 1: Design Spec

Date: 2026-08-15. Status: DESIGN, awaiting Gary's review. Lane: public marketing
site (deploy/), not the held platform. No em dashes or en dashes anywhere.

This is Step 1, the assessment shell. It is the prerequisite that Prompt 63
(Step 2, scoring and benchmarking) assumes and builds underneath. Step 1 was
authorized by Gary on 2026-08-15 after prerequisite check one found no existing
assessment in the repo or on the deployed site.

## 1. Scope and decisions

Confirmed with Gary during brainstorming:

- **Full two stage front end.** Six questions to an instant Recovery Snapshot,
  then an optional six questions to a deeper result. Both stages ship now.
- **Real, config driven, versioned, deterministic scoring now.** Not a stub. The
  score is computed in the browser so it is instant and works offline. No LLM in
  scoring or interpretation.
- **Phases 1 and 2 now, phase 3 gated.** Phase 1 is the client side assessment
  and score. Phase 2 is anonymous, own result only storage in Supabase. Phase 3,
  aggregate benchmarking, is designed for but stays OFF. Per Prompt 63 Section
  00.4, no response is ingested into any aggregate dataset, and no benchmark
  comparison is displayed, until the privacy and terms disclosure is live and
  counsel reviewed.
- **No lead capture in Step 1.** No name, email, company, or Book a Demo wiring.
  Contact capture, the internal Opportunity Score, and demo or CRM actions are
  Step 2 and are separately gated (Prompt 63 Sections 18 to 20 and 00.3).

Human gates: the new storage schema is cleared by Gary for an anonymous, org
level table. Phase 3 consent copy plus counsel remains an open gate and is out
of scope here.

## 2. Placement and technology

New static surface under `deploy/assessment/`:

- `index.html`: the assessment page, brand aligned (navy #0E1B2C, gold #C8972F,
  Space Grotesk and Inter). One page, staged views (intro, stage 1 questions,
  snapshot, stage 2 questions, detailed result).
- `assessment.js`: the flow controller and the deterministic scoring engine. It
  reads the config and contains NO weights, thresholds, or answer values of its
  own.
- `assessment.css`: styling.
- `config/crs-1.0.js`: the entire scoring model as data. Exposes
  `window.ContinuumCRS` (or an ES module export). Tagged
  `SCORING_MODEL_VERSION = "CRS_1.0"`.

No build step (consistent with the static site; the only bundled part of the
repo is hub-roles/). Three layer resilience: the config has an inline fallback so
the page renders if the config file fails to load; scoring is pure client side so
it never depends on the network; storage is best effort and a failed save never
blocks or alters the result the user sees.

## 3. Question model

Six configurable dimensions, from Prompt 63 Section 2, with the Section 3 V1
weights:

| Key | Dimension | Weight |
|---|---|---|
| MEDICAL_ACCESS | Medical Access | 15 |
| RESTRICTIONS_WORKFLOW | Restrictions Workflow | 20 |
| MODIFIED_DUTY | Modified Duty and RTW | 25 |
| RECOVERY_VISIBILITY | Recovery Visibility | 20 |
| CLAIMS_COORDINATION | Claims Coordination | 10 |
| WORKFLOW_INTEGRATION | Workflow Integration | 10 |

Maturity answers map to a normalized scale (Prompt 63 Section 4), configurable
per question:

| Key | Value | Meaning |
|---|---|---|
| STRUCTURED | 100 | Highly structured or integrated |
| ESTABLISHED | 75 | Established |
| PARTIAL | 50 | Partially structured or manual |
| MANUAL | 25 | Heavily manual or inconsistent |
| ABSENT | 0 | Absent or reactive |
| NOT_SURE | null | Unknown. Never scored as zero (Section 6) |

An intro step captures **industry** (a single selector: construction, mining,
security, manufacturing, transportation, healthcare, other) for future cohort
use. Industry is classification, not maturity, and is never scored.

### 3.1 Stage 1: six questions, one per dimension

S1Q1 MEDICAL_ACCESS. "When a worker is injured, how do they get in to see a
doctor or clinician?"
- Same day, through a provider we have arranged (STRUCTURED)
- Usually within a day or two, through a known provider (ESTABLISHED)
- The worker arranges it themselves, timing varies (PARTIAL)
- Often delayed or hard to arrange (MANUAL)
- There is no set way (ABSENT)
- Not sure (NOT_SURE)

S1Q2 RESTRICTIONS_WORKFLOW. "When a doctor sets work restrictions, how do those
restrictions reach the people who plan the worker's duties?"
- A system routes them to the right people automatically (STRUCTURED)
- A defined manual process that is reliably followed (ESTABLISHED)
- Case by case, mostly by hand (PARTIAL)
- By phone or paper, and it varies (MANUAL)
- There is no reliable process (ABSENT)
- Not sure (NOT_SURE)

S1Q3 MODIFIED_DUTY. "How does your organization find suitable modified or light
duties for a recovering worker?"
- A maintained list of approved modified duties matched to the restrictions (STRUCTURED)
- A repeatable process, matched mostly by hand (ESTABLISHED)
- Improvised for each case by a supervisor or coordinator (PARTIAL)
- Rarely offered, workers usually stay off work (MANUAL)
- We do not offer modified duty (ABSENT)
- Not sure (NOT_SURE)

S1Q4 RECOVERY_VISIBILITY. "How well can the right people see a worker's recovery
progress and current status?"
- A shared, up to date view for the roles that need it (STRUCTURED)
- Regular updates kept in one place (ESTABLISHED)
- Occasional updates, spread across people and tools (PARTIAL)
- Little visibility until a problem appears (MANUAL)
- No real visibility (ABSENT)
- Not sure (NOT_SURE)

S1Q5 CLAIMS_COORDINATION. "How is the workers compensation claim coordinated
alongside the worker's recovery?"
- Claim and recovery are managed together, closely coordinated (STRUCTURED)
- Coordinated by one clear owner (ESTABLISHED)
- Handled separately, with some handoffs (PARTIAL)
- Fragmented, with frequent gaps (MANUAL)
- Not coordinated (ABSENT)
- Not sure (NOT_SURE)

S1Q6 WORKFLOW_INTEGRATION. "How connected are the systems and people involved in
recovery: medical, employer, and claims?"
- Connected systems with defined handoffs (STRUCTURED)
- Some connection, coordinated mostly by hand (ESTABLISHED)
- Separate systems with manual handoffs (PARTIAL)
- Disconnected, information is re-entered (MANUAL)
- No connection between them (ABSENT)
- Not sure (NOT_SURE)

### 3.2 Stage 2: six questions, exposure plus depth

Four exposure inputs (scale, never scored as maturity, Section 5) and two deeper
maturity questions on the heaviest dimension (MODIFIED_DUTY 25) and one of the
joint second heaviest (RECOVERY_VISIBILITY 20).

S2Q1 EXPOSURE workforce_size (bands): under 100, 100 to 499, 500 to 1999, 2000
to 9999, 10000 plus.

S2Q2 EXPOSURE annual_lost_time_cases: under 10, 10 to 49, 50 to 199, 200 to 999,
1000 plus. Optional exact number field; an exact number is USER_PROVIDED, a band
midpoint is MODELED_ESTIMATE.

S2Q3 EXPOSURE avg_lost_time_duration_days: under 1 week, 1 to 2 weeks, 3 to 4
weeks, 1 to 3 months, 3 months plus. Band maps to a representative day value for
the scenario calculation, labelled MODELED_ESTIMATE.

S2Q4 EXPOSURE site_count: 1, 2 to 5, 6 to 20, 21 plus. Feeds cohort and Step 2
complexity, not maturity.

S2Q5 MODIFIED_DUTY deeper. "Once a worker starts modified duties, how is their
progress tracked?"
- Tracked and adjusted with the clinician (STRUCTURED)
- Tracked manually and reviewed (ESTABLISHED)
- Started but not really tracked (PARTIAL)
- Not tracked (MANUAL)
- Not applicable, we do not offer modified duty (ABSENT)
- Not sure (NOT_SURE)

S2Q6 RECOVERY_VISIBILITY deeper. "Can a worker and their supervisor see the
current restrictions and the plan without having to ask someone?"
- Both can, self serve (STRUCTURED)
- One of them can (ESTABLISHED)
- Only by asking a coordinator (PARTIAL)
- No, it is not visible to them (MANUAL)
- There is no plan to see (ABSENT)
- Not sure (NOT_SURE)

Note: exact wording and the choice of which dimensions get a Stage 2 depth
question are configurable (Section 4 of Prompt 63). This set covers the
heaviest dimension (MODIFIED_DUTY 25) and one joint second heaviest
(RECOVERY_VISIBILITY 20), and yields the lost worker day inputs (cases times
duration). Depth for Restrictions Workflow, the other weight 20 dimension, can be
added in config without a front end change.

## 4. Scoring engine (deterministic, config driven)

All logic reads `config/crs-1.0.js`. Algorithm:

1. **Dimension score.** For each dimension, collect its answered maturity values,
   excluding NOT_SURE. If a dimension has a Stage 1 answer and a Stage 2 depth
   answer, the dimension score is their average; otherwise it is the single
   answered value. A dimension with only NOT_SURE answers is `unknown`.
2. **Overall score.** Weighted average over answered dimensions only, with the
   weights renormalized across the dimensions that have a score:
   `overall = round( sum(weight_d * score_d) / sum(weight_d) )` over answered d.
   This is the Section 6 rule: calculate from available evidence, do not let
   unknowns drag the score to zero.
3. **Missing data rate.** `not_sure_count / answered_maturity_question_count`,
   retained internally (Section 6).
4. **Assessment confidence** (Section 23), thresholds in config. Starting rule:
   High if at most one NOT_SURE and at least five dimensions scored; Moderate if
   two or three NOT_SURE or four dimensions scored; Limited otherwise. Confidence
   controls result wording strength, not the score.
5. **Strongest Area and Largest Opportunity or Gap.** Highest and lowest scored
   (sufficiently supported, meaning answered and not unknown) dimensions.
6. **Observation.** A deterministic rules and templates library in config. Each
   rule is a set of dimension conditions and a template string; the first
   matching rule renders. Prompt 63 Section 8 example is encoded as a rule: if
   RESTRICTIONS_WORKFLOW at least 60 and MODIFIED_DUTY at most 50, render the
   coordination observation.

Provenance (Section 15): every stored value carries USER_PROVIDED, UNKNOWN, or
MODELED_ESTIMATE (for band derived exposure). It survives calculation into the
result object and the stored record.

Maturity bands (Section 7), config labels, Continuum defined, never externally
certified: 0 to 39 Reactive, 40 to 59 Developing, 60 to 79 Established, 80 to 100
Advanced.

## 5. Result screens

### 5.1 Stage 1 Recovery Snapshot
- Recovery Readiness score out of 100, and band label.
- Strongest Area, Largest Opportunity.
- One deterministic observation.
- A confidence line and, where a dimension is unknown, a plain prompt that
  supplying that input would improve precision (Section 6 example language).
- No benchmark. A single call to action: continue to the optional deeper
  assessment.

### 5.2 Stage 2 Your Detailed Continuum Assessment
- Refined Recovery Readiness score out of 100.
- Strongest Area, Largest Gap, three priority opportunities (the three lowest
  scored dimensions, each with a config template line).
- Where exposure inputs allow: Operational Exposure, "Estimated lost worker days:
  N per year," with N labelled estimated when derived from bands. Improvement
  Scenario language exactly per Section 16: "A 10 percent reduction in average
  lost time duration would represent approximately M worker days annually." Not a
  performance claim.
- No benchmark comparison is shown (phase 3, gated). The data model and result
  language keep injury frequency separate from RTW maturity (Section 11).
- No false precision (Section 25): whole numbers, no spurious decimals.

Result wording strength follows confidence (Section 23): High uses "Your
responses indicate," lower uses "Based on the information available, your
responses suggest."

## 6. Storage (phase 2, anonymous, own result only)

Mechanism: an anon callable SECURITY DEFINER RPC, matching the proven pattern
this project already uses for anonymous public writes (framer_demo_* and
validate_and_log_access), which avoids depending on whether the buildless static
project serves `deploy/api/` functions.

Append only table (append only per repo law 4):

```sql
create table if not exists public.public_assessment_response (
  response_id            uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  scoring_model_version  text not null,
  stage_reached          int  not null,          -- 1 or 2
  industry               text,                    -- classification only
  answers                jsonb not null,          -- { questionId: optionKey }
  dimension_scores       jsonb not null,          -- { DIMENSION: int|null }
  overall_score          int,                     -- 0 to 100, null if not computable
  band                   text,
  assessment_confidence  text,                    -- High | Moderate | Limited
  missing_data_rate      numeric,
  exposure               jsonb,                   -- bands only
  provenance             jsonb                    -- per field provenance
);
alter table public.public_assessment_response enable row level security;
-- No policies for anon or authenticated: no direct read or write. All writes go
-- through the SECURITY DEFINER function below, which runs as owner.
revoke all on public.public_assessment_response from public, anon, authenticated;

create or replace function public.submit_public_assessment(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_id uuid;
begin
  insert into public.public_assessment_response
    (scoring_model_version, stage_reached, industry, answers, dimension_scores,
     overall_score, band, assessment_confidence, missing_data_rate, exposure, provenance)
  values
    (p_payload->>'scoring_model_version',
     (p_payload->>'stage_reached')::int,
     p_payload->>'industry',
     coalesce(p_payload->'answers','{}'::jsonb),
     coalesce(p_payload->'dimension_scores','{}'::jsonb),
     nullif(p_payload->>'overall_score','')::int,
     p_payload->>'band',
     p_payload->>'assessment_confidence',
     nullif(p_payload->>'missing_data_rate','')::numeric,
     p_payload->'exposure',
     p_payload->'provenance')
  returning response_id into v_id;
  return v_id;
end;
$function$;
revoke all on function public.submit_public_assessment(jsonb) from public;
grant execute on function public.submit_public_assessment(jsonb) to anon;
```

Data stored is anonymous and organization level: no name, email, company, IP, or
user agent, and no personal or health information. No aggregation and no benchmark
read or write. Best effort: the client shows the result first, then fires the
save; a failure is logged client side and never surfaced as a blocking error.

Security notes carried from the recent audit: search_path is pinned, EXECUTE is
granted narrowly to anon only, and the base table denies all direct access. There
is no benchmark or cross record read path.

## 7. Versioning, config not in presentation, provenance

- `SCORING_MODEL_VERSION = "CRS_1.0"` is stored on every response. A weights or
  mapping change becomes CRS_1.1. Historical responses are never silently
  recalculated (Section 21). Benchmark versioning (CRB_...) is Step 2.
- A test asserts the presentation and engine files contain no numeric weight or
  threshold literals and that editing only `config/crs-1.0.js` changes the
  computed scores (Section 28 requirement).

## 8. Testing

Node suite `deploy/assessment/assessment.test.mjs`, matching the repo
`deploy/*.test.mjs` convention and CI glob. SYNTH prefixed fixtures. Drives the
six Prompt 63 Section 27 profiles and asserts expected behavior:

| Profile | Shape | Key assertions |
|---|---|---|
| A | small, low volume, weak processes | low maturity, low exposure |
| B | large, high volume, weak processes | low maturity, high exposure, size did NOT lower maturity |
| C | large, mature processes | high maturity, high exposure, scores stay separate |
| D | medium, mixed maturity | mid band, correct strongest and gap |
| E | several Not sure | unknowns not zero, confidence Limited, score from available only |
| F | insufficient cohort | no benchmark shown, no manufactured comparison |

Plus unit assertions: Not sure never becomes 0; weight renormalization over
answered dimensions; confidence tiers; provenance survives; version retained;
lost worker day math (for example 42 cases at 12 days is 504, a 10 percent
reduction is approximately 50); no em or en dashes in any shipped string; band
thresholds match config.

## 9. Constraints honored

Dash law (no em or en dashes). Three layer resilience on every data path. No LLM
in scoring or interpretation. UNKNOWN is never rendered as 0. Provenance survives
calculation. Append only migrations. No package.json change (no new dependency;
if the anon Supabase client is not already present on the marketing site, it is
vendored locally, not loaded from a CDN, decided during planning). No external
scraping, outreach, CRM, or email. Human gates surfaced: schema (cleared for this
anonymous table), and phase 3 consent copy plus counsel (out of scope).

## 10. Open uncertainties and Step 2 handoff

1. Whether the marketing site already loads an anon Supabase client. If not, the
   plan vendors supabase-js locally. Confirm during planning.
2. Whether industry, site_count, and workforce_size selectors should match a
   specific taxonomy Craig wants for cohorts. Defaulted here; adjustable in config.
3. The Stage 2 depth questions cover two dimensions. Adding depth for the others
   is a config only change.
4. Step 2 slots in underneath without a front end rewrite: richer scoring in
   config or a server engine, benchmark hierarchy and confidence, the internal
   Opportunity Score, lead capture, and the consent gated aggregate benchmark.
5. Phase 3 requires the privacy and terms disclosure live and counsel reviewed
   before any ingestion into an aggregate dataset or any benchmark display.
