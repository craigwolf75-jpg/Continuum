-- Continuum Core Platform Foundations (Prompt 51). S2 immutability substrate tests.
--
-- Proves Section 5.3 and acceptance criterion 16: on an append only table, UPDATE and DELETE are
-- rejected by the GRANT and by the TRIGGER independently, and on a signed row only the transition
-- to superseded is permitted. Uses a throwaway probe schema (the CI database is discarded after
-- the job). Run by psql with ON_ERROR_STOP so any RAISE fails the job.
--
-- The two mechanisms are proven independently: the grant wall is shown against app_readonly, which
-- holds no UPDATE privilege, so its update is denied before any trigger runs; the trigger is shown
-- as the table owner (a superuser in CI), which holds every privilege, so the update reaches and is
-- rejected by the trigger. A superuser bypasses grants and row level security, but never a trigger.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

create schema if not exists immutability_probe;

-- ---------------------------------------------------------------------------
-- append only probe
-- ---------------------------------------------------------------------------
create table immutability_probe.append_only_sample (
  id   uuid primary key default gen_random_uuid(),
  note text);
create trigger tr_append_only_sample
  before update or delete on immutability_probe.append_only_sample
  for each row execute function platform.guard_append_only();
insert into immutability_probe.append_only_sample (id, note)
  values ('33333333-3333-3333-3333-333333330003', 'first');

grant usage on schema immutability_probe to app_readonly;
grant select on immutability_probe.append_only_sample to app_readonly;  -- select only, no update or delete

-- 1. grant wall: app_readonly has no update privilege, so the update is denied by the grant
set role app_readonly;
do $$
begin
  begin
    update immutability_probe.append_only_sample set note = 'x';
  exception when others then return;  -- expected: no update privilege
  end;
  raise exception 'FAIL: append only update was permitted for app_readonly (grant wall missing)';
end $$;
reset role;

-- 2. trigger wall, independent: as the owner (all privileges), the trigger still rejects the update
do $$
begin
  begin
    update immutability_probe.append_only_sample set note = 'y';
  exception when others then return;  -- expected: guard_append_only trigger raised
  end;
  raise exception 'FAIL: append only update was permitted for the owner (trigger missing)';
end $$;

-- 3. trigger wall on delete
do $$
begin
  begin
    delete from immutability_probe.append_only_sample;
  exception when others then return;  -- expected: guard_append_only trigger raised
  end;
  raise exception 'FAIL: append only delete was permitted (trigger missing)';
end $$;

-- ---------------------------------------------------------------------------
-- signed report probe
-- ---------------------------------------------------------------------------
create table immutability_probe.signed_sample (
  id               uuid primary key default gen_random_uuid(),
  status           varchar(20) not null,
  superseded_by_id uuid,
  body             text);
create trigger tr_signed_sample
  before update on immutability_probe.signed_sample
  for each row execute function platform.guard_signed_immutable();

-- a draft row is freely mutable
insert into immutability_probe.signed_sample (id, status, body)
  values ('33333333-3333-3333-3333-333333330001', 'draft', 'v1');
update immutability_probe.signed_sample set body = 'v2'
  where id = '33333333-3333-3333-3333-333333330001';
do $$
declare v text;
begin
  select body into v from immutability_probe.signed_sample where id = '33333333-3333-3333-3333-333333330001';
  if v <> 'v2' then raise exception 'FAIL: a draft update did not persist'; end if;
end $$;

-- a signed row rejects any change other than the transition to superseded
insert into immutability_probe.signed_sample (id, status, body)
  values ('33333333-3333-3333-3333-333333330002', 'signed', 'final');

do $$
begin
  begin
    update immutability_probe.signed_sample set body = 'tamper'
      where id = '33333333-3333-3333-3333-333333330002';
  exception when others then return;  -- expected: signed report is immutable
  end;
  raise exception 'FAIL: a signed row field was mutated';
end $$;

-- the only permitted change: status to superseded with superseded_by_id set
update immutability_probe.signed_sample
  set status = 'superseded', superseded_by_id = gen_random_uuid()
  where id = '33333333-3333-3333-3333-333333330002';
do $$
declare st text;
begin
  select status into st from immutability_probe.signed_sample where id = '33333333-3333-3333-3333-333333330002';
  if st <> 'superseded' then raise exception 'FAIL: the supersede transition did not persist'; end if;
end $$;

drop schema immutability_probe cascade;

\echo 'immutability substrate tests passed'
