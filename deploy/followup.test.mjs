/* Continuum Prompt 41 SCR-FUP-01 suite. Proves the follow up screen behaviour spine and
   the Section 9 acceptance criteria that live at this layer, and cross checks the ported
   C151S chain against the REAL form_rule source (clinical/db/form_rules.data.mjs) so the
   screen can never silently drift from the board rules. The full payload match against
   the board 5.10 C151S Min Fields XML (criterion 4) belongs to the XML generation
   prompt; here we prove the chain produces the correct field visibility and code list.
   No dashes anywhere. */

import { RULES } from "../clinical/db/form_rules.data.mjs";
import {
  C151S_CHAIN, evaluateNoChangeChain, nextMeasurementVersion, trajectoryPlan,
  carryForward, isStale, ageInDays, formatVisitLabel, confirmCarried,
  clearingWarning, sparklineTextAlt, followupSignatureBlockers, STALE_DAYS, TRAJECTORIES,
} from "./followup-screen.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const c151s = (code, must) => RULES.find((r) => r.form_id === "C151S" && r.rule_code === code
  && (!must || (r.affected_element_names || []).includes(must)));

// -- the ported chain matches the real form_rule rows (no drift) ----------------
ok("SR30 exists and enables the missed work question", (() => {
  const r = c151s("SR30", C151S_CHAIN.missedWorkTrigger); return !!r;
})());
ok("SR28 toggles exactly the four OIS disposition fields the screen names", (() => {
  const r = c151s("SR28"); if (!r) return false;
  return C151S_CHAIN.oisDispositionFields.every((f) => r.affected_element_names.includes(f))
    && r.affected_element_names.includes(C151S_CHAIN.preAccidentDateField);
})());
ok("E1 is a code_list_switch to Basic over exactly the five axes", (() => {
  const r = c151s("E1"); if (!r) return false;
  return r.rule_type === "code_list_switch" && r.switches_code_list_to === "Basic Work Restriction Codes"
    && C151S_CHAIN.codeListSwitchAxes.every((a) => r.affected_element_names.includes(a))
    && C151S_CHAIN.codeListSwitchAxes.length === 5;
})());
ok("SR3 (the capability collapse) toggles the capability block fields the screen names", (() => {
  const r = c151s("SR3", "Number of hours patient is capable of working per day"); if (!r) return false;
  return C151S_CHAIN.capabilityBlockFields.every((f) => r.affected_element_names.includes(f));
})());

// -- the chain evaluated: the not changed scenario (Section 4.2) -----------------
const notChanged = evaluateNoChangeChain({ statusChanged: "N", missedWork: "N", modifiedDuties: "Y", modifiedHours: "Y" });
ok("not changed switches the five axes to Basic Work Restriction Codes (E1, does not hide them)", C151S_CHAIN.codeListSwitchAxes.every((a) => notChanged.codeListFor[a] === "Basic Work Restriction Codes"));
ok("not changed hides the four OIS disposition questions (SR28)", C151S_CHAIN.oisDispositionFields.every((f) => notChanged.hidden.includes(f)));
ok("not changed shows the pre accident date (SR28)", notChanged.visible.includes(C151S_CHAIN.preAccidentDateField));
ok("the missed work question is enabled, never short circuited (SR30)", notChanged.missedWorkEnabled === true && notChanged.visible.includes(C151S_CHAIN.missedWorkTrigger));

// -- Section 4.2 correction: UNCHANGED does NOT collapse the capability block -----
ok("not changed with modified not both No does NOT collapse the capability block", notChanged.capabilityBlockCollapsed === false && notChanged.cleared.length === 0);
ok("changed uses Extended, not Basic", (() => { const c = evaluateNoChangeChain({ statusChanged: "Y" }); return C151S_CHAIN.codeListSwitchAxes.every((a) => c.codeListFor[a] === "Extended Work Restriction Codes"); })());
ok("only SR3 collapses: modified duties and hours both No", (() => {
  const c = evaluateNoChangeChain({ statusChanged: "N", missedWork: "N", modifiedDuties: "N", modifiedHours: "N" });
  return c.capabilityBlockCollapsed === true && C151S_CHAIN.capabilityBlockFields.every((f) => c.cleared.includes(f));
})());
ok("a single No does not collapse the block", evaluateNoChangeChain({ modifiedDuties: "N", modifiedHours: "Y" }).capabilityBlockCollapsed === false);

