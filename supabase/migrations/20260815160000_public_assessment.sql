-- Continuum public assessment (Step 1, Prompt 63 section 6). Append only;
-- never edit once applied. No em dashes or en dashes anywhere.
--
-- Storage for the anonymous public risk assessment. Mechanism: an anon
-- callable SECURITY DEFINER RPC, matching the proven pattern this project
-- already uses for anonymous public writes (framer_demo_* and
-- validate_and_log_access). Data stored is anonymous and organization level:
-- no name, email, company, IP, or user agent, and no personal or health
-- information.

create table if not exists public.public_assessment_response (
  response_id            uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  scoring_model_version   text not null,
  stage_reached           int  not null check (stage_reached in (1, 2)),
  industry                text,                    -- classification only
  answers                 jsonb not null,          -- { questionId: optionKey }
  dimension_scores        jsonb not null,          -- { DIMENSION: int|null }
  overall_score           int check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  band                    text,
  assessment_confidence   text,                    -- High | Moderate | Limited
  missing_data_rate       numeric,
  exposure                jsonb,                   -- bands only
  provenance              jsonb                    -- per field provenance
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
