/* Prompt 49 code and status mapping.

   Most specific wins: organisation + jurisdiction, then organisation, then
   jurisdiction, then platform wide. Only approved mappings are used.
   A proposed mapping is never used. An unmapped value is unmapped, never
   unknown or other. No component branches on jurisdiction: the override
   is a lookup key.
   No em dashes or en dashes. */

import { isBlank, norm } from "./util.mjs";

export function mappingSpecificity(row, organisationId, jurisdictionCode) {
  const orgMatch = row.organisation_id && row.organisation_id === organisationId;
  const jurMatch = row.jurisdiction_code && row.jurisdiction_code === jurisdictionCode;
  if (orgMatch && jurMatch) return 4;
  if (orgMatch && !row.jurisdiction_code) return 3;
  if (!row.organisation_id && jurMatch) return 2;
  if (!row.organisation_id && !row.jurisdiction_code) return 1;
  return 0;
}

export function resolveMapping(query, store) {
  const q = query || {};
  const rows = ((store && store.vocabularyMaps) || []).filter((row) => {
    if (row.external_system !== q.external_system) return false;
    if (row.external_code_set !== q.external_code_set) return false;
    if (row.external_code !== q.external_code) return false;
    if (row.mapping_status !== "approved") return false;
    const from = row.effective_from ? new Date(row.effective_from) : null;
    const to = row.effective_to ? new Date(row.effective_to) : null;
    const at = q.at ? new Date(q.at) : new Date();
    if (from && at < from) return false;
    if (to && at >= to) return false;
    return true;
  });

  let best = null;
  let bestScore = 0;
  for (const row of rows) {
    const score = mappingSpecificity(row, q.organisation_id, q.jurisdiction_code);
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  if (!best) {
    return {
      mapped: false,
      mapping_status: "unmapped",
      canonical_code: null,
      canonical_code_set: q.canonical_code_set || null,
      retained_source_value: q.external_code,
      map_version: null,
    };
  }
  return {
    mapped: true,
    mapping_status: "mapped",
    canonical_code: best.canonical_code,
    canonical_code_set: best.canonical_code_set,
    canonical_display: best.canonical_display,
    retained_source_value: q.external_code,
    map_version: best.map_version,
  };
}

export function assertTenantOverrideAllowed(row, store) {
  if (!row || !row.organisation_id) return { ok: true };
  const set = ((store && store.codeSets) || []).find((c) => c.name === row.canonical_code_set || c.name === row.external_code_set);
  const boardControlled = (row.board_controlled === true) || (set && set.board_controlled === true);
  if (boardControlled) {
    return { ok: false, code: "MAPPING-BOARD-OVERRIDE-FORBIDDEN", message: "A tenant override against a board-controlled code list is rejected." };
  }
  if (set && set.tenant_override_allowed === false) {
    return { ok: false, code: "MAPPING-OVERRIDE-FORBIDDEN", message: "A tenant override is not permitted for this code set." };
  }
  return { ok: true };
}

export function mapCode(query, store, metrics) {
  const proposed = ((store && store.vocabularyMaps) || []).find((row) =>
    row.external_system === query.external_system
    && row.external_code_set === query.external_code_set
    && row.external_code === query.external_code
    && row.mapping_status === "proposed");
  const resolved = resolveMapping(query, store);
  if (!resolved.mapped) {
    if (metrics) metrics.increment("unmapped_code_total", { code_set: query.external_code_set || "unmapped" });
    const gap = raiseMappingGap(query, store);
    return {
      ...resolved,
      field_rejected: true,
      mapping_gap: gap,
      proposed_ignored: Boolean(proposed),
    };
  }
  return { ...resolved, field_rejected: false, mapping_gap: null, proposed_ignored: Boolean(proposed) };
}

export function raiseMappingGap(query, store) {
  const gaps = (store && store.mappingGaps) || [];
  const existing = gaps.find((g) =>
    g.external_system === query.external_system
    && g.external_code_set === query.external_code_set
    && g.external_code === query.external_code
    && g.field_path === query.field_path
    && g.organisation_id === query.organisation_id);
  if (existing) {
    existing.occurrence_count += 1;
    existing.last_seen_at = new Date().toISOString();
    return existing;
  }
  const gap = {
    organisation_id: query.organisation_id,
    connection_id: query.connection_id,
    external_system: query.external_system,
    external_code_set: query.external_code_set,
    external_code: query.external_code,
    external_display: query.external_display || null,
    field_path: query.field_path,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    occurrence_count: 1,
    status: "open",
  };
  gaps.push(gap);
  if (store) store.mappingGaps = gaps;
  return gap;
}

export function mapStatus(sourceStatusRaw, sourceStatusSystem, store, metrics) {
  const raw = sourceStatusRaw === null || sourceStatusRaw === undefined ? "" : String(sourceStatusRaw);
  const maps = (store && store.statusMaps) || [];
  const hit = maps.find((m) =>
    m.mapping_status === "approved"
    && norm(m.source_status) === norm(raw)
    && (!sourceStatusSystem || !m.source_status_system || m.source_status_system === sourceStatusSystem));
  if (!hit || isBlank(raw)) {
    if (metrics) metrics.increment("unmapped_status_total", { source_system: sourceStatusSystem || "unmapped" });
    return {
      type: "Status",
      canonical_state: null,
      source_status_raw: raw,
      source_status_system: sourceStatusSystem || null,
      mapping_status: "unmapped",
      requires_reconciliation: true,
    };
  }
  return {
    type: "Status",
    canonical_state: hit.canonical_state,
    source_status_raw: raw,
    source_status_system: sourceStatusSystem || null,
    mapping_status: "mapped",
    requires_reconciliation: false,
  };
}
