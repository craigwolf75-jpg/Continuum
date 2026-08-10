/* Continuum Prompt 40 increment 3: P2, the cross field validation pass (engine
   spec Section 6, row P2). Scope: conditional requirements, date logic, and
   consistency. Runs on section exit, server side.

   P2 does not re invent the named cross field rules; those live in
   validation.mjs (VAL-X01 to X12) and are folded in through runP2. What P2 adds
   is the machinery validation.mjs deliberately left out: the conditional
   requirement check, and the board date rules BR1 and BR4.

   Correction (Prompt 39A Section 3, facts read from the board samples, this file
   wins over Prompt 39): the board's own convention for OBX observations is
   PRESENT and EMPTY, not absent. Every board sample emits the form's full OBX
   skeleton in fixed order and leaves unused observations present with an empty
   value; 5.03 C050E Min carries the same 98 OBX as the Max sample with 73 empty.
   So an unmet conditional observation must be CLEARED (present and empty), and
   the violation is a stale value that was not cleared, never the presence of an
   empty element. Only whole containers not applicable to a form are absent
   (5.15 C569, 5.16 C570 carry no attachment container); that is the "absent"
   mode below.

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
// Conditional requirement (engine spec Section 5.4, corrected by Prompt 39A
// Section 3). A conditionally_available_required element must be:
//   present and non empty when its condition is met, and
//   CLEARED (present and empty) when its condition is not met, per the board's
//   present and empty OBX convention. A stale non empty value on an unmet
//   element is the violation, not the presence of an empty element.
// present is whether the key exists in the payload at all; value is its content.
// mode "clear" (default) is the OBX observation convention above. mode "absent"
// is for a whole container not applicable to a form (Prompt 39A Section 3.1
// item 2): it must be absent, and a present container is the violation.
// ---------------------------------------------------------------------------
export function conditionalRequirement(element, conditionMet, present, value, mode = "clear") {
  const name = (element && element.name) || "(field)";
  if (conditionMet) {
    if (isBlank(value))
      return [fail("VAL-P2-COND", name, name + " is required when its condition is met")];
    return [];
  }
  // condition not met
  if (mode === "absent") {
    if (present)
      return [fail("VAL-P2-COND", name, name + " must be absent from the payload when it is not applicable to this form")];
    return [];
  }
  // OBX observation convention: present and empty is correct; a stale value is not.
  if (!isBlank(value))
    return [fail("VAL-P2-COND", name, name + " must be cleared (present and empty) when its condition is not met")];
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
