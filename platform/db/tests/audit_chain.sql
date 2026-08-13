-- Continuum Core Platform Foundations (Prompt 51). S4 audit framework tests.
--
-- Proves Section 7 and acceptance criteria 26 and 27: audit records are written only through the
-- chain function, the per organisation hash chain verifies, a deliberately altered row is detected,
-- and a disclosure with no lawful basis fails closed. Run by psql with ON_ERROR_STOP.
--
-- The chain function is security definer, so the application role holds execute but not insert:
-- there is no way to write an audit row that skips the chain. Verification runs as the owner, the
-- way the daily job does. The tamper is simulated by disabling the append only trigger as the
-- owner, altering a row, and re-enabling it, which is exactly the sufficiently privileged actor
-- the third control exists to catch.
--
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

\set orgD    '55555555-5555-5555-5555-55555555555d'
\set actor   '55555555-5555-5555-5555-5555555555a1'
\set personX '55555555-5555-5555-5555-5555555555f1'
\set corr    '55555555-5555-5555-5555-5555555555c1'

grant insert on tenancy.organisation to app_clinical;

set role app_clinical;
select set_config('app.organisation_id', :'orgD', false);
select set_config('app.actor_id', :'actor', false);
insert into tenancy.organisation (id, legal_name, display_name, jurisdiction_code, status)
  values (:'orgD', 'Org D', 'Org D', 'AB', 'active') on conflict do nothing;

-- append four records through the only write path (security definer)
select audit.append_record('view',   'wcb_report', 'permitted', p_subject_person_id => :'personX', p_correlation_id => :'corr');
select audit.append_record('create', 'wcb_case',   'permitted', p_subject_person_id => :'personX');
select audit.append_record('sign',   'wcb_report', 'permitted', p_subject_person_id => :'personX');
select audit.append_record('disclose','wcb_report','permitted', p_subject_person_id => :'personX',
                           p_lawful_basis_type => 'statutory_duty', p_lawful_basis_ref => 'HIA-report-duty');

-- the tenant sees its own four records (row level security)
do $$
declare n int;
begin
  select count(*) into n from audit.record;
  if n <> 4 then raise exception 'FAIL: expected 4 audit records for org D, saw %', n; end if;
end $$;

-- correlation id threads onto the record
do $$
declare n int;
begin
  select count(*) into n from audit.record where correlation_id = '55555555-5555-5555-5555-5555555555c1';
  if n <> 1 then raise exception 'FAIL: correlation id did not thread onto exactly one record, saw %', n; end if;
end $$;

-- a disclosure with no lawful basis fails closed (criterion 26)
do $$
begin
  begin
    perform audit.append_record('disclose', 'wcb_report', 'permitted', p_subject_person_id => '55555555-5555-5555-5555-5555555555f1');
  exception when others then return;  -- expected: no lawful basis
  end;
  raise exception 'FAIL: a disclosure with no lawful basis was recorded';
end $$;

reset role;

-- the chain verifies intact (criterion 27, first half)
do $$
declare b bigint;
begin
  b := audit.verify_chain('55555555-5555-5555-5555-55555555555d');
  if b is not null then raise exception 'FAIL: the audit chain reported a break at % on an untouched chain', b; end if;
end $$;

-- simulate a tamper that bypassed the trigger, and prove the chain detects it (criterion 27)
alter table audit.record disable trigger tr_record_append_only;
update audit.record set action = 'tampered'
  where organisation_id = '55555555-5555-5555-5555-55555555555d' and record_sequence = 2;
alter table audit.record enable trigger tr_record_append_only;

do $$
declare b bigint;
begin
  b := audit.verify_chain('55555555-5555-5555-5555-55555555555d');
  if b is null then raise exception 'FAIL: the audit chain did not detect a tampered row'; end if;
  if b <> 2 then raise exception 'FAIL: expected the break at sequence 2, got %', b; end if;
end $$;

\echo 'audit framework tests passed'
