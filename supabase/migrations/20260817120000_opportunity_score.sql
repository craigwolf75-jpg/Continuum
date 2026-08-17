-- Continuum public assessment, Step 2D (Prompt 63 Step 2, sections 18 to 20).
-- Append only, never edit once applied. No em dashes or en dashes anywhere.
--
-- Internal Continuum Opportunity Score: 0 to 100, estimates how commercially
-- relevant an organization may be. NEVER shown to the respondent, computed
-- server side from data already collected, no individual PII. See
-- specs/CONTINUUM_ASSESSMENT_STEP2D_DESIGN.md for the full design.

alter table public.public_assessment_response
  add column if not exists opportunity_score int
    check (opportunity_score is null or (opportunity_score >= 0 and opportunity_score <= 100)),
  add column if not exists opportunity_factors jsonb,   -- {scale,exposure,process_pain,complexity,engagement,fit} sub-scores
  add column if not exists engagement_signals jsonb default '{}'::jsonb; -- {completed_stage_2,review_clicked,book_a_demo_clicked}

-- Weights config table (section 19), seeded, editable without code. Internal
-- only: RLS enabled, no anon or authenticated policy, and privileges revoked
-- so a bare select is denied, matching the deny-all posture used elsewhere
-- in this project for internal only tables.
create table if not exists public.opportunity_weights (
  factor text primary key,   -- scale | exposure | process_pain | complexity | engagement | fit
  weight int not null check (weight >= 0 and weight <= 100)
);
insert into public.opportunity_weights(factor, weight) values
  ('scale',25),('exposure',20),('process_pain',25),('complexity',15),('engagement',15),('fit',0)
  on conflict (factor) do nothing;
alter table public.opportunity_weights enable row level security;
revoke all on public.opportunity_weights from public, anon, authenticated;

-- Deterministic scorer. Internal helper only, never called directly by a
-- client role: revoked from public and never granted to anon. Only the two
-- SECURITY DEFINER RPCs below call it, running as the function owner, which
-- always retains its own implicit execute privilege regardless of the
-- revoke. Reads only org level exposure bands, maturity dimension_scores,
-- stage_reached, and boolean engagement_signals: no individual PII. UNKNOWN
-- maturity dimensions (null) are excluded from the process pain average,
-- never treated as 0.
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
revoke all on function public.compute_opportunity_score(public.public_assessment_response) from public;

-- Replace submit_public_assessment: after the insert, sets engagement_signals
-- from stage_reached and stores the opportunity score and factors. Still
-- returns only response_id to the client; the opportunity fields are never
-- in the RPC result. compute_opportunity_score is called once into a jsonb
-- variable and read from there.
create or replace function public.submit_public_assessment(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_row public.public_assessment_response;
  v_opp jsonb;
begin
  insert into public.public_assessment_response
    (scoring_model_version, stage_reached, industry, answers, dimension_scores,
     overall_score, band, assessment_confidence, missing_data_rate, exposure, provenance,
     save_source)
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
     p_payload->'provenance',
     p_payload->>'save_source')
  returning * into v_row;
  v_id := v_row.response_id;

  v_row.engagement_signals := jsonb_build_object('completed_stage_2', (v_row.stage_reached >= 2));
  v_opp := public.compute_opportunity_score(v_row);

  update public.public_assessment_response
     set engagement_signals = v_row.engagement_signals,
         opportunity_score = (v_opp->>'score')::int,
         opportunity_factors = v_opp->'factors'
   where response_id = v_id;

  return v_id;
end;
$function$;
revoke all on function public.submit_public_assessment(jsonb) from public;
grant execute on function public.submit_public_assessment(jsonb) to anon;

-- Engagement RPC: validates the signal, sets the flag, then recomputes and
-- stores the opportunity score and factors. Returns void, never an
-- opportunity field. p_response_id is a random uuid the client received
-- from its own save, so an attacker cannot enumerate other responses; the
-- function exposes no data either way. compute_opportunity_score is called
-- once into a jsonb variable and read from there.
create or replace function public.record_engagement(p_response_id uuid, p_signal text)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare
  v_row public.public_assessment_response;
  v_opp jsonb;
begin
  if p_signal not in ('review_clicked','book_a_demo_clicked') then
    raise exception 'invalid engagement signal';
  end if;
  update public.public_assessment_response
     set engagement_signals = coalesce(engagement_signals,'{}'::jsonb) || jsonb_build_object(p_signal, true)
   where response_id = p_response_id
   returning * into v_row;
  if v_row.response_id is null then return; end if;
  v_opp := public.compute_opportunity_score(v_row);
  update public.public_assessment_response
     set opportunity_score = (v_opp->>'score')::int,
         opportunity_factors = v_opp->'factors'
   where response_id = p_response_id;
end;
$function$;
revoke all on function public.record_engagement(uuid, text) from public;
grant execute on function public.record_engagement(uuid, text) to anon;
