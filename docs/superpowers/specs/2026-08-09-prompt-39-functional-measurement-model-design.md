# Prompt 39: Functional Measurement Model. Migration and Resolver Spec.

Status: DESIGN ONLY. Nothing here is applied. Ready to run once the parent objects in Section 0 exist.
Date: 2026-08-09. Source of truth: CONTINUUM PROMPT 39 (The Functional Measurement Model).
House rule: no em dashes or en dashes anywhere. Commas, colons, parentheses only.

This document is the concrete build for Prompt 39 Sections 2 through 7: the measurement tables,
band derivation at signature, the R code migration, the axis resolver, and the code list emission
mapping. It does NOT build screens or the form engine (Prompt 39 Section 10).

---

## 0. Preconditions. This migration MUST NOT run until all of these exist.

Verified absent on 2026-08-09 against project agzhnmunodrhsjbogzae (ca-central-1):

- schema `clinical` (absent)
- `clinical.clinic(id)` (absent)
- `clinical.wcb_case(id)` (absent)
- `clinical.wcb_report(id)` with a `snapshot_hash` column (absent)
- `clinical.practitioner(id)` (absent)
- `clinical.form_definition` and `clinical.form_element` (absent; built by the Form Engine prompt)

The migration below opens with a preflight block that RAISES and aborts if any parent is missing, so
it can never create a half wired schema. Run the physician platform foundation prompts and the Form
Engine prompt first, then run this.

Open architecture decision (not decided here): whether the clinical PHI schema co locates in
agzhnmunodrhsjbogzae (today the employer, worker and WCB backend) or lives in a dedicated project.
PHI plus the SaMD regulatory surface make this an explicit decision. This spec is project neutral;
it assumes a single Postgres with a `clinical` schema and residency inside Canada.

---

## 1. Regulatory invariants this build enforces (Prompt 39 Section 0A)

1. No system, model or heuristic ever writes `functional_axis_value.capability` or any quantity. Every
   such value carries a `source` of `measured`, `carried_forward` or `bulk_marked_able`, and each of
   those three represents a human action. There is no code path that inserts a capability without one.
2. `capability` is NULLABLE and NULL means not answered. Unassessed never becomes `able`.
3. The band is derived by the system ONLY at signature, never at entry.
4. Banned vocabulary (predict, diagnose except the board field name, recommend a restriction, risk or
   severity score, auto assess, smart default, inferred capability) appears in no identifier, enum,
   comment, or emitted string in this build. Required framing words are used instead.
5. The raw measurement never leaves Continuum. Worker and employer surfaces receive the derived band.

---

## 2. Migration. Idempotent and additive. Apply as one transaction.

File name when materialized: `clinical/migrations/2026xxxx_functional_measurement_model.sql`
(kept OUT of the existing `deploy/` static site; this is the physician platform schema).

### 2.0 Preflight gate

```sql
do $preflight$
begin
  if to_regnamespace('clinical') is null then
    raise exception 'clinical schema is absent. Run the physician platform foundation first.';
  end if;
  if to_regclass('clinical.clinic') is null
     or to_regclass('clinical.wcb_case') is null
     or to_regclass('clinical.wcb_report') is null
     or to_regclass('clinical.practitioner') is null then
    raise exception 'A parent table (clinic, wcb_case, wcb_report, practitioner) is absent.';
  end if;
  if to_regclass('clinical.form_definition') is null
     or to_regclass('clinical.form_element') is null then
    raise exception 'form_definition or form_element is absent. Run the Form Engine prompt first.';
  end if;
end
$preflight$;
```

### 2.1 Enums. Guarded so re running is safe.

```sql
do $enums$
begin
  if not exists (select 1 from pg_type where typname='capability') then
    create type clinical.capability as enum ('able','limited_to','limited','unable','restricted_from');
  end if;
  if not exists (select 1 from pg_type where typname='axis_source') then
    create type clinical.axis_source as enum ('measured','carried_forward','bulk_marked_able');
  end if;
  if not exists (select 1 from pg_type where typname='body_side') then
    create type clinical.body_side as enum ('left','right','both');
  end if;
  if not exists (select 1 from pg_type where typname='reach_plane') then
    create type clinical.reach_plane as enum ('above','below');
  end if;
  if not exists (select 1 from pg_type where typname='functional_axis') then
    create type clinical.functional_axis as enum (
      'sitting','standing','walking','bending','twisting','kneeling_squatting',
      'climbing','driving','pushing_pulling',
      'lifting_general','overhead_reaching',
      'lifting_floor_to_waist','lifting_waist_to_shoulder','lifting_above_shoulder');
  end if;
end
$enums$;
```

