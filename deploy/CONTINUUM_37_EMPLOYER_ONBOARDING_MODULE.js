/* Continuum 37: comprehensive employer onboarding as its own sub-section
   (pre-build, Prompt 37). House piggyback pattern, mirroring 12k: this module
   installs beside employer-dashboard.html and binds through a seven slot
   adapter; it relocates the 13c commitments step through the adapter and never
   re-renders that copy (counsel owns it). Two walls shape the flow. The
   commitments gate: no data is accepted for any later step until both
   acknowledgments are accepted and timestamped by the relocated step itself
   (the module never fabricates a timestamp). The wall as code: any uploaded
   column or submitted field whose name contains a medical token is refused
   outright, with the functional-only promise printed in the refusal. Install
   refuses until every slot is bound, with the missing slots named, and a
   fresh install resets the session so no acceptance or data carries across.
   No em-dashes anywhere. */
(function (g) {
  var PROMISE = "This is a functional-only view: Continuum never asks for or accepts medical information from an employer.";
  var FORBIDDEN = ["diagnosis", "prognosis", "pain", "restriction", "treatment", "medical", "symptom", "medication", "prescription", "clinical", "disability", "icd", "condition", "mental", "injury_description"];
  var SLOTS = [
    "hasOrganization",   // () -> boolean: an organization profile exists
    "mountCommitments",  // (hostEl, onAccepted) -> void: mount the 13c commitments step; call onAccepted({acceptedTs}) when both acks are timestamped
    "registerNavItem",   // (id, label, onOpen) -> void
    "removeNavItem",     // (id) -> void
    "navigate",          // (sectionId) -> void
    "refreshDashboard",  // () -> void
    "writeOrganization"  // (payload) -> void: persist the assembled organization
  ];
  var NAV_ID = "setup";
  var NAV_LABEL = "Set up your organization";
  var PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];
  var SITE_TYPES = ["office", "warehouse", "plant", "field", "retail", "healthcare", "mixed"];
  var CATEGORIES = ["strain_or_sprain", "slip_trip_fall", "struck_by_object", "cut_or_laceration", "burn", "repetitive_motion", "vehicle_incident", "other"];
  var WORK_STATUS = ["off_work", "modified_duties", "full_duties"];
  var EMPLOYMENT_TYPES = ["full_time", "part_time", "casual", "contract"];
  var BANDS = ["1 to 49", "50 to 199", "200 to 499", "500 to 999", "1000 to 4999", "5000 plus"];
  var GOALS = ["fewer lost time days", "faster first safe duties", "fewer unacknowledged claims", "a better premium or rebate position", "a better experience for injured workers"];
  var GATED = ["organization", "sites", "roster", "injuries", "dutyMapping", "program", "contacts"];
  var REQUIRED_AT_FINISH = ["organization", "sites", "roster", "dutyMapping", "program", "contacts"];

  var adapter = null, host = null, accepted = null, data = {}, finished = false, commitmentsMounted = false;

  function refuse(msg) { console.error(msg); return { ok: false, errors: [msg] }; }

  // ---- pure helpers: parsing and validation ----
  // One CSV line, with quoted fields: a comma inside quotes is data (routine
  // in an address column), and a doubled quote inside quotes is a quote.
  function splitLine(line) {
    var cells = [], cur = "", inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQ) {
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; } }
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ",") { cells.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    cells.push(cur);
    return cells.map(function (c) { return c.trim(); });
  }

  // Row numbers are physical file lines (header is line 1), even when the
  // file carries interior blank lines, so an error points at the line the
  // person actually sees. A row whose cell count does not match the header is
  // refused by row number rather than silently padded or truncated.
  function parseCsv(text) {
    var lines = String(text || "").split(/\r?\n/);
    var headers = null, rows = [], ragged = [];
    for (var i = 0; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      var cells = splitLine(lines[i]);
      if (!headers) { headers = cells; continue; }
      if (cells.length !== headers.length) {
        ragged.push("row " + (i + 1) + ": has " + cells.length + " cells but the header has " + headers.length);
        continue;
      }
      var row = {};
      for (var j = 0; j < headers.length; j++) row[headers[j]] = cells[j];
      row._row = i + 1;
      rows.push(row);
    }
    return { headers: headers || [], rows: rows, ragged: ragged };
  }

  // The wall as code: refuse any column whose name contains a medical token,
  // and print the promise itself in the refusal.
  function wallCheck(headers) {
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i]).toLowerCase();
      for (var t = 0; t < FORBIDDEN.length; t++) {
        if (h.indexOf(FORBIDDEN[t]) >= 0) {
          return PROMISE + " The column \"" + headers[i] + "\" cannot be accepted. Remove it and upload again.";
        }
      }
    }
    return null;
  }

  // The same wall for the question steps: a submitted field name carrying a
  // medical token is refused wherever it hides in the payload.
  function keyWall(obj) {
    if (!obj || typeof obj !== "object") return null;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var kl = keys[i].toLowerCase();
      for (var t = 0; t < FORBIDDEN.length; t++) {
        if (kl.indexOf(FORBIDDEN[t]) >= 0) {
          return PROMISE + " The field \"" + keys[i] + "\" cannot be accepted. Remove it and try again.";
        }
      }
      var deep = keyWall(obj[keys[i]]);
      if (deep) return deep;
    }
    return null;
  }

  function needHeaders(parsed, want) {
    var missing = want.filter(function (w) { return parsed.headers.indexOf(w) < 0; });
    return missing.length ? "missing columns: " + missing.join(", ") : null;
  }

  function validateSites(text) {
    var parsed = parseCsv(text);
    var wall = wallCheck(parsed.headers); if (wall) return { ok: false, errors: [wall] };
    var mh = needHeaders(parsed, ["site_id", "site_name", "address", "city", "province", "site_type"]);
    if (mh) return { ok: false, errors: [mh] };
    var errors = parsed.ragged.slice(), seen = {};
    parsed.rows.forEach(function (r) {
      if (!r.site_id) errors.push("row " + r._row + ": site_id is required");
      else if (seen[r.site_id]) errors.push("row " + r._row + ": duplicate site_id " + r.site_id);
      else seen[r.site_id] = true;
      if (!r.site_name) errors.push("row " + r._row + ": site_name is required");
      if (PROVINCES.indexOf(String(r.province).toUpperCase()) < 0) errors.push("row " + r._row + ": province " + r.province + " is not a Canadian province or territory code");
      if (SITE_TYPES.indexOf(r.site_type) < 0) errors.push("row " + r._row + ": site_type " + r.site_type + " is not one of " + SITE_TYPES.join(", "));
    });
    if (!parsed.rows.length && !errors.length) errors.push("at least one work site is required");
    return errors.length ? { ok: false, errors: errors } : { ok: true, rows: parsed.rows };
  }

  function validateRoster(text, sites) {
    var parsed = parseCsv(text);
    var wall = wallCheck(parsed.headers); if (wall) return { ok: false, errors: [wall] };
    var mh = needHeaders(parsed, ["employee_id", "first_name", "last_name", "work_email", "home_site_id", "position_title", "employment_type", "start_date"]);
    if (mh) return { ok: false, errors: [mh] };
    var siteIds = {}; (sites || []).forEach(function (s) { siteIds[s.site_id] = true; });
    var errors = parsed.ragged.slice(), seen = {};
    parsed.rows.forEach(function (r) {
      if (!r.employee_id) errors.push("row " + r._row + ": employee_id is required");
      else if (seen[r.employee_id]) errors.push("row " + r._row + ": duplicate employee_id " + r.employee_id);
      else seen[r.employee_id] = true;
      if (!r.first_name || !r.last_name) errors.push("row " + r._row + ": first_name and last_name are required");
      if (!siteIds[r.home_site_id]) errors.push("row " + r._row + ": home_site_id " + r.home_site_id + " does not name an uploaded site");
      if (EMPLOYMENT_TYPES.indexOf(r.employment_type) < 0) errors.push("row " + r._row + ": employment_type " + r.employment_type + " is not one of " + EMPLOYMENT_TYPES.join(", "));
      if (!r.position_title) errors.push("row " + r._row + ": position_title is required, it feeds duty mapping");
    });
    if (!parsed.rows.length && !errors.length) errors.push("at least one employee is required");
    return errors.length ? { ok: false, errors: errors } : { ok: true, rows: parsed.rows };
  }

  function validateInjuries(text, sites, roster) {
    // Optional step: an empty upload is accepted, because a new or lucky
    // employer may have no open cases, and an honest empty state beats a
    // forced fake row.
    if (!String(text || "").trim()) return { ok: true, rows: [] };
    var parsed = parseCsv(text);
    var wall = wallCheck(parsed.headers); if (wall) return { ok: false, errors: [wall] };
    var mh = needHeaders(parsed, ["incident_id", "employee_id", "incident_date", "site_id", "incident_category", "work_status", "lost_time_days", "claim_number"]);
    if (mh) return { ok: false, errors: [mh] };
    var siteIds = {}; (sites || []).forEach(function (s) { siteIds[s.site_id] = true; });
    var empIds = {}; (roster || []).forEach(function (e) { empIds[e.employee_id] = true; });
    var errors = parsed.ragged.slice(), seen = {};
    parsed.rows.forEach(function (r) {
      if (!r.incident_id) errors.push("row " + r._row + ": incident_id is required");
      else if (seen[r.incident_id]) errors.push("row " + r._row + ": duplicate incident_id " + r.incident_id);
      else seen[r.incident_id] = true;
      if (!empIds[r.employee_id]) errors.push("row " + r._row + ": employee_id " + r.employee_id + " does not name an uploaded employee");
      if (!siteIds[r.site_id]) errors.push("row " + r._row + ": site_id " + r.site_id + " does not name an uploaded site");
      if (CATEGORIES.indexOf(r.incident_category) < 0) errors.push("row " + r._row + ": incident_category " + r.incident_category + " is not one of " + CATEGORIES.join(", "));
      if (WORK_STATUS.indexOf(r.work_status) < 0) errors.push("row " + r._row + ": work_status " + r.work_status + " is not one of " + WORK_STATUS.join(", "));
      var raw = String(r.lost_time_days).trim();
      var d = Number(raw);
      if (raw === "" || !isFinite(d) || d < 0) errors.push("row " + r._row + ": lost_time_days must be zero or a positive number");
    });
    return errors.length ? { ok: false, errors: errors } : { ok: true, rows: parsed.rows };
  }

  function validateOrganization(o) {
    var errors = [];
    o = o || {};
    if (!o.legalName || !String(o.legalName).trim()) errors.push("legal name is required");
    if (BANDS.indexOf(o.employeeBand) < 0) errors.push("employee count band must be one of: " + BANDS.join("; "));
    if (!o.provinces || !o.provinces.length) errors.push("at least one province is required");
    else o.provinces.forEach(function (p) { if (PROVINCES.indexOf(String(p).toUpperCase()) < 0) errors.push("province " + p + " is not a Canadian province or territory code"); });
    return errors.length ? { ok: false, errors: errors } : { ok: true };
  }

  function validateDutyMapping(list) {
    if (!Array.isArray(list) || !list.length) return { ok: false, errors: ["confirm at least one position match"] };
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (!m || typeof m !== "object" || !m.position_title || !m.matched) {
        return { ok: false, errors: ["match " + (i + 1) + ": each confirmed match needs position_title and matched"] };
      }
    }
    return { ok: true };
  }

  function validateProgram(p) {
    p = p || {};
    var goals = p.goals || [];
    if (!goals.length) return { ok: false, errors: ["pick at least one goal"] };
    if (goals.length > 3) return { ok: false, errors: ["pick up to three goals"] };
    for (var i = 0; i < goals.length; i++) if (GOALS.indexOf(goals[i]) < 0) return { ok: false, errors: ["goal not in the list: " + goals[i]] };
    return { ok: true };
  }

  function validateContacts(c) {
    c = c || {};
    if (!c.coordinatorName || !c.coordinatorEmail) return { ok: false, errors: ["a return to work coordinator name and work email are required"] };
    return { ok: true };
  }

  // ---- flow ----
  function install(a) {
    var missing = SLOTS.filter(function (k) { return !a || typeof a[k] !== "function"; });
    if (missing.length) { console.error("37 install refused, missing adapter slots: " + missing.join(", ")); return false; }
    // A fresh install is a fresh session: nothing carries across, so a prior
    // acceptance can never pre-pass the gate for a new binding.
    adapter = a; accepted = null; data = {}; finished = false; commitmentsMounted = false;
    if (host) { host.remove(); host = null; }
    if (a.hasOrganization()) return true; // onboarded: no setup entry at all
    a.registerNavItem(NAV_ID, NAV_LABEL, function () { open(); });
    a.navigate(NAV_ID);
    open();
    return true;
  }

  // One host, one commitments mount: reopening the sub-section reuses both,
  // so the counsel-owned step is mounted exactly once, and the first
  // timestamped acceptance stands.
  function open() {
    if (!host) {
      host = document.createElement("div");
      host.id = "cw37-host";
      document.body.appendChild(host);
    }
    if (!commitmentsMounted) {
      var cEl = document.createElement("div");
      cEl.id = "cw37-commitments";
      host.appendChild(cEl);
      adapter.mountCommitments(cEl, function (result) {
        if (accepted) return;
        if (!result || !result.acceptedTs) { console.error("37: acceptance requires a timestamp from the commitments step."); return; }
        accepted = result.acceptedTs;
      });
      commitmentsMounted = true;
    }
  }

  // Every later step is locked until the commitments are accepted and
  // timestamped: no employer uploads a single row before agreeing to the
  // deal, on the record.
  function submit(step, payload) {
    if (GATED.indexOf(step) >= 0 && !accepted) {
      return refuse("37 gate: the step " + step + " is locked until the commitments are accepted and timestamped.");
    }
    var res;
    if (step === "organization" || step === "dutyMapping" || step === "program" || step === "contacts") {
      var kw = keyWall(payload);
      if (kw) { console.error("37 " + step + ": " + kw); return { ok: false, errors: [kw] }; }
    }
    if (step === "organization") res = validateOrganization(payload);
    else if (step === "sites") res = validateSites(payload);
    else if (step === "roster") res = validateRoster(payload, data.sites);
    else if (step === "injuries") res = validateInjuries(payload, data.sites, data.roster);
    else if (step === "dutyMapping") res = validateDutyMapping(payload);
    else if (step === "program") res = validateProgram(payload);
    else if (step === "contacts") res = validateContacts(payload);
    else return refuse("37: unknown step " + step);
    if (!res.ok) { res.errors.forEach(function (e) { console.error("37 " + step + ": " + e); }); return res; }
    data[step] = res.rows !== undefined ? res.rows : payload;
    return res;
  }

  function finish() {
    if (finished) return refuse("37 finish refused, the onboarding is already complete.");
    var missing = REQUIRED_AT_FINISH.filter(function (s) { return data[s] === undefined; });
    if (missing.length) return refuse("37 finish refused, steps not complete: " + missing.join(", "));
    if (!accepted) return refuse("37 finish refused, the commitments are not accepted.");
    // Cross-references are re-verified against the final uploads, so fixing
    // one file after another was accepted cannot persist a payload whose rows
    // point at ids that no longer exist.
    var siteIds = {}; data.sites.forEach(function (s) { siteIds[s.site_id] = true; });
    var empIds = {}; data.roster.forEach(function (e) { empIds[e.employee_id] = true; });
    var broken = [];
    data.roster.forEach(function (r) { if (!siteIds[r.home_site_id]) broken.push("employee " + r.employee_id + " names site " + r.home_site_id + " that is not in the final sites upload"); });
    (data.injuries || []).forEach(function (x) {
      if (!empIds[x.employee_id]) broken.push("incident " + x.incident_id + " names employee " + x.employee_id + " that is not in the final roster upload");
      if (!siteIds[x.site_id]) broken.push("incident " + x.incident_id + " names site " + x.site_id + " that is not in the final sites upload");
    });
    if (broken.length) return refuse("37 finish refused, cross-references no longer hold: " + broken.join("; "));
    var payload = {
      version: "37-1",
      commitments: { acceptedTs: accepted },
      organization: data.organization,
      sites: data.sites,
      roster: data.roster,
      injuries: data.injuries || [], // a new employer may have none
      dutyMapping: data.dutyMapping,
      program: data.program,
      contacts: data.contacts,
      counts: { sites: data.sites.length, employees: data.roster.length, openCases: (data.injuries || []).length, mappedPositions: data.dutyMapping.length }
    };
    adapter.writeOrganization(payload);
    adapter.removeNavItem(NAV_ID);
    if (host) { host.remove(); host = null; }
    adapter.refreshDashboard();
    adapter.navigate("dashboard");
    finished = true;
    return { ok: true, payload: payload };
  }

  g.CONTINUUM_37 = g.Continuum37 = {
    install: install, submit: submit, finish: finish,
    PROMISE: PROMISE, FORBIDDEN: FORBIDDEN.slice(), SLOTS: SLOTS.slice(),
    NAV_ID: NAV_ID, NAV_LABEL: NAV_LABEL, BANDS: BANDS.slice(), GOALS: GOALS.slice(),
    _validators: { parseCsv: parseCsv, wallCheck: wallCheck, keyWall: keyWall, validateSites: validateSites, validateRoster: validateRoster, validateInjuries: validateInjuries, validateOrganization: validateOrganization, validateDutyMapping: validateDutyMapping }
  };
})(typeof window !== "undefined" ? window : globalThis);
