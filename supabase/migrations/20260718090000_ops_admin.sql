-- Continuum operations admin (site admin, no raw PHI). Append only; never edit
-- once applied. No em-dashes or en-dashes anywhere.
--
-- Adds an ops_admin role and a set of cross-tenant OPERATIONAL views. ops_admin
-- reads case status, WCB lifecycle, audit, and metrics across every tenant, but
-- is still DENIED at the base PHI tables (no policy grants it), so diagnosis
-- notes, check-in free text, and raw pain/mobility scores are never in reach.
-- The clinical firewall stays intact; this is a platform operator surface.

alter type public.user_role add value if not exists 'ops_admin';

begin;

-- All tenants.
create or replace view public.ops_tenants_view with (security_invoker = false) as
select t.id, t.name, t.province, t.wcb_account_number, t.rtw_obligation_frame, t.status, t.created_at
from public.tenants t
where t.deleted_at is null and public.jwt_role() = 'ops_admin';

-- All cases, functional fields only. No diagnosis_notes, no scores, no notes.
create or replace view public.ops_cases_view with (security_invoker = false) as
select
  i.id                            as injury_id,
  i.tenant_id,
  t.name                          as tenant_name,
  t.province,
  u.full_name                     as worker_name,
  w.job_title,
  i.body_part,
  i.injury_type,
  i.severity,
  i.status,
  i.prior_status,
  i.date_of_injury,
  greatest(0, (current_date - i.date_of_injury)) as days_injured,
  i.prognosis_days,
  i.estimated_return_date,
  i.current_restrictions,
  i.nexus_case_ref
from public.injuries i
join public.workers w on w.id = i.worker_id
join public.users u on u.id = w.user_id
join public.tenants t on t.id = i.tenant_id
where i.deleted_at is null and public.jwt_role() = 'ops_admin';

-- All WCB lifecycle rows. No payload (that carries free text and the SIN mask).
create or replace view public.ops_wcb_view with (security_invoker = false) as
select
  wn.id                    as notification_id,
  wn.tenant_id,
  t.name                   as tenant_name,
  wn.injury_id,
  wn.type,
  wn.status,
  wn.form_code,
  wn.form_name,
  wn.deadline_text,
  wn.deadline_at,
  wn.wcb_claim_number,
  wn.sent_timestamp,
  wn.generated_at,
  wn.submitted_at,
  wn.acknowledged_at
from public.wcb_notifications wn
join public.tenants t on t.id = wn.tenant_id
where wn.deleted_at is null and public.jwt_role() = 'ops_admin';

-- All audit rows across tenants (operational metadata; no clinical content).
create or replace view public.ops_audit_view with (security_invoker = false) as
select a.id, a.occurred_at, a.tenant_id, a.actor_id, a.action, a.entity, a.entity_id, a.ip_device
from public.audit_log a
where public.jwt_role() = 'ops_admin';

-- All instrumentation metrics across tenants.
create or replace view public.ops_metrics_view with (security_invoker = false) as
select cm.id, cm.tenant_id, cm.injury_id, cm.metric, cm.value, cm.computed_at
from public.case_metrics cm
where public.jwt_role() = 'ops_admin';

revoke all on public.ops_tenants_view, public.ops_cases_view, public.ops_wcb_view,
  public.ops_audit_view, public.ops_metrics_view from public, anon;
grant select on public.ops_tenants_view, public.ops_cases_view, public.ops_wcb_view,
  public.ops_audit_view, public.ops_metrics_view to authenticated;

commit;
