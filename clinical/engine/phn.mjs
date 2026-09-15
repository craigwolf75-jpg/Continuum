/* Continuum Prompt 40 (Prompt 39A Section 1.4 and 1.5): the worker identifier
   format gate (Prompt 45: the pattern lives on the jurisdiction row).

   The validation schema types PID.3/CX.1 as stSINPHN with pattern \d{0,9}, so it
   PERMITS a short value. The exact pattern comes from
   jurisdiction.worker_identifier_pattern, never from a hard coded province
   string. PID.2/CX.1 (the claim reference number) has the same trap: schema
   \d{0,7}, a workbook max of 7.

   The check digit is a SEPARATE, default OFF stage (39A Section 1.5, board
   enquiry B1). The workbook Glossary references a SIN/PHN check digit but the
   algorithm is published in no file in the package. A false rejection blocks a
   real report while the statutory clock runs, so a check digit algorithm from a
   non board source must never be treated as authoritative. The validator here is
   a pluggable hook that is off unless a board confirmed algorithm is configured;
   with it off, the board rejects a bad check digit and the error is catalogued.

   This gate validates FORMAT only. Presence and the polarity inversion
   (blank when the no identifier indicator is Yes) are owned by valX01 in
   validation.mjs. Pure functions, failure shape { id, element, message }.
   No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const isBlank = (v) => norm(v) === "";
const fail = (id, element, message) => ({ id, element, message });

function identifierLabel(profile) {
  return (profile && profile.worker_identifier_label) || "Worker identifier";
}

function identifierPattern(profile) {
  return profile && profile.worker_identifier_pattern
    ? String(profile.worker_identifier_pattern)
    : "";
}

// Stage 1: the jurisdiction pattern when a value is present. Blank is not a
// format failure here (valX01 owns presence). A missing profile is a named
// failure, never a silent default to one province.
export function phnLength(value, profile) {
  const label = identifierLabel(profile);
  const pattern = identifierPattern(profile);
  if (!pattern) return [fail("PHN-PROFILE", label, "worker identifier pattern is not configured for this jurisdiction")];
  if (isBlank(value)) return [];
  let re;
  try { re = new RegExp(pattern); }
  catch (e) { return [fail("PHN-PROFILE", label, "worker identifier pattern is not a valid regular expression")]; }
  return re.test(norm(value))
    ? []
    : [fail("PHN-LENGTH", label, label + " does not match the jurisdiction pattern")];
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
  const label = identifierLabel(c);
  if (typeof c.validator !== "function")
    return [fail("PHN-CHECKDIGIT-CONFIG", label, "check digit validation is enabled but no board confirmed validator is configured; refusing to guess an algorithm (board enquiry B1)")];
  return c.validator(v) ? [] : [fail("PHN-CHECKDIGIT", label, label + " fails the configured check digit validation")];
}

// The full PHN gate: the hard length check always, then the check digit stage
// (default off). If the length is wrong the check digit is not run, so the
// message names the real problem.
export function phnGate(value, config) {
  const lengthFails = phnLength(value, config);
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
