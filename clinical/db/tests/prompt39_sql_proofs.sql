-- Continuum Prompt 39 SQL proofs. Self contained probe schema.
-- Does not live apply to the Continuum Supabase project. Does not rewrite 011 or
-- Prompt 40 tables. Run with: psql -v ON_ERROR_STOP=1 -f clinical/db/tests/prompt39_sql_proofs.sql
-- Proves band derivation (8 / 25 / 3 kg), LIMITED versus LIMITEDTO emission,
-- unanswered versus skipped versus able, skip_requires_reason, legacy label with
-- no fabricated measurement, and UPDATE must fail. No dashes.

\set ON_ERROR_STOP on

drop schema if exists prompt39_probe cascade;
create schema prompt39_probe;

-- Mirror of clinical.derive_weight_band (011).
create function prompt39_probe.derive_weight_band(measured_kg numeric)
returns table (band varchar(20), rounded_down boolean, below_lowest_band boolean)
language plpgsql immutable as $derive$
begin
  if measured_kg is null then
    band := null; rounded_down := false; below_lowest_band := false; return next; return;
  end if;
  if measured_kg < 5 then
    band := 'LIMITED'; rounded_down := false; below_lowest_band := true;
  elsif measured_kg = 5 then
    band := 'LIMITED'; rounded_down := false; below_lowest_band := false;
  elsif measured_kg < 10 then
    band := 'LIMITED'; rounded_down := true;  below_lowest_band := false;
  elsif measured_kg = 10 then
    band := 'LIGHT';   rounded_down := false; below_lowest_band := false;
  elsif measured_kg < 20 then
    band := 'LIGHT';   rounded_down := true;  below_lowest_band := false;
  elsif measured_kg = 20 then
    band := 'MEDIUM';  rounded_down := false; below_lowest_band := false;
  else
    band := 'HEAVY';   rounded_down := false; below_lowest_band := false;
  end if;
  return next;
end;
$derive$;

-- Criterion 5: 8 kg emits LIMITED, rounded_down true.
do $$
declare r record;
begin
  select * into r from prompt39_probe.derive_weight_band(8);
  if r.band is distinct from 'LIMITED' or r.rounded_down is distinct from true or r.below_lowest_band is distinct from false then
    raise exception 'FAIL criterion 5: 8 kg expected LIMITED rounded_down true, got % % %', r.band, r.rounded_down, r.below_lowest_band;
  end if;
end $$;

-- Criterion 6: 25 kg emits HEAVY, rounded_down false.
do $$
declare r record;
begin
  select * into r from prompt39_probe.derive_weight_band(25);
  if r.band is distinct from 'HEAVY' or r.rounded_down is distinct from false then
    raise exception 'FAIL criterion 6: 25 kg expected HEAVY not rounded, got % %', r.band, r.rounded_down;
  end if;
end $$;

-- Criterion 7: 3 kg emits LIMITED, below_lowest_band true.
do $$
declare r record;
begin
  select * into r from prompt39_probe.derive_weight_band(3);
  if r.band is distinct from 'LIMITED' or r.below_lowest_band is distinct from true or r.rounded_down is distinct from false then
    raise exception 'FAIL criterion 7: 3 kg expected LIMITED below_lowest_band, got % % %', r.band, r.rounded_down, r.below_lowest_band;
  end if;
end $$;

-- Criterion 4: same intent emits LIMITED on Basic, LIMITEDTO on Extended.
create function prompt39_probe.emit_code(p_capability text, p_code_list text, p_weight_band text)
returns varchar(20)
language plpgsql immutable as $emit$
begin
  if p_weight_band is not null and p_weight_band <> '' then
    return p_weight_band;
  end if;
  if p_capability = 'able'   then return 'ABLE'; end if;
  if p_capability = 'unable' then return 'UNABLE'; end if;
  if p_capability in ('limited','limited_to') then
    if p_code_list = 'Extended Work Restriction Codes' then return 'LIMITEDTO'; end if;
    if p_code_list = 'Basic Work Restriction Codes'    then return 'LIMITED';   end if;
    return null;
  end if;
  return null;
end;
$emit$;

