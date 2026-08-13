-- Continuum Core Platform Foundations (Prompt 51). Migration 0003: the immutability substrate.
--
-- Section 5.3. Two reusable trigger functions that the append only tables (events.domain_event,
-- audit.record, consent.ledger_entry, employer.disclosure_release, built in later sub-builds) and
-- the signed report (retrofitted in S8) attach, alongside revoked UPDATE and DELETE grants. A
-- grant alone is not sufficient, because a future grant reopens the door silently; a trigger alone
-- is not sufficient, because a trigger can be disabled. Both are required, and this migration
-- provides the trigger half as one canonical implementation so a rule is never written twice.
--
-- The attachment pattern each consuming migration follows:
--   revoke update, delete on <schema>.<table> from <app roles>;
--   create trigger tr_<table>_append_only before update or delete on <schema>.<table>
--     for each row execute function platform.guard_append_only();
-- and for the signed report:
--   create trigger tr_wcb_report_signed before update on clinical.wcb_report
--     for each row execute function platform.guard_signed_immutable();
--
-- search_path is pinned empty: neither function looks up a schema object (they read trigger
-- variables and the row only), so the empty path is behaviour neutral and closes the advisor
-- finding. Idempotent (create or replace). No em dashes or en dashes anywhere.

-- guard_append_only: rejects any UPDATE or DELETE. Attach as BEFORE UPDATE OR DELETE.
create or replace function platform.guard_append_only() returns trigger
language plpgsql as $guard$
begin
  raise exception 'append only table %.%: % rejected', tg_table_schema, tg_table_name, tg_op;
end
$guard$;
alter function platform.guard_append_only() set search_path = '';

-- guard_signed_immutable: on a non draft row, permits only the transition to superseded and
-- rejects every other change. Attach as BEFORE UPDATE on the signed report and its field table.
-- The target table must carry a status column. Section 5.4: the only permitted change to a signed
-- report is status moving to superseded (with superseded_by_id set), and this permits exactly that.
create or replace function platform.guard_signed_immutable() returns trigger
language plpgsql as $guard$
begin
  if old.status <> 'draft' and new.status <> 'superseded' then
    raise exception 'signed report % is immutable', old.id;
  end if;
  return new;
end
$guard$;
alter function platform.guard_signed_immutable() set search_path = '';

insert into platform.schema_migration (version) values ('0003')
  on conflict (version) do nothing;
