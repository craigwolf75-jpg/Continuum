/* Continuum Prompt 40 increment 3: P3, the submission validation pass and the
   top level orchestration entrypoint (engine spec Section 6, row P3, and the
   ordered checks in Section 6.1). Runs at review and before XML generation,
   server only.

   P3 is where the whole payload is judged. It sequences the field pass (P1, per
   element) and the cross field pass (P2 plus VAL-X01 to X12, supplied by the
   caller because which rules apply is form specific), then adds the submission
   level structural checks that only make sense once the whole form is present:
   dataset occurrence bounds, the contract/role/form triple, follow up ancestry,
   attachments, untouched drafts, and stale carried forward values. Every check
   runs and every failure is collected; P3 never stops at the first (acceptance
   criterion 12).

   Boundary: Section 6.1 check 12 is XSD validation against the two board
   schemas. XML generation and XSD live in a separate prompt (engine spec Section
   11), so P3 does NOT run check 12 here. It is reported as an explicit deferral
   in the result, never silently skipped (no silent caps).

   Pure functions, no database, no clock beyond the injected current date. Failure
   shape matches the rest of the engine: { id, element, message }. No dashes. */

import { runP3 } from "./validation.mjs";
import { runP1 } from "./p1.mjs";

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";
const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const fail = (id, element, message) => ({ id, element, message });

// ---------------------------------------------------------------------------
// Submission level primitives (the checks that need the whole form).
// ---------------------------------------------------------------------------

// Check 4: a dataset respects its min_occurs and max_occurs (invoice lines 1 to
// 25, injury rows, and so on). rows is the list of populated rows for the set.
export function checkOccurrence(datasetName, rows, minOccurs, maxOccurs) {
  const n = Array.isArray(rows) ? rows.length : 0;
  const fails = [];
  if (minOccurs != null && n < minOccurs) fails.push(fail("P3-OCCURS", datasetName, datasetName + " requires at least " + minOccurs + " row(s), found " + n));
  if (maxOccurs != null && n > maxOccurs) fails.push(fail("P3-OCCURS", datasetName, datasetName + " allows at most " + maxOccurs + " row(s), found " + n));
  return fails;
}

// Check 7: the contract, role and form triple is permitted. Never default to
// General Practitioner (engine spec Section 7). permitted is a Set of
// "contract|role|form" keys (injected from wcb_contract_role_form).
export function checkContractRoleForm(contract, role, form, permitted) {
  const key = norm(contract) + "|" + norm(role) + "|" + norm(form);
  if (!(permitted instanceof Set) || !permitted.has(key))
    return [fail("P3-CRF", "contract/role/form", "the contract, role and form combination (" + key + ") is not permitted")];
  return [];
}

// Check 8: a follow up's parent form is a permitted ancestor. parentForm blank
// means this is not a follow up, so nothing to assert.
export function checkParentAncestor(parentForm, allowedAncestors) {
  if (isBlank(parentForm)) return [];
  const allowed = Array.isArray(allowedAncestors) ? allowedAncestors.map(norm) : [];
  return allowed.includes(norm(parentForm)) ? []
    : [fail("P3-ANCESTOR", "parent form", norm(parentForm) + " is not a permitted parent form for this follow up")];
}

// Check 9: attachments are a permitted type and under the size cap. C569 and
// C570 permit none, expressed as rule.permitNone. rule: { permitNone,
// allowedTypes (Set), maxBytes }.
export function checkAttachments(attachments, rule) {
  const list = Array.isArray(attachments) ? attachments : [];
  const r = rule || {};
  const fails = [];
  if (r.permitNone) {
    if (list.length > 0) fails.push(fail("P3-ATTACH", "attachments", "this form permits no attachments"));
    return fails;
  }
  list.forEach((a, i) => {
    const label = "attachment " + (i + 1);
    if (r.allowedTypes instanceof Set && !r.allowedTypes.has(norm(a.type)))
      fails.push(fail("P3-ATTACH", label, norm(a.type) + " is not a permitted attachment type"));
    if (r.maxBytes != null && Number(a.bytes) > Number(r.maxBytes))
      fails.push(fail("P3-ATTACH", label, label + " exceeds the size limit of " + r.maxBytes + " bytes"));
  });
  return fails;
}

