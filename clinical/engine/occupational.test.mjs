/* Continuum Prompt 43a gate 3 suite. Proves the duty match runs green on the SYNTHETIC
   fixture exercising every verdict path (safe, conditional, excluded, unmapped_demand),
   that no raw measurement leaks (criterion 2) and no profile publishes nothing
   (criterion 3), and that the publish guard REFUSES a synthetic dataset unless explicitly
   allowed, so no invented canon row ever reaches an employer. No dashes anywhere. */

import { SYNTH_POSITIONS, SYNTHETIC } from "../db/occupational_synth.data.mjs";
import { publishDutyMatch, isSyntheticDataset, assertCanonicalForPublish, findJobProfile } from "./occupational.mjs";
import { capacityFromMeasurement } from "./dutymatch.mjs";
import { rawMeasurementInPayload } from "./employer_schema.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const dataset = { SYNTHETIC, SYNTH_POSITIONS };

// -- fixture integrity: everything is SYNTH prefixed, nothing can pose as canon --------
ok("the fixture is flagged synthetic", SYNTHETIC === true);
ok("every position and duty id is SYNTH prefixed", SYNTH_POSITIONS.every((p) => /^SYNTH-POS-/.test(p.position_id) && p.duties.every((d) => /^SYNTH-DUTY-/.test(d.duty_id))));
ok("isSyntheticDataset recognises the fixture", isSyntheticDataset(dataset) === true);
ok("a canonical dataset is not flagged synthetic", isSyntheticDataset({ positions: [{ position_id: "CANON-1", title: "X", duties: [] }] }) === false);

// -- the publish guard (gate 3): synthetic refused unless explicitly allowed -----------
ok("publishing against the synthetic dataset is refused without an override", (() => {
  try { publishDutyMatch(dataset, "Gatehouse Officer", {}); return false; }
  catch (e) { return e.code === "SYNTHETIC-NOT-AUTHORIZED"; }
})());
ok("a canonical dataset publishes without an override", (() => {
  const canon = { positions: [{ position_id: "CANON-1", title: "Desk", duties: [{ duty_id: "C1", duty_name: "Desk work", demands: [{ axis: "sitting", kind: "hours", required: 8 }] }] }] };
  return publishDutyMatch(canon, "Desk", {}).published === true;
})());
ok("assertCanonicalForPublish throws on synthetic, passes with allowSynthetic", (() => {
  let threw = false; try { assertCanonicalForPublish(dataset); } catch { threw = true; }
  return threw && assertCanonicalForPublish(dataset, { allowSynthetic: true }) === true;
})());

// -- the worker: overhead reaching Unable, lifting Limited (band derived from 8 kg = 5) --
const cap = capacityFromMeasurement(8); // LIMITED, 5 kg (criterion 9)
ok("criterion 9: the lifting capacity is the 5 kg band, not the raw 8 kg", cap.band === "LIMITED" && cap.capacityKg === 5);
const restriction = {
  overhead_reaching: { capability: "unable" },
  lifting_floor_to_waist: { capability: "limited", quantity_kind: "weight", capacityKg: cap.capacityKg },
};

// -- Gatehouse Officer: every duty rates the restricted axes as not stressed => safe ---
const gate = publishDutyMatch(dataset, "Gatehouse Officer", restriction, { allowSynthetic: true });
ok("Gatehouse Officer publishes and every duty is safe", gate.published && gate.summary.safe === gate.lines.length && gate.summary.safe === 3);

// -- Warehouse Handler: over band excluded, within band conditional, overhead excluded --
const wh = publishDutyMatch(dataset, "Warehouse Handler", restriction, { allowSynthetic: true });
ok("Warehouse floor to waist stocking (18 kg) is excluded, above the 5 kg band", wh.lines.find((l) => l.duty_name === "Floor to waist stocking").verdict === "excluded");
ok("Warehouse light bin sorting (3 kg) is conditional, within the band", wh.lines.find((l) => l.duty_name === "Light bin sorting").verdict === "conditional");
ok("Warehouse overhead shelf loading is excluded (overhead reaching)", wh.lines.find((l) => l.duty_name === "Overhead shelf loading").verdict === "excluded");

// -- Mobile Patrol: yard patrol unmapped (restricted axes unrated), climb excluded -----
const mp = publishDutyMatch(dataset, "Mobile Patrol", restriction, { allowSynthetic: true });
ok("criterion 4: yard foot patrol is conditional with unmapped_demand (restricted axes not rated)", (() => { const l = mp.lines.find((x) => x.duty_name === "Yard foot patrol"); return l.verdict === "conditional" && l.unmapped_demand === true; })());
ok("perimeter climb inspection is excluded (overhead reaching)", mp.lines.find((l) => l.duty_name === "Perimeter climb inspection").verdict === "excluded");

// -- all four verdict paths fire across the synthetic fixture --------------------------
ok("all four verdict paths fire on the fixture (safe, conditional, excluded, unmapped_demand)", (() => {
  const allLines = [gate, wh, mp].flatMap((r) => r.lines);
  return allLines.some((l) => l.verdict === "safe") && allLines.some((l) => l.verdict === "excluded") &&
    allLines.some((l) => l.verdict === "conditional" && !l.unmapped_demand) && allLines.some((l) => l.unmapped_demand === true);
})());

// -- criterion 2: no raw measurement in any published payload -------------------------
ok("criterion 2: no published payload carries a raw measurement", [gate, wh, mp].every((r) => rawMeasurementInPayload(r).length === 0));
ok("no verdict reason leaks a number", [gate, wh, mp].every((r) => r.lines.every((l) => !/\d/.test((l.excluded_because || "") + (l.condition_text || "")))));

// -- criterion 3: no profile for the worker's title publishes nothing -----------------
ok("criterion 3: an unknown job title publishes nothing and routes to the coordinator", (() => { const r = publishDutyMatch(dataset, "Astronaut", restriction, { allowSynthetic: true }); return r.published === false && r.reason === "no-job-profile"; })());
ok("findJobProfile is case insensitive and returns null for an unknown title", findJobProfile(SYNTH_POSITIONS, "gatehouse officer") !== null && findJobProfile(SYNTH_POSITIONS, "nope") === null);

console.log("\noccupational (synthetic) suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
