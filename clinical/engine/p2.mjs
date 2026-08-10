/* Continuum Prompt 40 increment 3: P2, the cross field validation pass (engine
   spec Section 6, row P2). Scope: conditional requirements, date logic, and
   consistency. Runs on section exit, server side.

   P2 does not re invent the named cross field rules; those live in
   validation.mjs (VAL-X01 to X12) and are folded in through runP2. What P2 adds
   is the machinery validation.mjs deliberately left out: the conditional
   present versus ABSENT check (engine spec Section 5.4 and P3 check 2, where a
   gated element must be absent, not merely empty, when its condition is unmet),
   and the board date rules BR1 and BR4.

   Pure functions only, no database or clock dependency beyond deterministic
   calendar math. ISO yyyy-mm-dd dates are compared as strings, which is
   chronological for that format and needs no Date object. Failure shape matches
   validation.mjs: { id, element, message }. runP2 collects ALL failures and
   never stops at the first. No dashes anywhere. */

import { runP3 } from "./validation.mjs";

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";
const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const fail = (id, element, message) => ({ id, element, message });
const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(norm(v)); // shape only; P1 owns validity

// ---------------------------------------------------------------------------
// Conditional requirement (engine spec Section 5.4, P3 check 2). A
// conditionally_available_required element must be:
//   present and non empty when its condition is met, and
//   ABSENT (the key not in the payload) when its condition is not met.
// present is whether the key exists in the payload at all; value is its content.
// A cleared but still present key (present with a blank value) is a violation
// when the condition is unmet, because mandatory clearing removes the key.
// ---------------------------------------------------------------------------
export function conditionalRequirement(element, conditionMet, present, value) {
  const name = (element && element.name) || "(field)";
  if (conditionMet) {
    if (!present || isBlank(value))
      return [fail("VAL-P2-COND", name, name + " is required when its condition is met")];
    return [];
  }
  // condition not met: the element must be absent, not present and empty.
  if (present)
    return [fail("VAL-P2-COND", name, name + " must be absent from the payload when its condition is not met")];
  return [];
}

// ---------------------------------------------------------------------------
// Date primitives. Each is a no op on a blank or non ISO value (P1 owns shape
// and calendar validity), so P2 never double reports a malformed date.
// ---------------------------------------------------------------------------
export function dateOnOrBefore(id, elementName, date, bound, boundLabel) {
  if (!isIsoDate(date) || !isIsoDate(bound)) return [];
  return norm(date) <= norm(bound) ? []
    : [fail(id, elementName, elementName + " (" + norm(date) + ") cannot be after " + boundLabel + " (" + norm(bound) + ")")];
}

export function dateOnOrAfter(id, elementName, date, bound, boundLabel) {
  if (!isIsoDate(date) || !isIsoDate(bound)) return [];
  return norm(date) >= norm(bound) ? []
    : [fail(id, elementName, elementName + " (" + norm(date) + ") cannot be before " + boundLabel + " (" + norm(bound) + ")")];
}

// ---------------------------------------------------------------------------
// BR1 (all forms, Accident Details): Date of Injury on or before the current
// date and on or after the date of birth.
// ---------------------------------------------------------------------------
export function br1DateOfInjury(dateOfInjury, currentDate, dateOfBirth) {
  const fails = [];
  fails.push(...dateOnOrBefore("BR1", "Date of Injury", dateOfInjury, currentDate, "the current date"));
  fails.push(...dateOnOrAfter("BR1", "Date of Injury", dateOfInjury, dateOfBirth, "the date of birth"));
  return fails;
}

// ---------------------------------------------------------------------------
// BR4 (invoice forms, Invoice Details): Date of service From on or before the
// current date, on or after the date of accident, and on or before Date of
// service To.
// ---------------------------------------------------------------------------
export function br4DateOfService(from, to, currentDate, dateOfAccident) {
  const fails = [];
  fails.push(...dateOnOrBefore("BR4", "Date of service From", from, currentDate, "the current date"));
  fails.push(...dateOnOrAfter("BR4", "Date of service From", from, dateOfAccident, "the date of accident"));
  fails.push(...dateOnOrBefore("BR4", "Date of service From", from, to, "Date of service To"));
  return fails;
}

// ---------------------------------------------------------------------------
// P2 runner (engine spec Section 6, P2). Same collect all contract as P3: run
// every check, gather every failure, never stop at the first. Delegates to the
// shared runner in validation.mjs so P2 and P3 fold results identically. A check
// is a thunk returning an array of failures (so VAL-X rules drop straight in).
// ---------------------------------------------------------------------------
export function runP2(checks) {
  return runP3(checks);
}
