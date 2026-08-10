/* Continuum Prompt 40 (Prompt 39A Section 2): the capability code set resolver.
   Basic versus Extended is not carried in the HL7 message (OBX.5 is a WILDCARD
   string); it is a per (form, element) rule about which restriction tokens are
   legal. That rule lives in clinical.wcb_capability_code_set (seeded from
   capability_code_set.data.mjs). This module reads those rows and, for a given
   capability observation, returns the code list to hand emit_code, or a marker
   for the special cases. It is a lookup over stored configuration, never
   branching logic per form (39A Section 2.3).

   Pure functions, no database. Failure shape matches the rest of the engine:
   { id, element, message }. No dashes anywhere. */

import { emitCode } from "./validation.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const fail = (id, element, message) => ({ id, element, message });

export const BASIC = "Basic Work Restriction Codes";
export const EXTENDED = "Extended Work Restriction Codes";

// Build a lookup index from the code set rows (form_id + "|" + obx_identifier).
export function indexCodeSets(rows) {
  const m = new Map();
  for (const r of rows || []) m.set(r.form_id + "|" + r.obx_identifier, r);
  return m;
}

// Resolve the code set for one capability observation on one form. For a
// conditional element (C151S bending, twisting, kneeling, climbing, pushing) the
// RTWPATIENTSTATUSCHANGED value picks the list: the Basic selecting value ('N')
// gives Basic, anything else gives Extended (39A Section 2.4).
// Returns { codeSet, listName } where codeSet is one of basic | extended |
// able_unable_only | not_on_form, and listName is the code list to pass to
// emit_code (null for able_unable_only and not_on_form).
export function resolveCodeSet(index, formId, obxIdentifier, statusChangedValue) {
  const row = index.get(norm(formId) + "|" + norm(obxIdentifier));
  if (!row) return { codeSet: "not_on_form", listName: null };
  switch (row.code_set) {
    case "basic": return { codeSet: "basic", listName: BASIC };
    case "extended": return { codeSet: "extended", listName: EXTENDED };
    case "able_unable_only": return { codeSet: "able_unable_only", listName: null };
    case "conditional": {
      const isBasic = norm(statusChangedValue).toUpperCase() === norm(row.conditional_basic_value).toUpperCase();
      return { codeSet: isBasic ? "basic" : "extended", listName: isBasic ? BASIC : EXTENDED, conditional: true };
    }
    default: return { codeSet: "not_on_form", listName: null };
  }
}

// Emit the OBX value for a capability observation, enforcing the code set rules.
// capability is one of able | unable | limited | limited_to. weightBand is the
// weight code for the lifting max fields (39A Section 2.6 keeps that namespace
// separate). Returns { value, failures }.
//   not_on_form      -> failure: the element is not on this form; do not emit,
//                       raise to a human if Continuum holds a value (39A note 2).
//   able_unable_only -> only able or unable is legal; a graded value fails and is
//                       raised to a human, never collapsed silently (39A note 3).
//   basic | extended -> emit_code with the resolved list (LIMITED vs LIMITEDTO).
export function emitCapability(index, formId, obxIdentifier, statusChangedValue, capability, weightBand) {
  const r = resolveCodeSet(index, formId, obxIdentifier, statusChangedValue);
  if (r.codeSet === "not_on_form")
    return { value: null, failures: [fail("CAP-NOTONFORM", obxIdentifier, obxIdentifier + " is not a capability element on form " + norm(formId) + "; do not emit. Raise to a human if a value is held.")] };
  if (r.codeSet === "able_unable_only") {
    const c = norm(capability).toLowerCase();
    if (c !== "able" && c !== "unable")
      return { value: null, failures: [fail("CAP-ABLEUNABLEONLY", obxIdentifier, obxIdentifier + " accepts only ABLE or UNABLE; a graded value must be raised to a human, not collapsed silently")] };
    return { value: emitCode(c, null, null), failures: [] };
  }
  return { value: emitCode(norm(capability).toLowerCase(), r.listName, weightBand), failures: [] };
}
