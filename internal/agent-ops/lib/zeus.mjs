/* Continuum Zeus, the Steering Dispatcher.
   Continuum product code. Not another venture's orchestrator. Not a Grok Bot.
   Zeus never creates, approves, or executes a change task of its own motion.
   A named human must dispatch. Zeus may originate READ ONLY observation runs.
   Local console execution is a recorded handoff plus a result string, not a
   live site mutation. No em dashes or en dashes. */

import { isNamedHuman } from "./store.mjs";
import { runObservation } from "./observation.mjs";

function refuse(reason) {
  return { ok: false, refused: true, error: reason };
}

function logZeus(store, currentTask, lastAction) {
  try {
    return store.insertActivity({
      agent_identifier: "zeus",
      current_task: currentTask || "",
      last_completed_action: lastAction || ""
    });
  } catch (err) {
    return null;
  }
}

export function tryAutonomousChange(store, payload) {
  logZeus(store, payload && payload.instruction ? payload.instruction : "", "tryAutonomousChange refused");
  return refuse("Continuum Zeus never creates a change task of its own motion");
}

export function receiveDispatch(store, payload) {
  const instruction = payload && payload.instruction != null ? String(payload.instruction) : "";
  const target = payload && payload.target_agent != null ? String(payload.target_agent).trim() : "";
  const dispatchedBy = payload && payload.dispatched_by;
  const findingId = payload && payload.finding_id ? String(payload.finding_id) : null;

  logZeus(store, instruction || "receiveDispatch", "receiveDispatch");

  if (!isNamedHuman(dispatchedBy, store.listAgents())) {
    return refuse("named human required");
  }
  if (!instruction.trim()) {
    return refuse("instruction required");
  }
  if (!target) {
    return refuse("target_agent required");
  }

  const agent = store.getAgent(target);
  if (!agent) {
    return refuse("UNKNOWN");
  }

  if (findingId) {
    const finding = store.getFinding(findingId);
    if (!finding) return refuse("UNKNOWN");
    if (finding.status !== "APPROVED") {
      return refuse("finding is not APPROVED");
    }
    const moved = store.markFindingDispatched(findingId, dispatchedBy);
    if (!moved || moved.ok !== true) {
      return refuse(moved && moved.error ? moved.error : "UNKNOWN");
    }
  }

  const human = String(dispatchedBy).trim();
  const task = store.insertTask({
    instruction: instruction,
    target_agent: agent.identifier,
    dispatched_by: human,
    state: "DISPATCHED",
    finding_id: findingId,
    result: ""
  });

  store.insertActivity({
    agent_identifier: agent.identifier,
    current_task: instruction,
    last_completed_action: "handoff received from Continuum Zeus"
  });

  const result = "Handoff recorded to " + agent.identifier + ". Local console only: no live site mutation.";
  const doneTask = store.updateTask(task.id, { state: "DONE", result: result });

  if (findingId) {
    store.markFindingDone(findingId, human);
  }

  return {
    ok: true,
    refused: false,
    task: doneTask,
    finding: findingId ? store.getFinding(findingId) : null
  };
}

export async function originateObservation(store, opts) {
  logZeus(store, "READ ONLY observation", "originateObservation");
  return runObservation({
    store: store,
    fetchFn: opts && opts.fetchFn,
    baseUrl: opts && opts.baseUrl,
    skipHeartbeat: false
  });
}

export function createZeus(store) {
  return {
    receiveDispatch: (payload) => receiveDispatch(store, payload),
    originateObservation: (opts) => originateObservation(store, opts),
    tryAutonomousChange: (payload) => tryAutonomousChange(store, payload)
  };
}
