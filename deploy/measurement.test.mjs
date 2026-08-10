/* Continuum Prompt 41 SCR-MEAS-01 suite. Proves the measurement screen behaviour spine
   against the prompt's non negotiable rules and the Section 9 acceptance criteria that
   live at this layer. Feeds the REAL resolve_axes output from Prompt 39
   (clinical/engine/measurement.mjs) into the screen model, so the screen is proven to
   build from actual axis configuration, not a fixture. No dashes anywhere.

   Server side criteria (the sign endpoint bypassed, the network partition, the paint
   budget, cross practitioner isolation) are NOT provable here: they need the physician
   platform foundation and the server, which are out of scope for this screen. They are
   listed in the delivery report as pending, never silently skipped. */

import { AXIS_MAP } from "../clinical/db/functional_measurement.data.mjs";
import { resolveAxes, indexAxisMap } from "../clinical/engine/measurement.mjs";
import {
  buildScreenModel, createState, answerAxis, skipAxis, resetAxis,
  unassessedAxes, notAssessedCount, markAllRemainingAsAble, provenanceAudit,
  signatureBlockers, bannedTermLint, BANNED_TERMS,
} from "./measurement-screen.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const idx = indexAxisMap(AXIS_MAP);
const specsOf = (form) => resolveAxes(form, idx);

// -- the screen builds from real resolve_axes output (Section 3.2) --------------
const mS = buildScreenModel("C050S", specsOf("C050S"));
const mE = buildScreenModel("C050E", specsOf("C050E"));
ok("C050S model builds 18 axis rows (19 axes minus environment)", mS.focused.length + mS.other.length === 18);
ok("C050S model flags environment as a Zone 3 exception", mS.hasEnvironment && mS.exceptions.some((e) => e.key === "environment"));
ok("C050E model has no environment exception", !mE.hasEnvironment && !mE.exceptions.some((e) => e.key === "environment"));
ok("C050E model builds 11 axis rows (no environment axis present)", mE.focused.length + mE.other.length === 11);
ok("without a relevance map every axis is focused (safe default)", mS.other.length === 0 && mS.focused.length === 18);
ok("a relevance map moves the rest to Zone 2", (() => {
  const m = buildScreenModel("C050S", specsOf("C050S"), { relevantAxes: ["sitting", "standing"] });
  return m.focused.length === 2 && m.other.length === 16;
})());
ok("an able or unable only axis offers no Limited option", (() => {
  const row = mS.focused.find((r) => r.axis === "reaching_left_above");
  return row && !row.options.includes("limited") && row.options.includes("able") && row.options.includes("unable");
})());
ok("a weight axis offers Limited (reveals a quantity)", mS.focused.find((r) => r.axis === "lifting_floor_to_waist").options.includes("limited"));
ok("Zone 3 exceptions cover pain, medication, hospitalisation and work hours", ["work_hours", "self_reported_pain", "medication_side_effects", "hospitalized"].every((k) => mS.exceptions.some((e) => e.key === k)));

// -- Section 3.1 non negotiable: nothing defaults to Able ------------------------
const st = createState(specsOf("C050S"));
ok("fresh state has one entry per axis row (18)", st.size === 18);
ok("every axis starts unanswered, no capability, no source", [...st.values()].every((r) => r.answered === false && r.skipped === false && r.capability === null && r.source === null));
ok("acceptance criterion 1: no axis carries a value on a fresh state", provenanceAudit(st).length === 0);
ok("every axis is unassessed on a fresh state", unassessedAxes(st).length === 18);

