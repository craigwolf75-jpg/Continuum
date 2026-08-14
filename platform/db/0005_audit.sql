-- Continuum Core Platform Foundations (Prompt 51). Migration 0005: the audit record.
--
-- Section 7. The event log answers what happened to the data; the audit record answers who saw
-- what, when, and under what authority, which is the question a privacy commissioner asks. Reads
-- are audited, not only writes, because unauthorised viewing is the most common health privacy
-- incident and a write only trail cannot detect it. Denials are audited. A disclosure with no
-- lawful basis fails closed before it is attempted.
--
-- Tamper evidence (Section 7.4): record_sequence, previous_digest and record_digest form a hash
-- chain per organisation, where
--   record_digest = sha256(record_sequence || previous_digest || canonical_serialisation(row)).
-- The chain, the revoked grants and the append only trigger are three independent controls: any
-- one can be circumvented by a sufficiently privileged actor, but not all three without leaving
-- evidence.
--
-- The audit schema already exists (migration 016 holds audit.event and audit.ai_generation from
-- the physician stream). This adds audit.record only; the live audit tables are brought under the
-- platform rules in the S8 retrofit. Idempotent, ALTER never drop. No em dashes or en dashes.

-- The audit schema already exists in production (migration 016 creates it), but this migration
-- creates it if absent so the platform migrations are self sufficient and apply cleanly in a
-- container that has not yet had clinical/db applied.
create schema if not exists audit;

-- ---------------------------------------------------------------------------
-- audit.record: tenant owned, append only, hash chained per organisation.
-- ---------------------------------------------------------------------------
create table if not exists audit.record (
  id                uuid primary key default gen_random_uuid(),
  occurred_at       timestamptz not null default now(),
  organisation_id   uuid not null references tenancy.organisation(id),
  location_id       uuid,
  actor_id          uuid,
  actor_type        varchar(20) not null,
  actor_role        varchar(60),
  action            varchar(40) not null,
  entity_type       varchar(60) not null,
  entity_id         uuid,
  subject_person_id uuid,
  lawful_basis_type varchar(30),
  lawful_basis_ref  varchar(120),
  access_reason     varchar(120),
  correlation_id    uuid not null,
  trace_id          varchar(64),
  source_ip         inet,
  user_agent        varchar(300),
  outcome           varchar(20) not null,
  denial_reason     varchar(120),
  record_sequence   bigint not null,
  previous_digest   bytea,
  record_digest     bytea not null,
  constraint ck_audit_outcome check (outcome in ('permitted','denied','error')),
  constraint ck_audit_actor_type check (actor_type in ('user','system','integration','support')),
  constraint ux_audit_org_sequence unique (organisation_id, record_sequence));

create index if not exists ix_audit_subject on audit.record(organisation_id, subject_person_id);
create index if not exists ix_audit_correlation on audit.record(correlation_id);

alter table audit.record enable row level security;
alter table audit.record force  row level security;
drop policy if exists record_isolation on audit.record;
create policy record_isolation on audit.record
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

-- append only: grant wall plus the S2 trigger. No direct insert grant either: the only write path
-- is audit.append_record below, so the hash chain can never be bypassed by a raw insert.
revoke insert, update, delete on audit.record from app_clinical, app_employer, app_release, app_readonly;
drop trigger if exists tr_record_append_only on audit.record;
create trigger tr_record_append_only
  before update or delete on audit.record
  for each row execute function platform.guard_append_only();

-- ---------------------------------------------------------------------------
-- append_record: the only write path. Security definer, so callers hold execute but not insert,
-- which forces every audit write through the chain. The organisation and actor come from the
-- session context, never from a parameter. A disclosure with no lawful basis fails closed.
-- ---------------------------------------------------------------------------
create or replace function audit.append_record(
  p_action            text,
  p_entity_type       text,
  p_outcome           text,
  p_entity_id         uuid default null,
  p_subject_person_id uuid default null,
  p_actor_type        text default 'user',
  p_actor_role        text default null,
  p_lawful_basis_type text default null,
  p_lawful_basis_ref  text default null,
  p_access_reason     text default null,
  p_correlation_id    uuid default null,
  p_denial_reason     text default null,
  p_location_id       uuid default null)
