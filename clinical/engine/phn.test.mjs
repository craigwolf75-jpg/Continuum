/* Continuum Prompt 40: PHN gate suite (Prompt 39A Section 1.4 and 1.5,
   acceptance criterion 8). Proves that the exact nine digit length is enforced
   in application code (the schema alone permits a short PHN), and that the check
   digit is a default off, refuse to guess stage. No dashes anywhere. */

import { phnLength, phnCheckDigit, phnGate, claimReferenceFormat } from "./phn.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// -- stage 1: length (criterion 8) --
ok("a nine digit PHN passes the length check", phnLength("123456789").length === 0);
ok("an eight digit PHN is rejected by application code (criterion 8)", phnLength("12345678").length === 1);
ok("a ten digit PHN is rejected", phnLength("1234567890").length === 1);
ok("a PHN with a non digit is rejected", phnLength("12345678X").length === 1);
ok("a blank PHN is not a length failure (valX01 owns presence)", phnLength("").length === 0);
ok("surrounding whitespace is trimmed then checked", phnLength("  123456789  ").length === 0);

// -- stage 2: check digit, default OFF --
ok("check digit off (no config) does nothing", phnCheckDigit("123456780", undefined).length === 0);
ok("check digit off (enabled false) does nothing", phnCheckDigit("123456780", { enabled: false }).length === 0);
ok("check digit enabled with no validator refuses to guess (config failure)", phnCheckDigit("123456780", { enabled: true }).length === 1);
ok("check digit enabled with a validator that rejects fails", phnCheckDigit("123456780", { enabled: true, validator: () => false }).length === 1);
ok("check digit enabled with a validator that accepts passes", phnCheckDigit("123456780", { enabled: true, validator: () => true }).length === 0);
ok("check digit passes the exact digits to the validator", (() => { let seen = null; phnCheckDigit("123456789", { enabled: true, validator: (v) => { seen = v; return true; } }); return seen === "123456789"; })());
ok("check digit off is a no op even for a blank value", phnCheckDigit("", { enabled: true, validator: () => false }).length === 0);

// -- the full gate --
ok("gate: a valid nine digit PHN with check digit off passes", phnGate("123456789").length === 0);
ok("gate: an eight digit PHN fails on length and never reaches the check digit", (() => { let called = false; const f = phnGate("12345678", { enabled: true, validator: () => { called = true; return true; } }); return f.length === 1 && f[0].id === "PHN-LENGTH" && called === false; })());
ok("gate: a nine digit PHN failing an enabled check digit is rejected", phnGate("123456780", { enabled: true, validator: () => false }).length === 1);

// -- claim reference number (39A Section 1.4) --
ok("a seven digit claim reference passes", claimReferenceFormat("1234567").length === 0);
ok("a one digit claim reference passes", claimReferenceFormat("5").length === 0);
ok("an eight digit claim reference is rejected", claimReferenceFormat("12345678").length === 1);
ok("a non digit claim reference is rejected", claimReferenceFormat("12A4567").length === 1);
ok("a blank claim reference is not a format failure", claimReferenceFormat("").length === 0);

console.log("\nphn suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
