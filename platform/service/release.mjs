/* Prompt 50 Section 4.1 release path. The only module allowed to read a
   clinical identifier and write an employer disclosure. No foreign key.
   No em dashes or en dashes anywhere. */

import { createHash, randomUUID } from "node:crypto";
import { namedError } from "./errors.mjs";
import { employerReleasePermitted } from "./consent.mjs";
import { increment } from "./metrics.mjs";
import { appendRecord } from "./audit.mjs";

export const RELEASE_PATH = "platform/service/release.mjs";

export function releaseToEmployer(input, store) {
  const src = input || {};
  if (!store) throw namedError("RELEASE-STORE-MISSING", "A release store is required.");
  if (!src.consent_ledger_entry_id) {
    throw namedError("RELEASE-CONSENT-MISSING", "A disclosure cannot be made without a consent ledger entry.");
  }
  if (!src.payload || !src.source_report_id) {
    throw namedError("RELEASE-ARGS-MISSING", "A disclosure needs the filtered payload and the source report identifier.");
  }
  const ok = employerReleasePermitted(src.person_id, src.recipient, src.at, store.consentLedger || []);
  if (!ok) {
    increment("disclosure_blocked_total", { action: "release_to_employer", outcome: "blocked" });
    appendRecord({
      action: "disclose",
      entity_type: "employer_disclosure_release",
      outcome: "denied",
      organisation_id: src.organisation_id,
      correlation_id: src.correlation_id,
      lawful_basis_type: "consent",
      lawful_basis_ref: src.consent_ledger_entry_id,
      denial_reason: "consent not granted",
      subject_person_id: src.person_id,
    }, store);
    throw namedError("RELEASE-BLOCKED", "This disclosure is not allowed. Employer disclosure needs an active consent.");
  }
  const digest = createHash("sha256").update(JSON.stringify(src.payload), "utf8").digest();
  const row = {
    id: src.id || randomUUID(),
    organisation_id: src.organisation_id,
    location_id: src.location_id || null,
    employer_party_id: src.employer_party_id,
    claim_reference: src.claim_reference,
    source_report_id: src.source_report_id,
    disclosure_profile: src.disclosure_profile,
    consent_ledger_entry_id: src.consent_ledger_entry_id,
    released_at: src.at,
    released_by: src.released_by,
    payload: src.payload,
    payload_digest: digest,
  };
  store.releases = store.releases || [];
  store.releases.push(row);
  appendRecord({
    action: "disclose",
    entity_type: "employer_disclosure_release",
    outcome: "permitted",
    organisation_id: src.organisation_id,
    correlation_id: src.correlation_id,
    lawful_basis_type: "consent",
    lawful_basis_ref: src.consent_ledger_entry_id,
    subject_person_id: src.person_id,
    entity_id: row.id,
  }, store);
  return row;
}
