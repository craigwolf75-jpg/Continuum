/* Continuum Agent Operations retrieval gate.
   Prompt 64 source rules bind: do not scrape.
   This is a record plus refuse gate, not a live Firecrawl client.
   No authorizer: refuse. Do not run Firecrawl. Do not fetch URLs.
   With authorizer: record budget, sources, cost (UNKNOWN if missing, never 0).
   No em dashes or en dashes. */

import { isNamedHuman, unknownIfMissing } from "./store.mjs";

export function queueRetrieval({ store, authorizer, authorized_at, budget, sources, cost } = {}) {
  const agents = store && typeof store.listAgents === "function" ? store.listAgents() : [];
  if (!isNamedHuman(authorizer, agents)) {
    return {
      ok: false,
      refused: true,
      firecrawl_ran: false,
      error: "named human required"
    };
  }
  if (!store || typeof store.insertRetrieval !== "function") {
    return {
      ok: false,
      refused: true,
      firecrawl_ran: false,
      error: "UNKNOWN"
    };
  }

  const recorded = store.insertRetrieval({
    authorizer: String(authorizer).trim(),
    authorized_at: authorized_at || new Date().toISOString(),
    budget: budget == null || budget === "" ? "UNKNOWN" : budget,
    sources: Array.isArray(sources) ? sources : [],
    cost: unknownIfMissing(cost)
  });

  return {
    ok: true,
    refused: false,
    firecrawl_ran: false,
    recorded: recorded
  };
}
