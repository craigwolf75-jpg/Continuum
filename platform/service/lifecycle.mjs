/* Prompt 50 Section 3.3 tenant lifecycle. One directional except
   suspended to active. No data is removed. No em dashes or en dashes. */

import { namedError } from "./errors.mjs";

export const STATUSES = Object.freeze([
  "prospect", "onboarding", "active", "suspended", "closed", "archived",
]);

const ALLOWED = Object.freeze({
  prospect: ["onboarding"],
  onboarding: ["active"],
  active: ["suspended", "closed"],
  suspended: ["active"],
  closed: ["archived"],
  archived: [],
});

export function privileges(status) {
  const s = String(status || "");
  if (s === "prospect") return { data_readable: false, data_writable: false, sign_in: false };
  if (s === "onboarding") return { data_readable: true, data_writable: false, sign_in: true };
  if (s === "active") return { data_readable: true, data_writable: true, sign_in: true };
  if (s === "suspended") return { data_readable: true, data_writable: false, sign_in: true };
  if (s === "closed") return { data_readable: true, data_writable: false, sign_in: false };
  if (s === "archived") return { data_readable: false, data_writable: false, sign_in: false };
  throw namedError("LIFECYCLE-STATUS-UNKNOWN", "That organisation status is not recognised. Ask your administrator.");
}

export function assertTransition(from, to) {
  const allowed = ALLOWED[from];
  if (!allowed || !allowed.includes(to)) {
    throw namedError(
      "LIFECYCLE-TRANSITION-DENIED",
      "That organisation cannot move from " + from + " to " + to + ". Choose an allowed next status."
    );
  }
  return { from, to };
}

export function applyTransition(org, to) {
  if (!org) throw namedError("LIFECYCLE-ORG-MISSING", "An organisation is required.");
  assertTransition(org.status, to);
  const next = { ...org, status: to };
  if (to === "active") next.activated_at = next.activated_at || "set";
  if (to === "suspended") next.suspended_at = "set";
  if (to === "closed") next.closed_at = "set";
  if (to === "archived") next.archived_at = "set";
  return { organisation: next, privileges: privileges(to), audit: true, event: "tenant.lifecycle_changed" };
}
