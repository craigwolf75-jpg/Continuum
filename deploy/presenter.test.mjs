/* Continuum presenter suite (Prompt 32). node deploy/presenter.test.mjs
   Covers the shared presenter module and its injection into both portals: the
   agent id stores and clears, the explainer selection is correct, the widget
   wiring mounts once and instructs when unconfigured, both portals attach and
   wrap render, every section has substantive copy, the privacy and hazard lines
   are verbatim, and the register laws hold on the module copy itself. Hard-fail:
   extraction throws, any FAIL exits nonzero. No em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// ---- load presenter.js in a sandbox to test real behavior ----
const js = read("presenter.js");
const store = {};
const mockLS = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const fakeWin = {};
new Function("window", "localStorage", "document", "navigator", js)(fakeWin, mockLS, {}, {});
const CP = fakeWin.ContinuumPresenter;
ok("presenter module loads", !!CP);

ok("shared agent key is continuum_presenter_agent_v1", CP.AGENT_KEY === "continuum_presenter_agent_v1");
ok("present mode defaults off", CP.isOn() === false);
CP.setAgent("agent_abc123");
ok("agent id stores", CP.getAgent() === "agent_abc123" && store[CP.AGENT_KEY] === "agent_abc123");
CP.setAgent("");
ok("agent id clears", CP.getAgent() === "" && !(CP.AGENT_KEY in store));
// ---- dedicated agent auto-connects; no manual sign in ----
ok("a dedicated default agent is baked in", CP.DEFAULT_AGENT === "agent_8301ky420pc9f4e8ekswyekptnf2");
ok("effective agent falls back to the dedicated default when none is stored", CP.activeAgent() === "agent_8301ky420pc9f4e8ekswyekptnf2");
CP.setAgent("agent_override99");
ok("an explicit override still wins over the default", CP.activeAgent() === "agent_override99");
CP.setAgent("");
ok("effective agent returns to the default after an override clears", CP.activeAgent() === "agent_8301ky420pc9f4e8ekswyekptnf2");
ok("explainerFor returns the section card", CP.explainerFor({ a: { title: "T", body: "B" } }, "a").title === "T");
ok("explainerFor falls back for an unknown section", CP.explainerFor({}, "none").title === "This section");

// ---- widget wiring, asserted on source ----
ok("mounts the official convai element", js.includes('createElement("elevenlabs-convai")'));
ok("sets the agent-id attribute", js.includes('setAttribute("agent-id"'));
ok("loads the official ElevenLabs widget script", js.includes("@elevenlabs/convai-widget-embed"));
ok("widget mounts exactly once (id guard)", js.includes('getElementById("cp-convai")') && js.includes("if (!w)"));
ok("voice panel reports active and never asks to sign in", js.includes('cp-active">active') && !js.includes("Paste the ElevenLabs agent ID"));
ok("the dedicated agent id is embedded for auto-connect", js.includes("agent_8301ky420pc9f4e8ekswyekptnf2"));
ok("the panel mounts the agent with no Connect step", js.includes("mountWidget(activeAgent())") && !js.includes('id="cp-set"'));
ok("full teardown when toggled off", js.includes("function teardown()") && js.includes("unmountWidget"));
ok("print hides the whole kit", js.includes("@media print") && js.includes("cp-convai"));
ok("presenter.js dash clean", !/[–—]/.test(js));

// ---- both portals attach, wrap render, and load the module ----
const emp = read("employer-dashboard.html"), hse = read("hse-portal.html");
ok("employer loads presenter.js", emp.includes('src="/presenter.js"'));
ok("hse loads presenter.js", hse.includes('src="/presenter.js"'));
ok("employer attaches the presenter", emp.includes("ContinuumPresenter.attach"));
ok("hse attaches the presenter", hse.includes("ContinuumPresenter.attach"));
ok("employer wraps render", /_cpRender\.apply\(this,arguments\);ContinuumPresenter\.refresh\(\)/.test(emp));
ok("hse wraps render", /_cpRender\.apply\(this,arguments\);ContinuumPresenter\.refresh\(\)/.test(hse));

// ---- extract each portal's section map and walk every section ----
const cpsec = (html, label) => { const m = html.match(/var CPSEC=(\{[\s\S]*?\});\s*\n\s*ContinuumPresenter\.attach/); if (!m) throw new Error("no CPSEC: " + label); return new Function("return " + m[1])(); };
const empSec = cpsec(emp, "employer"), hseSec = cpsec(hse, "hse");
const EMP = ["overview", "workers", "claims", "rtw", "visits", "notes", "reports", "trends", "benchmarking", "users", "settings", "integrations"];
const HSE = ["dashboard", "claims", "workers", "analytics", "settings"];
ok("employer: every section has an explainer", EMP.every(s => empSec[s] && empSec[s].title && empSec[s].body));
ok("hse: every section has an explainer", HSE.every(s => hseSec[s] && hseSec[s].title && hseSec[s].body));
ok("employer: every explainer is substantive", EMP.every(s => empSec[s].body.length >= 40));
ok("hse: every explainer is substantive", HSE.every(s => hseSec[s].body.length >= 40));

// ---- verbatim lines ----
const PRIVACY = "notice what is not here, no diagnoses, no pain scores, no medical notes; the employer sees what work is safe, never private health details.";
ok("employer overview carries the privacy line verbatim", empSec.overview.body.includes(PRIVACY));
const HAZARD = "a button that refuses until a person confirms the check";
ok("hse workers carries the hazard line verbatim", hseSec.workers.body.includes(HAZARD));

// ---- register laws on the module copy ----
const hseCopy = HSE.map(s => hseSec[s].title + " " + hseSec[s].body).join(" ");
ok("hse explainers carry no clinical vocabulary", !/\b(pain|mobility|diagnos|symptom|clinical|medical|injur|treatment|supraspinatus|lumbar)\b/i.test(hseCopy));
// employer: clinical terms appear only as named absences
let stripped = EMP.map(s => empSec[s].body).join(" ")
  .replace(/no diagnoses/gi, "").replace(/no pain scores/gi, "").replace(/no medical notes/gi, "")
  .replace(/never private health details/gi, "").replace(/not the worker's health information/gi, "")
  .replace(/not the medicine/gi, "").replace(/never medical notes/gi, "").replace(/never what was discussed/gi, "");
ok("employer names clinical detail only as absences", !/\b(diagnos|pain|medical|medicine)\b/i.test(stripped));

ok("patched portals dash clean", !/[–—]/.test(emp) && !/[–—]/.test(hse));

// ---- Present control lives in the page header, not a fixed corner pill ----
ok("presenter no longer paints a fixed corner pill", !js.includes("cp-pill"));
ok("present button is print-hidden", js.includes(".cp-present-btn"));
ok("employer renders a header Present button in pagehead", emp.includes("cp-present-btn") && emp.includes("function presentToggle") && /function pagehead\([\s\S]*?presentBtn\(\)/.test(emp));
ok("hse renders a header Present button in pagehead", hse.includes("cp-present-btn") && hse.includes("function presentToggle") && /function pagehead\([\s\S]*?presentBtn\(\)/.test(hse));
ok("header Present toggles the shared presenter", /presentToggle\(\)\{[^}]*ContinuumPresenter\.toggle\(\)/.test(emp) && /presentToggle\(\)\{[^}]*ContinuumPresenter\.toggle\(\)/.test(hse));

// ---- worker portal: Present on every section, top of page ----
const wk = read("worker-dashboard.html");
ok("worker dashboard header has Present", /startPresent\(\)[\s\S]{0,80}Present/.test(wk));
ok("worker non-dashboard sections share a header with Present", wk.includes("function wkHeader") && /wkHeader\([\s\S]*?startPresent\(\)/.test(wk));
ok("worker Present reaches Trend, Duties, Chat, and Settings", wk.includes('wkHeader("Recovery Trend"') && wk.includes('wkHeader("My Duties"') && wk.includes('wkHeader("Chat"') && wk.includes('wkHeader("Settings"'));

console.log("\npresenter suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