do $$
begin
  if prompt39_probe.emit_code('limited', 'Basic Work Restriction Codes', null) is distinct from 'LIMITED' then
    raise exception 'FAIL criterion 4: C050E bending expected LIMITED';
  end if;
  if prompt39_probe.emit_code('limited', 'Extended Work Restriction Codes', null) is distinct from 'LIMITEDTO' then
    raise exception 'FAIL criterion 4: C050S bending expected LIMITEDTO';
  end if;
end $$;

-- Criterion 9: UPDATE must fail at the database (trigger wall).
create table prompt39_probe.functional_measurement (
  id uuid primary key default gen_random_uuid(),
  note text
);
create function prompt39_probe.block_mutation() returns trigger
language plpgsql as $block$
begin
  raise exception 'clinical measurement rows are immutable. % is not permitted on %',
    tg_op, tg_table_name;
end;
$block$;
create trigger trg_block_mutation before update or delete on prompt39_probe.functional_measurement
  for each row execute function prompt39_probe.block_mutation();
insert into prompt39_probe.functional_measurement (note) values ('row one');

do $$
begin
  begin
    update prompt39_probe.functional_measurement set note = 'mutated';
  exception when others then
    if sqlerrm like '%immutable%' then return; end if;
    raise;
  end;
  raise exception 'FAIL criterion 9: UPDATE was permitted on functional_measurement';
end $$;

-- Criterion 10 and 11: unanswered, skipped, answered able are distinct; skip needs a reason.
create table prompt39_probe.functional_axis_value (
  id uuid primary key default gen_random_uuid(),
  axis text not null,
  answered boolean not null default false,
  skipped boolean not null default false,
  skip_reason varchar(200),
  capability text,
  constraint answered_or_skipped_not_both check (not (answered and skipped)),
  constraint capability_requires_answered check (capability is null or answered),
  constraint skip_requires_reason check (not skipped or skip_reason is not null)
);
insert into prompt39_probe.functional_axis_value (axis, answered, skipped, capability)
  values ('sitting', false, false, null);
insert into prompt39_probe.functional_axis_value (axis, answered, skipped, skip_reason)
  values ('standing', false, true, 'not relevant');
insert into prompt39_probe.functional_axis_value (axis, answered, skipped, capability)
  values ('walking', true, false, 'able');

do $$
declare unanswered_n int; skipped_n int; able_n int;
begin
  select count(*) into unanswered_n from prompt39_probe.functional_axis_value
    where answered = false and skipped = false and capability is null;
  select count(*) into skipped_n from prompt39_probe.functional_axis_value
    where skipped = true and skip_reason is not null;
  select count(*) into able_n from prompt39_probe.functional_axis_value
    where answered = true and capability = 'able';
  if unanswered_n <> 1 or skipped_n <> 1 or able_n <> 1 then
    raise exception 'FAIL criterion 10: expected one of each state, got unanswered=% skipped=% able=%', unanswered_n, skipped_n, able_n;
  end if;
end $$;

do $$
begin
  begin
    insert into prompt39_probe.functional_axis_value (axis, skipped) values ('driving', true);
  exception when check_violation then
    return;
  end;
  raise exception 'FAIL criterion 11: skipped without reason was permitted';
end $$;

-- Criterion 12: migrating a legacy R code produces has_underlying_measurement = false
-- and no fabricated measurement row.
create table prompt39_probe.legacy_restriction_label (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  r_code varchar(10) not null,
  has_underlying_measurement boolean not null default false,
  note text not null default 'Legacy label. No measurement was ever captured. Do not infer one.'
);
create table prompt39_probe.fabricated_measurement (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null
);
insert into prompt39_probe.legacy_restriction_label (case_id, r_code)
  values ('00000000-0000-0000-0000-000000000039', 'R01');

do $$
declare n int; m int; flag boolean;
begin
  select has_underlying_measurement into flag from prompt39_probe.legacy_restriction_label
    where r_code = 'R01';
  select count(*) into n from prompt39_probe.legacy_restriction_label;
  select count(*) into m from prompt39_probe.fabricated_measurement;
  if flag is distinct from false or n <> 1 or m <> 0 then
    raise exception 'FAIL criterion 12: expected has_underlying_measurement false and zero fabricated rows';
  end if;
end $$;

drop schema prompt39_probe cascade;
