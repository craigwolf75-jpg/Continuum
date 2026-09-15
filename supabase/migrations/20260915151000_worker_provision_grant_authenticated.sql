-- Continuum worker provision GRANT to authenticated. Append only; never edit
-- once applied. This migration RECORDS the live GRANT Hermes already applied.
-- Repo must match live: EXECUTE on worker.provision_worker(uuid, text) is
-- authenticated and postgres only. Owner remains postgres. Anon and public
-- do not have EXECUTE. Craig approved GRANT EXECUTE to authenticated only.
-- The invite gate already exists in
-- 20260915150000_worker_provision_invite_gate.sql (invite check before case
-- lookup). This migration is privileges only: it does not CREATE OR REPLACE
-- the function, and it does not GRANT to anon, public, or service_role.
-- Clinic-staff stays parked. PATH-006 remains on hold: do not implement
-- PATH-006. Live GRANT is already done; this mission does not live-apply or
-- db-push. Do not re-apply. No em dashes or en dashes.

begin;

-- Safety belt so a PUBLIC default cannot linger. Never GRANT to anon or public.
revoke execute on function worker.provision_worker(uuid, text)
  from public, anon;
grant execute on function worker.provision_worker(uuid, text)
  to authenticated;

commit;
