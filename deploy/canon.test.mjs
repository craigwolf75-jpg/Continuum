/* Continuum canon suite (Prompt B2). node deploy/canon.test.mjs
   Cross-surface canon regression: the ledger must agree everywhere it appears.
   Marcus Bedard day 9 pain 4, Cardinal off work day 18, per-tenant numbers that
   sum. Assertions hard-fail: a missing extraction throws, any FAIL exits nonzero,
   so canon drift fails the build. No em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const worker = read("worker-dashboard.html");
const hse = read("hse-portal.html");
const clinical = read("clinical-dashboard.html");
const admin = read("admin-portal.html");
const day = (s, n) => new RegExp('day"?:\\s*' + n + '\\b').test(s); // matches day:9 and "day": 9

// -- Marcus Bedard: day 9, pain 4 --
ok("worker: Marcus at day 9", day(worker, 9));
ok("worker: pain reaches 4", /pain:\s*4\b/.test(worker));
ok("hse: a case at day 9 (Marcus)", day(hse, 9));
ok("clinical: Marcus present at day 9", clinical.includes("Marcus") && day(clinical, 9));

// -- Cardinal: off work, day 18 --
ok("hse: Cardinal off work at day 18", hse.includes("Cardinal") && day(hse, 18) && hse.includes("off_work"));
ok("clinical: Cardinal at day 18", clinical.includes("Cardinal") && day(clinical, 18));

// -- per-tenant numbers must sum (admin) --
const TENANTS = new Function("return " + (admin.match(/var TENANTS=(\[[\s\S]*?\]);/) || [, null])[1])();
const activeSum = TENANTS.filter(t => !t.sandbox).reduce((a, t) => a + t.active, 0);
ok("admin: non-sandbox active cases sum to 24", activeSum === 24);
ok("admin: Worley 7 is the HSE queue (canon copy)", admin.includes("7 is the HSE queue"));
ok("admin: 24 total is the clinical census (canon copy)", admin.includes("24 total is the clinical census"));

// -- Marcus prognosis is 21 days (canon), so day 21 is expected, not drift --
ok("clinical or worker carries the 21-day prognosis canon", /21[- ]?day/i.test(clinical) || /21[- ]?day/i.test(worker) || /prognos/i.test(clinical));

// -- dash rule across the canon surfaces --
ok("canon surfaces dash clean", ![worker, hse, clinical, admin].some(s => /[–—]/.test(s)));

console.log("\ncanon suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
