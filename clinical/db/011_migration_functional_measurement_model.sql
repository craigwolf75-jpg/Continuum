-- Continuum Prompt 39: the functional measurement model migration.
-- Design spec: docs/superpowers/specs/2026-08-09-prompt-39-functional-measurement-model-design.md
--
-- Idempotent and additive, applied as one transaction, hand applied by Gary per the
-- standing rule (Claude never touches the Continuum Supabase project). No dashes.
--
-- PRECONDITIONS. This migration REFUSES to run (the preflight block below RAISES) until
-- the physician platform foundation exists: clinical.clinic, clinical.wcb_case,
-- clinical.wcb_report, clinical.practitioner (built by the physician platform prompt),
-- and clinical.form_definition, clinical.form_element (built by Prompt 40, already
-- applied as migration 001). On 2026-08-10 the Prompt 40 tables exist but the four
-- physician foundation tables do not, so this migration will abort until they are
-- created. That is intended: it can never build a half wired schema.
--
-- RECONCILIATION with the design spec (recorded here and in the 39A reconciliation doc):
--   The spec Section 4.3 wrote resolve_axes as a SELECT over form_element reading
--   fe.axis, fe.quantity_unit and fe.display_order. The shipped Prompt 40 form_element
--   (migration 001) carries none of those columns and no functional_axis mapping at all,
--   and acceptance criteria 2 and 3 require resolve_axes to surface sided reaching,
--   grasping and environment, which are not functional_axis enum members. So the axis
--   set lives in a dedicated configuration table, clinical.functional_axis_map (the
--   Section 4.4 board matrix, refined by 39A Section 2.4 for the C151S conditional set),
--   and resolve_axes reads it. The AxisSpec contract is unchanged and a build test
--   asserts resolve_axes reproduces the Section 4.4 matrix exactly.
--   The eight internal restriction codes and the axis map rows are seeded in
--   012_seed_functional_measurement.sql (generated), not inline here, to match the
--   Prompt 40 migration and seed split.

begin;

-- ---------------------------------------------------------------------------
-- 0. Preflight gate. Aborts if any parent is missing (spec Section 2.0).
-- ---------------------------------------------------------------------------
do $preflight$
begin
  if to_regnamespace('clinical') is null then
    raise exception 'clinical schema is absent. Run the physician platform foundation first.';
  end if;
  if to_regclass('clinical.clinic') is null
     or to_regclass('clinical.wcb_case') is null
     or to_regclass('clinical.wcb_report') is null
     or to_regclass('clinical.practitioner') is null then
    raise exception 'A parent table (clinic, wcb_case, wcb_report, practitioner) is absent. Run the physician platform foundation first.';
  end if;
  if to_regclass('clinical.form_definition') is null
     or to_regclass('clinical.form_element') is null then
    raise exception 'form_definition or form_element is absent. Run Prompt 40 migration 001 first.';
  end if;
end
$preflight$;

-- ---------------------------------------------------------------------------
-- 1. Enums (spec Section 2.1). Guarded so re running is safe.
-- ---------------------------------------------------------------------------
do $enums$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='capability' and n.nspname='clinical') then
    create type clinical.capability as enum ('able','limited_to','limited','unable','restricted_from');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='axis_source' and n.nspname='clinical') then
    create type clinical.axis_source as enum ('measured','carried_forward','bulk_marked_able');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='body_side' and n.nspname='clinical') then
    create type clinical.body_side as enum ('left','right','both');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='reach_plane' and n.nspname='clinical') then
    create type clinical.reach_plane as enum ('above','below');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='functional_axis' and n.nspname='clinical') then
    create type clinical.functional_axis as enum (
      'sitting','standing','walking','bending','twisting','kneeling_squatting',
      'climbing','driving','pushing_pulling',
      'lifting_general','overhead_reaching',
      'lifting_floor_to_waist','lifting_waist_to_shoulder','lifting_above_shoulder');
  end if;
end
$enums$;

-- ---------------------------------------------------------------------------
-- 2. Core tables (spec Section 2.2). Insert only; immutability in Section 5.
-- ---------------------------------------------------------------------------
create table if not exists clinical.functional_measurement (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinical.clinic(id),
  case_id uuid not null references clinical.wcb_case(id),
  report_id uuid references clinical.wcb_report(id),
  practitioner_id uuid not null references clinical.practitioner(id),
  form_id varchar(6) not null,
  version int not null,
  measured_at timestamptz not null,
  work_hours_per_day numeric(4,2),
  modified_hours boolean,
  modified_duties boolean,
  fit_for_work varchar(10),
  fit_override_reason varchar(300),
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  created_by uuid not null,
  unique (case_id, version)
);
create index if not exists ix_measurement_case on clinical.functional_measurement(case_id, version desc);
create index if not exists ix_measurement_clinic on clinical.functional_measurement(clinic_id);

