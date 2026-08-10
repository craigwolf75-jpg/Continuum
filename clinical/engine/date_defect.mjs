/* Continuum Prompt 40 (Prompt 39A Section 4, board enquiry B2): the validation
   schema date defect passthrough.

   The validation schema (6.01) has a February and leap year defect. Its
   stRequiredDateString uses `(02[0-2][0-8])` for February, whose second digit
   `[0-8]` excludes 9, so the schema rejects 9 February and 19 February in every
   year, and its leap year list is wrong (it rejects a real 29 February 2000 and
   accepts a nonexistent 29 February 1900). 39A: validate dates against a real
   calendar in application code (Continuum's verdict is authoritative), run the
   validation schema as well, and when the ONLY schema failure is this defect,
   log it as a known board schema defect and do NOT block the batch.

   Continuum's real calendar check (isRealCalendarDate from p1.mjs) is the single
   source of truth for whether a date exists. This module reconciles it with the
   schema's verdict:
     not a real date            -> BLOCK, regardless of the schema (criterion 16:
                                   29 February 1900 and 31 September 2026 fail).
     real date, 9 or 19 Feb     -> the schema provably rejects these (its regex),
                                   so pass through and log the known defect.
     real date, schema rejected -> the known leap defect (e.g. 29 February 2000);
                                   pass through and log the known defect
                                   (criterion 15).
     real date, other schema
       rejection                -> an unexpected discrepancy outside the four
                                   documented patterns; do not silently pass,
                                   raise it to a human.
     real date, schema accepts
       or not run               -> accept.

   Whether the LIVE board application shares the schema defect is unverified,
   board enquiry B2. Pure functions, failure shape { id, element, message }. No
   dashes anywhere. */

import { isRealCalendarDate } from "./p1.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const isIso = (v) => /^\d{4}-\d{2}-\d{2}$/.test(norm(v));
const fail = (id, element, message) => ({ id, element, message });

// The two February days the schema's `(02[0-2][0-8])` provably rejects every
// year: the 9th and the 19th (second digit 9 is outside [0-8]). Known from the
// regex 39A quotes, so the engine flags them without running the schema.
function isFeb9or19(m, d) { return m === 2 && (d === 9 || d === 19); }

// Reconcile Continuum's real calendar verdict with the validation schema's
// verdict for one date. schemaAccepted is whether the actual 6.01 schema accepted
// the date (supplied by the caller that runs the XSD); omit it for a Continuum
// only check. Returns { blocked, knownDefect, failures, note }. note is a log
// record for a known defect, never a validation failure.
export function reconcileDate(elementName, value, schemaAccepted) {
  const name = elementName || "(date)";
  if (!isIso(value)) return { blocked: false, knownDefect: false, failures: [], note: null }; // P1 owns shape

  if (!isRealCalendarDate(norm(value)))
    return {
      blocked: true, knownDefect: false, note: null,
      failures: [fail("DATE-INVALID", name, norm(value) + " is not a real calendar date; rejected regardless of what either schema says")]
    };

  const [y, m, d] = norm(value).split("-").map(Number);
  const feb29 = m === 2 && d === 29;
  const b2note = fail("DATE-SCHEMA-DEFECT-B2", name, norm(value) + " is a real date that the validation schema rejects (known February and leap year defect, board enquiry B2); passed by the real calendar, do not block the batch");

  if (isFeb9or19(m, d) || (feb29 && schemaAccepted === false))
    return { blocked: false, knownDefect: true, failures: [], note: b2note };

  if (schemaAccepted === false)
    return {
      blocked: true, knownDefect: false, note: null,
      failures: [fail("DATE-SCHEMA-DISCREPANCY", name, "the validation schema rejects " + norm(value) + " but it is a real date outside the known February defect; raise to a human before proceeding")]
    };

  return { blocked: false, knownDefect: false, failures: [], note: null };
}
