/* Prompt 23 + Prompt 25 (Mount Olympus) admin portal suite. node deploy/admin-portal.test.mjs
   Assertions hard-fail the run: any FAIL sets a non-zero exit, and a missing
   extraction throws. This is what turned the ingest watermark defect from a
   silent pass into a caught failure. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "admin-portal.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const extract = (re, label) => { const m = html.match(re); if (!m) throw new Error("EXTRACT FAIL: " + label); return m; };

// ---- extract pure logic and seed data from the artifact ----
const olympusMerge = new Function("batch", "watermark", extract(/function olympusMerge\(batch,watermark\)\{([\s\S]*?)\n\}/, "olympusMerge")[1]);
const ROSTER = new Function("return " + extract(/var ROSTER=(\[[\s\S]*?\]);/, "ROSTER")[1])();
const TENANTS = new Function("return " + extract(/var TENANTS=(\[[\s\S]*?\]);/, "TENANTS")[1])();
const USERS = new Function("return " + extract(/var USERS=(\[[\s\S]*?\]);/, "USERS")[1])();

/* ================= Prompt 25: Mount Olympus ================= */

// -- the ingest defect: a batch whose entries are out of order, all above the
//    watermark, must ALL survive. The naive version advanced the watermark
//    mid-loop and dropped the earlier-ts entry. --
const r1 = olympusMerge([{ ts: 150, agent: "a", type: "update", msg: "x" }, { ts: 120, agent: "b", type: "update", msg: "y" }], 100);
ok("ingest: no earlier-ts entry dropped in a batch", r1.fresh.length === 2);
ok("ingest: batch sorted ascending before merge", r1.fresh[0].ts === 120 && r1.fresh[1].ts === 150);
ok("ingest: watermark advances to max after merge", r1.watermark === 150);
// idempotency
const r2 = olympusMerge([{ ts: 50 }, { ts: 80 }, { ts: 100 }], 100);
ok("ingest: entries at or below watermark not re-ingested", r2.fresh.length === 0 && r2.watermark === 100);
const r3 = olympusMerge([{ ts: 90 }, { ts: 130 }], 100);
ok("ingest: only entries above the watermark pass", r3.fresh.length === 1 && r3.fresh[0].ts === 130);

