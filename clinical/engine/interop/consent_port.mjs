/* Prompt 49 consent evaluation.

   ConsentReference holds an identifier only. The answer to "is there
   consent" always comes from consent_state() at call time. A cached
   consent value on a canonical object is a defect.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";

export const CONSENT_STATES = Object.freeze([
  "granted",
  "refused",
  "revoked",
  "expired",
  "never_asked",
]);

export function evaluateConsent(args, store) {
  const a = args || {};
  if (!a.subject_person_id) throw namedError("CONSENT-SUBJECT", "consent_state requires a subject person.");
  if (!a.purpose) throw namedError("CONSENT-PURPOSE", "consent_state requires a purpose.");
  if (!a.recipient) throw namedError("CONSENT-RECIPIENT", "consent_state requires a recipient.");
  if (!a.at) throw namedError("CONSENT-AT", "consent_state requires an at_datetime.");
  if (store && typeof store.consent_state === "function") {
    return store.consent_state(a.subject_person_id, a.purpose, a.recipient, a.at);
  }
  throw namedError("CONSENT-RESOLVER-MISSING", "consent_state() is not available. Fail closed.");
}

export function assertNoCachedConsent(canonical) {
  if (!canonical || typeof canonical !== "object") return { ok: true };
  if (Object.prototype.hasOwnProperty.call(canonical, "consent_state") && canonical.consent_state !== undefined) {
    return { ok: false, reason: "ConsentReference must not carry a cached consent_state." };
  }
  if (canonical.cached_state !== undefined) {
    return { ok: false, reason: "ConsentReference must not carry cached_state." };
  }
  return { ok: true };
}
