/* Continuum Prompt 40 (Prompt 39A Section 2.6): namespaced board codes. The
   board reuses the token LIMITED across two unrelated workbook sheets: it is a
   Basic Work Restriction Code meaning "Limited", and it is also a Weight Category
   Code meaning "Limited (5 kg / 11 lbs)" alongside LIGHT, MEDIUM and HEAVY. 39A:
   "Do not model board codes as one flat enum. One namespaced type per workbook
   code sheet." A single shared LIMITED constant is how a weight category ends up
   in a capability field and passes every local check.

   This module gives each code a namespace (its workbook sheet name) and brands
   the value so it cannot be confused with a bare string. Assignment is guarded by
   the namespace tag, NOT by a string comparison, which is exactly what acceptance
   criterion 14 requires: a weight LIMITED cannot be assigned to a capability
   element and a restriction LIMITED cannot be assigned to a weight element,
   verified by type.

   The authoritative member list for every namespace lives in
   clinical.wcb_code_value (loaded from the workbook per sheet). The three
   collision relevant namespaces below carry their members inline (verbatim from
   39A Section 2.2 and 2.6) so the engine is self testable; makeCode also accepts
   an injected member Set for any other sheet. Pure functions, failure shape
   { id, element, message }. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const fail = (id, element, message) => ({ id, element, message });

// Namespace names are the workbook sheet names.
export const NS = {
  BASIC: "Basic Work Restriction Codes",
  EXTENDED: "Extended Work Restriction Codes",
  WEIGHT: "Weight Category Codes"
};

// Members of the collision relevant namespaces, verbatim from 39A.
const BUILTIN_MEMBERS = {
  [NS.BASIC]: new Set(["ABLE", "UNABLE", "LIMITED"]),
  [NS.EXTENDED]: new Set(["ABLE", "UNABLE", "LIMITEDTO"]),
  [NS.WEIGHT]: new Set(["LIMITED", "LIGHT", "MEDIUM", "HEAVY"])
};

// The brand marks a value as a real namespaced code, so a bare string can never
// pass a type guard. A plain object without the brand is rejected too.
const BRAND = Symbol.for("continuum.wcb.namespacedCode");
const isBranded = (v) => !!v && typeof v === "object" && v[BRAND] === true;

// Construct a branded, namespaced code. Validates membership against the injected
// Set, or the built in members for the three known namespaces. Returns
// { value, failures }; value is null when invalid.
export function makeCode(namespace, value, members) {
  const ns = norm(namespace);
  const set = members instanceof Set ? members : BUILTIN_MEMBERS[ns];
  if (!set) return { value: null, failures: [fail("CODE-NS", ns || "(namespace)", "unknown code namespace " + JSON.stringify(ns) + "; pass its member Set")] };
  const code = norm(value).toUpperCase();
  if (!set.has(code)) return { value: null, failures: [fail("CODE-MEMBER", ns, JSON.stringify(code) + " is not a member of " + ns)] };
  return { value: { [BRAND]: true, ns, code }, failures: [] };
}

// Human readable description of a value for failure messages. A bare string is
// named as such, so the guard rejecting it is self explanatory.
function describe(v) {
  if (isBranded(v)) return "the " + v.ns + " code " + JSON.stringify(v.code);
  if (typeof v === "string") return "a bare string " + JSON.stringify(v) + " (not a namespaced code)";
  return "a value with no code namespace";
}

// Type guards. These check the NAMESPACE tag, never the string.
export function isRestrictionCode(v) { return isBranded(v) && (v.ns === NS.BASIC || v.ns === NS.EXTENDED); }
export function isWeightCode(v) { return isBranded(v) && v.ns === NS.WEIGHT; }

// Assignment guards (acceptance criterion 14). A capability element takes a
// restriction code (Basic or Extended namespace); a weight element takes a
// Weight Category Codes value. Anything else, including a bare string or the
// wrong namespace, fails.
export function assignCapabilityCode(elementName, v) {
  if (!isRestrictionCode(v))
    return [fail("CODE-CAP-TYPE", elementName || "(capability)", "a capability element accepts only a restriction code, not " + describe(v))];
  return [];
}
export function assignWeightCode(elementName, v) {
  if (!isWeightCode(v))
    return [fail("CODE-WEIGHT-TYPE", elementName || "(weight)", "a weight element accepts only a Weight Category Codes value, not " + describe(v))];
  return [];
}

// The raw token for XML emission, once the value has passed the type guard.
export function codeToken(v) { return isBranded(v) ? v.code : null; }
