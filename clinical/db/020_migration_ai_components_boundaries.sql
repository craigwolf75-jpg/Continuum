-- Continuum Prompt 44 gap fill: degraded flag, recording/scribe consent A (flag and
-- version identifier only), and audio retention config at 30 days pending counsel.
--
-- This is append only. It does not rewrite 016 (consent) or 017 (provenance and
-- ai_generation). Schema is a human gate: Claude does not live apply. Gary applies
-- by hand. No dashes anywhere.
--
-- Prompt 44 Consent A is recording and scribe, which is DISTINCT from Prompt 43
-- clinical.consent.consent_a_granted (clinical and board consent). The new columns
-- are named consent_recording_* so the two are not overloaded. Counsel owns the
-- wording; this migration stores no visitor facing copy.
--
-- APPLY ORDER: after 017 (needs clinical.consent and audit.ai_generation). Idempotent,
-- one transaction.

begin;

-- ---------------------------------------------------------------------------
-- 1. Recording and scribe consent A: flag and version identifier only.
-- ---------------------------------------------------------------------------
do $consent$
begin
  if to_regclass('clinical.consent') is null then
    raise exception 'clinical.consent is absent. Apply 016 first.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'consent' and column_name = 'consent_recording_granted'
  ) then
    alter table clinical.consent
      add column consent_recording_granted boolean not null default false;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'consent' and column_name = 'consent_recording_at'
  ) then
    alter table clinical.consent
      add column consent_recording_at timestamptz;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'clinical' and table_name = 'consent' and column_name = 'consent_recording_version'
  ) then
    alter table clinical.consent
      add column consent_recording_version varchar(40);
  end if;
end
$consent$;

-- ---------------------------------------------------------------------------
-- 2. Global degraded flag. One row. Disables all eight components at once.
--    The banner audience is the clinic administrator, not a practitioner.
-- ---------------------------------------------------------------------------
create table if not exists clinical.ai_runtime (
  id smallint primary key default 1 check (id = 1),
  degraded boolean not null default false,
  degraded_at timestamptz,
  degraded_reason varchar(200),
  updated_at timestamptz not null default now()
);

insert into clinical.ai_runtime (id, degraded)
values (1, false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Audio retention. Specified as 30 days pending counsel (Section 9). The
--    CHECK refuses any other figure.
-- ---------------------------------------------------------------------------
create table if not exists clinical.ai_audio_retention (
  id smallint primary key default 1 check (id = 1),
  retention_days integer not null default 30 check (retention_days = 30),
  pending_counsel boolean not null default true
);

insert into clinical.ai_audio_retention (id, retention_days, pending_counsel)
values (1, 30, true)
on conflict (id) do nothing;

commit;