Note: the enums are placed in the `clinical` schema (not public) to keep the physician platform
namespace self contained. The original prompt wrote them unqualified; qualifying them is the only
deviation and it does not change any value.

### 2.2 Core tables

Verbatim from Prompt 39 Section 2.2, with the two documented deviations (enums schema qualified,
tables schema qualified). No column added, removed, or renamed. Immutability of
`functional_measurement`: NO `updated_at`, NO `deleted_at`, and UPDATE and DELETE are revoked and
trigger blocked in Section 2.5.

```sql
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
```

Ordering note: `internal_restriction_code` is created BEFORE `internal_restriction` so the foreign key
resolves. The original prompt listed them in the reverse order; creating the referenced table first is
the only reordering and it is required for the migration to run.

### 2.3 Seed the eight internal restriction codes

```sql
insert into clinical.internal_restriction_code (code, label, free_text_phrase) values
  ('R05','No repetitive lifting','No repetitive lifting'),
  ('R10','No use of force or physical intervention','No use of force or physical intervention'),
  ('R11','No restraint or take downs','No restraint or take downs'),
  ('R13','No night shift or shift work','No night shift or rotating shift work'),
  ('R18','Concussion restrictions','Concussion protocol restrictions apply, see comments'),
  ('R19','Psychological restrictions','Psychological injury restrictions apply, see comments'),
  ('R20','Post surgical restrictions','Post surgical restrictions apply, see comments'),
  ('R22','Weight bearing restriction','Weight bearing restriction, see comments')
on conflict (code) do update
  set label = excluded.label,
      free_text_phrase = excluded.free_text_phrase,
      active = true;
```

Each phrase is emitted into the board element "Other restrictions or additional comments" (2048 char
limit), a legitimate use of that field.

### 2.4 Legacy R code label table (Prompt 39 Section 5)

```sql
create table if not exists clinical.legacy_restriction_label (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  r_code varchar(10) not null,
  has_underlying_measurement boolean not null default false,
  migrated_at timestamptz not null default now(),
  note text not null default
    'Legacy label. No measurement was ever captured. Do not infer one.'
);
```

### 2.5 Immutability enforcement (acceptance criterion 9)

`functional_measurement` and every axis and detail table are insert only. Defense in depth: revoke the
grants the application role holds, and block UPDATE and DELETE with a trigger so the guarantee holds
even if a grant is re added later.

```sql
-- Revoke mutation from the roles the app uses. Superuser (postgres) is intentionally not the app path.
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

-- Trigger block. Raises on any UPDATE or DELETE regardless of role, for the measurement spine.
create or replace function clinical.block_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'clinical measurement rows are immutable. % is not permitted on %',
    tg_op, tg_table_name;
end;
$$;

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
```

The derived_band and derived_capability_code columns on `functional_axis_value` are populated in the
SAME insert that creates the row at signature (Section 4), never by a later UPDATE. Entry time inserts
leave them NULL. See Section 4.4 for how a signature writes derived values without an UPDATE.

### 2.6 Append only band derivation audit (Prompt 39 Section 4.2)

The existing `public.audit_log` is currently mutable (service_role holds UPDATE and DELETE). Rather
than weaken residency by mixing PHI derivations into it, this build adds a dedicated append only audit
in the clinical schema.

```sql
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
```

---

## 3. Band derivation (Prompt 39 Section 4)

### 3.1 The weight band function. Deterministic. Rounds down. Both open ends handled.

```sql
create or replace function clinical.derive_weight_band(measured_kg numeric)
returns table (band varchar(20), rounded_down boolean, below_lowest_band boolean)
language plpgsql immutable as $$
begin
  if measured_kg is null then
    band := null; rounded_down := false; below_lowest_band := false; return next; return;
  end if;
  if measured_kg < 5 then
    band := 'LIMITED'; rounded_down := false; below_lowest_band := true;   -- under lowest band
  elsif measured_kg = 5 then
    band := 'LIMITED'; rounded_down := false; below_lowest_band := false;
  elsif measured_kg < 10 then
    band := 'LIMITED'; rounded_down := true;  below_lowest_band := false;  -- over 5, under 10
  elsif measured_kg = 10 then
    band := 'LIGHT';   rounded_down := false; below_lowest_band := false;
  elsif measured_kg < 20 then
    band := 'LIGHT';   rounded_down := true;  below_lowest_band := false;  -- over 10, under 20
  elsif measured_kg = 20 then
    band := 'MEDIUM';  rounded_down := false; below_lowest_band := false;
  else
    band := 'HEAVY';   rounded_down := false; below_lowest_band := false;  -- over 20, not a rounding case
  end if;
  return next;
end;
$$;
```

