/* Continuum Prompt 39 criterion 13: network failure during entry loses no data.
   Each field write is a snapshot. A simulated partition after field N recovers
   fields 1 through N. No dashes anywhere. */

import { createDraftStore, simulatePartition } from "./measurement_draft.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const fields = [
  { key: "sitting", value: "able" },
  { key: "standing", value: "limited" },
  { key: "walking", value: "unable" },
  { key: "bending", value: "able" },
  { key: "lifting_general", value: { capability: "limited", measured_weight_kg: 8 } },
];

ok("an empty store recovers no fields", Object.keys(createDraftStore().recover().fields).length === 0);
ok("a write is visible on recover", createDraftStore().writeField("sitting", "able").fields.sitting === "able");

for (let i = 0; i < fields.length; i++) {
  const recovered = simulatePartition(fields, i);
  const expectedKeys = fields.slice(0, i + 1).map((f) => f.key);
  const lostKeys = fields.slice(i + 1).map((f) => f.key);
  ok("partition after field " + fields[i].key + " keeps prior writes", expectedKeys.every((k) => Object.prototype.hasOwnProperty.call(recovered.fields, k)));
  ok("partition after field " + fields[i].key + " loses later writes", lostKeys.every((k) => !Object.prototype.hasOwnProperty.call(recovered.fields, k)));
}

ok("writes increment the snapshot counter", (() => {
  const s = createDraftStore();
  s.writeField("a", 1);
  s.writeField("b", 2);
  return s.recover().writes === 2 && s.recover().fields.a === 1 && s.recover().fields.b === 2;
})());

console.log("\nmeasurement draft suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
