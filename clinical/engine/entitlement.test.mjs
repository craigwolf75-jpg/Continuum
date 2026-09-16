/* Prompt 47 Part 10 entitlement suite. node clinical/engine/entitlement.test.mjs
   No em dashes or en dashes anywhere. */

import { resolveEntitlements, checkCapacity, resolveAccessMode, flagsAreNotEntitlements } from "./entitlement.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const mapped = resolveEntitlements("pilot", {});
ok("pilot maps to module entitlements", mapped.entitlements.some((e) => e.kind === "module" && e.module_key === "clinical_core"));
ok("pilot maps to capacity entitlements", mapped.entitlements.some((e) => e.kind === "capacity"));
ok("feature flags stay a separate channel", mapped.feature_flags_separate === true);
ok("flags are not entitlements", flagsAreNotEntitlements("ai_stub", "clinical_core") === true);
ok("unknown plan fails named", throws(() => resolveEntitlements("gold-plus", {}), "PLAN-UNKNOWN"));

ok("under capacity is ok", checkCapacity("practitioners", 2, 5).status === "ok");
ok("at capacity warns", checkCapacity("practitioners", 5, 5).status === "warn");
ok("over capacity blocks NEW additions", checkCapacity("practitioners", 6, 5, { adding_new: true }).status === "block_new" && checkCapacity("practitioners", 6, 5, { adding_new: true }).ok === false);
ok("in progress is never blocked", checkCapacity("practitioners", 9, 5, { in_progress: true, adding_new: true }).status === "in_progress_allowed");
ok("UNKNOWN limit is not treated as 0", checkCapacity("practitioners", 1, null).limit === "UNKNOWN");

ok("payment failure never sets clinical_disabled", resolveAccessMode({ payment_failed: true }).clinical_disabled === false && resolveAccessMode({ payment_failed: true }).mode === "full");
ok("after grace the tenant is read only", resolveAccessMode({ payment_grace_elapsed: true }).mode === "read_only" && resolveAccessMode({ payment_grace_elapsed: true }).export_available === true);
ok("clinical_disabled true is refused", throws(() => resolveAccessMode({ clinical_disabled: true }), "E8-CLINICAL-DISABLE-FORBIDDEN"));

console.log("\nentitlement suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
