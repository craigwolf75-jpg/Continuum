-- Continuum worker RPCs (SB-002). Append only; never edit once applied.
-- owns_case joins worker.worker_account.clinical_worker_id to
-- clinical.wcb_case.worker_id. Grants match the satellite: authenticated
-- execute on worker-facing RPCs only. No em dashes or en dashes.

begin;

create or replace function worker.owns_case(p_case uuid)
returns boolean
language sql
stable
security definer
set search_path = worker, public
as $$
  select exists (
    select 1
    from worker.worker_account wa
    join clinical.wcb_case cf on cf.worker_id = wa.clinical_worker_id
    where wa.auth_user_id = auth.uid()
      and cf.id = p_case
  )
$$;

create or replace function worker.wlog(p_case uuid, p_action text, p_detail jsonb)
returns void
language plpgsql
security definer
set search_path = worker, public
as $$
begin
  insert into worker.audit_log (worker_account_id, case_id, action, detail)
  values (
    worker.current_account_id(),
    p_case,
    p_action,
    coalesce(p_detail, '{}'::jsonb)
  );
end;
$$;

create or replace function worker.my_cases()
returns jsonb
language sql
stable
security definer
set search_path = worker, public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'case_id', cf.id,
        'claim_number', cf.claim_number,
        'date_of_injury', cf.date_of_injury,
        'pathways', (
          select coalesce(array_agg(cp.pathway_type::text), '{}')
          from worker.case_pathway cp
          where cp.case_id = cf.id
            and cp.active
        )
      )
    ),
    '[]'::jsonb
  )
  from worker.worker_account wa
  join clinical.wcb_case cf on cf.worker_id = wa.clinical_worker_id
  where wa.auth_user_id = auth.uid()
$$;

create or replace function worker.my_plan(p_case uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = worker, public
as $$
declare
  v jsonb;
begin
  if not worker.owns_case(p_case) then
    raise exception 'not your case';
  end if;
  select jsonb_build_object(
    'claim_number', cf.claim_number,
    'date_of_injury', cf.date_of_injury,
    'safe_duties', coalesce(ewv.safe_duties, '{}'),
    'conditional_duties', coalesce(ewv.conditional_duties, '{}'),
    'excluded_duties', coalesce(ewv.excluded_duties, '{}'),
    'next_reassessment', ewv.next_reassessment
  )
  into v
  from clinical.wcb_case cf
  left join worker.employer_worker_view ewv on ewv.case_id = cf.id
  where cf.id = p_case;
  return v;
end;
$$;

create or replace function worker.my_employer_view(p_case uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = worker, public
as $$
begin
  if not worker.owns_case(p_case) then
    raise exception 'not your case';
  end if;
  return (
    select to_jsonb(ewv)
    from worker.employer_worker_view ewv
    where ewv.case_id = p_case
  );
end;
$$;

create or replace function worker.my_consents(p_case uuid)
returns jsonb
language sql
stable
security definer
set search_path = worker, public
as $$
  select coalesce(
    jsonb_object_agg(
      c.kind,
      jsonb_build_object(
        'granted', c.granted,
        'revoked', c.revoked_at is not null,
        'at', c.occurred_at
      )
    ),
    '{}'::jsonb
  )
  from worker.consent c
  join worker.worker_account wa on wa.id = c.worker_account_id
  where wa.auth_user_id = auth.uid()
    and c.case_id = p_case
$$;

create or replace function worker.my_progress(p_case uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = worker, public
as $$
begin
  if not worker.owns_case(p_case) then
    raise exception 'not your case';
  end if;
  return jsonb_build_object(
    'check_ins', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'occurred_at', ci.occurred_at,
            'pain', ci.reported_pain,
            'hours_approved', ci.hours_approved,
            'hours_worked', ci.hours_worked
          )
          order by ci.occurred_at
        ),
        '[]'::jsonb
      )
      from worker.check_in ci
      where ci.case_id = p_case
        and ci.worker_account_id = worker.current_account_id()
    ),
    'movements', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'axis_label', mo.axis_label,
            'angle', mo.angle_degrees,
            'at', mo.captured_at
          )
          order by mo.captured_at
        ),
        '[]'::jsonb
      )
      from worker.movement_observation mo
      where mo.case_id = p_case
        and mo.worker_account_id = worker.current_account_id()
    )
  );
