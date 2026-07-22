/* Continuum worker sign-up and onboarding suite (Prompt 12j).
   node deploy/worker-signup.test.mjs
   Executes the DOM-free PILOT-CORE mechanics headlessly (window growth, day
   advancement, the escalation threshold, the pilot chart model, the guarded day
   index, and pilot record creation), and statically proves the wizard wiring,
   the active-worker bridge, and dash cleanliness. Hard-fail: extraction throws,
   any FAIL exits nonzero. No em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const w = read("worker-dashboard.html");
const FLAGS = ["numb", "tingling", "sharp", "worse at night", "cannot sleep"];

// -- extract and execute the pure PILOT-CORE mechanics --
const core = (w.match(/\/\* PILOT-CORE-START[\s\S]*?\*\/([\s\S]*?)\/\* PILOT-CORE-END \*\//) || [])[1];
if (!core) throw new Error("EXTRACT FAIL: PILOT-CORE block");
const M = new Function(core + "\n return {windowPush:windowPush,applyCheckin:applyCheckin,chartModel:chartModel,dayExists:dayExists,makePilot:makePilot};")();
const form = (pain, mob, note) => ({ pain, mob, fatigue: 3, confidence: 7, note: note || "" });

// -- pilot creation: day zero record, first check-in advances to day one --
const p = M.makePilot({ name: "Dana Reyes", trade: "Welder", injury: "Left wrist strain", restr: "", form: form(4, 6), ts: 1700000000000 }, FLAGS);
ok("pilot record is a pilot", p.pilot === true);
ok("pilot status is reported at creation", p.status === "reported");
ok("consent is timestamped", p.consentTs === 1700000000000);
ok("first save advances day zero to day one", p.day === 1);
ok("first check-in is the only entry", p.pain.length === 1 && p.mob.length === 1);
ok("first check-in is on the timeline", p.logs.length === 1);
ok("coordinator welcome carries the worker name", p.msgs[0].who === "them" && p.msgs[0].x.includes("Dana Reyes"));
ok("pilot name, trade, injury are on the record", p.name === "Dana Reyes" && p.trade === "Welder" && p.injury === "Left wrist strain");

// -- the escalation rule holds from the pilot's first minute --
const esc = M.makePilot({ name: "Sam Cole", trade: "Fitter", injury: "Back", restr: "", form: form(8, 4), ts: 1 }, FLAGS);
ok("pilot first check-in at pain eight escalates", esc.escalated === true);
ok("escalation writes a clinician-notified log", esc.logs[0].tag === "notified" && /honest/i.test(esc.logs[0].x));
M.applyCheckin(esc, form(2, 6), FLAGS);
ok("a pain-two second check-in stays quiet", esc.escalated === false && esc.logs[0].tag !== "notified");
M.applyCheckin(esc, form(8, 5), FLAGS);
ok("a pain-eight later check-in escalates through the same path", esc.escalated === true && esc.logs[0].tag === "notified");
const kw = M.makePilot({ name: "Lee", trade: "x", injury: "y", restr: "", form: form(3, 6, "numb and tingling at night"), ts: 1 }, FLAGS);
ok("a keyword note escalates even at low pain", kw.escalated === true);

// -- rolling window: grows to seven then rolls; day keeps advancing --
const g = M.makePilot({ name: "Win", trade: "x", injury: "y", restr: "", form: form(5, 5), ts: 1 }, FLAGS);
for (let i = 0; i < 7; i++) M.applyCheckin(g, form(5, 5), FLAGS); // 1 (from makePilot) + 7 = 8 saves
ok("window grows and caps at seven", g.pain.length === 7 && g.mob.length === 7);
ok("day advances with every pilot check-in", g.day === 8);

// -- zero-safe values: no NaN reaches a one-entry record --
ok("one-entry record carries finite numbers", Number.isFinite(p.pain[0]) && Number.isFinite(p.mob[0]));

// -- pilot chart model: only lived days exist, labelled Day 1..Day n, rest placeholders --
const cm = M.chartModel(p);
ok("chart model always has seven slots", cm.length === 7);
ok("pilot slot one is lived and labelled D1", cm[0].exists === true && cm[0].label === "D1");
ok("unlived pilot slots are placeholders", cm[1].exists === false && cm[1].pain === null && cm[1].label === "");
ok("no placeholder yields a NaN height", cm.every(d => d.exists ? Number.isFinite(d.pain) : d.pain === null));

// -- demonstration chart model: seven weekday slots, all real --
const demo = { pilot: false, pain: [7, 7, 6, 6, 5, 5, 4], mob: [3, 3, 4, 4, 5, 6, 6] };
const dm = M.chartModel(demo);
ok("demonstration chart is seven weekday slots", dm.length === 7 && dm[0].label === "MON" && dm[6].label === "SUN");
ok("demonstration chart slots all exist", dm.every(d => d.exists === true));

// -- the day-detail modal refuses indexes that do not exist --
ok("dayExists is true for a lived pilot day", M.dayExists(p, 0) === true);
ok("dayExists refuses an unlived pilot index", M.dayExists(p, 5) === false);
ok("dayExists refuses a negative index", M.dayExists(p, -1) === false);
ok("dayExists is true across the demonstration week", M.dayExists(demo, 6) === true && M.dayExists(demo, 7) === false);

// -- bridge honesty in both modes: name/trade/injury cross, clinical never does --
const js = read("bridge.js");
const ALLOW = new Function("return " + js.match(/var ALLOW = (\[[\s\S]*?\]);/)[1])();
const pbody = js.match(/function projectBridge\(fields\) \{([\s\S]*?)\n  \}/)[1];
const project = f => new Function("fields", "ALLOW", "Date", pbody)(f, ALLOW, Date);
const pilotBridge = project({ source: "worker-dashboard", name: p.name, trade: p.trade, injury: p.injury, restr: p.restr, day: p.day, status: p.status, consented: true, pain: p.pain[0], mobility: p.mob[0] });
ok("pilot name, trade, injury cross the bridge", pilotBridge.name === "Dana Reyes" && pilotBridge.trade === "Welder" && pilotBridge.injury === "Left wrist strain");
ok("pilot clinical values never cross the bridge", pilotBridge.pain === undefined && pilotBridge.mobility === undefined);
const demoBridge = project({ source: "worker-dashboard", name: "Marcus Bedard", trade: "Scaffolder", status: "light_duty", day: 9 });
ok("reset returns the demonstration worker to the bridge", demoBridge.name === "Marcus Bedard" && demoBridge.status === "light_duty");

// -- wizard wiring is present and honest (static) --
ok("Settings offers the pilot sign-up", /Sign up as a new worker \(pilot\)/.test(w));
ok("Settings offers the return to demonstration", /Return to the demonstration/.test(w));
ok("the wizard is four steps", /Step '\+\(s\+1\)\+' of 4/.test(w));
ok("consent is a respected gate", /Taking part is your choice\. Tick the box only if you want to\./.test(w));
ok("name is required to advance", /wiz\.step===2&&!wiz\.name\.trim\(\)/.test(w));
ok("finish creates the record with a truthful toast", /This device now holds your <b>record<\/b>\./.test(w));
ok("finish routes through makePilot", /S=makePilot\(id,FLAGS\)/.test(w));
ok("cancel leaves the demonstration untouched", /function cancelSignup\(\)\{wiz=null;renderWizard\(\)/.test(w));

// -- the active worker (not a hardcoded name) is what the bridge writes --
ok("bridge write reads the active worker name", /writeBridgeShared\(\{source:"worker-dashboard",name:S\.name/.test(w));
ok("no hardcoded Marcus in the bridge write path", !/writeBridgeShared\(\{source:"worker-dashboard",name:"Marcus/.test(w));

// -- dash rule --
ok("worker sign-up surfaces dash clean", ![w, js].some(s => /[–—]/.test(s)));

console.log("\nworker-signup suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
