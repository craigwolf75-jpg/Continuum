/* Phase B no-JS served-HTML gate (Prompt 39d). node --test deploy/phase-b-nojs-fetch.test.mjs
   Boots a plain static file server over deploy/ and fetches each public page with
   a bare HTTP client (no JS execution), proving the served bytes carry no {{ token.
   No em-dashes anywhere. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));

test("static: deploy/index.html has zero moustache tokens and no reactive script", () => {
  const home = readFileSync(join(dir, "index.html"), "utf8");
  assert.ok(!home.includes("{{"), "raw {{ token still present in index.html");
  assert.ok(!home.includes("text/x-dc"), "reactive text/x-dc script still present in index.html");
});

let server, base;
const MAP = { "/": "index.html", "/privacy": "privacy.html", "/terms": "terms.html", "/404": "404.html" };
before(async () => {
  server = createServer(async (req, res) => {
    const file = MAP[req.url] || normalize(req.url).replace(/^([/\\])+/, "");
    try { res.end(await readFile(join(dir, file))); }
    catch { res.statusCode = 404; res.end("nf"); }
  });
  await new Promise(r => server.listen(0, r));
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => server.close());

for (const path of ["/", "/privacy", "/terms", "/404"]) {
  test("no-JS fetch of " + path + " has no moustache token", async () => {
    const html = await (await fetch(base + path)).text();
    assert.ok(!html.includes("{{"), "{{ present in " + path);
  });
}
