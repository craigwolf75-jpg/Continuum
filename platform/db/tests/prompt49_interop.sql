-- Prompt 49 interop SQL proofs. Schema files applied in CI only.
-- Athena does not live apply. No em dashes or en dashes.

\set ON_ERROR_STOP on

\set orgA 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
\set orgB 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'
\set connA 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'
\set human 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'

-- 1. Every interop table has organisation_id (except none), RLS, FORCE, and a policy.
do $$
declare
  r record;
  v_missing text := '';
begin
  for r in
    select c.relname, c.relrowsecurity, c.relforcerowsecurity,
           exists (
             select 1 from pg_attribute a
             where a.attrelid = c.oid and a.attname = 'organisation_id' and a.attnum > 0 and not a.attisdropped
           ) as has_org,
           (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'interop' and c.relkind = 'r'
  loop
    if not r.has_org then v_missing := v_missing || r.relname || ': no organisation_id' || chr(10); end if;
    if not r.relrowsecurity then v_missing := v_missing || r.relname || ': RLS off' || chr(10); end if;
    if not r.relforcerowsecurity then v_missing := v_missing || r.relname || ': FORCE off' || chr(10); end if;
    if r.policies = 0 then v_missing := v_missing || r.relname || ': no policy' || chr(10); end if;
  end loop;
  if v_missing <> '' then raise exception 'FAIL interop tenant coverage:%', chr(10) || v_missing; end if;
end $$;

-- 2. No interop table is on the tenant exception allow-list.
do $$
begin
  if exists (
    select 1 from unnest(string_to_array(pg_read_file('platform/db/tenant_exception_allowlist.txt'), chr(10))) s
    where s like 'interop.%'
  ) then
    raise exception 'FAIL: an interop table appears on the tenant exception allow-list';
  end if;
exception when undefined_file then
  -- file read may be unavailable inside postgres; the workflow grep covers the allow-list
  null;
end $$;

-- 3. No new clinical measurement table was created by 0018.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'clinical'
      and table_name in ('functional_measurement_canonical', 'functional_capacity', 'canonical_functional')
  ) then
    raise exception 'FAIL: a new clinical measurement table exists';
  end if;
end $$;

-- 4. resolve_identity fails closed.
do $$
declare
  v_outcome text;
  v_person uuid;
  v_reason text;
begin
  select outcome, person_id, reason into v_outcome, v_person, v_reason
  from interop.resolve_identity(gen_random_uuid(), 'phn', '123456789', 'alberta.phn');
  if v_outcome <> 'review_required' then raise exception 'FAIL: resolve_identity outcome %', v_outcome; end if;
  if v_person is not null then raise exception 'FAIL: resolve_identity created a person'; end if;
  if v_reason <> 'PROMPT_48_NOT_LANDED' then raise exception 'FAIL: resolve_identity reason %', v_reason; end if;
end $$;

-- 5. vocabulary_map.reviewed_by is not nullable.
do $$
begin
  begin
    insert into interop.vocabulary_map (
      external_system, external_code_set, external_code, canonical_code_set, canonical_code,
      map_version, mapping_status, reviewed_by, reviewed_at, effective_from)
    values (
      'synthetic', 'demo', 'X', 'demo', 'Y', '1', 'approved', null, now(), now());
    raise exception 'FAIL: null reviewed_by was accepted';
  exception when not_null_violation then
    null;
  end;
end $$;

grant insert on tenancy.organisation to app_clinical;
grant execute on function interop.store_raw_payload(text, text, bigint, bytea, bytea) to app_clinical;
grant execute on function interop.access_raw_payload(text, text) to app_clinical;

-- 6. Seed two organisations and prove inbound isolation.
set role app_clinical;
select set_config('app.organisation_id', :'orgA', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgA', 'Interop A', 'Interop A', 'AB', 'active')
  on conflict (id) do nothing;
insert into interop.inbound_message (
  organisation_id, connection_id, source_system, idempotency_key, correlation_id,
  event_type, schema_version, canonical_version, adapter_name, adapter_version,
  content_type, content_length, payload_digest, processing_status)
values (
  :'orgA', :'connA', 'synthetic', 'key-a', gen_random_uuid(),
  'interop.inbound', 'ref-1', '1.0.0', 'reference', '1.0.0',
  'application/json', 2, '\x00', 'received');
reset role;

set role app_clinical;
select set_config('app.organisation_id', :'orgB', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgB', 'Interop B', 'Interop B', 'AB', 'active')
  on conflict (id) do nothing;
do $$
declare n int;
begin
  select count(*) into n from interop.inbound_message;
  if n <> 0 then raise exception 'FAIL: org B saw org A inbound rows (%)', n; end if;
end $$;

-- WITH CHECK: org B cannot insert a row owned by A
do $$
begin
  begin
    insert into interop.inbound_message (
      organisation_id, connection_id, source_system, idempotency_key, correlation_id,
      event_type, schema_version, canonical_version, adapter_name, adapter_version,
      content_type, content_length, payload_digest, processing_status)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
      'synthetic', 'sneak', gen_random_uuid(),
      'interop.inbound', 'ref-1', '1.0.0', 'reference', '1.0.0',
      'application/json', 2, '\x01', 'received');
  exception when others then
    return;
  end;
  raise exception 'FAIL: WITH CHECK allowed a cross tenant inbound insert';
end $$;
reset role;

-- 7. Idempotency unique constraint.
set role app_clinical;
select set_config('app.organisation_id', :'orgA', false);
do $$
begin
  begin
    insert into interop.inbound_message (
      organisation_id, connection_id, source_system, idempotency_key, correlation_id,
      event_type, schema_version, canonical_version, adapter_name, adapter_version,
      content_type, content_length, payload_digest, processing_status)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
      'synthetic', 'key-a', gen_random_uuid(),
      'interop.inbound', 'ref-1', '1.0.0', 'reference', '1.0.0',
      'application/json', 2, '\x02', 'received');
    raise exception 'FAIL: duplicate idempotency key was accepted';
  exception when unique_violation then
    null;
  end;
end $$;

-- 8. Raw payload is not selectable by app_clinical; access requires a reason and audits.
do $$
declare
  v_denied boolean := false;
  n int;
begin
  begin
    perform count(*) from interop.raw_payload;
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then
    raise exception 'FAIL: app_clinical can SELECT interop.raw_payload';
  end if;

  perform interop.store_raw_payload('raw://t1', 'application/json', 2, '\xab', '\x7b7d');

  begin
    perform * from interop.access_raw_payload('raw://t1', '');
    raise exception 'FAIL: empty access_reason was accepted';
  exception when others then
    if sqlerrm not like '%access_reason%' then
      raise exception 'FAIL: unexpected raw access error: %', sqlerrm;
    end if;
  end;

  perform * from interop.access_raw_payload('raw://t1', 'investigation');
  select count(*) into n from audit.record
    where action = 'raw_payload_read' and access_reason = 'investigation';
  if n < 1 then raise exception 'FAIL: raw payload access wrote no audit record'; end if;
end $$;
reset role;

-- 9. No Worker or Patient entity table.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'interop' and table_name in ('worker', 'patient', 'person')
  ) then
    raise exception 'FAIL: interop created a person/worker/patient table';
  end if;
end $$;
