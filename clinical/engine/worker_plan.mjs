/* Continuum Prompt 39 criterion 8: the worker plan payload.

   The derived band governs every downstream output. The raw measurement never leaves
   Continuum. A practitioner measures 8 kg; the board is told LIMITED (5 kg); the worker
   plan says about 5 kilograms, not 8. Emitting the raw value to a worker surface puts a
   60 percent discrepancy into the plan, which is a safety defect.

   This module projects ONLY derived_band and derived_capability_code. It never copies
   measured_weight_kg or measured_hours. A schema level test fails the build if a raw
   key appears. Prompt 43 employer_schema.rawMeasurementInPayload is the shared scanner.
   No dashes anywhere. */

const BAND_KG = { LIMITED: 5, LIGHT: 10, MEDIUM: 20 };

export function bandPlainLanguage(band) {
  if (band === "LIMITED") return "about 5 kilograms";
  if (band === "LIGHT") return "about 10 kilograms";
  if (band === "MEDIUM") return "about 20 kilograms";
  if (band === "HEAVY") return "over 20 kilograms";
  return null;
}

// Project a signed measurement into the worker plan. Input axes are the frozen
// signMeasurement rows (which still hold raw values internally). Output axes carry
// only the derived band and code.
export function workerPlanPayload(input) {
  const axes = (input && input.axes) || [];
  return {
    case_ref: (input && input.case_ref) || null,
    form_id: (input && input.form_id) || null,
    measurement_version: (input && input.measurement_version) || null,
    work_status: (input && input.work_status) || null,
    hours_per_day: (input && input.hours_per_day) != null ? input.hours_per_day : null,
    axes: axes.map((a) => ({
      axis: a.axis,
      skipped: Boolean(a.skipped),
      derived_band: a.derived_band || null,
      derived_capability_code: a.derived_capability_code || null,
      band_plain_language: bandPlainLanguage(a.derived_band),
      band_capacity_kg: Object.prototype.hasOwnProperty.call(BAND_KG, a.derived_band) ? BAND_KG[a.derived_band] : null,
    })),
  };
}
