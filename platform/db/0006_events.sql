-- Continuum Core Platform Foundations (Prompt 51). Migration 0006: the event foundation.
--
-- Section 8. The event log answers what happened to the data (the audit record answers who saw
-- it). Events are append only and immutable; a correction is a new event. Ordering is guaranteed
-- per aggregate through sequence_in_aggregate with its unique constraint, never globally. The
-- event is written in the same transaction as the state change; external dispatch happens through
-- the outbox, polled after commit, never inside the transaction.
--
-- Three classes (Section 8.2): domain never leaves the platform, integration is a fact an entitled
-- external system may know, notification tells a human and carries no clinical content. The
-- subscription table is the access control list: emit creates an outbox row only for an entitled
-- subscription, and NEVER for a domain class event or a draft event, so an unsigned draft cannot
-- leave the platform. That rule is enforced here in emit, not in a comment.
--
-- Events carry identifiers and minimum context, never a full clinical payload (Section 8.3 item 2,
-- Section 4.2); that content rule is a discipline the payload shape and the CI logging scan guard,
-- not a column constraint. Idempotent, ALTER never drop. No em dashes or en dashes anywhere.

create schema if not exists events;

-- ---------------------------------------------------------------------------
-- domain_event: tenant owned, append only, ordered per aggregate.
-- ---------------------------------------------------------------------------
create table if not exists events.domain_event (
  id                    uuid primary key default gen_random_uuid(),
  occurred_at           timestamptz not null,
  recorded_at           timestamptz not null default now(),
  organisation_id       uuid not null references tenancy.organisation(id),
  location_id           uuid,
  event_class           varchar(20) not null,
  event_type            varchar(80) not null,
  schema_version        int not null,
  aggregate_type        varchar(60) not null,
  aggregate_id          uuid not null,
  sequence_in_aggregate bigint not null,
  actor_type            varchar(20) not null,
  actor_id              uuid,
  correlation_id        uuid not null,
  causation_id          uuid,
  payload               jsonb not null,
  constraint ck_event_class check (event_class in ('domain','integration','notification')),
  constraint ux_event_aggregate_sequence unique (aggregate_type, aggregate_id, sequence_in_aggregate));

create index if not exists ix_event_organisation on events.domain_event(organisation_id);
create index if not exists ix_event_correlation on events.domain_event(correlation_id);

alter table events.domain_event enable row level security;
alter table events.domain_event force  row level security;
drop policy if exists domain_event_isolation on events.domain_event;
create policy domain_event_isolation on events.domain_event
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

-- append only. The only write path is events.emit, so no insert grant either.
revoke insert, update, delete on events.domain_event from app_clinical, app_employer, app_release, app_readonly;
drop trigger if exists tr_domain_event_append_only on events.domain_event;
create trigger tr_domain_event_append_only
  before update or delete on events.domain_event
  for each row execute function platform.guard_append_only();

-- ---------------------------------------------------------------------------
-- subscription: the access control list of external destinations. Tenant owned.
-- ---------------------------------------------------------------------------
create table if not exists events.subscription (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references tenancy.organisation(id),
  destination     varchar(60) not null,
  event_class     varchar(20) not null,
  event_type      varchar(80) not null,   -- an exact type, or '*' for every type in the class
  is_entitled     boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint ck_subscription_class check (event_class in ('integration','notification')),
  constraint ux_subscription unique (organisation_id, destination, event_class, event_type));

alter table events.subscription enable row level security;
alter table events.subscription force  row level security;
drop policy if exists subscription_isolation on events.subscription;
create policy subscription_isolation on events.subscription
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

-- ---------------------------------------------------------------------------
-- outbox: the dispatch queue. Tenant owned. Mutable status (the poller advances it after commit),
-- so it is not append only, but it is never deleted. Written only by emit.
-- ---------------------------------------------------------------------------
create table if not exists events.outbox (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events.domain_event(id),
  organisation_id uuid not null references tenancy.organisation(id),
  destination     varchar(60) not null,
  status          varchar(20) not null default 'pending',
  attempts        int not null default 0,
  next_attempt_at timestamptz,
  dispatched_at   timestamptz,
  last_error      varchar(300),
  constraint ck_outbox_status check (status in ('pending','dispatched','failed')));

