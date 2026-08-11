/* Continuum Prompt 43: the duty match (Section 4.1, 4.2, 5). The employer sees duties,
   not restrictions: "put him on gatehouse and camera monitoring", not "8 kilograms" or
   "Unable above shoulder". A supervisor cannot act on a restriction; they can act on a
   duty verdict.

   The match runs against the DERIVED band, never the raw measurement (Section 4.2,
   criterion 9): a measured 8 kg emits LIMITED, which is 5 kg, and the match runs against
   5 kg. Matching against 8 would compute safe work at a capacity 60 percent above what
   the board was told, which is a safety defect. So this module derives the matching
   capacity from the band (via Prompt 39 deriveWeightBand) and never accepts a raw value.

   Every verdict reason is FUNCTIONAL prose, never clinical and never a restriction value
   (no kilograms, no hours, no band): the employer view carries duties and functional
   conditions, not per axis restriction values (Section 2, Section 4.3). Pure functions.
   No dashes anywhere. */

import { deriveWeightBand } from "./measurement.mjs";

// Band to a matching capacity in kilograms. HEAVY is the open top band. Used only inside
// the match; never emitted to the employer.
export const BAND_CAPACITY_KG = { LIMITED: 5, LIGHT: 10, MEDIUM: 20, HEAVY: Infinity };
export function capacityFromBand(band) {
  return Object.prototype.hasOwnProperty.call(BAND_CAPACITY_KG, band) ? BAND_CAPACITY_KG[band] : null;
}

// Derive the matching capacity from a measurement THROUGH the band (criterion 9). A
// measured 8 kg becomes LIMITED becomes 5 kg. Callers use this so the raw value never
// reaches the match.
export function capacityFromMeasurement(measuredKg) {
  const b = deriveWeightBand(measuredKg);
  return { band: b.band, capacityKg: capacityFromBand(b.band) };
}

const AXIS_LABEL = {
  sitting: "sitting", standing: "standing", walking: "walking", driving: "driving",
  bending: "bending", twisting: "twisting", kneeling_squatting: "kneeling or squatting",
  climbing: "climbing", pushing_pulling: "pushing or pulling",
  lifting_general: "lifting", lifting_floor_to_waist: "lifting from floor to waist",
  lifting_waist_to_shoulder: "lifting from waist to shoulder", lifting_above_shoulder: "lifting above the shoulder",
  overhead_reaching: "overhead reaching",
};
const pretty = (axis) => AXIS_LABEL[axis] || String(axis || "").replace(/_/g, " ");

// Match one duty against the worker's restricted axes. restrictionByAxis maps an axis to
// { capability: 'limited' | 'unable', quantity_kind, capacityKg, hoursLimit,
//   legacyNoMeasurement }. Returns { verdict, condition_text, excluded_because,
//   unmapped_demand }. Only restricted axes are considered; an axis the worker is Able on
//   never excludes a duty.
export function matchDuty(duty, restrictionByAxis) {
  const restricted = Object.entries(restrictionByAxis || {}).filter(([, r]) => r && r.capability && r.capability !== "able");
  let excluded_because = null, condition_text = null, unmapped = false, conditional = false;

  for (const [axis, r] of restricted) {
    if (r.legacyNoMeasurement) {
      // Section 5: a legacy R code with no underlying measurement suppresses the match.
      unmapped = true;
      condition_text = "The restriction on " + pretty(axis) + " is a historical label with no measurement; a coordinator must confirm this duty before it is used.";
      continue;
    }
    const demand = (duty.demands || []).find((d) => d.axis === axis);
    if (!demand) {
      // criterion 4: a duty with no rating on a restricted axis is never safe.
      unmapped = true;
      condition_text = "The demand on " + pretty(axis) + " is not rated for this duty; a coordinator must confirm it is within the worker's current capacity.";
      continue;
    }
    // A demand's load: binary true is a demand, a positive weight or hours is a demand,
    // binary false or a zero load means the duty rates the axis but does not stress it.
    const load = demand.kind === "binary" ? (demand.required === true ? 1 : 0) : Number(demand.required) || 0;
    if (load <= 0) continue; // rated and not stressed: safe for this axis

    if (r.capability === "unable") {
      excluded_because = "requires " + pretty(axis) + ", which the worker cannot do now";
    } else if (r.capability === "limited") {
      const cap = r.quantity_kind === "weight" ? Number(r.capacityKg) : Number(r.hoursLimit);
      if (load > cap) {
        excluded_because = r.quantity_kind === "hours"
          ? "requires more hours of " + pretty(axis) + " than the worker can currently manage"
          : "requires " + pretty(axis) + " above the worker's current capacity";
      } else {
        // within the current capacity, but the axis is stressed: safe with a condition.
        conditional = true;
        condition_text = condition_text || "safe only while " + pretty(axis) + " stays within the worker's current capacity";
      }
    }
  }

  if (excluded_because) return { verdict: "excluded", condition_text: null, excluded_because, unmapped_demand: false };
  if (unmapped) return { verdict: "conditional", condition_text, excluded_because: null, unmapped_demand: true };
  if (conditional) return { verdict: "conditional", condition_text, excluded_because: null, unmapped_demand: false };
  return { verdict: "safe", condition_text: null, excluded_because: null, unmapped_demand: false };
}

// Match a whole job profile. duties is the employer's profile for this worker's title.
// With no profile, publish nothing and route to the coordinator (Section 5, criterion 3);
// never guess duties (Section 7). Otherwise return the duty match lines and a summary.
export function matchDuties(duties, restrictionByAxis) {
  if (!duties || duties.length === 0) {
    return {
      published: false, reason: "no-job-profile",
      message: "The employer has no job profile for this worker's title. Nothing is published; route to the coordinator.",
      lines: [],
    };
  }
  const lines = duties.map((d) => {
    const m = matchDuty(d, restrictionByAxis);
    return { duty_id: d.duty_id, duty_name: d.duty_name, ...m };
  });
  const summary = {
    safe: lines.filter((l) => l.verdict === "safe").length,
    conditional: lines.filter((l) => l.verdict === "conditional").length,
    excluded: lines.filter((l) => l.verdict === "excluded").length,
  };
  return { published: true, lines, summary };
}

// An expired restriction set renders as expired, never as current (criterion 8, Section 5).
export function restrictionSetState(set, asOfDate) {
  if (set && set.withdrawn_at) return "withdrawn";
  if (set && set.effective_to && String(set.effective_to) < String(asOfDate)) return "expired";
  return "current";
}
