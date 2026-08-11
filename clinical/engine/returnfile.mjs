/* Continuum Prompt 42: the board return file parser and catalogue growth (Section 4.3).

   There is no API. After a batch upload the board emails a tab delimited text file. It
   carries only a code and a description, for example:
     1  121023: Worker Personal Health Number must be BLANK since Worker Personal Health
     Number Indicator is No
   There is no error code catalogue anywhere in the accreditation package.

   This module parses the return file into rejection rows (nothing is ever swallowed: a
   line with no code is kept as unparsed, not dropped and not treated as a rejection),
   then reconciles each rejection against clinical.wcb_error_catalogue via
   clinical/engine/errors.mjs. The catalogue starts empty and GROWS from real rejections
   by matching the description text against the known element names. A match at or above
   the 0.80 confidence floor produces a PROPOSED mapping for a human to confirm; below the
   floor the code is unmapped and the board's raw text is shown to a named human. Nothing
   is ever auto mapped or guessed: a growth record is a proposal, and only a human curated
   catalogue entry is ever trusted at resolve time (errors.mjs).

   FORMAT NOTE: the exact return file layout is inferred from the single documented
   example (the package ships no return file). The parser handles the documented shape
   and common variants; confirm it against a real board return file before production use.

   Pure functions, no database. No dashes anywhere. */

import { resolveError, CONFIDENCE_FLOOR } from "./errors.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();
const tokens = (s) => norm(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

// -- parse -------------------------------------------------------------------

// Parse one return file line. Returns { seq, code, description, raw }. code is null when
// the line carries no board code (the caller keeps it as unparsed, never a rejection).
export function parseReturnLine(line) {
  const raw = String(line === null || line === undefined ? "" : line);
  const fields = raw.split("\t").map((f) => f.trim()).filter((f) => f !== "");
  let seq = null, code = null, description = null;

  // documented shape: a field of the form "CODE: description" where CODE is digits
  for (let i = 0; i < fields.length; i++) {
    const m = fields[i].match(/^(\d{3,})\s*:\s*([\s\S]+)$/);
    if (m) {
      code = m[1]; description = norm(m[2]);
      if (i > 0 && /^\d{1,3}$/.test(fields[i - 1])) seq = fields[i - 1];
      break;
    }
  }
  // variant: a digits only field is the code, the rest of the line is the description
  if (code === null) {
    for (let i = 0; i < fields.length; i++) {
      if (/^\d{3,}$/.test(fields[i])) {
        code = fields[i]; description = norm(fields.slice(i + 1).join(" ")) || null;
        if (i > 0 && /^\d{1,3}$/.test(fields[i - 1])) seq = fields[i - 1];
        break;
      }
    }
  }
  if (code === null) description = norm(fields.join(" ")) || null;
  return { seq, code, description, raw };
}

// Parse the whole return file. Returns { rejections, unparsed }. A rejection is a line
// that carries a board code; an unparsed line (a header, a blank, a line with no code) is
// kept in unparsed so nothing is silently swallowed.
export function parseReturnFile(text) {
  const lines = String(text === null || text === undefined ? "" : text).split(/\r?\n/);
  const rejections = [], unparsed = [];
  for (const line of lines) {
    if (norm(line) === "") continue;
    const p = parseReturnLine(line);
    if (p.code) rejections.push(p); else unparsed.push(p.raw);
  }
  return { rejections, unparsed };
}

// -- catalogue growth (description to element matching) ----------------------

// Match a rejection description against the known element names. Confidence is the
// fraction of an element's words that appear in the description (a deterministic proxy).
// Returns the best { element, confidence }, or { element: null, confidence: 0 } if none.
export function matchDescriptionToElements(description, elementNames) {
  const dset = new Set(tokens(description));
  let best = { element: null, confidence: 0 };
  for (const name of elementNames || []) {
    const etoks = tokens(name);
    if (!etoks.length) continue;
    const hit = etoks.filter((t) => dset.has(t)).length;
    const confidence = hit / etoks.length;
    if (confidence > best.confidence) best = { element: name, confidence };
  }
  return best;
}

// A catalogue growth record: a PROPOSAL a human confirms. Carries the board's raw text
// and, only when the description matches an element at or above the floor, a proposed
// element. It never adds a trusted mapping and never guesses a value (Section 4.3,
// criterion 9).
export function catalogueGrowthRecord(jurisdiction, rejection, elementNames, floor = CONFIDENCE_FLOOR) {
  const match = matchDescriptionToElements(rejection.description, elementNames);
  const proposed = match.confidence >= floor ? match.element : null;
  return {
    jurisdiction_code: norm(jurisdiction),
    board_code: norm(rejection.code),
    raw_text: rejection.raw,
    description: rejection.description,
    proposed_element: proposed,
    match_confidence: Number(match.confidence.toFixed(3)),
    status: "pending-human-confirmation",
  };
}

// -- reconcile ---------------------------------------------------------------

// Reconcile a parsed return file against the catalogue. For each rejection: a code the
// catalogue already trusts (confidence at or above the floor, errors.mjs) resolves to its
// element; any other code is unmapped, surfaces the board's raw text to a named human,
// and creates a catalogue growth record. Returns the per rejection results, the growth
// records, the unmapped count, and the unparsed lines.
export function reconcileReturnFile(parsed, catalogueIndex, opts = {}) {
  const jurisdiction = opts.jurisdiction || "";
  const elementNames = opts.elementNames || [];
  const floor = opts.floor !== undefined ? opts.floor : CONFIDENCE_FLOOR;
  const results = [], catalogueGrowth = [];

  for (const rej of parsed.rejections || []) {
    const r = resolveError(catalogueIndex, jurisdiction, rej.code, rej.raw, floor);
    if (r.mapped) {
      results.push({ status: "mapped", code: rej.code, element: r.element, description: rej.description, raw: rej.raw });
    } else {
      const growth = catalogueGrowthRecord(jurisdiction, rej, elementNames, floor);
      catalogueGrowth.push(growth);
      results.push({
        status: "unmapped", code: rej.code, description: rej.description, raw: rej.raw,
        surfaceToHuman: true, proposedElement: growth.proposed_element, matchConfidence: growth.match_confidence,
      });
    }
  }
  return {
    results, catalogueGrowth,
    unmappedCount: results.filter((r) => r.status === "unmapped").length,
    unparsed: parsed.unparsed || [],
  };
}

// Build the wcb_submission result from a reconciliation. A submission with any rejection
// is rejected; unmapped rejections or unparsed lines require human review.
export function buildSubmissionResult(submissionId, attempt, reconciled) {
  const rejected = (reconciled.results || []).length > 0;
  return {
    submission_id: submissionId,
    attempt: attempt,
    status: rejected ? "rejected" : "accepted",
    rejection_count: (reconciled.results || []).length,
    unmapped_count: reconciled.unmappedCount || 0,
    unparsed_count: (reconciled.unparsed || []).length,
    human_review_required: (reconciled.unmappedCount || 0) > 0 || (reconciled.unparsed || []).length > 0,
    rejections: reconciled.results || [],
  };
}
