-- Continuum worker schema suite (SB-007). Run by exposure-proof after the
-- hub exposure_proof.sql. Proves the auth.users trigger creates
-- worker.worker_account, owns_case reads clinical.wcb_case, and no worker
-- function source contains the token clinician. (schema qualifier).
-- Setup as postgres, assertions as authenticated. No em dashes or en dashes.

set role postgres;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  'e0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'worker.schema@continuum.test',
  '{}'::jsonb,
  '{"display_name":"Schema Worker"}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from worker.worker_account wa
    where wa.auth_user_id = 'e0000000-0000-0000-0000-000000000001'
      and wa.display_name = 'Schema Worker'
  ) then
    raise exception 'worker_schema: worker_account missing after auth.users insert';
  end if;
end $$;

insert into clinical.worker (id, given_name, family_name)
values (
  'e0000000-0000-0000-0000-000000000002',
  'Schema',
  'Worker'
)
on conflict (id) do nothing;

insert into clinical.wcb_case (id, worker_id, clinic_id, claim_number, date_of_injury)
values (
  'e0000000-0000-0000-0000-000000000003',
  'e0000000-0000-0000-0000-000000000002',
  null,
  '7654321',
  date '2026-09-01'
)
on conflict (id) do nothing;

update worker.worker_account
  set clinical_worker_id = 'e0000000-0000-0000-0000-000000000002'
  where auth_user_id = 'e0000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"e0000000-0000-0000-0000-000000000001"}',
  false
);

set role authenticated;

do $$
begin
  if worker.owns_case('e0000000-0000-0000-0000-000000000003') is not true then
    raise exception 'worker_schema: owns_case false for the caller case';
  end if;
  if worker.owns_case('e0000000-0000-0000-0000-000000000099') is not false then
    raise exception 'worker_schema: owns_case true for a foreign case';
  end if;
  if worker.case_in_caller_clinic('e0000000-0000-0000-0000-000000000003') is not false then
    raise exception 'worker_schema: case_in_caller_clinic must stay false';
  end if;
end $$;

reset role;

do $$
declare
  r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_functiondef(p.oid) as def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'worker'
  loop
    if position('clinician.' in r.def) > 0 then
      raise exception 'worker_schema: %.% function source contains clinician.', r.nspname, r.proname;
    end if;
  end loop;
end $$;

reset role;
select 'WORKER-SCHEMA PASS' as result;
