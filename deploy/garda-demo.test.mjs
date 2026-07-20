/* Prompt 20 headless doctrine suite for garda-demo.html.
 * No dependencies. Run: node deploy/garda-demo.test.mjs
 * Asserts the fourteen-scene structure, navigation contract, and every
 * Prompt 19 doctrine repair against the script content in the source file. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, "garda-demo.html"), "utf8");
const low = html.toLowerCase();

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error("  FAIL: " + name); }
}
function count(re) { return (html.match(re) || []).length; }
function region(startKey, endKey) {
  const a = html.indexOf(startKey);
  if (a < 0) return "";
  const b = html.indexOf(endKey, a + startKey.length);
  return html.slice(a, b < 0 ? html.length : b);
}

/* 1. Structure: fourteen scenes, each with the four layers */
ok("fourteen scenes", count(/\{kicker:"/g) === 14);
ok("every scene has narration", count(/narration:/g) === 14);
ok("every scene has notes", count(/notes:\[/g) === 14);
ok("every scene has smarter chips", count(/smarter:\[/g) === 14);
ok("no vignette placeholders shipped (all keyed)", count(/"[a-z-]+":\s*\n?\s*'/g) >= 14);

/* 2. Navigation contract: bounds + keyboard */
ok("go() clamps lower bound", html.includes("if(i<0)i=0"));
ok("go() clamps upper bound", /i>(order|SCENES)\.length-1/.test(html));
ok("arrow-key navigation", html.includes("ArrowRight") && html.includes("ArrowLeft"));
ok("prev disabled at first scene", html.includes("idx===0"));
ok("next disabled at last scene", /idx===(order|SCENES)\.length-1/.test(html));
ok("print handout, one scene per page", html.includes("page-break-after") && low.includes("window.print"));

/* 2b. Masking-beat reorder toggle (Prompt 19 section 4) */
ok("firewall-first toggle present", html.includes('id="privmode"') && html.includes("function setMode"));
ok("standard order covers all fourteen scenes", /standard:\[0,1,2,3,4,5,6,7,8,9,10,11,12,13\]/.test(html));
ok("privacy order front-loads masking (6) and escalation (10)", /privacy:\[0,1,5,9,/.test(html));

/* 3. Scene 6 split: employer half carries NO intelligence label (mechanical) */
const split = region('"checkin-split":', '"employer":');
const marker = "Employer, same second";
const clinicianSide = split.slice(0, split.indexOf(marker));
const employerSide = split.slice(split.indexOf(marker));
const INTEL = /plateau|regression|escalat/i;
ok("split: clinician side carries the intelligence", INTEL.test(clinicianSide));
ok("split: employer side carries NO intelligence label", !INTEL.test(employerSide));
ok("split: employer side speaks functionally", /light duty|on track|under review/i.test(employerSide));

/* 4. Routing sentence present in both risk scenes (check-in split + escalation) */
const ROUTING = /escalated to the clinician per program rules/i;
const escalation = region('"escalation":', '"executive":');
ok("routing sentence in the check-in split", ROUTING.test(split));
ok("routing sentence in the escalation scene", ROUTING.test(escalation));

/* 5. Device-boundary disclaimer verbatim (scene 10) */
ok("device-boundary line present",
  low.includes("tracking and visualization with independent clinician review") &&
  low.includes("no scoring, no prediction, no alerts that alter treatment"));

/* 6. Predictive badged as roadmap / illustrative (scene 11) */
const exec = region('"executive":', '"sigma":');
ok("executive predictive badged roadmap and illustrative",
  /roadmap/i.test(exec) && /illustrative/i.test(exec));

/* 7. SIGMA double-labeled: illustrative mock + intake level (scene 12) */
const sigma = region('"sigma":', '"timeline":');
ok("SIGMA labeled illustrative", /illustrative/i.test(sigma));
ok("SIGMA labeled intake level, not bidirectional",
  /intake level/i.test(sigma) && /not a live bidirectional/i.test(sigma));

/* 8. SMS content rule (scene 3) */
ok("SMS content rule stated",
  low.includes("doorbell, never the letter") &&
  low.includes("no diagnosis, scores, or restrictions in the message"));

/* 9. Morning duty acknowledgement as timestamped compliance artifact (scene 5) */
ok("morning acknowledgement present",
  html.includes("I understand my duties today") &&
  low.includes("timestamped") &&
  low.includes("safety culture, instrumentation, and legal defense"));

/* 10. Fatigue and confidence carried in the check-in narration */
const scene6 = region('kicker:"The keystroke"', 'kicker:"The next morning"');
ok("check-in narration carries fatigue and confidence", /fatigue and confidence/i.test(scene6));

/* 11. Closing line, verbatim (scene 14) */
ok("closing line verbatim",
  html.includes("Everyone made better decisions because everyone had better information"));

/* 12. Cast canon */
ok("cast: Marcus Bedard", html.includes("Marcus Bedard"));
ok("cast: Dr. A. Owusu", html.includes("Dr. A. Owusu") || html.includes("Dr. Owusu"));
ok("cast: claim NX-2026-00481", html.includes("NX-2026-00481"));
ok("cast: day twenty one / 21", /day (twenty one|21)/i.test(html));
ok("cast: expected full duty Jul 31", /jul 31/i.test(low));

/* 13. Six LIVE SYSTEM chips */
ok("six live-system pointers", count(/live:\{tag:/g) === 6);

/* 14. Dash audit: no em-dash or en-dash anywhere in the file */
ok("dash audit clean (no em/en dash)", !/[–—]/.test(html));

console.log("\ngarda-demo doctrine suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
