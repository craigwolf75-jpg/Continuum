-- Continuum exposure-proof suite (07.10). The release gate.
-- Governed by CONTINUUM_PROMPT_07.md section 07.10. No em-dashes or en-dashes.
--
-- Walks every PHI surface (base tables + role views) as each of the five roles
-- and asserts no role reads a row or field outside its slice of the visibility
-- matrix. Any leak raises and aborts, so CI fails. Run against a database that
-- has the demo seed (Worley tenant, Marcus Bedard case).
--
-- Fixtures (seed):
--   tenant Worley   11111111-1111-1111-1111-111111111111
--   worker Marcus   users b0000000-...0001  worker c0000000-...0001  injury d0000000-...0001
--   hse             b0000000-...0002   employer b0000000-...0003
--   wcb_officer     b0000000-...0004   nexus b0000000-...0005
--   a foreign tenant 22222222-2222-2222-2222-222222222222 (no rows) is used for isolation

set role authenticated;

-- EMPLOYER (Worley): no base PHI, no other-role views, own tenant only.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"employer_admin","user_id":"b0000000-0000-0000-0000-000000000003","tenant_id":"11111111-1111-1111-1111-111111111111"}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK employer: base injuries'; end if;
  if (select count(*) from public.recovery_logs) > 0 then raise exception 'LEAK employer: base recovery_logs'; end if;
  if (select count(*) from public.wcb_notifications) > 0 then raise exception 'LEAK employer: base wcb_notifications'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK employer: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK employer: wcb_officer_view'; end if;
  if (select count(*) from public.employer_case_view where tenant_id <> '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK employer: cross-tenant in employer_case_view'; end if;
end $$;

-- HSE (Worley): no base PHI, no other-role views, own tenant only.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"hse","user_id":"b0000000-0000-0000-0000-000000000002","tenant_id":"11111111-1111-1111-1111-111111111111"}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK hse: base injuries'; end if;
  if (select count(*) from public.recovery_logs) > 0 then raise exception 'LEAK hse: base recovery_logs'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK hse: employer_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK hse: wcb_officer_view'; end if;
  if (select count(*) from public.hse_case_view where tenant_id <> '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK hse: cross-tenant in hse_case_view'; end if;
end $$;

-- WORKER (Marcus): own rows only at base, no dashboards.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"worker","user_id":"b0000000-0000-0000-0000-000000000001","tenant_id":"11111111-1111-1111-1111-111111111111"}', false);
do $$
begin
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK worker: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK worker: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK worker: wcb_officer_view'; end if;
  if (select count(*) from public.injuries where worker_id <> 'c0000000-0000-0000-0000-000000000001') > 0
    then raise exception 'LEAK worker: another worker injury'; end if;
end $$;

-- WCB OFFICER (tenant grant): no base PHI, no employer/hse views, granted tenant only.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"wcb_officer","user_id":"b0000000-0000-0000-0000-000000000004","tenant_id":null}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK wcb_officer: base injuries'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK wcb_officer: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK wcb_officer: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view where tenant_id <> '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK wcb_officer: cross-tenant in wcb_officer_view'; end if;
end $$;

-- NEXUS (injury grant): only the granted injury at base, no dashboards.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"nexus_physician","user_id":"b0000000-0000-0000-0000-000000000005","tenant_id":null}', false);
do $$
begin
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK nexus: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK nexus: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK nexus: wcb_officer_view'; end if;
  if (select count(*) from public.injuries where id <> 'd0000000-0000-0000-0000-000000000001') > 0
    then raise exception 'LEAK nexus: ungranted injury'; end if;
end $$;

