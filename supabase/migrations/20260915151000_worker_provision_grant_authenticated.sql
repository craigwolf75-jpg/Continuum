-- Continuum worker provision GRANT to authenticated. Append only; never edit
-- once applied. Craig approved GRANT EXECUTE on worker.provision_worker(uuid,
-- text) to authenticated only. The invite gate already exists in
-- 20260915150000_worker_provision_invite_gate.sql (invite check before case
-- lookup). This migration is privileges only: it does not CREATE OR REPLACE
-- the function, and it does not GRANT to anon or public. Clinic-staff stays
-- parked. PATH-006 remains on hold: do not implement PATH-006. Do not apply
-- to live Supabase from this mission. No em dashes or en dashes.

begin;

-- Safety belt so a PUBLIC default cannot linger. Never GRANT to anon or public.
revoke execute on function worker.provision_worker(uuid, text)
  from public, anon;
grant execute on function worker.provision_worker(uuid, text)
  to authenticated;

commit;
