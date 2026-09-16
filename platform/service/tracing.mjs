/* Prompt 50 Section 11.2. W3C traceparent plus a correlation id. Span
   attributes are identifiers only. No em dashes or en dashes anywhere. */

import { randomUUID } from "node:crypto";

export function parseTraceparent(header) {
  const raw = String(header || "").trim();
  const parts = raw.split("-");
  if (parts.length !== 4 || parts[0] !== "00" || parts[1].length !== 32 || parts[2].length !== 16) {
    return null;
  }
  return { version: parts[0], traceId: parts[1], parentId: parts[2], flags: parts[3] };
}

export function makeTraceparent(existing) {
  const parsed = parseTraceparent(existing);
  const traceId = parsed ? parsed.traceId : randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "").slice(0, 8);
  const parentId = randomUUID().replace(/-/g, "").slice(0, 16);
  return "00-" + traceId.slice(0, 32) + "-" + parentId + "-01";
}

export function edgeIds(existingTraceparent) {
  return {
    correlation_id: randomUUID(),
    traceparent: makeTraceparent(existingTraceparent),
  };
}

export function spanAttributes(ids) {
  const src = ids || {};
  return {
    organisation_id: src.organisation_id || null,
    location_id: src.location_id || null,
    correlation_id: src.correlation_id || null,
    statement_name: src.statement_name || null,
  };
}
