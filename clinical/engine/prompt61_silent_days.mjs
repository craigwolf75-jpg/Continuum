/* Continuum Prompt 61 Section 5.2: silent days.

   A silent day is a day in the case with no recorded contact, no
   clinical update, no duty change, and no employer touch. Report per
   case, per site, per coordinator. Missing counts are UNKNOWN, never 0.

   No dashes anywhere. */

function dayKey(iso) {
  if (!iso) return null;
  return String(iso).slice(0, 10);
}

function eachDay(from, to) {
  const start = dayKey(from);
  const end = dayKey(to);
  if (!start || !end) return [];
  const out = [];
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur <= last) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function isTouchEvent(ev) {
  const kind = ev && ev.kind;
  return kind === "contact"
    || kind === "clinical_update"
    || kind === "duty_change"
    || kind === "employer_touch";
}

export function silentDays(events, from, to) {
  if (!from || !to) {
    return { days: "UNKNOWN", dates: [], from: from || "UNKNOWN", to: to || "UNKNOWN" };
  }
  const range = eachDay(from, to);
  const touched = new Set();
  for (const ev of Array.isArray(events) ? events : []) {
    if (!isTouchEvent(ev)) continue;
    const d = dayKey(ev.at || ev.date);
    if (d) touched.add(d);
  }
  const dates = range.filter((d) => !touched.has(d));
  return { days: dates.length, dates, from, to };
}

export function silentDaysByGroup(cases, from, to, groupKey) {
  const list = Array.isArray(cases) ? cases : [];
  if (list.length === 0) {
    return { group: groupKey || null, days: "UNKNOWN", case_count: "UNKNOWN" };
  }
  const rows = list.map((c) => ({
    case_ref: c.case_ref || null,
    group: c[groupKey] || null,
    ...silentDays(c.events, from, to),
  }));
  return rows;
}
