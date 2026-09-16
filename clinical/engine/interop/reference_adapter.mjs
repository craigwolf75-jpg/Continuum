/* Prompt 49 reference adapter.

   Synthetic only. Talks to nothing real. Used by the contract suite and
   the fixture library. Not a production vendor adapter.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";
import { CANONICAL_VERSION } from "./types.mjs";
import { emitUnansweredAxes } from "./functional.mjs";

const MANIFEST = Object.freeze([
  { field: "external_message_id", direction: "inbound", canonical: "source_provenance.external_record_id", purpose: "Idempotent message identity" },
  { field: "schema_version", direction: "inbound", canonical: "envelope.schema_version", purpose: "Schema validation" },
  { field: "person_external_id", direction: "inbound", canonical: "ExternalIdentifier", purpose: "Identity resolution input" },
  { field: "case_external_id", direction: "inbound", canonical: "OccupationalInjuryCase", purpose: "Case correlation" },
  { field: "status", direction: "both", canonical: "Status", purpose: "Lifecycle mapping" },
  { field: "code", direction: "inbound", canonical: "Coding", purpose: "Terminology mapping" },
  { field: "recorded_at", direction: "inbound", canonical: "source_recorded_at", purpose: "Source time" },
  { field: "weight_label", direction: "inbound", canonical: "FunctionalRestriction", purpose: "Band-only inbound" },
  { field: "axis", direction: "both", canonical: "FunctionalCapacity.axes", purpose: "Axis presence" },
  { field: "answered", direction: "both", canonical: "FunctionalCapacity.axes.answered", purpose: "Unanswered axis" },
  { field: "capability", direction: "both", canonical: "FunctionalCapacity.axes.capability", purpose: "Attested capability" },
  { field: "derived_band", direction: "outbound", canonical: "FunctionalCapacity.axes.derived_band", purpose: "Signed band only" },
  { field: "data_absent_reason", direction: "outbound", canonical: "FunctionalCapacity.axes.data_absent_reason", purpose: "Unanswered axis must be explicit" },
  { field: "authorship_provenance", direction: "outbound", canonical: "authorship_provenance", purpose: "Outbound deliverability" },
  { field: "lossy_projection", direction: "outbound", canonical: "Document", purpose: "FHIR export is one directional and lossy" },
]);

export function createReferenceAdapter() {
  return {
    descriptor() {
      return {
        name: "reference",
        version: "1.0.0",
        vendor: "synthetic",
        transport_pattern: "none",
        canonical_version: CANONICAL_VERSION,
        schema_versions: ["ref-1"],
      };
    },
    capabilities() {
      return {
        object_types: ["FunctionalCapacity", "Person", "Status", "Coding"],
        directions: ["inbound", "outbound"],
        cannot: [
          "fhir_import_functional_capacity",
          "production_transport",
          "identity_resolution",
          "band_derivation",
        ],
      };
    },
    fieldManifest() { return MANIFEST; },
    authenticate() { return { ok: true, connection_id: "ref-connection" }; },
    parseInbound(raw) {
      if (raw === null || raw === undefined) {
        throw namedError("ADAPTER-EMPTY", "Reference adapter received no bytes.");
      }
      if (typeof raw === "string") {
        try { return { intermediate: JSON.parse(raw), vendor: "synthetic" }; }
        catch (e) { throw namedError("ADAPTER-MALFORMED", "Reference adapter could not parse JSON."); }
      }
      return { intermediate: raw, vendor: "synthetic" };
    },
    buildOutbound(canonical) {
      const c = canonical || {};
      const axes = emitUnansweredAxes(c.axes || (c.functional && c.functional.axes) || []);
      return {
        status: c.status && c.status.canonical_state,
        axis: axes.map((a) => a.axis),
        answered: axes.map((a) => a.answered),
        capability: axes.map((a) => a.capability),
        derived_band: axes.map((a) => a.derived_band),
        data_absent_reason: axes.map((a) => a.data_absent_reason || null),
        authorship_provenance: c.authorship_provenance || null,
        lossy_projection: true,
      };
    },
    healthProbe() { return { ok: true, talking_to_real_system: false }; },
  };
}
