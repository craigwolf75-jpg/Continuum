-- Continuum worker.log_worker_event (SB-002). Append only; never edit once applied.
-- Canonical whitelist: CONTACT_REQUESTED, SUPPORT_RESPONSE, HANDOFF_SENT.
-- No em dashes or en dashes.

begin;

create or replace function worker.log_worker_event(p_case uuid, p_action text, p_detail jsonb)
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
  if p_action not in ('CONTACT_REQUESTED', 'SUPPORT_RESPONSE', 'HANDOFF_SENT') then
    raise exception 'action not permitted from client: %', p_action;
  end if;
  insert into worker.audit_log (worker_account_id, case_id, action, detail)
  values (v_acct, p_case, p_action, coalesce(p_detail, '{}'::jsonb));
end;
$$;

revoke execute on function worker.log_worker_event(uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function worker.log_worker_event(uuid, text, jsonb)
  to authenticated;

commit;
