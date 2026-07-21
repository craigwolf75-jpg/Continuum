/* Continuum bridge suite (Mission S12d). node deploy/bridge.test.mjs
   Proves the single-source functional-only projection: only allowlist keys cross
   the worker bridge, clinical fields are dropped, and all three worker surfaces
   write through the one shared projection. Hard-fail: extraction throws, any FAIL
   exits nonzero. No em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const extract = (re, s, label) => { const m = s.match(re); if (!m) throw new Error("EXTRACT FAIL: " + label); return m; };

const js = read("bridge.js");
const ALLOW = new Function("return " + extract(/var ALLOW = (\[[\s\S]*?\]);/, js, "ALLOW")[1])();
const body = extract(/function projectBridge\(fields\) \{([\s\S]*?)\n  \}/, js, "projectBridge")[1];
const projectBridge = new Function("fields", "ALLOW", "Date", body);
const project = f => projectBridge(f, ALLOW, Date);

// the allowlist itself must carry no clinical field name
ok("allowlist carries no clinical field", !ALLOW.some(k => /pain|mob|fatigue|confidence|notes|diagnos/i.test(k)));

// a payload with clinical fields mixed in: only functional keys survive
const r = project({ source: "worker-dashboard", name: "Marcus Bedard", trade: "Scaffolder", status: "light_duty", day: 9, consented: true, pain: 4, mobility: 6, fatigue: 3, confidence: 8, notes: "hurts", diagnosis: "supraspinatus strain" });
ok("only allowlist keys cross", Object.keys(r).every(k => ALLOW.includes(k)));
ok("clinical fields are dropped", r.pain === undefined && r.mobility === undefined && r.fatigue === undefined && r.confidence === undefined && r.notes === undefined && r.diagnosis === undefined);
ok("functional fields are kept", r.name === "Marcus Bedard" && r.status === "light_duty" && r.day === 9 && r.consented === true);
ok("ts is auto-added when absent", typeof r.ts === "number");
ok("a provided ts is preserved", project({ ts: 123 }).ts === 123);

// all three worker surfaces route through the one shared projection
const w = read("worker-dashboard.html"), wf = read("continuum_workflow_app.html"), we = read("worker-embed.html");
ok("worker-dashboard loads bridge.js", w.includes('src="/bridge.js"'));
ok("workflow app loads bridge.js", wf.includes('src="/bridge.js"'));
ok("worker-embed loads bridge.js", we.includes('src="/bridge.js"'));
ok("worker-dashboard writes via ContinuumBridge", /ContinuumBridge\.writeBridgeShared\(/.test(w));
ok("workflow app writes via ContinuumBridge", /ContinuumBridge\.writeBridgeShared\(/.test(wf));
ok("worker-embed writes via ContinuumBridge", /ContinuumBridge\.writeBridgeShared\(/.test(we));

// no surface hand-rolls a direct write to the bridge key; only bridge.js does
ok("no direct bridge setItem left in the worker surfaces", ![w, wf, we].some(s => /setItem\(\s*["']continuum_worker_bridge_v1|setItem\(BRIDGE_KEY/.test(s)));
ok("bridge.js is the single writer of the key", /localStorage\.setItem\(KEY/.test(js));

// dash rule across the bridge files
ok("bridge files dash clean", ![js, w, wf, we].some(s => /[–—]/.test(s)));

console.log("\nbridge suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
