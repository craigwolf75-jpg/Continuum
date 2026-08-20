/* Continuum Prompt 40 increment 3: the WCB validation engine (server side).

   Implements the three pass model (engine spec Section 5), the named cross field
   rules VAL-X01 to X12 (Section 5.2), the PHN polarity inversion (Section 5.3),
   and the code list emission (Section 5, emit_code). Pure functions only: each
   takes the practitioner data plus any injected board data (code lists, rule
   flags) and returns an array of failures. Nothing here authors a clinical
   value. P3 collects ALL failures and never stops at the first (Section 5.1,
   acceptance criterion 12). No dashes anywhere.

   Client side validation is a courtesy; this module is the contract and is meant
   to run server side. It has no database or network dependency, so it is unit
   testable in isolation (validation.test.mjs). */

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";
const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const fail = (id, element, message) => ({ id, element, message });

// ---------------------------------------------------------------------------
// PHN polarity inversion (Section 5.3). The board element is "Patient does not
// have an Alberta PHN" (Y means NO PHN), carried as PID.3/CX.5, with the PHN
// value in PID.3/CX.1. The New XPath target Claimant/HavePersonalHealthNumber
// has the INVERSE name, so its value is inverted deliberately. Verified against
// the board samples on 2026-08-09: every sample carries CX.5=Y with CX.1 blank.
// ---------------------------------------------------------------------------

// The two PID.3 fields the board expects.
export function phnFields(doesNotHavePhn, phnValue) {
  return { cx5: doesNotHavePhn ? "Y" : "N", cx1: doesNotHavePhn ? "" : norm(phnValue) };
}

// The inverted value for the New XPath HavePersonalHealthNumber. Emitting the
// non inverted value is the real board rejection the spec warns about.
export function havePhnXpathValue(doesNotHavePhn) {
  return doesNotHavePhn ? "N" : "Y"; // deliberate inversion
}

// VAL-X01: Alberta PHN blank when the no PHN indicator is Yes, present when No.
export function valX01(doesNotHavePhn, phnValue) {
  const fails = [];
  if (doesNotHavePhn && !isBlank(phnValue)) fails.push(fail("VAL-X01", "Alberta PHN", "PHN must be blank when the no PHN indicator is Yes"));
  if (!doesNotHavePhn && isBlank(phnValue)) fails.push(fail("VAL-X01", "Alberta PHN", "PHN is required when the no PHN indicator is No"));
  return fails;
}

// ---------------------------------------------------------------------------
// Injury table cross field rules (VAL-X02 to X08).
// ---------------------------------------------------------------------------

// VAL-X02: Side of body required where the part of body flag says so.
// sideRequiredFlag is the per code Side of Body Required flag (injected).
export function valX02(row, sideRequiredFlag) {
  if (sideRequiredFlag && isBlank(row.side) && !isBlank(row.part))
    return [fail("VAL-X02", "Side of body", "Side of body is required for this part of body")];
  return [];
}

// VAL-X03: part of body and nature of injury not among the forbidden pairs.
// forbidden is a Set of "POB|NOI" keys (injected from wcb_pob_noi_forbidden).
export function valX03(rows, forbidden) {
  const fails = [];
  rows.forEach((r, i) => {
    if (isBlank(r.part) || isBlank(r.nature)) return;
    const key = norm(r.part).toUpperCase() + "|" + norm(r.nature).toUpperCase();
    if (forbidden.has(key)) fails.push(fail("VAL-X03", "injury row " + (i + 1), "part of body and nature of injury combination is not allowed"));
  });
  return fails;
}

// VAL-X04: each combination of part, side and nature in the table must be unique.
export function valX04(rows) {
  const seen = new Set(); const fails = [];
  rows.forEach((r, i) => {
    const key = [r.part, r.side, r.nature].map((x) => norm(x).toUpperCase()).join("|");
    if (key === "||") return; // an entirely empty row is not a duplicate
    if (seen.has(key)) fails.push(fail("VAL-X04", "injury row " + (i + 1), "duplicate part, side and nature combination"));
    seen.add(key);
  });
  return fails;
}

