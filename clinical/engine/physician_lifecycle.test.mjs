/* Prompt 47 Part 5 physician lifecycle suite. node clinical/engine/physician_lifecycle.test.mjs
   No em dashes or en dashes anywhere. */

import { transitionLifecycle, assertNeverDelete, credentialCheckAtSignature, collegeFormatOk, verifyBoardKeyName } from "./physician_lifecycle.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

ok("invited to registered", transitionLifecycle("invited", "registered").to === "registered");
ok("registered to credentialed", transitionLifecycle("registered", "credentialed").to === "credentialed");
ok("credentialed to active", transitionLifecycle("credentialed", "active").to === "active");
ok("active may suspend", transitionLifecycle("active", "suspended").to === "suspended");
ok("cannot skip to active from invited", throws(() => transitionLifecycle("invited", "active"), "LIFECYCLE-ILLEGAL"));
ok("never delete when signed reports exist", throws(() => assertNeverDelete({ id: "p1" }, { signedReports: [{ practitioner_id: "p1" }] }), "LIFECYCLE-NO-DELETE"));
ok("never delete even without signed reports", throws(() => assertNeverDelete({ id: "p2" }, { signedReports: [] }), "LIFECYCLE-NO-DELETE"));

ok("college format accepts an alphanumeric id", collegeFormatOk("C12345") === true);
ok("college format rejects blank", collegeFormatOk("") === false);

const store = {
  contractRoles: [{ contract_id: "000001", practitioner_role: "GP" }],
  credentials: [{
    practitioner_id: "p1",
    kind: "college_registration",
    value_ref: "C12345",
    expires_on: "2027-01-01",
    status: "active",
  }],
  env: { MYWCB_USERNAME: "user", BOARD_KEY: "present" },
  now: "2026-06-01T00:00:00Z",
};
ok("signature check passes a current college", credentialCheckAtSignature({
  practitioner_id: "p1", contract_identifier: "000001", practitioner_role: "GP",
}, store).ok === true);
ok("expired college BLOCKS signature", credentialCheckAtSignature({
  practitioner_id: "p1",
  credentials: [{ kind: "college_registration", value_ref: "C12345", expires_on: "2020-01-01", status: "active" }],
}, store, "2026-06-01").blocked === true);
ok("invalid contract pair BLOCKS", credentialCheckAtSignature({
  practitioner_id: "p1", contract_identifier: "000001", practitioner_role: "OR",
}, store).blocked === true);
ok("NP BLOCKS", credentialCheckAtSignature({
  practitioner_id: "p1", contract_identifier: "000084", practitioner_role: "NP",
}, store).blocked === true);
ok("board key name is verified without returning a secret", verifyBoardKeyName("BOARD_KEY", store.env).ok === true && verifyBoardKeyName("BOARD_KEY", store.env).secret === undefined);

console.log("\nphysician_lifecycle suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
