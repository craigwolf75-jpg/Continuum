/* Continuum Prompt 61 Section 5.1: employer conduct measurement.

   Case facts and aggregate site-level reporting. Never a score. Never
   an assessment of a named individual manager. Suppress aggregates
   below k_min (default 5). Claim-date snapshot of site, shift pattern,
   and supervisor is taken at case creation. Without the snapshot the
   comparison cannot be computed later.

   Missing values are UNKNOWN, never 0. No dashes anywhere. */

import { silentDays } from "./prompt61_silent_days.mjs";
import { hoursPlanAdherence } from "./prompt61_hours.mjs";

export const K_MIN_DEFAULT = 5;

export function snapshotAtClaim(input) {
  const src = input || {};
  return {
    captured_at: src.captured_at || src.claim_date || null,
    site: src.site != null ? src.site : null,
    shift_pattern: src.shift_pattern != null ? src.shift_pattern : null,
    supervisor_ref: src.supervisor_ref != null ? src.supervisor_ref : null,
    required_for_comparison: true,
  };
}

function daysBetween(from, to) {
  if (!from || !to) return "UNKNOWN";
  const a = Date.parse(String(from).slice(0, 10) + "T00:00:00Z");
  const b = Date.parse(String(to).slice(0, 10) + "T00:00:00Z");
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "UNKNOWN";
  return Math.round((b - a) / 86400000);
}

function lastContactGap(contacts, asOf) {
  const list = Array.isArray(contacts) ? contacts.slice().sort((x, y) => String(x.at).localeCompare(String(y.at))) : [];
  if (list.length === 0) {
    return { days_since_last_contact: "UNKNOWN", longest_gap_days: "UNKNOWN", first_contact_at: null };
  }
  const first = list[0].at;
  const last = list[list.length - 1].at;
  let longest = 0;
  for (let i = 1; i < list.length; i++) {
    const gap = daysBetween(list[i - 1].at, list[i].at);
    if (gap !== "UNKNOWN" && gap > longest) longest = gap;
  }
  const tail = daysBetween(last, asOf);
  if (tail !== "UNKNOWN" && tail > longest) longest = tail;
  return {
    days_since_last_contact: daysBetween(last, asOf),
    longest_gap_days: longest,
    first_contact_at: first,
    days_to_first_contact: daysBetween(list[0].claim_date || null, first),
  };
}

export function employerConductReport(input) {
  const src = input || {};
  const snapshot = src.snapshot || snapshotAtClaim(src.claim_snapshot);
  const asOf = src.asOf || null;
  const contacts = src.contacts || [];
  const gap = lastContactGap(contacts.map((c) => ({ ...c, claim_date: src.claim_date })), asOf);
  const discussed = src.modified_role_discussed_at || null;
  const offered = src.modified_role_offered_at || null;
  const restrictionIssued = src.restriction_issued_at || null;
  const firstModified = src.first_modified_shift_at || null;
  const current = src.current_assignment || {};
  const same_site = snapshot.site && current.site
    ? snapshot.site === current.site
    : "UNKNOWN";
  const same_shift_pattern = snapshot.shift_pattern && current.shift_pattern
    ? snapshot.shift_pattern === current.shift_pattern
    : "UNKNOWN";
  const same_supervisor = snapshot.supervisor_ref && current.supervisor_ref
    ? snapshot.supervisor_ref === current.supervisor_ref
    : "UNKNOWN";
  const hours = hoursPlanAdherence(src.hours_eval || null, src.actual_hours || null);
  const silent = silentDays(src.events || [], src.claim_date, asOf);

  return {
    kind: "case_facts",
    score: null,
    named_manager_assessment: null,
    days_to_first_contact: gap.days_to_first_contact != null ? gap.days_to_first_contact : "UNKNOWN",
    days_since_last_contact: gap.days_since_last_contact,
    longest_gap_days: gap.longest_gap_days,
    modified_role_discussed_at: discussed,
    modified_role_offered_at: offered,
    modified_role_offered_is_distinct: true,
    days_from_restriction_to_first_modified_shift: daysBetween(restrictionIssued, firstModified),
    hours_plan_adherence: hours,
    claim_date_snapshot: snapshot,
    same_site,
    same_shift_pattern,
    same_supervisor,
    silent_days: silent.days,
    snapshot_present: Boolean(snapshot.captured_at && (snapshot.site || snapshot.shift_pattern || snapshot.supervisor_ref)),
  };
}

export function aggregateSiteConduct(reports, kMin) {
  const k = kMin == null ? K_MIN_DEFAULT : Number(kMin);
  const list = Array.isArray(reports) ? reports : [];
  if (list.length < k) {
    return {
      suppressed: true,
      reason: "below_k_min",
      k_min: k,
      n: list.length,
      score: null,
      named_manager_assessment: null,
    };
  }
  const nums = list.map((r) => r.days_to_first_contact).filter((n) => n !== "UNKNOWN" && n != null);
  const offered = list.filter((r) => r.modified_role_offered_at).length;
  const discussed = list.filter((r) => r.modified_role_discussed_at).length;
  return {
    suppressed: false,
    k_min: k,
    n: list.length,
    score: null,
    named_manager_assessment: null,
    cases_with_offer: offered,
    cases_with_discussed: discussed,
    days_to_first_contact_mean: nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : "UNKNOWN",
  };
}

export function sortPsychCases(rows, field) {
  const allowed = ["outstanding_actions", "days_since_contact", "days_since_restriction_issued"];
  if (!allowed.includes(field)) {
    return { ok: false, reason: "sort_not_administrative", field };
  }
  const list = Array.isArray(rows) ? rows.slice() : [];
  list.sort((a, b) => {
    const av = a && a[field] != null ? a[field] : Number.POSITIVE_INFINITY;
    const bv = b && b[field] != null ? b[field] : Number.POSITIVE_INFINITY;
    return Number(av) - Number(bv);
  });
  return { ok: true, field, rows: list };
}