Permitted outputs are exactly the board Weight Category Codes: LIMITED (5 kg), LIGHT (10 kg),
MEDIUM (20 kg), HEAVY (over 20 kg). Round down always: a worker told they can lift less is
inconvenienced; a worker told they can lift more is injured.

### 3.2 Which value governs downstream (Prompt 39 Section 4.3)

The derived band governs every downstream output. The raw `measured_weight_kg` and `measured_hours`
never leave Continuum. Enforced structurally in Section 6: the worker plan payload and the employer
duty match payload are built from a projection that exposes `derived_band` and
`derived_capability_code` only, and a schema test fails the build if a raw column name appears in
either payload.

### 3.3 When derivation runs

At signature, inside the same transaction that sets `clinical.wcb_report.snapshot_hash`. Not at entry
(the practitioner must first see and confirm what will be emitted). Not after submission (the signed
snapshot must reproduce the submitted payload exactly).

### 3.4 The signature routine writes derived values without an UPDATE

Because `functional_axis_value` is insert only, a draft measurement and a signed measurement are two
different `functional_measurement` versions, OR the axis rows are written once at signature with the
derived values already computed. This spec chooses the second: entry builds a working set in an
unsigned draft store (owned by the Form Engine and Screens prompts, out of scope here), and the
signature routine performs a single INSERT per axis row into `functional_axis_value` with
`capability`, quantities, and the derived columns all present. The signature routine:

```
sign_measurement(measurement_id, practitioner_id):
  begin transaction
    for each axis row in the draft working set:
      (band, rounded_down, below_lowest) = derive_weight_band(measured_weight_kg)  -- weight axes
      derived_capability_code = emit_code(capability, restriction_code_list, band) -- Section 5
      insert into clinical.functional_axis_value (... capability, measured_*, derived_band=band,
        derived_capability_code, rounded_down, below_lowest_band, source, created_by) values (...)
      insert into clinical.band_derivation_audit (measurement_id, axis, measured_weight_kg,
        measured_hours, emitted_band=band, emitted_capability_code=derived_capability_code,
        rounded_down, below_lowest_band, derived_by=practitioner_id)
    set clinical.wcb_report.snapshot_hash = <hash of the emitted payload>
  commit
```

No axis capability or quantity is authored here; the routine only copies the practitioner authored
values from the draft and computes the band and the emitted code from them.

---

## 4. resolve_axes (Prompt 39 Section 3)

### 4.1 Contract

```
resolve_axes(form_id) -> AxisSpec[]
  AxisSpec = { axis, ui_mapping, code_list_name, quantity_kind }
  quantity_kind in ( none | hours | weight )
```

`resolve_axes` reads `clinical.form_element` for the form's `form_definition` and returns one AxisSpec
per axis present on that form. `quantity_kind` is determined by whether a paired quantity element
exists on that form for that axis (an hours element, a weight Max of element, or neither).

### 4.2 Dependency on the Form Engine schema (reconcile before build)

The exact column names of `clinical.form_element` are owned by the Form Engine prompt and were absent
on 2026-08-09. This spec assumes `form_element` exposes, per row: the owning form (via
`form_definition`), the mapped `functional_axis`, the code list name
(Basic Work Restriction Codes or Extended Work Restriction Codes), and enough to detect a paired
quantity element (its unit: hours or weight). If the Form Engine names differ, only the SELECT below
changes; the returned AxisSpec contract does not.

### 4.3 Reference function

```sql
create or replace function clinical.resolve_axes(p_form_id varchar)
returns table (axis clinical.functional_axis, ui_mapping text,
               code_list_name varchar(60), quantity_kind varchar(6))
language sql stable as $$
  select fe.axis,
         fe.ui_mapping,
         fe.code_list_name,
         case
           when fe.quantity_unit = 'hours'  then 'hours'
           when fe.quantity_unit = 'weight' then 'weight'
           else 'none'
         end as quantity_kind
  from clinical.form_element fe
  join clinical.form_definition fd on fd.id = fe.form_definition_id
  where fd.form_id = p_form_id
    and fe.axis is not null
  order by fe.display_order;
$$;
```

### 4.4 The per form axis matrix this must reproduce (ground truth from the board workbook)

resolve_axes is correct only if it reproduces this table. The build includes a test that asserts it.

