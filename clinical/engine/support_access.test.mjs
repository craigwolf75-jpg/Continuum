/* Prompt 47 Part 11 diagnostic and break glass suite. node clinical/engine/support_access.test.mjs
   No em dashes or en dashes anywhere. */

import { diagnosticPayload, openBreakGlass, isBreakGlassActive, defaultContinuumClinicalAccess } from "./support_access.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const SECRET_PW = "s3cr3t-P@ss-9931";
const env = { MYWCB_USERNAME: "submitter001", MYWCB_PASSWORD: SECRET_PW };

ok("default Continuum clinical access is false", defaultContinuumClinicalAccess() === false);

const diag = diagnosticPayload({
  error_reference: "ERR-47-01",
  component: "submission",
  status: "open",
  metadata: { diagnosis: "sprain", pain: 4, phn: "123456789", queue_depth: 3 },
  env,
}, env);
ok("diagnostic strips clinical keys", diag.metadata.diagnosis === undefined && diag.metadata.pain === undefined && diag.metadata.phn === undefined);
ok("diagnostic keeps non-clinical metadata", diag.metadata.queue_depth === 3);
ok("diagnostic never contains the myWCB password", JSON.stringify(diag).includes(SECRET_PW) === false);

const store = { nextId: () => "bg-1", break_glass: [], env };
ok("break glass requires consent", throws(() => openBreakGlass({
  organisation_id: "org-1", location_id: "loc-1", actor_id: "a1",
  clinic_consented: false, admin_notified: true, reason: "outage",
  starts_at: "2026-09-15T00:00:00Z", ends_at: "2026-09-15T01:00:00Z",
}, store), "BREAK-GLASS-CONSENT-REQUIRED"));
ok("break glass requires a window", throws(() => openBreakGlass({
  organisation_id: "org-1", location_id: "loc-1", actor_id: "a1",
  clinic_consented: true, admin_notified: true, reason: "outage",
}, store), "BREAK-GLASS-WINDOW-REQUIRED"));

const row = openBreakGlass({
  organisation_id: "org-1", location_id: "loc-1", actor_id: "a1",
  clinic_consented: true, admin_notified: true, reason: "board portal outage",
  starts_at: "2026-09-15T00:00:00Z", ends_at: "2026-09-15T02:00:00Z",
}, store);
ok("opened break glass is flagged", row.audit_flag === "break_glass" && row.continuum_clinical_access === false);
ok("active inside the window", isBreakGlassActive(row, "2026-09-15T01:00:00Z") === true);
ok("inactive after the window", isBreakGlassActive(row, "2026-09-15T03:00:00Z") === false);
ok("break glass output has no password", JSON.stringify(row).includes(SECRET_PW) === false);

console.log("\nsupport_access suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
