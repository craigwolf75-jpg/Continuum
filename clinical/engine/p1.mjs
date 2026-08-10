/* Continuum Prompt 40 increment 3: P1, the field validation pass (engine spec
   Section 6, row P1). Scope: type, length, format, code list membership, plus
   the always_required presence check and the numeric range business rules that
   are field local (BR3, BR6, BR7, BR10). Runs on blur, client and server; this
   module is the server contract.

   Pure functions only. Each takes a value and the element's own definition
   (injected from clinical.form_element and, for codes, the loaded code list for
   THAT form) and returns an array of failures. Nothing authors a clinical value
   or reads a database. A code is checked against the list for its own form only;
   never fall back to another form's list (engine spec Section 7). No dashes
   anywhere.

   Failure shape matches validation.mjs: { id, element, message }. runP1 collects
   ALL field failures for one element and never stops at the first, so P3 can
   fold them in (acceptance criterion 12). */

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";
const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const fail = (id, element, message) => ({ id, element, message });

// ---------------------------------------------------------------------------
// Presence. always_required elements must be present and non empty. Elements
// exempted under engine spec Section 5.6 are handled by the caller (they arrive
// with required = false), so P1 only enforces what it is told is required.
// ---------------------------------------------------------------------------
export function requiredField(element, value) {
  if (element && element.required && isBlank(value))
    return [fail("P1-REQUIRED", element.name, element.name + " is required")];
  return [];
}

// ---------------------------------------------------------------------------
// Type. The board element types we carry: string, integer, numeric (decimal),
// date (ISO yyyy-mm-dd, the board's calendar form), boolean (Y or N), and code
// (a token that must also pass membership below). A blank value is not a type
// error; requiredField owns emptiness.
// ---------------------------------------------------------------------------
export function typeField(type, value) {
  if (isBlank(value)) return [];
  const v = norm(value);
  const bad = (msg) => [fail("P1-TYPE", "(field)", msg)];
  switch (type) {
    case "integer":
      return /^-?\d+$/.test(v) ? [] : bad("value must be a whole number");
    case "numeric":
      return /^-?\d+(\.\d+)?$/.test(v) ? [] : bad("value must be a number");
    case "date":
      // Calendar validity, not just the shape. Reject 2026-02-30.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return bad("value must be a date (yyyy-mm-dd)");
      return isRealCalendarDate(v) ? [] : bad("value is not a real calendar date");
    case "boolean":
      return v === "Y" || v === "N" ? [] : bad("value must be Y or N");
    case "string":
    case "code":
    case undefined:
    case null:
      return [];
    default:
      return [];
  }
}

// A date is real if round tripping its parts through the calendar is stable, so
// month overflow (2026-02-30 -> March) is caught. new Date(y, m, d) with explicit
// parts is deterministic and needs no clock, so it is safe for a pure check.
function isRealCalendarDate(v) {
  const [y, m, d] = v.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// ---------------------------------------------------------------------------
// Length. minLength and maxLength come from the element definition. Absent
// bounds are not enforced.
// ---------------------------------------------------------------------------
export function lengthField(element, value) {
  if (isBlank(value)) return [];
  const v = norm(value);
  const name = (element && element.name) || "(field)";
  const fails = [];
  if (element && element.maxLength != null && v.length > element.maxLength)
    fails.push(fail("P1-LENGTH", name, name + " must be at most " + element.maxLength + " characters"));
  if (element && element.minLength != null && v.length < element.minLength)
    fails.push(fail("P1-LENGTH", name, name + " must be at least " + element.minLength + " characters"));
  return fails;
}

// ---------------------------------------------------------------------------
// Format. A regular expression carried on the element definition (element.format
// is a RegExp or a string pattern). Absent format is not enforced.
// ---------------------------------------------------------------------------
export function formatField(element, value) {
  if (isBlank(value) || !element || !element.format) return [];
  const v = norm(value);
  const re = element.format instanceof RegExp ? element.format : new RegExp(element.format);
  return re.test(v) ? [] : [fail("P1-FORMAT", element.name, element.name + " has an invalid format")];
}

// ---------------------------------------------------------------------------
// Numeric range. The field local business rules: Calls, Encounters, Fees, and
// Total Amount Billed each carry a lower and upper bound (engine spec Section 6.2
// invoice rules BR3, BR6, BR7, BR10). bounds: { gt, gte, lte, lt }. A bound left
// out is not checked. Applies only when the value is numeric; a type failure is
// reported by typeField.
// ---------------------------------------------------------------------------
export function numericRange(element, value, bounds) {
  if (isBlank(value) || !bounds) return [];
  const n = Number(norm(value));
  if (Number.isNaN(n)) return []; // typeField owns non numeric
  const name = (element && element.name) || "(field)";
  const fails = [];
  if (bounds.gt != null && !(n > bounds.gt)) fails.push(fail("P1-RANGE", name, name + " must be greater than " + bounds.gt));
  if (bounds.gte != null && !(n >= bounds.gte)) fails.push(fail("P1-RANGE", name, name + " must be at least " + bounds.gte));
  if (bounds.lte != null && !(n <= bounds.lte)) fails.push(fail("P1-RANGE", name, name + " must be at most " + bounds.lte));
  if (bounds.lt != null && !(n < bounds.lt)) fails.push(fail("P1-RANGE", name, name + " must be less than " + bounds.lt));
  return fails;
}

// ---------------------------------------------------------------------------
// Code list membership. The value must be a current member of the list loaded
// for THIS form. codeSet is a Set of the allowed codes (injected from
// clinical.wcb_code_value for the element's own list and form). A non member
// fails; never fall back to another form's list (engine spec Section 7).
// ---------------------------------------------------------------------------
export function codeMembership(element, value, codeSet) {
  if (isBlank(value)) return [];
  const name = (element && element.name) || "(field)";
  if (!(codeSet instanceof Set))
    // A coded element with no list loaded is a load time failure, surfaced here
    // so a P1 run never silently accepts an unchecked code.
    return [fail("P1-CODELIST", name, name + " has no code list loaded for this form")];
  return codeSet.has(norm(value)) ? [] : [fail("P1-CODELIST", name, norm(value) + " is not a valid code for " + name)];
}

// ---------------------------------------------------------------------------
// Orchestrator. Runs every applicable field check for one element and collects
// all failures. element carries: { id, name, type, required, minLength,
// maxLength, format, bounds, codeListSet }. codeListSet is present only for
// coded elements. Never stops at the first failure.
// ---------------------------------------------------------------------------
export function runP1(element, value) {
  const all = [];
  const e = element || {};
  all.push(...requiredField(e, value));
  // If a required field is blank, the remaining checks are vacuous (isBlank
  // short circuits each), so they add nothing and cost nothing.
  all.push(...typeField(e.type, value).map((f) => ({ ...f, element: e.name || f.element })));
  all.push(...lengthField(e, value));
  all.push(...formatField(e, value));
  if (e.bounds) all.push(...numericRange(e, value, e.bounds));
  if (e.type === "code" || e.codeListSet) all.push(...codeMembership(e, value, e.codeListSet));
  return all;
}
