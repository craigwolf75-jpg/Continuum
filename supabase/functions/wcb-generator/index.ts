// Continuum WCB document generator (07.8).
// Governed by CONTINUUM_PROMPT_07.md section 07.8. No em-dashes or en-dashes.
//
// Drains pending (and failed, for retry) wcb_notifications, builds the verbatim
// payload for each type, stamps the form code, name and deadline from
// province_form_codes (no Alberta string hard-coded), computes the deadline
// countdown target, renders the Fitness-for-Work PDF for full_duty into a
// private bucket, and marks the row generated. Nothing is submitted anywhere.
//
// Field sets are a pre-go-live verification item; FIELDSET_VERSION marks every
// generated payload so reconciliation is one change.
//
// Full SIN: the initial payload carries sin_masked only. Embedding the full SIN
// into the myWCB employer report is a separate audited secure-store path (seam,
// not built here). Auth: x-worker-secret header.

import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts } from "npm:pdf-lib@1.17.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WORKER_SECRET = Deno.env.get("CONTINUUM_WORKER_SECRET")!;

const FIELDSET_VERSION = "ab-2026-07";
const BUCKET = "wcb-documents";
const BATCH = 25;

// which province_form_codes party frames each notification type
const PARTY: Record<string, string> = {
  initial: "employer",
  light_duty: "employer",
  full_duty: "physician",
};

Deno.serve(async (req: Request) => {
  if (req.headers.get("x-worker-secret") !== WORKER_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: rows, error } = await sb
    .from("wcb_notifications")
    .select("id, tenant_id, injury_id, type, payload, wcb_claim_number")
    .in("status", ["pending", "failed"])
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  let generated = 0;
  let failed = 0;
  const byType: Record<string, number> = {};

  for (const n of rows ?? []) {
    try {
      await generate(sb, n);
      byType[n.type] = (byType[n.type] ?? 0) + 1;
      generated++;
    } catch (e) {
      await sb.from("wcb_notifications").update({ status: "failed" }).eq("id", n.id);
      failed++;
      console.error(`wcb_notification ${n.id} (${n.type}) failed:`, e);
    }
  }

  return json({ generated, failed, by_type: byType });
});

async function generate(sb: ReturnType<typeof createClient>, n: any) {
  // Case context.
  const { data: injury, error: iErr } = await sb
    .from("injuries")
    .select("id, tenant_id, worker_id, body_part, injury_type, date_of_injury, prognosis_days, estimated_return_date, current_restrictions, restrictions_effective_date")
    .eq("id", n.injury_id)
    .single();
  if (iErr) throw iErr;

  const { data: worker } = await sb
    .from("workers")
    .select("id, dob, sin_masked, user_id")
    .eq("id", injury.worker_id)
    .single();
  const { data: user } = await sb.from("users").select("full_name").eq("id", worker.user_id).single();
  const { data: tenant } = await sb
    .from("tenants")
    .select("province, wcb_account_number")
    .eq("id", injury.tenant_id)
    .single();

  // Form metadata for this province and party (no hard-coded province strings).
  const { data: form } = await sb
    .from("province_form_codes")
    .select("form_code, form_name, deadline_text, deadline_hours")
    .eq("province", tenant.province)
    .eq("party", PARTY[n.type])
    .maybeSingle();

  const deadlineAt =
    form?.deadline_hours && injury.date_of_injury
      ? new Date(new Date(injury.date_of_injury + "T00:00:00Z").getTime() + form.deadline_hours * 3600_000).toISOString()
      : null;

  // Verbatim payload per type.
  let payload: Record<string, unknown>;
  let documentUrl: string | null = null;

  if (n.type === "initial") {
    payload = {
      wcb_account_number: tenant.wcb_account_number,
      worker_name: user?.full_name ?? null,
      sin_masked: worker?.sin_masked ?? null,
      dob: worker?.dob ?? null,
      date_of_injury: injury.date_of_injury,
      body_part: injury.body_part,
      incident_description: n.payload?.incident_description ?? null,
      time_lost: true,
    };
  } else if (n.type === "light_duty") {
    payload = {
      wcb_claim_number: n.wcb_claim_number ?? null,
      modified_duty_start_date: injury.restrictions_effective_date ?? null,
      modified_duties_description: injury.current_restrictions ?? null,
      restrictions: injury.current_restrictions ?? null,
    };
  } else if (n.type === "full_duty") {
    // Render and store the Fitness-for-Work PDF.
    const path = await renderFfwPdf(sb, injury, user?.full_name ?? "", tenant);
    const { data: signed } = await sb.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
    documentUrl = signed?.signedUrl ?? null;
    payload = {
      wcb_claim_number: n.wcb_claim_number ?? null,
      regular_duty_return_date: injury.estimated_return_date ?? null,
      hours_pay_confirmed: false,
      fitness_for_work_form: path,
    };
  } else {
    throw new Error(`unknown notification type ${n.type}`);
  }

  const { error: uErr } = await sb
    .from("wcb_notifications")
    .update({
      status: "generated",
      generated_at: new Date().toISOString(),
      sent_timestamp: new Date().toISOString(),
      form_code: form?.form_code ?? null,
      form_name: form?.form_name ?? null,
      deadline_text: form?.deadline_text ?? null,
      deadline_at: deadlineAt,
      document_url: documentUrl,
      fieldset_version: FIELDSET_VERSION,
      payload,
    })
    .eq("id", n.id);
  if (uErr) throw uErr;

  await sb.from("audit_log").insert({
    tenant_id: injury.tenant_id,
    action: `wcb:${n.type} generated (${form?.form_code ?? "no-form"})`,
    entity: "wcb_notifications",
    entity_id: n.id,
  });
}

async function renderFfwPdf(
  sb: ReturnType<typeof createClient>,
  injury: any,
  workerName: string,
  tenant: any,
): Promise<string> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 740;
  const line = (t: string, f = font, size = 11) => {
    page.drawText(t, { x: 56, y, size, font: f });
    y -= size + 8;
  };
  line("Fitness for Work", bold, 18);
  y -= 6;
  line(`Worker: ${workerName}`);
  line(`Body part: ${injury.body_part ?? ""}`);
  line(`Injury type: ${injury.injury_type ?? ""}`);
  line(`Date of injury: ${injury.date_of_injury ?? ""}`);
  line(`Regular duty return date: ${injury.estimated_return_date ?? ""}`);
  line(`Current restrictions: ${injury.current_restrictions ?? "none"}`);
  y -= 10;
  line("This form supports the return-to-work milestone. It is not a medical", font, 9);
  line("record and does not diagnose, treat, cure, or prevent any disease.", font, 9);

  const bytes = await pdf.save();
  const path = `${injury.tenant_id}/${injury.id}/ffw-${crypto.randomUUID()}.pdf`;
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
