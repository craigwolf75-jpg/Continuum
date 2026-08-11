-- Continuum Prompt 44 (AI Components and their Boundaries): the provenance mechanism and the
-- session isolation table. This is the scaffolding that carries the regulatory position; it
-- contains NO model call and depends on no inference provider, so it is built ahead of the
-- provider decision (Prompt 44 Section 9 open item 1, the stop condition).
--
-- Provenance (Section 3) is how the software stays a decision SUPPORT tool: a model response
-- can never become provenance human, and system is permitted only on non clinical fields. The
-- signature gate reads one partial index to find an untouched ai_draft field. Session
-- isolation (Section 4) is enforced in the schema, so a bug in a future service layer cannot
-- silently let one case's data append to another.
--
-- APPLY ORDER: after 016 (needs clinical.wcb_report and the audit schema). Idempotent, one
-- transaction, hand applied by Gary. Claude never creates or touches a Supabase project. No
-- dashes anywhere.

begin;

-- ---------------------------------------------------------------------------
-- provenance enum (Section 3). Schema qualified, like the 016 enums.
-- ---------------------------------------------------------------------------
do $prov$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname='provenance' and n.nspname='clinical') then
    create type clinical.provenance as enum ('human','ai_draft','ai_draft_edited','carried_forward','system');
  end if;
end
$prov$;

-- ---------------------------------------------------------------------------
-- wcb_report_field: the per report field value store. Prompt 44 Section 3 writes provenance
-- into this table, and the signature gate reads it, but no earlier migration created it (the
-- functional measurement rows in 011 are the axis values; this is the general field store the
-- form engine implied). It is created here because provenance is its column. NOTE: reconcile
-- the column set with the Prompt 40 form engine field storage when that is finalised.
--
-- system provenance is permitted ONLY on a non clinical field (Section 3: transaction id,
-- completion date, skill code, facility type, never a clinical value). is_clinical carries the
-- field's classification and a CHECK enforces the rule in the database, not just the service.
-- ---------------------------------------------------------------------------
create table if not exists clinical.wcb_report_field (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references clinical.wcb_report(id),
  element_key varchar(60) not null,          -- the board element / field identifier
  is_clinical boolean not null default true,
  value text,
  provenance clinical.provenance not null default 'human',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, element_key),
  -- system provenance only on a non clinical field (Section 3)
  constraint system_provenance_non_clinical_only check (provenance <> 'system' or is_clinical = false)
);

-- The signature gate is one indexed lookup: does this report carry an untouched ai_draft
-- field (Section 3, acceptance criterion 3). A partial index keeps it cheap.
create index if not exists ix_field_untouched_draft on clinical.wcb_report_field(report_id)
  where provenance = 'ai_draft';
create index if not exists ix_report_field_report on clinical.wcb_report_field(report_id);

-- ---------------------------------------------------------------------------
-- audit.ai_generation (Section 4): every generation, including failures and refusals, writes a
-- row. session_isolation is a CHECK so a service layer bug cannot breach it: a component that
-- cannot supply the scope, or supplies the wrong scope, cannot write, so it does not run
-- (acceptance criterion 4). Append only, the same defense in depth as audit.event (016).
-- ---------------------------------------------------------------------------
create table if not exists audit.ai_generation (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  clinic_id uuid not null,
  case_id uuid not null,
  report_id uuid,
  actor_user_id uuid not null,
  purpose varchar(40) not null,
  model varchar(60) not null,
  model_version varchar(40) not null,
  confidence numeric(4,3),
  low_confidence_flagged boolean not null default false,
  session_scope_case_id uuid not null,
  outcome varchar(20) not null,              -- success | failed | refused | timeout
  constraint session_isolation check (session_scope_case_id = case_id)
);
create index if not exists ix_ai_generation_case on audit.ai_generation(case_id);

revoke update, delete on audit.ai_generation from anon, authenticated, service_role;

-- Reuse the 016 append only trigger function (audit.block_mutation).
drop trigger if exists trg_ai_generation_block on audit.ai_generation;
create trigger trg_ai_generation_block before update or delete on audit.ai_generation
for each row execute function audit.block_mutation();

commit;
