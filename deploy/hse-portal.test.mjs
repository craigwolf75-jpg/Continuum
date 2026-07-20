/* Prompt 23 HSE portal suite. No dependencies. node deploy/hse-portal.test.mjs
 * Asserts the wired analytics + step-up event + queue sort against the source. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, "hse-portal.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// 1. FTD computed from seed truth: {m:2,a:1,d:2,e:2} averages to 1.8, not hardcoded
const ftdMatch = html.match(/var FTD=\{([^}]*)\}/);
ok("FTD seed present", !!ftdMatch);
if (ftdMatch) {
  const vals = ftdMatch[1].split(",").map(p => Number(p.split(":")[1]));
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  ok("FTD gaps are 2,1,2,2", vals.join(",") === "2,1,2,2");
  ok("FTD average renders as 1.8", avg.toFixed(1) === "1.8");
}
ok("analytics no longer hardcodes 1.8 days literal", !/<div class="n">1\.8 days<\/div>/.test(html));
ok("analytics renders ftdAvg", /ftdAvg\(\)\.toFixed\(1\)/.test(html));

// 2. Step-up is an event stream, seeded with one, fired on qualifying assignment
ok("step-up seeded once", /stepUps:\[\{worker:"Okafor"/.test(html));
ok("step-up count reads the stream", /var stepUps=S\.stepUps\.length/.test(html));
ok("step-up fires only for suitable_onsite over standard_precaution",
  /S\.form\.cls==="suitable_onsite" && S\.duties\.some\(function\(d\)\{return d\.w===wid && d\.cls==="standard_precaution"/.test(html));
ok("latest step-up rendered", /Latest: '\+esc\(lastStep\.worker\)/.test(html));

// 3. Queue sort: three modes + setQSort
ok("setQSort present", /function setQSort\(m\)\{S\.qsort=m;save\(\);\}/.test(html));
ok("pain sort by latest pain descending", /qsort==="pain"\)return \(b\.pain\[b\.pain\.length-1\]\|\|0\)-\(a\.pain\[a\.pain\.length-1\]\|\|0\)/.test(html));
ok("day sort descending", /qsort==="day"\)return b\.day-a\.day/.test(html));
ok("three sort buttons", /sbtn\("attention"/.test(html) && /sbtn\("day"/.test(html) && /sbtn\("pain"/.test(html));

// 4. Regression: hazard gate still blocks assignment
ok("hazard gate intact", /if\(!S\.form\.hazard\)\{toast\("Blocked/.test(html));

// 5. Dash audit
ok("dash audit clean (no em/en dash)", !/[–—]/.test(html));

console.log("\nhse-portal suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
