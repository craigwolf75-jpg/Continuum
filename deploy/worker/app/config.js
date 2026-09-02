/* Continuum Worker - client configuration.
   The publishable (anon) key is safe in the client. A worker reads only their own rows
   (RLS keyed on the caller identity through worker.owns_case); clinic staff read only
   their own clinic's cases; the employer projection carries no clinical column. Every
   write goes through a SECURITY DEFINER RPC. Nothing clinical is reachable from an
   employer surface by construction. */
window.CONTINUUM_WORKER_CONFIG = {
  url: "https://agzhnmunodrhsjbogzae.supabase.co",
  anonKey: "sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp",
  schema: "worker"
};
