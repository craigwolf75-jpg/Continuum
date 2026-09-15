-- Continuum worker provision invite gate suite.
-- Run by exposure-proof after worker_schema.sql. Proves:
--   EXECUTE is granted to authenticated; anon and public still have none
--   owner postgres still has execute
--   authenticated cannot bind an arbitrary case UUID (invite gate holds)
--   invited email plus matching case binds when authenticated calls
--   a consumed invite cannot bind again
-- Setup as postgres. No em dashes or en dashes.

set role postgres;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    'aa110000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'invited.provision@continuum.test',
    '{}'::jsonb,
    '{"display_name":"Invited Provision"}'::jsonb,
    now(),
    now()
  ),
  (
    'aa110000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'attacker.provision@continuum.test',
    '{}'::jsonb,
    '{"display_name":"Attacker Provision"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into worker.worker_account (auth_user_id, display_name)
values
  ('aa110000-0000-0000-0000-000000000001', 'Invited Provision'),
  ('aa110000-0000-0000-0000-000000000002', 'Attacker Provision')
on conflict (auth_user_id) do nothing;

insert into clinical.worker (id, given_name, family_name)
values
  ('aa110000-0000-0000-0000-000000000010', 'Invited', 'Provision'),
  ('aa110000-0000-0000-0000-000000000013', 'Foreign', 'Provision')
on conflict (id) do nothing;

insert into clinical.wcb_case (id, worker_id, clinic_id, claim_number, date_of_injury)
values
  (
    'aa110000-0000-0000-0000-000000000011',
    'aa110000-0000-0000-0000-000000000010',
    null,
    '7654322',
    date '2026-09-02'
  ),
  (
    'aa110000-0000-0000-0000-000000000012',
    'aa110000-0000-0000-0000-000000000013',
    null,
    '7654323',
    date '2026-09-03'
  )
on conflict (id) do nothing;

insert into worker.case_invite (case_id, email)
values (
  'aa110000-0000-0000-0000-000000000011',
  'invited.provision@continuum.test'
)
on conflict (case_id, email) do update
  set consumed_at = null;

update worker.worker_account
  set clinical_worker_id = null
  where auth_user_id in (
    'aa110000-0000-0000-0000-000000000001',
    'aa110000-0000-0000-0000-000000000002'
  );

do $$
begin
  if has_function_privilege(
    'anon',
    'worker.provision_worker(uuid, text)',
    'execute'
  ) then
    raise exception 'worker_provision_gate: anon still has execute on provision_worker';
  end if;
  if has_function_privilege(
    'public',
    'worker.provision_worker(uuid, text)',
    'execute'
  ) then
    raise exception 'worker_provision_gate: public still has execute on provision_worker';
  end if;
  if not has_function_privilege(
    'authenticated',
    'worker.provision_worker(uuid, text)',
    'execute'
  ) then
    raise exception 'worker_provision_gate: authenticated missing execute on provision_worker';
  end if;
  if not has_function_privilege(
    'postgres',
    'worker.provision_worker(uuid, text)',
    'execute'
  ) then
    raise exception 'worker_provision_gate: owner postgres missing execute on provision_worker';
  end if;
end $$;

set role anon;
do $$
begin
  begin
    perform worker.provision_worker(
      'aa110000-0000-0000-0000-000000000011',
      'invited.provision@continuum.test'
    );
    raise exception 'worker_provision_gate: anon executed provision_worker';
  exception
    when insufficient_privilege then null;
  end;
end $$;

reset role;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"aa110000-0000-0000-0000-000000000002"}',
  false
);
set role authenticated;

do $$
begin
  begin
    perform worker.provision_worker(
      'aa110000-0000-0000-0000-000000000012',
      'attacker.provision@continuum.test'
    );
    raise exception 'worker_provision_gate: uninvited caller bound an arbitrary case';
  exception
    when others then
      if sqlerrm <> 'not invited to this case' then
        raise;
      end if;
  end;
end $$;

reset role;

-- Gate body, owner jwt: EXECUTE is postgres. Confirms the invite exceptions
-- independently of the authenticated GRANT.
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"aa110000-0000-0000-0000-000000000002"}',
  false
);

do $$
begin
  begin
    perform worker.provision_worker(
      'aa110000-0000-0000-0000-000000000012',
      'attacker.provision@continuum.test'
    );
    raise exception 'worker_provision_gate: owner jwt uninvited caller bound an arbitrary case';
  exception
    when others then
      if sqlerrm <> 'not invited to this case' then
        raise;
      end if;
  end;

  begin
    perform worker.provision_worker(
      'aa110000-0000-0000-0000-000000000011',
      'attacker.provision@continuum.test'
    );
    raise exception 'worker_provision_gate: attacker bound an invited case';
  exception
    when others then
      if sqlerrm <> 'not invited to this case' then
        raise;
      end if;
  end;
end $$;

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"aa110000-0000-0000-0000-000000000001"}',
  false
);
set role authenticated;

do $$
declare
  v_acct uuid;
begin
  begin
    perform worker.provision_worker(
      'aa110000-0000-0000-0000-000000000012',
      'invited.provision@continuum.test'
    );
    raise exception 'worker_provision_gate: invited caller bound an uninvited case';
  exception
    when others then
      if sqlerrm <> 'not invited to this case' then
        raise;
      end if;
  end;

  v_acct := worker.provision_worker(
    'aa110000-0000-0000-0000-000000000011',
    'invited.provision@continuum.test'
  );
  if v_acct is null then
    raise exception 'worker_provision_gate: invited bind returned null';
  end if;
end $$;

reset role;

do $$
begin
  if not exists (
    select 1
    from worker.worker_account wa
    where wa.auth_user_id = 'aa110000-0000-0000-0000-000000000001'
      and wa.clinical_worker_id = 'aa110000-0000-0000-0000-000000000010'
  ) then
    raise exception 'worker_provision_gate: invited bind did not set clinical_worker_id';
  end if;
  if exists (
    select 1
    from worker.worker_account wa
    where wa.auth_user_id = 'aa110000-0000-0000-0000-000000000002'
      and wa.clinical_worker_id is not null
  ) then
    raise exception 'worker_provision_gate: attacker clinical_worker_id was set';
  end if;
  if exists (
    select 1
    from worker.case_invite i
    where i.case_id = 'aa110000-0000-0000-0000-000000000011'
      and i.email = 'invited.provision@continuum.test'
      and i.consumed_at is null
  ) then
    raise exception 'worker_provision_gate: invite was not consumed';
  end if;
end $$;

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"aa110000-0000-0000-0000-000000000001"}',
  false
);
set role authenticated;

do $$
begin
  begin
    perform worker.provision_worker(
      'aa110000-0000-0000-0000-000000000011',
      'invited.provision@continuum.test'
    );
    raise exception 'worker_provision_gate: consumed invite still bound';
  exception
    when others then
      if sqlerrm <> 'not invited to this case' then
        raise;
      end if;
  end;
end $$;

reset role;
select 'WORKER-PROVISION-GATE PASS' as result;
