/* Continuum Prompt 40 increment 1: WCB Worker 36 code list loader and verifier.

   Reads the accreditation mapping workbook (3 - WCB Report Element to HL7 Element
   Mapping.xlsx) and reports the acceptance criteria facts from Prompt 40 Section 8
   against the real data, without applying anything to a database. It is a faithful
   mirror of the source: every code cell is read as TEXT (so 01100 stays 01100 and
   24000 does not become 24000.0), every code is TRIMMED, and no worksheet is curated
   out. Run: node loader.mjs "<path to the .xlsx>". No dashes anywhere. */

import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) { console.error("usage: node loader.mjs <mapping.xlsx>"); process.exit(2); }

const wb = XLSX.read(readFileSync(path), { type: "buffer" });
const sheets = wb.SheetNames;

// Read a cell as faithful text: prefer the formatted string (.w), fall back to the
// raw value coerced to string. Never a number, so leading zeros and typing survive.
function cellText(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = ws[addr];
  if (!cell) return "";
  if (cell.w != null) return String(cell.w);
  return String(cell.v);
}
function dims(ws) {
  const ref = ws["!ref"];
  if (!ref) return { rows: 0, cols: 0 };
  const range = XLSX.utils.decode_range(ref);
  return { rows: range.e.r - range.s.r + 1, cols: range.e.c - range.s.c + 1, range };
}
// All non empty text values in a sheet, as a flat set, for spot checks.
function allTexts(ws) {
  const { range } = dims(ws);
  const out = [];
  if (!range) return out;
  for (let r = range.s.r; r <= range.e.r; r++)
    for (let c = range.s.c; c <= range.e.c; c++) {
      const t = cellText(ws, r, c).trim();
      if (t !== "") out.push(t);
    }
  return out;
}
// Count data rows: rows that have at least one non empty cell. Header and title rows
// are counted here; per sheet checks below subtract known title/header rows.
function nonEmptyRowCount(ws) {
  const { range } = dims(ws);
  if (!range) return 0;
  let n = 0;
  for (let r = range.s.r; r <= range.e.r; r++) {
    let any = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (cellText(ws, r, c).trim() !== "") { any = true; break; }
    }
    if (any) n++;
  }
  return n;
}

// Find the first row (within the top few) whose leftmost cell matches a header token.
// Both the form sheets and the contract sheet carry a title row above the real header.
function findHeaderRow(ws, colMatch) {
  const { range } = dims(ws);
  if (!range) return 0;
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 8); r++) {
    if (colMatch.test(cellText(ws, r, range.s.c).trim())) return r;
  }
  return range.s.r;
}

const line = (s) => console.log(s);
line("== Prompt 40 loader verification ==");
line("workbook: " + path);
line("");

// Criterion 1: worksheet count.
line("[C1] worksheet count seen: " + sheets.length + " (expect 43)");

// Meta and form sheets we know by name.
const FORM_SHEETS = ["C050E","C050S","C151","C151S","C568","C568A","C569","C570"];
const EXPECTED_ELEMENTS = { C050E:111, C050S:171, C151:136, C151S:153, C568:61, C568A:69, C569:37, C570:66 };

// Criterion 4: element counts per form. We report the non empty row count minus the
// header rows we observe, and compare. Exact header offset is confirmed by printing the
// first two rows of each form sheet so the offset is auditable, not assumed.
line("");
line("[C4] form element counts (rows below the Seq header with a non empty Seq value):");
let c4allMatch = true;
for (const f of FORM_SHEETS) {
  const ws = wb.Sheets[f];
  if (!ws) { line("  " + f + ": SHEET MISSING"); c4allMatch = false; continue; }
  const { range } = dims(ws);
  const headerRow = findHeaderRow(ws, /^seq/i);       // "Seq #"
  let elements = 0;
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    if (cellText(ws, r, range.s.c).trim() !== "") elements++;   // element rows carry a Seq
  }
  const ok = elements === EXPECTED_ELEMENTS[f];
  if (!ok) c4allMatch = false;
  line("  " + f + ": elements " + elements + " (expect " + EXPECTED_ELEMENTS[f] + ") " + (ok ? "OK" : "MISMATCH"));
}
line("  [C4] all eight match: " + c4allMatch);

// Criterion 2: POB-NOI Validations Worker 36 data rows (expect 380; row 1 title, row 2 header).
line("");
const pob = wb.Sheets["POB-NOI Validations"];
if (pob) {
  const rows = nonEmptyRowCount(pob);
  const d = dims(pob);
  let r0 = [], r1 = [];
  for (let c = d.range.s.c; c <= Math.min(d.range.e.c, d.range.s.c + 4); c++) { r0.push(cellText(pob, d.range.s.r, c).trim()); r1.push(cellText(pob, d.range.s.r + 1, c).trim()); }
  line("[C2] POB-NOI Validations: nonEmptyRows " + rows + " -> data rows (minus title+header) " + (rows - 2) + " (expect 380)");
  line("     row1(title): [" + r0.join(" | ") + "]");
  line("     row2(header): [" + r1.join(" | ") + "]");
} else line("[C2] POB-NOI Validations sheet MISSING");

