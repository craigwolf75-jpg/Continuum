/* Continuum Prompt 42: HL7 wire map loader.

   Reconciliation the Prompt 42 prereq report established: Prompt 40 loaded only the
   workbook "New XPath" column (a canonical /InjuryReport/... path) into
   form_element.hl7_xpath. That is NOT the board wire format. The board wire format is
   HL7 v2.3.1 XML (root ZRPT_P03), with each data element placed in an HL7 segment field
   and, for the bulk of the report, in an OBX segment keyed by a coded OBX.3 identifier.
   That placement lives in workbook columns Seg (15), Seq# (16) and XML Element
   Representation (21), which Prompt 40 did not load. This loader loads it.

   It also reads each form's board sample XML to capture the OBX skeleton (the ordered
   OBX.3 identifiers the board actually emits, present and empty for unanswered
   observations). The workbook maps a subset of the skeleton (one row per practitioner
   element); the sample is the ground truth for the full ordered skeleton. The generator
   in clinical/engine/hl7gen.mjs uses the skeleton for order and the wire map for which
   element populates which identifier.

   Emits (all faithful mirrors, hand applied by Gary):
     hl7_wire_map.data.mjs      the per (form, element) wire placement
     hl7_samples.data.mjs       the ordered OBX sequences extracted from the samples
     013_migration_hl7_wire_map.sql
     014_seed_hl7_wire_map.sql  GENERATED, do not hand edit

   Run: node clinical/db/hl7wiremapgen.mjs "<mapping.xlsx>" "<dir with 5.xx samples>"
   No dashes anywhere. */

import * as XLSX from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = "C:/Users/garyf/AppData/Local/Temp/claude/C--WINDOWS-system32/83e4cefe-a7d6-4fb0-8177-8ce0a48312d0/scratchpad";
const WORKBOOK = process.argv[2] || join(SCRATCH, "mapping.xlsx");
const SAMPLES = process.argv[3] || join(SCRATCH, "wcb42");

// form -> [Max sample file, Min sample file (or null)]
const FORMS = {
  C050E: ["5.02 - C050E - Max Fields without Attachments.xml", "5.03 - C050E - Min Fields.xml"],
  C050S: ["5.05 - C050S - Max Fields without Attachments.xml", "5.06 - C050S - Min Fields.xml"],
  C151: ["5.07 - C151 - Max Fields.xml", "5.08 - C151 - Min Fields.xml"],
  C151S: ["5.09 - C151S - Max Fields.xml", "5.10 - C151S - Min Fields.xml"],
  C568: ["5.11 - C568.xml", null],
  C568A: ["5.13 - C568A - Attached Text.xml", null],
  C569: ["5.15 - C569.xml", null],
  C570: ["5.16 - C570.xml", null],
};

