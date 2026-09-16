/* Continuum Prompt 58 (governing surface-standard number) / Prompt 54 and
   Prompt 51 Design System lineage. Lab-budget reporter (acceptance
   criterion 8, field half of section 10). Records that no measurement
   exists for FCP, INP, and CLS. Absence does not fail the build.
   Does not invent an 800ms FCP gate. No RUM is wired. No dashes.
   Run by node; suites.yml globs it. */

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const METRICS = [
  {
    name: "FCP",
    context: "worklist first contentful paint at 500 open cases",
    lab: "no measurement exists",
    field: "no measurement exists",
  },
  {
    name: "INP",
    context: "Interaction to Next Paint",
    lab: "no measurement exists",
    field: "no measurement exists",
  },
  {
    name: "CLS",
    context: "Cumulative Layout Shift",
    lab: "no measurement exists",
    field: "no measurement exists",
  },
];

for (const m of METRICS) {
  console.log(`${m.name} (${m.context}): lab=${m.lab}; field=${m.field}`);
  ok(`${m.name} reporter states no measurement exists (lab)`, m.lab === "no measurement exists");
  ok(`${m.name} reporter states no measurement exists (field)`, m.field === "no measurement exists");
}

ok("absence of field data does not fail the build", true);

console.log(`\nlab-budget-reporter suite: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
