/* Continuum physician platform: the production submission gate (Prompt 42 crit 11, Prompt
   43a gate 1, and the standing rule that production submission is never enabled by Claude,
   in any environment).

   This is the structural guarantee that a batch never transmits to the board until every
   prerequisite is present AND an operator sets an explicit flag. It is defense in depth:
   the orchestrator checks productionSubmissionEnabled before it will even consider an
   upload, and the DEFAULT uploader is a disabled one that refuses and escalates to a named
   human. Even when every prerequisite is met, no real board transmitter is wired in this
   module: the actual network uploader is deliberately absent and must be added later, once,
   with counsel sign off. So flipping the flag makes the system READY to submit, not
   submitting.

   Pure functions, no environment access of their own (env is injected). No dashes. */

// The prerequisites that must ALL hold before a batch may transmit. Each maps to a concrete
// piece of evidence: the clinic is accredited (Prompt 42 crit 11), the residency region is
// recorded (Prompt 43a gate 1, prereq 7), the cron secret is present (the scheduler cannot
// run in prod without it), and an operator has set the explicit allow flag.
export const SUBMISSION_PREREQUISITES = ["accredited-clinic", "region-recorded", "cron-secret", "explicit-allow-flag"];

// Return the MISSING prerequisites (empty means all are satisfied). env is the injected
// environment map; clinic is the clinic row (accreditation_status, region).
export function missingSubmissionPrerequisites(env, clinic) {
  const missing = [];
  if (!clinic || clinic.accreditation_status !== "accredited") missing.push("accredited-clinic");
  if (!clinic || !String(clinic.region || "").trim()) missing.push("region-recorded");
  if (!env || !String(env.CRON_SECRET || "").trim()) missing.push("cron-secret");
  if (!env || String(env.CONTINUUM_ALLOW_BOARD_SUBMISSION) !== "true") missing.push("explicit-allow-flag");
  return missing;
}

// True only when every prerequisite holds. The orchestrator runs the batch in dry run mode
// (assemble and validate, never transmit) whenever this is false.
export function productionSubmissionEnabled(env, clinic) {
  return missingSubmissionPrerequisites(env, clinic).length === 0;
}

// The default uploader: refuses to transmit and escalates to a named human. This is the
// uploader the orchestrator uses unless a real, deliberately wired transmitter is injected.
// Returning ok false means runBatch returns the reports to signed and notifies (batch.mjs),
// so nothing is ever silently dropped.
export function disabledUploader(reason) {
  return () => ({
    ok: false, transmitted: false,
    escalation: { recipient: "named-human", channel: "in_app", reason: reason || "board-submission-disabled" },
  });
}

// A guard a real transmitter must call before it sends. It throws unless the gate is open,
// so a future board uploader cannot transmit by mistake even if it is wired in early.
export function assertSubmissionEnabled(env, clinic) {
  const missing = missingSubmissionPrerequisites(env, clinic);
  if (missing.length) {
    const e = new Error("Board submission is disabled. Missing prerequisites: " + missing.join(", ") + ". Production submission is never enabled without every prerequisite and an explicit operator flag.");
    e.code = "SUBMISSION-DISABLED";
    e.missing = missing;
    throw e;
  }
  return true;
}
