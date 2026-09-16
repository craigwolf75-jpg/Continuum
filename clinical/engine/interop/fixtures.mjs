/* Prompt 49 fixture library. Versioned corpus. Every adapter runs against
   all of it. Unmapped is unmapped. No em dashes or en dashes. */

export const FIXTURE_LIBRARY_VERSION = "1.0.0";

export const FIXTURES = Object.freeze([
  { id: "valid-payload", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true, capability: "able" } },
  { id: "missing-optional", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true } },
  { id: "missing-required", expect: "rejected_invalid_source", required_fields: ["person_external_id"], body: { schema_version: "ref-1", status: "Final" } },
  { id: "unknown-status", expect: "requires_manual_reconciliation", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "KindaOpen", axis: "sitting", answered: true } },
  { id: "unknown-code", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", code: "NO-SUCH", code_set: "demo", axis: "sitting", answered: true } },
  { id: "unknown-field", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true, vendor_extra: { colour: "blue" } } },
  { id: "duplicate-identifier", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true } },
  { id: "duplicate-message", expect: "replay", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true }, external_message_id: "dup-1" },
  { id: "invalid-timestamp", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", recorded_at: "not-a-date", axis: "sitting", answered: true } },
  { id: "timestamp-no-offset", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", recorded_at: "2026-09-16T09:00:00", axis: "sitting", answered: true } },
  { id: "date-only", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", birth_date: "1980-05-01", axis: "sitting", answered: true } },
  { id: "unrecognised-unit", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "lifting_general", answered: true, weight_value: 10, weight_unit: "stones-imperial" } },
  { id: "inexact-unit", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "lifting_general", answered: true, weight_value: 25, weight_unit: "lb" } },
  { id: "band-only", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "lifting_general", answered: true, weight_label: "LIGHT" } },
  { id: "legacy-25-pound", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "lifting_general", answered: true, weight_label: "25 pound" } },
  { id: "unanswered-axis", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: false } },
  { id: "ai-draft-inbound", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true, authorship_provenance: "ai_draft" } },
  { id: "contradict-signed", expect: "requires_manual_reconciliation", incoming_contradicts_signed: true, signed_row: { digest: "abc" }, body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true } },
  { id: "older-supported-schema", expect: "review_or_normalised", schema_version: "ref-1", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true } },
  { id: "unsupported-schema", expect: "rejected_unsupported_schema", schema_version: "ref-9", body: { schema_version: "ref-9", person_external_id: "ext-1", status: "Final" } },
  { id: "oversized-payload", expect: "rejected_invalid_source", max_bytes: 16, body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", pad: "xxxxxxxxxxxxxxxxxxxxxxxx" } },
  { id: "malformed-payload", expect: "rejected_invalid_source", raw: "{not-json", content_type: "application/json" },
  { id: "vendor-extension", expect: "review_or_normalised", body: { schema_version: "ref-1", person_external_id: "ext-1", status: "Final", axis: "sitting", answered: true, extension_vendor_flag: true } },
]);

export function fixtureById(id) {
  return FIXTURES.find((f) => f.id === id);
}
