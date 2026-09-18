/* Continuum Agent Operations READ ONLY observation.
   Checks an injectable fetch against a base URL: page health, copy dash
   audit, assessment zero-write (never POST persist/save).
   Writes: heartbeat on zeus plus one or more findings. Never a change task.
   Returns { writes: { activity, findings, tasks, other } }.
   No em dashes or en dashes. */

const PAGE_PATHS = ["/", "/book", "/privacy", "/terms", "/assessment/"];

function joinUrl(base, path) {
  const root = String(base || "").replace(/\/$/, "");
  return root + path;
}

function countDashes(text) {
  const body = typeof text === "string" ? text : "";
  const em = (body.match(/\u2014/g) || []).length;
  const en = (body.match(/\u2013/g) || []).length;
  return { em: em, en: en, total: em + en };
}

function safeDefaultWrites() {
  return { activity: [], findings: [], tasks: [], other: [] };
}

export async function runObservation({ store, fetchFn, baseUrl, skipHeartbeat } = {}) {
  const writes = safeDefaultWrites();
  const base = baseUrl || process.env.CONTINUUM_OBSERVE_BASE || "https://www.continuumrtw.com";
  const fetchImpl = typeof fetchFn === "function" ? fetchFn : null;

  if (store && skipHeartbeat !== true) {
    const heartbeat = store.insertActivity({
      agent_identifier: "zeus",
      current_task: "READ ONLY observation",
      last_completed_action: "observation heartbeat"
    });
    writes.activity.push(heartbeat);
  }

  const pageResults = [];
  for (const path of PAGE_PATHS) {
    const url = joinUrl(base, path);
    if (!fetchImpl) {
      pageResults.push({ path: path, url: url, ok: false, status: "UNKNOWN", dashes: { em: 0, en: 0, total: 0 } });
      continue;
    }
    try {
      const res = await fetchImpl(url, { method: "GET" });
      const status = res && typeof res.status === "number" ? res.status : "UNKNOWN";
      let text = "";
      try {
        text = res && typeof res.text === "function" ? await res.text() : "";
      } catch (err) {
        text = "";
      }
      const dashes = countDashes(text);
      const healthy = res && res.ok === true && typeof status === "number" && status >= 200 && status < 300;
      pageResults.push({
        path: path,
        url: url,
        ok: healthy,
        status: status,
        dashes: dashes
      });
    } catch (err) {
      pageResults.push({ path: path, url: url, ok: false, status: "UNKNOWN", dashes: { em: 0, en: 0, total: 0 } });
    }
  }

  if (store) {
    const unhealthy = pageResults.filter((p) => p.ok !== true);
    const dashed = pageResults.filter((p) => p.dashes && p.dashes.total > 0);
    if (unhealthy.length > 0) {
      const finding = store.insertFinding({
        finding: "Page health failed for " + unhealthy.map((p) => p.path).join(", "),
        evidence_link: unhealthy[0] ? unhealthy[0].url : "UNKNOWN",
        proposed_improvement: "Inspect the named public pages. Observation is read only.",
        severity: "MEDIUM"
      });
      writes.findings.push(finding);
    }
    if (dashed.length > 0) {
      const finding = store.insertFinding({
        finding: "Copy dash audit found em or en dashes on " + dashed.map((p) => p.path).join(", "),
        evidence_link: dashed[0] ? dashed[0].url : "UNKNOWN",
        proposed_improvement: "Replace em and en dashes with commas, colons, or a spaced hyphen.",
        severity: "LOW"
      });
      writes.findings.push(finding);
    }
    if (writes.findings.length === 0) {
      const finding = store.insertFinding({
        finding: "READ ONLY observation complete: named pages responded, dash count clean.",
        evidence_link: joinUrl(base, "/"),
        proposed_improvement: "None. Observation proposes nothing to execute.",
        severity: "LOW"
      });
      writes.findings.push(finding);
    }
  }

  return { ok: true, writes: writes, pages: pageResults };
}
