/* ============================================================================
   Continuum Worker - shared client layer (window.WK)
   Requires config.js and supabase-js v2 UMD loaded first. Talks to the worker
   schema over REST; all writes go through the SECURITY DEFINER RPCs so the
   privacy wall and consent gates are enforced by the server.
   ========================================================================== */
(function () {
  "use strict";
  var cfg = window.CONTINUUM_WORKER_CONFIG;
  if (!cfg || !window.supabase) { console.error("[WK] config.js or supabase-js not loaded"); return; }
  var sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
    db: { schema: cfg.schema },
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "ct_worker_auth" }
  });
  var WK = { sb: sb, caseId: null };

  WK.session = function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); };
  WK.signIn = function (email, password) { return sb.auth.signInWithPassword({ email: email, password: password }); };
  WK.signOut = function () { return sb.auth.signOut(); };
  WK.guard = function (loginUrl) {
    return WK.session().then(function (s) { if (!s) { location.href = loginUrl || "login.html"; return null; } return s; });
  };

  // ---- offline write queue (Document 3.8 rules 1 to 3: nothing typed is ever
  // lost; sync state is stated in words; nothing is claimed sent until the server
  // acknowledges it). Full conflict resolution (rule 4) is a later increment. ----
  var WRITES = { set_consent: 1, submit_check_in: 1, set_companion: 1, record_movement: 1, first_run_complete: 1, log_worker_event: 1 };
  var QKEY = "ct_worker_queue", FKEY = "ct_worker_failed";
  function loadQ() { try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch (e) { return []; } }
  function saveQ(q) { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) {} }
  function loadF() { try { return JSON.parse(localStorage.getItem(FKEY) || "[]"); } catch (e) { return []; } }
  function saveF(f) { try { localStorage.setItem(FKEY, JSON.stringify(f)); } catch (e) {} }
  function enqueue(name, args) { var q = loadQ(); q.push({ name: name, args: args }); saveQ(q); }
  function isNetErr(e) { return (typeof navigator !== "undefined" && !navigator.onLine) || (e && (e.message === "Failed to fetch" || e.name === "TypeError")); }
  WK.pending = function () { return loadQ().length; };
  WK.failed = function () { return loadF().length; };
  WK.syncState = function () {
    var n = loadQ().length, f = loadF().length, text;
    if (n === 0) { text = "Saved and sent."; }
    else { text = "Saved on your phone. " + n + " item(s) will be sent when you have a connection."; }
    if (f > 0) { text = text + " " + f + " item(s) could not be saved and were not sent."; }
    return { online: (typeof navigator === "undefined" || navigator.onLine), pending: n, failed: f, text: text };
  };
  // Process in order. Stop at the first NETWORK failure (keep it and the rest queued,
  // retry when online). A non-network server rejection is a poison item that would jam
  // the queue forever, so it is moved to the failed list and stated in words, and the run
  // continues. Nothing acknowledged is re-sent; nothing un-acknowledged is silently lost.
  WK.flush = function () {
    if (typeof navigator !== "undefined" && !navigator.onLine) { return Promise.resolve({ acked: 0, failed: 0, pending: loadQ().length }); }
    var q = loadQ(); if (!q.length) { return Promise.resolve({ acked: 0, failed: 0, pending: 0 }); }
    var idx = 0, sent = 0, dead = [];
    function step() {
      if (idx >= q.length) { return Promise.resolve(); }
      var item = q[idx];
      return sb.rpc(item.name, item.args).then(function (r) {
        if (r && r.error) { if (isNetErr(r.error)) { return "stop"; } dead.push(item); idx++; return step(); }
        sent++; idx++; return step();
      }).catch(function (e) { if (isNetErr(e)) { return "stop"; } dead.push(item); idx++; return step(); });
    }
    return step().then(function () {
      saveQ(loadQ().slice(idx));
      if (dead.length) { saveF(loadF().concat(dead)); }
      return { acked: sent, failed: dead.length, pending: loadQ().length };
    });
  };

  function rpc(name, args) {
    var isWrite = WRITES[name];
    if (isWrite && typeof navigator !== "undefined" && !navigator.onLine) { enqueue(name, args); return Promise.resolve({ queued: true }); }
    return sb.rpc(name, args).then(function (r) { if (r.error) throw r.error; return r.data; })
      .catch(function (e) { if (isWrite && isNetErr(e)) { enqueue(name, args); return { queued: true }; } throw e; });
  }
  if (typeof window !== "undefined") { window.addEventListener("online", function () { WK.flush(); }); }

  // resolve the worker's first case id once (most screens act on one case)
  WK.myCases = function () { return rpc("my_cases", {}); };
  WK.resolveCase = function () {
    if (WK.caseId) return Promise.resolve(WK.caseId);
    return WK.myCases().then(function (cases) {
      var c = (cases && cases[0]) || null; WK.caseId = c ? c.case_id : null; return WK.caseId;
    });
  };

  WK.whoami = function () {
    return sb.from("worker_account").select("id,display_name,companion_character,first_run_done,locale").maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  };
  WK.deploymentFlags = function () {
    return sb.from("deployment_flag").select("flag,enabled").then(function (r) { if (r.error) throw r.error;
      var m = {}; (r.data || []).forEach(function (f) { m[f.flag] = f.enabled; }); return m; });
  };

  WK.rpc = {
    myPlan: function (c) { return rpc("my_plan", { p_case: c }); },
    myEmployerView: function (c) { return rpc("my_employer_view", { p_case: c }); },
    myConsents: function (c) { return rpc("my_consents", { p_case: c }); },
    myProgress: function (c) { return rpc("my_progress", { p_case: c }); },
    setConsent: function (c, kind, granted, ver) { return rpc("set_consent", { p_case: c, p_kind: kind, p_granted: granted, p_text_version: ver || "v1" }); },
    submitCheckIn: function (o) {
      return rpc("submit_check_in", { p_case: o.caseId, p_pathway: o.pathway || "PHYSICAL", p_pain: (o.pain == null ? null : o.pain),
        p_hours_approved: (o.hoursApproved == null ? null : o.hoursApproved), p_hours_worked: (o.hoursWorked == null ? null : o.hoursWorked),
        p_answers: o.answers || null, p_private_note: o.privateNote || null, p_operational: o.operational || null });
    },
    setCompanion: function (character, name, mode) { return rpc("set_companion", { p_character: character || null, p_name: name || null, p_mode: mode || null }); },
    recordMovement: function (c, axis, angle) { return rpc("record_movement", { p_case: c, p_axis: axis, p_angle: angle }); },
    firstRunComplete: function () { return rpc("first_run_complete", {}); },
    logEvent: function (c, action, detail) { return rpc("log_worker_event", { p_case: c, p_action: action, p_detail: detail || {} }); }
  };

  WK.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); };
  WK.fmtDate = function (iso) { if (!iso) return ""; try { var d = new Date(iso + (iso.length <= 10 ? "T00:00:00" : "")); var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return days[d.getDay()] + " " + d.getDate() + " " + mons[d.getMonth()] + " " + d.getFullYear(); } catch (e) { return iso; } };

  // ---- Companion language seam. Deterministic in version one. The generative
  // adapter sits behind the SAME interface and is DISABLED (mirrors the
  // GENERATIVE_ADAPTER_ENABLED deployment flag) pending provider, residency,
  // contractual, privacy and regulatory sign-off. There is no path by which
  // generated text a human did not author reaches a worker action.
  WK.companion = {
    generativeEnabled: false,
    say: function (intent) {
      var lines = {
        greeting: "Here is what happens next.",
        recorded: "I recorded that.",
        camera_off: "I have turned the camera off.",
        not_sent: "Not sent yet, because you are offline. It is saved on your phone.",
        cannot_answer: "I cannot answer that. Here is who can."
      };
      if (this.generativeEnabled) { throw new Error("generative adapter is disabled in version one"); }
      return lines[intent] || lines.cannot_answer;
    }
  };

  // ---- Speech to text seam. Text mode is always available. Voice input is gated
  // on a Canadian region provider with a no training contractual term (Section 1
  // checks 7 and 8), which is not configured, so it is off.
  WK.stt = {
    available: false,
    start: function () { throw new Error("voice input is not available yet, please type your answer"); }
  };

  window.WK = WK;
})();
