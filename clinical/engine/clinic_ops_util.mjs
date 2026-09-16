/* Prompt 47 clinic-ops helpers: named failures and three-layer store reads.

   Live source, then cached or last-known, then a safe default. Required facts
   (jurisdiction, contract and role, hierarchy levels) fail named when missing.
   UNKNOWN is never rendered as 0. No em dashes or en dashes anywhere. */

export const UNKNOWN = "UNKNOWN";

export function namedError(code, message, extra) {
  const e = new Error(message);
  e.code = code;
  if (extra && typeof extra === "object") Object.assign(e, extra);
  return e;
}

export function requireStore(store, code, message) {
  if (!store || typeof store !== "object") {
    throw namedError(code || "STORE-MISSING", message || "An injected store is required. Never default.");
  }
  return store;
}

// Read a required value through the three layers. Missing required data fails
// named. A numeric zero is a real value; a missing value is UNKNOWN.
export function readLayer(store, liveGet, cacheGet, fallback, missingCode, missingMessage) {
  requireStore(store, missingCode, missingMessage);
  try {
    const live = liveGet(store);
    if (live !== undefined && live !== null) return { value: live, layer: "live" };
  } catch (e) {
    if (e && e.code) throw e;
  }
  try {
    const cached = typeof cacheGet === "function" ? cacheGet(store) : undefined;
    if (cached !== undefined && cached !== null) return { value: cached, layer: "cache" };
  } catch (e) {
    if (e && e.code) throw e;
  }
  if (fallback !== undefined) return { value: fallback, layer: "default" };
  throw namedError(missingCode || "DATA-MISSING", missingMessage || "Required data is missing. Never silent default.");
}

export function missingAsUnknown(value) {
  if (value === undefined || value === null || value === "") return UNKNOWN;
  return value;
}

export function nowFrom(store, at) {
  if (at) return new Date(at);
  if (store && store.now) return new Date(store.now);
  return new Date();
}
