// Continuum Framer demo service (Prompt 12a). No em-dashes or en-dashes.
//
// The HTTP seam the live Framer worker app connects to. It exposes the four
// contract routes and does nothing but call the framer_demo_* operations, which
// run as the restricted framer_demo role and touch ONLY framer_demo_state. The
// data is synthetic by law (Prompt 09 G3); CORS is open because of that.
//
// Auth: the caller presents the demo token as a bearer. The token is passed to
// the operation, which hashes and matches it; a miss returns 401. This function
// holds no service-role access to anything else.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
};

// best-effort per-instance rate limit: 30 writes per minute per token
const hits = new Map<string, number[]>();
function rateLimited(token: string): boolean {
  const now = Date.now();
  const win = (hits.get(token) ?? []).filter((t) => now - t < 60_000);
  win.push(now);
  hits.set(token, win);
  return win.length > 30;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const i = parts.indexOf("framer-demo");
  const sub = i >= 0 ? parts.slice(i + 1).join("/") : "";

  const sb = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  try {
    if (req.method === "GET" && sub === "state") {
      const { data, error } = await sb.rpc("framer_demo_get", { p_token: token });
      if (error) return json({ error: error.message }, 500);
      if (data === null) return json({ error: "unauthorized" }, 401);
      return json(data);
    }

    if (req.method === "POST") {
      if (rateLimited(token)) return json({ error: "rate_limited" }, 429);
      const body = await req.json().catch(() => ({}));

      if (sub === "checkins") {
        const { data, error } = await sb.rpc("framer_demo_checkin", {
          p_token: token,
          p_pain: Number(body.pain ?? 0),
          p_mob: Number(body.mob ?? 0),
        });
        if (error) return json({ error: error.message }, 500);
        if (data === null) return json({ error: "unauthorized" }, 401);
        return json({ ok: true });
      }
      if (sub === "duties/toggle") {
        const { data, error } = await sb.rpc("framer_demo_toggle", {
          p_token: token,
          p_id: Number(body.id),
          p_done: Boolean(body.done),
        });
        if (error) return json({ error: error.message }, 500);
        if (data === null) return json({ error: "unauthorized" }, 401);
        return json({ ok: true });
      }
      if (sub === "advance-day") {
        const { data, error } = await sb.rpc("framer_demo_advance", { p_token: token });
        if (error) return json({ error: error.message }, 500);
        if (data === null) return json({ error: "unauthorized" }, 401);
        return json({ ok: true });
      }
    }

    return json({ error: "not_found" }, 404);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
