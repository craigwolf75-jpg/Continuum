-- Continuum Core Platform Foundations (Prompt 51). Migration 0000: platform metadata.
--
-- Establishes the platform schema and a migration ledger, so every platform migration is
-- recorded (guardrail c, Prompt 50a). The platform schema holds no identifiable worker,
-- patient or tenant data, only build metadata, so it is out of tenant coverage enforcement
-- by Decision 2 (scope is by schema, and this schema carries no such data).
--
-- Idempotent, ordered, ALTER never drop (guardrail c). Applied through the Management API by
-- Gary after the burned token is rotated; proven in CI against a postgres 15 service container.
-- No em dashes or en dashes anywhere (Prompt 51 rule 0.4.5).

create schema if not exists platform;

create table if not exists platform.schema_migration (
  version     varchar(20) primary key,
  applied_at  timestamptz not null default now());

insert into platform.schema_migration (version) values ('0000')
  on conflict (version) do nothing;
