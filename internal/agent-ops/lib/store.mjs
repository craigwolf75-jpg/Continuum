/* Continuum Agent Operations in-memory / file store.
   Mirrors agent_ops.agents, agent_activity, agent_findings, agent_tasks.
   FILE ONLY schema lives beside this store. Do not apply live.
   createStore({ seed }) returns a fresh isolated store for tests.
   UNKNOWN is never rendered as 0. No em dashes or en dashes. */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export const RESERVED_AGENT_KEYS = [
  "zeus",
  "athena",
  "apollo",
  "heracles",
  "hermes",
  "argus",
  "calliope",
  "judge",
  "presenter",
  "firecrawl-retrieval"
];

const RESERVED_FULL_NAMES = [
  "zeus, steering dispatcher",
  "continuum zeus",
  "continuum presenter agent",
  "firecrawl retrieval"
];

const NOW_SEED = "2026-09-18T00:00:00.000Z";

export const DEFAULT_INVENTORY = [
  {
    identifier: "zeus",
    name: "Zeus, Steering Dispatcher",
    role: "12",
    runtime_status: "RUNTIME_IMPLEMENTED",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "athena",
    name: "Athena",
    role: "12a",
    runtime_status: "RUNTIME_IMPLEMENTED",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "apollo",
    name: "Apollo",
    role: "12b",
    runtime_status: "RUNTIME_IMPLEMENTED",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "heracles",
    name: "Heracles",
    role: "24c",
    runtime_status: "RUNTIME_IMPLEMENTED",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "hermes",
    name: "Hermes",
    role: "12d",
    runtime_status: "RUNTIME_IMPLEMENTED",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "argus",
    name: "Argus",
    role: "12e",
    runtime_status: "RUNTIME_IMPLEMENTED",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "calliope",
    name: "Calliope",
    role: "24f",
    runtime_status: "RUNTIME_IMPLEMENTED",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "presenter",
    name: "Continuum Presenter Agent",
    role: "Presenter",
    runtime_status: "CONTRACT_ONLY",
    home_repository: "craigwolf75-jpg/Continuum",
    created_at: NOW_SEED
  },
  {
    identifier: "judge",
    name: "Judge",
    role: "Judge",
    runtime_status: "CONTRACT_ONLY",
    home_repository: "UNVERIFIED",
    created_at: NOW_SEED
  },
  {
    identifier: "firecrawl-retrieval",
    name: "Firecrawl retrieval",
    role: "Firecrawl retrieval",
    runtime_status: "CONTRACT_ONLY",
    home_repository: "UNVERIFIED",
    created_at: NOW_SEED
  }
];

export function unknownIfMissing(value) {
  if (value === undefined || value === null || value === "") return "UNKNOWN";
  if (value === 0 || value === "0") return "UNKNOWN";
  return value;
}

export function isNamedHuman(value, agents) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const key = trimmed.toLowerCase();
  if (RESERVED_AGENT_KEYS.includes(key)) return false;
  if (RESERVED_FULL_NAMES.includes(key)) return false;
  for (const id of RESERVED_AGENT_KEYS) {
    if (key === id) return false;
    if (key.startsWith(id + " ") || key.startsWith(id + ",") || key.startsWith(id + ":")) return false;
  }
  const roster = Array.isArray(agents) ? agents : [];
  for (const agent of roster) {
    if (agent && agent.identifier && key === String(agent.identifier).toLowerCase()) return false;
    if (agent && agent.name && key === String(agent.name).toLowerCase()) return false;
  }
  return true;
}

