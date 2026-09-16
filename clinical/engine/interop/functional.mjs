/* Prompt 49 FunctionalCapacity projection and the four invariants.

   No new clinical measurement table. measured_hours and
   measured_weight_kg never leave Continuum. Band derivation is not
   performed here. An unanswered axis is never omitted.
   No em dashes or en dashes. */

import { namedError } from "./util.mjs";
import { isLegacy25PoundLabel } from "./units.mjs";

const DATA_ABSENT_UNANSWERED = "not-answered";

export function explicitAnswered(value) {
  if (value === true || value === "true") return true;
  return false;
}

export function explicitAxisSource(value) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

export function projectFunctionalCapacity(measurement, axisRows) {
  const m = measurement || {};
  const axes = (axisRows || []).map((row) => projectAxis(row));
  return Object.freeze({
    type: "FunctionalCapacity",
    maps_onto: "clinical.functional_measurement plus clinical.functional_axis_value",
    case_reference: m.case_id || m.case_reference || null,
    measurement_version: m.version || null,
    effective_from: m.effective_from || null,
    effective_to: m.effective_to || null,
    work_hours_per_day: m.work_hours_per_day || null,
    modified_hours: m.modified_hours === true,
    modified_duties: m.modified_duties === true,
    axes: Object.freeze(axes),
  });
}

export function projectAxis(row) {
  const r = row || {};
  const answered = explicitAnswered(r.answered);
  return Object.freeze({
    axis: r.axis,
    answered,
    skipped: r.skipped === true,
    skip_reason: r.skip_reason || null,
    capability: answered ? (r.capability || null) : null,
    measured_hours: r.measured_hours === undefined ? null : r.measured_hours,
    measured_weight_kg: r.measured_weight_kg === undefined ? null : r.measured_weight_kg,
    derived_band: r.derived_band || null,
    derived_capability_code: r.derived_capability_code || null,
    rounded_down: r.rounded_down === true,
    below_lowest_band: r.below_lowest_band === true,
    axis_source: explicitAxisSource(r.axis_source !== undefined && r.axis_source !== null && r.axis_source !== "" ? r.axis_source : r.source),
    authorship_provenance: r.authorship_provenance || null,
    source_provenance: r.source_provenance || null,
  });
}

export function projectFunctionalRestriction(axis) {
  return Object.freeze({
    type: "FunctionalRestriction",
    axis: axis && axis.axis,
    derived_band: axis && axis.derived_band || null,
    derived_capability_code: axis && axis.derived_capability_code || null,
    measured_hours: null,
    measured_weight_kg: null,
    authored: false,
  });
}

// Invariant 1: a measured value is never derived from a band.
export function inboundBandOnly(payload, metrics) {
  const p = payload || {};
  if (isLegacy25PoundLabel(p.source_value, p.source_unit) || isLegacy25PoundLabel(p.label, p.band)) {
    return {
      rejected: true,
      unmapped: true,
      restriction: projectFunctionalRestriction({ axis: p.axis, derived_band: null }),
      measured_hours: null,
      measured_weight_kg: null,
      warning: {
        code: "BAND-LEGACY-25-POUND",
        message: "The legacy 25 pound label is unmapped. No measured value was produced.",
        retained_source_value: String(p.source_value || p.label || "25 pound"),
      },
    };
  }
  const restriction = projectFunctionalRestriction({
    axis: p.axis,
    derived_band: p.band || p.derived_band || p.label || null,
    derived_capability_code: p.derived_capability_code || null,
  });
  if (metrics && typeof metrics.increment === "function" && (p.estimated || p.midpoint || p.lower_bound)) {
    metrics.increment("band_derived_outside_signature_total", {});
  }
  return {
    rejected: false,
    restriction,
    measured_hours: null,
    measured_weight_kg: null,
  };
}

export function assertNoBandDerivationImport(sourceText, metrics) {
  const text = String(sourceText || "");
  const hits = [];
  if (text.includes("deriveWeightBand")) hits.push("deriveWeightBand");
  if (text.includes("derive_weight_band")) hits.push("derive_weight_band");
  if (hits.length && metrics) metrics.increment("band_derived_outside_signature_total", {});
  return { ok: hits.length === 0, hits };
}

export function stripRawMeasurements(object, metrics) {
  if (!object || typeof object !== "object") return object;
  if (Array.isArray(object)) return object.map((item) => stripRawMeasurements(item, metrics));
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    if (key === "measured_hours" || key === "measured_weight_kg") {
      if (metrics) metrics.increment("raw_measurement_emitted_total", {});
      continue;
    }
    out[key] = stripRawMeasurements(value, metrics);
  }
  return out;
}

export function emitUnansweredAxes(axes, metrics) {
  const list = axes || [];
  return list.map((axis) => {
    if (axis.answered !== true) {
      if (axis.omitted === true && metrics) {
        metrics.increment("unanswered_axis_omitted_total", {});
      }
      return {
        ...axis,
        answered: false,
        capability: null,
        data_absent_reason: DATA_ABSENT_UNANSWERED,
        emitted: true,
      };
    }
    return { ...axis, emitted: true };
  });
}

export function renderUnanswered(surface, axis) {
  if (!axis) return { surface, explicit: false };
  if (axis.answered === true) return { surface, explicit: false };
  return {
    surface,
    explicit: true,
    data_absent_reason: DATA_ABSENT_UNANSWERED,
    text: "This axis was not answered.",
  };
}

export function assertInvariantSet(capacity) {
  const axes = (capacity && capacity.axes) || [];
  for (const axis of axes) {
    if (axis.derived_from_band && (axis.measured_hours !== null || axis.measured_weight_kg !== null)) {
      throw namedError("INVARIANT-1", "A measured value must never be derived from a band.");
    }
    if (axis.answered === false && (axis.capability === "able" || axis.omitted === true)) {
      throw namedError("INVARIANT-3", "An unanswered axis is never rendered as Able, unrestricted, or absent.");
    }
  }
  return true;
}
