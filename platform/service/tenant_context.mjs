/* Prompt 50 Section 3.5. Tenant context comes from the authenticated
   principal only. Header, query, body and envelope values are ignored.
   No em dashes or en dashes anywhere. */

import { namedError } from "./errors.mjs";
import { increment } from "./metrics.mjs";

const CLIENT_KEYS = Object.freeze(["organisation_id", "location_id", "actor_id"]);

function firstPresent(obj, key) {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  return undefined;
}

export function extractClientAssertions(input) {
  const src = input || {};
  const found = {};
  for (const key of CLIENT_KEYS) {
    const header = firstPresent(src.headers, key) || firstPresent(src.headers, "x-" + key);
    const query = firstPresent(src.query, key);
    const body = firstPresent(src.body, key);
    const envelope = firstPresent(src.envelope, key);
    if (header !== undefined) found[key + "_header"] = header;
    if (query !== undefined) found[key + "_query"] = query;
    if (body !== undefined) found[key + "_body"] = body;
    if (envelope !== undefined) found[key + "_envelope"] = envelope;
  }
  return found;
}

export function resolveTenantContext(principal, request) {
  if (!principal || !principal.organisation_id) {
    increment("tenant_context_missing_total");
    throw namedError(
      "TENANT-CONTEXT-MISSING",
      "This action needs a signed-in organisation. Sign in again, then retry."
    );
  }
  const ignored = extractClientAssertions(request);
  return {
    organisation_id: principal.organisation_id,
    location_id: principal.location_id || null,
    actor_id: principal.actor_id || principal.id || null,
    ignored_client_assertions: ignored,
  };
}

export function setConfigStatements(ctx) {
  if (!ctx || !ctx.organisation_id) {
    increment("tenant_context_missing_total");
    throw namedError(
      "TENANT-CONTEXT-MISSING",
      "This action needs a signed-in organisation. Sign in again, then retry."
    );
  }
  return [
    { sql: "select set_config('app.organisation_id', $1, true)", params: [ctx.organisation_id] },
    { sql: "select set_config('app.location_id', $1, true)", params: [ctx.location_id || ""] },
    { sql: "select set_config('app.actor_id', $1, true)", params: [ctx.actor_id || ""] },
  ];
}