| Axis group | C050E and C151 | C050S and C151S |
|---|---|---|
| sitting, standing, walking, driving | Extended codes plus hours | Extended codes plus hours |
| bending, twisting, kneeling_squatting, climbing | Basic codes, quantity_kind none | Extended codes plus hours |
| pushing_pulling | Basic code, quantity_kind none | Extended code plus weight (Max of) |
| lifting | lifting_general only, one Max of (weight) | lifting_floor_to_waist, lifting_waist_to_shoulder, lifting_above_shoulder, each weight |
| reaching | overhead_reaching only, Basic, quantity_kind none | four sided reaching values (functional_reaching), above and below each shoulder |
| grasping | does not exist | functional_grasping, six fields per hand, twelve total |
| environment | does not exist | functional_environment, parent flag plus seven booleans |

Consequences the resolver and emitter must honor:
- Never hard code the axis set. A hard coded C050S shape cannot produce a C050E, the form every non
  OIS clinic files.
- An axis present in the form definition but absent from resolve_axes output fails the build of that
  form (Prompt 39 Section 6), it is never silently omitted.

---

## 5. Code list emission (Prompt 39 Section 3, the second trap)

The two code lists emit different strings for the same practitioner intent, and LIMITED is overloaded.

- Basic Work Restriction Codes emit: ABLE, UNABLE, LIMITED
- Extended Work Restriction Codes emit: ABLE, UNABLE, LIMITEDTO
- LIMITED is separately a Weight Category Code meaning 5 kg (11 lb)

So bending answered limited emits LIMITED on a C050E and LIMITEDTO on a C050S. Therefore
`restriction_code_list` is stored on every axis row and the emitted string is computed from the pair
(capability, code_list), never from a single internal enum.

```sql
create or replace function clinical.emit_code(
  p_capability clinical.capability,
  p_code_list  varchar(60),
  p_weight_band varchar(20))         -- only used when the axis is a weight axis
returns varchar(20)
language plpgsql immutable as $$
begin
  -- A weight axis emits the Weight Category Code (the band), not a restriction code.
  if p_weight_band is not null then
    return p_weight_band;            -- LIMITED | LIGHT | MEDIUM | HEAVY
  end if;
  if p_capability = 'able'   then return 'ABLE'; end if;
  if p_capability = 'unable' then return 'UNABLE'; end if;
  if p_capability in ('limited','limited_to') then
    if p_code_list = 'Extended Work Restriction Codes' then return 'LIMITEDTO'; end if;
    return 'LIMITED';                -- Basic list
  end if;
  -- restricted_from and NULL are handled by the caller (skipped or not answered), never emitted here.
  return null;
end;
$$;
```

Note the deliberate collision handling: on a weight axis, LIMITED as a Weight Category Code (5 kg) is
emitted via `p_weight_band`; on a non weight axis, LIMITED or LIMITEDTO is emitted via the code list.
The same string LIMITED can therefore appear in a payload with two distinct meanings, which is correct
per the board and is exactly why one internal enum must never map to one output string.

---

## 6. What must fail loudly (Prompt 39 Section 6). Enforcement map.

| Condition | Where enforced | Behavior |
|---|---|---|
| Axis neither answered nor skipped at signature | signature routine, server side | Block signature, list axes by name. Criterion 14. |
| Measured weight above 100 kg | signature routine | Warn, do not block. Practitioner may confirm. |
| Measured hours exceeds work_hours_per_day | signature routine | Block, name both values. |
| Axis in form definition but absent from resolve_axes | form build test | Fail that form build, never silently omit. |
| Duty with no demand rating on a restricted axis | duty match (out of scope here) | conditional, route to coordinator. Never safe. |
| Carried forward measurement older than 90 days | signature routine | Mark stale, require explicit confirmation. |
| Legacy R code with no underlying measurement reaching duty match | duty match | Suppress match, surface reason. Do not guess. |

Constraints already at the database (from Section 2.2): answered_or_skipped_not_both,
capability_requires_answered, skip_requires_reason, quantity_required_when_limited. These make three
axis states distinguishable (not answered = capability NULL and answered false and skipped false;
skipped = skipped true with a reason; answered able = answered true, capability able). Criterion 10.

Structural no leak guard (criterion 8): the worker plan and employer duty match read from a view that
selects only `derived_band` and `derived_capability_code`, and a schema level test fails the build if
any of `measured_weight_kg`, `measured_hours`, or `capability` appears in either payload projection.

```sql
create or replace view clinical.axis_emitted_only as
  select measurement_id, axis, derived_band, derived_capability_code
  from clinical.functional_axis_value;
```

---

## 7. R code migration (Prompt 39 Section 5)

Migrate every existing legacy record as a derived label, never a stored fact, with
`has_underlying_measurement = false` and no fabricated measurement.