create table if not exists clinical.functional_axis_value (
  id uuid primary key default gen_random_uuid(),
  measurement_id uuid not null references clinical.functional_measurement(id),
  axis clinical.functional_axis not null,
  answered boolean not null default false,
  skipped boolean not null default false,
  skip_reason varchar(200),
  capability clinical.capability,
  restriction_code_list varchar(60),
  measured_hours numeric(4,2),
  measured_weight_kg numeric(6,2),
  derived_band varchar(20),
  derived_capability_code varchar(20),
  rounded_down boolean not null default false,
  below_lowest_band boolean not null default false,
  source clinical.axis_source not null,
  created_at timestamptz not null default now(),
  created_by uuid not null,
  unique (measurement_id, axis),
  constraint answered_or_skipped_not_both check (not (answered and skipped)),
  constraint capability_requires_answered check (capability is null or answered),
  constraint skip_requires_reason check (not skipped or skip_reason is not null),
  constraint quantity_required_when_limited
    check (capability not in ('limited_to','limited')
           or measured_hours is not null
           or measured_weight_kg is not null)
);

create table if not exists clinical.functional_grasping (
  id uuid primary key default gen_random_uuid(),
  measurement_id uuid not null references clinical.functional_measurement(id),
  side clinical.body_side not null,
  answered boolean not null default false,
  skipped boolean not null default false, skip_reason varchar(200),
  capability clinical.capability,
  prolonged boolean, repetitive boolean, vibration boolean, specify boolean,
  specific_restriction varchar(21),
  unique (measurement_id, side)
);

create table if not exists clinical.functional_reaching (
  id uuid primary key default gen_random_uuid(),
  measurement_id uuid not null references clinical.functional_measurement(id),
  side clinical.body_side not null, plane clinical.reach_plane not null,
  answered boolean not null default false,
  skipped boolean not null default false, skip_reason varchar(200),
  capability clinical.capability,
  unique (measurement_id, side, plane)
);

create table if not exists clinical.functional_environment (
  measurement_id uuid primary key references clinical.functional_measurement(id),
  answered boolean not null default false,
  skipped boolean not null default false, skip_reason varchar(200),
  restricted boolean,
  cold boolean, hot boolean, wet boolean, dry boolean,
  dust boolean, lighting boolean, noise boolean
);

create table if not exists clinical.functional_clinical_context (
  measurement_id uuid primary key references clinical.functional_measurement(id),
  hospitalized boolean,
  self_reported_pain boolean,
  medication_side_effects boolean
);

-- internal_restriction_code is created BEFORE internal_restriction so the FK resolves
-- (spec ordering note). Seeded in 012.
create table if not exists clinical.internal_restriction_code (
  code varchar(10) primary key,
  label varchar(120) not null,
  free_text_phrase varchar(200) not null,
  active boolean not null default true
);

create table if not exists clinical.internal_restriction (
  id uuid primary key default gen_random_uuid(),
  measurement_id uuid not null references clinical.functional_measurement(id),
  code varchar(10) not null references clinical.internal_restriction_code(code),
  note varchar(300),
  emit_to_board_free_text boolean not null default true
);

-- Legacy R code label table (spec Section 2.4). A derived label, never a stored fact.
create table if not exists clinical.legacy_restriction_label (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  r_code varchar(10) not null,
  has_underlying_measurement boolean not null default false,
  migrated_at timestamptz not null default now(),
  note text not null default
    'Legacy label. No measurement was ever captured. Do not infer one.'
);

-- ---------------------------------------------------------------------------
-- 2b. The axis map (reconciliation). resolve_axes reads this. Seeded in 012.
--     axis is a varchar dimension key that is a superset of the functional_axis enum:
--     it also names sided reaching, per hand grasping and environment, which are not
--     enum members but are dimensions the OIS forms measure.
-- ---------------------------------------------------------------------------
create table if not exists clinical.functional_axis_map (
  id uuid primary key default gen_random_uuid(),
  form_id varchar(6) not null,
  axis varchar(40) not null,
  ui_mapping varchar(30) not null,
  code_list_name varchar(80),
  code_set varchar(20) not null
    check (code_set in ('basic','extended','conditional','able_unable_only','weight','environment')),
  quantity_kind varchar(6) not null check (quantity_kind in ('none','hours','weight')),
  display_order int not null,
  source_version varchar(30) not null,
  unique (form_id, axis)
);
create index if not exists ix_axis_map_form on clinical.functional_axis_map(form_id, display_order);

