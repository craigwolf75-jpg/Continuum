-- Continuum Prompt 39 gap fill. Append only. Does NOT rebuild 011 or 012.
-- Does NOT rewrite Prompt 40 tables (form_definition, form_element, form_rule).
--
-- 011 already created the measurement tables, enums, derive_weight_band, emit_code,
-- resolve_axes (reading clinical.functional_axis_map because Prompt 40 form_element has
-- no axis column), legacy_restriction_label, REVOKE UPDATE DELETE, and the block_mutation
-- trigger. This migration adds the CHECK constraints that 011 left off grasping, reaching
-- and environment (skip reason, answered or skipped not both, grasping able or unable only)
-- and reasserts the immutability grants.
--
-- Idempotent, one transaction, hand applied by Gary. Claude does not live apply. No dashes.

begin;

-- ---------------------------------------------------------------------------
-- 1. Grasping, reaching, environment: the same answered or skipped discipline as
--    functional_axis_value. Grasping is able or unable only (Prompt 39 Section 2.2).
-- ---------------------------------------------------------------------------
do $grasping$
begin
  if to_regclass('clinical.functional_grasping') is null then
    raise exception 'clinical.functional_grasping is absent. Apply 011 first.';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'grasping_answered_or_skipped_not_both') then
    alter table clinical.functional_grasping
      add constraint grasping_answered_or_skipped_not_both check (not (answered and skipped));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'grasping_capability_requires_answered') then
    alter table clinical.functional_grasping
      add constraint grasping_capability_requires_answered check (capability is null or answered);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'grasping_skip_requires_reason') then
    alter table clinical.functional_grasping
      add constraint grasping_skip_requires_reason check (not skipped or skip_reason is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'grasping_able_or_unable_only') then
    alter table clinical.functional_grasping
      add constraint grasping_able_or_unable_only
      check (capability is null or capability in ('able','unable'));
  end if;
end
$grasping$;

do $reaching$
begin
  if to_regclass('clinical.functional_reaching') is null then
    raise exception 'clinical.functional_reaching is absent. Apply 011 first.';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reaching_answered_or_skipped_not_both') then
    alter table clinical.functional_reaching
      add constraint reaching_answered_or_skipped_not_both check (not (answered and skipped));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reaching_capability_requires_answered') then
    alter table clinical.functional_reaching
      add constraint reaching_capability_requires_answered check (capability is null or answered);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reaching_skip_requires_reason') then
    alter table clinical.functional_reaching
      add constraint reaching_skip_requires_reason check (not skipped or skip_reason is not null);
  end if;
end
$reaching$;

do $environment$
begin
  if to_regclass('clinical.functional_environment') is null then
    raise exception 'clinical.functional_environment is absent. Apply 011 first.';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'environment_answered_or_skipped_not_both') then
    alter table clinical.functional_environment
      add constraint environment_answered_or_skipped_not_both check (not (answered and skipped));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'environment_skip_requires_reason') then
    alter table clinical.functional_environment
      add constraint environment_skip_requires_reason check (not skipped or skip_reason is not null);
  end if;
end
$environment$;

-- ---------------------------------------------------------------------------
-- 2. Reassert immutability grants (011 already installed the trigger). Idempotent.
-- ---------------------------------------------------------------------------
revoke update, delete on
  clinical.functional_measurement,
  clinical.functional_axis_value,
  clinical.functional_grasping,
  clinical.functional_reaching,
  clinical.functional_environment,
  clinical.functional_clinical_context,
  clinical.internal_restriction,
  clinical.legacy_restriction_label,
  clinical.band_derivation_audit
from anon, authenticated, service_role;

commit;
