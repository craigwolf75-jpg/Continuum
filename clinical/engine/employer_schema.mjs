/* Continuum Prompt 43: the wall between the clinical record and the employer (Section 4,
   Section 7, criteria 1 and 2). The employer schema must never carry a clinical field or
   a raw measurement. A permission is not enough: one bug becomes a privacy breach and a
   career ending story for the practitioner who trusted us, so the prohibition is
   structural, enforced by a build failing test.

   Banned in any employer facing schema, view, API response, export or log (Section 0A.2):
   diagnosis, symptom, medication, prescription, opioid, finding, narrative, pain, any
   board element name from a form's clinical sections, and the raw measurement.

   Pure functions, no database. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim().toLowerCase();

// The banned vocabulary (Section 0A.2). A column or a copy string that contains any of
// these is a clinical leak.
export const BANNED_TERMS = [
  "diagnosis", "symptom", "medication", "prescription", "opioid",
  "finding", "narrative", "pain",
];

// The raw measurement column names from the Prompt 39 measurement model. The employer
// view carries the DERIVED band, never these (Section 4.2, Section 7).
export const RAW_MEASUREMENT_TERMS = [
  "measured_weight_kg", "measured_hours", "measured_weight", "measured_kg", "raw_measurement",
];

const ALL_BANNED = [...BANNED_TERMS, ...RAW_MEASUREMENT_TERMS];

// Extract the column names declared in the employer schema from a migration's SQL text.
// Reads only create table employer.* blocks; skips constraint and index lines.
export function employerColumnNames(sqlText) {
  const text = String(sqlText === null || sqlText === undefined ? "" : sqlText);
  const cols = [];
  const KW = new Set(["primary", "unique", "check", "references", "constraint", "foreign", "create", "index", "begin", "commit"]);
  const re = /create table (?:if not exists )?employer\.\w+\s*\(([\s\S]*?)\n\)\s*;/gi;
  let m;
  while ((m = re.exec(text))) {
    for (const line of m[1].split(/\n/)) {
      const w = line.trim().match(/^([a-z_][a-z0-9_]*)\s+/i);
      if (w && !KW.has(w[1].toLowerCase())) cols.push(w[1].toLowerCase());
    }
  }
  return [...new Set(cols)];
}

// Criterion 1: fail the build if any banned column name appears in the employer schema.
// Returns the offending columns (empty means the wall holds).
export function bannedColumnsInSchema(sqlText) {
  const cols = employerColumnNames(sqlText);
  const bad = [];
  for (const col of cols)
    for (const term of ALL_BANNED)
      if (col.includes(term)) { bad.push({ column: col, banned_term: term }); break; }
  return bad;
}

// Criterion 2: a published employer payload contains no raw measurement anywhere. Walks
// the payload object recursively and flags any key that names a raw measurement or any
// banned clinical term. Verified structurally, never by inspection.
export function rawMeasurementInPayload(payload) {
  const hits = [];
  const walk = (node, path) => {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, path + "[" + i + "]")); return; }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const key = norm(k);
        for (const term of ALL_BANNED) if (key.includes(term)) hits.push({ path: path + "." + k, banned_term: term });
        walk(v, path + "." + k);
      }
    }
  };
  walk(payload, "$");
  return hits;
}

// Lint a copy string bound for an employer surface against the banned vocabulary (0A.2).
export function employerCopyLint(text) {
  const t = norm(text);
  if (!t) return [];
  return BANNED_TERMS.filter((term) => new RegExp("\\b" + term + "\\b", "i").test(t));
}
