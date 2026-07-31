/* Phase B homepage teaser gate (Prompt 39c). node --test deploy/phase-b-homepage.test.mjs
   Static assertions over the served homepage bytes. No em-dashes anywhere. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const home = readFileSync(join(dir, "index.html"), "utf8");

test("no worker-embed iframe on the homepage", () => {
  assert.ok(!/worker-embed\.html/.test(home));
  assert.ok(!/<iframe/i.test(home));
});
test("the two embed links are gone", () => {
  assert.ok(!home.includes("Open the full demo"));
  assert.ok(!home.includes("Open full screen"));
});
test("Workflow Demo link absent from nav and footer", () => {
  assert.ok(!home.includes("Workflow Demo"));
  assert.ok(!home.includes("/continuum_workflow_app"));
});
test("teaser line and Book a demo present, image slot is swappable", () => {
  assert.ok(home.includes("See it live in a 30 or 45 minute demo"));
  assert.ok(home.includes(">Book a demo<"));
  assert.ok(home.includes('data-teaser-image="pending"'));
});
test("hero locked lines unchanged", () => {
  assert.ok(home.includes("The new standard for workplace injury management"));
  assert.ok(home.includes("Where care ends,"));
  assert.ok(home.includes("Continuum begins."));
});
test("three outcome statements replace How it works mechanics", () => {
  assert.ok(home.includes("The worker stays supported every day."));
  assert.ok(home.includes("The employer always knows what work is safe."));
  assert.ok(home.includes("The doctor decides with better information."));
});
test("mechanism and interface vocabulary removed from the homepage", () => {
  // NOTE: "check-in" was adjusted to "thirty-second check-in" (2026-07-30).
  // The locked hero paragraph (untouched by this task) reads "daily check-ins,"
  // which is a substring match for a bare "check-in". The hero is a global
  // constraint this task must not edit, so the assertion targets the exact
  // mechanism phrase that lived in the try-app section this task replaced,
  // instead of the generic substring.
  for (const term of ["slider", "thirty-second check-in", "cadence", "No overhead work", "Safe duties, matched", "SiteDocs", "Salus", "Cority", "Intelex"]) {
    assert.ok(!home.includes(term), "still present: " + term);
  }
});
test("AI section trimmed to headline plus one supporting sentence", () => {
  assert.ok(home.includes("AI tracks."));
  assert.ok(home.includes("Clinicians decide."));
  assert.ok(!home.includes("aiDoes") && !home.includes("aiNever"));
});
test("no banned clinical-authority terms", () => {
  for (const bad of ["predicts", "readiness score", "regression detected", "clinical review recommended", "clears for duty"]) {
    assert.ok(!home.toLowerCase().includes(bad.toLowerCase()), "banned term present: " + bad);
  }
});
test("homepage is em-dash clean", () => { assert.ok(!/[\u2013\u2014]/.test(home)); });