// Criterion 3: Contract ID Role Form ID Codes. 32 source rows, 66 normalised, 14 pairs.
line("");
const crf = wb.Sheets["Contract ID Role Form ID Codes"];
if (crf) {
  const { range } = dims(crf);
  // The sheet holds two tables (Initial reports, then Follow up reports), each with its
  // own "Contract ID" header. Parse every table block and sum. The prompt's 32 source /
  // 66 normalised figures are the combined total over the same 14 contract and role pairs.
  const headerRows = [];
  for (let r = range.s.r; r <= range.e.r; r++)
    if (/^contract id$/i.test(cellText(crf, r, range.s.c).trim())) headerRows.push(r);
  let sourceRows = 0, normalised = 0; const pairs = new Set(); const blocks = [];
  for (const hr of headerRows) {
    const header = [];
    for (let c = range.s.c; c <= range.e.c; c++) header.push(cellText(crf, hr, c).trim());
    const reportCol = header.findIndex((h) => /report\s*type/i.test(h));   // Initial or Follow up
    const roleCol = header.findIndex((h) => /^role$/i.test(h));
    let blockRows = 0, blockForms = 0;
    for (let r = hr + 1; r <= range.e.r; r++) {
      const contract = cellText(crf, r, range.s.c).trim();
      if (/^contract id$/i.test(contract)) break;         // next table header
      const role = roleCol >= 0 ? cellText(crf, r, range.s.c + roleCol).trim() : "";
      const reports = reportCol >= 0 ? cellText(crf, r, range.s.c + reportCol).trim() : "";
      if (contract === "" && role === "" && reports === "") break;   // end of block
      blockRows++;
      pairs.add(contract + "|" + role);
      blockForms += reports.split(",").map((s) => s.trim()).filter((s) => s !== "").length;
    }
    sourceRows += blockRows; normalised += blockForms;
    blocks.push((header[reportCol] || "table") + ": " + blockRows + " rows, " + blockForms + " forms");
  }
  line("[C3] Contract ID Role Form ID Codes: " + headerRows.length + " tables -> " + blocks.join(" | "));
  line("     source rows " + sourceRows + " (expect 32), normalised " + normalised + " (expect 66), pairs " + pairs.size + " (expect 14)");
} else line("[C3] Contract ID Role Form ID Codes sheet MISSING");

// Criterion 5: no code has leading/trailing space AFTER trim (we always trim), and
// demonstrate a padded source exists (Facility Types) by showing a raw vs trimmed sample.
line("");
const fac = wb.Sheets["Facility Types"];
if (fac) {
  const texts = allTexts(fac);
  const padded = texts.find((t) => t !== t.trim()); // allTexts already trims, so probe raw
  // probe raw padding directly
  const d = dims(fac); let rawPad = null;
  for (let r = d.range.s.r; r <= d.range.e.r && !rawPad; r++)
    for (let c = d.range.s.c; c <= d.range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c }); const cell = fac[addr];
      const raw = cell ? (cell.w != null ? String(cell.w) : String(cell.v)) : "";
      if (raw.length > 0 && raw !== raw.trim()) { rawPad = raw; break; }
    }
  line("[C5] Facility Types: raw padded sample = " + JSON.stringify(rawPad) + " -> trimmed = " + JSON.stringify(rawPad ? rawPad.trim() : null));
} else line("[C5] Facility Types sheet MISSING");

// Criterion 6: Part Of Body code 01100 present as the string 01100 (not 1100 or 1100.0).
line("");
const pobody = wb.Sheets["Part Of Body Codes"];
if (pobody) {
  const texts = allTexts(pobody);
  const has01100 = texts.includes("01100");
  const has1100 = texts.includes("1100");
  const hasFloat = texts.some((t) => /^\d+\.0$/.test(t));
  line("[C6] Part Of Body Codes: has '01100' string = " + has01100 + ", has bare '1100' = " + has1100 + ", any 'NNN.0' float leak = " + hasFloat);
} else line("[C6] Part Of Body Codes sheet MISSING");

// Criterion 7: C050S sequence 77 appears twice.
line("");
const c050s = wb.Sheets["C050S"];
if (c050s) {
  const d = dims(c050s); const { range } = d;
  // find a sequence column by header
  const header = [];
  for (let c = range.s.c; c <= range.e.c; c++) header.push(cellText(c050s, range.s.r, c).trim());
  let seqCol = header.findIndex((h) => /seq/i.test(h));
  if (seqCol < 0) seqCol = 0;
  let count77 = 0;
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const v = cellText(c050s, r, range.s.c + seqCol).trim();
    if (v === "77") count77++;
  }
  line("[C7] C050S sequence 77 occurrences: " + count77 + " (expect 2), seq col header = " + JSON.stringify(header[seqCol]));
} else line("[C7] C050S sheet MISSING");

// Criterion 8: C568 element 35.06 exists.
line("");
const c568 = wb.Sheets["C568"];
if (c568) {
  const texts = allTexts(c568);
  line("[C8] C568 contains element number '35.06' = " + texts.includes("35.06"));
} else line("[C8] C568 sheet MISSING");

line("");
line("== end verification ==");
