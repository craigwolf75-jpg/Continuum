/* Continuum 37 module suite (Prompt 37). node deploy/CONTINUUM_37_MODULE_TESTS.js
   Headless: window and document shims per the standing test law, the module
   loaded in a sandbox per run. Fifteen hard-failing tests: install refusal
   with named slots, the unonboarded landing with commitments mounted, the
   onboarded silence, the absolute commitments gate, sites validation three
   ways, roster validation three ways, both wall-as-code refusals with the
   functional-only promise verbatim, injuries validation five ways, the
   organization validation, and the completion path in both directions.
   Hard-fail; no em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, "CONTINUUM_37_EMPLOYER_ONBOARDING_MODULE.js"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const PROMISE = "This is a functional-only view: Continuum never asks for or accepts medical information from an employer.";

// ---- shims and sandbox loader ----
function freshDoc() {
  const attached = [];
  const make = tag => {
    const el = { tag, id: "", children: [], _attached: false,
      appendChild(c) { this.children.push(c); c._attached = true; },
      remove() { this._attached = false; const i = attached.indexOf(this); if (i >= 0) attached.splice(i, 1); } };
    return el;
  };
  return { body: { appendChild: n => { n._attached = true; attached.push(n); } }, createElement: make, _attached: attached };
}
function load() {
  const win = {};
  const doc = freshDoc();
  const errors = [];
  new Function("window", "document", "console", src)(win, doc, { error: m => errors.push(String(m)) });
  return { mod: win.Continuum37, doc, errors };
}
function fullAdapter(overrides) {
  const calls = { registered: [], removed: [], navigated: [], commitmentsMounts: [], writes: [], refreshed: 0 };
  let acceptCb = null;
  const a = {
    hasOrganization: () => false,
    mountCommitments: (el, onAccepted) => { calls.commitmentsMounts.push(el); acceptCb = onAccepted; },
    registerNavItem: (id, label, onOpen) => calls.registered.push({ id, label, onOpen }),
    removeNavItem: id => calls.removed.push(id),
    navigate: id => calls.navigated.push(id),
    refreshDashboard: () => { calls.refreshed++; },
    writeOrganization: p => calls.writes.push(p),
    _calls: calls,
    _accept: ts => acceptCb({ acceptedTs: ts })
  };
  return Object.assign(a, overrides || {});
}

const SITES_OK = "site_id,site_name,address,city,province,site_type\nS1,Main Office,100 First Street,Calgary,AB,office\nS2,North Warehouse,2200 Industry Road,Edmonton,AB,warehouse";
const ROSTER_OK = "employee_id,first_name,last_name,work_email,home_site_id,position_title,employment_type,start_date\nE100,Alex,Martin,alex.martin@example.com,S1,Office Administrator,full_time,2022-03-01\nE101,Sam,Lee,sam.lee@example.com,S2,Warehouse Associate,full_time,2021-09-15";
const INJURIES_OK = "incident_id,employee_id,incident_date,site_id,incident_category,work_status,lost_time_days,claim_number\nI500,E101,2026-06-30,S2,strain_or_sprain,modified_duties,4,CL-2026-0042";

function onboardTo(mod, a, upTo) {
  a._accept("2026-07-22T23:00:00Z");
  const steps = [
    ["organization", { legalName: "Acme Industrial Ltd", commonName: "Acme", industry: "construction", provinces: ["AB"], employeeBand: "200 to 499", collective: "some sites", modifiedDuties: "informal", avgLostTimeDays: 14 }],
    ["sites", SITES_OK],
    ["roster", ROSTER_OK],
    ["injuries", INJURIES_OK],
    ["dutyMapping", [{ position_title: "Warehouse Associate", matched: "Warehouse Associate" }, { position_title: "Office Administrator", matched: "Office Administrator" }]],
    ["program", { goals: ["fewer lost time days", "faster first safe duties"], targetDays: 5, monthlyViewers: ["ceo@example.com"] }],
    ["contacts", { coordinatorName: "K. Morgan", coordinatorEmail: "k.morgan@example.com", smsDefaultsConfirmed: true }]
  ];
  for (const [step, payload] of steps) {
    if (upTo && step === upTo) return;
    mod.submit(step, payload);
  }
}

// ---- test 1: install refuses with the missing slots named ----
{
  const { mod, errors } = load();
  const partial = fullAdapter();
  delete partial.writeOrganization;
  delete partial.mountCommitments;
  const res = mod.install(partial);
  ok("t1 refusal returns false and names the missing slots", res === false && errors.length === 1 && errors[0].includes("mountCommitments") && errors[0].includes("writeOrganization"));
}

// ---- test 2: unonboarded landing registers, navigates, mounts commitments ----
{
  const { mod, doc } = load();
  const a = fullAdapter();
  const res = mod.install(a);
  ok("t2 unonboarded landing: Set up your organization registered, landed on, commitments mounted once", res === true && a._calls.registered.length === 1 && a._calls.registered[0].id === "setup" && a._calls.registered[0].label === "Set up your organization" && a._calls.navigated[0] === "setup" && a._calls.commitmentsMounts.length === 1 && doc._attached.length === 1);
}

// ---- test 3: onboarded silence ----
{
  const { mod, doc } = load();
  const a = fullAdapter({ hasOrganization: () => true });
  const res = mod.install(a);
  ok("t3 onboarded install registers nothing and mounts nothing", res === true && a._calls.registered.length === 0 && a._calls.commitmentsMounts.length === 0 && doc._attached.length === 0);
}

// ---- test 4: the absolute commitments gate ----
{
  const { mod, errors } = load();
  const a = fullAdapter();
  mod.install(a);
  const res = mod.submit("sites", SITES_OK);
  ok("t4 gate refuses uploads before acceptance and names the locked step", res.ok === false && errors.some(e => e.includes("locked until the commitments are accepted") && e.includes("sites")));
  a._accept("2026-07-22T23:00:00Z");
  ok("t4 after acceptance the same upload passes", mod.submit("sites", SITES_OK).ok === true);
}

// ---- tests 5 to 7: sites validation ----
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  ok("t5 sites pass", mod.submit("sites", SITES_OK).ok === true);
}
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  const bad = SITES_OK.replace("Edmonton,AB", "Edmonton,XX");
  const res = mod.submit("sites", bad);
  ok("t6 sites bad province refused with the row number", res.ok === false && res.errors.some(e => e.includes("row 3") && e.includes("XX")));
}
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  const dup = SITES_OK + "\nS1,Duplicate Site,1 Road,Calgary,AB,office";
  const res = mod.submit("sites", dup);
  ok("t7 sites duplicate id refused with the row number", res.ok === false && res.errors.some(e => e.includes("row 4") && e.includes("duplicate site_id S1")));
}

// ---- tests 8 to 10: roster validation ----
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  mod.submit("sites", SITES_OK);
  ok("t8 roster pass with cross-referenced sites", mod.submit("roster", ROSTER_OK).ok === true);
}
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  mod.submit("sites", SITES_OK);
  const res = mod.submit("roster", ROSTER_OK.replace("S2,Warehouse Associate", "S9,Warehouse Associate"));
  ok("t9 roster unknown site refused with the row number", res.ok === false && res.errors.some(e => e.includes("row 3") && e.includes("S9") && e.includes("does not name an uploaded site")));
}
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  mod.submit("sites", SITES_OK);
  const dup = ROSTER_OK + "\nE100,Jo,Kim,jo.kim@example.com,S1,Clerk,part_time,2024-01-05";
  const res = mod.submit("roster", dup);
  ok("t10 roster duplicate employee refused with the row number", res.ok === false && res.errors.some(e => e.includes("row 4") && e.includes("duplicate employee_id E100")));
}

// ---- tests 11 and 12: the wall as code, promise verbatim ----
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  mod.submit("sites", SITES_OK);
  const walled = ROSTER_OK.replace(",start_date", ",start_date,diagnosis").replace(",2022-03-01", ",2022-03-01,x").replace(",2021-09-15", ",2021-09-15,y");
  const res = mod.submit("roster", walled);
  ok("t11 diagnosis column on roster refused with the promise verbatim", res.ok === false && res.errors.length === 1 && res.errors[0].includes(PROMISE) && res.errors[0].includes("diagnosis"));
}
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  mod.submit("sites", SITES_OK);
  mod.submit("roster", ROSTER_OK);
  const walled = INJURIES_OK.replace(",claim_number", ",claim_number,pain_score").replace(",CL-2026-0042", ",CL-2026-0042,8");
  const res = mod.submit("injuries", walled);
  ok("t12 pain_score column on injuries refused with the promise verbatim", res.ok === false && res.errors.length === 1 && res.errors[0].includes(PROMISE) && res.errors[0].includes("pain_score"));
}

// ---- test 13: injuries validation five ways ----
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  mod.submit("sites", SITES_OK);
  mod.submit("roster", ROSTER_OK);
  ok("t13a injuries pass with cross-references", mod.submit("injuries", INJURIES_OK).ok === true);
  ok("t13b injuries unknown employee refused", mod.submit("injuries", INJURIES_OK.replace("I500,E101", "I500,E999")).errors.some(e => e.includes("E999") && e.includes("does not name an uploaded employee")));
  ok("t13c injuries bad category refused", mod.submit("injuries", INJURIES_OK.replace("strain_or_sprain", "backache")).errors.some(e => e.includes("backache")));
  ok("t13d injuries negative lost time refused", mod.submit("injuries", INJURIES_OK.replace(",4,", ",-2,")).errors.some(e => e.includes("lost_time_days")));
  ok("t13e the empty upload is accepted", mod.submit("injuries", "").ok === true);
}

// ---- test 14: organization validation ----
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  const badBand = mod.submit("organization", { legalName: "Acme", provinces: ["AB"], employeeBand: "a few" });
  ok("t14a employee band enforced", badBand.ok === false && badBand.errors.some(e => e.includes("employee count band")));
  const badProv = mod.submit("organization", { legalName: "Acme", provinces: ["Alberta"], employeeBand: "1 to 49" });
  ok("t14b province codes enforced", badProv.ok === false && badProv.errors.some(e => e.includes("Alberta")));
  ok("t14c a valid organization passes", mod.submit("organization", { legalName: "Acme", provinces: ["AB", "BC"], employeeBand: "1 to 49" }).ok === true);
}

// ---- test 15: the completion path, both directions ----
{
  const { mod, errors } = load();
  const a = fullAdapter(); mod.install(a);
  onboardTo(mod, a, "program"); // stops before program and contacts
  const refused = mod.finish();
  ok("t15a finish refuses with the missing steps named", refused.ok === false && errors.some(e => e.includes("steps not complete") && e.includes("program") && e.includes("contacts")));
}
{
  const { mod, doc } = load();
  const a = fullAdapter(); mod.install(a);
  onboardTo(mod, a);
  const done = mod.finish();
  const w = a._calls.writes[0];
  ok("t15b finish writes the payload with the commitments timestamp", done.ok === true && a._calls.writes.length === 1 && w.commitments.acceptedTs === "2026-07-22T23:00:00Z");
  ok("t15c counts assembled and injuries carried", w.counts.sites === 2 && w.counts.employees === 2 && w.counts.openCases === 1 && w.counts.mappedPositions === 2);
  ok("t15d teardown, refresh, and navigation to the populated dashboard", a._calls.removed[0] === "setup" && doc._attached.length === 0 && a._calls.refreshed === 1 && a._calls.navigated[a._calls.navigated.length - 1] === "dashboard");
}
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a);
  a._accept("ts");
  mod.submit("organization", { legalName: "Acme", provinces: ["AB"], employeeBand: "1 to 49" });
  mod.submit("sites", SITES_OK);
  mod.submit("roster", ROSTER_OK);
  mod.submit("dutyMapping", [{ position_title: "Clerk", matched: "Office Administrator" }]);
  mod.submit("program", { goals: ["fewer lost time days"] });
  mod.submit("contacts", { coordinatorName: "K. Morgan", coordinatorEmail: "k.morgan@example.com" });
  const done = mod.finish();
  ok("t15e injuries default to zero open cases when the optional step is skipped", done.ok === true && done.payload.injuries.length === 0 && done.payload.counts.openCases === 0);
}

// ---- test 16: parsing hardening ----
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  const quoted = 'site_id,site_name,address,city,province,site_type\nS1,HQ,"123 Main St, Suite 4",Calgary,AB,office';
  const res = mod.submit("sites", quoted);
  ok("t16a a quoted comma in an address is data, not a column break", res.ok === true && res.rows[0].address === "123 Main St, Suite 4");
  const ragged = SITES_OK + "\nS3,Short Row,1 Road,Calgary,AB";
  const res2 = mod.submit("sites", ragged);
  ok("t16b a ragged row is refused by row number, never padded", res2.ok === false && res2.errors.some(e => e.includes("row 4") && e.includes("cells")));
  const blank = "site_id,site_name,address,city,province,site_type\n\nS1,HQ,1 Road,Calgary,XX,office";
  const res3 = mod.submit("sites", blank);
  ok("t16c row numbers are physical file lines across blank lines", res3.ok === false && res3.errors.some(e => e.includes("row 3") && e.includes("XX")));
  mod.submit("sites", SITES_OK); mod.submit("roster", ROSTER_OK);
  const res4 = mod.submit("injuries", INJURIES_OK.replace(",4,", ",,"));
  ok("t16d an empty lost_time_days is refused", res4.ok === false && res4.errors.some(e => e.includes("lost_time_days")));
  const res5 = mod.submit("sites", "site_id,site_name,address,city,province\nS1,HQ,1 Road,Calgary,AB");
  ok("t16e a missing column is refused by name", res5.ok === false && res5.errors.some(e => e.includes("missing columns") && e.includes("site_type")));
}

// ---- test 17: lifecycle hardening ----
{
  const { mod, doc } = load();
  const a = fullAdapter(); mod.install(a);
  a._calls.registered[0].onOpen();
  a._calls.registered[0].onOpen();
  ok("t17a reopening the sub-section never remounts the commitments step", a._calls.commitmentsMounts.length === 1 && doc._attached.length === 1);
  onboardTo(mod, a);
  const first = mod.finish();
  const second = mod.finish();
  ok("t17b a second finish is refused and writes nothing twice", first.ok === true && second.ok === false && a._calls.writes.length === 1);
}
{
  const { mod, errors } = load();
  const a = fullAdapter(); mod.install(a);
  a._accept("2026-07-22T23:00:00Z");
  mod.submit("sites", SITES_OK);
  const b = fullAdapter();
  mod.install(b);
  const res = mod.submit("roster", ROSTER_OK);
  ok("t17c a fresh install resets the session: the gate locks again and no data carries", res.ok === false && errors.some(e => e.includes("locked until the commitments are accepted")));
}
{
  const { mod, errors } = load();
  const a = fullAdapter(); mod.install(a);
  onboardTo(mod, a);
  const resites = "site_id,site_name,address,city,province,site_type\nA1,New Office,1 Road,Calgary,AB,office";
  ok("t17d re-uploading different sites is accepted at submit", mod.submit("sites", resites).ok === true);
  const res = mod.finish();
  ok("t17e finish re-verifies cross-references against the final uploads", res.ok === false && errors.some(e => e.includes("cross-references no longer hold") && e.includes("S1")));
}
{
  const { mod, errors } = load();
  const a = fullAdapter(); mod.install(a);
  a._accept("");
  const res = mod.submit("sites", SITES_OK);
  ok("t17f an acceptance without a timestamp is refused and the gate stays locked", res.ok === false && errors.some(e => e.includes("acceptance requires a timestamp")));
}

// ---- test 18: wall and shape hardening on the question steps ----
{
  const { mod } = load();
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  const res = mod.submit("contacts", { coordinatorName: "K. Morgan", coordinatorEmail: "k.morgan@example.com", diagnosis_notes: "sneaks" });
  ok("t18a a medical field name on a question step is refused with the promise verbatim", res.ok === false && res.errors[0].includes(PROMISE) && res.errors[0].includes("diagnosis_notes"));
  const res2 = mod.submit("dutyMapping", "not a mapping");
  ok("t18b duty mapping refuses anything but confirmed match objects", res2.ok === false);
  const res3 = mod.submit("dutyMapping", [{ position_title: "Clerk" }]);
  ok("t18c a match without a matched duty is refused", res3.ok === false && res3.errors.some(e => e.includes("position_title and matched")));
  const res4 = mod.submit("program", { goals: ["fewer lost time days", "faster first safe duties", "fewer unacknowledged claims", "a better premium or rebate position"] });
  ok("t18d more than three goals is refused", res4.ok === false && res4.errors.some(e => e.includes("up to three")));
}

// ---- test 19: reconciliation with the series module draft ----
{
  const { mod } = load();
  ok("t19a the wall carries fifteen tokens including the draft's additions", mod.FORBIDDEN.length === 15 && ["condition", "mental", "injury_description"].every(t => mod.FORBIDDEN.includes(t)) && ["prognosis", "prescription", "clinical"].every(t => mod.FORBIDDEN.includes(t)));
  const a = fullAdapter(); mod.install(a); a._accept("ts");
  const walled = mod.submit("sites", SITES_OK.replace("site_type", "site_type,condition_notes") + ",x");
  ok("t19b a condition column is refused with the promise verbatim", walled.ok === false && walled.errors[0].includes(PROMISE) && walled.errors[0].includes("condition_notes"));
  mod.submit("sites", SITES_OK);
  const badEmp = mod.submit("roster", ROSTER_OK.replace("full_time,2022-03-01", "gig,2022-03-01"));
  ok("t19c an unknown employment_type is refused with the row number", badEmp.ok === false && badEmp.errors.some(e => e.includes("row 2") && e.includes("gig")));
  const lower = mod.submit("sites", SITES_OK.replace("Calgary,AB", "Calgary,ab"));
  ok("t19d a lowercase province code is accepted", lower.ok === true);
}
{
  const { mod, doc } = load();
  const a = fullAdapter(); mod.install(a);
  onboardTo(mod, a);
  const done = mod.finish();
  ok("t19e the payload carries the version marker", done.ok === true && done.payload.version === "37-1");
}
{
  const win = {};
  new Function("window", "document", "console", src)(win, freshDoc(), { error: () => {} });
  ok("t19f the series global name CONTINUUM_37 resolves to the same module", win.CONTINUUM_37 === win.Continuum37 && !!win.Continuum37);
}

console.log("\n37 module suite: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
