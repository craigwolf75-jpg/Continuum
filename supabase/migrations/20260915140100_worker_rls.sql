-- Continuum worker RLS (SB-002). Append only; never edit once applied.
-- Worker isolation is worker.owns_case (defined in the RPCs migration).
-- worker.case_in_caller_clinic returns false: clinical.practitioner has no
-- auth_user_id, so clinic-staff mapping is parked. No em dashes or en dashes.

begin;

create or replace function worker.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = worker, public
as $$
  select id
  from worker.worker_account
  where auth_user_id = auth.uid()
  limit 1
$$;

-- Parked clinic-staff helper. Always false until a later staff mapping exists.
create or replace function worker.case_in_caller_clinic(p_case uuid)
returns boolean
language sql
stable
security definer
set search_path = worker, public
as $$
  select false;
$$;

revoke all on all tables in schema worker from public, anon, authenticated;
revoke all on all sequences in schema worker from public, anon, authenticated;
revoke all on all functions in schema worker from public, anon, authenticated;

grant usage on schema worker to authenticated;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'worker' loop
    execute format('alter table worker.%I enable row level security', t);
  end loop;
end $$;

grant select on
  worker.worker_account,
  worker.case_pathway,
  worker.consent,
  worker.check_in,
  worker.check_in_answer,
  worker.private_comment,
  worker.psych_capture,
  worker.operational_signal,
  worker.movement_observation,
  worker.companion_memory,
  worker.deployment_flag
to authenticated;

drop policy if exists wa_self on worker.worker_account;
create policy wa_self on worker.worker_account
  for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists cm_self on worker.companion_memory;
create policy cm_self on worker.companion_memory
  for select to authenticated
  using (worker_account_id = worker.current_account_id());

drop policy if exists mv_self on worker.movement_observation;
create policy mv_self on worker.movement_observation
  for select to authenticated
  using (worker_account_id = worker.current_account_id());

drop policy if exists consent_self on worker.consent;
create policy consent_self on worker.consent
  for select to authenticated
  using (
    worker_account_id = worker.current_account_id()
    or worker.case_in_caller_clinic(case_id)
  );

drop policy if exists cp_read on worker.case_pathway;
create policy cp_read on worker.case_pathway
  for select to authenticated
  using (
    worker.case_in_caller_clinic(case_id)
    or exists (
      select 1 from worker.worker_account wa
      where wa.id = worker.current_account_id()
    )
  );

drop policy if exists ci_read on worker.check_in;
create policy ci_read on worker.check_in
  for select to authenticated
  using (
    worker_account_id = worker.current_account_id()
    or worker.case_in_caller_clinic(case_id)
  );

drop policy if exists cia_read on worker.check_in_answer;
create policy cia_read on worker.check_in_answer
  for select to authenticated
  using (
    exists (
      select 1 from worker.check_in ci
      where ci.id = check_in_answer.check_in_id
        and (
          ci.worker_account_id = worker.current_account_id()
          or worker.case_in_caller_clinic(ci.case_id)
        )
    )
  );

drop policy if exists pc_read on worker.private_comment;
create policy pc_read on worker.private_comment
  for select to authenticated
  using (
    worker_account_id = worker.current_account_id()
    or exists (
      select 1 from worker.check_in ci
      where ci.id = private_comment.check_in_id
        and worker.case_in_caller_clinic(ci.case_id)
    )
  );

drop policy if exists psy_read on worker.psych_capture;
create policy psy_read on worker.psych_capture
  for select to authenticated
  using (
    worker_account_id = worker.current_account_id()
    or exists (
      select 1 from worker.check_in ci
      where ci.id = psych_capture.check_in_id
        and worker.case_in_caller_clinic(ci.case_id)
    )
  );

drop policy if exists os_read on worker.operational_signal;
create policy os_read on worker.operational_signal
  for select to authenticated
  using (
    worker.case_in_caller_clinic(case_id)
    or exists (
      select 1 from worker.worker_account wa
      where wa.id = worker.current_account_id()
    )
  );

drop policy if exists df_read on worker.deployment_flag;
create policy df_read on worker.deployment_flag
  for select to authenticated
  using (true);

grant execute on function worker.current_account_id() to authenticated;
grant execute on function worker.case_in_caller_clinic(uuid) to authenticated;

commit;
