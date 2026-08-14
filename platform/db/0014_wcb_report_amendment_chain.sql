-- Continuum Core Platform Foundations (Prompt 51). Migration 0014: the wcb_report amendment chain
-- (Section 5.2), expand phase.
--
-- Section 5.2 specifies a redesigned wcb_report with an amendment and supersession chain. Taken
-- literally it conflicts with Prompt 42 and cannot be applied as a replacement, and Prompt 51
-- Section 0.1 ranks approved Prompt 39 to 46 behaviour above this prompt, so the conflict resolves in
-- Prompt 42's favour. Two specific conflicts:
--   1. Section 5.2's status set is draft, signed, superseded, withdrawn. The live report_status enum
--      (migration 016) is draft, signed, submitted, accepted, rejected, and Prompt 42's submission
--      lifecycle uses submitted, accepted and rejected. Those values are kept; superseded and
--      withdrawn are ADDED, never replacing the submission values.
--   2. Section 5.4 says the only permitted change to a signed report is the transition to superseded,
--      which platform.guard_signed_immutable enforces. Attaching that trigger would block the Prompt
--      42 transition signed to submitted. So the trigger is NOT attached here, and the strict
--      signed_fields_present check is NOT added, because both would break the live sign and submit
--      flow until the engine is updated to populate signed_by and signature_digest.
--
-- This migration is therefore the EXPAND phase only: it adds the Section 5.2 amendment chain columns
-- (nullable, so the existing sign flow is unaffected), adds the two new status values, and adds the
-- amendment_reason_present check (which only constrains a superseding report and so does not touch a
-- normal report). The CONTRACT phase (make the new columns NOT NULL, add signed_fields_present, and
-- attach a reconciled immutability trigger that permits both the submission lifecycle and the
-- supersede transition) is deferred: it needs the engine to dual write signed_by and
-- signature_digest, and it needs the Section 5.2 versus Prompt 42 status and immutability conflict
-- resolved (Prompt 51 Section 17, not a builder decision). Reported to Gary.
--
-- The tables are empty. Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

-- new status values (additive; add value cannot be used in the same transaction it is added, but this
-- migration does not use them, so it is safe outside an explicit transaction block).
alter type clinical.report_status add value if not exists 'superseded';
alter type clinical.report_status add value if not exists 'withdrawn';

-- Section 5.2 amendment chain columns, all nullable in the expand phase
alter table clinical.wcb_report add column if not exists location_id uuid references tenancy.location(id);
alter table clinical.wcb_report add column if not exists jurisdiction_code varchar(4);
alter table clinical.wcb_report add column if not exists person_id uuid;              -- the subject; anchors to the worker or mpi.person when the MPI lands
alter table clinical.wcb_report add column if not exists claim_reference varchar(40);
alter table clinical.wcb_report add column if not exists signed_by uuid;              -- the signing practitioner (dual write target)
alter table clinical.wcb_report add column if not exists signature_digest bytea;      -- Section 5.2 form of the existing snapshot_hash
alter table clinical.wcb_report add column if not exists supersedes_report_id uuid references clinical.wcb_report(id);
alter table clinical.wcb_report add column if not exists superseded_by_id uuid references clinical.wcb_report(id);
alter table clinical.wcb_report add column if not exists amendment_reason text;

-- a superseding report must state a reason (safe: a normal report has supersedes_report_id null)
do $ck$
begin
  if not exists (select 1 from pg_constraint where conname = 'ck_wcb_report_amendment_reason') then
    alter table clinical.wcb_report
      add constraint ck_wcb_report_amendment_reason
      check (supersedes_report_id is null or amendment_reason is not null);
  end if;
end
$ck$;

insert into platform.schema_migration (version) values ('0014')
  on conflict (version) do nothing;