// VAL-X05: diagnostic code 2 requires code 1; code 3 requires codes 1 and 2.
export function valX05(code1, code2, code3) {
  const fails = [];
  if (!isBlank(code2) && isBlank(code1)) fails.push(fail("VAL-X05", "Diagnostic code 2", "Diagnostic code 2 requires Diagnostic code 1"));
  if (!isBlank(code3) && (isBlank(code1) || isBlank(code2))) fails.push(fail("VAL-X05", "Diagnostic code 3", "Diagnostic code 3 requires Diagnostic codes 1 and 2"));
  return fails;
}

// VAL-X06: within an injury row, if any of part, side or nature is populated the
// others must be (BR5, that is the side required flag, dictates whether side is
// required). sideRequiredFlag injected per the row's part of body.
export function valX06(row, sideRequiredFlag) {
  const anyPop = !isBlank(row.part) || !isBlank(row.side) || !isBlank(row.nature);
  if (!anyPop) return [];
  const fails = [];
  if (isBlank(row.part)) fails.push(fail("VAL-X06", "Part of body", "Part of body is required when the row is populated"));
  if (isBlank(row.nature)) fails.push(fail("VAL-X06", "Nature of injury", "Nature of injury is required when the row is populated"));
  if (sideRequiredFlag && isBlank(row.side)) fails.push(fail("VAL-X06", "Side of body", "Side of body is required for this part of body"));
  return fails;
}

// VAL-X07: dominant hand is enabled only for these parts of body (SR3).
export const DOMINANT_HAND_PARTS = ["Arm", "Elbow", "Finger", "Hand", "Shoulder", "Wrist", "Thumb", "Neck"];
export function dominantHandEnabled(partOfBody) {
  return DOMINANT_HAND_PARTS.some((p) => p.toLowerCase() === norm(partOfBody).toLowerCase());
}

// VAL-X08: the additional injuries free text is enabled only when five injury
// rows are used (SR4).
export function additionalInjuriesEnabled(usedRowCount) {
  return Number(usedRowCount) >= 5;
}

// ---------------------------------------------------------------------------
// Treatment and return to work cross field rules (VAL-X09, X12).
// ---------------------------------------------------------------------------

// VAL-X09: prescriptions required when opioids prescribed is Yes.
export function valX09(opioidsPrescribed, prescriptions) {
  if (opioidsPrescribed === true && (!Array.isArray(prescriptions) || prescriptions.length === 0))
    return [fail("VAL-X09", "Prescriptions", "at least one prescription is required when opioids were prescribed")];
  return [];
}

// VAL-X12: hours on any axis cannot exceed hours capable of working per day.
// axisHours is a list of { axis, hours }.
export function valX12(axisHours, workHoursPerDay) {
  const fails = [];
  if (workHoursPerDay === null || workHoursPerDay === undefined) return fails;
  for (const a of axisHours || []) {
    if (a.hours !== null && a.hours !== undefined && Number(a.hours) > Number(workHoursPerDay))
      fails.push(fail("VAL-X12", a.axis, "hours (" + a.hours + ") exceed hours capable of working per day (" + workHoursPerDay + ")"));
  }
  return fails;
}

// ---------------------------------------------------------------------------
// Code list emission (Section 5, emit_code). Weight axis emits the band; else
// the restriction code from (capability, code_list). Basic emits LIMITED,
// Extended emits LIMITEDTO for the same intent.
// ---------------------------------------------------------------------------
export function emitCode(capability, codeListName, weightBand) {
  if (weightBand) return weightBand; // LIMITED | LIGHT | MEDIUM | HEAVY
  if (capability === "able") return "ABLE";
  if (capability === "unable") return "UNABLE";
  if (capability === "limited" || capability === "limited_to")
    return codeListName === "Extended Work Restriction Codes" ? "LIMITEDTO" : "LIMITED";
  return null; // restricted_from, skipped, or not answered are handled by the caller
}

// ---------------------------------------------------------------------------
// P3 submission runner (Section 5.1). Runs every check and collects ALL
// failures. A check is a thunk returning an array of failures. Never stops at
// the first (acceptance criterion 12).
// ---------------------------------------------------------------------------
export function runP3(checks) {
  const all = [];
  for (const check of checks) {
    try {
      const r = typeof check === "function" ? check() : check;
      if (Array.isArray(r)) all.push(...r);
    } catch (e) {
      all.push(fail("P3-ERROR", "(runner)", String(e && e.message ? e.message : e)));
    }
  }
  return all;
}
