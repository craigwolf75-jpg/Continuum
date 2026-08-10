/* Continuum Prompt 39: functional measurement seed generator. Reads the reviewed
   source functional_measurement.data.mjs and emits 012_seed_functional_measurement.sql
   (the eight internal restriction codes and the per form axis map). Apply after
   011_migration_functional_measurement_model.sql. Validates the source shape, checks the
   axis map against the Section 4.4 board matrix invariants, and fails loudly writing
   nothing on any violation. No interpretation, a faithful mirror. No dashes anywhere.

   Run: node clinical/db/functionalmeasurementgen.mjs */

import { writeFileSync } from "node:fs";
import { RESTRICTION_CODES, AXIS_MAP, SOURCE_VERSION } from "./functional_measurement.data.mjs";

const OUT = new URL("./012_seed_functional_measurement.sql", import.meta.url);
const q = (v) => v === null || v === undefined ? "null" : "'" + String(v).replace(/'/g, "''") + "'";

const CODE_SETS = ["basic", "extended", "conditional", "able_unable_only", "weight", "environment"];
const QTYS = ["none", "hours", "weight"];
const errors = [];

// -- validate the eight restriction codes -----------------------------------
if (RESTRICTION_CODES.length !== 8) errors.push("expected 8 internal restriction codes, got " + RESTRICTION_CODES.length);
const seenCode = new Set();
RESTRICTION_CODES.forEach((r, i) => {
  const at = "restriction[" + i + "] " + (r.code || "?");
  if (!r.code) errors.push(at + ": missing code");
  if (!r.label) errors.push(at + ": missing label");
  if (!r.free_text_phrase) errors.push(at + ": missing free_text_phrase");
  if (r.free_text_phrase && r.free_text_phrase.length > 200) errors.push(at + ": free_text_phrase over 200 chars");
  if (seenCode.has(r.code)) errors.push(at + ": duplicate code");
  seenCode.add(r.code);
});

// -- validate the axis map shape and uniqueness -----------------------------
const seenAxis = new Set();
AXIS_MAP.forEach((r, i) => {
  const at = "axis[" + i + "] " + (r.form_id || "?") + "/" + (r.axis || "?");
  if (!r.form_id) errors.push(at + ": missing form_id");
  if (!r.axis) errors.push(at + ": missing axis");
  if (!r.ui_mapping) errors.push(at + ": missing ui_mapping");
  if (!CODE_SETS.includes(r.code_set)) errors.push(at + ": bad code_set " + JSON.stringify(r.code_set));
  if (!QTYS.includes(r.quantity_kind)) errors.push(at + ": bad quantity_kind " + JSON.stringify(r.quantity_kind));
  if (typeof r.display_order !== "number") errors.push(at + ": display_order must be a number");
  // a real board code list name is present iff the set is basic, extended or weight.
  const wantsList = ["basic", "extended", "weight"].includes(r.code_set);
  if (wantsList && !r.code_list_name) errors.push(at + ": code_set " + r.code_set + " requires a code_list_name");
  if (!wantsList && r.code_list_name) errors.push(at + ": code_set " + r.code_set + " must not carry a code_list_name");
  const key = r.form_id + "|" + r.axis;
  if (seenAxis.has(key)) errors.push(at + ": duplicate (form_id, axis)");
  seenAxis.add(key);
});

// -- Section 4.4 matrix invariants (the ground truth resolve_axes must reproduce) ---
const byForm = new Map();
for (const r of AXIS_MAP) { if (!byForm.has(r.form_id)) byForm.set(r.form_id, []); byForm.get(r.form_id).push(r); }
const axisSet = (f) => new Set((byForm.get(f) || []).map((r) => r.axis));
const has = (f, a) => axisSet(f).has(a);
const REQUIRED_FORMS = ["C050E", "C151", "C050S", "C151S"];
for (const f of REQUIRED_FORMS) if (!byForm.has(f)) errors.push("form " + f + " is absent from the axis map");
// single field forms carry lifting_general and overhead_reaching, not the OIS dimensions.
for (const f of ["C050E", "C151"]) {
  if (!has(f, "lifting_general")) errors.push(f + ": must carry lifting_general (criterion 2)");
  if (!has(f, "overhead_reaching")) errors.push(f + ": must carry overhead_reaching (criterion 2)");
  for (const a of ["lifting_floor_to_waist", "grasping_left", "reaching_left_above", "environment"])
    if (has(f, a)) errors.push(f + ": must NOT carry " + a + " (criterion 2)");
  if (axisSet(f).size !== 11) errors.push(f + ": expected 11 axes, got " + axisSet(f).size);
}
// OIS forms carry the three planes, four sided reaching, grasping per hand, environment.
for (const f of ["C050S", "C151S"]) {
  for (const a of ["lifting_floor_to_waist", "lifting_waist_to_shoulder", "lifting_above_shoulder",
    "reaching_left_above", "reaching_left_below", "reaching_right_above", "reaching_right_below",
    "grasping_left", "grasping_right", "environment"])
    if (!has(f, a)) errors.push(f + ": must carry " + a + " (criterion 3)");
  if (has(f, "lifting_general") || has(f, "overhead_reaching")) errors.push(f + ": must NOT carry lifting_general or overhead_reaching (criterion 3)");
  if (axisSet(f).size !== 19) errors.push(f + ": expected 19 axes, got " + axisSet(f).size);
}
// the C151S posture group and pushing are conditional (39A Section 2.4); on C050S extended.
for (const a of ["bending", "twisting", "kneeling_squatting", "climbing", "pushing_pulling"]) {
  const s050 = (byForm.get("C050S") || []).find((r) => r.axis === a);
  const s151 = (byForm.get("C151S") || []).find((r) => r.axis === a);
  if (s050 && s050.code_set !== "extended") errors.push("C050S/" + a + ": expected extended, got " + s050.code_set);
  if (s151 && s151.code_set !== "conditional") errors.push("C151S/" + a + ": expected conditional, got " + s151.code_set);
}

if (errors.length) { console.error("SOURCE INVALID, nothing written:\n  " + errors.join("\n  ")); process.exit(1); }

// -- emit -------------------------------------------------------------------
const out = [];
out.push("-- Continuum Prompt 39: functional measurement seed (internal restriction codes + axis map).");
out.push("-- GENERATED by clinical/db/functionalmeasurementgen.mjs from functional_measurement.data.mjs.");
out.push("-- Apply AFTER 011_migration_functional_measurement_model.sql. One transaction, idempotent.");
out.push("-- The axis map is the Section 4.4 board matrix (39A refined) that resolve_axes reads. No dashes.");
out.push("");
out.push("begin;");
out.push("");
out.push("insert into clinical.internal_restriction_code (code, label, free_text_phrase) values");
out.push(RESTRICTION_CODES.map((r) => "  (" + [q(r.code), q(r.label), q(r.free_text_phrase)].join(",") + ")").join(",\n"));
out.push("on conflict (code) do update");
out.push("  set label = excluded.label, free_text_phrase = excluded.free_text_phrase, active = true;");
out.push("");
out.push("insert into clinical.functional_axis_map (form_id, axis, ui_mapping, code_list_name, code_set, quantity_kind, display_order, source_version) values");
out.push(AXIS_MAP.map((r) => "  (" + [
  q(r.form_id), q(r.axis), q(r.ui_mapping), q(r.code_list_name),
  q(r.code_set), q(r.quantity_kind), String(r.display_order), q(SOURCE_VERSION)
].join(",") + ")").join(",\n"));
out.push("on conflict (form_id, axis) do update");
out.push("  set ui_mapping = excluded.ui_mapping, code_list_name = excluded.code_list_name,");
out.push("      code_set = excluded.code_set, quantity_kind = excluded.quantity_kind,");
out.push("      display_order = excluded.display_order, source_version = excluded.source_version;");
out.push("");
out.push("commit;");
out.push("");
writeFileSync(OUT, out.join("\n"), "utf8");

// -- report -----------------------------------------------------------------
console.log("== functional measurement seed generation ==");
console.log("output: " + OUT.pathname.replace(/^\//, ""));
console.log("internal restriction codes: " + RESTRICTION_CODES.length);
console.log("axis map rows: " + AXIS_MAP.length);
for (const f of REQUIRED_FORMS) console.log("  " + f + ": " + axisSet(f).size + " axes");
console.log("Section 4.4 matrix invariants: all pass");
