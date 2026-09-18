-- FILE ONLY. Do not apply live.
-- Continuum product tables for the Steering Dispatcher.
-- Prompt 66 agent operations schema (agent_ops). Append-friendly.
-- Do not land this file in supabase/migrations, platform/db, or clinical/db.
-- Four new tables remain a schema change under the human gate.
-- Prompt 66 authorizes the FILE ONLY. Gary or Craig live-apply is not this mission.
-- No em dashes or en dashes anywhere.

create schema if not exists agent_ops;

comment on schema agent_ops is
  'FILE ONLY. Do not apply live. Continuum product tables for the Steering Dispatcher.';

-- agents: inventory with provenance (created_at). Append-friendly.
create table if not exists agent_ops.agents (
  identifier text primary key,
  name text not null,
  role text not null,
  runtime_status text not null,
  home_repository text not null,
  created_at timestamptz not null default now(),
  constraint agents_runtime_status_check check (
    runtime_status in ('RUNTIME_IMPLEMENTED', 'CONTRACT_ONLY')
  )
);

comment on table agent_ops.agents is
  'FILE ONLY. Do not apply live. Continuum product tables for the Steering Dispatcher. Agent inventory with provenance.';

-- agent_activity: heartbeat and last action. Append-friendly. Provenance: recorded_at.
create table if not exists agent_ops.agent_activity (
  id text primary key,
  agent_identifier text not null references agent_ops.agents (identifier),
  heartbeat_at timestamptz not null,
  current_task text,
  last_completed_action text,
  recorded_at timestamptz not null default now()
);

comment on table agent_ops.agent_activity is
  'FILE ONLY. Do not apply live. Continuum product tables for the Steering Dispatcher. Append-friendly activity with provenance.';

-- agent_findings: proposed work. Status values NEW, APPROVED, REJECTED, DISPATCHED, DONE.
-- Only a human moves NEW to APPROVED. Provenance: created_at and named *_by / *_at columns.
create table if not exists agent_ops.agent_findings (
  id text primary key,
  finding text not null,
  evidence_link text,
  proposed_improvement text,
  severity text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  dispatched_by text,
  dispatched_at timestamptz,
  done_at timestamptz,
  constraint agent_findings_status_check check (
    status in ('NEW', 'APPROVED', 'REJECTED', 'DISPATCHED', 'DONE')
  ),
  constraint agent_findings_approved_human_check check (
    status <> 'APPROVED' or (approved_by is not null and length(btrim(approved_by)) > 0)
  ),
  constraint agent_findings_rejected_human_check check (
    status <> 'REJECTED' or (rejected_by is not null and length(btrim(rejected_by)) > 0)
  ),
  constraint agent_findings_dispatched_human_check check (
    status not in ('DISPATCHED', 'DONE')
    or (dispatched_by is not null and length(btrim(dispatched_by)) > 0)
  )
);

comment on table agent_ops.agent_findings is
  'FILE ONLY. Do not apply live. Continuum product tables for the Steering Dispatcher. Only a human moves NEW to APPROVED.';

-- agent_tasks: change work created only after a named human dispatch.
-- dispatched_by is a named human, never blank, never an agent identifier.
create table if not exists agent_ops.agent_tasks (
  id text primary key,
  instruction text not null,
  target_agent text not null,
  dispatched_by text not null,
  dispatched_at timestamptz not null default now(),
  state text not null,
  result text,
  artifact_link text,
  finding_id text references agent_ops.agent_findings (id),
  constraint agent_tasks_dispatched_by_named_check check (
    length(btrim(dispatched_by)) > 0
  ),
  constraint agent_tasks_state_check check (
    state in ('DISPATCHED', 'DONE', 'REFUSED')
  )
);

comment on table agent_ops.agent_tasks is
  'FILE ONLY. Do not apply live. Continuum product tables for the Steering Dispatcher. dispatched_by is a named human, never blank.';
