/* Prompt 50 Section 10.2. UUID v4 for anything exposed. v7 only on internal
   append-only tables and never in a response or document.
   No em dashes or en dashes anywhere. */

import { randomUUID } from "node:crypto";
import { namedError } from "./errors.mjs";

export function newPublicId() {
  return randomUUID();
}

export function uuidVersion(id) {
  const raw = String(id || "");
  const m = raw.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([1-8])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  return m ? Number(m[1]) : null;
}

export function assertNotExposedV7(id, surface) {
  if (uuidVersion(id) === 7) {
    throw namedError("UUID-V7-EXPOSED", "An internal time-ordered identifier cannot be shown on " + surface + ".");
  }
  return true;
}

export function isSequentialIntegerKey(type) {
  const t = String(type || "").toLowerCase();
  return t === "serial" || t === "bigserial" || t === "smallserial" || t.includes("integer") && t.includes("generated");
}
