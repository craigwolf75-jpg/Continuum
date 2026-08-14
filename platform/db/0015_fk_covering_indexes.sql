-- Continuum Core Platform Foundations (Prompt 51). Migration 0015: foreign key covering indexes.
--
-- Resolves the Supabase performance advisor finding unindexed_foreign_keys on every foreign key
-- in the tenancy, consent, config, events, audit and clinical schemas that lacks a covering index.
-- A foreign key with no index on its referencing columns forces a sequential scan on the child
-- table when the parent row is updated or deleted, and denies the planner an index path for joins
-- in that direction. The fix is a plain btree index whose leading columns are the foreign key
-- columns in their constraint order.
--
-- The employer schema keys are indexed in the companion migration 0016, kept separate so that no
-- single migration references both the clinical and employer schemas (the separation wall check).
--
-- Two groups are covered here: the tenancy retrofit keys added by migrations 0010 to 0014
-- (organisation_id on the clinical, audit, config and events tables, location_id on clinic and
-- wcb_report, and the wcb_report amendment chain and consent supersession keys), and pre existing
-- physician stream keys from clinical/db that shipped without a covering index (worker_id,
-- practitioner_id, report_id, code, measurement_id, previous_submission_id, and the events outbox
-- event_id). Indexing them is purely additive and non breaking.
--
-- Idempotent (create index if not exists), one transaction, ALTER never drop. No table structure
-- changes. Safe to apply any time after 0014. No em dashes or en dashes anywhere.

-- audit
create index if not exists ix_ai_generation_organisation_id on audit.ai_generation ("organisation_id");
create index if not exists ix_event_organisation_id on audit.event ("organisation_id");

-- clinical
create index if not exists ix_band_derivation_audit_organisation_id on clinical.band_derivation_audit ("organisation_id");
create index if not exists ix_clinic_location_id on clinical.clinic ("location_id");
create index if not exists ix_clinic_organisation_id on clinical.clinic ("organisation_id");
create index if not exists ix_clinic_batch_schedule_organisation_id on clinical.clinic_batch_schedule ("organisation_id");
create index if not exists ix_consent_organisation_id on clinical.consent ("organisation_id");
create index if not exists ix_functional_axis_value_organisation_id on clinical.functional_axis_value ("organisation_id");
create index if not exists ix_functional_clinical_context_organisation_id on clinical.functional_clinical_context ("organisation_id");
create index if not exists ix_functional_environment_organisation_id on clinical.functional_environment ("organisation_id");
create index if not exists ix_functional_grasping_organisation_id on clinical.functional_grasping ("organisation_id");
create index if not exists ix_functional_measurement_organisation_id on clinical.functional_measurement ("organisation_id");
create index if not exists ix_functional_measurement_practitioner_id on clinical.functional_measurement ("practitioner_id");
create index if not exists ix_functional_measurement_report_id on clinical.functional_measurement ("report_id");
create index if not exists ix_functional_reaching_organisation_id on clinical.functional_reaching ("organisation_id");
create index if not exists ix_internal_restriction_organisation_id on clinical.internal_restriction ("organisation_id");
create index if not exists ix_internal_restriction_code on clinical.internal_restriction ("code");
create index if not exists ix_internal_restriction_measurement_id on clinical.internal_restriction ("measurement_id");
create index if not exists ix_legacy_restriction_label_organisation_id on clinical.legacy_restriction_label ("organisation_id");
create index if not exists ix_measurement_draft_organisation_id on clinical.measurement_draft ("organisation_id");
create index if not exists ix_measurement_draft_practitioner_id on clinical.measurement_draft ("practitioner_id");
create index if not exists ix_measurement_draft_report_id on clinical.measurement_draft ("report_id");
create index if not exists ix_wcb_case_organisation_id on clinical.wcb_case ("organisation_id");
create index if not exists ix_wcb_case_worker_id on clinical.wcb_case ("worker_id");
create index if not exists ix_wcb_report_organisation_id on clinical.wcb_report ("organisation_id");
create index if not exists ix_wcb_report_location_id on clinical.wcb_report ("location_id");
create index if not exists ix_wcb_report_practitioner_id on clinical.wcb_report ("practitioner_id");
create index if not exists ix_wcb_report_superseded_by_id on clinical.wcb_report ("superseded_by_id");
create index if not exists ix_wcb_report_supersedes_report_id on clinical.wcb_report ("supersedes_report_id");
create index if not exists ix_wcb_report_field_organisation_id on clinical.wcb_report_field ("organisation_id");
create index if not exists ix_wcb_submission_organisation_id on clinical.wcb_submission ("organisation_id");
create index if not exists ix_wcb_submission_previous_submission_id on clinical.wcb_submission ("previous_submission_id");
create index if not exists ix_worker_organisation_id on clinical.worker ("organisation_id");

-- config
create index if not exists ix_feature_flag_rule_organisation_id on config.feature_flag_rule ("organisation_id");
create index if not exists ix_value_organisation_id on config.value ("organisation_id");

-- consent
create index if not exists ix_ledger_entry_superseded_by_id on consent.ledger_entry ("superseded_by_id");
create index if not exists ix_ledger_entry_text_version_id on consent.ledger_entry ("text_version_id");

-- events
create index if not exists ix_outbox_event_id on events.outbox ("event_id");
create index if not exists ix_outbox_organisation_id on events.outbox ("organisation_id");

-- tenancy (composite key, indexed in constraint order)
create index if not exists ix_location_region_id_organisation_id on tenancy.location ("region_id", "organisation_id");

insert into platform.schema_migration (version) values ('0015')
  on conflict (version) do nothing;