function emptyState() {
  return {
    agents: [],
    agent_activity: [],
    agent_findings: [],
    agent_tasks: [],
    retrievals: []
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function loadPersisted(persistPath) {
  if (!persistPath || !existsSync(persistPath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(persistPath, "utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

function seedAgents(seed) {
  if (seed === false) return [];
  if (seed && typeof seed === "object" && Array.isArray(seed.agents)) {
    return clone(seed.agents);
  }
  if (Array.isArray(seed)) return clone(seed);
  return clone(DEFAULT_INVENTORY);
}

export function createStore({ seed, persistPath } = {}) {
  const persisted = loadPersisted(persistPath);
  const state = emptyState();
  if (persisted && typeof persisted === "object") {
    state.agents = Array.isArray(persisted.agents) ? persisted.agents : seedAgents(seed);
    state.agent_activity = Array.isArray(persisted.agent_activity) ? persisted.agent_activity : [];
    state.agent_findings = Array.isArray(persisted.agent_findings) ? persisted.agent_findings : [];
    state.agent_tasks = Array.isArray(persisted.agent_tasks) ? persisted.agent_tasks : [];
    state.retrievals = Array.isArray(persisted.retrievals) ? persisted.retrievals : [];
  } else {
    state.agents = seedAgents(seed);
    if (seed && typeof seed === "object") {
      if (Array.isArray(seed.agent_activity)) state.agent_activity = clone(seed.agent_activity);
      if (Array.isArray(seed.agent_findings)) state.agent_findings = clone(seed.agent_findings);
      if (Array.isArray(seed.agent_tasks)) state.agent_tasks = clone(seed.agent_tasks);
      if (Array.isArray(seed.retrievals)) state.retrievals = clone(seed.retrievals);
    }
  }

  function persist() {
    if (!persistPath) return;
    try {
      mkdirSync(dirname(persistPath), { recursive: true });
      writeFileSync(persistPath, JSON.stringify(state, null, 2));
    } catch (err) {
      // last-known stays in memory; file write is best effort
    }
  }

  function snapshot() {
    return clone(state);
  }

  function listAgents() {
    return clone(state.agents);
  }

  function getAgent(identifier) {
    if (!identifier) return null;
    const key = String(identifier).trim().toLowerCase();
    const row = state.agents.find((a) => {
      return a.identifier.toLowerCase() === key || String(a.name).toLowerCase() === key;
    });
    return row ? clone(row) : null;
  }

  function insertActivity(row) {
    const recorded = {
      id: row && row.id ? String(row.id) : "activity-" + randomUUID(),
      agent_identifier: row && row.agent_identifier ? String(row.agent_identifier) : "zeus",
      heartbeat_at: row && row.heartbeat_at ? row.heartbeat_at : nowIso(),
      current_task: row && row.current_task != null ? row.current_task : "",
      last_completed_action: row && row.last_completed_action != null ? row.last_completed_action : "",
      recorded_at: row && row.recorded_at ? row.recorded_at : nowIso()
    };
    state.agent_activity.push(recorded);
    persist();
    return clone(recorded);
  }

  function listActivity() {
    return clone(state.agent_activity);
  }

  function insertFinding(row) {
    const recorded = {
      id: row && row.id ? String(row.id) : "finding-" + randomUUID(),
      finding: row && row.finding ? String(row.finding) : "UNKNOWN",
      evidence_link: row && row.evidence_link ? row.evidence_link : "UNKNOWN",
      proposed_improvement: row && row.proposed_improvement != null ? row.proposed_improvement : "",
      severity: row && row.severity ? String(row.severity) : "UNKNOWN",
      status: row && row.status ? String(row.status) : "NEW",
      created_at: row && row.created_at ? row.created_at : nowIso(),
      approved_by: row && row.approved_by ? row.approved_by : null,
      approved_at: row && row.approved_at ? row.approved_at : null,
      rejected_by: row && row.rejected_by ? row.rejected_by : null,
      rejected_at: row && row.rejected_at ? row.rejected_at : null,
      dispatched_by: row && row.dispatched_by ? row.dispatched_by : null,
      dispatched_at: row && row.dispatched_at ? row.dispatched_at : null,
      done_at: row && row.done_at ? row.done_at : null
    };
    state.agent_findings.push(recorded);
    persist();
    return clone(recorded);
  }

  function getFinding(id) {
    const row = state.agent_findings.find((f) => f.id === id);
    return row ? clone(row) : null;
  }

  function listFindings() {
    return clone(state.agent_findings).sort((a, b) => {
      const at = a.created_at || "";
      const bt = b.created_at || "";
      if (at === bt) return 0;
      return at < bt ? 1 : -1;
    });
  }

  function refuseHuman() {
    return { ok: false, refused: true, error: "named human required" };
  }

  function approveFinding(id, human) {
    if (!isNamedHuman(human, state.agents)) return refuseHuman();
    const row = state.agent_findings.find((f) => f.id === id);
    if (!row) return { ok: false, refused: true, error: "UNKNOWN" };
    if (row.status !== "NEW") return { ok: false, refused: true, error: "finding is not NEW" };
    row.status = "APPROVED";
    row.approved_by = String(human).trim();
    row.approved_at = nowIso();
    persist();
    return { ok: true, finding: clone(row) };
  }

  function dismissFinding(id, human) {
    if (!isNamedHuman(human, state.agents)) return refuseHuman();
    const row = state.agent_findings.find((f) => f.id === id);
    if (!row) return { ok: false, refused: true, error: "UNKNOWN" };
    if (row.status !== "NEW") return { ok: false, refused: true, error: "finding is not NEW" };
    row.status = "REJECTED";
    row.rejected_by = String(human).trim();
    row.rejected_at = nowIso();
    persist();
    return { ok: true, finding: clone(row) };
  }

  function markFindingDispatched(id, human) {
    if (!isNamedHuman(human, state.agents)) return refuseHuman();
    const row = state.agent_findings.find((f) => f.id === id);
    if (!row) return { ok: false, refused: true, error: "UNKNOWN" };
    if (row.status !== "APPROVED") return { ok: false, refused: true, error: "finding is not APPROVED" };
    row.status = "DISPATCHED";
    row.dispatched_by = String(human).trim();
    row.dispatched_at = nowIso();
    persist();
    return { ok: true, finding: clone(row) };
  }

  function markFindingDone(id, human) {
    if (!isNamedHuman(human, state.agents)) return refuseHuman();
    const row = state.agent_findings.find((f) => f.id === id);
    if (!row) return { ok: false, refused: true, error: "UNKNOWN" };
    row.status = "DONE";
    row.dispatched_by = String(human).trim();
    if (!row.dispatched_at) row.dispatched_at = nowIso();
    row.done_at = nowIso();
    persist();
    return { ok: true, finding: clone(row) };
  }

  function insertTask(row) {
    const recorded = {
      id: row && row.id ? String(row.id) : "task-" + randomUUID(),
      instruction: row && row.instruction ? String(row.instruction) : "",
      target_agent: row && row.target_agent ? String(row.target_agent) : "",
      dispatched_by: row && row.dispatched_by ? String(row.dispatched_by) : "",
      dispatched_at: row && row.dispatched_at ? row.dispatched_at : nowIso(),
      state: row && row.state ? String(row.state) : "DISPATCHED",
      result: row && row.result != null ? row.result : "",
      artifact_link: row && row.artifact_link ? row.artifact_link : "UNKNOWN",
      finding_id: row && row.finding_id ? row.finding_id : null
    };
    state.agent_tasks.push(recorded);
    persist();
    return clone(recorded);
  }

  function updateTask(id, patch) {
    const row = state.agent_tasks.find((t) => t.id === id);
    if (!row) return null;
    Object.assign(row, patch || {});
    persist();
    return clone(row);
  }

  function listTasks() {
    return clone(state.agent_tasks);
  }

  function insertRetrieval(row) {
    const recorded = {
      id: row && row.id ? String(row.id) : "retrieval-" + randomUUID(),
      authorizer: row && row.authorizer ? row.authorizer : null,
      authorized_at: row && row.authorized_at ? row.authorized_at : nowIso(),
      budget: row && row.budget != null && row.budget !== "" ? row.budget : "UNKNOWN",
      sources: row && Array.isArray(row.sources) ? clone(row.sources) : [],
      cost: unknownIfMissing(row && row.cost),
      firecrawl_ran: false,
      recorded_at: nowIso()
    };
    state.retrievals.unshift(recorded);
    persist();
    return clone(recorded);
  }

  function listRetrievals() {
    return clone(state.retrievals);
  }

  return {
    listAgents,
    getAgent,
    insertActivity,
    listActivity,
    insertFinding,
    getFinding,
    listFindings,
    approveFinding,
    dismissFinding,
    markFindingDispatched,
    markFindingDone,
    insertTask,
    updateTask,
    listTasks,
    insertRetrieval,
    listRetrievals,
    snapshot,
    persistPath: persistPath || null
  };
}
