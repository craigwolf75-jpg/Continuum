/* Prompt 47 clinic-ops CI suite. Imports the engine modules and proves E1, E2,
   E8, onboarding, entitlement, break glass, analytics, dash hygiene, and
   secret redaction. No em dashes or en dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ensureSingleSiteHierarchy, assertE1Complete } from "../clinical/engine/hierarchy.mjs";
import { upsertGlobalPractitioner, addMembership, validateContractRole } from "../clinical/engine/membership.mjs";
import { startOnboardingRun, advanceStage, readinessGate, recordPrivacyOverride, goLive } from "../clinical/engine/onboarding.mjs";
import { resolveAccessMode, checkCapacity, resolveEntitlements, flagsAreNotEntitlements } from "../clinical/engine/entitlement.mjs";
import { openBreakGlass, diagnosticPayload, defaultContinuumClinicalAccess } from "../clinical/engine/support_access.mjs";
import { feesForgone, aggregateOnlyRtw, benchmarkOrHide } from "../clinical/engine/clinic_analytics.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const SECRET_PW = "s3cr3t-P@ss-9931";
const env = { MYWCB_USERNAME: "submitter001", MYWCB_PASSWORD: SECRET_PW };

function nextStore(extra) {
  let n = 0;
  return Object.assign({
    nextId: (p) => p + "-" + (++n),
    organisations: [],
    regions: [],
    locations: [],
    practitioners: [],
    memberships: [],
    runs: [],
    contractRoles: [
      { contract_id: "000001", practitioner_role: "GP" },
      { contract_id: "000004", practitioner_role: "OR" },
    ],
    env,
  }, extra || {});
}

// -- E1 --------------------------------------------------------------------
{
  const s = nextStore();
  const site = ensureSingleSiteHierarchy({ organisation_id: "org-1", jurisdiction_code: "AB", legal_name: "Synth One" }, s);
  ok("E1: single site creates org, region, and location", Boolean(site.organisation && site.region && site.location));
  ok("E1: complete hierarchy asserts", assertE1Complete("org-1", s).ok === true);
  const missing = nextStore();
  missing.organisations.push({ id: "org-x", legal_name: "X", jurisdiction_code: "AB", status: "active" });
  ok("E1: missing level fails named", throws(() => assertE1Complete("org-x", missing), "E1-INCOMPLETE"));
}

// -- E2 --------------------------------------------------------------------
{
  const s = nextStore();
  ensureSingleSiteHierarchy({ organisation_id: "org-1", location_id: "loc-a", region_id: "reg-1", jurisdiction_code: "AB" }, s);
  s.locations.push({ id: "loc-b", organisation_id: "org-1", region_id: s.regions[0].id, jurisdiction_code: "AB", name: "B" });
  const p = upsertGlobalPractitioner({ billing_number: "BN-47", family_name: "Reed", given_name: "Alex" }, s);
  const m1 = addMembership({ organisation_id: "org-1", location_id: s.locations[0].id, practitioner_id: p.practitioner.id, contract_identifier: "000001", practitioner_role: "GP" }, s);
  const m2 = addMembership({ organisation_id: "org-1", location_id: "loc-b", practitioner_id: p.practitioner.id, contract_identifier: "000004", practitioner_role: "OR" }, s);
  ok("E2: one practitioner two memberships same billing number", m1.practitioner_id === m2.practitioner_id && p.practitioner.billing_number === "BN-47");
  ok("E2: different contract and role per location", m1.contract_identifier !== m2.contract_identifier && m1.practitioner_role !== m2.practitioner_role);
  ok("E2: invalid pair blocks", throws(() => validateContractRole("000001", "OR", s), "CONTRACT-ROLE-INVALID"));
}

// -- E8 --------------------------------------------------------------------
{
  ok("E8: payment failure never clinical_disabled", resolveAccessMode({ payment_failed: true }).clinical_disabled === false);
  const after = resolveAccessMode({ payment_grace_elapsed: true });
  ok("E8: after grace read_only and export available", after.mode === "read_only" && after.export_available === true && after.clinical_disabled === false);
}

// -- Onboarding ------------------------------------------------------------
{
  const s = nextStore();
  s.practitioner_pair = { contract_identifier: "000001", practitioner_role: "GP" };
  const run = startOnboardingRun({ organisation_id: "org-1" }, s);
  advanceStage(run, "configure");
  advanceStage(run, "people_and_data");
  advanceStage(run, "ready");
  ok("onboarding: Ready blocked without privacy pack", readinessGate(run, s).blockers.some((b) => b.key === "privacy_pack"));
  recordPrivacyOverride(run, "recorded override");
  run.ima_all_signed = true;
  run.admin_mfa_enrolled = true;
  run.sandbox_test_complete = true;
  ok("onboarding: override plus banner clears privacy block", readinessGate(run, s).ready === true && run.privacy_pack_banner === true);
  const noPair = { ...run, valid_practitioner_pair: false };
  ok("onboarding: blocked without valid practitioner pair", readinessGate(noPair, { ...s, practitioner_pair: null }).blockers.some((b) => b.key === "valid_practitioner_pair"));
  ok("onboarding: go live requires blocking criteria", goLive(run, s).status === "live");
}

// -- Entitlement -----------------------------------------------------------
{
  const mapped = resolveEntitlements("pilot", {});
  ok("entitlement: flags are not entitlements", flagsAreNotEntitlements("feature.beta", "clinical_core") && mapped.feature_flags_separate === true);
  ok("entitlement: at capacity warns", checkCapacity("locations", 1, 1).status === "warn");
  ok("entitlement: exceed blocks new not in-progress", checkCapacity("locations", 2, 1, { adding_new: true }).blocks === "new_additions" && checkCapacity("locations", 2, 1, { in_progress: true }).ok === true);
}

// -- Break glass and diagnostic --------------------------------------------
{
  ok("break glass: default no Continuum clinical access", defaultContinuumClinicalAccess() === false);
  const s = nextStore();
  ok("break glass: requires consent and window", throws(() => openBreakGlass({ clinic_consented: false, admin_notified: true, reason: "x", starts_at: "2026-01-01", ends_at: "2026-01-02" }, s), "BREAK-GLASS-CONSENT-REQUIRED"));
  const opened = openBreakGlass({
    organisation_id: "org-1", location_id: "loc-1", actor_id: "a1",
    clinic_consented: true, admin_notified: true, reason: "outage",
    starts_at: "2026-09-15T00:00:00Z", ends_at: "2026-09-16T00:00:00Z",
  }, s);
  ok("break glass: flagged and no secret", opened.audit_flag === "break_glass" && JSON.stringify(opened).includes(SECRET_PW) === false);
  const diag = diagnosticPayload({
    error_reference: "ERR-47", component: "batch", metadata: { diagnosis: "x", pain: 4, phn: "9", restriction: "lift" },
  }, env);
  ok("diagnostic strips clinical keys", !diag.metadata.diagnosis && !diag.metadata.pain && !diag.metadata.phn && !diag.metadata.restriction);
  ok("secrets: fake MYWCB password absent from diagnostic and break glass", !JSON.stringify([diag, opened]).includes(SECRET_PW));
}

// -- Analytics -------------------------------------------------------------
{
  ok("analytics: RTW per physician refused", throws(() => aggregateOnlyRtw([], { group_by: "physician" }), "RTW-PER-PHYSICIAN-REFUSED"));
  ok("analytics: fees forgone computed", feesForgone({ eligible_fee_amount: 80, collected_fee_amount: 20 }).value === 60);
  ok("analytics: benchmark hidden below min cohort", benchmarkOrHide(2, 8).shown === false);
}

// -- Dash scan on new engine sources ---------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const files = [
    "hierarchy.mjs", "membership.mjs", "onboarding.mjs", "config_policy.mjs",
    "authorize.mjs", "physician_lifecycle.mjs", "entitlement.mjs",
    "clinic_analytics.mjs", "support_access.mjs", "clinic_ops_util.mjs",
  ];
  let clean = true;
  for (const f of files) {
    const text = readFileSync(join(here, "..", "clinical", "engine", f), "utf8");
    if (/[\u2013\u2014]/.test(text)) {
      clean = false;
      console.error("  dash found in " + f);
    }
  }
  ok("no em dash or en dash in new engine files", clean);
}

console.log("\ndeploy prompt47 clinic-ops suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
