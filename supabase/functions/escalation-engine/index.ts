// Continuum escalation engine (07.7), evaluator + actions.
// Governed by CONTINUUM_PROMPT_07.md section 07.7. No em-dashes or en-dashes.
//
// Drains escalation_checks (enqueued by the check-in trigger), evaluates the
// rules against the injury's recent check-ins, and on a trigger creates the
// escalation, advances the injury to escalated through the guarded status
// machine (system actor, records prior_status), and increments the
// escalation_count metric.
//
// Framing law: decision support only. Trigger text states the observed trend,
// never a diagnosis or clinical interpretation.
//
// Auth: x-worker-secret header equals the CONTINUUM_WORKER_SECRET function
// secret (same internal-worker pattern as the auto-actions worker).
//
// Seam (07.10): push and SMS notification of the granted nexus physician. For
// now the escalations row is the in-app signal the Nexus dashboard reads.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WORKER_SECRET = Deno.env.get("CONTINUUM_WORKER_SECRET")!;

const ACTIVE = ["reported", "off_work", "light_duty", "full_duty_pending"];
const BATCH = 50;

type Log = {
  pain_score: number | null;
  mobility_score: number | null;
  notes: string | null;
  logged_at: string;
  source: string;
};

// Pure rule evaluator. logs are check-ins newest first. Returns the first rule
// that fires, in trend language.
export function evaluate(
  logs: Log[],
  keywords: string[],
): { triggered: boolean; reason: string | null } {
  const checkins = logs.filter((l) => l.source === "check_in");

  // Rule 3: red-flag keyword in the most recent note (case-insensitive).
  const newestNote = checkins[0]?.notes?.toLowerCase() ?? "";
  if (newestNote && keywords.some((k) => newestNote.includes(k.toLowerCase()))) {
    return { triggered: true, reason: "a recent check-in note was flagged for clinician review" };
  }

  // Rule 1: pain at or above 8 for 3 consecutive check-ins.
  if (
    checkins.length >= 3 &&
    checkins.slice(0, 3).every((l) => (l.pain_score ?? 0) >= 8)
  ) {
    return { triggered: true, reason: "pain trending high for 3 check-ins" };
  }

  // Rule 2: mobility declining across 2 or more days (3 readings strictly down
  // over time; logs are newest first, so newest is the lowest).
  if (checkins.length >= 3) {
    const m = checkins.slice(0, 3).map((l) => l.mobility_score);
    if (m.every((x) => x !== null) && (m[0] as number) < (m[1] as number) && (m[1] as number) < (m[2] as number)) {
      return { triggered: true, reason: "mobility declining across recent check-ins" };
    }
  }

  return { triggered: false, reason: null };
}

Deno.serve(async (req: Request) => {
  if (req.headers.get("x-worker-secret") !== WORKER_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: kws } = await sb.from("escalation_keywords").select("keyword").eq("active", true);
  const keywords = (kws ?? []).map((k: { keyword: string }) => k.keyword);

  const { data: checks, error } = await sb
    .from("escalation_checks")
    .select("id, injury_id, tenant_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  let processed = 0;
  let escalated = 0;

  for (const check of checks ?? []) {
    try {
      const did = await handleCheck(sb, check, keywords);
      if (did) escalated++;
      await mark(sb, check.id, "done");
      processed++;
    } catch (e) {
      await mark(sb, check.id, "failed");
      console.error(`escalation_check ${check.id} failed:`, e);
    }
  }

  return json({ processed, escalated });
});

async function handleCheck(
  sb: ReturnType<typeof createClient>,
  check: { id: string; injury_id: string; tenant_id: string },
  keywords: string[],
): Promise<boolean> {
  // Only evaluate injuries in an active, non-escalated state.
  const { data: injury, error: iErr } = await sb
    .from("injuries")
    .select("id, tenant_id, status")
    .eq("id", check.injury_id)
    .single();
  if (iErr) throw iErr;
  if (!injury || !ACTIVE.includes(injury.status as string)) return false;

  // Do not stack escalations: skip if an unresolved one is already open.
  const { data: open } = await sb
    .from("escalations")
    .select("id")
    .eq("injury_id", check.injury_id)
    .is("resolved_at", null)
    .limit(1);
  if (open && open.length > 0) return false;

  const { data: logs } = await sb
    .from("recovery_logs")
    .select("pain_score, mobility_score, notes, logged_at, source")
    .eq("injury_id", check.injury_id)
    .is("deleted_at", null)
    .order("logged_at", { ascending: false })
    .limit(10);

  const verdict = evaluate((logs ?? []) as Log[], keywords);
  if (!verdict.triggered) return false;

  // Create the escalation (trend language), then advance through the guarded
  // machine so prior_status is recorded and the transition is audited.
  const { error: eErr } = await sb.from("escalations").insert({
    tenant_id: injury.tenant_id,
    injury_id: injury.id,
    trigger: verdict.reason,
    notified_party: "nexus",
  });
  if (eErr) throw eErr;

  const { error: aErr } = await sb.rpc("advance_injury_status", {
    p_injury_id: injury.id,
    p_to_status: "escalated",
    p_actor: "system",
  });
  if (aErr) throw aErr;

  // Increment the escalation_count metric (running count for the injury).
  const { count } = await sb
    .from("escalations")
    .select("id", { count: "exact", head: true })
    .eq("injury_id", injury.id);
  await sb.from("case_metrics").insert({
    tenant_id: injury.tenant_id,
    injury_id: injury.id,
    metric: "escalation_count",
    value: count ?? 1,
  });

  // Notify the granted nexus physician and record the send (07.10). Push is a
  // mock here; SMS lands behind the SmsProvider in 07.2. In-app is the row.
  const { data: grants } = await sb
    .from("access_grants")
    .select("user_id")
    .is("deleted_at", null)
    .or(`injury_id.eq.${injury.id},tenant_id.eq.${injury.tenant_id}`);
  const grantIds = (grants ?? []).map((g: { user_id: string }) => g.user_id);
  if (grantIds.length > 0) {
    const { data: nexus } = await sb
      .from("users")
      .select("id")
      .eq("role", "nexus_physician")
      .in("id", grantIds);
    for (const u of nexus ?? []) {
      await sb.from("notifications").insert({
        tenant_id: injury.tenant_id,
        user_id: u.id,
        injury_id: injury.id,
        channel: "push",
        kind: "escalation",
        body: verdict.reason,
      });
    }
  }

  return true;
}

async function mark(
  sb: ReturnType<typeof createClient>,
  id: string,
  status: "done" | "failed",
) {
  await sb.from("escalation_checks").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
