/* Phase B Task 6 gate suite (Prompt 39c gate extension). node --test deploy/phase-b-gate.test.mjs
   Proves the EXISTING hub gate (decideHubAccess, deploy/middleware.js) now
   also covers the two mechanism demo pages, /continuum_workflow_app and
   /worker-embed.html: blocked with no session, allowed with ANY valid hub
   session (any group, including admin), and still blocked on a suspicious
   (encoded/traversal) path variant even with a valid session, via the
   existing isSuspiciousPath guard. Also proves the static config: robots.txt
   disallows both paths, and vercel.json carries a noindex header for both
   and still parses as valid JSON. This does not touch or re-test the SITE
   gate (decideSiteAccess) or the existing group/admin portal mapping; those
   are covered by site-middleware.test.mjs and hub-middleware-access.test.mjs
   and are left unchanged. No dashes anywhere. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decideHubAccess } from "./middleware.js";

const dir = dirname(fileURLToPath(import.meta.url));

function session(group) {
  return { sub: "u1", email: "e@x.com", group, iat: 0, exp: 9999999999 };
}

test("mechanism pages are blocked with no hub session", () => {
  assert.equal(decideHubAccess("/continuum_workflow_app", null), "blocked");
  assert.equal(decideHubAccess("/worker-embed.html", null), "blocked");
});

test("mechanism pages allow any authenticated group, including admin", () => {
  for (const group of ["group1", "group2", "admin"]) {
    assert.equal(decideHubAccess("/continuum_workflow_app", session(group)), "allow");
    assert.equal(decideHubAccess("/worker-embed.html", session(group)), "allow");
  }
});

test("a suspicious path variant is blocked even with a valid session", () => {
  assert.equal(decideHubAccess("/continuum_workflow_app%2e%2e/x", session("group1")), "blocked");
});

test("middleware.js source mentions both mechanism paths", () => {
  const mw = readFileSync(join(dir, "middleware.js"), "utf8");
  assert.ok(mw.includes("continuum_workflow_app"));
  assert.ok(mw.includes("worker-embed"));
});

test("robots.txt disallows both mechanism paths", () => {
  const r = readFileSync(join(dir, "robots.txt"), "utf8");
  assert.ok(r.includes("Disallow: /continuum_workflow_app"));
  assert.ok(r.includes("Disallow: /worker-embed.html"));
});

test("vercel.json noindexes both mechanism paths and stays valid JSON", () => {
  const raw = readFileSync(join(dir, "vercel.json"), "utf8");
  const parsed = JSON.parse(raw);
  assert.ok(Array.isArray(parsed.headers));
  const hasEntry = (source) =>
    parsed.headers.some(
      (h) =>
        h.source === source &&
        Array.isArray(h.headers) &&
        h.headers.some((hh) => hh.key === "X-Robots-Tag" && hh.value === "noindex, nofollow")
    );
  assert.ok(hasEntry("/continuum_workflow_app"));
  assert.ok(hasEntry("/worker-embed.html"));
});
