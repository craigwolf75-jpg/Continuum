-- Continuum Core Platform Foundations (Prompt 51). Migration 0016: employer foreign key covering
-- indexes.
--
-- Companion to migration 0015. It carries the employer schema half of the unindexed_foreign_keys
-- fix on its own so that no single platform migration references both the clinical and employer
-- schemas in SQL, which the separation wall check forbids. Same rationale as 0015: a foreign key
-- with no index on its referencing columns forces a sequential scan on the child table when the
-- parent row is updated or deleted.
--
-- Covers the organisation_id retrofit keys on the two mutable employer tables (0013). Idempotent
-- (create index if not exists), one transaction, ALTER never drop. No table structure changes.
-- Safe to apply any time after 0013. No em dashes or en dashes anywhere.

create index if not exists ix_duty_match_line_organisation_id on employer.duty_match_line ("organisation_id");
create index if not exists ix_published_restriction_set_organisation_id on employer.published_restriction_set ("organisation_id");

insert into platform.schema_migration (version) values ('0016')
  on conflict (version) do nothing;
