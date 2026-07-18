-- Continuum WCB notification module (07.8), database layer.
-- Governed by CONTINUUM_PROMPT_07.md section 07.8. Append only; never edit once
-- applied. No em-dashes or en-dashes anywhere.
--
-- There is NO public WCB claims API in any province. This module generates
-- documents and tracks a submission lifecycle a human drives through the
-- payer's existing channel. Nothing here submits anywhere.
--
-- This migration adds: deadline_hours to province_form_codes (for the
-- countdown), lifecycle and document columns on wcb_notifications, the
-- submit/acknowledge lifecycle function, the read-only WCB officer view, and a
-- private storage bucket for generated documents.

begin;

-- Numeric deadline for the countdown. Prose stays in deadline_text. MVP is ab;
-- other provinces left null until their document packages are built.
alter table public.province_form_codes add column if not exists deadline_hours integer;
update public.province_form_codes set deadline_hours = 72  where province = 'ab' and party = 'employer';
update public.province_form_codes set deadline_hours = 48  where province = 'ab' and party = 'physician';
update public.province_form_codes set deadline_hours = 72  where province = 'bc' and party = 'employer';
update public.province_form_codes set deadline_hours = 120 where province = 'sk' and party = 'employer';

-- Lifecycle timestamps and document metadata on the notification.
alter table public.wcb_notifications
  add column if not exists form_code text,
  add column if not exists form_name text,
  add column if not exists deadline_text text,
  add column if not exists deadline_at timestamptz,
  add column if not exists document_url text,
  add column if not exists fieldset_version text,
  add column if not exists generated_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists acknowledged_at timestamptz;

-- Lifecycle transition: user-driven submit and acknowledge (employer_admin in
-- tenant, or the granted nexus), plus a failed path. Generation (pending to
-- generated) is done by the generator with the service role. Every change is
-- audited.
create or replace function public.wcb_advance_notification(
  p_notification_id uuid,
  p_to_status text,
  p_claim_number text default null
) returns public.wcb_notifications
language plpgsql security definer set search_path = public as $$
declare
  v_n public.wcb_notifications;
  v_role text;
  v_user_driven boolean;
begin
  v_role := nullif(public.jwt_role(), '');
  v_user_driven := v_role is not null;

  select * into v_n from public.wcb_notifications
    where id = p_notification_id and deleted_at is null for update;
  if not found then
    raise exception 'CONTINUUM_WCB_NOT_FOUND: %', p_notification_id;
  end if;

  if v_user_driven then
    if v_role = 'employer_admin' then
      if v_n.tenant_id is distinct from public.jwt_tenant_id() then
        raise exception 'CONTINUUM_ACCESS_DENIED: notification not in caller tenant';
      end if;
    elsif v_role = 'nexus_physician' then
      if not public.continuum_has_grant(v_n.tenant_id, v_n.injury_id) then
        raise exception 'CONTINUUM_ACCESS_DENIED: no grant for this notification';
      end if;
    else
      raise exception 'CONTINUUM_ROLE_DENIED: % may not change WCB status', v_role;
    end if;
  end if;

  if p_to_status = 'submitted' then
    if v_n.status <> 'generated' then
      raise exception 'CONTINUUM_INVALID_WCB_TRANSITION: % to submitted', v_n.status;
    end if;
    update public.wcb_notifications
      set status = 'submitted', submitted_at = now(),
          wcb_claim_number = coalesce(p_claim_number, wcb_claim_number)
      where id = p_notification_id returning * into v_n;
  elsif p_to_status = 'acknowledged' then
    if v_n.status <> 'submitted' then
      raise exception 'CONTINUUM_INVALID_WCB_TRANSITION: % to acknowledged', v_n.status;
    end if;
    update public.wcb_notifications
      set status = 'acknowledged', acknowledged_at = now()
      where id = p_notification_id returning * into v_n;
  elsif p_to_status = 'failed' then
    update public.wcb_notifications set status = 'failed'
      where id = p_notification_id returning * into v_n;
  else
    raise exception 'CONTINUUM_INVALID_WCB_TARGET: %', p_to_status;
  end if;

  insert into public.audit_log (tenant_id, actor_id, action, entity, entity_id)
    values (v_n.tenant_id, public.jwt_user_id(),
            'wcb:' || v_n.type || '->' || p_to_status || coalesce(' claim ' || p_claim_number, ''),
            'wcb_notifications', v_n.id);

  return v_n;
end;
$$;
revoke execute on function public.wcb_advance_notification(uuid, text, text) from public, anon;
grant execute on function public.wcb_advance_notification(uuid, text, text) to authenticated;

-- Read-only WCB officer view. Gated by access_grants (the officer holds a
-- tenant grant). Scores visible per the matrix; NO diagnosis notes, NO free
-- text (the payload is not exposed), no edit path.
create or replace view public.wcb_officer_view with (security_invoker = false) as
select
  wn.id                    as notification_id,
  wn.injury_id,
  wn.tenant_id,
  u.full_name              as worker_name,
  i.body_part,
  i.injury_type,
  i.status                 as injury_status,
  i.date_of_injury,
  wn.type                  as notification_type,
  wn.status                as notification_status,
  wn.form_code,
  wn.form_name,
  wn.deadline_text,
  wn.deadline_at,
  case when wn.deadline_at is null then null
       else round(extract(epoch from (wn.deadline_at - now())) / 3600.0, 1)
  end                      as hours_remaining,
  wn.wcb_claim_number,
  wn.sent_timestamp,
  wn.generated_at,
  wn.submitted_at,
  wn.acknowledged_at,
  latest.pain_score        as latest_pain_score,
  latest.mobility_score    as latest_mobility_score
from public.wcb_notifications wn
join public.injuries i on i.id = wn.injury_id
join public.workers w on w.id = i.worker_id
join public.users u on u.id = w.user_id
left join lateral (
  select rl.pain_score, rl.mobility_score
  from public.recovery_logs rl
  where rl.injury_id = i.id and rl.deleted_at is null
  order by rl.logged_at desc limit 1
) latest on true
where wn.deleted_at is null
  and public.jwt_role() = 'wcb_officer'
  and public.continuum_has_grant(wn.tenant_id, wn.injury_id);
revoke all on public.wcb_officer_view from public, anon;
grant select on public.wcb_officer_view to authenticated;

-- Private bucket for generated WCB documents (FFW PDFs). Signed-URL access only.
insert into storage.buckets (id, name, public)
  values ('wcb-documents', 'wcb-documents', false)
on conflict (id) do nothing;

commit;
