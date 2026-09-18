# Continuum Agent Operations (local)

LOCAL INTERNAL DASHBOARD. Bind 127.0.0.1. Zero public Vercel routes.

Run the console:

    node internal/agent-ops/server.mjs

Listens on 127.0.0.1:8766, or CONTINUUM_AGENT_OPS_PORT if set.
GET / serves Apollo's ui/index.html when that file exists.

Read-only observation CLI (used by GitHub Actions):

    node internal/agent-ops/observe.mjs

CONTINUUM_OBSERVE_BASE defaults to https://www.continuumrtw.com.
Observation output stays in a temp store. Do not commit it.

Schema file internal/agent-ops/db/0001_prompt66_agent_ops.sql is FILE ONLY.
Do not apply live.

This file is not a ship order.
