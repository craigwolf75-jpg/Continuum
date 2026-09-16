/* Prompt 49 FHIR export.

   One directional. There is no FHIR import path into FunctionalCapacity.
   Every exported FunctionalCapacity carries an explicit lossy-projection
   note in the resource. Unanswered axes export with a data-absent reason
   and are never omitted. measured_hours and measured_weight_kg never
   appear. No em dashes or en dashes. */

import { emitUnansweredAxes, stripRawMeasurements } from "./functional.mjs";

const LOSSY_NOTE = "This FunctionalCapacity export is a lossy projection. It omits the carry-forward chain, axis_source, authorship_provenance, source_provenance, and the measured values, which never leave Continuum.";

export function exportFunctionalCapacity(capacity) {
  const axes = emitUnansweredAxes((capacity && capacity.axes) || []);
  const resource = {
    resourceType: "Observation",
    status: "final",
    code: { text: "FunctionalCapacity" },
    extension: [
      { url: "https://continuum.example/fhir/lossy-projection", valueString: LOSSY_NOTE },
    ],
    component: axes.map((axis) => {
      if (axis.answered === false) {
        return {
          code: { text: axis.axis },
          dataAbsentReason: { coding: [{ code: "not-answered", display: "This axis was not answered." }] },
        };
      }
      return {
        code: { text: axis.axis },
        valueCodeableConcept: { text: axis.derived_capability_code || axis.derived_band || axis.capability || "unmapped" },
      };
    }),
  };
  const stripped = stripRawMeasurements(resource, null);
  const blob = JSON.stringify(stripped);
  if (blob.includes("measured_hours") || blob.includes("measured_weight_kg")) {
    throw new Error("FHIR export contained a raw measurement.");
  }
  return stripped;
}

export function importFunctionalCapacityFromFhir() {
  return { ok: false, reason: "There is no FHIR import path into FunctionalCapacity. An inbound FHIR resource enters through the normal pipeline." };
}
