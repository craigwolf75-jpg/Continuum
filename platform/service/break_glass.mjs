/* Prompt 50 Section 4.5 break glass mechanism. Time bounded, alerts on
   activation, audited on every use. Holders are not named here.
   No em dashes or en dashes anywhere. */

import { namedError } from "./errors.mjs";
import { openBreakGlass, isBreakGlassActive } from "../../clinical/engine/support_access.mjs";

export function activate(input, store) {
  const row = openBreakGlass(input, store);
  store.alerts = store.alerts || [];
  store.alerts.push({ kind: "break_glass_activated", window_id: row.id });
  store.audit = store.audit || [];
  store.audit.push({
    action: "authorise",
    outcome: "permitted",
    entity_type: "break_glass",
    entity_id: row.id,
    access_reason: row.reason,
    actor_type: "support",
  });
  return row;
}

export function expired(row, at, store) {
  return !isBreakGlassActive(row, at, store);
}

export function assertUseAudited(row, store) {
  if (!row) throw namedError("BREAK-GLASS-MISSING", "A break glass window is required.");
  store.audit = store.audit || [];
  store.audit.push({
    action: "view",
    outcome: "permitted",
    entity_type: "break_glass",
    entity_id: row.id,
    access_reason: row.reason,
    actor_type: "support",
  });
  return true;
}
