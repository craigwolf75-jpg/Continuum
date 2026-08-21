/* Phase B contact wiring gate (Prompt 39e). node --test deploy/phase-b-contact.test.mjs
   No em-dashes anywhere. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const home = readFileSync(join(dir, "index.html"), "utf8");

test("single booking-URL source exists", () => {
  assert.ok(existsSync(join(dir, "site-links.js")));
  const cfg = readFileSync(join(dir, "site-links.js"), "utf8");
  assert.ok(/bookingUrl\s*:/.test(cfg));
});
test("Calendly is the booking source; no Nexus reference (Prompt 67)", () => {
  assert.ok(/calendly\.com\/craig-continuumrtw/.test(home), "the Continuum Calendly booking URL should be present");
  assert.ok(!/nexus/i.test(home));
});
test("no 15 minute call is offered", () => {
  assert.ok(!/15[ -]?min/i.test(home));
});
test("the booking CTA uses anchor text, not a raw URL as the label (Prompt 67)", () => {
  assert.ok(home.includes(">Talk to Our Team<"));
  assert.ok(!/>https?:\/\//.test(home), "a raw URL is used as visible link text");
});
test("footer carries the contact email", () => {
  assert.ok(home.includes("info@continuumrtw.com"));
});
test("contact page is em-dash clean", () => { assert.ok(!Array.from(home).some((c) => c.charCodeAt(0) === 8211 || c.charCodeAt(0) === 8212)); });

test("the contact route is the single-sourced Calendly booking URL (Prompt 67)", () => {
  const m = home.match(/contact:\s*"([^"]+)"/);
  assert.ok(m, "ROUTES.contact not found");
  assert.ok(/calendly\.com\/craig-continuumrtw/.test(m[1]), "ROUTES.contact should be the Calendly booking URL");
});
test("no leftover self-referential Talk to Us CTA", () => {
  assert.ok(!home.includes(">Talk to Us<"));
});
test("links are single-sourced in a ROUTES object (Prompt 67)", () => {
  assert.ok(/ROUTES\s*=\s*\{/.test(home));
});
