/* Continuum Prompt 40: form_element seed generator. Reads the eight form
   worksheets in the accreditation mapping workbook and emits
   clinical/db/003_seed_form_elements.sql, a faithful mirror of every element
   (spec Section 3 and 4). Package derived, never transcribed from memory.

   Faithful parse of the shared column layout (identical across all eight forms):
     0 Seq #  1 Element Name  2 Element UI Mapping  3 Description  4 Data Type
     5 Length (Range)  6 Format  7 Max Occ.  8 Valid Values  9 Optionality
     10 Business Processing Rule  11 Legacy XPath  12 New XPath
   Section names come from the marker rows (blank Seq, a name, no data type, no
   optionality). New XPath only (spec Section 4.4), never the legacy one.

   Loader traps handled (spec Section 3.1):
     2 leading zero and padded codes: every cell read as TEXT, trimmed.
     3 duplicate sequence numbers: NOT keyed on Seq. C050S seq 77 and C151S seq
       80 load as two distinct rows; the one whose name carries the board's
       "Depricated" note is flagged deprecated.
     4 the C568 35.06 typo: element_seq stored verbatim, parent never inferred
       from the Seq prefix, so 35.06 sits under its section like any row.

   HARD GATE (acceptance criterion 4): the parsed element count per form must
   equal the verified count. On any mismatch the generator writes nothing and
   exits non zero, so a bad parse can never emit a seed.

   Run: node clinical/db/formelementgen.mjs "<path to mapping.xlsx>"
   No dashes anywhere. */

import * as XLSX from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2];
if (!path) { console.error('usage: node formelementgen.mjs "<mapping.xlsx>"'); process.exit(2); }
const OUT = new URL("./003_seed_form_elements.sql", import.meta.url);
const JUR = "AB", VERSION = "1.0";
const FORMS = ["C050E", "C050S", "C151", "C151S", "C568", "C568A", "C569", "C570"];
const EXPECTED = { C050E: 111, C050S: 171, C151: 136, C151S: 153, C568: 61, C568A: 69, C569: 37, C570: 66 };

const wb = XLSX.read(readFileSync(path), { type: "buffer" });
function ct(ws, r, c) { const a = XLSX.utils.encode_cell({ r, c }); const cell = ws[a]; if (!cell) return ""; return cell.w != null ? String(cell.w) : String(cell.v); }
function rangeOf(ws) { return XLSX.utils.decode_range(ws["!ref"]); }
const q = (v) => v === null || v === undefined ? "null" : "'" + String(v).replace(/'/g, "''") + "'";
const n = (v) => v === null || v === undefined ? "null" : String(v);

// Canonical key so a "[See X]" reference resolves to the exact worksheet name
// despite case, plural, "Codes" and "(Column ...)" noise.
const canon = (s) => String(s).toLowerCase().replace(/\(column[^)]*\)/g, "").replace(/[^a-z0-9]/g, "").replace(/codes?$/, "").replace(/s$/, "");
const worksheetByCanon = new Map();
for (const name of wb.SheetNames) worksheetByCanon.set(canon(name), name);

function mapOptionality(s) {
  const t = s.trim().toLowerCase();
  if (t.startsWith("dataset")) return "dataset";
  if (t.includes("conditionally available") && t.includes("required")) return "conditionally_available_required";
  if (t.includes("conditionally available") && t.includes("optional")) return "conditionally_available_optional";
  if (t.includes("always required")) return "always_required";
  if (t.includes("optional")) return "always_optional";
  return null; // caller flags
}
function parseLength(s) {
  const t = s.trim(); if (t === "") return [null, null];
  let m = t.match(/^(\d+)\s*to\s*(\d+)$/i); if (m) return [Number(m[1]), Number(m[2])];
  m = t.match(/^(\d+)\s*or\s*(\d+)$/i); if (m) { const a = Number(m[1]), b = Number(m[2]); return [Math.min(a, b), Math.max(a, b)]; }
  m = t.match(/^(\d+)$/); if (m) return [Number(m[1]), Number(m[1])];
  return [null, null];
}
function parseOcc(s) {
  const t = s.trim();
  if (t === "") return [0, 1, false]; // blank means a single occurrence, not an error
  let m = t.match(/(\d+)\s*(?:to|-)\s*(\d+)/i); if (m) return [Number(m[1]), Number(m[2]), false];
  m = t.match(/(\d+)/); if (m) return [0, Number(m[1]), false];
  return [0, 1, true]; // non blank but no number (a stray "s"), default single and flag
}
function resolveCodeList(vv) {
  const m = vv.trim().match(/^\[see\s+(.+)\]$/i);
  if (!m) return { name: null, resolved: true };
  const inner = m[1].replace(/\(column[^)]*\)/ig, "").trim();
  const hit = worksheetByCanon.get(canon(inner));
  return hit ? { name: hit, resolved: true } : { name: inner.slice(0, 80), resolved: false };
}
const uiMap = (s) => { const t = s.trim(); return (t === "" || /^n\/?a$/i.test(t)) ? null : t.slice(0, 10); };