-- FOREIGN EMPLOYER (other tenant, no grants): sees nothing.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"employer_admin","user_id":"b0000000-0000-0000-0000-0000000000aa","tenant_id":"22222222-2222-2222-2222-222222222222"}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK foreign employer: base injuries'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK foreign employer: employer_case_view'; end if;
  if (select count(*) from public.tenants where id = '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK foreign employer: another tenant row'; end if;
end $$;

-- OPS ADMIN (site admin): reads the operational views across tenants, but must
-- never reach raw PHI at the base tables or the clinical role views.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"ops_admin","user_id":"a0000000-0000-0000-0000-0000000000ad","tenant_id":null}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK ops_admin: base injuries (diagnosis)'; end if;
  if (select count(*) from public.recovery_logs) > 0 then raise exception 'LEAK ops_admin: base recovery_logs (scores and notes)'; end if;
  if (select count(*) from public.wcb_notifications) > 0 then raise exception 'LEAK ops_admin: base wcb_notifications (payload)'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK ops_admin: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK ops_admin: hse_case_view'; end if;
end $$;

-- FIELD FIREWALL (Prompt 56 Doc 3 section 3.2): the employer and hse views must
-- carry only functional fields. Assert the prohibited clinical columns are
-- absent from both views. Column presence is a schema fact, so this assertion
-- holds regardless of role or seed.
do $$
declare
  forbidden text[] := array[
    'body_part','injury_type','severity','prognosis_days','rtw_progress_pct',
    'latest_pain_score','latest_mobility_score','last_checkin_at'];
  offender text;
begin
  select c.table_name || '.' || c.column_name into offender
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name in ('employer_case_view','hse_case_view')
    and c.column_name = any (forbidden)
  limit 1;
  if offender is not null then
    raise exception 'LEAK field firewall: prohibited clinical column present: %', offender;
  end if;
end $$;

-- PUBLIC ASSESSMENT (Prompt 63 section 6): anon writes only through the
-- SECURITY DEFINER RPC, never directly against the base table.
set role anon;
do $$
begin
  begin
    perform 1 from public.public_assessment_response limit 1;
    raise exception 'LEAK public_assessment: anon can select base table';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='submit_public_assessment') then
    raise exception 'MISSING public.submit_public_assessment';
  end if;
end $$;

-- OPPORTUNITY SCORE (Prompt 63 Step 2D): internal, server side, computed
-- deterministically, never returned to the client. SYNTH fixtures only.
do $$
declare
  v_a public.public_assessment_response;
  v_b public.public_assessment_response;
  v_opp_a jsonb;
  v_opp_b jsonb;
  v_score_a int;
  v_score_b int;
  v_eng_before int;
  v_eng_after int;
begin
  -- SYNTH Employer A: large workforce, high injury volume, many sites, weak
  -- process maturity, reached stage 2. Should score HIGH.
  insert into public.public_assessment_response
    (scoring_model_version, stage_reached, industry, answers, dimension_scores,
     overall_score, band, assessment_confidence, missing_data_rate, exposure, provenance,
     save_source, engagement_signals)
  values
    ('SYNTH-v1', 2, 'SYNTH manufacturing',
     '{}'::jsonb,
     '{"MODIFIED_DUTY":10,"RESTRICTIONS_WORKFLOW":15,"RECOVERY_VISIBILITY":5,"CLAIMS_COORDINATION":10,"WORKFLOW_INTEGRATION":10}'::jsonb,
     40, 'Elevated Risk', 'High', 0.1,
     '{"workforce_size":{"band":"10000_plus","value":12000},"annual_lost_time_cases":{"band":"250_plus","value":260},"site_count":{"band":"21_plus","value":25}}'::jsonb,
     null, 'user_initiated', '{"completed_stage_2":true}'::jsonb)
  returning * into v_a;

  -- SYNTH Employer B: tiny workforce, low injury volume, one site, strong
  -- process maturity, reached stage 1 only. Should score LOW.
  insert into public.public_assessment_response
    (scoring_model_version, stage_reached, industry, answers, dimension_scores,
     overall_score, band, assessment_confidence, missing_data_rate, exposure, provenance,
     save_source, engagement_signals)
  values
    ('SYNTH-v1', 1, 'SYNTH office services',
     '{}'::jsonb,
     '{"MODIFIED_DUTY":85,"RESTRICTIONS_WORKFLOW":80,"RECOVERY_VISIBILITY":90,"CLAIMS_COORDINATION":85,"WORKFLOW_INTEGRATION":90}'::jsonb,
     85, 'Strong', 'High', 0.0,
     '{"workforce_size":{"band":"under_100","value":75},"annual_lost_time_cases":{"band":"under_10","value":3},"site_count":{"band":"one","value":1}}'::jsonb,
     null, null, '{}'::jsonb)
  returning * into v_b;

  v_opp_a := public.compute_opportunity_score(v_a);
  v_opp_b := public.compute_opportunity_score(v_b);
  v_score_a := (v_opp_a->>'score')::int;
  v_score_b := (v_opp_b->>'score')::int;

  if v_score_a is null or v_score_b is null then
    raise exception 'OPPORTUNITY SCORE: expected non null scores for SYNTH A and B';
  end if;
  if v_score_a <= v_score_b + 20 then
    raise exception 'OPPORTUNITY SCORE: SYNTH A (%) not materially higher than SYNTH B (%)', v_score_a, v_score_b;
  end if;

  -- record_engagement raises the engagement factor (and therefore the
  -- score) for SYNTH A.
  v_eng_before := (v_opp_a->'factors'->>'engagement')::int;
  perform public.record_engagement(v_a.response_id, 'book_a_demo_clicked');
  select (opportunity_factors->>'engagement')::int into v_eng_after
    from public.public_assessment_response where response_id = v_a.response_id;
  if v_eng_after is null or v_eng_after <= v_eng_before then
    raise exception 'OPPORTUNITY SCORE: record_engagement did not raise the engagement factor for SYNTH A (before %, after %)', v_eng_before, v_eng_after;
  end if;

  -- an invalid signal is rejected.
  begin
    perform public.record_engagement(v_a.response_id, 'not_a_real_signal');
    raise exception 'OPPORTUNITY SCORE: record_engagement accepted an invalid signal';
  exception when others then
    if sqlerrm <> 'invalid engagement signal' then
      raise;
    end if;
  end;