-- ---------------------------------------------------------------------------
-- 3. Immutability enforcement (spec Section 2.5, acceptance criterion 9).
--    Defense in depth: revoke mutation grants AND block UPDATE and DELETE by trigger.
-- ---------------------------------------------------------------------------
revoke update, delete on
  clinical.functional_measurement,
  clinical.functional_axis_value,
  clinical.functional_grasping,
  clinical.functional_reaching,
  clinical.functional_environment,
  clinical.functional_clinical_context,
  clinical.internal_restriction,
  clinical.legacy_restriction_label
from anon, authenticated, service_role;

create or replace function clinical.block_mutation() returns trigger
language plpgsql as $block$
begin
  raise exception 'clinical measurement rows are immutable. % is not permitted on %',
    tg_op, tg_table_name;
end;
$block$;

do $imm$
declare t text;
begin
  foreach t in array array[
    'functional_measurement','functional_axis_value','functional_grasping',
    'functional_reaching','functional_environment','functional_clinical_context',
    'internal_restriction','legacy_restriction_label']
  loop
    execute format(
      'drop trigger if exists trg_block_mutation on clinical.%I; '
      'create trigger trg_block_mutation before update or delete on clinical.%I '
      'for each row execute function clinical.block_mutation();', t, t);
  end loop;
end
$imm$;

-- ---------------------------------------------------------------------------
-- 4. Append only band derivation audit (spec Section 2.6).
-- ---------------------------------------------------------------------------
create table if not exists clinical.band_derivation_audit (
  id uuid primary key default gen_random_uuid(),
  measurement_id uuid not null,
  axis clinical.functional_axis not null,
  measured_weight_kg numeric(6,2),
  measured_hours numeric(4,2),
  emitted_band varchar(20),
  emitted_capability_code varchar(20),
  rounded_down boolean not null,
  below_lowest_band boolean not null,
  derived_at timestamptz not null default now(),
  derived_by uuid not null
);
revoke update, delete on clinical.band_derivation_audit from anon, authenticated, service_role;
drop trigger if exists trg_block_mutation_audit on clinical.band_derivation_audit;
create trigger trg_block_mutation_audit before update or delete on clinical.band_derivation_audit
for each row execute function clinical.block_mutation();

-- ---------------------------------------------------------------------------
-- 5. Band derivation (spec Section 3.1). Deterministic, rounds down, both open ends.
-- ---------------------------------------------------------------------------
create or replace function clinical.derive_weight_band(measured_kg numeric)
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

-- ---------------------------------------------------------------------------
-- 6. Code list emission (spec Section 5). Emits from the pair (capability, code list).
--    A weight axis emits its band. A graded answer on a list that is neither Basic nor
--    Extended (an able or unable only axis) returns null so the caller raises it to a
--    human, never auto emits. Mirrors clinical/engine/measurement.mjs emitCode.
-- ---------------------------------------------------------------------------
create or replace function clinical.emit_code(
  p_capability clinical.capability,
  p_code_list  varchar(80),
  p_weight_band varchar(20))
returns varchar(20)
language plpgsql immutable as $emit$
begin
  if p_weight_band is not null and p_weight_band <> '' then
    return p_weight_band;            -- LIMITED | LIGHT | MEDIUM | HEAVY (Weight Category Code)
  end if;
  if p_capability = 'able'   then return 'ABLE'; end if;
  if p_capability = 'unable' then return 'UNABLE'; end if;
  if p_capability in ('limited','limited_to') then
    if p_code_list = 'Extended Work Restriction Codes' then return 'LIMITEDTO'; end if;
    if p_code_list = 'Basic Work Restriction Codes'    then return 'LIMITED';   end if;
    return null;                     -- able or unable only, or unknown: raise to a human
  end if;
  return null;                       -- restricted_from and NULL handled by the caller
end;
$emit$;

-- ---------------------------------------------------------------------------
-- 7. resolve_axes (spec Section 4, reconciled to read functional_axis_map).
--    Returns one row per axis dimension present on the form, in display order.
-- ---------------------------------------------------------------------------
create or replace function clinical.resolve_axes(p_form_id varchar)
returns table (axis varchar(40), ui_mapping varchar(30),
               code_list_name varchar(80), code_set varchar(20), quantity_kind varchar(6))
language sql stable as $resolve$
  select m.axis, m.ui_mapping, m.code_list_name, m.code_set, m.quantity_kind
  from clinical.functional_axis_map m
  where m.form_id = p_form_id
  order by m.display_order;
$resolve$;

-- ---------------------------------------------------------------------------
-- 8. No leak view (spec Section 6, acceptance criterion 8). The worker plan and the
--    employer duty match read only the derived band and code, never a raw measurement.
-- ---------------------------------------------------------------------------
create or replace view clinical.axis_emitted_only as
  select measurement_id, axis, derived_band, derived_capability_code
  from clinical.functional_axis_value;

commit;
