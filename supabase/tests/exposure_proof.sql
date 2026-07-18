-- Continuum exposure-proof suite (07.10). The release gate.
-- Governed by CONTINUUM_PROMPT_07.md section 07.10. No em-dashes or en-dashes.
--
-- Walks every PHI surface (base tables + role views) as each of the five roles
-- and asserts no role reads a row or field outside its slice of the visibility
-- matrix. Any leak raises and aborts, so CI fails. Run against a database that
-- has the demo seed (Worley tenant, Marcus Bedard case).
--
-- Fixtures (seed):
--   tenant Worley   11111111-1111-1111-1111-111111111111
--   worker Marcus   users b0000000-...0001  worker c0000000-...0001  injury d0000000-...0001
--   hse             b0000000-...0002   employer b0000000-...0003
--   wcb_officer     b0000000-...0004   nexus b0000000-...0005
--   a foreign tenant 22222222-2222-2222-2222-222222222222 (no rows) is used for isolation

set role authenticated;

-- EMPLOYER (Worley): no base PHI, no other-role views, own tenant only.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"employer_admin","user_id":"b0000000-0000-0000-0000-000000000003","tenant_id":"11111111-1111-1111-1111-111111111111"}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK employer: base injuries'; end if;
  if (select count(*) from public.recovery_logs) > 0 then raise exception 'LEAK employer: base recovery_logs'; end if;
  if (select count(*) from public.wcb_notifications) > 0 then raise exception 'LEAK employer: base wcb_notifications'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK employer: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK employer: wcb_officer_view'; end if;
  if (select count(*) from public.employer_case_view where tenant_id <> '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK employer: cross-tenant in employer_case_view'; end if;
end $$;

-- HSE (Worley): no base PHI, no other-role views, own tenant only.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"hse","user_id":"b0000000-0000-0000-0000-000000000002","tenant_id":"11111111-1111-1111-1111-111111111111"}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK hse: base injuries'; end if;
  if (select count(*) from public.recovery_logs) > 0 then raise exception 'LEAK hse: base recovery_logs'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK hse: employer_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK hse: wcb_officer_view'; end if;
  if (select count(*) from public.hse_case_view where tenant_id <> '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK hse: cross-tenant in hse_case_view'; end if;
end $$;

-- WORKER (Marcus): own rows only at base, no dashboards.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"worker","user_id":"b0000000-0000-0000-0000-000000000001","tenant_id":"11111111-1111-1111-1111-111111111111"}', false);
do $$
begin
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK worker: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK worker: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK worker: wcb_officer_view'; end if;
  if (select count(*) from public.injuries where worker_id <> 'c0000000-0000-0000-0000-000000000001') > 0
    then raise exception 'LEAK worker: another worker injury'; end if;
end $$;

-- WCB OFFICER (tenant grant): no base PHI, no employer/hse views, granted tenant only.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"wcb_officer","user_id":"b0000000-0000-0000-0000-000000000004","tenant_id":null}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK wcb_officer: base injuries'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK wcb_officer: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK wcb_officer: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view where tenant_id <> '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK wcb_officer: cross-tenant in wcb_officer_view'; end if;
end $$;

-- NEXUS (injury grant): only the granted injury at base, no dashboards.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"nexus_physician","user_id":"b0000000-0000-0000-0000-000000000005","tenant_id":null}', false);
do $$
begin
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK nexus: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK nexus: hse_case_view'; end if;
  if (select count(*) from public.wcb_officer_view) > 0 then raise exception 'LEAK nexus: wcb_officer_view'; end if;
  if (select count(*) from public.injuries where id <> 'd0000000-0000-0000-0000-000000000001') > 0
    then raise exception 'LEAK nexus: ungranted injury'; end if;
end $$;

-- FOREIGN EMPLOYER (other tenant, no grants): sees nothing.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"employer_admin","user_id":"b0000000-0000-0000-0000-0000000000aa","tenant_id":"22222222-2222-2222-2222-222222222222"}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK foreign employer: base injuries'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK foreign employer: employer_case_view'; end if;
  if (select count(*) from public.tenants where id = '11111111-1111-1111-1111-111111111111') > 0
    then raise exception 'LEAK foreign employer: another tenant row'; end if;
end $$;

-- OPS ADMIN (site admin): reads the operational views across tenants, but must
-- never reach raw PHI at the base tables or the clinical role views.
select set_config('request.jwt.claims',
  '{"role":"authenticated","user_role":"ops_admin","user_id":"a0000000-0000-0000-0000-0000000000ad","tenant_id":null}', false);
do $$
begin
  if (select count(*) from public.injuries) > 0 then raise exception 'LEAK ops_admin: base injuries (diagnosis)'; end if;
  if (select count(*) from public.recovery_logs) > 0 then raise exception 'LEAK ops_admin: base recovery_logs (scores and notes)'; end if;
  if (select count(*) from public.wcb_notifications) > 0 then raise exception 'LEAK ops_admin: base wcb_notifications (payload)'; end if;
  if (select count(*) from public.employer_case_view) > 0 then raise exception 'LEAK ops_admin: employer_case_view'; end if;
  if (select count(*) from public.hse_case_view) > 0 then raise exception 'LEAK ops_admin: hse_case_view'; end if;
end $$;

reset role;
select 'EXPOSURE-PROOF PASS' as result;
