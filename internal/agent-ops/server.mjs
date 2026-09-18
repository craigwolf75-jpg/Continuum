/* Continuum Agent Operations local server.
   LOCAL INTERNAL DASHBOARD. Bind 127.0.0.1 ONLY. Never all interfaces.
   Port from CONTINUUM_AGENT_OPS_PORT or 8766.
   Zero public Vercel routes. No em dashes or en dashes. */

import { createServer } from "node:http";
import { createStore } from "./lib/store.mjs";
import { createHandler } from "./lib/http.mjs";

const BIND = "127.0.0.1";
const PORT = Number(process.env.CONTINUUM_AGENT_OPS_PORT || 8766);

const store = createStore({ seed: true });
const handler = createHandler({ store: store });
const server = createServer(handler);

server.listen(PORT, BIND, () => {
  console.log("Continuum Agent Operations listening on " + BIND + ":" + PORT);
});
