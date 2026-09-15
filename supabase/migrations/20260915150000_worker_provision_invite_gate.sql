-- Continuum worker provision invite gate. Append only; never edit once applied.
-- Records the live REVOKE: EXECUTE on worker.provision_worker is revoked from
-- authenticated, anon, and public. Owner remains postgres only. Zeus has not
-- approved restoring EXECUTE to authenticated. This migration does not GRANT
-- EXECUTE to authenticated, anon, public, or service_role.
-- Then adds worker.case_invite so a worker can bind only a case they were
-- invited to, once Zeus later approves a grant. Clinic-staff path stays
-- parked. Public /worker signup via the auth.users trigger is unchanged.
-- No em dashes or en dashes.

begin;

-- Match live: owner postgres only. Not callable by arbitrary clients.
revoke execute on function worker.provision_worker(uuid, text)
  from public, anon, authenticated;

-- Invite row is the allow-list. Email plus case, not a guessed UUID.
-- Authenticated clients cannot insert. service_role may insert so a later
-- issuer can land without a parallel clinician schema.
create table if not exists worker.case_invite (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  email text not null,
  invited_at timestamptz not null default now(),
  consumed_at timestamptz,
  constraint case_invite_email_lower check (email = lower(email)),
  unique (case_id, email)
);

create index if not exists idx_case_invite_email on worker.case_invite (email)
  where consumed_at is null;

alter table worker.case_invite enable row level security;

revoke all on table worker.case_invite from public, anon, authenticated;

grant usage on schema worker to service_role;
grant insert on table worker.case_invite to service_role;

create or replace function worker.provision_worker(p_case uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path = worker, public
as $$
declare
  v_acct uuid := worker.current_account_id();
  v_auth uuid;
  v_worker uuid;
  v_invite uuid;
  v_email text := lower(coalesce(p_email, ''));
begin
  if v_acct is null then
    raise exception 'no worker account for caller';
  end if;
  if v_email = '' then
    raise exception 'email is required';
  end if;
  select u.id into v_auth
  from auth.users u
  where lower(u.email) = v_email
  limit 1;
  if v_auth is null then
    raise exception 'no account for that email: sign up first';
  end if;
  if v_auth is distinct from auth.uid() then
    raise exception 'not your account';
  end if;

  -- Gate: invite check before case lookup so a guessed UUID does not reveal
  -- whether the case exists.
  select i.id into v_invite
  from worker.case_invite i
  where i.case_id = p_case
    and i.email = v_email
    and i.consumed_at is null
  for update;
  if v_invite is null then
    raise exception 'not invited to this case';
  end if;

  select c.worker_id into v_worker
  from clinical.wcb_case c
  where c.id = p_case;
  if v_worker is null then
    raise exception 'case not found';
  end if;

  update worker.worker_account
    set clinical_worker_id = v_worker
    where id = v_acct
    returning id into v_acct;

  update worker.case_invite
    set consumed_at = now()
    where id = v_invite
      and consumed_at is null;

  return v_acct;
end;
$$;

-- Recreate privileges after replace. CREATE OR REPLACE keeps ACLs, but
-- REVOKE again so a default PUBLIC grant cannot linger. Do not GRANT
-- EXECUTE to authenticated until Zeus explicitly restores it.
revoke execute on function worker.provision_worker(uuid, text)
  from public, anon, authenticated;

commit;
