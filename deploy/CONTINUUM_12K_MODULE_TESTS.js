/* Continuum 12k module suite (Prompt 12k). node deploy/CONTINUUM_12K_MODULE_TESTS.js
   Headless: window and document shims per the standing test law, the module
   loaded in a sandbox per run. Seven hard-failing tests: install refusal with
   the missing slots named, the unboarded landing, the onboarded silence, the
   pain-8 routing phrase verification in both directions, the ordinary
   completion path, and host idempotence. Hard-fail; no em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, "CONTINUUM_12K_SIGNUP_SUBSECTION_MODULE.js"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// ---- shims and sandbox loader ----
function freshDoc() {
  const attached = [];
  return {
    body: { appendChild: n => { n._attached = true; attached.push(n); } },
    createElement: tag => {
      const el = { tag, id: "", _attached: false, remove() { this._attached = false; const i = attached.indexOf(this); if (i >= 0) attached.splice(i, 1); } };
      return el;
    },
    _attached: attached
  };
}
function load() {
  const win = {};
  const doc = freshDoc();
  const errors = [];
  const consoleShim = { error: m => errors.push(String(m)) };
  new Function("window", "document", "console", src)(win, doc, consoleShim);
  return { mod: win.Continuum12k, doc, errors };
}
function fullAdapter(overrides) {
  const calls = { registered: [], removed: [], navigated: [], mounted: [], refreshed: 0, toastReads: 0 };
  let completeCb = null;
  const a = {
    hasProfile: () => false,
    mountSignup: h => calls.mounted.push(h),
    onSignupComplete: cb => { completeCb = cb; },
    registerNavItem: (id, label, onOpen) => calls.registered.push({ id, label, onOpen }),
    removeNavItem: id => calls.removed.push(id),
    navigate: id => calls.navigated.push(id),
    refreshDashboard: () => { calls.refreshed++; },
    escalationToastText: () => { calls.toastReads++; return a._toast; },
    _toast: "",
    _calls: calls,
    _complete: r => completeCb(r)
  };
  return Object.assign(a, overrides || {});
}

// ---- test 1: install refuses with the missing slots named ----
{
  const { mod, errors } = load();
  const partial = fullAdapter();
  delete partial.refreshDashboard;
  delete partial.escalationToastText;
  const res = mod.install(partial);
  ok("refusal returns false on a partial binding", res === false);
  ok("refusal names the missing slots", errors.length === 1 && errors[0].includes("refreshDashboard") && errors[0].includes("escalationToastText"));
}

// ---- test 2: unboarded landing registers, navigates, and mounts once ----
{
  const { mod, doc } = load();
  const a = fullAdapter();
  const res = mod.install(a);
  ok("unboarded install succeeds", res === true);
  ok("Get started registered and landed on", a._calls.registered.length === 1 && a._calls.registered[0].id === "getstarted" && a._calls.registered[0].label === "Get started" && a._calls.navigated[0] === "getstarted");
  ok("wizard mounted once into one attached host", a._calls.mounted.length === 1 && doc._attached.length === 1 && a._calls.mounted[0].id === "cw12k-host");
}

// ---- test 3: onboarded silence ----
{
  const { mod, doc } = load();
  const a = fullAdapter({ hasProfile: () => true });
  const res = mod.install(a);
  ok("onboarded install registers nothing and mounts nothing", res === true && a._calls.registered.length === 0 && a._calls.navigated.length === 0 && a._calls.mounted.length === 0 && doc._attached.length === 0);
}

// ---- test 4: pain-8 completion halts without the verbatim routing phrase ----
{
  const { mod, doc, errors } = load();
  const a = fullAdapter();
  a._toast = "Your care team has been notified.";
  mod.install(a);
  a._complete({ pain: 8 });
  ok("pain-8 without the routing phrase halts the portal load", errors.some(e => e.includes("12k halt")) && a._calls.refreshed === 0 && a._calls.removed.length === 0 && doc._attached.length === 1);
}

// ---- test 5: pain-8 completion proceeds with the phrase ----
{
  const { mod, doc } = load();
  const a = fullAdapter();
  a._toast = "This check-in was escalated to the clinician per program rules.";
  mod.install(a);
  a._complete({ pain: 9 });
  ok("pain-8 with the routing phrase tears down and loads the portal", a._calls.removed[0] === "getstarted" && doc._attached.length === 0 && a._calls.refreshed === 1 && a._calls.navigated[a._calls.navigated.length - 1] === "dashboard");
}

// ---- test 6: ordinary completion never consults the toast ----
{
  const { mod, doc } = load();
  const a = fullAdapter();
  mod.install(a);
  a._complete({ pain: 3 });
  ok("ordinary completion proceeds without reading the toast", a._calls.toastReads === 0 && a._calls.refreshed === 1 && doc._attached.length === 0 && a._calls.navigated[a._calls.navigated.length - 1] === "dashboard");
}

// ---- test 7: a second open reuses the single host ----
{
  const { mod, doc } = load();
  const a = fullAdapter();
  mod.install(a);
  a._calls.registered[0].onOpen();
  ok("second open reuses one host", doc._attached.length === 1 && a._calls.mounted.length === 2 && a._calls.mounted[0] === a._calls.mounted[1]);
}

console.log("\n12k module suite: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
