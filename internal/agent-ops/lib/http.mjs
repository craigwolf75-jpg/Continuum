/* Continuum Agent Operations local HTTP API.
   Loopback only. Do not open CORS to the public web.
   Three-layer resilience on every route: live store, last-known snapshot,
   then a safe default. Never throw 500. UNKNOWN is never rendered as 0.
   Write actions require a named human. No em dashes or en dashes. */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, isNamedHuman } from "./store.mjs";
import { createZeus } from "./zeus.mjs";
import { queueRetrieval } from "./retrieval.mjs";

const UI_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "ui", "index.html");
const MISSING_UI = "Continuum Agent Operations UI not built";

function jsonHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };
}

function send(res, status, body, headers) {
  try {
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    const hdrs = headers || jsonHeaders();
    res.writeHead(status, hdrs);
    res.end(payload);
  } catch (err) {
    try {
      res.writeHead(200, jsonHeaders());
      res.end(JSON.stringify({ ok: false, error: "UNKNOWN" }));
    } catch (err2) {
      try { res.end(); } catch (err3) {}
    }
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function namedHumanFrom(body, fieldNames) {
  const names = fieldNames || ["human", "dispatched_by", "authorizer"];
  if (body && typeof body === "object") {
    for (const field of names) {
      if (typeof body[field] === "string" && body[field].trim()) return body[field];
    }
  }
  const fromEnv = process.env.CONTINUUM_AGENT_OPS_OPERATOR;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv;
  return "";
}

function refuseNamedHuman() {
  return { status: 403, body: { ok: false, refused: true, error: "named human required" } };
}

function layerRead(lastKnown, key, liveFn, fallback) {
  try {
    const live = liveFn();
    if (live !== undefined && live !== null) {
      lastKnown[key] = live;
      return { layer: "live", data: live };
    }
  } catch (err) {}
  try {
    if (lastKnown[key] !== undefined && lastKnown[key] !== null) {
      return { layer: "last-known", data: lastKnown[key] };
    }
  } catch (err) {}
  return { layer: "default", data: fallback };
}

function countOrUnknown(layer, data) {
  if (layer === "default") return "UNKNOWN";
  if (!Array.isArray(data)) return "UNKNOWN";
  return data.length;
}

function latestActivity(store, identifier) {
  try {
    const rows = store.listActivity().filter((row) => row.agent_identifier === identifier);
    return rows.length ? rows[rows.length - 1] : null;
  } catch (err) {
    return null;
  }
}

function presentAgent(store, agent) {
  const beat = latestActivity(store, agent.identifier);
  return {
    ...agent,
    id: agent.identifier,
    current_task: beat && beat.current_task ? beat.current_task : "",
    last_heartbeat: beat && beat.heartbeat_at ? beat.heartbeat_at : "UNKNOWN",
    heartbeat_at: beat && beat.heartbeat_at ? beat.heartbeat_at : "UNKNOWN",
    last_completed_action: beat && beat.last_completed_action ? beat.last_completed_action : ""
  };
}

function presentFinding(row) {
  return {
    ...row,
    evidence: row.evidence_link || "UNKNOWN"
  };
}

function presentTask(row) {
  const link = row.artifact_link && row.artifact_link !== "UNKNOWN" ? row.artifact_link : "";
  return {
    ...row,
    artifact_url: link || null,
    link: link || null
  };
}

function presentRetrieval(row) {
  const cost = row && (row.cost === 0 || row.cost === "0" || row.cost == null || row.cost === "") ? "UNKNOWN" : row.cost;
  return {
    ...row,
    cost: cost,
    created_at: row.recorded_at || row.authorized_at || "UNKNOWN"
  };
}

export function createHandler({ store, zeus, fetchFn } = {}) {
  const liveStore = store || createStore({ seed: true });
  const dispatcher = zeus || createZeus(liveStore);
  const lastKnown = {
    health: null,
    agents: null,
    findings: null,
    tasks: null,
    retrieval: null
  };

  async function route(req, res) {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = url.pathname;
    const method = String(req.method || "GET").toUpperCase();

    if (method === "GET" && pathname === "/") {
      if (existsSync(UI_PATH)) {
        const html = readFileSync(UI_PATH, "utf8");
        send(res, 200, html, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        });
        return;
      }
      send(res, 200, MISSING_UI, {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      });
      return;
    }

    if (method === "GET" && pathname === "/api/health") {
      const read = layerRead(lastKnown, "health", () => ({
        ok: true,
        bind: "127.0.0.1",
        service: "continuum-agent-ops",
        exposure: "loopback-only"
      }), {
        ok: true,
        bind: "127.0.0.1",
        service: "continuum-agent-ops",
        exposure: "loopback-only",
        status: "UNKNOWN"
      });
      send(res, 200, { ...read.data, layer: read.layer });
      return;
    }

    if (method === "GET" && pathname === "/api/agents") {
      const read = layerRead(lastKnown, "agents", () => liveStore.listAgents().map((a) => presentAgent(liveStore, a)), []);
      send(res, 200, {
        ok: true,
        layer: read.layer,
        agents: read.data,
        count: countOrUnknown(read.layer, read.data)
      });
      return;
    }

    if (method === "GET" && pathname === "/api/findings") {
      const read = layerRead(lastKnown, "findings", () => liveStore.listFindings().map(presentFinding), []);
      send(res, 200, {
        ok: true,
        layer: read.layer,
        findings: read.data,
        count: countOrUnknown(read.layer, read.data)
      });
      return;
    }

    if (method === "GET" && pathname === "/api/tasks") {
      const read = layerRead(lastKnown, "tasks", () => liveStore.listTasks().map(presentTask), []);
      send(res, 200, {
        ok: true,
        layer: read.layer,
        tasks: read.data,
        count: countOrUnknown(read.layer, read.data)
      });
      return;
    }

    if (method === "GET" && pathname === "/api/retrieval") {
      const read = layerRead(lastKnown, "retrieval", () => liveStore.listRetrievals().map(presentRetrieval), []);
      const rows = Array.isArray(read.data) ? read.data : [];
      send(res, 200, {
        ok: true,
        layer: read.layer,
        retrieval: rows,
        retrievals: rows,
        runs: rows,
        count: countOrUnknown(read.layer, read.data)
      });
      return;
    }

    if (method === "POST" && pathname === "/api/dispatch") {
      const body = await readBody(req);
      const human = namedHumanFrom(body, ["dispatched_by", "human"]);
      if (!isNamedHuman(human, liveStore.listAgents())) {
        const refused = refuseNamedHuman();
        send(res, refused.status, refused.body);
        return;
      }
      const result = dispatcher.receiveDispatch({
        instruction: body.instruction,
        target_agent: body.target_agent,
        dispatched_by: human,
        finding_id: body.finding_id
      });
      if (!result || result.ok !== true) {
        send(res, result && result.refused ? 403 : 200, {
          ok: false,
          refused: true,
          error: result && result.error ? result.error : "named human required"
        });
        return;
      }
      send(res, 200, { ok: true, task: result.task, finding: result.finding });
      return;
    }

    const approveMatch = pathname.match(/^\/api\/findings\/([^/]+)\/approve$/);
    if (method === "POST" && approveMatch) {
      const body = await readBody(req);
      const human = namedHumanFrom(body, ["human", "approved_by"]);
      if (!isNamedHuman(human, liveStore.listAgents())) {
        const refused = refuseNamedHuman();
        send(res, refused.status, refused.body);
        return;
      }
      const result = liveStore.approveFinding(decodeURIComponent(approveMatch[1]), human);
      if (!result || result.ok !== true) {
        send(res, result && result.error === "named human required" ? 403 : 200, {
          ok: false,
          refused: true,
          error: result && result.error ? result.error : "UNKNOWN"
        });
        return;
      }
      send(res, 200, { ok: true, finding: result.finding });
      return;
    }

    const dismissMatch = pathname.match(/^\/api\/findings\/([^/]+)\/dismiss$/);
    if (method === "POST" && dismissMatch) {
      const body = await readBody(req);
      const human = namedHumanFrom(body, ["human", "rejected_by"]);
      if (!isNamedHuman(human, liveStore.listAgents())) {
        const refused = refuseNamedHuman();
        send(res, refused.status, refused.body);
        return;
      }
      const result = liveStore.dismissFinding(decodeURIComponent(dismissMatch[1]), human);
      if (!result || result.ok !== true) {
        send(res, result && result.error === "named human required" ? 403 : 200, {
          ok: false,
          refused: true,
          error: result && result.error ? result.error : "UNKNOWN"
        });
        return;
      }
      send(res, 200, { ok: true, finding: result.finding });
      return;
    }

    if (method === "POST" && pathname === "/api/retrieval") {
      const body = await readBody(req);
      const human = namedHumanFrom(body, ["authorizer", "human"]);
      if (!isNamedHuman(human, liveStore.listAgents())) {
        const refused = refuseNamedHuman();
        send(res, refused.status, refused.body);
        return;
      }
      const result = queueRetrieval({
        store: liveStore,
        authorizer: human,
        authorized_at: body.authorized_at,
        budget: body.budget,
        sources: body.sources,
        cost: body.cost
      });
      if (!result || result.ok !== true) {
        send(res, 403, {
          ok: false,
          refused: true,
          error: result && result.error ? result.error : "named human required"
        });
        return;
      }
      send(res, 200, { ok: true, retrieval: result.recorded, firecrawl_ran: false });
      return;
    }

    if (method === "POST" && pathname === "/api/observe") {
      const body = await readBody(req);
      const result = await dispatcher.originateObservation({
        fetchFn: fetchFn || (typeof fetch === "function" ? fetch.bind(globalThis) : null),
        baseUrl: (body && body.baseUrl) || process.env.CONTINUUM_OBSERVE_BASE || "https://www.continuumrtw.com"
      });
      send(res, 200, {
        ok: true,
        writes: result && result.writes ? result.writes : { activity: [], findings: [], tasks: [], other: [] }
      });
      return;
    }

    send(res, 404, { ok: false, error: "UNKNOWN" });
  }

  return function handler(req, res) {
    Promise.resolve(route(req, res)).catch(() => {
      send(res, 200, {
        ok: false,
        error: "UNKNOWN",
        agents: [],
        findings: [],
        tasks: [],
        count: "UNKNOWN"
      });
    });
  };
}
