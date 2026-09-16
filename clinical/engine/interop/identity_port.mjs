/* Prompt 49 fail-closed identity port.

   Prompt 48 did not land. This module is not a Master Person Index. It is the
   only door through which the normalisation engine may resolve a person.
   Until Prompt 48 lands the port returns review_required and never creates,
   links, or merges a person. Auto-merge is forbidden.

   Architecture tests prove no person is constructed except through this port.
   No em dashes or en dashes. */

import { namedError, isBlank } from "./util.mjs";

export const IDENTITY_OUTCOMES = Object.freeze([
  "deterministic",
  "created",
  "review_required",
  "replayed",
  "conflict",
]);

export const PROMPT_48_REASON = "PROMPT_48_NOT_LANDED";

function recordBypass(metrics) {
  if (metrics && typeof metrics.increment === "function") {
    metrics.increment("identity_bypass_attempt_total", {});
  }
}

// The only legal constructor for a persisted person identity. Callers that
// new-up a person beside this port are a defect; architecture tests fail.
export function resolveIdentity(request, store, metrics) {
  const r = request || {};
  if (isBlank(r.connection_id)) {
    throw namedError("IDENTITY-CONNECTION-REQUIRED", "Identity resolution requires a connection. A lookup by value alone must not exist.");
  }
  if (r.lookup_by_value_alone === true) {
    recordBypass(metrics);
    throw namedError("IDENTITY-VALUE-ALONE-FORBIDDEN", "A lookup by value alone must not exist in the query layer.");
  }
  if (r.create_person === true || r.auto_merge === true) {
    recordBypass(metrics);
    return {
      outcome: "review_required",
      person_id: null,
      reason: r.auto_merge ? "AUTO_MERGE_FORBIDDEN" : PROMPT_48_REASON,
    };
  }

  // Tests may inject a Prompt 48 stand-in. Production store has none.
  if (store && typeof store.resolveIdentityImpl === "function") {
    const injected = store.resolveIdentityImpl(r, store);
    if (!injected || !IDENTITY_OUTCOMES.includes(injected.outcome)) {
      return { outcome: "review_required", person_id: null, reason: PROMPT_48_REASON };
    }
    if (injected.outcome === "created" && !store.prompt48Landed) {
      recordBypass(metrics);
      return { outcome: "review_required", person_id: null, reason: PROMPT_48_REASON };
    }
    return {
      outcome: injected.outcome,
      person_id: injected.person_id || null,
      reason: injected.reason || null,
    };
  }

  if (store && store.prompt48Landed === true && typeof store.resolveIdentityImpl !== "function") {
    return { outcome: "review_required", person_id: null, reason: PROMPT_48_REASON };
  }

  return { outcome: "review_required", person_id: null, reason: PROMPT_48_REASON };
}

export function lookupExternal(connectionId, identifierType, value, store) {
  if (isBlank(connectionId)) {
    throw namedError("IDENTITY-CONNECTION-REQUIRED", "External identifier lookup requires a connection.");
  }
  if (store && typeof store.lookupExternalImpl === "function") {
    return store.lookupExternalImpl(connectionId, identifierType, value);
  }
  return { found: false, person_id: null, reason: PROMPT_48_REASON };
}

export function assertNoPersonConstruction(sourceText) {
  const text = String(sourceText || "");
  const forbidden = [
    ["insert into ", "clinical.worker"].join(""),
    ["insert into ", "public.users"].join(""),
    ["insert into ", "public.workers"].join(""),
    ["insert into ", "mpi.person"].join(""),
  ];
  const hits = forbidden.filter((s) => text.toLowerCase().includes(s.toLowerCase()));
  return { ok: hits.length === 0, hits };
}