returns uuid
language plpgsql security definer set search_path = '' as $append$
declare
  v_org       uuid := current_setting('app.organisation_id')::uuid;  -- strict: no context fails closed
  v_actor     uuid := nullif(current_setting('app.actor_id', true), '')::uuid;
  v_corr      uuid := coalesce(p_correlation_id, gen_random_uuid());
  v_occurred  timestamptz := now();
  v_seq       bigint;
  v_prev      bytea;
  v_canonical text;
  v_digest    bytea;
  v_id        uuid := gen_random_uuid();
begin
  if p_action = 'disclose' and (p_lawful_basis_type is null or p_lawful_basis_ref is null) then
    raise exception 'a disclosure requires a lawful basis: type and reference';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_org::text)::bigint);  -- serialise the chain per organisation
  select coalesce(max(record_sequence), 0) + 1 into v_seq from audit.record where organisation_id = v_org;
  select record_digest into v_prev from audit.record where organisation_id = v_org and record_sequence = v_seq - 1;

  v_canonical := concat_ws('|',
    v_occurred::text, v_org::text, coalesce(p_location_id::text, ''), coalesce(v_actor::text, ''),
    p_actor_type, coalesce(p_actor_role, ''), p_action, p_entity_type, coalesce(p_entity_id::text, ''),
    coalesce(p_subject_person_id::text, ''), coalesce(p_lawful_basis_type, ''), coalesce(p_lawful_basis_ref, ''),
    coalesce(p_access_reason, ''), v_corr::text, p_outcome, coalesce(p_denial_reason, ''));

  v_digest := sha256(convert_to(
    v_seq::text || '|' || coalesce(encode(v_prev, 'hex'), '') || '|' || v_canonical, 'UTF8'));

  insert into audit.record (
    id, occurred_at, organisation_id, location_id, actor_id, actor_type, actor_role, action,
    entity_type, entity_id, subject_person_id, lawful_basis_type, lawful_basis_ref, access_reason,
    correlation_id, outcome, denial_reason, record_sequence, previous_digest, record_digest)
  values (
    v_id, v_occurred, v_org, p_location_id, v_actor, p_actor_type, p_actor_role, p_action,
    p_entity_type, p_entity_id, p_subject_person_id, p_lawful_basis_type, p_lawful_basis_ref, p_access_reason,
    v_corr, p_outcome, p_denial_reason, v_seq, v_prev, v_digest);

  return v_id;
end
$append$;

-- ---------------------------------------------------------------------------
-- verify_chain: recompute every row's digest from its stored fields and its stored previous
-- digest, and return the first record_sequence that does not match, or null if the chain is
-- intact. A break is a security incident, not a data quality issue.
-- ---------------------------------------------------------------------------
create or replace function audit.verify_chain(p_org uuid)
returns bigint
language plpgsql stable security definer set search_path = '' as $verify$
declare
  r          record;
  v_canonical text;
  v_expected bytea;
begin
  for r in select * from audit.record where organisation_id = p_org order by record_sequence asc
  loop
    v_canonical := concat_ws('|',
      r.occurred_at::text, r.organisation_id::text, coalesce(r.location_id::text, ''), coalesce(r.actor_id::text, ''),
      r.actor_type, coalesce(r.actor_role, ''), r.action, r.entity_type, coalesce(r.entity_id::text, ''),
      coalesce(r.subject_person_id::text, ''), coalesce(r.lawful_basis_type, ''), coalesce(r.lawful_basis_ref, ''),
      coalesce(r.access_reason, ''), r.correlation_id::text, r.outcome, coalesce(r.denial_reason, ''));
    v_expected := sha256(convert_to(
      r.record_sequence::text || '|' || coalesce(encode(r.previous_digest, 'hex'), '') || '|' || v_canonical, 'UTF8'));
    if v_expected is distinct from r.record_digest then
      return r.record_sequence;
    end if;
  end loop;
  return null;
end
$verify$;

grant usage on schema audit to app_clinical, app_employer, app_release, app_readonly;
grant select on audit.record to app_clinical, app_readonly;
grant execute on function audit.append_record(text, text, text, uuid, uuid, text, text, text, text, text, uuid, text, uuid)
  to app_clinical, app_employer, app_release;
grant execute on function audit.verify_chain(uuid) to app_readonly;

insert into platform.schema_migration (version) values ('0005')
  on conflict (version) do nothing;
