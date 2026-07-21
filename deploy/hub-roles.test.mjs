/* Continuum hub role select suite (Prompt 33). node deploy/hub-roles.test.mjs
   Gates the deterministic parts of the React plus Framer Motion redesign: the
   built bundle exists and exposes its mount, the six cards are in order with
   unchanged routing and copy, the design tokens are present, gold is a state
   (hover, focus, press, current role), motion is session-once with a
   reduced-motion fallback, and accessibility and the no-layout-shift border
   hold. Visual match to Figma and the motion feel are verified in the browser,
   not here. Hard-fail; no em-dashes anywhere. */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const src = read(join("..", "hub-roles", "src", "main.jsx"));
const bundlePath = join(dir, "hub", "roles.js");
const hub = read(join("hub", "index.html"));

// bundle built and wired
ok("built bundle deploy/hub/roles.js exists", existsSync(bundlePath));
const bundle = readFileSync(bundlePath, "utf8");
ok("bundle exposes ContinuumRolesView", bundle.includes("ContinuumRolesView"));
ok("bundle is non-trivial (React + Framer Motion inlined)", bundle.length > 50000);
ok("hub loads the bundle", hub.includes('src="/hub/roles.js"'));
ok("hub mounts React for the roles view", hub.includes("ContinuumRolesView.mount"));
ok("hub keeps a graceful vanilla fallback", hub.includes("host.innerHTML=rolesView()"));
ok("hub loads Instrument Sans", hub.includes("Instrument+Sans"));

// six cards, correct order, unchanged routing and copy
const order = ["Worker", "HSE", "Employer", "Nexus Health", "WCB", "Platform Admin"];
const idx = order.map(t => src.indexOf('title: "' + t + '"'));
ok("all six cards present in order", idx.every((v, i) => v > 0 && (i === 0 || v > idx[i - 1])));
const navs = { "/worker-dashboard.html": 1, "/hse-portal.html": 1, "/employer-dashboard.html": 1, "/clinical-dashboard.html": 1, "/wcb-portal.html": 1, "/admin-portal.html": 1 };
ok("routing unchanged: each card links to its portal", Object.keys(navs).every(n => src.includes('nav: "' + n + '"')));
ok("worker copy unchanged", src.includes("Your space for recovery. Do a quick check-in"));
ok("employer copy unchanged", src.includes("Functional status only, never medical detail"));

// design tokens
["#0E1A2F", "#182642", "#26375C", "#E8A33D", "#DFE7F4", "#8FA3C2", "#22314F"].forEach(hex =>
  ok("token present " + hex, src.includes(hex)));

// gold is a state, not static; Worker not special
ok("gold is a state (hover, focus, press, or current)", /const active = hover \|\| focus \|\| press \|\| current/.test(src));
ok("active card uses the gold border and title", src.includes("active ? T.gold : T.borderRest") && src.includes("active ? T.gold : T.titleRest"));
ok("no per-card hardcoded gold for Worker", !/roleKey: "worker"[\s\S]{0,120}gold/i.test(src));
ok("worker static gold removed from the hub fallback css", !hub.includes(".role-worker h3{color:var(--gold)}"));

// no layout shift + 180ms transition
ok("border is a constant 1.5px in both states", src.includes("border:1.5px solid"));
ok("border-color and color transition over 180ms ease", src.includes("border-color 180ms ease") && src.includes("color 180ms ease"));

// motion: session-once, reduced-motion fallback, non-interactive mid flight
ok("plays once per session via continuum_hub_intro_played", src.includes("continuum_hub_intro_played"));
ok("current role remembered via continuum_hub_current_role", src.includes("continuum_hub_current_role"));
ok("reduced-motion honored (short fade and rise, no swirl)", src.includes("useReducedMotion") && /if \(reduced\)/.test(src));
ok("cards non-interactive until landed", src.includes('pointerEvents = "none"') && src.includes('pointerEvents = "auto"'));
ok("staggered drop (i times 0.07s) with a spring settle", src.includes("i * 70") && src.includes('type: "spring", bounce: 0.35'));
ok("swirl radius 400 and 300 degree sweep", src.includes("R = 400") && src.includes("300 * DEG"));

// accessibility
ok("each card is a link with an accessible name equal to its title", src.includes('href={card.nav}') && src.includes('aria-label={card.title}'));
ok("focus is visible", src.includes(":focus-visible"));

// dash rule
ok("main.jsx dash clean", !/[–—]/.test(src));
ok("built bundle dash clean", !/[–—]/.test(bundle));

console.log("\nhub-roles suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
