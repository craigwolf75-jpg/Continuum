/* Continuum Prompt 45: provincial rules suite.

   Proves Section 8: resolvers require an explicit jurisdiction, an inactive
   clinic is blocked with a named message, the synthetic ZZ pack loads from
   data and renders / validates / generates a document with zero pack-specific
   application code, a fee with no effective row fails, and removing Alberta
   leaves the application running. Athena does not declare green.
   No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createProvincialStore, ALBERTA_JURISDICTION, SYNTHETIC_JURISDICTION } from "../db/provincial_rules.data.mjs";
import {
  resolveJurisdiction, resolveForms, resolveCodeList, resolveFee, resolveDeadline,
  resolveDisclosureProfile, resolveConsentProfile, assertClinicAccess,
  activateJurisdiction, packGaps, boardNameForCode, workerIdentifierProfile,
} from "./jurisdiction.mjs";
import { renderForm, validateForm, generateDocument, loadFormPack } from "./formpack.mjs";
import { phnLength } from "./phn.mjs";
import { targetBatch } from "./batch.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const throws = (fn, code) => { try { fn(); return false; } catch (e) { return !code || e.code === code; } };

const store = createProvincialStore();
const here = dirname(fileURLToPath(import.meta.url));

// -- resolver source has no jurisdiction == AB branch --------------------------------
{
  const src = readFileSync(join(here, "jurisdiction.mjs"), "utf8") + readFileSync(join(here, "formpack.mjs"), "utf8");
  ok("resolvers do not branch on jurisdiction == AB", !/jurisdiction\s*===\s*['\"]AB['\"]/.test(src) && !/jurisdiction\s*==\s*['\"]AB['\"]/.test(src));
  ok("resolvers do not contain 96.98", !src.includes("96.98"));
}

// -- every resolver requires an explicit jurisdiction (Section 8.2) -----------------
ok("resolveJurisdiction with no clinic fails", throws(() => resolveJurisdiction(null, store), "JURISDICTION-MISSING"));
ok("resolveJurisdiction with no code fails", throws(() => resolveJurisdiction({ id: "c1" }, store), "JURISDICTION-MISSING"));
ok("resolveJurisdiction with no store fails", throws(() => resolveJurisdiction({ jurisdiction_code: "AB" }, null), "JURISDICTION-STORE-MISSING"));
ok("resolveForms with no jurisdiction fails", throws(() => resolveForms("", "000001", "GP", "initial", store), "JURISDICTION-MISSING"));
ok("resolveCodeList with no jurisdiction fails", throws(() => resolveCodeList("", "TEST01", "Status", store), "JURISDICTION-MISSING"));
ok("resolveFee with no jurisdiction fails", throws(() => resolveFee("", "C050E", "GP", "same_day", "2026-01-01", store), "JURISDICTION-MISSING"));
ok("resolveDeadline with no jurisdiction fails", throws(() => resolveDeadline("", "first_report", "2026-01-01T09:00", store), "JURISDICTION-MISSING"));
ok("resolveDisclosureProfile with no jurisdiction fails", throws(() => resolveDisclosureProfile("", store), "JURISDICTION-MISSING"));
ok("an unknown jurisdiction fails, never defaults", throws(() => resolveJurisdiction({ jurisdiction_code: "XX" }, store), "JURISDICTION-UNKNOWN"));

ok("resolveJurisdiction returns the clinic row", resolveJurisdiction({ id: "c1", jurisdiction_code: "AB" }, store).code === "AB");
ok("resolveForms returns TEST01 for the synthetic initial triple", resolveForms("ZZ", "SYN001", "GP", "initial", store).join() === "TEST01");
ok("resolveForms returns TEST02 for the synthetic progress triple", resolveForms("ZZ", "SYN001", "GP", "progress", store).join() === "TEST02");
ok("resolveCodeList returns OPEN and CLOSED for TEST01 Status", resolveCodeList("ZZ", "TEST01", "Status", store).map((v) => v.code).sort().join() === "CLOSED,OPEN");
ok("resolveFee reads the Alberta same day amount from data", resolveFee("AB", "C050E", "GP", "same_day", "2026-06-01", store) === 96.98);
ok("resolveFee reads the synthetic amount from data", resolveFee("ZZ", "TEST01", "GP", "same_day", "2026-06-01", store) === 1.00);
ok("resolveDeadline first_report is two calendar days", resolveDeadline("AB", "first_report", "2026-07-31T16:30:00", store).date === "2026-08-02");
ok("resolveDeadline same_day_cutoff skips the weekend and Heritage Day", (() => {
  const d = resolveDeadline("AB", "same_day_cutoff", "2026-07-31T16:30:00", store);
  return d.date === "2026-08-04" && d.time === "10:00";
})());
ok("resolveDisclosureProfile returns alberta_pink_copy from data", resolveDisclosureProfile("AB", store).id === "alberta_pink_copy");
ok("resolveConsentProfile returns alberta_statutory_report from data", resolveConsentProfile("AB", store).id === "alberta_statutory_report");
ok("ARGUS-PRIV-010 (c): ZZ consent and disclosure profiles both refuse employer publish", (() => {
  const consent = resolveConsentProfile("ZZ", store);
  const disclosure = resolveDisclosureProfile("ZZ", store);
  return consent.employer_disclosure === "none" && disclosure.employer_channel === "none";
})());
ok("boardNameForCode reads board_name from data", boardNameForCode("AB", store) === "WCB Alberta");
ok("boardNameForCode on an unknown code is UNKNOWN, never a guessed board", boardNameForCode("??", store) === "UNKNOWN");

// -- inactive clinic is blocked, never served another jurisdiction (Section 8.3) ----
ok("an inactive ZZ clinic is blocked with INACTIVE-JURISDICTION", throws(
  () => assertClinicAccess({ id: "clinic-zz", jurisdiction_code: "ZZ" }, store),
  "INACTIVE-JURISDICTION"
));
ok("the inactive block names the jurisdiction and does not mention a fallback", (() => {
  try { assertClinicAccess({ id: "clinic-zz", jurisdiction_code: "ZZ" }, store); return false; }
  catch (e) { return e.message.includes("ZZ") && /no fallback/i.test(e.message); }
})());
ok("an active AB clinic is allowed", assertClinicAccess({ id: "clinic-ab", jurisdiction_code: "AB" }, store).code === "AB");

// -- missing fee fails, missing deadline fails (Section 6 / 8.5) --------------------
ok("a fee lookup with no effective row fails FEE-MISSING", throws(
  () => resolveFee("AB", "C050E", "GP", "same_day", "2020-01-01", store),
  "FEE-MISSING"
));
ok("a fee lookup does not return a nearest row", throws(() => resolveFee("ZZ", "TEST01", "GP", "late", "2026-06-01", store), "FEE-MISSING"));
ok("a missing deadline kind fails DEADLINE-MISSING", throws(
  () => resolveDeadline("AB", "correction_window", "2026-07-31T09:00", store),
  "DEADLINE-MISSING"
));

// -- activation fails loud when a pack component is missing (Section 6) -------------
ok("ZZ pack gaps are empty (the synthetic pack is complete)", packGaps("ZZ", store).length === 0);
ok("activating ZZ succeeds and sets active", activateJurisdiction("ZZ", store).active === true);
ok("after activation a ZZ clinic may sign in", assertClinicAccess({ id: "clinic-zz", jurisdiction_code: "ZZ" }, store).code === "ZZ");
ok("activation of an incomplete pack names the missing parts", (() => {
  const broken = createProvincialStore({ forms: [], elements: [] });
  try { activateJurisdiction("ZZ", broken); return false; }
  catch (e) { return e.code === "JURISDICTION-PACK-INCOMPLETE" && e.missing.includes("form_definition") && e.missing.includes("form_element"); }
})());

// -- synthetic ZZ: load, render, validate, generate (Section 8.4) -------------------
const zzStore = createProvincialStore();
activateJurisdiction("ZZ", zzStore);
const pack = loadFormPack("ZZ", zzStore);
ok("ZZ board_name contains Synthetic", pack.jurisdiction.board_name.includes("Synthetic"));
ok("ZZ loads two TEST forms from data", pack.forms.map((f) => f.form_id).sort().join() === "TEST01,TEST02");
ok("ZZ form ids are TEST prefixed", pack.forms.every((f) => f.form_id.startsWith("TEST")));

const rendered = renderForm("ZZ", "TEST01", zzStore);
ok("renderForm builds TEST01 from data with six elements", rendered.form_id === "TEST01" && rendered.elements.length === 6);
ok("renderForm carries the Synthetic board name", rendered.board_name.includes("Synthetic"));
ok("Status code values load from the synthetic list", rendered.elements.find((e) => e.name === "Status").codeValues.map((v) => v.code).sort().join() === "CLOSED,OPEN");

const good = { 1: "TEST01", 2: "N", 3: "SW0001", 4: "OPEN", 5: "ok", 6: "SYN001" };
const valid = validateForm("ZZ", "TEST01", good, zzStore);
ok("validateForm accepts a complete TEST01 payload", valid.ok === true && valid.failures.length === 0);
ok("validateForm rejects a bad status code", validateForm("ZZ", "TEST01", { ...good, 4: "NOPE" }, zzStore).ok === false);

const doc = generateDocument("ZZ", "TEST01", good, zzStore);
ok("generateDocument emits XML for TEST01", doc.includes("<jurisdiction_document") && doc.includes("form_id=\"TEST01\""));
ok("generateDocument carries Synthetic in the board attribute", doc.includes("Synthetic"));
ok("generateDocument writes the worker number from the payload", doc.includes("SW0001"));
ok("generateDocument is a zero code change path (generic formpack, not a ZZ module)", !readFileSync(join(here, "formpack.mjs"), "utf8").includes("TEST01"));

const progress = generateDocument("ZZ", "TEST02", {
  1: "TEST02", 2: "TEST01", 3: "SW0001", 4: "CLOSED", 5: "", 6: "Y",
}, zzStore);
ok("TEST02 also generates from the same formpack path", progress.includes("form_id=\"TEST02\"") && progress.includes("SW0001"));

ok("ZZ worker identifier pattern comes from data", (() => {
  const p = workerIdentifierProfile("ZZ", zzStore);
  return phnLength("SW0001", p).length === 0 && phnLength("123456789", p).length === 1;
})());

// -- batch cutoff is the deadline table, not a constant --------------------------------
ok("targetBatch uses the resolved same day cutoff", (() => {
  const d = resolveDeadline("AB", "same_day_cutoff", "2026-07-31T16:30:00", store);
  const t = targetBatch({ date: "2026-07-31", time: "16:30" }, { holidays: ["2026-08-03"], deadline: d });
  return t.time === "17:00" && t.deadline.time === "10:00";
})());
ok("targetBatch without a deadline fails named", throws(
  () => targetBatch({ date: "2026-07-31", time: "16:30" }, { holidays: [] }),
  "DEADLINE-MISSING"
));

// -- removing Alberta leaves the app running with no crash (Section 8.6) -------------
{
  const stripped = createProvincialStore();
  stripped.jurisdictions = stripped.jurisdictions.filter((j) => j.code !== "AB");
  stripped.fees = stripped.fees.filter((f) => f.jurisdiction_code !== "AB");
  stripped.deadlines = stripped.deadlines.filter((d) => d.jurisdiction_code !== "AB");
  stripped.holidays = stripped.holidays.filter((h) => h.jurisdiction_code !== "AB");
  stripped.contractRoleForms = stripped.contractRoleForms.filter((c) => c.jurisdiction_code !== "AB");
  let crashed = false;
  let abFailed = false;
  let zzWorked = false;
  try {
    try { resolveJurisdiction({ jurisdiction_code: "AB" }, stripped); }
    catch (e) { abFailed = e.code === "JURISDICTION-UNKNOWN"; }
    activateJurisdiction("ZZ", stripped);
    const d = generateDocument("ZZ", "TEST01", good, stripped);
    zzWorked = d.includes("TEST01");
  } catch (e) {
    crashed = true;
    console.error("  crash after removing Alberta: " + e.message);
  }
  ok("removing Alberta does not crash", crashed === false);
  ok("removing Alberta leaves no AB jurisdiction to resolve", abFailed === true);
  ok("removing Alberta still serves the synthetic pack", zzWorked === true);
}

// -- 002 tension: inactive real provinces have no packs --------------------------------
ok("ON is present, inactive, and has no form pack", (() => {
  const on = store.jurisdictions.find((j) => j.code === "ON");
  return on && on.active === false && packGaps("ON", store).includes("form_definition");
})());
ok("BC is present, inactive, and has no form pack", packGaps("BC", store).includes("form_definition"));
ok("ZZ identifiers cannot be mistaken for a real province pack", SYNTHETIC_JURISDICTION.code === "ZZ" && SYNTHETIC_JURISDICTION.board_name.includes("Synthetic") && ALBERTA_JURISDICTION.active === true);

console.log("\njurisdiction suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
