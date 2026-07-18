-- Continuum per-role PHI views (07.4 field firewall).
-- Governed by CONTINUUM_PROMPT_07.md section 07.4. Append only; never edit once
-- applied. No em-dashes or en-dashes anywhere.
--
-- The base PHI tables deny employer_admin, hse and wcb_officer (07.1). These
-- role views are the only way those roles read case data. They are owned by
-- postgres, so they bypass base-table RLS, and they do their OWN scoping from
-- the JWT claims in the WHERE clause: a caller sees only their own tenant, and
-- only if their claimed role matches the view. The forbidden fields are simply
-- not selected, so the firewall is structural, not a filter that could leak.
--
-- employer_case_view: functional fields ONLY. No pain_score, no mobility_score,
--   no diagnosis_notes, no check-in notes, no image_url.
-- hse_case_view: the same, PLUS the latest pain and mobility scores (operational
--   need). Still never diagnosis_notes, notes free text, or image_url.
--
-- Restrictions are abilities/functional data and are shown to both roles.
-- rtw_obligation_frame is surfaced so the dashboard frames the RTW panel.

begin;

create or replace view public.employer_case_view
with (security_invoker = false) as
select
  i.id                            as injury_id,
  i.tenant_id,
  i.worker_id,
  u.full_name                     as worker_name,
  w.job_title,
  i.body_part,
  i.injury_type,
  i.severity,
  i.status,
  i.date_of_injury,
  greatest(0, (current_date - i.date_of_injury)) as days_injured,
  i.prognosis_days,
  i.estimated_return_date         as next_review,
  i.current_restrictions,
  i.restrictions_effective_date,
  case
    when i.prognosis_days is null or i.prognosis_days = 0 then null
    else least(100, round((current_date - i.date_of_injury)::numeric / i.prognosis_days * 100, 0))
  end                             as rtw_progress_pct,
  t.rtw_obligation_frame,
  t.province
from public.injuries i
join public.workers w on w.id = i.worker_id
join public.users u on u.id = w.user_id
join public.tenants t on t.id = i.tenant_id
where i.deleted_at is null
  and public.jwt_role() = 'employer_admin'
  and i.tenant_id = public.jwt_tenant_id();

create or replace view public.hse_case_view
with (security_invoker = false) as
select
  i.id                            as injury_id,
  i.tenant_id,
  i.worker_id,
  u.full_name                     as worker_name,
  w.job_title,
  i.body_part,
  i.injury_type,
  i.severity,
  i.status,
  i.date_of_injury,
  greatest(0, (current_date - i.date_of_injury)) as days_injured,
  i.prognosis_days,
  i.estimated_return_date         as next_review,
  i.current_restrictions,
  i.restrictions_effective_date,
  case
    when i.prognosis_days is null or i.prognosis_days = 0 then null
    else least(100, round((current_date - i.date_of_injury)::numeric / i.prognosis_days * 100, 0))
  end                             as rtw_progress_pct,
  t.rtw_obligation_frame,
  t.province,
  latest.pain_score               as latest_pain_score,
  latest.mobility_score           as latest_mobility_score,
  latest.logged_at                as last_checkin_at
from public.injuries i
join public.workers w on w.id = i.worker_id
join public.users u on u.id = w.user_id
join public.tenants t on t.id = i.tenant_id
left join lateral (
  select rl.pain_score, rl.mobility_score, rl.logged_at
  from public.recovery_logs rl
  where rl.injury_id = i.id and rl.deleted_at is null
  order by rl.logged_at desc
  limit 1
) latest on true
where i.deleted_at is null
  and public.jwt_role() = 'hse'
  and i.tenant_id = public.jwt_tenant_id();

-- Only authenticated callers may read; the WHERE clause role-gates further.
revoke all on public.employer_case_view from public, anon;
revoke all on public.hse_case_view from public, anon;
grant select on public.employer_case_view to authenticated;
grant select on public.hse_case_view to authenticated;

commit;
