/* Prompt 47 Part 3: configuration policy on the existing config framework.

   D7 restated in Part 3.1: anything that varies by customer, jurisdiction,
   board, payer or year is data; invariants are code; config is versioned,
   effective dated, auditable, and diffable. Part 3.2: inherited (child cannot
   change), default (child may change), locked (corporate froze it). Part 6.2:
   jurisdiction and board credentials are location-owned and NEVER inherited.
   STOP: Master Architecture D7 details beyond that restatement are not invented
   (see docs/prompts/47/STOPS.md). No em dashes or en dashes anywhere. */

import { namedError, requireStore } from "./clinic_ops_util.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const OVERRIDE_POLICIES = Object.freeze(["inherited", "default", "locked"]);
export const LOCATION_ONLY_KEYS = Object.freeze([
  "location.jurisdiction_code",
  "location.board_credential_key",
]);

const CHILD_SCOPES = Object.freeze(["region", "location"]);
const SCOPE_RANK = Object.freeze({ global: 0, organisation: 1, region: 2, location: 3 });

export function assertOverrideAllowed(definition, scopeType) {
  if (!definition || !definition.key) {
    throw namedError("CONFIG-KEY-UNKNOWN", "An unknown configuration key cannot be set.");
  }
  const policy = norm(definition.override_policy) || "default";
  if (!OVERRIDE_POLICIES.includes(policy)) {
    throw namedError("OVERRIDE-POLICY-UNKNOWN", "override_policy must be inherited, default, or locked.");
  }
  const scope = norm(scopeType);
  if (LOCATION_ONLY_KEYS.includes(definition.key) && scope !== "location") {
    throw namedError("JURISDICTION-NEVER-INHERITED", "Jurisdiction and board credentials are location-owned and never inherited.");
  }
  const allowed = String(definition.allowed_scopes || "").split(",").map(norm).filter(Boolean);
  if (allowed.length && !allowed.includes(scope)) {
    throw namedError("CONFIG-SCOPE-DENIED", "Configuration key " + definition.key + " may not be set at scope " + scope + ".");
  }
  if (policy === "inherited" && CHILD_SCOPES.includes(scope)) {
    throw namedError("OVERRIDE-INHERITED", "Key " + definition.key + " is inherited: a child scope cannot change it.");
  }
  if (policy === "locked") {
    throw namedError("OVERRIDE-LOCKED", "Key " + definition.key + " is locked: corporate froze it.");
  }
  return { ok: true, policy, scope };
}

export function assertLocationOwned(key, scopeType) {
  const k = norm(key);
  if (LOCATION_ONLY_KEYS.includes(k) && norm(scopeType) !== "location") {
    throw namedError("JURISDICTION-NEVER-INHERITED", "Jurisdiction and board credentials are location-owned and never inherited.");
  }
  return true;
}

export function listOverrides(store, organisationId) {
  requireStore(store, "CONFIG-STORE-MISSING", "A configuration store is required.");
  const defs = store.definitions || (store.cache && store.cache.definitions) || [];
  const values = store.values || (store.cache && store.cache.values) || [];
  const org = norm(organisationId);
  const byKey = new Map();
  for (const v of values) {
    if (org && v.organisation_id && v.organisation_id !== org && v.scope_type !== "global") continue;
    const list = byKey.get(v.key) || [];
    list.push(v);
    byKey.set(v.key, list);
  }
  const overrides = [];
  const lockedDrift = [];
  for (const [key, rows] of byKey.entries()) {
    const def = defs.find((d) => d.key === key) || { key, override_policy: "default", allowed_scopes: "" };
    const sorted = rows.slice().sort((a, b) => (SCOPE_RANK[a.scope_type] || 0) - (SCOPE_RANK[b.scope_type] || 0));
    const parent = sorted[0];
    for (const child of sorted.slice(1)) {
      if (JSON.stringify(child.value) === JSON.stringify(parent.value)) continue;
      const item = {
        key,
        override_policy: def.override_policy || "default",
        parent_scope: parent.scope_type,
        child_scope: child.scope_type,
        parent_value: parent.value,
        child_value: child.value,
      };
      if (def.override_policy === "locked" || def.override_policy === "inherited") {
        lockedDrift.push({ ...item, drift: true });
      } else {
        overrides.push(item);
      }
    }
    if (LOCATION_ONLY_KEYS.includes(key)) {
      for (const row of rows) {
        if (row.scope_type !== "location") {
          lockedDrift.push({
            key,
            override_policy: def.override_policy || "default",
            child_scope: row.scope_type,
            drift: true,
            reason: "jurisdiction-or-board-credential-not-location",
          });
        }
      }
    }
  }
  return { overrides, corporate_drift: lockedDrift };
}

export function diffValues(a, b) {
  return {
    before: a === undefined ? null : a,
    after: b === undefined ? null : b,
    changed: JSON.stringify(a) !== JSON.stringify(b),
  };
}
