-- Continuum status machine (07.5), database-enforced core.
-- Governed by CONTINUUM_PROMPT_07.md section 07.5. Append only; never edit once
-- applied. No em-dashes or en-dashes anywhere.
--
-- No status column is ever updated except through advance_injury_status().
-- A block trigger rejects any direct status change that did not come through
-- the function (signalled by a transaction-local GUC the function sets).
--
-- Built here: status_transitions is already seeded (07.1). This migration adds
-- the auto_actions queue, advance_injury_status(), the enqueue helper (auto
-- actions + case_metrics), and the block trigger.
--
-- Deferred (runtime layer, next step): the edge-function endpoints
-- POST /v1/injuries/{id}/clearance and /reassess, and the async worker that
-- consumes auto_actions. The DB core below is the enforcement boundary they
-- call into.

begin;

-- ------------------------------------------------------------
-- Auto-actions queue. Written by the machine, consumed by the worker
-- (service_role). RLS on, no authenticated policies: service_role only.
-- ------------------------------------------------------------
create table public.auto_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id),
  injury_id uuid not null references public.injuries (id),
  from_status public.injury_status,
  to_status public.injury_status not null,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index idx_auto_actions_injury on public.auto_actions (injury_id);
create index idx_auto_actions_status on public.auto_actions (status) where status = 'pending';
alter table public.auto_actions enable row level security;

-- ------------------------------------------------------------
-- Block trigger: reject direct status changes not routed through the function.
-- ------------------------------------------------------------
create or replace function public.injuries_block_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('continuum.allow_status_change', true), '0') <> '1' then
    raise exception 'CONTINUUM_DIRECT_STATUS_UPDATE_BLOCKED: status changes must go through advance_injury_status()';
  end if;
  return new;
end;
$$;

create trigger trg_injuries_block_status before update on public.injuries
  for each row execute function public.injuries_block_status_change();

