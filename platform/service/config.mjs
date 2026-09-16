/* Prompt 50 Section 9. Four scopes, most specific first, no silent default.
   No em dashes or en dashes anywhere. */

import { namedError } from "./errors.mjs";
import { increment } from "./metrics.mjs";

const SCOPE_ORDER = Object.freeze(["location", "region", "organisation", "global"]);

export function setValue(input, store) {
  const src = input || {};
  const def = (store.definitions || []).find((d) => d.key === src.key);
  if (!def) throw namedError("CONFIG-KEY-UNKNOWN", "That configuration key is not defined.");
  const allowed = String(def.allowed_scopes || "").split(",").map((s) => s.trim());
  if (!allowed.includes(src.scope_type)) {
    throw namedError("CONFIG-SCOPE-DENIED", "That key cannot be set at " + src.scope_type + ".");
  }
  store.values = store.values || [];
  const prior = store.values
    .filter((v) => v.key === src.key && v.scope_type === src.scope_type && v.scope_id === src.scope_id)
    .sort((a, b) => b.version - a.version)[0];
  const row = {
    key: src.key,
    scope_type: src.scope_type,
    scope_id: src.scope_id || null,
    value: src.value,
    version: prior ? prior.version + 1 : 1,
    set_by: src.set_by,
    reason: src.reason,
    previous_value: prior ? prior.value : null,
  };
  store.values.push(row);
  store.audit = store.audit || [];
  store.audit.push({
    action: "configure",
    outcome: "permitted",
    previous_value: row.previous_value,
    new_value: row.value,
    actor: src.set_by,
    reason: src.reason,
  });
  return row;
}

export function resolve(key, scopes, store, at) {
  const def = (store.definitions || []).find((d) => d.key === key);
  if (!def) throw namedError("CONFIG-KEY-UNKNOWN", "That configuration key is not defined.");
  const when = at ? new Date(at).getTime() : Date.now();
  for (const scope of SCOPE_ORDER) {
    const scopeId = scope === "global" ? null : scopes[scope + "_id"];
    const rows = (store.values || []).filter((v) =>
      v.key === key && v.scope_type === scope && (v.scope_id || null) === (scopeId || null) &&
      (!v.effective_from || new Date(v.effective_from).getTime() <= when) &&
      (!v.effective_to || new Date(v.effective_to).getTime() > when)
    ).sort((a, b) => b.version - a.version);
    if (rows[0]) return rows[0].value;
  }
  if (def.is_required) {
    increment("config_required_missing_total", { key });
    throw namedError("CONFIG-REQUIRED-MISSING", "A required setting has no value. Ask an administrator to set " + key + ".");
  }
  return null;
}