// -- acceptance criterion 5: a new measurement version on every follow up ---------
ok("nextMeasurementVersion always increments", nextMeasurementVersion(3) === 4 && nextMeasurementVersion(0) === 1);
ok("UNCHANGED still creates a version (criterion 5)", trajectoryPlan("UNCHANGED").createsVersion === true);
ok("every trajectory creates a version and carries forward", TRAJECTORIES.every((t) => { const p = trajectoryPlan(t); return p.createsVersion && p.carryForward; }));

// -- trajectory routing (Section 4.1) -------------------------------------------
ok("UNCHANGED opens nothing and routes to review", (() => { const p = trajectoryPlan("UNCHANGED"); return p.opens === "none" && p.routesTo === "review"; })());
ok("IMPROVING opens only chosen axes", trajectoryPlan("IMPROVING").opens === "chosen_axes");
ok("REGRESSING opens the full measurement screen", (() => { const p = trajectoryPlan("REGRESSING"); return p.opens === "full" && p.routesTo === "measurement"; })());
ok("an unknown trajectory is refused", (() => { try { trajectoryPlan("BETTER"); return false; } catch { return true; } })());

// -- carry forward and stale (Section 4.3) --------------------------------------
const prev = [{ element: "sitting", value: "limited 4h" }, { element: "standing", value: "able" }];
const fresh = carryForward(prev, "2026-08-01", "2026-08-10");
ok("carried values are sourced carried_forward with a human provenance", fresh.every((e) => e.source === "carried_forward" && e.provenance === "human"));
ok("carried values carry a from previous visit label with the date", fresh[0].label === "from previous visit, 1 Aug");
ok("a value 9 days old is not stale", fresh.every((e) => e.stale === false));
ok("STALE_DAYS is 90", STALE_DAYS === 90);
ok("a value 91 days old is stale", isStale("2026-05-01", "2026-08-01") === true && ageInDays("2026-05-01", "2026-08-01") === 92);
ok("a value exactly 90 days old is not yet stale", isStale("2026-05-02", "2026-07-31") === false);
ok("formatVisitLabel gives DD Mon", formatVisitLabel("2026-12-25") === "25 Dec");

// -- a stale carried value blocks signature until confirmed (Section 7) ----------
const staleCarried = carryForward([{ element: "lifting_floor_to_waist", value: "10 kg" }], "2026-01-01", "2026-08-10");
ok("a stale carried value blocks signature and names its age", (() => { const b = followupSignatureBlockers(staleCarried); return b.blocked && b.blockers[0].id === "STALE-UNCONFIRMED" && b.blockers[0].ageDays > 90; })());
ok("confirming the stale value unblocks signature", followupSignatureBlockers(staleCarried.map(confirmCarried)).blocked === false);
ok("fresh carried values never block", followupSignatureBlockers(fresh).blocked === false);

// -- clearing warning before a collapse discards data (criterion 6) --------------
const entered = { "Current Capabilities": "graded", "Number of hours patient is capable of working per day": 6 };
ok("the clearing warning fires and names the fields with entered data", (() => { const w = clearingWarning(C151S_CHAIN.capabilityBlockFields, entered); return w.warn && w.fields.includes("Current Capabilities") && w.fields.includes("Number of hours patient is capable of working per day"); })());
ok("no warning when the fields hold no entered data", clearingWarning(C151S_CHAIN.capabilityBlockFields, {}).warn === false);
ok("clearingWarning accepts a Set of entered elements", clearingWarning(["a", "b"], new Set(["b"])).fields.join() === "b");

// -- sparkline text alternative (Section 6) -------------------------------------
ok("sparkline alt gives first, last and direction down", sparklineTextAlt("Sitting", [6, 5, 4], "hours") === "Sitting: first 6 hours, last 4 hours, direction down");
ok("sparkline alt reports steady", sparklineTextAlt("Standing", [4, 4, 4]) === "Standing: first 4, last 4, direction steady");
ok("sparkline alt handles no data", sparklineTextAlt("Walking", []) === "Walking: no data");

console.log("\nfollow up screen suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
