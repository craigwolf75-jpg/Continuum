/* Phase B Task 6 gate suite. node --test deploy/phase-b-gate.test.mjs
   Proves the EXISTING hub gate (decideHubAccess, deploy/middleware.js) covers
   /worker-embed.html: blocked with no session, allowed with ANY valid hub
   session (any group, including admin), and still blocked on a suspicious
   (encoded/traversal) path variant even with a valid session. continuum_workflow_app
   is retired and is no longer a live mechanism path. Also proves robots.txt
   and vercel.json still noindex worker-embed. No dashes anywhere. */
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

test("worker-embed is blocked with no hub session", () => {
  assert.equal(decideHubAccess("/worker-embed.html", null), "blocked");
});

test("worker-embed allows any authenticated group, including admin", () => {
  for (const group of ["group1", "group2", "admin"]) {
    assert.equal(decideHubAccess("/worker-embed.html", session(group)), "allow");
  }
});

test("a suspicious path variant is blocked even with a valid session", () => {
  assert.equal(decideHubAccess("/worker-embed.html%2e%2e/x", session("group1")), "blocked");
});

test("retired workflow app is not a hub-gated mechanism path", () => {
  assert.equal(decideHubAccess("/continuum_workflow_app", null), "allow");
  const mw = readFileSync(join(dir, "middleware.js"), "utf8");
  assert.ok(!mw.includes('"/continuum_workflow_app"'));
});

test("middleware.js source still mentions worker-embed", () => {
  const mw = readFileSync(join(dir, "middleware.js"), "utf8");
  assert.ok(mw.includes("worker-embed"));
});

test("robots.txt disallows worker-embed and not the retired workflow app", () => {
  const r = readFileSync(join(dir, "robots.txt"), "utf8");
  assert.ok(r.includes("Disallow: /worker-embed.html"));
  assert.ok(!r.includes("Disallow: /continuum_workflow_app"));
});

test("vercel.json noindexes worker-embed, not the retired workflow app, and stays valid JSON", () => {
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
  assert.ok(!hasEntry("/continuum_workflow_app"));
  assert.ok(hasEntry("/worker-embed.html"));
});
