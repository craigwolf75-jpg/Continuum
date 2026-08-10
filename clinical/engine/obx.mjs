/* Continuum Prompt 40 (Prompt 39A Section 3.1, acceptance criterion 4): the OBX
   skeleton verifier. The board emits a form's full OBX skeleton in a fixed order,
   with an empty <OBX.5 /> for any unmet observation, never absent and never the
   HL7 null "". The skeleton and its order live in clinical.wcb_obx_skeleton (seeded
   from the board sample XML). This module reads those rows and checks that a
   generated OBX set matches the skeleton exactly: the same identifiers in the same
   order, and no HL7 null emitted anywhere.

   Pure functions, no database. Failure shape { id, element, message }. The
   emptiness of an unmet observation is the board convention (see p2.mjs
   conditionalRequirement, corrected by 39A Section 3); this module checks the
   skeleton shape and the null. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const fail = (id, element, message) => ({ id, element, message });

// The HL7 null is the literal two character value "" (meaning set the stored value
// to null on an update). The board's unused observations use an EMPTY element (a
// blank value), which is not this. Emitting the HL7 null would be a third, wrong
// message (39A Section 3.1 item 4).
export const HL7_NULL = '""';

// Build form_id -> ordered array of OBX identifiers from the skeleton rows.
export function indexSkeleton(rows) {
  const byForm = new Map();
  for (const r of rows || []) {
    if (!byForm.has(r.form_id)) byForm.set(r.form_id, []);
    byForm.get(r.form_id).push(r);
  }
  const m = new Map();
  for (const [form, rs] of byForm)
    m.set(form, rs.slice().sort((a, b) => a.ordinal - b.ordinal).map((r) => r.obx_identifier));
  return m;
}

// Verify a generated list of OBX identifiers against the form's skeleton: same
// count, same identifiers, same order. Returns an array of failures (empty on a
// match). Reports the count difference and the first position that diverges.
export function verifySkeleton(index, formId, generatedIdentifiers) {
  const skeleton = index instanceof Map ? index.get(norm(formId)) : undefined;
  if (!skeleton) return [fail("OBX-NOFORM", norm(formId), "no OBX skeleton is configured for form " + norm(formId))];
  const gen = Array.isArray(generatedIdentifiers) ? generatedIdentifiers : [];
  const fails = [];
  if (gen.length !== skeleton.length)
    fails.push(fail("OBX-COUNT", norm(formId), "generated " + gen.length + " observations, the skeleton has " + skeleton.length));
  const n = Math.max(gen.length, skeleton.length);
  for (let i = 0; i < n; i++) {
    if (gen[i] !== skeleton[i]) {
      fails.push(fail("OBX-ORDER", norm(formId), "OBX position " + (i + 1) + ": generated " + JSON.stringify(gen[i] ?? null) + ", skeleton expects " + JSON.stringify(skeleton[i] ?? null)));
      break; // the first divergence is enough to locate the problem
    }
  }
  return fails;
}

// Check that no emitted OBX.5 value is the HL7 null. values is the list of the
// generated observation values (empty string is fine, the HL7 null is not).
export function assertNoHl7Null(formId, values) {
  const fails = [];
  (values || []).forEach((v, i) => {
    if (v === HL7_NULL)
      fails.push(fail("OBX-HL7NULL", norm(formId), "OBX position " + (i + 1) + " emits the HL7 null; use an empty element for an unused observation, never the null"));
  });
  return fails;
}
