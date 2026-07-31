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
test("no Calendly and no Nexus address anywhere on the homepage", () => {
  assert.ok(!/calendly/i.test(home));
  assert.ok(!/nexus/i.test(home));
});
test("no 15 minute call is offered", () => {
  assert.ok(!/15[ -]?min/i.test(home));
});
test("Book a demo and Start a Pilot use anchor text, not a raw URL as the label", () => {
  assert.ok(home.includes(">Book a demo<"));
  assert.ok(home.includes(">Start a Pilot<"));
  assert.ok(!/>https?:\/\//.test(home), "a raw URL is used as visible link text");
});
test("footer carries the contact email", () => {
  assert.ok(home.includes("craig@continuumrtw.com"));
});
test("contact page is em-dash clean", () => { assert.ok(!Array.from(home).some((c) => c.charCodeAt(0) === 8211 || c.charCodeAt(0) === 8212)); });

test("every Book a demo and Start a Pilot anchor resolves to the single-sourced booking URL", () => {
  const cfg = readFileSync(join(dir, "site-links.js"), "utf8");
  const cfgMatch = cfg.match(/bookingUrl\s*:\s*'([^']+)'/);
  assert.ok(cfgMatch, "bookingUrl not found in site-links.js");
  const bookingUrl = cfgMatch[1];
  const demoHrefs = [...home.matchAll(/href="([^"]+)"[^>]*>Book a demo</g)].map((m) => m[1]);
  const pilotHrefs = [...home.matchAll(/href="([^"]+)"[^>]*>Start a Pilot</g)].map((m) => m[1]);
  assert.ok(demoHrefs.length >= 2, "expected at least two Book a demo anchors");
  assert.ok(pilotHrefs.length >= 2, "expected at least two Start a Pilot anchors");
  for (const href of [...demoHrefs, ...pilotHrefs]) {
    assert.equal(href, bookingUrl, "anchor href does not match CONTINUUM_LINKS.bookingUrl");
  }
});
test("no leftover self-referential Talk to Us CTA", () => {
  assert.ok(!home.includes(">Talk to Us<"));
});
test("the CTA band references site-links.js as the single source", () => {
  assert.ok(/site-links\.js/.test(home));
});
