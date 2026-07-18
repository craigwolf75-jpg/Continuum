// Continuum clearance and reassess endpoints (07.5).
// Governed by CONTINUUM_PROMPT_07.md section 07.5. No em-dashes or en-dashes.
//
// Routes (client contract shapes, field names are the seam, do not rename):
//   POST /injuries/{id}/clearance { clear_to, restrictions?, effective_date, physician }
//   POST /injuries/{id}/reassess  { action, new_status?, note }
//
// Both must be the nexus_physician holding an access grant for the injury.
// That is enforced in the database: the endpoint forwards the caller's JWT to
// advance_injury_status(), whose user-driven path derives the actor from the
// claim and checks the grant. The endpoint adds no authority of its own for
// the transition; it only records restrictions (clearance) and resolves the
// open escalation (reassess) once the guarded transition has succeeded.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  // Parse /injuries/{id}/{action}
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("injuries");
  const id = idx >= 0 ? parts[idx + 1] : undefined;
  const action = idx >= 0 ? parts[idx + 2] : undefined;
  if (!id || (action !== "clearance" && action !== "reassess")) {
    return json({ error: "not_found" }, 404);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Caller-scoped client: the user's JWT rides on every request so RLS and the
  // advance_injury_status authorization apply as this nexus physician.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  if (action === "clearance") return clearance(userClient, id, body);
  return reassess(userClient, id, body);
});

async function clearance(
  userClient: ReturnType<typeof createClient>,
  id: string,
  body: Record<string, unknown>,
) {
  const clearTo = body.clear_to as string | undefined;
  const restrictions = (body.restrictions as string | undefined) ?? null;
  const effectiveDate = (body.effective_date as string | undefined) ?? null;
  const physician = (body.physician as string | undefined) ?? null;
  if (!clearTo) return json({ error: "clear_to is required" }, 400);

  // Guarded transition (nexus + grant + valid edge enforced in the DB).
  const { error } = await userClient.rpc("advance_injury_status", {
    p_injury_id: id,
    p_to_status: clearTo,
  });
  if (error) return mapDbError(error);

  // Record the published restrictions on the injury (RLS lets the granted
  // nexus write; HSE cannot). Non-status update, so the block trigger allows it.
  if (restrictions !== null || effectiveDate !== null) {
    const { error: uErr } = await userClient
      .from("injuries")
      .update({ current_restrictions: restrictions, restrictions_effective_date: effectiveDate })
      .eq("id", id);
    if (uErr) return mapDbError(uErr);
  }

  return json({
    injury_id: id,
    status: clearTo,
    restrictions,
    effective_date: effectiveDate,
    physician,
  });
}

async function reassess(
  userClient: ReturnType<typeof createClient>,
  id: string,
  body: Record<string, unknown>,
) {
  const action = (body.action as string | undefined) ?? "reassess";
  const note = (body.note as string | undefined) ?? null;
  let target = body.new_status as string | undefined;

  // Service client: used to resolve the default target (a status value, not
  // PHI) and for post-transition bookkeeping. It is NOT the authorization
  // boundary; advance_injury_status below enforces nexus plus grant.
  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Default the target to the injury's recorded prior_status.
  if (!target) {
    const { data, error } = await svc
      .from("injuries")
      .select("prior_status")
      .eq("id", id)
      .maybeSingle();
    if (error) return mapDbError(error);
    target = (data?.prior_status as string | null) ?? undefined;
    if (!target) return json({ error: "no prior_status to reassess to" }, 409);
  }

  // Guarded transition, enforced in the DB as the calling nexus physician.
  const { error } = await userClient.rpc("advance_injury_status", {
    p_injury_id: id,
    p_to_status: target,
  });
  if (error) return mapDbError(error);

  // Post-transition bookkeeping needs privileges beyond the nexus RLS surface
  // (escalations has no user update policy). Safe now: the guarded transition
  // above already proved the caller is authorized.
  const { data: resolved } = await svc
    .from("escalations")
    .update({ resolved_at: new Date().toISOString() })
    .eq("injury_id", id)
    .is("resolved_at", null)
    .select("id");
  await svc.from("audit_log").insert({
    action: `reassess:${action}` + (note ? ` note=${note}` : ""),
    entity: "injuries",
    entity_id: id,
  });

  return json({
    injury_id: id,
    status: target,
    action,
    resolved_escalations: resolved?.length ?? 0,
  });
}

function mapDbError(error: { message?: string; code?: string }) {
  const m = error.message ?? "";
  if (error.code?.startsWith("PGRST30") || m.includes("JWT")) return json({ error: m }, 401);
  if (m.includes("ACCESS_DENIED") || m.includes("ROLE_DENIED")) return json({ error: m }, 403);
  if (m.includes("INVALID_TRANSITION") || m.includes("NO_PRIOR_STATUS")) return json({ error: m }, 409);
  if (m.includes("INJURY_NOT_FOUND")) return json({ error: m }, 404);
  if (m.includes("NO_ACTOR")) return json({ error: m }, 401);
  return json({ error: m || "bad_request" }, 400);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
