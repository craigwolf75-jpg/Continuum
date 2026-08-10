/* Continuum Prompt 42: the batch worker and deadline aware scheduler (Section 4).

   The batch scheduler collects reports with status signed, generates one XML file,
   validates it, and on pass uploads, on fail marks the batch failed, returns the reports
   to signed, and notifies a named human (never a log, because a silently dropped report
   means the clinic believes it was filed while the statutory clock runs).

   Deadline aware scheduling (Section 4.1): the board's fee tiers turn on RECEIPT, and the
   same day tier includes up to 10:00 Mountain the next business day. Business day
   excludes weekends and Alberta statutory holidays. A report signed at 16:30 must go in
   the 17:00 batch, not the overnight 00:05 one. Compute the target batch from the
   deadline, not from the clock.

   Pure functions with injected side effects, no real clock, database or network. A
   moment is { date: 'YYYY-MM-DD', time: 'HH:MM' } in Mountain Time (the board's frame);
   all inputs are in that frame so no timezone conversion is needed. No dashes anywhere. */

export const DEFAULT_BATCH_SCHEDULE = ["00:05", "09:00", "14:00", "17:00"];
export const SAME_DAY_TIER_CUTOFF = "10:00"; // 10:00 MT the next business day

// Day of week from an ISO date, computed in UTC so it is deterministic (0 Sun .. 6 Sat).
const dow = (dateStr) => new Date(dateStr + "T00:00:00Z").getUTCDay();

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// A business day is a weekday that is not an Alberta statutory holiday (the holiday set
// is injected, sourced from the statutory_holiday table).
export function isBusinessDay(dateStr, holidays) {
  const hol = holidays instanceof Set ? holidays : new Set(holidays || []);
  const d = dow(dateStr);
  return d !== 0 && d !== 6 && !hol.has(dateStr);
}

export function nextBusinessDay(dateStr, holidays) {
  let d = addDays(dateStr, 1);
  let guard = 0;
  while (!isBusinessDay(d, holidays) && guard++ < 30) d = addDays(d, 1);
  return d;
}

// The same day tier deadline for a report signed on signDate: 10:00 MT the next business
// day. A report received by then earns the same day tier.
export function sameDayTierDeadline(signDateStr, holidays) {
  return { date: nextBusinessDay(signDateStr, holidays), time: SAME_DAY_TIER_CUTOFF };
}

const momentLE = (a, b) => a.date < b.date || (a.date === b.date && a.time <= b.time);
const momentLT = (a, b) => a.date < b.date || (a.date === b.date && a.time < b.time);

// The target batch: the earliest scheduled batch strictly after signedAt. meetsTier is
// whether that batch lands by the tier deadline (computed from the deadline, not the
// clock). Returns { date, time, meetsTier, deadline }.
export function targetBatch(signedAt, opts = {}) {
  const schedule = (opts.schedule || DEFAULT_BATCH_SCHEDULE).slice().sort();
  const holidays = opts.holidays;
  const deadline = opts.deadline || sameDayTierDeadline(signedAt.date, holidays);
  let date = signedAt.date;
  for (let i = 0; i < 14; i++) {
    for (const time of schedule) {
      const slot = { date, time };
      if (momentLT(signedAt, slot)) return { date, time, meetsTier: momentLE(slot, deadline), deadline };
    }
    date = addDays(date, 1);
  }
  return null;
}

// -- the batch worker state machine -----------------------------------------

export function collectSigned(reports) {
  return (reports || []).filter((r) => r.status === "signed");
}

// Section 6: a report whose practitioner is no longer active blocks the batch, named.
// Never default the batch through; block and name the practitioner.
export function blockedByInactivePractitioner(signed, isPractitionerActive) {
  const bad = (signed || []).filter((r) => !isPractitionerActive(r.practitioner_id));
  if (!bad.length) return { blocked: false };
  const who = [...new Set(bad.map((r) => r.practitioner_id))];
  return {
    blocked: true, id: "BATCH-INACTIVE-PRACTITIONER",
    reports: bad.map((r) => r.id), practitioners: who,
    message: "Batch blocked: reports authored by an inactive practitioner: " + who.join(", "),
  };
}

// On validation failure: mark the batch failed, return the reports to signed, notify a
// named human (Section 4, Section 6). The reports are never left in a limbo state.
export function onValidationFailure(signed, failures) {
  return {
    status: "failed",
    returnedToSigned: (signed || []).map((r) => r.id),
    failures: failures || [],
    notify: { recipient: "named-human", channel: "in_app", reason: "validation-failed" },
  };
}

// Run one batch cycle with injected effects: isPractitionerActive(id), generate(signed),
// validate(xml) -> { ok, failures }, upload(xml) -> { ok, ... }, notify(payload). Returns
// the outcome. Collects only signed reports; blocks on an inactive practitioner; on a
// validation failure returns the reports to signed and notifies; on pass uploads.
export function runBatch(ctx) {
  const { reports, isPractitionerActive, generate, validate, upload, notify } = ctx;
  const signed = collectSigned(reports);
  if (!signed.length) return { status: "empty" };

  const block = blockedByInactivePractitioner(signed, isPractitionerActive);
  if (block.blocked) { if (notify) notify(block); return { status: "blocked", ...block }; }

  const xml = generate(signed);
  const v = validate(xml);
  if (!v || !v.ok) {
    const out = onValidationFailure(signed, v ? v.failures : ["validation-unavailable"]);
    if (notify) notify(out.notify);
    return out;
  }

  const up = upload(xml);
  if (!up || !up.ok) {
    if (notify && up && up.escalation) notify(up.escalation);
    return { status: "upload-failed", returnedToSigned: signed.map((r) => r.id), upload: up };
  }
  return { status: "uploaded", reports: signed.map((r) => r.id), submission: up };
}