end;
$$;

create or replace function worker.set_consent(
  p_case uuid,
  p_kind worker.consent_kind,
  p_granted boolean,
  p_text_version text
)
returns void
language plpgsql
security definer
set search_path = worker, public
as $$
declare
  v_acct uuid := worker.current_account_id();
begin
  if v_acct is null then
    raise exception 'no worker account for caller';
  end if;
  if not worker.owns_case(p_case) then
    raise exception 'not your case';
  end if;
  insert into worker.consent (
    worker_account_id, case_id, kind, granted, text_version, occurred_at, revoked_at
  )
  values (
    v_acct,
    p_case,
    p_kind,
    p_granted,
    p_text_version,
    now(),
    case when p_granted then null else now() end
  )
  on conflict (worker_account_id, case_id, kind) do update
    set granted = excluded.granted,
        occurred_at = now(),
        text_version = excluded.text_version,
        revoked_at = case when excluded.granted then null else now() end;
  perform worker.wlog(
    p_case,
    case when p_granted then 'CONSENT_GRANTED' else 'CONSENT_REVOKED' end,
    jsonb_build_object('kind', p_kind)
  );
end;
$$;

create or replace function worker.submit_check_in(
  p_case uuid,
  p_pathway worker.pathway_type,
  p_pain smallint,
  p_hours_approved numeric,
  p_hours_worked numeric,
  p_answers jsonb,
  p_private_note text,
  p_operational text[]
)
returns uuid
language plpgsql
security definer
set search_path = worker, public
as $$
declare
  v_acct uuid := worker.current_account_id();
  v_ci uuid;
  v_share boolean;
  a jsonb;
  c text;
begin
  if v_acct is null then
    raise exception 'no worker account for caller';
  end if;
  if not worker.owns_case(p_case) then
    raise exception 'not your case';
  end if;
  insert into worker.check_in (
    case_id, worker_account_id, pathway_type, reported_pain, hours_approved, hours_worked
  )
  values (p_case, v_acct, p_pathway, p_pain, p_hours_approved, p_hours_worked)
  returning id into v_ci;
  if p_answers is not null then
    for a in select * from jsonb_array_elements(p_answers) loop
      insert into worker.check_in_answer (
        check_in_id, duty_ref, performed, made_worse, worsened_note, settled_by_end
      )
      values (
        v_ci,
        a->>'duty_ref',
        (a->>'performed')::boolean,
        (a->>'made_worse')::boolean,
        a->>'worsened_note',
        (a->>'settled_by_end')::boolean
      );
    end loop;
  end if;
  if coalesce(p_private_note, '') <> '' then
    insert into worker.private_comment (check_in_id, worker_account_id, body)
    values (v_ci, v_acct, p_private_note);
  end if;
  select exists (
    select 1
    from worker.consent c2
    where c2.worker_account_id = v_acct
      and c2.case_id = p_case
      and c2.kind = 'w2_employer_disclosure'
      and c2.granted
      and c2.revoked_at is null
  ) into v_share;
  if p_operational is not null then
    foreach c in array p_operational loop
      insert into worker.operational_signal (case_id, code, released)
      values (p_case, c::worker.operational_code, v_share);
    end loop;
  end if;
  perform worker.wlog(
    p_case,
    'CHECK_IN_SUBMITTED',
    jsonb_build_object('check_in', v_ci, 'operational_released', v_share)
  );
  return v_ci;
end;
$$;

create or replace function worker.set_companion(p_character text, p_name text, p_mode text)
returns void
language plpgsql
security definer
set search_path = worker, public
as $$
declare
  v_acct uuid := worker.current_account_id();
