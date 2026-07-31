/* Phase B legal containment gate (Prompt 39g). node --test deploy/phase-b-legal.test.mjs
   No em-dashes anywhere. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const priv = readFileSync(join(dir, "privacy.html"), "utf8");
const terms = readFileSync(join(dir, "terms.html"), "utf8");

test("single-source legal constants file exists with the right values", () => {
  assert.ok(existsSync(join(dir, "legal-config.js")));
  const cfg = readFileSync(join(dir, "legal-config.js"), "utf8");
  assert.ok(cfg.includes("ContinuumRTW Inc."));
  assert.ok(cfg.includes("craig@continuumrtw.com"));
  assert.ok(/privacyOfficer\s*:/.test(cfg));
});
for (const [name, html] of [["privacy", priv], ["terms", terms]]) {
  test(name + ": no bracketed ALL-CAPS placeholder in visible text", () => {
    assert.ok(!/\[[A-Z][A-Z ]+[A-Z]\]/.test(html), name + " still has a bracketed ALL-CAPS placeholder");
  });
  test(name + ": carries noindex meta", () => {
    assert.ok(/<meta[^>]+name="robots"[^>]+noindex/i.test(html));
  });
  test(name + ": loads the single-source legal config", () => {
    assert.ok(html.includes("legal-config.js"));
  });
  test(name + ": no stray markdown rule line", () => {
    assert.ok(!/<p>---<\/p>/.test(html));
  });
  test(name + ": em-dash clean", () => { assert.ok(!/[\u2013\u2014]/.test(html)); });
}