```sql
-- Illustrative. Source is the legacy label store; on 2026-08-09 the live label store is
-- public.injuries.current_restrictions (text) and public.light_duties. The exact source mapping is
-- confirmed at migration time. Nothing here writes a functional_measurement or a capability.
insert into clinical.legacy_restriction_label (case_id, r_code, has_underlying_measurement)
select l.case_id, l.r_code, false
from <legacy_label_source> l
on conflict do nothing;
```

The old labels (10, 20, 25, 50 lb) do not map to the board bands (11, 22, 44, over 44) safely or
losslessly. 25 lb collides: down to 22 loses three pounds, up to 44 is unsafe. There is no safe
lossless mapping, which is the reason this prompt exists. Legacy labels stay visibly marked as
historical in the interface (Screens prompt) and are never presented as a measurement.

---

## 8. Acceptance criteria (Prompt 39 Section 8) with the proving query or payload

1. Every axis row has source in (measured, carried_forward, bulk_marked_able) and zero rows have a
   system authored capability.
   `select count(*) from clinical.functional_axis_value where source is null; -- expect 0`
   plus a code review assertion that no insert path sets capability without a human source.
2. `select axis from clinical.resolve_axes('C050E');` returns lifting_general and overhead_reaching,
   and NOT the three lifting planes, grasping, sided reaching, or environment.
3. `select axis from clinical.resolve_axes('C050S');` returns the three lifting planes, four sided
   reaching values, grasping per hand, and environment.
4. Bending on C050E emits LIMITED; the same intent on C050S emits LIMITEDTO. Proven in the generated
   payload via `clinical.emit_code`, not the interface.
5. `select * from clinical.derive_weight_band(8);` returns LIMITED, rounded_down true; and the
   band_derivation_audit row for that axis carries 8, LIMITED, rounded_down true.
6. `select * from clinical.derive_weight_band(25);` returns HEAVY, rounded_down false.
7. `select * from clinical.derive_weight_band(3);` returns LIMITED, below_lowest_band true.
8. Worker plan payload and employer duty match payload both contain the band and no raw measurement.
   Schema test fails the build if measured_weight_kg, measured_hours, or capability appears.
9. `update clinical.functional_measurement set version = version where false;` and any real UPDATE
   both fail: revoked grant for the app role, and the trg_block_mutation trigger raises.
10. Three axis states distinguishable by query (see Section 6 constraint set).
11. Skipped axis has a non null reason: skip_requires_reason constraint.
12. Migrating a legacy R code yields has_underlying_measurement false and no fabricated measurement:
    `select count(*) from clinical.legacy_restriction_label where has_underlying_measurement; -- 0`.
13. Network failure during entry loses no data. Owned by the Form Engine and Screens prompts (draft
    store and queue). Out of scope here; noted so it is not assumed done by this migration.
14. Signature blocked while any axis is neither answered nor skipped, enforced server side, verified by
    calling the signature API directly with the interface bypassed.

---

## 9. Open items carried forward (Prompt 39 Section 9). Not resolved here.

1. Board contradiction on C050S required fields versus interface rule SR2. Treat an element hidden by
   an applicable rule as exempt from the required check and log every exemption. Craig is asking the
   board.
2. Role code NP absent from the board nine Practitioner Role Codes. Block NP configuration with an
   explanatory message. Do not work around.
3. Ambient recording retention specified as 30 days pending counsel. Do not implement a different
   figure.
4. Whether practitioner_sees_all defaulting true is correct under the Health Information Act. Build the
   flag, default true, flag the question.
5. Who the named human is for a 2 AM batch failure in a five person clinic. Build the notification,
   leave the recipient configurable.

---

## 10. Deviations from the verbatim prompt, listed for review

1. Enums and tables are schema qualified into `clinical` (prompt wrote some unqualified). No value
   changed.
2. `internal_restriction_code` is created before `internal_restriction` (prompt listed the reverse) so
   the foreign key resolves.
3. A dedicated append only `clinical.band_derivation_audit` is introduced rather than reusing
   `public.audit_log`, because the latter is currently mutable by service_role and mixing PHI
   derivations into it is undesirable. Hardening public.audit_log is recommended separately.
4. Immutability is enforced with BOTH revoked grants and a blocking trigger (defense in depth) to make
   criterion 9 hold even if a grant is later re added.
5. `resolve_axes` and `form_element` column names are provisional pending the Form Engine schema; only
   the SELECT changes if names differ, never the AxisSpec contract.

## 11. Not built here (Prompt 39 Section 10)

Screens (Screens prompt) and the form engine, code list loader, and validation (Form Engine prompt).
The draft working set consumed by the signature routine in Section 3.4 is owned by those prompts.