// Collapse embedded newlines, tabs and runs of whitespace to a single space so a cell
// with a line break in it cannot break a generated string literal or SQL value.
const clean = (v) => v === null || v === undefined ? v : String(v).replace(/\s+/g, " ").trim();
// SQL literal (doubles apostrophes). Used only for the .sql files.
const q = (v) => { const c = clean(v); return c === null || c === undefined ? "null" : "'" + c.replace(/'/g, "''") + "'"; };
// JS string literal (JSON quoting). Used for the generated .mjs data modules.
const js = (v) => { const c = clean(v); return c === null || c === undefined ? "null" : JSON.stringify(c); };
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");

// Extract the ordered OBX observations from a report body: [{ identifier, value }].
// An empty observation is <OBX.5/> (present and empty), captured as value "".
function extractObx(xml) {
  const body = stripComments(xml);
  const out = [];
  const re = /<OBX>([\s\S]*?)<\/OBX>/g;
  let m;
  while ((m = re.exec(body))) {
    const seg = m[1];
    const idm = seg.match(/<CE\.1>([\s\S]*?)<\/CE\.1>/);
    const identifier = idm ? idm[1].trim() : "";
    let value = "";
    const vm = seg.match(/<OBX\.5>([\s\S]*?)<\/OBX\.5>/);
    if (vm) value = vm[1].trim(); // <OBX.5/> has no capture, stays ""
    out.push({ identifier, value });
  }
  return out;
}

// Read the workbook wire columns for one form sheet.
function wireRows(wb, form) {
  const ws = wb.Sheets[form];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
  const hidx = rows.findIndex((r) => r.some((c) => String(c).toLowerCase().includes("xpath")));
  const out = [];
  for (const r of rows.slice(hidx + 1)) {
    const name = clean(r[1]);
    if (!name) continue;
    const seg = String(r[15] || "").trim();
    // skip section header and non message rows: only elements placed in an HL7 segment
    // belong in the wire map.
    if (!seg) continue;
    const fieldSeq = String(r[16] || "").trim();
    const rep = String(r[21] || "").trim();
    let obxId = null;
    if (seg === "OBX") {
      const cm = rep.match(/<CE\.1>([\s\S]*?)<\/CE\.1>/);
      obxId = cm ? cm[1].trim() : null;
    }
    out.push({
      form_id: form,
      element_seq: String(r[0] || "").trim(),
      element_name: name,
      segment: seg || null,
      field_seq: fieldSeq || null,
      obx_identifier: obxId,
    });
  }
  return out;
}

const wb = XLSX.read(readFileSync(WORKBOOK), { type: "buffer" });

const wireMap = [];
const sampleObx = {};
const audit = [];
let hardFail = [];

for (const [form, [maxFile, minFile]] of Object.entries(FORMS)) {
  const rows = wireRows(wb, form);
  wireMap.push(...rows);
  const obxMapped = rows.filter((r) => r.segment === "OBX").length;
  const withId = rows.filter((r) => r.segment === "OBX" && r.obx_identifier).length;
  if (obxMapped !== withId) hardFail.push(form + ": " + (obxMapped - withId) + " OBX rows have no CE.1 identifier");

  const maxObx = extractObx(readFileSync(join(SAMPLES, maxFile), "utf8"));
  const minObx = minFile ? extractObx(readFileSync(join(SAMPLES, minFile), "utf8")) : null;
  // The Max sample carries the full skeleton; the Min sample carries the base skeleton.
  // An observation present in Max but absent from Min is a conditionally available
  // observation (Section 2.2, criterion 4): present only when its condition is met,
  // absent otherwise. Min must be a subset of Max (the base is always present).
  let conditional = [];
  if (minObx) {
    const maxIds = maxObx.map((o) => o.identifier);
    const minIds = new Set(minObx.map((o) => o.identifier));
    const notInMax = minObx.filter((o) => !maxIds.includes(o.identifier));
    if (notInMax.length) hardFail.push(form + ": Min has " + notInMax.length + " observations absent from Max; Min must be a subset of Max");
    conditional = maxObx.filter((o) => !minIds.has(o.identifier)).map((o) => o.identifier);
  }
  sampleObx[form] = { max: maxObx, min: minObx, conditional };
  audit.push({ form, elems: rows.length, obxMapped, sampleObx: maxObx.length, minObx: minObx ? minObx.length : "n/a", conditional: conditional.length });
}

if (hardFail.length) { console.error("HARD GATE FAILED, nothing written:\n  " + hardFail.join("\n  ")); process.exit(1); }

// -- emit hl7_wire_map.data.mjs ---------------------------------------------
const wmOut = [];
wmOut.push("/* Continuum Prompt 42: the HL7 wire map (per form, per element placement).");
wmOut.push("   GENERATED by clinical/db/hl7wiremapgen.mjs from the accreditation workbook");
wmOut.push("   columns Seg (15), Seq# (16) and XML Element Representation (21). Do not hand edit.");
wmOut.push("   segment is the HL7 segment (EVN, PID, OBX, ...); field_seq is the field position;");
wmOut.push("   obx_identifier is the OBX.3 CE.1 code for OBX encoded elements, null otherwise.");
wmOut.push("   No dashes anywhere. */");
wmOut.push("");
wmOut.push("export const WIRE_MAP = [");
for (const w of wireMap)
  wmOut.push("  { form_id: " + js(w.form_id) + ", element_seq: " + js(w.element_seq) + ", element_name: " + js(w.element_name) +
    ", segment: " + js(w.segment) + ", field_seq: " + js(w.field_seq) + ", obx_identifier: " + js(w.obx_identifier) + " },");
wmOut.push("];");
wmOut.push("");
writeFileSync(join(HERE, "hl7_wire_map.data.mjs"), wmOut.join("\n"), "utf8");

// -- emit hl7_samples.data.mjs ----------------------------------------------
const soOut = [];
soOut.push("/* Continuum Prompt 42: the OBX skeletons extracted from the board sample XML.");
soOut.push("   GENERATED by clinical/db/hl7wiremapgen.mjs. Per form: the ordered OBX");
soOut.push("   observations (identifier and value) from the Max sample, and from the Min");
soOut.push("   sample where one exists. The identifier order is the board skeleton; an empty");
soOut.push("   value is a present and empty observation. Used by the generator round trip");
soOut.push("   tests to prove generation reproduces the board files. Do not hand edit. No dashes. */");
soOut.push("");
soOut.push("// conditional is the list of OBX identifiers present in Max but absent from Min:");
soOut.push("// the conditionally available observations (Section 2.2, criterion 4).");
soOut.push("export const SAMPLE_OBX = {");
for (const [form, { max, min, conditional }] of Object.entries(sampleObx)) {
  const fmt = (arr) => "[" + arr.map((o) => "{identifier:" + js(o.identifier) + ",value:" + js(o.value) + "}").join(",") + "]";
  soOut.push("  " + form + ": {");
  soOut.push("    max: " + fmt(max) + ",");
  soOut.push("    min: " + (min ? fmt(min) : "null") + ",");
  soOut.push("    conditional: [" + (conditional || []).map((c) => js(c)).join(",") + "],");
  soOut.push("  },");
}
soOut.push("};");
soOut.push("");
writeFileSync(join(HERE, "hl7_samples.data.mjs"), soOut.join("\n"), "utf8");

// -- emit 013 migration + 014 seed ------------------------------------------
const mig = [
  "-- Continuum Prompt 42: the HL7 wire map table. Per (form, element) HL7 placement",
  "-- (segment, field position, and OBX.3 identifier for OBX encoded elements), loaded",
  "-- from the accreditation workbook. This is what Prompt 40 did not load: form_element",
  "-- carries only the canonical New XPath, not the wire format. Apply after 001. No dashes.",
  "",
  "begin;",
  "",
  "create table if not exists clinical.wcb_hl7_wire_map (",
  "  id uuid primary key default gen_random_uuid(),",
  "  form_id varchar(6) not null,",
  "  element_seq varchar(10) not null,",
  "  element_name varchar(200) not null,",
  "  segment varchar(12),",
  "  field_seq varchar(8),",
  "  obx_identifier varchar(60),",
  "  unique (form_id, element_seq, element_name)",
  ");",
  "create index if not exists ix_wire_map_form on clinical.wcb_hl7_wire_map(form_id);",
  "create index if not exists ix_wire_map_obx on clinical.wcb_hl7_wire_map(form_id, obx_identifier);",
  "",
  "commit;",
  "",
];
writeFileSync(join(HERE, "013_migration_hl7_wire_map.sql"), mig.join("\n"), "utf8");

const seed = [];
seed.push("-- Continuum Prompt 42: HL7 wire map seed. GENERATED by hl7wiremapgen.mjs.");
seed.push("-- Apply AFTER 013_migration_hl7_wire_map.sql. One transaction, idempotent. No dashes.");
seed.push("");
seed.push("begin;");
seed.push("");
seed.push("insert into clinical.wcb_hl7_wire_map (form_id, element_seq, element_name, segment, field_seq, obx_identifier) values");
seed.push(wireMap.map((w) => "  (" + [q(w.form_id), q(w.element_seq), q(w.element_name), q(w.segment), q(w.field_seq), q(w.obx_identifier)].join(",") + ")").join(",\n"));
seed.push("on conflict (form_id, element_seq, element_name) do update");
seed.push("  set segment = excluded.segment, field_seq = excluded.field_seq, obx_identifier = excluded.obx_identifier;");
seed.push("");
seed.push("commit;");
seed.push("");
writeFileSync(join(HERE, "014_seed_hl7_wire_map.sql"), seed.join("\n"), "utf8");

// -- audit ------------------------------------------------------------------
console.log("== HL7 wire map generation ==");
console.log("workbook:", WORKBOOK);
console.log("wire map rows:", wireMap.length);
for (const a of audit)
  console.log("  " + a.form.padEnd(6) + " elems " + String(a.elems).padStart(3) + " | OBX-mapped " + String(a.obxMapped).padStart(3) +
    " | full(Max) OBX " + String(a.sampleObx).padStart(3) + " | base(Min) OBX " + String(a.minObx).padStart(3) + " | conditional " + a.conditional);
console.log("Min is a subset of Max per form: yes (hard gated). Conditional = Max minus Min (criterion 4).");
