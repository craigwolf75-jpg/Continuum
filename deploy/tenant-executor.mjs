/* Continuum physician platform: the tenant-scoped executor. The app-layer half of the tenancy
   guardrail (Prompt 51, decision 50a b): the physician runtime connects as the non-owner
   app_clinical role, and every unit of work runs as ONE transaction that injects
   app.organisation_id from the trusted server context (never from client input) before the query.
   A missing or malformed tenant fails closed: nothing runs, so a tenant can never be omitted by
   accident and reach the database. set_config is transaction local (third arg true), so a pooled
   connection never leaks one tenant's context into the next request.

   It produces the execute(sql) that clinical/engine/repository.mjs (via deploy/repo-live.mjs)
   consumes, and takes an injected withConnection(fn) so it is testable without a database:
   withConnection acquires a connection as app_clinical, calls fn(raw) where raw(sql) runs on that
   one session, and releases it afterward. The real Postgres driver supplies withConnection when the
   physician runtime is wired (see deploy/tenant-executor.README for the connection contract and the
   app_clinical credential); this module owns only the transaction and the tenant injection.

   NOTE: it deliberately does NOT use the Supabase Management API executor, which runs as the owner
   role and bypasses row level security. The wall only takes effect over a real connection as the
   non-owner app_clinical role. No dashes anywhere. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createTenantScopedExecute(opts = {}) {
  const withConnection = opts.withConnection;
  if (typeof withConnection !== "function") {
    throw new Error("createTenantScopedExecute requires an injected withConnection(fn) function.");
  }
  const organisationId = opts.organisationId;

  return async function execute(sql) {
    // Fail closed: no valid tenant, no query. The database wall denies a tenant-less query anyway,
    // but refusing here means a missing organisation_id never reaches the connection at all.
    if (typeof organisationId !== "string" || !UUID.test(organisationId.trim())) {
      const e = new Error("tenant context required: a valid organisation_id must be set server side before any query.");
      e.code = "NO-TENANT-CONTEXT";
      throw e;
    }
    // Validated as a uuid above, so this literal carries only hex and dashes: no injection surface.
    const org = organisationId.trim().toLowerCase();

    return await withConnection(async (raw) => {
      await raw("begin");
      try {
        await raw("select set_config('app.organisation_id', '" + org + "', true)");
        const rows = await raw(sql);
        await raw("commit");
        return rows || [];
      } catch (e) {
        try { await raw("rollback"); } catch (_) { /* preserve and rethrow the original error */ }
        throw e;
      }
    });
  };
}
