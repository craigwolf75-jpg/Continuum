-- Continuum worker signup provision (SB-004). Append only; never edit once applied.
-- AFTER INSERT on auth.users inserts worker.worker_account so WK.signUp yields
-- an account. Idempotent on conflict (auth_user_id). Never inserts auth.users.
--
-- Clinic-staff provision RPC is parked: clinical.practitioner has no
-- auth_user_id, so a staff gate cannot be bound. Public signup stays WK.signUp
-- plus this trigger. Linking clinical_worker_id to a case is a later mission.
--
-- Identity map (not legal copy): hub_profiles is the hub approval gate;
-- public.users / public.workers are the hub person and role projection;
-- worker.worker_account is worker-app identity keyed to auth.users.
-- No em dashes or en dashes.

begin;

create or replace function worker.provision_account_from_auth()
returns trigger
language plpgsql
security definer
set search_path = worker, public
as $$
begin
  insert into worker.worker_account (auth_user_id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), new.email)
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

revoke all on function worker.provision_account_from_auth() from public, anon, authenticated;

drop trigger if exists trg_worker_provision_account on auth.users;
create trigger trg_worker_provision_account
  after insert on auth.users
  for each row
  execute function worker.provision_account_from_auth();

-- Optional self-service link: caller already has worker_account (from the
-- trigger). Looks up an existing auth.users row by email. Never inserts into
-- auth.users. If no auth user, tells the worker to sign up.
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
begin
  if v_acct is null then
    raise exception 'no worker account for caller';
  end if;
  select u.id into v_auth
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;
  if v_auth is null then
    raise exception 'no account for that email: sign up first';
  end if;
  if v_auth is distinct from auth.uid() then
    raise exception 'not your account';
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
  return v_acct;
end;
$$;

revoke execute on function worker.provision_worker(uuid, text)
  from public, anon, authenticated;
grant execute on function worker.provision_worker(uuid, text)
  to authenticated;

commit;
