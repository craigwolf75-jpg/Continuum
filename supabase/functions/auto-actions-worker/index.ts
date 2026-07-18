// Continuum auto-actions worker (07.5 runtime layer).
// Governed by CONTINUUM_PROMPT_07.md section 07.5. No em-dashes or en-dashes.
//
// Drains the auto_actions queue produced by advance_injury_status() and
// performs each action's effect, then marks the row done (or failed). Runs in
// Supabase Edge (ca-central-1) with the service role, so PHI never leaves the
// region. Intended to be invoked on a short schedule (cron) or by a database
// webhook on auto_actions insert.
//
// Auth: verify_jwt is off; the caller must present the shared worker secret in
// the x-worker-secret header (set as the CONTINUUM_WORKER_SECRET function
// secret). Only the scheduler (or an operator holding the secret) can invoke
// it. No user JWT path exists.
//
// Seams left for later prompts (marked TODO 07.8):
//   - WCB notification payload shapes are verbatim client contracts in 07.8;
//     here we create the lifecycle row (pending) with a minimal payload and a
//     FIELDSET_VERSION marker so reconciliation is one change.
//   - generate_ffw_form renders a Fitness-for-Work PDF (pdf-lib) to a private
//     bucket in 07.8; here it is recognized and marked done with a note.

import { createClient } from "npm:@supabase/supabase-js@2";

const FIELDSET_VERSION = "ab-2026-07";
const BATCH = 50;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WORKER_SECRET = Deno.env.get("CONTINUUM_WORKER_SECRET")!;

type AutoAction = {
  id: string;
  tenant_id: string;
  injury_id: string;
  from_status: string | null;
  to_status: string;
  action_type: string;
};

Deno.serve(async (req: Request) => {
  // Only the worker-secret holder may run the worker.
  if (req.headers.get("x-worker-secret") !== WORKER_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { data: pending, error } = await sb
    .from("auto_actions")
    .select("id, tenant_id, injury_id, from_status, to_status, action_type")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (error) return json({ error: error.message }, 500);

  const summary: Record<string, number> = {};
  let processed = 0;
  let failed = 0;

  for (const action of (pending ?? []) as AutoAction[]) {
    try {
      await handle(sb, action);
      await mark(sb, action.id, "done");
      summary[action.action_type] = (summary[action.action_type] ?? 0) + 1;
      processed++;
    } catch (e) {
      await mark(sb, action.id, "failed");
      failed++;
      console.error(`auto_action ${action.id} (${action.action_type}) failed:`, e);
    }
  }

  return json({ processed, failed, by_type: summary });
});

async function handle(sb: ReturnType<typeof createClient>, a: AutoAction) {
  switch (a.action_type) {
    case "wcb_initial_notification":
      await ensureWcbNotification(sb, a, "initial");
      break;
    case "wcb_light_duty_notification":
      await ensureWcbNotification(sb, a, "light_duty");
      break;
    case "wcb_full_duty_notification":
      // TODO 07.8: attach the generated FFW PDF to this notification.
      await ensureWcbNotification(sb, a, "full_duty");
      break;
    case "publish_restrictions":
      // Restrictions are set by the Nexus clearance onto light_duties; the
      // dashboards render them from the injury's current published row. No
      // extra write is needed here in the core; recognized and drained.
      break;
    case "surface_on_employer_dashboard":
      // The employer view surfaces active injuries through RLS/views; this is
      // an informational marker, recognized and drained.
      break;
    case "generate_ffw_form":
      // TODO 07.8: render the Fitness-for-Work PDF with pdf-lib and store it to
      // a private bucket with signed-URL access, audited.
      break;
    case "close_case":
      // signed_off is the closed state; no extra write. Recognized and drained.
      break;
    default:
      throw new Error(`unknown action_type ${a.action_type}`);
  }
}

// Idempotent: create the lifecycle row only if one of this type does not yet
// exist for the injury (intake may have already queued the initial one).
async function ensureWcbNotification(
  sb: ReturnType<typeof createClient>,
  a: AutoAction,
  type: "initial" | "light_duty" | "full_duty",
) {
  const { data: existing, error: selErr } = await sb
    .from("wcb_notifications")
    .select("id")
    .eq("injury_id", a.injury_id)
    .eq("type", type)
    .is("deleted_at", null)
    .limit(1);
  if (selErr) throw selErr;
  if (existing && existing.length > 0) return;

  const { error: insErr } = await sb.from("wcb_notifications").insert({
    tenant_id: a.tenant_id,
    injury_id: a.injury_id,
    type,
    status: "pending",
    // TODO 07.8: replace with the verbatim client payload contract.
    payload: { fieldset_version: FIELDSET_VERSION, queued_by: "auto-actions-worker" },
  });
  if (insErr) throw insErr;
}

async function mark(
  sb: ReturnType<typeof createClient>,
  id: string,
  status: "done" | "failed",
) {
  await sb
    .from("auto_actions")
    .update({ status, processed_at: new Date().toISOString() })
    .eq("id", id);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
