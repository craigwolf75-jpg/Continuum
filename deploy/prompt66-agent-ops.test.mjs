/* Continuum Prompt 66 Agent Operations suite.
   node deploy/prompt66-agent-ops.test.mjs
   Proves the local Steering Dispatcher console: no public Vercel exposure,
   SYNTH finding human flow, autonomy refuse, observation writes only
   heartbeat plus findings, retrieval authorizer gate, FILE ONLY schema
   landing, loopback bind, and Section 1 inventory. Hard-fail: any FAIL
   exits nonzero. No extra deps. No em dashes or en dashes anywhere. */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const agentOps = join(root, "internal", "agent-ops");

function walkFiles(base, pred) {
  const out = [];
  if (!existsSync(base)) return out;
  (function rec(cur) {
    for (const entry of readdirSync(cur, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = join(cur, entry.name);
      if (entry.isDirectory()) { rec(full); continue; }
      if (pred(entry.name, full)) out.push(full);
    }
  })(base);
  return out;
}

const EXPOSURE_RE = /agent-ops|agent_findings|agent_tasks|\/api\/agents/;

// 1. Public exposure: deploy product files must not reference the console.
const vercelJson = readFileSync(join(here, "vercel.json"), "utf8");
const middlewareSrc = readFileSync(join(here, "middleware.js"), "utf8");
ok("deploy/vercel.json has no agent-ops / agent_findings / agent_tasks / /api/agents", !EXPOSURE_RE.test(vercelJson));
ok("deploy/middleware.js has no agent-ops / agent_findings / agent_tasks / /api/agents", !EXPOSURE_RE.test(middlewareSrc));

const htmlFiles = walkFiles(here, (name) => name.endsWith(".html"));
const apiJsFiles = walkFiles(join(here, "api"), (name) => name.endsWith(".js"));
ok("deploy html walk found files", htmlFiles.length > 0);
ok("deploy api js walk found files", apiJsFiles.length > 0);
for (const f of htmlFiles.concat(apiJsFiles)) {
  const rel = relative(here, f).split(sep).join("/");
  const text = readFileSync(f, "utf8");
  ok(rel + ": no agent-ops / agent_findings / agent_tasks / /api/agents", !EXPOSURE_RE.test(text));
}
ok("internal/ is outside the Vercel deploy root", existsSync(agentOps) && !existsSync(join(here, "agent-ops")));

const {
  createStore,
  DEFAULT_INVENTORY,
  isNamedHuman
} = await import("../internal/agent-ops/lib/store.mjs");
const {
  createZeus,
  tryAutonomousChange,
  receiveDispatch
} = await import("../internal/agent-ops/lib/zeus.mjs");
const { runObservation } = await import("../internal/agent-ops/lib/observation.mjs");
const { queueRetrieval } = await import("../internal/agent-ops/lib/retrieval.mjs");

// 8. Inventory seed matches Section 1: 7 runtime + 3 contract-only classes.
const inventoryStore = createStore({ seed: true });
const seeded = inventoryStore.listAgents();
const runtime = seeded.filter((a) => a.runtime_status === "RUNTIME_IMPLEMENTED");
const contract = seeded.filter((a) => a.runtime_status === "CONTRACT_ONLY");
const ids = seeded.map((a) => a.identifier).sort();
const expectedIds = ["apollo", "argus", "athena", "calliope", "firecrawl-retrieval", "heracles", "hermes", "judge", "presenter", "zeus"].sort();
ok("DEFAULT_INVENTORY has 10 rows", Array.isArray(DEFAULT_INVENTORY) && DEFAULT_INVENTORY.length === 10);
ok("seeded store has 10 agents", seeded.length === 10);
ok("7 RUNTIME IMPLEMENTED", runtime.length === 7);
ok("3 CONTRACT ONLY classes", contract.length === 3);
ok("identifiers match Section 1 only", JSON.stringify(ids) === JSON.stringify(expectedIds));
ok("runtime names are the seven Continuum personas",
  runtime.every((a) => ["zeus", "athena", "apollo", "heracles", "hermes", "argus", "calliope"].includes(a.identifier)));
ok("contract classes are Presenter, Judge, Firecrawl retrieval",
  contract.every((a) => ["presenter", "judge", "firecrawl-retrieval"].includes(a.identifier)));
const judge = seeded.find((a) => a.identifier === "judge");
const firecrawl = seeded.find((a) => a.identifier === "firecrawl-retrieval");
ok("Judge home_repository is UNVERIFIED", judge && judge.home_repository === "UNVERIFIED");
ok("Firecrawl retrieval home_repository is UNVERIFIED", firecrawl && firecrawl.home_repository === "UNVERIFIED");
ok("no invented Origin eight/eleven names",
  !seeded.some((a) => /origin-|gary-eight|gary-eleven|testing-system-\d/i.test(a.identifier + " " + a.name)));
ok("isNamedHuman accepts Craig", isNamedHuman("Craig") === true);
ok("isNamedHuman refuses blank", isNamedHuman("") === false && isNamedHuman("   ") === false);
ok("isNamedHuman refuses zeus", isNamedHuman("zeus") === false && isNamedHuman("Zeus") === false);
ok("isNamedHuman refuses firecrawl-retrieval", isNamedHuman("firecrawl-retrieval") === false);

// 2. SYNTH finding: NEW -> APPROVED -> DISPATCHED -> DONE, human Craig.
const synthStore = createStore({ seed: true });
const synthFinding = synthStore.insertFinding({
  id: "SYNTH",
  finding: "SYNTH finding for Prompt 66 steering flow",
  evidence_link: "UNKNOWN",
  proposed_improvement: "Record a local handoff only",
  severity: "LOW"
});
ok("SYNTH insert status NEW", synthFinding && synthFinding.status === "NEW");
const approved = synthStore.approveFinding("SYNTH", "Craig");
ok("SYNTH approve ok", approved && approved.ok === true);
ok("SYNTH approved_by Craig", synthStore.getFinding("SYNTH").approved_by === "Craig");
ok("SYNTH status APPROVED", synthStore.getFinding("SYNTH").status === "APPROVED");
const zeus = createZeus(synthStore);
const dispatched = zeus.receiveDispatch({
  instruction: "Record the SYNTH finding as a local handoff",
  target_agent: "athena",
  dispatched_by: "Craig",
  finding_id: "SYNTH"
});
ok("SYNTH dispatch accepted", dispatched && dispatched.ok === true && dispatched.refused !== true);
const done = synthStore.getFinding("SYNTH");
ok("SYNTH status DONE", done.status === "DONE");
ok("SYNTH approved_by remains Craig", done.approved_by === "Craig");
ok("SYNTH dispatched_by Craig", done.dispatched_by === "Craig");
const synthTasks = synthStore.listTasks();
ok("SYNTH created one task", synthTasks.length === 1);
ok("SYNTH task dispatched_by Craig", synthTasks[0].dispatched_by === "Craig");
ok("SYNTH task state DONE", synthTasks[0].state === "DONE");

// 3. Change task with no human dispatch refuses; no agent_tasks row.
const refuseStore = createStore({ seed: true });
const refuseZeus = createZeus(refuseStore);
const noHuman = refuseZeus.receiveDispatch({
  instruction: "change the site",
  target_agent: "athena"
});
ok("receiveDispatch without dispatched_by refuses", noHuman && noHuman.ok === false && noHuman.refused === true);
ok("no task after missing dispatched_by", refuseStore.listTasks().length === 0);
const blankHuman = receiveDispatch(refuseStore, {
  instruction: "change the site",
  target_agent: "athena",
  dispatched_by: "  "
});
ok("blank dispatched_by refuses", blankHuman && blankHuman.refused === true);
ok("no task after blank dispatched_by", refuseStore.listTasks().length === 0);
const agentHuman = refuseZeus.receiveDispatch({
  instruction: "change the site",
  target_agent: "athena",
  dispatched_by: "zeus"
});
ok("agent-name dispatched_by refuses", agentHuman && agentHuman.refused === true);
ok("no task after agent-name dispatched_by", refuseStore.listTasks().length === 0);
const auto = tryAutonomousChange(refuseStore, { instruction: "I decided to change the site" });
ok("tryAutonomousChange refuses", auto && auto.ok === false && auto.refused === true);
ok("no task after tryAutonomousChange", refuseStore.listTasks().length === 0);

// 4. Observation with mock fetch: heartbeat + finding only. No POST.
const observeStore = createStore({ seed: true });
const fetchCalls = [];
async function mockFetch(url, init) {
  const method = String((init && init.method) || "GET").toUpperCase();
  fetchCalls.push({ url: String(url), method: method });
  return {
    ok: true,
    status: 200,
    text: async () => "Continuum page copy with hyphen-minus only."
  };
}
const observed = await runObservation({
  store: observeStore,
  fetchFn: mockFetch,
  baseUrl: "https://observe.test"
});
ok("observation returns writes object", observed && observed.writes);
ok("observation wrote activity", Array.isArray(observed.writes.activity) && observed.writes.activity.length > 0);
ok("observation wrote findings", Array.isArray(observed.writes.findings) && observed.writes.findings.length > 0);
ok("observation tasks.length === 0", Array.isArray(observed.writes.tasks) && observed.writes.tasks.length === 0);
ok("observation other is empty", Array.isArray(observed.writes.other) && observed.writes.other.length === 0);
ok("observation did not POST", fetchCalls.length > 0 && fetchCalls.every((c) => c.method === "GET"));
ok("observation did not POST persist/save", !fetchCalls.some((c) => c.method !== "GET" && /persist|save/i.test(c.url)));
ok("store tasks remain empty after observation", observeStore.listTasks().length === 0);
ok("store has zeus heartbeat activity", observeStore.listActivity().some((a) => a.agent_identifier === "zeus"));

// 5. Retrieval without authorizer refuses; with Craig records cost or UNKNOWN, never 0.
const retrievalStore = createStore({ seed: true });
const noAuth = queueRetrieval({
  store: retrievalStore,
  budget: "page-health",
  sources: ["https://www.continuumrtw.com"]
});
ok("retrieval without authorizer refuses", noAuth && noAuth.ok === false && noAuth.refused === true);
ok("retrieval without authorizer does not run Firecrawl", noAuth.firecrawl_ran !== true);
ok("no retrieval row without authorizer", retrievalStore.listRetrievals().length === 0);
const withAuth = queueRetrieval({
  store: retrievalStore,
  authorizer: "Craig",
  authorized_at: "2026-09-18T00:00:00.000Z",
  budget: "page-health only",
  sources: ["https://www.continuumrtw.com"]
});
ok("retrieval with authorizer Craig records", withAuth && withAuth.ok === true);
const retrievals = retrievalStore.listRetrievals();
ok("one retrieval row recorded", retrievals.length === 1);
ok("retrieval cost is UNKNOWN, never 0", retrievals[0].cost === "UNKNOWN" && retrievals[0].cost !== 0);
ok("retrieval budget recorded", retrievals[0].budget === "page-health only");
ok("retrieval sources recorded", Array.isArray(retrievals[0].sources) && retrievals[0].sources.length > 0);
ok("retrieval did not run Firecrawl", retrievals[0].firecrawl_ran === false);
const zeroCost = queueRetrieval({
  store: retrievalStore,
  authorizer: "Craig",
  authorized_at: "2026-09-18T00:00:00.000Z",
  budget: "named",
  sources: ["docs"],
  cost: 0
});
ok("cost 0 stored as UNKNOWN", zeroCost.ok === true && retrievalStore.listRetrievals()[0].cost === "UNKNOWN");

// 6. SQL file exists, four tables, FILE ONLY, not under live-apply dirs.
const sqlPath = join(agentOps, "db", "0001_prompt66_agent_ops.sql");
ok("SQL file exists at internal/agent-ops/db/0001_prompt66_agent_ops.sql", existsSync(sqlPath));
const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
ok("SQL says FILE ONLY", /FILE ONLY/.test(sql));
ok("SQL says do not apply live", /do not apply live/i.test(sql));
ok("SQL names Continuum product tables for the Steering Dispatcher", /Steering Dispatcher/.test(sql));
ok("SQL creates agent_ops.agents", /create table if not exists agent_ops\.agents/i.test(sql));
ok("SQL creates agent_ops.agent_activity", /create table if not exists agent_ops\.agent_activity/i.test(sql));
ok("SQL creates agent_ops.agent_findings", /create table if not exists agent_ops\.agent_findings/i.test(sql));
ok("SQL creates agent_ops.agent_tasks", /create table if not exists agent_ops\.agent_tasks/i.test(sql));
const createTableCount = (sql.match(/create table if not exists/gi) || []).length;
ok("SQL creates four tables", createTableCount === 4);
ok("SQL has finding status CHECK", /NEW/.test(sql) && /APPROVED/.test(sql) && /REJECTED/.test(sql) && /DISPATCHED/.test(sql) && /DONE/.test(sql));
ok("SQL path is not supabase/migrations", sqlPath.indexOf("supabase/migrations") === -1);
ok("SQL path is not platform/db", sqlPath.indexOf(sep + "platform" + sep + "db") === -1);
ok("SQL path is not clinical/db", sqlPath.indexOf(sep + "clinical" + sep + "db") === -1);
ok("no prompt66 sql under supabase/migrations",
  walkFiles(join(root, "supabase", "migrations"), (n) => /prompt66|agent_ops/i.test(n)).length === 0);
ok("no prompt66 sql under platform/db",
  walkFiles(join(root, "platform", "db"), (n) => /prompt66|agent_ops/i.test(n)).length === 0);
ok("no prompt66 sql under clinical/db",
  walkFiles(join(root, "clinical", "db"), (n) => /prompt66|agent_ops/i.test(n)).length === 0);

// 7. server bind address is 127.0.0.1 (read source).
const serverSrc = readFileSync(join(agentOps, "server.mjs"), "utf8");
ok("server.mjs binds 127.0.0.1", /127\.0\.0\.1/.test(serverSrc));
ok("server.mjs does not bind 0.0.0.0", !/0\.0\.0\.0/.test(serverSrc));
ok("server.mjs listen uses 127.0.0.1", /listen\s*\([^)]*127\.0\.0\.1/.test(serverSrc) || /listen\s*\(\s*PORT\s*,\s*BIND/.test(serverSrc) && /BIND\s*=\s*"127\.0\.0\.1"/.test(serverSrc));

// Workflow exists and uses on.schedule without root npm install.
const wfPath = join(root, ".github", "workflows", "agent-ops-observe.yml");
ok("observe workflow file exists", existsSync(wfPath));
if (existsSync(wfPath)) {
  const wf = readFileSync(wfPath, "utf8");
  ok("workflow has on.schedule cron 0 13 * * 1-5", /cron:\s*"0 13 \* \* 1-5"/.test(wf));
  ok("workflow has workflow_dispatch", /workflow_dispatch/.test(wf));
  ok("workflow runs observe.mjs", /node internal\/agent-ops\/observe\.mjs/.test(wf));
  ok("workflow does not npm install at repo root", !/npm (ci|install)/.test(wf));
}

// Dash rule on the product files this suite owns.
const productFiles = [
  join(agentOps, "db", "0001_prompt66_agent_ops.sql"),
  join(agentOps, "lib", "store.mjs"),
  join(agentOps, "lib", "zeus.mjs"),
  join(agentOps, "lib", "observation.mjs"),
  join(agentOps, "lib", "retrieval.mjs"),
  join(agentOps, "lib", "http.mjs"),
  join(agentOps, "server.mjs"),
  join(agentOps, "observe.mjs"),
  join(agentOps, "README.md"),
  join(agentOps, "ui", "index.html"),
  join(agentOps, ".gitignore"),
  join(root, "deploy", "prompt66-agent-ops.test.mjs"),
  join(root, ".github", "workflows", "agent-ops-observe.yml"),
  join(root, "docs", "prompts", "66", "SECTION_1.md"),
  join(root, "docs", "prompts", "66", "REGISTER.md"),
  join(root, "docs", "prompts", "66", "STOPS.md"),
  join(root, "docs", "prompts", "66", "ACCEPTANCE.md")
];
for (const f of productFiles) {
  if (!existsSync(f)) continue;
  const text = readFileSync(f, "utf8");
  ok(relative(root, f).split(sep).join("/") + " dash clean", !/[\u2013\u2014]/.test(text));
}

console.log("\nprompt66-agent-ops suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