// ingest wiring: pre-merge watermark, concern vs update routing, concerns land open
ok("ingest reads the pre-merge watermark then advances after", /var res=olympusMerge\(batch,S\.olympus\.watermark\);/.test(html) && /S\.olympus\.watermark=res\.watermark;/.test(html));
ok("ingest routes concerns to concerns, status open", /if\(e\.kind==="concern"\)\{S\.olympus\.concerns\.push\(\{[^}]*status:"open"/.test(html));
ok("ingest routes updates to the feed", /else\{S\.olympus\.feed\.push\(\{/.test(html));
ok("external ingest reads the documented feed key", /localStorage\.getItem\(FEEDKEY\)/.test(html));

// roster: seven agents, Zeus gold-flagged, each with lane/status/mission
ok("roster has seven agents", ROSTER.length === 7);
ok("roster: exactly one Zeus, gold-flagged and first", ROSTER.filter(a => a.zeus).length === 1 && ROSTER[0].id === "zeus" && ROSTER[0].zeus === true);
ok("roster: the six hands all present", ["athena", "apollo", "calliope", "heracles", "hermes", "argus"].every(id => ROSTER.some(a => a.id === id)));
ok("roster: each agent has lane, status, and mission", ROSTER.every(a => a.lane && a.status && a.mission));
ok("olympus renders every roster agent", /ROSTER\.map\(function\(a\)\{/.test(html));
ok("doctrine line present on the surface", html.includes("Operational telemetry only. Case content never appears here"));

// placement
ok("olympus is a routed view", /olympus:renderOlympus/.test(html));
ok("olympus sits second in the sidebar, under Dashboard", /var NAV=\[\["dashboard","dashboard","Dashboard"\],\["olympus","bolt","Mount Olympus"\]/.test(html));
ok("olympus takes a mobile bottom-nav slot", /\["dashboard","olympus","tenants","users","billing"\]/.test(html));

// sidebar badge
ok("sidebar badge counts open concerns", /if\(n\[0\]==="olympus"\)\{var oc=olyOpen\(\)\.length;if\(oc\)badge=/.test(html));
ok("sidebar badge flags a blocking concern red", /olybadge'\+\(olyBlocking\(\)\?" blk":""\)/.test(html));
ok("open-concern count drives the badge and disappears at zero", /var oc=olyOpen\(\)\.length;if\(oc\)/.test(html) && /function olyOpen\(\)\{return.*c\.status==="open"/.test(html));

// concern lifecycle: open -> acknowledged -> resolved, each audited
ok("acknowledge moves open concern to acknowledged and audits", /function ackConcern\(ts\)\{[\s\S]*?if\(!c\|\|c\.status!=="open"\)return;c\.status="acknowledged";audit\(/.test(html));
ok("resolve moves concern to resolved and audits", /function resolveConcern\(ts\)\{[\s\S]*?c\.status="resolved";audit\(/.test(html));

// simulate + poll
ok("simulate appends to the feed key then ingests", /function simulateOlympus\(\)\{[\s\S]*?localStorage\.setItem\(FEEDKEY,JSON\.stringify\(batch\)\);[\s\S]*?ingestOlympus\(\);/.test(html));
ok("portal ingests on load and polls every five seconds", /load\(\);render\(\);ingestOlympus\(\);setInterval\(ingestOlympus,5000\);/.test(html));

// seeded SITE-12d run in charter voices + concerns
ok("seed: reflects the current work", html.includes("Framer Motion hub bundle") && html.includes("258 assertions across 11 suites") && html.includes("commit c8327dd"));
ok("seed: roster shows Athena no longer blocked", !/id:"athena"[\s\S]*?status:"blocked"/.test(html.slice(html.indexOf("var ROSTER="), html.indexOf("var OLY_BASE="))));
ok("seed: no blocking concern in the current state", !html.includes('severity:"blocking"'));
ok("seed: a resolved concern example", html.includes('status:"resolved"'));
ok("olympus seed is versioned and load re-seeds on a version change", /version:2/.test(html) && html.includes("S.olympus.version!==2"));

// keys, bridge absence, clinical absence
ok("state key unchanged (continuum_admin_v1)", html.includes('LSKEY="continuum_admin_v1"'));
ok("feed key documented (continuum_olympus_feed_v1)", html.includes('FEEDKEY="continuum_olympus_feed_v1"'));
ok("worker bridge key absent from the admin artifact", !html.includes("continuum_worker_bridge_v1"));
ok("no clinical vocabulary in the admin artifact", !/\b(pain|mobility|diagnosis|supraspinatus)\b/i.test(html));

/* ================= stale-state safety (a state saved before Olympus must not blank the portal) ================= */
ok("load migrates a stale state by seeding S.olympus", /if\(!S\.olympus.*\)S\.olympus=olympusSeed\(\)/.test(html));
ok("olyOpen guards a missing olympus", /function olyOpen\(\)\{return \(S\.olympus/.test(html));
ok("olyLast guards a missing olympus", /function olyLast\(\)\{return \(S\.olympus/.test(html));
const olyOpenFn = new Function("S", extract(/function olyOpen\(\)\{.*\}/, "olyOpen")[0] + " return olyOpen();");
ok("olyOpen returns empty and does not throw when olympus is absent", Array.isArray(olyOpenFn({ tenants: [] })) && olyOpenFn({ tenants: [] }).length === 0);

/* ================= canon KPI regression (24, 75, 16) ================= */
const realT = TENANTS.filter(t => !t.sandbox);
const activeCases = realT.reduce((a, t) => a + t.active, 0);
const completion = Math.round(realT.reduce((s, t) => s + t.active * t.completion, 0) / activeCases);
const activeUsers = USERS.filter(u => u.status === "active").length;
ok("canon KPI: active cases = 24", activeCases === 24);
ok("canon KPI: check-in completion = 75", completion === 75);
ok("canon KPI: active users = 16", activeUsers === 16);
ok("reset restores the Olympus seed", html.includes("olympus:olympusSeed()"));

/* ================= Prompt 23 regression ================= */
ok("tenant bars open Tenants", html.includes("onclick=\"go(\\'tenants\\')\""));
ok("role bars set roleFilter and open Users", html.includes("S.roleFilter=\\'" + "'+r+'" + "\\';S.section=\\'users\\';save()"));
ok("Users view filters by roleFilter", /if\(S\.roleFilter\)list=list\.filter\(function\(u\)\{return u\.role===S\.roleFilter/.test(html));
ok("role filter chips present", html.includes("S.roleFilter=\\'" + "'+r+'" + "\\';save()"));
ok("bars marked clickable", (html.match(/class="brow" style="cursor:pointer"/g) || []).length >= 2);
ok("per-tenant aggregate computed from seed", /realT\(\)\.map\(function\(t\)\{var p=Math\.round\(t\.active\/activeCases\(\)/.test(html));

/* ================= program pause + pose guard regression ================= */
ok("program pause toggles and audits", /function togglePause\(id\)\{[\s\S]*?t\.paused=!t\.paused;[\s\S]*?PROGRAM PAUSED/.test(html));
ok("pose guard: counsel modal before enable", /function posePrompt\(id\)\{[\s\S]*?counsel sign-off/.test(html));
ok("pose enable sets the flag and audits", /function poseEnable\(id\)\{[\s\S]*?t\.pose=true;[\s\S]*?POSE ANALYSIS FLAG ON/.test(html));

/* ================= dash audit ================= */
ok("dash audit clean", !/[–—]/.test(html));

console.log("\nadmin-portal suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
