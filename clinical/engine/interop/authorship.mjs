/* Prompt 49 authorship transition.

   authorship_provenance is the Prompt 41 enumeration. Do not extend it.
   Transport is not authorship. Normalisation may preserve or degrade a
   value. It may never improve it. A model response cannot become human.

   Rank, low to high: ai_draft < system < carried_forward < ai_draft_edited < human

   source_provenance is integration lineage and is a separate object.
   The bare identifier from Prompt 41 is not reused.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";

export const AUTHORSHIP_VALUES = Object.freeze([
  "human",
  "ai_draft",
  "ai_draft_edited",
  "carried_forward",
  "system",
]);

const RANK = Object.freeze({
  ai_draft: 1,
  system: 2,
  carried_forward: 3,
  ai_draft_edited: 4,
  human: 5,
});

export function isImprovingTransition(fromValue, toValue) {
  return RANK[toValue] > RANK[fromValue];
}

// Pure function. Exhaustive callers iterate AUTHORSHIP_VALUES x AUTHORSHIP_VALUES.
export function transitionAuthorship(fromValue, toValue, metrics) {
  if (!AUTHORSHIP_VALUES.includes(fromValue)) {
    throw namedError("AUTHORSHIP-UNKNOWN", "Unrecognised authorship_provenance value.");
  }
  if (toValue === undefined || toValue === null || toValue === fromValue) {
    return { ok: true, value: fromValue, degraded: false };
  }
  if (!AUTHORSHIP_VALUES.includes(toValue)) {
    throw namedError("AUTHORSHIP-UNKNOWN", "Unrecognised authorship_provenance value.");
  }
  if (isImprovingTransition(fromValue, toValue)) {
    if (metrics && typeof metrics.increment === "function") {
      metrics.increment("provenance_upgrade_attempt_total", {});
    }
    throw namedError(
      "AUTHORSHIP-UPGRADE-FORBIDDEN",
      "authorship_provenance may be preserved or degraded, never improved. Transport is not authorship.",
    );
  }
  return { ok: true, value: toValue, degraded: RANK[toValue] < RANK[fromValue] };
}

export function createSourceProvenance(input) {
  const r = input || {};
  return Object.freeze({
    type: "SourceProvenance",
    source_system: r.source_system || null,
    connection_id: r.connection_id || null,
    inbound_message_id: r.inbound_message_id || null,
    external_record_id: r.external_record_id || null,
    adapter_name: r.adapter_name || null,
    adapter_version: r.adapter_version || null,
    canonical_version: r.canonical_version || null,
    mapping_version: r.mapping_version || null,
    received_at: r.received_at || null,
    source_recorded_at: r.source_recorded_at || null,
    transformations_applied: Object.freeze([...(r.transformations_applied || [])]),
    warnings: Object.freeze([...(r.warnings || [])]),
    human_amended_at: r.human_amended_at || null,
    human_amended_by: r.human_amended_by || null,
  });
}

export function createProvenancePair(authorship, source) {
  return Object.freeze({
    type: "Provenance",
    authorship_provenance: authorship,
    source_provenance: source,
  });
}

export function outboundDeliverable(authorship) {
  if (authorship === "ai_draft") return { deliverable: false, reason: "ai_draft" };
  if (authorship === "ai_draft_edited" || authorship === "human") return { deliverable: true, reason: null };
  if (authorship === "carried_forward" || authorship === "system") return { deliverable: true, reason: null };
  return { deliverable: false, reason: "unmapped_authorship" };
}
