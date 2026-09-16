/* Prompt 47 Part 3 config policy suite. node clinical/engine/config_policy.test.mjs
   No em dashes or en dashes anywhere. */

import { assertOverrideAllowed, assertLocationOwned, listOverrides, diffValues } from "./config_policy.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

ok("default policy lets a child change", assertOverrideAllowed({ key: "batch.safety_margin", override_policy: "default", allowed_scopes: "global,organisation,location" }, "location").ok === true);
ok("inherited policy blocks a child change", throws(() => assertOverrideAllowed({ key: "corp.logo", override_policy: "inherited", allowed_scopes: "organisation,location" }, "location"), "OVERRIDE-INHERITED"));
ok("locked policy is frozen", throws(() => assertOverrideAllowed({ key: "corp.logo", override_policy: "locked", allowed_scopes: "organisation" }, "organisation"), "OVERRIDE-LOCKED"));
ok("jurisdiction is never inherited at organisation", throws(() => assertLocationOwned("location.jurisdiction_code", "organisation"), "JURISDICTION-NEVER-INHERITED"));
ok("jurisdiction may be set at location", assertLocationOwned("location.jurisdiction_code", "location") === true);
ok("board credential key is location only", throws(() => assertOverrideAllowed({ key: "location.board_credential_key", override_policy: "default", allowed_scopes: "location" }, "region"), "JURISDICTION-NEVER-INHERITED"));

const listed = listOverrides({
  definitions: [
    { key: "batch.safety_margin", override_policy: "default" },
    { key: "corp.hours", override_policy: "inherited" },
    { key: "location.jurisdiction_code", override_policy: "default", allowed_scopes: "location" },
  ],
  values: [
    { key: "batch.safety_margin", scope_type: "organisation", organisation_id: "org-1", value: 10 },
    { key: "batch.safety_margin", scope_type: "location", organisation_id: "org-1", value: 30 },
    { key: "corp.hours", scope_type: "organisation", organisation_id: "org-1", value: 9 },
    { key: "corp.hours", scope_type: "location", organisation_id: "org-1", value: 8 },
    { key: "location.jurisdiction_code", scope_type: "organisation", organisation_id: "org-1", value: "AB" },
  ],
}, "org-1");
ok("listOverrides reports a default child change", listed.overrides.some((o) => o.key === "batch.safety_margin"));
ok("inherited child change is corporate drift", listed.corporate_drift.some((o) => o.key === "corp.hours"));
ok("jurisdiction set at organisation is drift", listed.corporate_drift.some((o) => o.key === "location.jurisdiction_code"));
ok("diffValues marks a change", diffValues(1, 2).changed === true && diffValues(1, 1).changed === false);

console.log("\nconfig_policy suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
