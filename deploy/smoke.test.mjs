/* Continuum deployment smoke gate (Mission S13c). node deploy/smoke.test.mjs
   For every interactive surface: the inline script must PARSE (a syntax error
   here is a deploy that renders blank, so it fails the build), the mount element
   must exist, and the three-layer resilience markers must be present: a live
   read (localStorage.getItem), a degradation path (try/catch), and a render
   path. Hard-fail: any FAIL exits nonzero. No em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

// Extract the inline <script> (the tag with no attributes) and parse-check it.
function parses(html, label) {
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) { ok(label + ": has an inline script", false); return; }
  try { new Function(m[1]); ok(label + ": inline script parses", true); }
  catch (e) { ok(label + ": inline script parses [" + e.message + "]", false); }
}

const PORTALS = ["worker-dashboard", "employer-dashboard", "hse-portal", "clinical-dashboard", "wcb-portal", "admin-portal"];
for (const p of PORTALS) {
  const h = read(p + ".html");
  parses(h, p);
  ok(p + ": has the #main mount element", /id="main"/.test(h));
  ok(p + ": defines a render path", /function render\s*\(/.test(h));
  ok(p + ": reads live state (localStorage.getItem)", /localStorage\.getItem/.test(h));
  ok(p + ": has a degradation path (try/catch)", /try\s*\{[\s\S]*?catch\s*\(/.test(h));
}

// the remaining interactive surfaces must at least parse (deployable)
parses(read("hub/index.html"), "hub");
parses(read("worker-embed.html"), "worker-embed");
parses(read("continuum_workflow_app.html"), "continuum_workflow_app");

// the shared bridge module must parse on its own
try { new Function(read("bridge.js")); ok("bridge.js parses", true); }
catch (e) { ok("bridge.js parses [" + e.message + "]", false); }

ok("smoke surfaces dash clean", !PORTALS.some(p => /[–—]/.test(read(p + ".html"))));

// Prompt 36: homepage hero background video
const home = read("index.html");
ok("hero uses the background video", home.includes('class="hero-vid"') && home.includes('src="/hero-video.mp4"'));
ok("hero mockups removed", !home.includes("Good morning, Marcus") && !home.includes("hub.continuum.ca") && !home.includes("product vignette"));
ok("hero copy preserved", home.includes("Continuum begins.") && home.includes(">Sign In<") && home.includes(">See How It Works<"));
ok("hero has overlay and reduced-motion path", home.includes("hero-overlay") && home.includes("prefers-reduced-motion"));
ok("hero video is autoplay muted playsinline", home.includes("autoplay") && home.includes("muted") && home.includes("playsinline"));
ok("homepage dash clean", !/[–—]/.test(home));

console.log("\nsmoke suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