-- ------------------------------------------------------------
-- Enqueue auto actions + case_metrics for a completed transition.
-- p_prev_updated is the injury's updated_at BEFORE this transition, used to
-- measure time spent in the exited status.
-- ------------------------------------------------------------
create or replace function public.enqueue_auto_actions(
  p_injury public.injuries,
  p_from public.injury_status,
  p_to public.injury_status,
  p_prev_updated timestamptz
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_to = 'off_work' then
    insert into public.auto_actions (tenant_id, injury_id, from_status, to_status, action_type) values
      (p_injury.tenant_id, p_injury.id, p_from, p_to, 'wcb_initial_notification'),
      (p_injury.tenant_id, p_injury.id, p_from, p_to, 'surface_on_employer_dashboard');
  elsif p_to = 'light_duty' then
    insert into public.auto_actions (tenant_id, injury_id, from_status, to_status, action_type) values
      (p_injury.tenant_id, p_injury.id, p_from, p_to, 'publish_restrictions'),
      (p_injury.tenant_id, p_injury.id, p_from, p_to, 'wcb_light_duty_notification');
  elsif p_to = 'full_duty_pending' then
    insert into public.auto_actions (tenant_id, injury_id, from_status, to_status, action_type) values
      (p_injury.tenant_id, p_injury.id, p_from, p_to, 'generate_ffw_form');
  elsif p_to = 'signed_off' then
    insert into public.auto_actions (tenant_id, injury_id, from_status, to_status, action_type) values
      (p_injury.tenant_id, p_injury.id, p_from, p_to, 'wcb_full_duty_notification'),
      (p_injury.tenant_id, p_injury.id, p_from, p_to, 'close_case');
  end if;

  -- days spent in the exited status
  insert into public.case_metrics (tenant_id, injury_id, metric, value)
    values (p_injury.tenant_id, p_injury.id, 'days_in_status',
            round(extract(epoch from (now() - p_prev_updated)) / 86400.0, 2));

  -- return-to-work duration on close
  if p_to = 'signed_off' and p_injury.date_of_injury is not null then
    insert into public.case_metrics (tenant_id, injury_id, metric, value)
      values (p_injury.tenant_id, p_injury.id, 'days_to_rtw',
              (current_date - p_injury.date_of_injury));
  end if;
end;
$$;

-- ------------------------------------------------------------
-- The single guarded transition function.
-- User-driven calls (a user JWT is present) derive the actor from the claim
-- and are authorized against the caller's access to the injury. System-driven
-- calls (no user claim; service_role or the check-in flow) pass p_actor.
-- ------------------------------------------------------------
create or replace function public.advance_injury_status(
  p_injury_id uuid,
  p_to_status public.injury_status,
  p_actor text default null
) returns public.injuries
language plpgsql security definer set search_path = public as $$
declare
  v_injury public.injuries;
  v_from public.injury_status;
  v_target public.injury_status;
  v_actor text;
  v_user_driven boolean;
  v_jwt_role text;
  v_prev_updated timestamptz;
  v_rule public.status_transitions;
  v_active public.injury_status[] := array['reported', 'off_work', 'light_duty', 'full_duty_pending']::public.injury_status[];
begin
  -- Resolve actor. A user JWT wins and cannot be overridden by p_actor.
  v_jwt_role := nullif(public.jwt_role(), '');
  if v_jwt_role is not null then
    v_actor := v_jwt_role;
    v_user_driven := true;
  else
    if p_actor is null or p_actor = '' then
      raise exception 'CONTINUUM_NO_ACTOR: caller role could not be determined';
    end if;
    v_actor := p_actor;
    v_user_driven := false;
  end if;

  select * into v_injury from public.injuries
    where id = p_injury_id and deleted_at is null for update;
  if not found then
    raise exception 'CONTINUUM_INJURY_NOT_FOUND: %', p_injury_id;
  end if;
  v_from := v_injury.status;
  v_prev_updated := v_injury.updated_at;

  -- Authorization for user-driven callers: only the granted nexus and the
  -- injury's own employer_admin may drive the machine.
  if v_user_driven then
    if v_actor = 'nexus_physician' then
      if not public.continuum_has_grant(v_injury.tenant_id, v_injury.id) then
        raise exception 'CONTINUUM_ACCESS_DENIED: no grant for injury %', p_injury_id;
      end if;
    elsif v_actor = 'employer_admin' then
      if v_injury.tenant_id is distinct from public.jwt_tenant_id() then
        raise exception 'CONTINUUM_ACCESS_DENIED: injury % not in caller tenant', p_injury_id;
      end if;
    else
      raise exception 'CONTINUUM_ROLE_DENIED: % may not advance status', v_actor;
    end if;
  end if;

  -- Resolve and validate the transition.
  if p_to_status = 'escalated' then
    if not (v_from = any (v_active)) then
      raise exception 'CONTINUUM_INVALID_TRANSITION: cannot escalate from %', v_from;
    end if;
    if v_actor <> 'system' then
      raise exception 'CONTINUUM_ROLE_DENIED: % may not escalate (system only)', v_actor;
    end if;
    v_target := 'escalated';
  elsif v_from = 'escalated' then
    if v_actor <> 'nexus_physician' then
      raise exception 'CONTINUUM_ROLE_DENIED: % may not reassess (nexus_physician only)', v_actor;
    end if;
    if v_injury.prior_status is null then
      raise exception 'CONTINUUM_NO_PRIOR_STATUS: injury % has no prior status', p_injury_id;
    end if;
    if p_to_status <> v_injury.prior_status then
      raise exception 'CONTINUUM_INVALID_TRANSITION: reassess must return to prior status % not %', v_injury.prior_status, p_to_status;
    end if;
    v_target := v_injury.prior_status;
  else
    select * into v_rule from public.status_transitions
      where from_state = v_from and to_state = p_to_status limit 1;
    if not found then
      raise exception 'CONTINUUM_INVALID_TRANSITION: % to % is not allowed', v_from, p_to_status;
    end if;
    if v_rule.actor <> v_actor then
      raise exception 'CONTINUUM_ROLE_DENIED: % may not perform % to % (requires %)', v_actor, v_from, p_to_status, v_rule.actor;
    end if;
    v_target := p_to_status;
  end if;

  -- Apply, guarded by the transaction-local flag the block trigger checks.
  perform set_config('continuum.allow_status_change', '1', true);
  if v_target = 'escalated' then
    update public.injuries set status = 'escalated', prior_status = v_from
      where id = p_injury_id returning * into v_injury;
  elsif v_from = 'escalated' then
    update public.injuries set status = v_target, prior_status = null
      where id = p_injury_id returning * into v_injury;
  else
    update public.injuries set status = v_target
      where id = p_injury_id returning * into v_injury;
  end if;
  perform set_config('continuum.allow_status_change', '0', true);

  -- Append-only audit.
  insert into public.audit_log (tenant_id, actor_id, action, entity, entity_id)
    values (v_injury.tenant_id, public.jwt_user_id(),
            'status:' || v_from::text || '->' || v_target::text || ' by ' || v_actor,
            'injuries', v_injury.id);

  perform public.enqueue_auto_actions(v_injury, v_from, v_target, v_prev_updated);

  return v_injury;
end;
$$;

-- Only the transition function is callable by authenticated users; the helpers
-- and trigger function are internal.
revoke execute on function public.advance_injury_status(uuid, public.injury_status, text) from public, anon;
grant execute on function public.advance_injury_status(uuid, public.injury_status, text) to authenticated;
revoke execute on function public.enqueue_auto_actions(public.injuries, public.injury_status, public.injury_status, timestamptz) from public, anon, authenticated;
revoke execute on function public.injuries_block_status_change() from public, anon, authenticated;

commit;