// -- answering, skipping, resetting ---------------------------------------------
answerAxis(st, "sitting", "limited", 4);
ok("a limited answer keeps its quantity and a human measured source", (() => { const r = st.get("sitting"); return r.answered && r.capability === "limited" && r.quantity === 4 && r.source === "measured" && r.provenance === "human"; })());
answerAxis(st, "standing", "able");
ok("an able answer clears any quantity", st.get("standing").quantity === null);
skipAxis(st, "walking", "not relevant to this injury");
ok("a skip records its reason and clears capability", (() => { const r = st.get("walking"); return r.skipped && r.skip_reason === "not relevant to this injury" && r.capability === null; })());
ok("a skip with no reason is refused", (() => { try { skipAxis(st, "driving", ""); return false; } catch { return true; } })());
ok("a graded Limited on an able or unable only axis is refused (raise to a human)", (() => { try { answerAxis(st, "reaching_left_above", "limited", 1); return false; } catch { return true; } })());
resetAxis(st, "sitting");
ok("reset returns an axis to unanswered", (() => { const r = st.get("sitting"); return !r.answered && r.capability === null && r.source === null; })());
ok("the unassessed count is live", notAssessedCount(st, ["sitting", "standing", "walking"]) === 1); // standing answered, walking skipped, sitting reset

// -- acceptance criterion 1 holds after human answers ---------------------------
ok("acceptance criterion 1: still no system authored value after human answers", provenanceAudit(st).length === 0);

// -- acceptance criterion 2: Mark all remaining as Able --------------------------
const preview = markAllRemainingAsAble(st);
ok("without confirmation it makes no change and names the count and axes", preview.requiresConfirmation && preview.applied === false && preview.count === unassessedAxes(st).length && Array.isArray(preview.axes));
ok("without confirmation no capability was written", provenanceAudit(st).length === 0 && st.get("sitting").capability === null);
const before = { standingCap: st.get("standing").capability, standingSrc: st.get("standing").source, walkingSkipped: st.get("walking").skipped };
const applied = markAllRemainingAsAble(st, { confirmed: true });
ok("with confirmation every remaining axis is Able with source bulk_marked_able, provenance human", applied.applied && applied.axes.every((a) => { const r = st.get(a); return r.capability === "able" && r.source === "bulk_marked_able" && r.provenance === "human"; }));
ok("the accelerator never overwrites an already answered axis", st.get("standing").capability === before.standingCap && st.get("standing").source === before.standingSrc);
ok("the accelerator never un skips a skipped axis", st.get("walking").skipped === before.walkingSkipped && st.get("walking").capability === null);
ok("acceptance criterion 1 still holds: every value is human sourced", provenanceAudit(st).length === 0);
ok("after Mark all remaining, no axis is unassessed", unassessedAxes(st).length === 0);

// -- Section 7 signature blockers -----------------------------------------------
const st2 = createState(specsOf("C050E"));
ok("a fresh screen blocks signature and lists the axes by name", (() => { const b = signatureBlockers(st2); return b.blocked && b.blockers[0].id === "AXIS-UNASSESSED" && b.blockers[0].axes.length === 11; })());
for (const a of unassessedAxes(st2)) answerAxis(st2, a, "able");
ok("once every axis is answered, signature is not blocked", signatureBlockers(st2).blocked === false);

// -- Section 0A.3 banned vocabulary ---------------------------------------------
ok("the lint catches AI decided", bannedTermLint("this field was AI decided for you").length === 1);
ok("the lint catches recommended restriction and suggested diagnosis", bannedTermLint("recommended restriction and suggested diagnosis").length === 2);
ok("the lint catches the word smart but not smarter", bannedTermLint("smart default").length === 1 && bannedTermLint("a smarter worker").length === 0);
ok("allowed framing is clean", bannedTermLint("proposed for your review, drafted, not yet reviewed, worker reported").length === 0);
ok("BANNED_TERMS carries the six terms", BANNED_TERMS.length === 6);

// -- every copy string this module emits is clean of banned terms ---------------
const copySamples = [
  ...mS.exceptions.map((e) => e.label),
  "other axes not assessed. Review.", "Mark all remaining as Able",
  "Work hours per day", "Worker reported pain", "Medication side effects", "Hospitalisation",
];
ok("no copy string in the screen model contains a banned term", copySamples.every((c) => bannedTermLint(c).length === 0));

console.log("\nmeasurement screen suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
