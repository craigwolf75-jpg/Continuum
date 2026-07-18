// Continuum intake endpoint (07.6): POST /v1/cases, the front door.
// Governed by CONTINUUM_PROMPT_07.md section 07.6. No em-dashes or en-dashes.
//
// Contract shape is VERBATIM from the client; field names are the seam, do not
// rename:
//   POST /cases
//   { nexus_case_ref,
//     worker: { full_name, phone, dob, sin, job_title },
//     tenant: { wcb_account_number, company_name },
//     injury: { date_of_injury, body_part, injury_type, severity, prognosis_days,
//               diagnosis_notes, initial_restrictions } }
//   Returns 201 { injury_id, status: "reported", sms_dispatched: true }
//
// severity minor: return { engaged: false }, create nothing, log nothing clinical.
// moderate or major: resolve or create the tenant by wcb_account_number, create
//   worker and injury (status reported), fire the intake SMS, queue the WCB
//   initial notification as pending, write the case_metrics baseline.
//
// SIN: stored only as mask plus hash; the raw value is never persisted here and
// never returned. Auth: a static service token behind a NexusAuth boundary,
// swappable for SSO or mTLS when the Nexus spec lands.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NEXUS_TOKEN = Deno.env.get("CONTINUUM_NEXUS_TOKEN")!;

// NexusAuth boundary. Today a static token; swap the body for SSO or mTLS later
// without touching the handler.
function nexusAuthOk(req: Request): boolean {
  return req.headers.get("x-nexus-token") === NEXUS_TOKEN;
}

// SmsProvider seam. A mock that logs; the Twilio implementation lands in 07.2.
function smsProviderSend(to: string, body: string): boolean {
  console.log(`[mock SMS] to=${to} body=${body}`);
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!nexusAuthOk(req)) return json({ error: "unauthorized" }, 401);

  let b: Record<string, any>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const worker = b.worker ?? {};
  const tenant = b.tenant ?? {};
  const injury = b.injury ?? {};
  const severity = injury.severity as string | undefined;

  if (!b.nexus_case_ref || !severity || !tenant.wcb_account_number) {
    return json({ error: "missing required fields" }, 400);
  }

  // Minor: engage nothing, record nothing clinical.
  if (severity === "minor") {
    return json({ engaged: false });
  }
  if (severity !== "moderate" && severity !== "major") {
    return json({ error: `invalid severity ${severity}` }, 400);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Idempotency: one injury per nexus_case_ref.
  const { data: existing } = await sb
    .from("injuries")
    .select("id, status")
    .eq("nexus_case_ref", b.nexus_case_ref)
    .is("deleted_at", null)
    .limit(1);
  if (existing && existing.length > 0) {
    return json({ injury_id: existing[0].id, status: existing[0].status, sms_dispatched: false, existing: true });
  }

  // Resolve or create the tenant by wcb_account_number. Province defaults to ab
  // for the MVP; the schema does not hard-code Alberta anywhere else.
  let tenantId: string;
  const { data: tRow } = await sb
    .from("tenants")
    .select("id")
    .eq("wcb_account_number", tenant.wcb_account_number)
    .is("deleted_at", null)
    .limit(1);
  if (tRow && tRow.length > 0) {
    tenantId = tRow[0].id;
  } else {
    const { data: tNew, error: tErr } = await sb
      .from("tenants")
      .insert({
        name: tenant.company_name ?? "Unknown",
        province: "ab",
        wcb_account_number: tenant.wcb_account_number,
        rtw_obligation_frame: "incentive",
        status: "active",
      })
      .select("id")
      .single();
    if (tErr) return json({ error: tErr.message }, 500);
    tenantId = tNew.id;
  }

  // Resolve or create the worker (users + workers) by phone within the tenant.
  let workerId: string;
  const { data: uRow } = await sb
    .from("users")
    .select("id")
    .eq("phone", worker.phone)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .limit(1);
  let userId: string;
  if (uRow && uRow.length > 0) {
    userId = uRow[0].id;
    const { data: wRow } = await sb.from("workers").select("id").eq("user_id", userId).limit(1);
    workerId = wRow && wRow.length > 0 ? wRow[0].id : (await insertWorker(sb, tenantId, userId, worker)).id;
  } else {
    const { data: uNew, error: uErr } = await sb
      .from("users")
      .insert({
        phone: worker.phone,
        full_name: worker.full_name,
        role: "worker",
        tenant_id: tenantId,
        status: "invited",
      })
      .select("id")
      .single();
    if (uErr) return json({ error: uErr.message }, 500);
    userId = uNew.id;
    workerId = (await insertWorker(sb, tenantId, userId, worker)).id;
  }

  // Injury (status reported).
  const est = injury.date_of_injury && injury.prognosis_days
    ? addDays(injury.date_of_injury, Number(injury.prognosis_days))
    : null;
  const { data: iNew, error: iErr } = await sb
    .from("injuries")
    .insert({
      tenant_id: tenantId,
      worker_id: workerId,
      date_of_injury: injury.date_of_injury ?? null,
      body_part: injury.body_part ?? null,
      injury_type: injury.injury_type ?? null,
      severity,
      prognosis_days: injury.prognosis_days ?? null,
      diagnosis_notes: injury.diagnosis_notes ?? null,
      status: "reported",
      estimated_return_date: est,
      nexus_case_ref: b.nexus_case_ref,
      current_restrictions: injury.initial_restrictions ?? null,
    })
    .select("id")
    .single();
  if (iErr) return json({ error: iErr.message }, 500);
  const injuryId = iNew.id;

  // Queue the WCB initial notification (pending). SIN masked only in the payload.
  await sb.from("wcb_notifications").insert({
    tenant_id: tenantId,
    injury_id: injuryId,
    type: "initial",
    status: "pending",
    payload: {
      wcb_account_number: tenant.wcb_account_number,
      worker_name: worker.full_name,
      sin_masked: maskSin(worker.sin ?? ""),
      dob: worker.dob ?? null,
      date_of_injury: injury.date_of_injury ?? null,
      body_part: injury.body_part ?? null,
      incident_description: injury.diagnosis_notes ?? null,
      time_lost: true,
    },
  });

  // case_metrics baseline: start the days_to_first_checkin clock at intake.
  await sb.from("case_metrics").insert({
    tenant_id: tenantId,
    injury_id: injuryId,
    metric: "days_to_first_checkin",
    value: null,
  });

  // Audit the intake.
  await sb.from("audit_log").insert({
    tenant_id: tenantId,
    action: `intake:case ${b.nexus_case_ref} severity ${severity}`,
    entity: "injuries",
    entity_id: injuryId,
  });

  // Fire the intake SMS with the app link (mock provider for now).
  const sms = smsProviderSend(
    worker.phone ?? "",
    "Continuum: your recovery check-ins start now. Open the app: https://continuum-pink.vercel.app/app",
  );

  return json({ injury_id: injuryId, status: "reported", sms_dispatched: sms }, 201);
});

async function insertWorker(
  sb: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  worker: Record<string, any>,
) {
  const { data, error } = await sb
    .from("workers")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      job_title: worker.job_title ?? null,
      dob: worker.dob ?? null,
      sin_masked: maskSin(worker.sin ?? ""),
      sin_hash: await sha256Hex(worker.sin ?? ""),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

// Keep only the last three digits: 123456789 -> ***-***-789
function maskSin(sin: string): string {
  const digits = sin.replace(/\D/g, "");
  if (digits.length < 3) return "***-***-***";
  return `***-***-${digits.slice(-3)}`;
}

async function sha256Hex(input: string): Promise<string | null> {
  if (!input) return null;
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
