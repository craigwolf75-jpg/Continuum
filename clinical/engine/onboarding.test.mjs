/* Prompt 47 Part 2 onboarding suite. node clinical/engine/onboarding.test.mjs
   No em dashes or en dashes anywhere. */

import { startOnboardingRun, advanceStage, readinessGate, recordPrivacyOverride, goLive } from "./onboarding.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

function store() {
  let n = 0;
  return {
    nextId: (p) => p + "-" + (++n),
    runs: [],
    contractRoles: [{ contract_id: "000001", practitioner_role: "GP" }],
    practitioner_pair: { contract_identifier: "000001", practitioner_role: "GP" },
  };
}

const s = store();
const run = startOnboardingRun({ organisation_id: "org-1" }, s);
ok("starts at organisation", run.current_stage === "organisation" && run.status === "in_progress");
advanceStage(run, "configure");
advanceStage(run, "people_and_data");
advanceStage(run, "ready");
ok("stage order Organisation, Configure, People and data, Ready", run.current_stage === "ready");
ok("cannot skip a stage", throws(() => advanceStage({ current_stage: "organisation" }, "ready"), "ONBOARDING-STAGE-ORDER"));

const blocked = readinessGate(run, s);
ok("Ready is blocked without privacy pack", blocked.ready === false && blocked.blockers.some((b) => b.key === "privacy_pack"));

ok("override without reason fails", throws(() => recordPrivacyOverride(run, ""), "PRIVACY-OVERRIDE-REASON-MISSING"));
recordPrivacyOverride(run, "board-approved delay");
run.ima_all_signed = true;
run.admin_mfa_enrolled = true;
run.sandbox_test_complete = true;
const stillConfig = readinessGate(run, s);
ok("configuration_validation_passes blocks go live", stillConfig.ready === false && stillConfig.blockers.some((b) => b.key === "configuration_validation_passes"));
ok("coordinator training is warned not blocking", stillConfig.warnings.some((w) => w.key === "coordinator_training" && w.blocking === false));
ok("rollback plan is warned not blocking", stillConfig.warnings.some((w) => w.key === "rollback_plan_agreed" && w.blocking === false));
run.configuration_validation_passes = true;
const afterOverride = readinessGate(run, s);
ok("override plus banner clears the privacy pack block", afterOverride.ready === true && afterOverride.privacy_pack_banner === true);
ok("go live without board credentials is allowed when submission is off", afterOverride.blockers.every((b) => b.key !== "board_credentials_verified"));
ok("submission_enabled requires board credentials", readinessGate(run, s, { submission_enabled: true }).blockers.some((b) => b.key === "board_credentials_verified"));
run.board_credentials_verified = true;

const noPair = { ...run, valid_practitioner_pair: false, practitioner_pair: null };
const pairBlocked = readinessGate(noPair, { ...s, practitioner_pair: null });
ok("blocked without a valid practitioner pair", pairBlocked.ready === false && pairBlocked.blockers.some((b) => b.key === "valid_practitioner_pair"));

const live = goLive(run, s, "2026-09-15T00:00:00Z");
ok("go live requires blocking criteria and sets live", live.status === "live" && live.go_live_at === "2026-09-15T00:00:00Z");
ok("go live without gates fails", throws(() => goLive(startOnboardingRun({ organisation_id: "org-2" }, store()), store()), "ONBOARDING-NOT-READY"));

console.log("\nonboarding suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
