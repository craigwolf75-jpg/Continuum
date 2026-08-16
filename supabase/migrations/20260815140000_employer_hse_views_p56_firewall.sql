-- Continuum employer and HSE case views: tighten to the Prompt 56 field set.
-- Governed by Prompt 56 (The Continuum Worker Experience) Doc 3 section 3.2,
-- authorized by Gary on 2026-08-15 as a deliberate override of the Prompt 07
-- section 07.4 field firewall and the client MVP HSE ruling. Append only.
-- No em dashes or en dashes anywhere.
--
-- WHAT CHANGES.
-- Both views drop every clinical field. Prompt 56 prohibits the following on
-- any employer surface, and this migration removes them from both views:
--   body_part, injury_type, severity, prognosis_days, rtw_progress_pct
-- and additionally from hse_case_view:
--   latest_pain_score, latest_mobility_score, last_checkin_at
-- After this change HSE sees exactly the same functional fields as the
-- employer. The prior "HSE also sees pain and mobility" allowance is revoked.
--
-- WHAT STAYS. The functional, non clinical fields the employer legitimately
-- needs to plan return to work: worker identity (their own employee), job
-- title, RTW workflow status, injury date and elapsed days, next review date,
-- current restrictions and their effective date, the tenant RTW obligation
-- frame, and province.
--
-- SECURITY SEMANTICS. These views are reasserted as security_invoker = false
-- (definer), owned by postgres, bypassing base table RLS and self scoping from
-- the JWT claims in the WHERE clause. This matches the original 07.4 design in
-- 20260717160000_role_case_views.sql. The live database had drifted to
-- security_invoker = on, under which these views returned zero rows because the
-- base PHI tables deny the employer and hse roles. This migration corrects that
-- drift so the views function as designed while carrying only functional fields.
--
-- KNOWN FOLLOW UPS, not resolved here (each is a separate decision):
--   1. current_restrictions is free text today. Full Prompt 56 wants plain
--      restriction lines from the approved catalogue, never free text. Kept for
--      the employer operational need until the derived band catalogue exists.
--   2. status still exposes the raw enum, including 'escalated'. Prompt 56 and
--      the Prompt 19 canon require the employer to see a functional status only
--      and never 'escalated' as a clinical signal. Mapping to functional_status
--      needs a defined derivation and is left for a follow up.

begin;

create or replace view public.employer_case_view
with (security_invoker = false) as
select
  i.id                            as injury_id,
  i.tenant_id,
  i.worker_id,
  u.full_name                     as worker_name,
  w.job_title,
  i.status,
  i.date_of_injury,
  greatest(0, (current_date - i.date_of_injury)) as days_injured,
  i.estimated_return_date         as next_review,
  i.current_restrictions,
  i.restrictions_effective_date,
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
  i.status,
  i.date_of_injury,
  greatest(0, (current_date - i.date_of_injury)) as days_injured,
  i.estimated_return_date         as next_review,
  i.current_restrictions,
  i.restrictions_effective_date,
  t.rtw_obligation_frame,
  t.province
from public.injuries i
join public.workers w on w.id = i.worker_id
join public.users u on u.id = w.user_id
join public.tenants t on t.id = i.tenant_id
where i.deleted_at is null
  and public.jwt_role() = 'hse'
  and i.tenant_id = public.jwt_tenant_id();

-- Only authenticated callers may read; the WHERE clause role gates further.
revoke all on public.employer_case_view from public, anon;
revoke all on public.hse_case_view from public, anon;
grant select on public.employer_case_view to authenticated;
grant select on public.hse_case_view to authenticated;

commit;
