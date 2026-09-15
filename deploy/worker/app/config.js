/* Continuum Worker - client configuration.
   The publishable (anon) key is safe in the client. A worker reads only their own rows
   (RLS keyed on the caller identity through worker.owns_case). Clinic-staff mapping is
   parked: clinical.practitioner has no auth_user_id, so worker.case_in_caller_clinic
   returns false. The employer projection carries no clinical column. Every write goes
   through a SECURITY DEFINER RPC. Nothing clinical is reachable from an employer
   surface by construction.
   Identity map (not legal copy): hub_profiles is the hub approval gate;
   public.users and public.workers are the hub person and role projection;
   worker.worker_account is worker-app identity keyed to auth.users, with
   clinical_worker_id pointing at clinical.worker. */
window.CONTINUUM_WORKER_CONFIG = {
  url: "https://agzhnmunodrhsjbogzae.supabase.co",
  anonKey: "sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp",
  schema: "worker"
};
