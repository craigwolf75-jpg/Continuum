/* Continuum Prompt 40 (Prompt 39A Section 5): the board error resolver. When a
   board return file rejects a report, the resolver looks the board code up in the
   catalogue (clinical.wcb_error_catalogue) and returns the ELEMENT it maps to, and
   nothing more. It never infers a required value, a polarity, or a correction from
   the board's message text, because the board's own 2007 wording carries inverted
   polarity versus the current field (39A Section 5).

   A code that is not in the catalogue, or is mapped below the 0.80 confidence
   floor, or has no element, is treated as unmapped: the resolver surfaces the
   board's RAW text to a named human rather than guessing (Prompt 39 rule, which
   39A says now matters more). Pure functions, no database. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const CONFIDENCE_FLOOR = 0.80;

// Build a lookup from the catalogue rows, keyed on board_code (per jurisdiction if
// given). Rows carry element_name, confidence, legacy_note.
export function indexErrorCatalogue(rows) {
  const m = new Map();
  for (const r of rows || []) m.set(norm(r.jurisdiction_code) + "|" + norm(r.board_code), r);
  return m;
}

// Resolve one board rejection. jurisdiction and boardCode identify the row;
// rawText is the board's exact message (always carried through so a human sees
// the board's own words). floor overrides the default confidence floor.
//
// Returns one of:
//   { mapped: true,  element, boardCode, note, rawText }        // trusted element mapping
//   { mapped: false, element: null, boardCode, rawText, surfaceToHuman: true }
//
// It never returns a value, a polarity, or a proposed correction.
export function resolveError(index, jurisdiction, boardCode, rawText, floor = CONFIDENCE_FLOOR) {
  const raw = rawText === null || rawText === undefined ? null : String(rawText);
  const row = index instanceof Map ? index.get(norm(jurisdiction) + "|" + norm(boardCode)) : undefined;
  const trusted = row && row.element_name && Number(row.confidence) >= floor;
  if (trusted)
    return { mapped: true, element: row.element_name, boardCode: norm(boardCode), note: row.legacy_note || null, rawText: raw };
  // unmapped, no element, or below the floor: surface the raw board text to a human.
  return { mapped: false, element: null, boardCode: norm(boardCode), rawText: raw, surfaceToHuman: true };
}
