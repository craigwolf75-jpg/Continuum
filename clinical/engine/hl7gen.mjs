/* Continuum Prompt 42: HL7 v2.3.1 XML generation, the OBX observation layer.

   The board wire format (verified against the 5.xx samples) is ZRPT_P03 rooted HL7
   v2.3.1 XML. The bulk of every report is OBX segments, each keyed by a coded OBX.3
   identifier (JOBTITLE, EMPNAME, ...) with the value in OBX.5. This module generates
   that OBX layer and encodes the board rules that are easy to get subtly wrong:

   - The exact OBX fragment shape, anchored to a real board fragment in the suite.
   - Base versus conditional observations (Section 2.2, criterion 4): a base observation
     is always present, empty when unanswered (present and empty). A conditionally
     available observation is ABSENT entirely when its condition is not met, never
     present and empty. The Min sample is the base skeleton; the observations present in
     Max but absent from Min are the conditional ones.
   - C569 and C570 accept no attachments: emit no attachment container at all (Section 2.3).
   - The signature hash integrity gate (Section 2.1, 6, 7): a canonical SHA-256 over the
     payload, computed at signature. If a later uploaded file differs, HALT and raise.
     Never retry a hash mismatch: it is an integrity failure, not a transient error.

   The batch envelope (FHS, BHS, MSH, demographic segments, BTS, FTS and the ZRPT_P03
   LST and GRP nesting) and the full eight form document assembly are staged as the next
   increment; this delivers the element to OBX layer, round tripped against the samples.
   Pure functions. No dashes anywhere. */

import { createHash } from "node:crypto";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const NO_ATTACHMENT_FORMS = ["C569", "C570"];

// C569 and C570 emit no attachment container at all (Section 2.3, Section 7).
export function attachmentContainerAllowed(formId) {
  return !NO_ATTACHMENT_FORMS.includes(norm(formId).toUpperCase());
}

// Canonicalise an HL7 XML fragment for comparison: drop comments, drop inter tag
// whitespace, and normalise self closing tags (<x /> becomes <x/>). Text content is
// left intact, so escaped entities are compared as written.
export function canonicalizeXml(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/<([A-Za-z0-9_.]+)\s*\/>/g, "<$1/>")
    .trim();
}

// Serialise one OBX observation to the board fragment. An empty value emits <OBX.5/>
// (present and empty), a non empty value emits <OBX.5>value</OBX.5>. The board populates
// OBX.1 (set id) and OBX.2 (value type) for some observations (for example an address
// component carries OBX.1 = position, OBX.2 = ST); opts.obx1 and opts.obx2 carry those,
// defaulting to empty. The output is canonical (no indentation). value is XML safe.
export function serializeObx(identifier, value, opts = {}) {
  const v = norm(value);
  const cell = v === "" ? "<OBX.5/>" : "<OBX.5>" + v + "</OBX.5>";
  const f = (tag, raw) => { const s = norm(raw); return s === "" ? "<" + tag + "/>" : "<" + tag + ">" + s + "</" + tag + ">"; };
  return "<OBX>" + f("OBX.1", opts.obx1) + f("OBX.2", opts.obx2) +
    "<OBX.3><CE.1>" + norm(identifier) + "</CE.1></OBX.3>" +
    "<OBX.4/><OBX.5.LST>" + cell + "</OBX.5.LST><OBX.11/></OBX>";
}

// Serialise an ordered list of observations [{ identifier, value }] to the OBX section.
export function serializeObxSection(observations) {
  return (observations || []).map((o) => serializeObx(o.identifier, o.value)).join("");
}

// Parse an OBX section (or a whole report body) back into ordered observations. The
// inverse of serializeObxSection for round trip proof (criterion 5, the samples' method:
// parse, regenerate, compare). An <OBX.5/> yields value "".
export function extractObx(xml) {
  const body = String(xml === null || xml === undefined ? "" : xml).replace(/<!--[\s\S]*?-->/g, "");
  const out = [];
  const re = /<OBX>([\s\S]*?)<\/OBX>/g;
  let m;
  while ((m = re.exec(body))) {
    const seg = m[1];
    const idm = seg.match(/<CE\.1>([\s\S]*?)<\/CE\.1>/);
    const vm = seg.match(/<OBX\.5>([\s\S]*?)<\/OBX\.5>/);
    out.push({ identifier: idm ? idm[1].trim() : "", value: vm ? vm[1].trim() : "" });
  }
  return out;
}

// Resolve which observations to emit from the full skeleton. A base observation is
// always emitted, empty when it has no value (present and empty). A conditional
// observation is emitted only when its condition is met; otherwise it is ABSENT
// entirely (Section 2.2, criterion 4). fullSkeletonIds is the ordered identifier list
// (the Max skeleton); conditionalIds are the identifiers present in Max but absent from
// Min; valuesById maps identifier to value; conditionMet(identifier) decides a
// conditional (default: include all conditionals when includeConditional is true).
export function resolveObservations(fullSkeletonIds, conditionalIds, valuesById, opts = {}) {
  const cond = conditionalIds instanceof Set ? conditionalIds : new Set(conditionalIds || []);
  const values = valuesById || {};
  const includeConditional = opts.includeConditional !== undefined ? opts.includeConditional : true;
  const conditionMet = typeof opts.conditionMet === "function" ? opts.conditionMet : () => includeConditional;
  const out = [];
  for (const id of fullSkeletonIds || []) {
    if (cond.has(id) && !conditionMet(id)) continue; // absent, not present and empty
    out.push({ identifier: id, value: Object.prototype.hasOwnProperty.call(values, id) ? norm(values[id]) : "" });
  }
  return out;
}

// Build a report's OBX section from its form skeleton (the wcb_obx_skeleton seed, migrations
// 009 and 010): emit the FULL skeleton in ordinal order, each observation present, carrying its
// value from valuesById or present and empty when the report has no value for it (the board
// convention, never absent, never HL7 null). skeletonIds is the ordered identifier list for the
// form; valuesById maps an identifier to its value. This is what carries a signed report's real
// field values into the board's fixed OBX order, replacing a template's OBX.
export function skeletonObxSection(skeletonIds, valuesById) {
  return serializeObxSection(resolveObservations(skeletonIds, [], valuesById || {}));
}

// The signature hash: a canonical SHA-256 over the payload, computed at signature so the
// signed snapshot and the submitted file are byte identical (Section 2.1).
export function snapshotHash(canonicalPayload) {
  return createHash("sha256").update(canonicalizeXml(canonicalPayload), "utf8").digest("hex");
}

// The integrity gate (Section 6, 7). If the uploaded file's hash differs from the signed
// snapshot hash, HALT and raise. Never retry: a mismatch means the payload changed after
// signature, which is an integrity failure, not a transient error.
export function assertHashMatch(uploadedCanonicalPayload, signedHash) {
  const h = snapshotHash(uploadedCanonicalPayload);
  if (h !== signedHash) {
    const e = new Error("HL7-HASH-MISMATCH: uploaded payload hash " + h +
      " does not equal the signed snapshot hash " + signedHash + ". Halt, do not retry.");
    e.code = "HL7-HASH-MISMATCH";
    throw e;
  }
  return true;
}

// XML escape a raw value for placement in an element (for generation from plain data;
// the round trip path reuses the already escaped sample values verbatim).
export function xmlEscape(v) {
  return String(v === null || v === undefined ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
