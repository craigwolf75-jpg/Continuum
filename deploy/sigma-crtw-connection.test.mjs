/* Prompt 34 suite for sigma-crtw-connection.html.
 * No dependencies. Run: node deploy/sigma-crtw-connection.test.mjs
 * Asserts the main page, the seven-screen guided presentation, the reusable
 * component registry, the honesty seams, and isolation from the portal keys. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, "sigma-crtw-connection.html"), "utf8");
const low = html.toLowerCase();

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) pass++; else { fail++; console.error("  FAIL: " + name); } }
function count(re) { return (html.match(re) || []).length; }

/* 1. Main page: message, metrics, visual, journey, flows, privacy, disclaimer */
ok("system name is SIGMA-RH (D13)", html.includes('SYS = "SIGMA-RH"'));
ok("Proposed workflow label pinned", html.includes("Proposed workflow"));
ok("primary message: incident and claim record", html.includes("manages the incident and claim record"));
ok("primary message: one connected journey", html.includes("one connected journey"));
ok("four demonstration metrics", count(/\{n:"/g) === 4);
ok("metrics labeled demonstration data", html.includes("Demonstration data"));
ok("SIGMA panel: seven record items", /sigmaItems:\s*\[([^\]]*)\]/.test(html) && (html.match(/sigmaItems:\s*\[([^\]]*)\]/)[1].match(/"/g).length/2) === 7);
ok("CRTW panel: eight recovery items", /crtwItems:\s*\[([^\]]*)\]/.test(html) && (html.match(/crtwItems:\s*\[([^\]]*)\]/)[1].match(/"/g).length/2) === 8);
ok("exchange method to be confirmed", html.includes("Method to be confirmed"));
ok("four possible methods, none final", /methods:\s*\[([^\]]*)\]/.test(html) && (html.match(/methods:\s*\[([^\]]*)\]/)[1].match(/"/g).length/2) === 4);
ok("five step journey", html.includes("five step journey"));
ok("ten inbound reference fields", /inbound:\s*\[([^\]]*)\]/.test(html) && (html.match(/inbound:\s*\[([^\]]*)\]/)[1].match(/"/g).length/2) === 10);
ok("eleven prepared return fields", /preparedReturn:\s*\[([^\]]*)\]/.test(html) && (html.match(/preparedReturn:\s*\[([^\]]*)\]/)[1].match(/"/g).length/2) === 11);
ok("privacy: allowed column", html.includes("Allowed to cross"));
ok("privacy: protected column", html.includes("Protected, never crosses"));
ok("privacy panel title", html.includes("The right information for the right person"));
ok("disclaimer: no live integration", html.includes("No live integration exists"));
ok("start presentation button", html.includes("Start GardaWorld Demonstration"));

/* 2. Reusable component registry: nine components from one data object */
ok("nine registry components", count(/\{cn:"/g) === 9);
ok("field mapping is one reusable component", html.includes("function fieldMapping"));
ok("field mapping used four times", count(/fieldMapping\(/g) >= 4);
ok("integration errors honest empty state", html.includes("no exchange attempted"));
ok("documents: unapproved never exchanged", html.includes("never exchanged"));
ok("write path awaiting technical discovery", html.includes("awaiting technical discovery"));

/* 3. Seven-screen guided presentation and navigation contract */
ok("seven screens", count(/notes:\[/g) === 7);
ok("go() clamps lower bound", html.includes("if(i<0)i=0"));
ok("go() clamps upper bound", html.includes("i>SCREENS.length-1"));
ok("prev disabled at first screen", html.includes("idx===0"));
ok("next disabled at last screen", html.includes("idx===SCREENS.length-1"));
ok("previous, next, exit controls", html.includes(">Previous<") && html.includes(">Next<") && html.includes(">Exit<"));
ok("progress marker n of screens", html.includes('"Screen "+(idx+1)+" of "+SCREENS.length'));
ok("hideable presenter notes toggle", html.includes("function toggleNotes") && html.includes("notesHidden"));

/* 4. Demonstration case and the human gates */
ok("Jordan Miller demonstration case", html.includes("Jordan Miller"));
ok("labeled Demonstration Case throughout", count(/Demonstration Case/g) >= 3);
ok("create-case confirmation", html.includes("Demonstration case created for"));
ok("human-review banner", html.includes("Human review."));
ok("human-attributed approval", html.includes("Approved by") && html.includes("Priya Anand"));
ok("employer view shown by absence", html.includes("deliberately does not carry"));
ok("review-before-changes rule", html.includes("Review before changes."));

/* 5. Final screen honesty: timestamped, prepared not written, share view */
ok("final screen timestamped", html.includes("new Date(") && html.includes('id="stamp"'));
ok("final button reads View Information Being Shared", html.includes("View Information Being Shared"));
ok("language says prepared and ready", html.includes("prepared and ready"));
ok("no completed-transfer claim: SIGMA-HR absent", !html.includes("SIGMA-HR"));
ok("no completed-transfer claim: not automatically updated", !low.includes("automatically updated"));
ok("no completed-transfer claim: nothing synced or transferred", !/\bsynced to\b/i.test(html) && !/\btransferred to\b/i.test(html));

/* 6. Isolation: own key, no portal/bridge/store keys */
ok("own storage key", html.includes("continuum_sigma_demo_v1"));
ok("no store key", !html.includes("continuum_demo_state_v2"));
ok("no bridge key", !html.includes("continuum_worker_bridge_v1") && !html.includes("ContinuumBridge"));
ok("no portal keys", !html.includes("continuum_admin_v1") && !html.includes("continuum_board_portal_v1") && !html.includes("continuum_clinical_v1") && !html.includes("continuum_employer_v1") && !html.includes("continuum_hse_portal_v1") && !html.includes("continuum_worker_dash_v1"));

/* 7. Dash audit: no em-dash or en-dash anywhere */
ok("dash audit clean (no em/en dash)", !/[–—]/.test(html));

console.log("\nsigma-crtw-connection suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
