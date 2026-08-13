-- Continuum Core Platform Foundations (Prompt 51). S5 event foundation tests.
--
-- Proves Section 8 and acceptance criteria 29 to 32: an event and its state change commit together
-- (a rollback leaves no event), the outbox row is pending at commit and no dispatch happens inside
-- the transaction, a domain event and a draft event never reach the outbox, and two events for one
-- aggregate cannot share a sequence. Run by psql with ON_ERROR_STOP.
--
-- Events are written only through events.emit (security definer), so the application holds execute
-- but not insert and the per aggregate sequence cannot be corrupted by a raw insert.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgE      '66666666-6666-6666-6666-66666666666e'
\set aggDomain '66666666-6666-6666-6666-6666666666a1'
\set aggInt    '66666666-6666-6666-6666-6666666666a2'
\set aggDraft  '66666666-6666-6666-6666-6666666666a3'
\set aggSeq    '66666666-6666-6666-6666-6666666666a4'
\set aggR      '66666666-6666-6666-6666-6666666666a5'

grant insert on tenancy.organisation to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgE', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgE', 'Org E', 'Org E', 'AB', 'active') on conflict do nothing;

-- an entitled subscription for an external destination
insert into events.subscription (organisation_id, destination, event_class, event_type, is_entitled)
  values (:'orgE', 'partner', 'integration', '*', true) on conflict do nothing;

-- emit one of each: domain (never leaves), integration (goes to the entitled destination), draft
select events.emit('domain',      'thing.changed',  'thing',  :'aggDomain', '{}'::jsonb);
select events.emit('integration', 'case.opened',    'case',   :'aggInt',    '{}'::jsonb);
select events.emit('integration', 'report.drafted', 'report', :'aggDraft',  '{}'::jsonb);
-- two events for one aggregate: sequence auto increments
select events.emit('domain', 'step.a', 'agg', :'aggSeq', '{}'::jsonb);
select events.emit('domain', 'step.b', 'agg', :'aggSeq', '{}'::jsonb);

-- a domain event never reaches the outbox
do $$
declare n int;
begin
  select count(*) into n from events.outbox o join events.domain_event e on e.id = o.event_id
    where e.aggregate_id = '66666666-6666-6666-6666-6666666666a1';
  if n <> 0 then raise exception 'FAIL: a domain event reached the outbox (%)', n; end if;
end $$;

-- an integration event reaches its entitled destination, pending at commit (criterion 30)
do $$
declare v_status text; v_count int;
begin
  select count(*) into v_count from events.outbox o join events.domain_event e on e.id = o.event_id
    where e.aggregate_id = '66666666-6666-6666-6666-6666666666a2';
  if v_count <> 1 then raise exception 'FAIL: integration event expected 1 outbox row, saw %', v_count; end if;
  select o.status into v_status from events.outbox o join events.domain_event e on e.id = o.event_id
    where e.aggregate_id = '66666666-6666-6666-6666-6666666666a2';
  if v_status <> 'pending' then raise exception 'FAIL: outbox row expected pending, was %', v_status; end if;
end $$;

-- a draft event never leaves the platform (criterion 31), even with an entitled subscription
do $$
declare n int;
begin
  select count(*) into n from events.outbox o join events.domain_event e on e.id = o.event_id
    where e.aggregate_id = '66666666-6666-6666-6666-6666666666a3';
  if n <> 0 then raise exception 'FAIL: a draft event reached the outbox (%)', n; end if;
end $$;

-- the aggregate carries two ordered events
do $$
declare v_max bigint; v_count int;
begin
  select max(sequence_in_aggregate), count(*) into v_max, v_count
    from events.domain_event where aggregate_id = '66666666-6666-6666-6666-6666666666a4';
  if v_count <> 2 or v_max <> 2 then raise exception 'FAIL: aggregate expected 2 events with max sequence 2, saw count % max %', v_count, v_max; end if;
end $$;

-- a state change and its event commit together: a rollback leaves no event (criterion 29)
begin;
select events.emit('domain', 'rolled.back', 'agg', :'aggR', '{}'::jsonb);
rollback;
do $$
declare n int;
begin
  select count(*) into n from events.domain_event where aggregate_id = '66666666-6666-6666-6666-6666666666a5';
  if n <> 0 then raise exception 'FAIL: an event survived a rolled back transaction'; end if;
end $$;

reset role;

-- two events for one aggregate cannot share a sequence (criterion 32)
do $$
begin
  begin
    insert into events.domain_event (
      id, occurred_at, organisation_id, event_class, event_type, schema_version,
      aggregate_type, aggregate_id, sequence_in_aggregate, actor_type, correlation_id, payload)
    values (
      gen_random_uuid(), now(), '66666666-6666-6666-6666-66666666666e', 'domain', 'dup', 1,
      'agg', '66666666-6666-6666-6666-6666666666a4', 1, 'system', gen_random_uuid(), '{}'::jsonb);
  exception when others then return;  -- expected: the unique sequence constraint
  end;
  raise exception 'FAIL: a duplicate sequence_in_aggregate was allowed';
end $$;

-- events are immutable: the owner update is rejected by the trigger
do $$
begin
  begin
    update events.domain_event set event_type = 'tamper' where aggregate_id = '66666666-6666-6666-6666-6666666666a2';
  exception when others then return;  -- expected: guard_append_only
  end;
  raise exception 'FAIL: a domain event was updated (trigger missing)';
end $$;

\echo 'event foundation tests passed'
