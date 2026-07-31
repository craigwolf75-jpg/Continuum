/* Phase B link resolution gate (Prompt 39f). node --test deploy/phase-b-links.test.mjs
   Every in-page anchor target exists; no self-referential anchors; Pricing gone.
   No em-dashes anywhere. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const home = readFileSync(join(dir, "index.html"), "utf8");

test("Pricing link is removed", () => { assert.ok(!home.includes(">Pricing<")); });

test("every in-page hash target exists on the page", () => {
  const hrefs = [...home.matchAll(/href="#([a-zA-Z0-9_-]+)"/g)].map(m => m[1]);
  for (const id of hrefs) {
    assert.ok(new RegExp('id="' + id + '"').test(home), "missing anchor target #" + id);
  }
});

test("removed anchors are not linked", () => {
  assert.ok(!home.includes('href="#signal"'), "#signal link still present");
});

test("no link scrolls to its own containing section (#cta band has no #cta link)", () => {
  // After 39e/39f the CTA band must not link to #cta; count residual #cta links.
  const ctaLinks = (home.match(/href="#cta"/g) || []).length;
  assert.equal(ctaLinks, 0, "self-referential #cta links remain: " + ctaLinks);
});

test("audience links resolve to real sections", () => {
  assert.ok(home.includes('href="#roles"'));
  assert.ok(home.includes('href="#doctrine"'));
});

test("links page is em-dash clean", () => { assert.ok(!/[\u2013\u2014]/.test(home)); });
