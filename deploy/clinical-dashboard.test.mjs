/* Prompt 23 clinical dashboard suite. node deploy/clinical-dashboard.test.mjs */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "clinical-dashboard.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// bucket mapping is a tested function: ahead >=80, on track >=60, behind >=40, else stalled
ok("bucketOf present", /function bucketOf\(p\)\{/.test(html));
const bm = html.match(/function bucketOf\(p\)\{([^]*?)\}/);
if (bm) {
  const bucketOf = new Function("p", bm[1]);
  ok("prog 75 is ontrack (Marcus)", bucketOf({ prog: 75 }) === "ontrack");
  ok("prog 30 is stalled (Cardinal)", bucketOf({ prog: 30 }) === "stalled");
  ok("prog 90 is ahead", bucketOf({ prog: 90 }) === "ahead");
  ok("prog 50 is behind", bucketOf({ prog: 50 }) === "behind");
}

// sortable census
ok("sortW present", /function sortW\(k\)\{/.test(html));
ok("census sorts before rendering", /if\(ws\.key\)\{sorted\.sort\(function\(a,b\)/.test(html));
ok("name/pain/tenant headers clickable", html.includes("sortW(\\'name\\')") && html.includes("sortW(\\'pain\\')") && html.includes("sortW(\\'tenant\\')"));
ok("pain sort reads p.pain", /ws\.key==="pain"\)\{va=a\.pain;vb=b\.pain;\}/.test(html));

// analytics buckets navigate to filtered census
ok("bucket bar sets wfilter and opens workers", html.includes("S.wfilter=\\'"+"'+bkey+'"+"\\';S.section=\\'workers\\';save()"));
ok("workers view filters by bucket", /if\(S\.wfilter\)list=list\.filter\(function\(p\)\{return bucketOf\(p\)===S\.wfilter/.test(html));
ok("clear filter link", html.includes("S.wfilter=null;save();return false"));

// regression: transition legality table present, KPIs computed
ok("legality matrix intact", /TRANSITIONS\[p\.status\]/.test(html));
ok("dash audit clean", !/[–—]/.test(html));

console.log("\nclinical-dashboard suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
