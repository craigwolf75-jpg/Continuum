/* Continuum 38A suite (Prompt 38a). node deploy/CONTINUUM_38A_MODULE_TESTS.js
   Headless: the module loaded in a window-shim sandbox per the standing test
   law. One or more hard-failing tests per wired P38 item, including the
   start-date refusal carrying the July 23 correction verbatim, the
   misconfigured-preset sanitizer proof, mobility kept off the generic employer
   view but allowed on the claims/HSSE hybrid seat (13b wall), the clinical-field
   survival check across role composition, the functional-only nudge content
   assertion, and single-count event metering. Hard-fail; no em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, "CONTINUUM_38A_GARDA_CONFIG_MODULE.js"), "utf8");
const win = {};
new Function("window", "module", src)(win, undefined);
const A = win.CONTINUUM_38A;

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const DIVS = A.registerDivisions(["Security", "Cash", "Aviation"]).divisions;
const SCOPE = { province: "ON", division: "Security", injury_scope: "MSK", duration_days: 90 };

// P38-01
{
  const good = A.registerDivisions(["Security", "Cash", "Aviation"]);
  ok("P38-01 division registry accepts a clean list", good.ok === true && good.divisions.length === 3);
  const bad = A.registerDivisions(["Security", "security", ""]);
  ok("P38-01 refuses duplicates and empties", bad.ok === false && bad.errors.some(e => e.includes("duplicate")) && bad.errors.some(e => e.includes("empty")));
}

// P38-04 scope
ok("P38-04 pilot scope enforces the July 23 agreement exactly", A.validatePilotScope(SCOPE, DIVS).ok === true);
{
  const wrong = A.validatePilotScope({ province: "AB", division: "Security", injury_scope: "ALL", duration_days: 60 }, DIVS);
  ok("P38-04 a wrong scope names all three violations", wrong.ok === false && wrong.errors.length === 3);
}
ok("P38-04 an unregistered division is refused (registration branch)", A.validatePilotScope({ province: "ON", division: "Logistics", injury_scope: "MSK", duration_days: 90 }, DIVS).ok === false);
ok("P38-04 a missing division registry is refused, not thrown", A.validatePilotScope(SCOPE, undefined).ok === false);

// P38-04 start-date refusal (the July 23 correction verbatim)
{
  const dated = A.validatePilotScope({ province: "ON", division: "Security", injury_scope: "MSK", duration_days: 90, start_date: "2026-08-01" }, DIVS);
  ok("P38-04 a start date is refused because none was specified in the meeting", dated.ok === false && dated.errors[0].includes("no pilot start date was specified") && dated.errors[0].includes("Andree-Anne"));
}

// P38-04 intake routing
{
  ok("P38-04 MSK categories route to coordination", A.intakeDecision("strain_or_sprain", SCOPE).eligible === true && A.intakeDecision("repetitive_motion", SCOPE).eligible === true);
  const burn = A.intakeDecision("burn", SCOPE);
  ok("P38-04 everything else routes to the existing process", burn.eligible === false && burn.route === "existing_process");
}

// P38-05 intake filing facts first-class
{
  const missing = A.validateIntake({ injury_category: "strain_or_sprain", division: "Security", province: "ON" }, SCOPE, DIVS);
  ok("P38-05 intake requires claim number and board filing date as first-class fields", missing.ok === false && missing.errors.some(e => e.includes("claim_number")) && missing.errors.some(e => e.includes("board_report_filed_date")));
  const good = A.validateIntake({ claim_number: "ON-1", board_report_filed_date: "2026-07-20", injury_category: "strain_or_sprain", division: "Security", province: "ON" }, SCOPE, DIVS);
  ok("P38-05 a complete in-scope intake passes", good.ok === true);
}
{
  const out = A.validateIntake({ claim_number: "ON-2", board_report_filed_date: "2026-07-20", injury_category: "strain_or_sprain", division: "Cash", province: "ON" }, SCOPE, DIVS);
  ok("P38-05 intake outside the pilot division routes out", out.ok === false && out.errors[0].includes("existing process"));
  const oop = A.validateIntake({ claim_number: "AB-1", board_report_filed_date: "2026-07-20", injury_category: "strain_or_sprain", division: "Security", province: "AB" }, SCOPE, DIVS);
  ok("P38-05 intake outside the pilot province routes out", oop.ok === false && oop.errors[0].includes("existing process"));
}

// P38-03 objective-first preset and the wall
ok("P38-03 the objective-first employer view carries no pain and no mobility", eq(A.employerViewFields(A.CHECKIN_PRESETS.objective_first), ["duty_completion", "checkin_streak"]));
ok("P38-03 mobility rides the claims and HSSE hybrid view, not the employer view", eq(A.claimsViewFields(A.CHECKIN_PRESETS.objective_first), ["mobility_trend", "duty_completion", "checkin_streak"]));
ok("P38-03 the employer allowlist strips clinical fields and mobility from a misconfigured preset", eq(A.employerViewFields({ employer_visible: ["mobility_trend", "pain_score", "diagnosis_summary", "duty_completion", "checkin_streak"] }), ["duty_completion", "checkin_streak"]));
ok("P38-03 the employer allowlist also drops non-obvious clinical names (singular, abbreviated, synonym)", eq(A.employerViewFields({ employer_visible: ["symptom", "soreness", "dx", "clinical_note", "restrictions", "duty_completion"] }), ["duty_completion"]));
ok("P38-03 the claims sanitizer strips raw clinical fields but keeps mobility", eq(A.claimsViewFields({ claims_visible: ["mobility_trend", "pain_score", "checkin_streak"] }), ["mobility_trend", "checkin_streak"]));
ok("P38-03 the claims sanitizer strips abbreviated clinical names but keeps mobility", eq(A.claimsViewFields({ claims_visible: ["mobility_trend", "dx", "clinical_note", "checkin_streak"] }), ["mobility_trend", "checkin_streak"]));
ok("P38-03 pain remains a clinical signal so the escalation path keeps its input", A.CHECKIN_PRESETS.objective_first.clinical_signals.includes("pain"));

// P38-02 hybrid composition
{
  const composed = A.composeRoles(["employer", "hsse"]);
  ok("P38-02 hybrid Employer plus HSSE composition unions convenience", composed.ok === true && composed.fields.includes("safe_duties") && composed.fields.includes("mobility_trend"));
  const leaked = A.CLINICAL_FIELDS.some(c => composed.fields.some(f => f.toLowerCase().includes(c)));
  ok("P38-02 no clinical field survives composition, whatever seats combine", leaked === false);
  ok("P38-02 an unknown seat is refused", A.composeRoles(["employer", "wizard"]).ok === false);
  // non-vacuous proof: a seat that carries a clinical field (by singular or synonym name) has it stripped
  A.SEAT_FIELDS._probe = ["pain_score", "soreness_flag", "safe_duties"];
  const probe = A.composeRoles(["_probe"]);
  ok("P38-02 composition strips a clinical field from any seat, non-vacuously", probe.fields.indexOf("safe_duties") !== -1 && probe.fields.indexOf("pain_score") === -1 && probe.fields.indexOf("soreness_flag") === -1);
  delete A.SEAT_FIELDS._probe;
}

// P38-07 universal offer
{
  const made = A.makeUniversalOffer(["online training modules", "completing sales leads", "office duties"], "E1", "2026-07-23T15:00:00Z");
  ok("P38-07 the universal offer is constructed from tenant items", made.ok === true && made.offer.items.length === 3 && made.offer.response === null);
  const res = A.recordOfferResponse(made.offer, "accepted", "2026-07-23T15:05:00Z");
  ok("P38-07 one signed response is recorded with a timestamp", res.ok === true && res.offer.responded_at === "2026-07-23T15:05:00Z");
  const again = A.recordOfferResponse(made.offer, "declined", "2026-07-23T16:00:00Z");
  ok("P38-07 a re-answer is refused", again.ok === false);
}
ok("P38-07 an empty tenant offer is refused", A.makeUniversalOffer([], "E1", "2026-07-23T15:00:00Z").ok === false);

// P38-09 nudges
{
  const nudges = A.computeNudges([
    { worker_id: "E1", last_checkin_at: "2026-07-19T12:00:00Z" },
    { worker_id: "E2", last_checkin_at: "2026-07-22T12:00:00Z" },
  ], "2026-07-23T12:00:00Z", 3);
  ok("P38-09 lapse nudges fire at the threshold, to the team", nudges.length === 1 && nudges[0].worker_id === "E1" && nudges[0].audience === "claims_or_hsse_team");
  const text = JSON.stringify(nudges[0]).toLowerCase();
  ok("P38-09 a nudge carries functional content only, no clinical field", A.CLINICAL_FIELDS.every(c => text.indexOf(c) === -1));
  ok("P38-09 a zero-day threshold is honored, not overridden to the default", A.computeNudges([{ worker_id: "E1", last_checkin_at: "2026-07-23T00:00:00Z" }], "2026-07-23T12:00:00Z", 0).length === 1);
}

// P38-14 event metering
{
  const m = A.countBillableEvents([
    { case_id: "C1", injury_category: "strain_or_sprain", division: "Security", province: "ON", entered_coordination_at: "2026-07-23" },
    { case_id: "C1", injury_category: "strain_or_sprain", division: "Security", province: "ON", entered_coordination_at: "2026-07-23" },
    { case_id: "C2", injury_category: "burn", division: "Security", province: "ON", entered_coordination_at: "2026-07-23" },
    { case_id: "C3", injury_category: "repetitive_motion", division: "Cash", province: "ON", entered_coordination_at: "2026-07-23" },
    { case_id: "C4", injury_category: "repetitive_motion", division: "Security", province: "ON", entered_coordination_at: null },
    { case_id: "C5", injury_category: "repetitive_motion", division: "Security", province: "ON", entered_coordination_at: "2026-07-24" },
  ], SCOPE, DIVS);
  ok("P38-14 event metering counts eligible in-scope coordinated cases once each", m.ok === true && m.count === 2);
  ok("P38-14 an invalid scope refuses the count", A.countBillableEvents([], { province: "AB" }, DIVS).ok === false);
  // order-independence: a case whose first row is not yet coordinated still counts when a later row coordinates
  const ordered = A.countBillableEvents([
    { case_id: "D1", injury_category: "repetitive_motion", division: "Security", province: "ON", entered_coordination_at: null },
    { case_id: "D1", injury_category: "repetitive_motion", division: "Security", province: "ON", entered_coordination_at: "2026-07-25" },
  ], SCOPE, DIVS);
  ok("P38-14 a case counts once if any of its rows qualifies, order-independent", ordered.ok === true && ordered.count === 1);
}

console.log("\n38a module suite: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
