/* Prompt 50 Section 11.4. live has no dependency check. ready fails when
   migrations are not current and must not restart the process.
   No em dashes or en dashes anywhere. */

export const EXPECTED_HEAD = "0019";

export function live() {
  return { status: "live" };
}

export function ready(input) {
  const src = input || {};
  const current = src.migrations_current === true || src.head === EXPECTED_HEAD;
  const secrets = src.secrets_resolved === true;
  const configLoaded = src.config_loaded === true;
  const db = src.database_reachable === true;
  if (!current) {
    return { ready: false, reason: "migrations_not_current", restart: false };
  }
  if (!db || !secrets || !configLoaded) {
    return { ready: false, reason: "dependency_not_ready", restart: false };
  }
  return { ready: true, restart: false };
}

export function dependencies(input, authenticated) {
  if (!authenticated) {
    return { ok: false, reason: "authentication_required" };
  }
  const src = input || {};
  return {
    ok: true,
    database: src.database || { status: "UNKNOWN", latency_ms: "UNKNOWN" },
    secrets: src.secrets || { status: "UNKNOWN" },
    config: src.config || { status: "UNKNOWN" },
  };
}
