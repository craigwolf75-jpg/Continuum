/* Continuum Agent Operations observation CLI.
   Used by GitHub Actions on.schedule. Node builtins only.
   Writes to a temp or cwd data store. Do not commit observation output.
   Does not apply schema. Does not mutate the live site.
   Env NAME: CONTINUUM_OBSERVE_BASE (default https://www.continuumrtw.com).
   No em dashes or en dashes. */

import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "./lib/store.mjs";
import { createZeus } from "./lib/zeus.mjs";

const baseUrl = process.env.CONTINUUM_OBSERVE_BASE || "https://www.continuumrtw.com";
const persistPath = join(tmpdir(), "continuum-agent-ops-observe.json");

const store = createStore({ seed: true, persistPath: persistPath });
const zeus = createZeus(store);

const fetchFn = typeof fetch === "function" ? fetch.bind(globalThis) : null;

try {
  const result = await zeus.originateObservation({
    fetchFn: fetchFn,
    baseUrl: baseUrl
  });
  const writes = result && result.writes ? result.writes : { activity: [], findings: [], tasks: [], other: [] };
  console.log(JSON.stringify({
    ok: true,
    activity: Array.isArray(writes.activity) ? writes.activity.length : "UNKNOWN",
    findings: Array.isArray(writes.findings) ? writes.findings.length : "UNKNOWN",
    tasks: Array.isArray(writes.tasks) ? writes.tasks.length : "UNKNOWN"
  }));
  process.exit(0);
} catch (err) {
  console.error("observation failed");
  process.exit(1);
}
