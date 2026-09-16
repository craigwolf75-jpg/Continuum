/* Prompt 47 Part 2: clinic onboarding product half.

   Stages: organisation, configure, people_and_data, ready. Readiness is a
   blocking gate (Part 2.6): privacy pack, IMA, admin MFA, sandbox test, a
   valid practitioner contract and role pair, and configuration_validation_passes.
   board_credentials_verified blocks SUBMISSION only (goLive with
   submission_enabled). Coordinator training and rollback plan agreed warn,
   they do not block. A privacy pack override requires a recorded reason and
   a persistent banner.
   No visitor-facing copy. No em dashes or en dashes anywhere. */

import { namedError, requireStore } from "./clinic_ops_util.mjs";
import { validateContractRole } from "./membership.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const ONBOARDING_STAGES = Object.freeze(["organisation", "configure", "people_and_data", "ready"]);
export const ONBOARDING_STATUSES = Object.freeze(["in_progress", "blocked", "ready", "live", "withdrawn"]);

export const BLOCKING_CRITERIA = Object.freeze([
  "privacy_pack",
  "ima_all_signed",
  "admin_mfa_enrolled",
  "sandbox_test_complete",
  "valid_practitioner_pair",
  "configuration_validation_passes",
]);

export const SUBMISSION_BLOCKING_CRITERIA = Object.freeze([
  "board_credentials_verified",
]);

export const WARNING_CRITERIA = Object.freeze([
  "coordinator_training",
  "rollback_plan_agreed",
]);

function stageIndex(stage) {
  const i = ONBOARDING_STAGES.indexOf(norm(stage));
  if (i < 0) throw namedError("ONBOARDING-STAGE-UNKNOWN", "Unknown onboarding stage " + stage + ".");
  return i;
}

export function startOnboardingRun(input, store) {
  requireStore(store, "ONBOARDING-STORE-MISSING", "An onboarding store is required.");
  store.runs = store.runs || [];
  const row = {
    id: (input && input.id) || (store.nextId && store.nextId("onboarding_run")),
    organisation_id: input && input.organisation_id,
    current_stage: "organisation",
    status: "in_progress",
    privacy_pack_filed: false,
    privacy_pack_override_reason: null,
    privacy_pack_banner: false,
    ima_all_signed: false,
    admin_mfa_enrolled: false,
    sandbox_test_complete: false,
    configuration_validation_passes: false,
    board_credentials_verified: false,
    coordinator_training: false,
    rollback_plan_agreed: false,
    go_live_at: null,
    valid_practitioner_pair: false,
  };
  if (!row.id || !row.organisation_id) {
    throw namedError("ONBOARDING-ARGS-MISSING", "startOnboardingRun requires organisation_id and an id or store.nextId.");
  }
  store.runs.push(row);
  return row;
}

export function advanceStage(run, nextStage) {
  if (!run) throw namedError("ONBOARDING-RUN-MISSING", "advanceStage requires a run.");
  const from = stageIndex(run.current_stage);
  const to = stageIndex(nextStage);
  if (to !== from + 1) {
    throw namedError("ONBOARDING-STAGE-ORDER", "Stages move Organisation, Configure, People and data, Ready. Cannot jump from " + run.current_stage + " to " + nextStage + ".");
  }
  run.current_stage = nextStage;
  return run;
}

function privacySatisfied(run) {
  if (run.privacy_pack_filed) return { ok: true };
  const reason = norm(run.privacy_pack_override_reason);
  if (reason && run.privacy_pack_banner) return { ok: true, override: true, banner: true };
  return { ok: false, code: "PRIVACY-PACK-BLOCKED", message: "Ready is blocked without a privacy pack unless a recorded override and persistent banner are present." };
}

function practitionerSatisfied(run, store) {
  if (run.valid_practitioner_pair === true) return { ok: true };
  const pair = run.practitioner_pair || (store && store.practitioner_pair);
  if (!pair) return { ok: false, code: "PRACTITIONER-PAIR-BLOCKED", message: "Go live is blocked without a valid practitioner contract and role pair." };
  try {
    validateContractRole(pair.contract_identifier, pair.practitioner_role, store);
    return { ok: true };
  } catch (e) {
    return { ok: false, code: e.code || "PRACTITIONER-PAIR-BLOCKED", message: e.message };
  }
}

