/* Continuum Prompt 40 (Prompt 39A Section 1.4 and 1.5): the PHN format gate.

   The validation schema types PID.3/CX.1 (the Worker 36) as stSINPHN with
   pattern \d{0,9}, so it PERMITS a short PHN. The exact nine digit requirement
   comes from the workbook, not the schema, so it must be enforced in application
   code (39A Section 1.4). Do not rely on schema validation to catch a truncated
   PHN. PID.2/CX.1 (the claim reference number) has the same trap: schema \d{0,7},
   a workbook max of 7.

   The check digit is a SEPARATE, default OFF stage (39A Section 1.5, board
   enquiry B1). The workbook Glossary references a SIN/PHN check digit but the
   algorithm is published in no file in the package. A false rejection blocks a
   real report while the statutory clock runs, so a check digit algorithm from a
   non board source must never be treated as authoritative. The validator here is
   a pluggable hook that is off unless a board confirmed algorithm is configured;
   with it off, the board rejects a bad check digit and the error is catalogued.

   This gate validates FORMAT only. Presence and the PHN polarity inversion
   (blank when the no PHN indicator is Yes) are owned by valX01 in validation.mjs.
   Pure functions, failure shape { id, element, message }. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const isBlank = (v) => norm(v) === "";
const fail = (id, element, message) => ({ id, element, message });

// Stage 1: exactly nine digits when a PHN is present. Blank is not a format
// failure here (valX01 owns presence). The schema would accept a short value, so
// this local check is where the length is actually enforced (acceptance
// criterion 8: an eight digit PHN is rejected by application code).
export function phnLength(value) {
  if (isBlank(value)) return [];
  return /^\d{9}$/.test(norm(value))
    ? []
    : [fail("PHN-LENGTH", "Worker 36", "Worker 36 must be exactly 9 digits (the validation schema permits a shorter value; the length is enforced here)")];
}

// Stage 2: the check digit, default OFF. config: { enabled, validator }. When
// enabled is false or absent, the stage is skipped entirely (board enquiry B1
// unresolved). When enabled, a board confirmed validator function must be
// supplied; the gate refuses to guess an algorithm rather than risk a false
// rejection of a real report.
export function phnCheckDigit(value, config) {
  const c = config || {};
  if (!c.enabled) return [];               // default off
  if (isBlank(value)) return [];
  const v = norm(value);
  if (typeof c.validator !== "function")
    return [fail("PHN-CHECKDIGIT-CONFIG", "Worker 36", "check digit validation is enabled but no board confirmed validator is configured; refusing to guess an algorithm (board enquiry B1)")];
  return c.validator(v) ? [] : [fail("PHN-CHECKDIGIT", "Worker 36", "Worker 36 fails the configured check digit validation")];
}

// The full PHN gate: the hard length check always, then the check digit stage
// (default off). If the length is wrong the check digit is not run, so the
// message names the real problem.
export function phnGate(value, config) {
  const lengthFails = phnLength(value);
  if (lengthFails.length) return lengthFails;
  return phnCheckDigit(value, config);
}

// The claim reference number (PID.2/CX.1): digits only, at most 7 (39A Section
// 1.4). Same schema trap; enforced here. Blank is not a failure (presence is a
// separate rule). Exactly how many digits a live claim carries is a workbook
// fact; the schema and 39A give a maximum of 7, so this rejects non digits and
// anything longer than 7.
export function claimReferenceFormat(value) {
  if (isBlank(value)) return [];
  return /^\d{1,7}$/.test(norm(value))
    ? []
    : [fail("CLAIMREF-FORMAT", "Claim reference number", "Claim reference number must be 1 to 7 digits (the validation schema permits other values; the format is enforced here)")];
}
