/* Continuum Prompt 45: admin board labels.

   The admin directory must not hard code a province to board map. Labels come
   from the same provincial rules data the engine uses. This file is the deploy
   side projection (Vercel root is deploy/, so it cannot import clinical/).
   deploy/jurisdiction.test.mjs asserts this list matches
   clinical/db/provincial_rules.data.mjs. No dashes anywhere. */

export const JURISDICTION_BOARD_ROWS = [
  { code: "AB", board_name: "WCB Alberta", active: true },
  { code: "ZZ", board_name: "Synthetic Test Board", active: false },
  { code: "BC", board_name: "British Columbia board (inactive, no pack)", active: false },
  { code: "MB", board_name: "Manitoba board (inactive, no pack)", active: false },
  { code: "NB", board_name: "New Brunswick board (inactive, no pack)", active: false },
  { code: "NL", board_name: "Newfoundland and Labrador board (inactive, no pack)", active: false },
  { code: "NT", board_name: "Northwest Territories board (inactive, no pack)", active: false },
  { code: "NS", board_name: "Nova Scotia board (inactive, no pack)", active: false },
  { code: "NU", board_name: "Nunavut board (inactive, no pack)", active: false },
  { code: "ON", board_name: "Ontario board (inactive, no pack)", active: false },
  { code: "PE", board_name: "Prince Edward Island board (inactive, no pack)", active: false },
  { code: "QC", board_name: "Quebec board (inactive, no pack)", active: false },
  { code: "SK", board_name: "Saskatchewan board (inactive, no pack)", active: false },
  { code: "YT", board_name: "Yukon board (inactive, no pack)", active: false },
];

export function boardNameForCode(code, rows = JURISDICTION_BOARD_ROWS) {
  const c = String(code == null ? "" : code).trim().toUpperCase();
  if (!c) return "UNKNOWN";
  const row = (rows || []).find((r) => String(r.code).toUpperCase() === c);
  return row && row.board_name ? row.board_name : "UNKNOWN";
}