export function readinessGate(run, store, opts) {
  requireStore(store, "ONBOARDING-STORE-MISSING", "An onboarding store is required.");
  if (!run) throw namedError("ONBOARDING-RUN-MISSING", "readinessGate requires a run.");
  const options = opts || {};
  const blockers = [];
  const warnings = [];
  const privacy = privacySatisfied(run);
  if (!privacy.ok) blockers.push({ key: "privacy_pack", code: privacy.code, message: privacy.message, blocking: true });
  if (!run.ima_all_signed) blockers.push({ key: "ima_all_signed", code: "IMA-BLOCKED", message: "Go live is blocked until IMA agreements are all signed.", blocking: true });
  if (!run.admin_mfa_enrolled) blockers.push({ key: "admin_mfa_enrolled", code: "ADMIN-MFA-BLOCKED", message: "Go live is blocked until admin MFA is enrolled.", blocking: true });
  if (!run.sandbox_test_complete) blockers.push({ key: "sandbox_test_complete", code: "SANDBOX-BLOCKED", message: "Go live is blocked until the sandbox test is complete.", blocking: true });
  if (!run.configuration_validation_passes) {
    blockers.push({ key: "configuration_validation_passes", code: "CONFIG-VALIDATION-BLOCKED", message: "Go live is blocked until configuration validation passes.", blocking: true });
  }
  const pair = practitionerSatisfied(run, store);
  if (!pair.ok) blockers.push({ key: "valid_practitioner_pair", code: pair.code, message: pair.message, blocking: true });
  if (options.submission_enabled === true && !run.board_credentials_verified) {
    blockers.push({ key: "board_credentials_verified", code: "BOARD-CREDENTIAL-BLOCKED", message: "Submission is blocked until board credentials are verified.", blocking: true });
  }
  if (!run.coordinator_training) {
    warnings.push({ key: "coordinator_training", code: "COORDINATOR-TRAINING-WARN", message: "Coordinator training is incomplete. Warned, not blocking.", blocking: false });
  }
  if (!run.rollback_plan_agreed) {
    warnings.push({ key: "rollback_plan_agreed", code: "ROLLBACK-PLAN-WARN", message: "Rollback plan is not agreed. Warned, not blocking.", blocking: false });
  }
  const ready = blockers.length === 0;
  return {
    ready,
    status: ready ? "ready" : "blocked",
    blockers,
    warnings,
    privacy_pack_banner: Boolean(run.privacy_pack_banner || (privacy.override && privacy.banner)),
    current_stage: run.current_stage,
    submission_enabled: options.submission_enabled === true,
  };
}

export function recordPrivacyOverride(run, reason) {
  if (!run) throw namedError("ONBOARDING-RUN-MISSING", "recordPrivacyOverride requires a run.");
  if (norm(reason) === "") {
    throw namedError("PRIVACY-OVERRIDE-REASON-MISSING", "A privacy pack override requires a recorded reason and a persistent banner.");
  }
  run.privacy_pack_filed = false;
  run.privacy_pack_override_reason = norm(reason);
  run.privacy_pack_banner = true;
  return run;
}

export function goLive(run, store, atOrOpts) {
  const options = (atOrOpts && typeof atOrOpts === "object") ? atOrOpts : { at: atOrOpts };
  const gate = readinessGate(run, store, options);
  if (!gate.ready) {
    throw namedError("ONBOARDING-NOT-READY", "Go live requires every blocking criterion.", { blockers: gate.blockers });
  }
  if (run.current_stage !== "ready") {
    throw namedError("ONBOARDING-NOT-READY", "Go live requires the Ready stage.");
  }
  run.status = "live";
  run.go_live_at = options.at || (store && store.now) || new Date().toISOString();
  run.submission_enabled = options.submission_enabled === true;
  return run;
}
