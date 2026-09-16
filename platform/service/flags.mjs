/* Prompt 50 Section 9.3. Explicit scope rollout. Kill switch never enables.
   Flags never gate security, tenancy, immutability, consent or audit.
   No em dashes or en dashes anywhere. */

import { namedError } from "./errors.mjs";
import { increment } from "./metrics.mjs";

export const CONTROL_FLAG_KEYS = Object.freeze([
  "tenancy", "immutability", "consent", "audit", "authorisation", "authorization",
]);

const SCOPE_ORDER = Object.freeze(["location", "region", "organisation", "global"]);

export function assertFlagAllowed(key) {
  const k = String(key || "").toLowerCase();
  if (CONTROL_FLAG_KEYS.some((c) => k === c || k.startsWith(c + ".") || k.endsWith("." + c))) {
    throw namedError("FLAG-CONTROL-FORBIDDEN", "A feature flag cannot turn off a security or evidence control.");
  }
  return true;
}

export function evaluateFlag(key, scopes, store, at) {
  assertFlagAllowed(key);
  const flag = (store.flags || []).find((f) => f.key === key);
  if (!flag) throw namedError("FLAG-UNKNOWN", "That feature flag is not defined.");
  if (flag.retire_by && new Date(flag.retire_by) < new Date(at || Date.now())) {
    increment("feature_flag_expired_total", { key });
    throw namedError("FLAG-EXPIRED", "That feature flag is past its retirement date and must be removed.");
  }
  const when = at ? new Date(at).getTime() : Date.now();
  for (const scope of SCOPE_ORDER) {
    const scopeId = scope === "global" ? null : scopes[scope + "_id"];
    const rows = (store.rules || []).filter((r) =>
      r.flag_key === key && r.scope_type === scope && (r.scope_id || null) === (scopeId || null) &&
      new Date(r.effective_from || 0).getTime() <= when
    ).sort((a, b) => b.version - a.version);
    if (rows[0]) return rows[0].state;
  }
  return flag.default_state;
}

export function setFlag(input, store) {
  const src = input || {};
  assertFlagAllowed(src.key);
  const flag = (store.flags || []).find((f) => f.key === src.key);
  if (!flag) throw namedError("FLAG-UNKNOWN", "That feature flag is not defined.");
  if (flag.is_kill_switch && src.state === true && src.enables_capability === true) {
    throw namedError("FLAG-KILL-ENABLE", "A kill switch can disable a feature. It cannot turn one on.");
  }
  store.rules = store.rules || [];
  const prior = store.rules.filter((r) => r.flag_key === src.key && r.scope_type === src.scope_type && r.scope_id === src.scope_id)
    .sort((a, b) => b.version - a.version)[0];
  const row = {
    flag_key: src.key,
    scope_type: src.scope_type,
    scope_id: src.scope_id || null,
    state: src.state,
    version: prior ? prior.version + 1 : 1,
    effective_from: src.effective_from || new Date().toISOString(),
    set_by: src.set_by,
    reason: src.reason,
    previous_value: prior ? prior.state : flag.default_state,
  };
  store.rules.push(row);
  store.audit = store.audit || [];
  store.audit.push({
    action: "configure",
    outcome: "permitted",
    previous_value: row.previous_value,
    new_value: row.state,
    actor: src.set_by,
    reason: src.reason,
  });
  return row;
}
