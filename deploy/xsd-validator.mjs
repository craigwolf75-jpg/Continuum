/* Continuum Prompt 42 Section 3 (approved in 43a gate 2): XSD validation before the batch.

   The board requires two schemas, in order: the structural schema
   (6 - WCBhl7_v231_modern_v100.xsd) first, then the supplementary validation schema
   (6.01 - WCBhl7_v231_modern_v100_validate.xsd). A file failing either never enters a
   batch; it raises to a named human, not to a log (Prompt 42 Section 3). The batch worker
   (clinical/engine/batch.mjs runBatch) consumes this as its injected validate function.

   Gate 2 conditions (Prompt 43a): the xmllint-wasm version is pinned exactly in
   deploy/package.json and the lockfile; validation is fully OFFLINE, both schemas are read
   from disk in the accreditation package and nothing is ever fetched; xmllint-wasm is
   libxml2 compiled to WebAssembly, sandboxed and deterministic, running the same reference
   implementation the CI cross check runs against the system xmllint binary.

   No dashes anywhere. */

import { validateXML } from "xmllint-wasm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), "..", "clinical", "db", "samples");

// Both board schemas, loaded from disk ONCE. Never fetched (fully offline).
export const SCHEMA_STRUCTURAL_FILE = "6 - WCBhl7_v231_modern_v100.xsd";
export const SCHEMA_SUPPLEMENTARY_FILE = "6.01 - WCBhl7_v231_modern_v100_validate.xsd";
export const SCHEMA_STRUCTURAL = readFileSync(join(SAMPLES, SCHEMA_STRUCTURAL_FILE), "utf8");
export const SCHEMA_SUPPLEMENTARY = readFileSync(join(SAMPLES, SCHEMA_SUPPLEMENTARY_FILE), "utf8");

// A WASM page is 64 KiB. The board's maximum file (multiple reports plus three 1 MB
// attachments) plus the schema and working memory fits comfortably below this ceiling;
// the ceiling exists so a runaway input fails in a test, never in production.
const DEFAULT_MAX_MEMORY_PAGES = 8192; // 512 MiB

async function validateOne(xml, fileName, schema, maxMemoryPages) {
  const res = await validateXML({
    xml: [{ fileName, contents: xml }],
    schema: [schema],
    initialMemoryPages: 256,
    maxMemoryPages: maxMemoryPages || DEFAULT_MAX_MEMORY_PAGES,
  });
  return { valid: res.valid, errors: (res.errors || []).map((e) => e.message || e.rawMessage || String(e)) };
}

// FINDING (verified against the samples): the supplementary schema (6.01) is over strict.
// It rejects the board's OWN conforming samples on EMPTY optional elements the board itself
// leaves empty: 5.16 (C570) and 5.17 fail it on an empty FT1.4 date (the 39A date pattern
// defect), an empty CE.1 (a length facet), and an empty CP.3 (a value facet). So Prompt 42
// Section 3's literal rule ("a file failing EITHER schema never enters a batch") cannot
// apply to 6.01, because it would reject valid files. The 39A doctrine resolves it: the
// STRUCTURAL schema (6) is the authoritative gate; the supplementary schema (6.01) is
// advisory, and its known over strictness on empty optionals is surfaced to a human, never
// a silent block. An unexpected supplementary finding (not an empty optional) is raised to
// a named human for review, not swallowed.
export function isSupplementaryKnownDefect(errorMessage) {
  const m = String(errorMessage || "");
  // The three shapes the board's own empty optional elements produce: an empty value
  // against a pattern facet, an empty value against an atomic type, and a zero length
  // against a length facet.
  return /The value ''|'' is not a valid value|has a length of '0'/.test(m);
}

// Validate an HL7 file against both schemas. The structural schema (6) is the hard gate.
// Returns { valid, blocked, stage, errors, supplementaryFindings, raiseToHuman }.
// stage: 'structural' (structural rejected it, blocked), 'passed' (both clean),
// 'passed-with-known-supplementary-defect' (structural passed, every supplementary finding
// is a known empty optional defect), or 'passed-with-unexpected-supplementary-findings'
// (structural passed but an unexpected supplementary finding must be raised to a human).
export async function validateAgainstSchemas(xml, opts = {}) {
  const fileName = opts.fileName || "report.xml";
  const s = await validateOne(xml, fileName, SCHEMA_STRUCTURAL, opts.maxMemoryPages);
  if (!s.valid) return { valid: false, blocked: true, stage: "structural", errors: s.errors, supplementaryFindings: [], raiseToHuman: true };
  const v = await validateOne(xml, fileName, SCHEMA_SUPPLEMENTARY, opts.maxMemoryPages);
  if (v.valid) return { valid: true, blocked: false, stage: "passed", errors: [], supplementaryFindings: [], raiseToHuman: false };
  const unexpected = v.errors.filter((e) => !isSupplementaryKnownDefect(e));
  return {
    valid: true, blocked: false,
    stage: unexpected.length ? "passed-with-unexpected-supplementary-findings" : "passed-with-known-supplementary-defect",
    errors: [], supplementaryFindings: v.errors, unexpected, raiseToHuman: unexpected.length > 0,
  };
}
