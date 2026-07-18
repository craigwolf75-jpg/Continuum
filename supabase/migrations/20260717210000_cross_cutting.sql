-- Continuum cross-cutting concerns (07.10): consent gate, audit interceptor,
-- notifications. Governed by CONTINUUM_PROMPT_07.md section 07.10. Append only;
-- never edit once applied. No em-dashes or en-dashes anywhere.

begin;

-- ============================================================
-- Consent gate: block collection (check-in inserts) unless the worker has a
-- current, non-revoked consent. Revocation takes effect immediately because it
-- sets revoked_at and this trigger reads it live.
-- ============================================================
create or replace function public.enforce_consent()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
begin
  select w.user_id into v_user
  from public.injuries i
  join public.workers w on w.id = i.worker_id
  where i.id = new.injury_id;

  if not exists (
    select 1 from public.consents c
    where c.user_id = v_user
      and c.deleted_at is null
      and c.revoked_at is null
  ) then
    raise exception 'CONTINUUM_NO_CONSENT: collection blocked; no active consent for worker';
  end if;
  return new;
end;
$$;

create trigger trg_recovery_logs_consent before insert on public.recovery_logs
  for each row execute function public.enforce_consent();

-- Admin view: the active consent version per worker (checkable per 07.10).
create or replace view public.active_consent_view with (security_invoker = false) as
select
  c.user_id,
  u.full_name as worker_name,
  c.tenant_id,
  c.version,
  c.granted_at,
  c.revoked_at,
  (c.revoked_at is null) as active
from public.consents c
join public.users u on u.id = c.user_id
where c.deleted_at is null
  and public.jwt_role() = 'employer_admin'
  and c.tenant_id = public.jwt_tenant_id();
revoke all on public.active_consent_view from public, anon;
grant select on public.active_consent_view to authenticated;

-- ============================================================
-- Audit interceptor: a helper the PHI edge endpoints call to log a read. Writes
-- and status changes are already covered by triggers and the status machine.
-- audit_log is append only (07.1 immutability trigger). This records the actor
-- from the JWT plus the ip and device the endpoint passes.
-- ============================================================
create or replace function public.record_audit(
  p_action text,
  p_entity text,
  p_entity_id uuid,
  p_ip_device text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (tenant_id, actor_id, action, entity, entity_id, ip_device)
  values (public.jwt_tenant_id(), public.jwt_user_id(), p_action, p_entity, p_entity_id, p_ip_device);
end;
$$;
revoke execute on function public.record_audit(text, text, uuid, text) from public, anon;
grant execute on function public.record_audit(text, text, uuid, text) to authenticated;

-- Admin audit view: employer_admin reads their tenant's audit trail.
create or replace view public.audit_admin_view with (security_invoker = false) as
select a.id, a.occurred_at, a.actor_id, a.action, a.entity, a.entity_id, a.ip_device
from public.audit_log a
where public.jwt_role() = 'employer_admin'
  and a.tenant_id = public.jwt_tenant_id();
revoke all on public.audit_admin_view from public, anon;
grant select on public.audit_admin_view to authenticated;

-- ============================================================
-- Notifications: one record of every send. The Notifications service (SMS via
-- the SmsProvider interface, plus push) writes here. Twilio and the reminder
-- scheduler are seams; escalation alerts are wired now.
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id),
  user_id uuid references public.users (id),
  injury_id uuid references public.injuries (id),
  channel text not null check (channel in ('sms', 'push')),
  kind text not null check (kind in ('reminder', 'escalation', 'case_event')),
  body text,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id);
create index idx_notifications_injury on public.notifications (injury_id);
alter table public.notifications enable row level security;

-- A user reads their own notifications; employer_admin reads within tenant.
create policy notifications_select on public.notifications
  for select to authenticated
  using (
    user_id = public.jwt_user_id()
    or (public.jwt_role() = 'employer_admin' and tenant_id = public.jwt_tenant_id())
  );

commit;