create index if not exists ix_outbox_pending on events.outbox(status) where status = 'pending';

alter table events.outbox enable row level security;
alter table events.outbox force  row level security;
drop policy if exists outbox_isolation on events.outbox;
create policy outbox_isolation on events.outbox
  using      (organisation_id = current_setting('app.organisation_id')::uuid)
  with check (organisation_id = current_setting('app.organisation_id')::uuid);

revoke insert, update, delete on events.outbox from app_clinical, app_employer, app_release, app_readonly;

-- ---------------------------------------------------------------------------
-- emit: the only write path. Security definer, so callers hold execute but not insert. Writes the
-- event in the caller's transaction (so a rollback removes it), computes sequence_in_aggregate
-- under a per aggregate lock, and creates outbox rows only for entitled subscriptions, never for a
-- domain class event and never for a draft event (an event_type ending in .drafted).
-- ---------------------------------------------------------------------------
create or replace function events.emit(
  p_event_class    text,
  p_event_type     text,
  p_aggregate_type text,
  p_aggregate_id   uuid,
  p_payload        jsonb,
  p_schema_version int default 1,
  p_correlation_id uuid default null,
  p_causation_id   uuid default null,
  p_location_id    uuid default null,
  p_actor_type     text default 'system',
  p_occurred_at    timestamptz default null)
returns uuid
language plpgsql security definer set search_path = '' as $emit$
declare
  v_org      uuid := current_setting('app.organisation_id')::uuid;  -- strict: no context fails closed
  v_actor    uuid := nullif(current_setting('app.actor_id', true), '')::uuid;
  v_corr     uuid := coalesce(p_correlation_id, gen_random_uuid());
  v_seq      bigint;
  v_id       uuid := gen_random_uuid();
begin
  perform pg_advisory_xact_lock(hashtext(p_aggregate_type || ':' || p_aggregate_id::text)::bigint);
  select coalesce(max(sequence_in_aggregate), 0) + 1 into v_seq
    from events.domain_event
    where aggregate_type = p_aggregate_type and aggregate_id = p_aggregate_id;

  insert into events.domain_event (
    id, occurred_at, organisation_id, location_id, event_class, event_type, schema_version,
    aggregate_type, aggregate_id, sequence_in_aggregate, actor_type, actor_id, correlation_id,
    causation_id, payload)
  values (
    v_id, coalesce(p_occurred_at, now()), v_org, p_location_id, p_event_class, p_event_type, p_schema_version,
    p_aggregate_type, p_aggregate_id, v_seq, p_actor_type, v_actor, v_corr,
    p_causation_id, p_payload);

  -- a domain event never leaves the platform; a draft event never leaves regardless of a
  -- subscription; everything else goes to its entitled subscriptions only.
  if p_event_class <> 'domain' and p_event_type not like '%.drafted' then
    insert into events.outbox (event_id, organisation_id, destination, status)
    select v_id, v_org, s.destination, 'pending'
    from events.subscription s
    where s.organisation_id = v_org
      and s.is_entitled
      and s.event_class = p_event_class
      and (s.event_type = p_event_type or s.event_type = '*');
  end if;

  return v_id;
end
$emit$;

grant usage on schema events to app_clinical, app_employer, app_release, app_readonly;
grant select on events.domain_event, events.outbox to app_clinical, app_readonly;
grant select, insert on events.subscription to app_clinical;
grant execute on function events.emit(text, text, text, uuid, jsonb, int, uuid, uuid, uuid, text, timestamptz)
  to app_clinical, app_employer, app_release;

insert into platform.schema_migration (version) values ('0006')
  on conflict (version) do nothing;
