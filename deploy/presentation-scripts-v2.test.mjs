/* Continuum presentation scripts v2 probe (Prompt 35d). node deploy/presentation-scripts-v2.test.mjs
   Asserts the v2 scripts supersede v1 for the voice: eight portal scripts in
   presentation order, forty four bold section narrations, two expected
   questions and a handoff per portal, every canon number in its spoken form,
   the vocabulary laws verbatim, the walls held (Cardinal and Marcus absent
   from the employer block), the agent id in the update instruction, and both
   35d deliverables dash-clean. Hard-fail; no em-dashes anywhere. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const dir = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(dir, "..", "specs", f), "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const s = read("CONTINUUM_PRESENTATION_SCRIPTS_V2.md");
const companion = read("CONTINUUM_PROMPT_35d.md");

// supersession and frame
ok("v2 declares it supersedes the v1 scripts", s.includes("supersedes CONTINUUM_PRESENTATION_SCRIPTS.md"));
ok("room-running pattern present", s.includes("Gary drives the screens. The agent narrates."));
ok("timing guide present", s.includes("three minutes per portal") && s.includes("twenty five minutes"));
ok("presentation opening present", s.includes("## Opening the presentation"));
ok("presentation closing present", s.includes("## Closing the presentation"));

// eight portals, in presentation order
const PORTALS = ["The worker app", "The employer dashboard", "The HSE portal (the coordinator's seat)", "The clinical dashboard", "The board portal", "The SIGMA connection page", "The SIGMA portal", "The admin portal"];
PORTALS.forEach((t, i) => ok("portal " + (i + 1) + " present and ordered: " + t, s.includes("## PORTAL " + (i + 1) + ": " + t)));
const idx = PORTALS.map((t, i) => s.indexOf("## PORTAL " + (i + 1) + ": " + t));
ok("portal order strictly increasing", idx.every((v, i) => v >= 0 && (i === 0 || v > idx[i - 1])));
const block = i => s.slice(idx[i], i < 7 ? idx[i + 1] : s.indexOf("## Closing the presentation"));

// structure counts: forty four section narrations, two questions and a handoff per portal
const bodyPortals = s.slice(idx[0]);
ok("forty four section narrations across the eight portals", (bodyPortals.match(/\n\*\*[^*\n]+\*\*/g) || []).length === 44);
ok("two expected questions per portal (16 total)", (s.match(/\nQ: "/g) || []).length === 16);
ok("a spoken handoff between portals (7 seams for 8 portals)", (s.match(/### Handoff/g) || []).length === 7);
ok("one line to emphasize per portal (8 total)", (s.match(/### The one line to emphasize/g) || []).length === 8);

// canon numbers, spoken forms
ok("HSE: seven open cases", s.includes("Seven open cases"));
ok("HSE: seventy eight percent completion", s.includes("seventy eight percent check-in completion"));
ok("board: nineteen open claims, seven waiting", s.includes("Nineteen open claims, seven of them waiting to be acknowledged"));
ok("clinical: twenty four active cases", s.includes("Twenty four active cases"));
ok("clinical: Marcus day nine of twenty one, pain four, mobility six", block(3).includes("day nine of a twenty one day program") && block(3).includes("pain today is four") && block(3).includes("mobility is six"));
ok("HSE: Tyler Cardinal at day eighteen", block(2).includes("Tyler Cardinal") && block(2).includes("day eighteen"));
ok("SIGMA connection: Jordan Miller GW-2026-1048", block(5).includes("Jordan Miller") && block(5).includes("GW-2026-1048"));
ok("admin: tenant counts", block(7).includes("Worley with seven seats") && block(7).includes("GardaWorld with twelve") && block(7).includes("Ledcor with five"));
ok("SIGMA connection: thirty five thousand employees", block(5).includes("thirty five thousand"));
ok("occupational database set complete", block(5).includes("forty five positions") && block(5).includes("fifty tasks") && block(5).includes("twenty seven demand factors") && block(5).includes("fourteen injury profiles") && block(5).includes("two hundred nine pre-matched duties") && block(5).includes("twenty six categories") && block(5).includes("twenty two code restriction system"));

// vocabulary laws, verbatim, on their surfaces
ok("routing law in worker, HSE, and clinical scripts (escalated or escalates)", [0, 2, 3].every(i => /escalat\w+ to the clinician per program rules/.test(block(i))));
ok("gold, never red anchors the worker script", block(0).includes("gold, never red") && block(0).includes('"Gold, never red."'));
ok("prepared and held anchors both SIGMA scripts", block(5).includes("prepared and held") && block(6).includes("prepared and held"));
ok("proposed said out loud before the SIGMA walk", block(5).includes("one word said out loud: proposed"));
ok("absence named only as an absence in the employer script", block(1).includes("names it as an absence, and only as an absence"));
ok("staging line preserved in the admin script", block(7).includes("Predictive capability is built into the platform and switched off. Four independent gates must all be opened before any score appears anywhere"));
ok("pricing and legal go to Gary by name", s.includes("goes to Gary by name") && s.includes("pricing and terms are for Gary"));

// the walls, held under expansion
ok("Cardinal absent from the employer script block", !block(1).includes("Cardinal"));
ok("no worker name in the employer script block", !block(1).includes("Marcus") && !block(1).includes("Jordan") && !block(1).includes("Tyler"));
ok("board block carries no check-in scores", !/pain (of|score|today)/.test(block(4)));

// the update instruction
ok("agent id present in the update instruction", s.includes("## Updating the voice agent") && s.slice(s.indexOf("## Updating the voice agent")).includes("agent_8301ky420pc9f4e8ekswyekptnf2"));
ok("update keeps the scripts first in the knowledge pack", s.includes("keeping it first in the list"));
ok("update touches no portal", s.includes("No change is needed in any portal"));
ok("rehearsal gate rerun instructed", s.includes("Rerun the rehearsal gate from the 35c runbook"));

// register laws on both deliverables
ok("v2 scripts dash clean", !/[–—]/.test(s));
ok("35d companion dash clean", !/[–—]/.test(companion));
ok("companion names the probe suite", companion.includes("presentation-scripts-v2.test.mjs"));

console.log("\npresentation-scripts-v2 suite: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
