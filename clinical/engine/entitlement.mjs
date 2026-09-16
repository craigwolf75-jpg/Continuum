/* Prompt 47 Part 10: entitlement mapping only.

   Map plan to module entitlements and capacity entitlements. Feature flags stay
   on config.feature_flag and are a separate channel. Grace: exceeding capacity
   warns, then blocks NEW additions, and never blocks clinical work in progress.
   E8: clinical access is NEVER disabled for payment failure; after grace the
   tenant is read-only; export is always available. No Stripe, tax, dunning,
   invoicing, or revenue recognition. No em dashes or en dashes anywhere. */

import { namedError, requireStore, UNKNOWN } from "./clinic_ops_util.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const PLAN_ENTITLEMENTS = Object.freeze({
  pilot: {
    modules: ["clinical_core", "clinic_analytics"],
    capacity: { practitioners: null, locations: 1 },
  },
  standard: {
    modules: ["clinical_core", "clinic_analytics", "multi_location"],
    capacity: { practitioners: null, locations: null },
  },
  enterprise: {
    modules: ["clinical_core", "clinic_analytics", "multi_location", "break_glass_admin"],
    capacity: { practitioners: null, locations: null },
  },
});

export function resolveEntitlements(plan, store) {
  requireStore(store, "ENTITLEMENT-STORE-MISSING", "An entitlement store is required.");
  const key = norm(plan);
  if (!key) throw namedError("PLAN-MISSING", "resolveEntitlements requires a plan key.");
  const live = store.plans && store.plans[key];
  const cached = store.cache && store.cache.plans && store.cache.plans[key];
  const mapped = live || cached || PLAN_ENTITLEMENTS[key];
  if (!mapped) throw namedError("PLAN-UNKNOWN", "Plan " + key + " has no entitlement map.", { plan: key });
  const rows = [];
  for (const moduleKey of mapped.modules || []) {
    rows.push({ module_key: moduleKey, kind: "module", limit_value: null, source_plan: key });
  }
  const cap = mapped.capacity || {};
  for (const [capKey, limit] of Object.entries(cap)) {
    rows.push({
      module_key: capKey,
      kind: "capacity",
      limit_value: limit === undefined || limit === null ? null : limit,
      source_plan: key,
    });
  }
  return { plan: key, entitlements: rows, feature_flags_separate: true };
}

export function checkCapacity(kind, used, limit, opts) {
  const options = opts || {};
  if (limit === undefined || limit === null || limit === UNKNOWN) {
    if (options.require_limit) {
      throw namedError("CAPACITY-LIMIT-UNKNOWN", "Capacity limit is UNKNOWN. Never treat UNKNOWN as 0.");
    }
    return { ok: true, status: "unlimited", used, limit: UNKNOWN, blocks: null };
  }
  const nUsed = Number(used);
  const nLimit = Number(limit);
  if (Number.isNaN(nUsed) || Number.isNaN(nLimit)) {
    throw namedError("CAPACITY-INPUT-UNKNOWN", "Capacity used or limit is not a number. Never coerce UNKNOWN to 0.");
  }
  if (options.in_progress === true) {
    return { ok: true, status: "in_progress_allowed", used: nUsed, limit: nLimit, blocks: null };
  }
  if (nUsed < nLimit) return { ok: true, status: "ok", used: nUsed, limit: nLimit, blocks: null };
  if (nUsed === nLimit) {
    return { ok: true, status: "warn", used: nUsed, limit: nLimit, blocks: null, message: "Capacity reached: new additions will be blocked." };
  }
  if (options.adding_new === true) {
    return { ok: false, status: "block_new", used: nUsed, limit: nLimit, blocks: "new_additions", message: "Capacity exceeded: new additions are blocked. Clinical work in progress continues." };
  }
  return { ok: true, status: "warn", used: nUsed, limit: nLimit, blocks: null, message: "Capacity exceeded: warn, then block new additions." };
}

export function resolveAccessMode(input) {
  const src = input || {};
  const reason = norm(src.reason) || "none";
  if (src.clinical_disabled === true) {
    throw namedError("E8-CLINICAL-DISABLE-FORBIDDEN", "Clinical access is never disabled for payment failure.");
  }
  let mode = "full";
  let resolvedReason = "none";
  if (reason === "trial_ended" || src.trial_ended === true) {
    mode = "read_only";
    resolvedReason = "trial_ended";
  } else if (reason === "payment_grace_elapsed" || src.payment_grace_elapsed === true) {
    mode = "read_only";
    resolvedReason = "payment_grace_elapsed";
  } else if (src.payment_failed === true && src.grace_elapsed !== true) {
    mode = "full";
    resolvedReason = "none";
  }
  return {
    mode,
    reason: resolvedReason,
    export_available: true,
    clinical_disabled: false,
  };
}

export function flagsAreNotEntitlements(flagKey, entitlementKey) {
  return norm(flagKey) !== "" && norm(entitlementKey) !== "" && norm(flagKey) !== norm(entitlementKey);
}
