/* Continuum Prompt 40: date defect passthrough suite (Prompt 39A Section 4,
   acceptance criteria 15 and 16). Proves that real dates the validation schema
   wrongly rejects (9 and 19 February every year, and a real 29 February the
   schema's leap list omits) pass Continuum validation and are logged as known
   defects without blocking, while dates that never existed are rejected
   regardless of what either schema says. No dashes anywhere. */

import { reconcileDate } from "./date_defect.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- criterion 15: real dates the schema defect rejects pass and are logged, not blocked --
const feb9 = reconcileDate("Date of Injury", "2026-02-09");
ok("9 February 2026 is not blocked", feb9.blocked === false);
ok("9 February 2026 is flagged a known defect", feb9.knownDefect === true && feb9.note && feb9.note.id === "DATE-SCHEMA-DEFECT-B2");
ok("9 February 2026 raises no validation failure", feb9.failures.length === 0);

const feb19 = reconcileDate("Date of Injury", "2026-02-19");
ok("19 February 2026 is not blocked", feb19.blocked === false && feb19.knownDefect === true);

// 29 February 2000 is a real leap day the schema's list omits (schemaAccepted false)
const feb29_2000 = reconcileDate("Date of Injury", "2000-02-29", false);
ok("29 February 2000 is a real date the schema rejects: not blocked, known defect", feb29_2000.blocked === false && feb29_2000.knownDefect === true);
ok("29 February 2000 logs the B2 defect note", feb29_2000.note && feb29_2000.note.id === "DATE-SCHEMA-DEFECT-B2");

// -- criterion 16: dates that never existed are rejected regardless of the schema --
const feb29_1900 = reconcileDate("Date of Injury", "1900-02-29", true); // schema wrongly accepts it
ok("29 February 1900 is blocked even though the schema accepts it", feb29_1900.blocked === true && feb29_1900.failures[0].id === "DATE-INVALID");
const sep31 = reconcileDate("Date of service", "2026-09-31", true);
ok("31 September 2026 is blocked (no such date)", sep31.blocked === true && sep31.failures[0].id === "DATE-INVALID");
const feb30 = reconcileDate("Date of Examination", "2026-02-30");
ok("30 February 2026 is blocked", feb30.blocked === true);

// -- a real 29 February the schema ACCEPTS (2024) is fine, no defect flag --
const feb29_2024 = reconcileDate("Date of Injury", "2024-02-29", true);
ok("29 February 2024 with schema accepting is not blocked and not a defect", feb29_2024.blocked === false && feb29_2024.knownDefect === false);

// -- ordinary valid dates pass cleanly --
ok("28 February 2026 passes cleanly", (() => { const r = reconcileDate("d", "2026-02-28"); return r.blocked === false && r.knownDefect === false; })());
ok("a normal date passes cleanly", (() => { const r = reconcileDate("d", "2026-06-15", true); return r.blocked === false && r.knownDefect === false && r.failures.length === 0; })());

// -- a real date the schema rejects OUTSIDE the known defect is not silently passed --
const weird = reconcileDate("d", "2026-06-15", false); // real, schema rejects for a non February reason
ok("a real non February date the schema rejects is blocked as a discrepancy, not silently passed", weird.blocked === true && weird.failures[0].id === "DATE-SCHEMA-DISCREPANCY");

// -- Continuum only mode (no schema verdict): 9/19 Feb still flagged, others clean --
ok("Continuum only: 9 February still flagged known defect", reconcileDate("d", "2026-02-09").knownDefect === true);
ok("Continuum only: a normal date is clean", reconcileDate("d", "2026-03-10").knownDefect === false);

// -- non ISO shape is left to P1 --
ok("a non ISO value is left to P1, not blocked here", reconcileDate("d", "09/02/2026").blocked === false);

console.log("\ndate defect suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
