/* Prompt 50 Section 7. Hash chain and in-transaction audit helper.
   No em dashes or en dashes anywhere. */

import { createHash, randomUUID } from "node:crypto";
import { namedError } from "./errors.mjs";

export function canonicalRow(row) {
  const r = row || {};
  return [
    r.occurred_at, r.organisation_id, r.location_id || "", r.actor_id || "",
    r.actor_type, r.actor_role || "", r.action, r.entity_type, r.entity_id || "",
    r.subject_person_id || "", r.lawful_basis_type || "", r.lawful_basis_ref || "",
    r.access_reason || "", r.correlation_id, r.outcome, r.denial_reason || "",
  ].join("|");
}

export function digestFor(sequence, previousDigest, row) {
  const prev = previousDigest ? Buffer.from(previousDigest).toString("hex") : "";
  return createHash("sha256").update(String(sequence) + "|" + prev + "|" + canonicalRow(row), "utf8").digest();
}

export function appendRecord(input, store) {
  const src = input || {};
  if (!store || !store.organisation_id && !(src.organisation_id)) {
    throw namedError("AUDIT-ORG-MISSING", "An audit record needs an organisation.");
  }
  if (src.action === "disclose" && (!src.lawful_basis_type || !src.lawful_basis_ref)) {
    throw namedError("AUDIT-LAWFUL-BASIS-MISSING", "A disclosure needs a lawful basis. It was not recorded.");
  }
  store.records = store.records || [];
  const org = src.organisation_id || store.organisation_id;
  const prior = store.records.filter((r) => r.organisation_id === org).sort((a, b) => a.record_sequence - b.record_sequence);
  const last = prior[prior.length - 1];
  const sequence = last ? last.record_sequence + 1 : 1;
  const occurred_at = src.occurred_at || new Date().toISOString();
  const row = {
    id: src.id || randomUUID(),
    occurred_at,
    organisation_id: org,
    location_id: src.location_id || null,
    actor_id: src.actor_id || null,
    actor_type: src.actor_type || "user",
    actor_role: src.actor_role || null,
    action: src.action,
    entity_type: src.entity_type,
    entity_id: src.entity_id || null,
    subject_person_id: src.subject_person_id || null,
    lawful_basis_type: src.lawful_basis_type || null,
    lawful_basis_ref: src.lawful_basis_ref || null,
    access_reason: src.access_reason || null,
    correlation_id: src.correlation_id,
    outcome: src.outcome,
    denial_reason: src.denial_reason || null,
    record_sequence: sequence,
    previous_digest: last ? last.record_digest : null,
  };
  row.record_digest = digestFor(sequence, row.previous_digest, row);
  store.records.push(row);
  return row;
}

export function verifyChain(organisationId, records) {
  const rows = (records || []).filter((r) => r.organisation_id === organisationId).sort((a, b) => a.record_sequence - b.record_sequence);
  for (const r of rows) {
    const expected = digestFor(r.record_sequence, r.previous_digest, r);
    if (Buffer.compare(Buffer.from(expected), Buffer.from(r.record_digest)) !== 0) return r.record_sequence;
  }
  return null;
}