end $$;

-- opportunity_weights is internal only: anon cannot select it.
set role anon;
do $$
begin
  begin
    perform 1 from public.opportunity_weights limit 1;
    raise exception 'LEAK opportunity_weights: anon can select';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- opportunity_weights is internal only: authenticated cannot select it either.
set role authenticated;
do $$
begin
  begin
    perform 1 from public.opportunity_weights limit 1;
    raise exception 'LEAK opportunity_weights: authenticated can select';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- compute_opportunity_score is an internal helper: anon cannot execute it.
set role anon;
do $$
begin
  begin
    perform public.compute_opportunity_score(null::public.public_assessment_response);
    raise exception 'LEAK compute_opportunity_score: anon can execute';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm like 'LEAK %' then raise; end if;
      raise exception 'compute_opportunity_score anon check: unexpected error %', sqlerrm;
  end;
end $$;
reset role;

-- compute_opportunity_score is an internal helper: authenticated cannot execute it.
set role authenticated;
do $$
begin
  begin
    perform public.compute_opportunity_score(null::public.public_assessment_response);
    raise exception 'LEAK compute_opportunity_score: authenticated can execute';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm like 'LEAK %' then raise; end if;
      raise exception 'compute_opportunity_score authenticated check: unexpected error %', sqlerrm;
  end;
end $$;
reset role;

-- Neither RPC ever returns an opportunity field: submit_public_assessment
-- returns uuid only, record_engagement returns void only. This is a
-- structural guarantee, so assert it against the function signatures
-- themselves, which holds regardless of role or seed.
do $$
declare v_ret text;
begin
  select t.typname into v_ret
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  join pg_type t on t.oid = p.prorettype
  where n.nspname = 'public' and p.proname = 'submit_public_assessment';
  if v_ret is distinct from 'uuid' then
    raise exception 'OPPORTUNITY SCORE: submit_public_assessment return type is %, must stay uuid only (no opportunity field)', v_ret;
  end if;

  select t.typname into v_ret
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  join pg_type t on t.oid = p.prorettype
  where n.nspname = 'public' and p.proname = 'record_engagement';
  if v_ret is distinct from 'void' then
    raise exception 'OPPORTUNITY SCORE: record_engagement return type is %, must stay void only (no opportunity field)', v_ret;
  end if;
end $$;

reset role;
select 'EXPOSURE-PROOF PASS' as result;