// Check 10: zero fields remain draft and untouched. fields: list of { name,
// draft } (draft true means the field was never touched or saved).
export function checkNoDrafts(fields) {
  return (fields || []).filter((f) => f && f.draft)
    .map((f) => fail("P3-DRAFT", f.name || "(field)", (f.name || "a field") + " is still a draft and must be completed or cleared"));
}

// Check 11: zero stale carried forward values unconfirmed. fields: list of
// { name, carriedForward, confirmed }. A carried forward value must be confirmed
// by the practitioner before submission (engine spec Section 5.4 spirit).
export function checkNoStaleCarried(fields) {
  return (fields || []).filter((f) => f && f.carriedForward && !f.confirmed)
    .map((f) => fail("P3-STALE", f.name || "(field)", (f.name || "a field") + " is a carried forward value that must be confirmed before submission"));
}

// ---------------------------------------------------------------------------
// The orchestration entrypoint. Sequences P1 (every element), the caller's
// cross field checks (P2 plus the VAL-X rules relevant to this form), and the
// submission level checks, then collects ALL failures.
//
// input shape:
//   form: {
//     id,
//     elements: [ { id, name, type, required, minLength, maxLength, format,
//                   bounds, codeListName } ],   // codeListName keys board.codeSets
//     datasets: [ { id, name, rows, minOccurs, maxOccurs } ],
//     attachmentRule: { permitNone, allowedTypes (Set), maxBytes },
//     allowedAncestors: [ formId ]
//   }
//   payload: {
//     values: { [elementId]: value },
//     meta: { contract, role, form, parentForm, attachments,
//             draftFields, carriedForwardFields }
//   }
//   board: { codeSets: { [codeListName]: Set }, permittedTriples: Set }
//   crossFieldChecks: [ () => failures[] ]   // P2 and VAL-X thunks the caller wires
//
// Returns { ok, failures, evaluated, deferred }. deferred names check 12 (XSD),
// which the XML generation prompt owns, so nothing is silently skipped.
// ---------------------------------------------------------------------------
export function runSubmission(input) {
  const { form = {}, payload = {}, board = {}, crossFieldChecks = [] } = input || {};
  const values = payload.values || {};
  const meta = payload.meta || {};
  const codeSets = board.codeSets || {};
  const checks = [];

  // P1 per element (checks 1 required, 3 code membership, 5 length and format).
  for (const el of form.elements || []) {
    const withSet = el.codeListName ? { ...el, codeListSet: codeSets[el.codeListName] } : el;
    checks.push(() => runP1(withSet, values[el.id]));
  }

  // Cross field pass: P2 and the VAL-X rules the caller assembled (checks 2
  // conditional presence, 6 forbidden POB NOI, date logic, consistency).
  for (const c of crossFieldChecks) checks.push(c);

  // Check 4: dataset occurrence bounds.
  for (const ds of form.datasets || [])
    checks.push(() => checkOccurrence(ds.name, ds.rows, ds.minOccurs, ds.maxOccurs));

  // Check 7: contract, role and form triple.
  checks.push(() => checkContractRoleForm(meta.contract, meta.role, meta.form || form.id, board.permittedTriples));

  // Check 8: follow up ancestry.
  checks.push(() => checkParentAncestor(meta.parentForm, form.allowedAncestors));

  // Check 9: attachments.
  checks.push(() => checkAttachments(meta.attachments, form.attachmentRule));

  // Check 10 and 11: no untouched drafts, no unconfirmed carried forward values.
  checks.push(() => checkNoDrafts(meta.draftFields));
  checks.push(() => checkNoStaleCarried(meta.carriedForwardFields));

  const failures = runP3(checks);
  return {
    ok: failures.length === 0,
    failures,
    evaluated: ["1-required", "2-conditional", "3-code-membership", "4-occurrence",
      "5-length-format", "6-forbidden-pob-noi", "7-contract-role-form",
      "8-ancestor", "9-attachments", "10-no-drafts", "11-no-stale-carried"],
    deferred: ["12-xsd-validation (owned by the XML generation prompt, engine spec Section 11)"]
  };
}
