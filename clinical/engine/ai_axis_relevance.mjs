/* Continuum Prompt 44, AI-04 axis relevance (the /ai/axes component). Deterministic, not a
   model (Section 2.1). It proposes WHICH functional axes to open for a part of body and nature
   of injury, and it structurally CANNOT propose a capability value or a quantity (Section
   0A.2, Section 7, acceptance criterion 1).

   The return type is functional_axis[]. In a typed surface this would be FunctionalAxis[],
   where FunctionalAxis is the string union of the twenty axis names and excludes every
   capability and quantity type. This file is plain JavaScript, so the same guarantee is
   enforced at runtime: every returned element is checked against FUNCTIONAL_AXES and a value
   shaped element (a capability word or a number or a unit) throws rather than being returned.
   A test proves the return can carry only axis names.

   AI-04 is not on the model rate limit and is not gated on consent A (Section 2.1, 2.2): it is
   a table lookup, so it neither calls a provider nor consumes protected content. It writes
   nothing to wcb_report_field (it is advisory, Section 2.2). No dashes anywhere. */

import { FUNCTIONAL_AXES, AXIS_RELEVANCE, AXIS_RELEVANCE_STATUS } from "./ai_axis_relevance.data.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim().toLowerCase();
const AXIS_SET = new Set(FUNCTIONAL_AXES);

// A capability word or a quantity must never appear in an axis list. These are the shapes a
// value would take (Section 7 row 1); the guard rejects any of them.
const CAPABILITY_WORDS = new Set(["able", "unable", "limited", "limited_to", "restricted_from"]);
function isValueShaped(token) {
  const t = norm(token);
  if (t === "") return true;                       // empty is not an axis name
  if (CAPABILITY_WORDS.has(t)) return true;        // a capability
  if (/\d/.test(t)) return true;                   // a quantity (kg, hours, a number)
  if (/\b(kg|kilograms?|hrs?|hours?|lb|lbs)\b/.test(t)) return true; // a unit
  return false;
}

// The structural guarantee (criterion 1): the return can carry ONLY axis names. Any element
// that is not a known functional axis, or that is value shaped, throws. There is no code path
// by which AI-04 returns a value.
export function assertAxesOnly(axes) {
  if (!Array.isArray(axes)) {
    const e = new Error("AI-04 must return an array of axis names."); e.code = "AI04-NOT-AN-ARRAY"; throw e;
  }
  for (const a of axes) {
    if (typeof a !== "string" || !AXIS_SET.has(a) || isValueShaped(a)) {
      const e = new Error("AI-04 returned a non axis element: " + JSON.stringify(a) + ". AI-04 proposes which axes to open, never a value.");
      e.code = "AI04-VALUE-LEAK"; throw e;
    }
  }
  return axes;
}

// Find the first matching rule for a part of body and nature of injury. A rule with a null
// nature matches any nature for that part. Case insensitive.
function matchRule(partOfBody, natureOfInjury) {
  const p = norm(partOfBody), n = norm(natureOfInjury);
  return AXIS_RELEVANCE.find((r) => norm(r.part_of_body) === p && (r.nature_of_injury === null || norm(r.nature_of_injury) === n)) || null;
}

// Propose the axes to open. Returns { axes, opened_all, matched, reasoning }. An unmapped part
// or nature opens ALL axes (safe and slow, never a guess, Section 2.1). The returned axes are
// always a frozen, deduplicated, order stable subset of FUNCTIONAL_AXES, and pass
// assertAxesOnly, so no value can leak.
export function proposeAxes(partOfBody, natureOfInjury) {
  const rule = matchRule(partOfBody, natureOfInjury);
  let axes, opened_all, reasoning;

  if (!rule) {
    axes = FUNCTIONAL_AXES.slice();
    opened_all = true;
    reasoning = "No mapping for part " + JSON.stringify(norm(partOfBody)) + " and nature " + JSON.stringify(norm(natureOfInjury)) + "; all axes opened for safety (AI-04 never guesses a narrower set).";
  } else {
    // Keep the vocabulary order, drop anything not in the vocabulary, dedupe.
    const wanted = new Set(rule.axes.map(norm));
    axes = FUNCTIONAL_AXES.filter((a) => wanted.has(a));
    opened_all = false;
    reasoning = "Mapped part " + JSON.stringify(norm(rule.part_of_body)) + (rule.nature_of_injury ? " and nature " + JSON.stringify(norm(rule.nature_of_injury)) : " (any nature)") + " to " + axes.length + " axes by the deterministic table.";
  }

  assertAxesOnly(axes); // the guarantee, on every call
  return {
    axes: Object.freeze(axes),
    opened_all,
    matched: Boolean(rule),
    reasoning,
    clinically_signed_off: AXIS_RELEVANCE_STATUS.clinically_signed_off,
  };
}

// The advisory contract (Section 2.2): AI-04 writes nothing to a report field. This is a
// stated invariant the caller can assert against; AI-04 has no write path at all.
export function writesReportField() { return false; }