// -- parse one form into element rows --------------------------------------
function parseForm(form, warns, unresolved) {
  const ws = wb.Sheets[form]; const rg = rangeOf(ws);
  let headerRow = rg.s.r;
  for (let r = rg.s.r; r <= rg.s.r + 8; r++) if (/^seq/i.test(ct(ws, r, rg.s.c).trim())) { headerRow = r; break; }
  const rows = []; let section = "General";
  for (let r = headerRow + 1; r <= rg.e.r; r++) {
    const seq = ct(ws, r, 0).trim();
    const name = ct(ws, r, 1).trim();
    const dtype = ct(ws, r, 4).trim();
    const optRaw = ct(ws, r, 9).trim();
    if (seq === "") {
      if (name !== "" && dtype === "" && optRaw === "") section = name.replace(/\s+/g, " ").trim().slice(0, 60);
      continue; // section markers and blank rows are not elements
    }
    const [lmin, lmax] = parseLength(ct(ws, r, 5));
    const [omin, omax, occBad] = parseOcc(ct(ws, r, 7));
    if (occBad) warns.push(form + " seq " + seq + ': unparseable Max Occ ' + JSON.stringify(ct(ws, r, 7).trim()) + ", defaulted to 1");
    const optionality = mapOptionality(optRaw);
    if (!optionality) warns.push(form + " seq " + seq + ": unmapped optionality " + JSON.stringify(optRaw));
    const cl = resolveCodeList(ct(ws, r, 8));
    if (!cl.resolved) unresolved.push(form + " seq " + seq + ": code list ref " + JSON.stringify(ct(ws, r, 8).trim()) + " did not match a worksheet");
    const deprecated = /depr[ei]cated/i.test(name);
    let xpath = ct(ws, r, 12).trim(); // New XPath only; not null in schema
    if (name.length > 200) warns.push(form + " seq " + seq + ": element name over 200 chars, truncated");
    rows.push({
      element_seq: seq.slice(0, 10),
      element_name: name.replace(/\s+/g, " ").trim().slice(0, 200),
      ui_mapping: uiMap(ct(ws, r, 2)),
      section_name: section,
      data_type: dtype.slice(0, 20),
      length_min: lmin, length_max: lmax,
      format: (ct(ws, r, 6).trim() || null) && ct(ws, r, 6).trim().slice(0, 40),
      min_occurs: omin, max_occurs: omax,
      code_list_name: cl.name,
      optionality: optionality || "always_optional",
      deprecated,
      hl7_xpath: xpath
    });
  }
  return rows;
}

// -- parse all, GATE on counts ---------------------------------------------
const warns = [], unresolved = [];
const parsed = {};
let gateOk = true;
for (const form of FORMS) {
  const rows = parseForm(form, warns, unresolved);
  parsed[form] = rows;
  const ok = rows.length === EXPECTED[form];
  if (!ok) gateOk = false;
  console.log("[gate] " + form + ": parsed " + rows.length + " (expect " + EXPECTED[form] + ") " + (ok ? "OK" : "MISMATCH"));
}
if (!gateOk) {
  console.error("\nHARD GATE FAILED: an element count does not match the verified count. Nothing written.");
  process.exit(1);
}

// -- emit SQL ---------------------------------------------------------------
const out = [];
out.push("-- Continuum Prompt 40: form_element seed. GENERATED by clinical/db/formelementgen.mjs.");
out.push("-- Faithful mirror of the eight form worksheets. Apply AFTER 002_seed_reference_and_lookups.sql");
out.push("-- (needs form_definition). One transaction, idempotent (on conflict do nothing).");
out.push("-- Element counts gated to the verified totals (acceptance criterion 4). No dashes anywhere.");
out.push("");
out.push("begin;");
out.push("");
const COLS = "element_seq,element_name,ui_mapping,section_name,data_type,length_min,length_max,format,min_occurs,max_occurs,code_list_name,optionality,deprecated,hl7_xpath";
for (const form of FORMS) {
  out.push("-- " + form + " (" + parsed[form].length + " elements)");
  out.push("insert into clinical.form_element(form_definition_id," + COLS + ")");
  out.push("select fd.id, e.element_seq, e.element_name, e.ui_mapping, e.section_name, e.data_type,");
  out.push("       e.length_min::int, e.length_max::int, e.format, e.min_occurs::int, e.max_occurs::int,");
  out.push("       e.code_list_name, e.optionality::clinical.optionality, e.deprecated::boolean, e.hl7_xpath");
  out.push("from clinical.form_definition fd");
  out.push("join (values");
  out.push(parsed[form].map((e) => "  (" + [
    q(e.element_seq), q(e.element_name), q(e.ui_mapping), q(e.section_name), q(e.data_type),
    n(e.length_min), n(e.length_max), q(e.format), n(e.min_occurs), n(e.max_occurs),
    q(e.code_list_name), q(e.optionality), (e.deprecated ? "true" : "false"), q(e.hl7_xpath || "")
  ].join(",") + ")").join(",\n"));
  out.push(") as e(" + COLS + ") on true");
  out.push("where fd.jurisdiction_code=" + q(JUR) + " and fd.form_id=" + q(form) + " and fd.version=" + q(VERSION));
  out.push("on conflict (form_definition_id,element_seq,element_name) do nothing;");
  out.push("");
}
out.push("commit;");
out.push("");
writeFileSync(OUT, out.join("\n"), "utf8");

// -- report ------------------------------------------------------------------
console.log("\n== form_element seed generation ==");
console.log("output: " + OUT.pathname.replace(/^\//, ""));
const total = FORMS.reduce((s, f) => s + parsed[f].length, 0);
console.log("total elements emitted: " + total);
const dep = FORMS.reduce((s, f) => s + parsed[f].filter((e) => e.deprecated).length, 0);
console.log("deprecated flagged: " + dep + " (expect 2: C050S seq 77, C151S seq 80)");
const withList = FORMS.reduce((s, f) => s + parsed[f].filter((e) => e.code_list_name).length, 0);
console.log("elements linked to a code list: " + withList);
if (warns.length) { console.log("\nwarnings (" + warns.length + "):"); warns.forEach((w) => console.log("  " + w)); }
if (unresolved.length) { console.log("\nunresolved code list refs (" + unresolved.length + ", stored verbatim, flag for review):"); unresolved.forEach((u) => console.log("  " + u)); }