begin
  if v_acct is null then
    raise exception 'no worker account for caller';
  end if;
  update worker.worker_account
    set companion_character = coalesce(p_character, companion_character)
    where id = v_acct;
  insert into worker.companion_memory (worker_account_id, tier, data)
  values (
    v_acct,
    'durable',
    jsonb_strip_nulls(jsonb_build_object('name', p_name, 'mode', p_mode))
  )
  on conflict (worker_account_id, tier) do update
    set data = worker.companion_memory.data
      || jsonb_strip_nulls(jsonb_build_object('name', p_name, 'mode', p_mode)),
        updated_at = now();
end;
$$;

create or replace function worker.record_movement(p_case uuid, p_axis text, p_angle numeric)
returns uuid
language plpgsql
security definer
set search_path = worker, public
as $$
declare
  v_acct uuid := worker.current_account_id();
  v_flag boolean;
  v_consent boolean;
  v_id uuid;
begin
  if v_acct is null then
    raise exception 'no worker account for caller';
  end if;
  if not worker.owns_case(p_case) then
    raise exception 'not your case';
  end if;
  select enabled into v_flag
  from worker.deployment_flag
  where flag = 'MOTION_PRODUCTION_RELEASE';
  if not coalesce(v_flag, false) then
    raise exception 'the movement check is not enabled in this deployment';
  end if;
  select exists (
    select 1
    from worker.consent c
    where c.worker_account_id = v_acct
      and c.case_id = p_case
      and c.kind = 'w5_motion_camera'
      and c.granted
      and c.revoked_at is null
  ) into v_consent;
  if not v_consent then
    raise exception 'camera consent has not been granted';
  end if;
  insert into worker.movement_observation (
    worker_account_id, case_id, axis_label, angle_degrees
  )
  values (v_acct, p_case, p_axis, p_angle)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function worker.first_run_complete()
returns void
language plpgsql
security definer
set search_path = worker, public
as $$
begin
  update worker.worker_account
    set first_run_done = true
    where id = worker.current_account_id();
end;
$$;

revoke execute on function
  worker.owns_case(uuid),
  worker.wlog(uuid, text, jsonb),
  worker.my_cases(),
  worker.my_plan(uuid),
  worker.my_employer_view(uuid),
  worker.my_consents(uuid),
  worker.my_progress(uuid),
  worker.set_consent(uuid, worker.consent_kind, boolean, text),
  worker.submit_check_in(uuid, worker.pathway_type, smallint, numeric, numeric, jsonb, text, text[]),
  worker.set_companion(text, text, text),
  worker.record_movement(uuid, text, numeric),
  worker.first_run_complete()
from public, anon, authenticated;

grant execute on function
  worker.my_cases(),
  worker.my_plan(uuid),
  worker.my_employer_view(uuid),
  worker.my_consents(uuid),
  worker.my_progress(uuid),
  worker.set_consent(uuid, worker.consent_kind, boolean, text),
  worker.submit_check_in(uuid, worker.pathway_type, smallint, numeric, numeric, jsonb, text, text[]),
  worker.set_companion(text, text, text),
  worker.record_movement(uuid, text, numeric),
  worker.first_run_complete()
to authenticated;

-- Isolation: case_pathway and operational_signal use owns_case. The clinic
-- helper stays in the OR and remains false until a later staff mapping exists.
drop policy if exists cp_read on worker.case_pathway;
create policy cp_read on worker.case_pathway
  for select to authenticated
  using (
    worker.case_in_caller_clinic(case_id)
    or worker.owns_case(case_id)
  );

drop policy if exists os_read on worker.operational_signal;
create policy os_read on worker.operational_signal
  for select to authenticated
  using (
    worker.case_in_caller_clinic(case_id)
    or worker.owns_case(case_id)
  );

grant execute on function worker.owns_case(uuid) to authenticated;

commit;
