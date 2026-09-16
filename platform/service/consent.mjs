/* Prompt 50 Section 6 resolver port. All four arguments required.
   Alberta: board submission is not blocked by employer refusal.
   No em dashes or en dashes anywhere. */

import { namedError } from "./errors.mjs";
import { increment } from "./metrics.mjs";

export function consentState(personId, purpose, recipient, atDatetime, ledger) {
  if (!personId) throw namedError("CONSENT-PERSON-MISSING", "Consent lookup needs the person. Supply the person and retry.");
  if (!purpose) throw namedError("CONSENT-PURPOSE-MISSING", "Consent lookup needs a purpose. Supply the purpose and retry.");
  if (!recipient) throw namedError("CONSENT-RECIPIENT-MISSING", "Consent lookup needs a recipient. Consent for one recipient is not consent for another.");
  if (!atDatetime) throw namedError("CONSENT-AT-MISSING", "Consent lookup needs a date and time. A past disclosure is judged at its own date.");
  const at = new Date(atDatetime).getTime();
  const rows = (ledger || [])
    .filter((e) =>
      e.subject_person_id === personId &&
      e.purpose === purpose &&
      (e.scope_recipient === recipient || e.scope_recipient == null && recipient == null) &&
      new Date(e.effective_from).getTime() <= at &&
      !e.superseded_by_id
    )
    .sort((a, b) => new Date(a.effective_from) - new Date(b.effective_from) || new Date(a.created_at || a.effective_from) - new Date(b.created_at || b.effective_from));
  const latest = rows[rows.length - 1];
  let outcome = "never_asked";
  if (!latest) outcome = "never_asked";
  else if (latest.action === "revoked") outcome = "revoked";
  else if (latest.action === "refused") outcome = "refused";
  else if (latest.action === "expired") outcome = "expired";
  else if (latest.action === "granted") {
    outcome = latest.effective_to && new Date(latest.effective_to).getTime() <= at ? "expired" : "granted";
  }
  increment("consent_resolver_calls_total", { outcome });
  return outcome;
}

export function boardSubmissionPermitted(personId, jurisdiction, atDatetime, ledger) {
  if (!jurisdiction) throw namedError("CONSENT-JURISDICTION-MISSING", "Board permission needs a jurisdiction. Do not assume one.");
  if (jurisdiction !== "AB") {
    throw namedError("CONSENT-SPLIT-UNCONFIRMED", "The board versus employer consent split is confirmed for Alberta only.");
  }
  consentState(personId, "employer_disclosure", "employer:any", atDatetime, ledger);
  return true;
}

export function employerReleasePermitted(personId, recipient, atDatetime, ledger) {
  const state = consentState(personId, "employer_disclosure", recipient, atDatetime, ledger);
  return state === "granted";
}
