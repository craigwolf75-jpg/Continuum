/* Continuum presenter kit (Prompt 32). One self-contained module, shared by the
   Employer and HSE portals. It wraps nothing on its own: a portal attaches its
   own section map and a getSection hook, then wraps its render to call refresh.
   The module owns its styles and elements and touches nothing else. Off is the
   default; the Present control lives in each portal's page header (the module no
   longer paints a corner pill); print hides the whole kit.
   The voice panel mounts the official ElevenLabs Conversational AI widget once an
   agent id is pasted; the id is shared across both portals through one storage
   key. No em-dashes anywhere. */
(function (g) {
  var AGENT_KEY = "continuum_presenter_agent_v1"; // shared across both portals
  var SCRIPT_SRC = "https://unpkg.com/@elevenlabs/convai-widget-embed";
  var cfg = null, on = false, mounted = false;

  function getAgent() { try { return localStorage.getItem(AGENT_KEY) || ""; } catch (e) { return ""; } }
  function setAgent(v) { try { if (v) localStorage.setItem(AGENT_KEY, v); else localStorage.removeItem(AGENT_KEY); } catch (e) {} }

  // Pure: which explainer card to show for a section id.
  function explainerFor(sections, id) {
    if (sections && sections[id]) return sections[id];
    return { title: "This section", body: "Walk the room through what is on screen, in plain words." };
  }

  function css() {
    if (document.getElementById("cp-style")) return;
    var s = document.createElement("style"); s.id = "cp-style";
    s.textContent =
      "#cp-card{position:fixed;left:50%;transform:translateX(-50%);top:74px;z-index:8990;max-width:640px;width:calc(100% - 28px);background:#fff;border:1px solid #C8972F;border-left:5px solid #C8972F;border-radius:12px;box-shadow:0 10px 30px rgba(14,27,44,.25);padding:14px 18px}" +
      "#cp-card .cp-ct{font:800 15px/1.2 system-ui,sans-serif;color:#0E1B2C;margin-bottom:4px}" +
      "#cp-card .cp-cb{font:400 13.5px/1.55 system-ui,sans-serif;color:#26333f}" +
      "#cp-voice{position:fixed;right:14px;bottom:70px;z-index:8990;width:290px;background:#0E1B2C;color:#eaf1fb;border:1px solid #C8972F;border-radius:12px;padding:14px}" +
      "#cp-voice .cp-vh{font:800 13px/1 system-ui,sans-serif;margin-bottom:6px}" +
      "#cp-voice .cp-active{color:#7BD88F;font-weight:800}" +
      "#cp-voice .cp-vsub{font:400 11.5px/1.5 system-ui,sans-serif;color:#aebfd6;margin-bottom:8px}" +
      "#cp-voice input{width:100%;height:34px;border-radius:8px;border:1px solid #3b4a63;background:#0a1424;color:#fff;padding:0 10px;font-size:12px;margin-bottom:8px}" +
      "#cp-voice button{background:#C8972F;color:#0E1B2C;border:none;border-radius:8px;padding:7px 12px;font:700 11.5px/1 system-ui,sans-serif;cursor:pointer}" +
      "@media print{#cp-card,#cp-voice,#cp-convai,elevenlabs-convai,.cp-present-btn{display:none !important}}";
    document.head.appendChild(s);
  }

  function mountWidget(agentId) {
    if (!document.getElementById("cp-convai-script")) {
      var sc = document.createElement("script");
      sc.id = "cp-convai-script"; sc.src = SCRIPT_SRC; sc.async = true; sc.type = "text/javascript";
      document.body.appendChild(sc);
    }
    var w = document.getElementById("cp-convai");
    if (!w) { w = document.createElement("elevenlabs-convai"); w.id = "cp-convai"; document.body.appendChild(w); }
    w.setAttribute("agent-id", agentId);
    mounted = true;
  }
  function unmountWidget() { var w = document.getElementById("cp-convai"); if (w) w.remove(); mounted = false; }

  function voice() {
    var v = document.getElementById("cp-voice");
    if (!v) { v = document.createElement("div"); v.id = "cp-voice"; document.body.appendChild(v); }
    var id = getAgent();
    if (id) {
      v.innerHTML = '<div class="cp-vh">Voice assistant <span class="cp-active">active</span></div>' +
        '<div class="cp-vsub">Tap the microphone to ask a question out loud. Remembered on both portals.</div>' +
        '<button type="button" id="cp-clear">Clear agent</button>';
      document.getElementById("cp-clear").onclick = function () { setAgent(""); unmountWidget(); voice(); };
      mountWidget(id);
    } else {
      v.innerHTML = '<div class="cp-vh">Voice assistant</div>' +
        '<div class="cp-vsub">Paste the ElevenLabs agent ID to activate the live question and answer. It is remembered on both portals.</div>' +
        '<input type="text" id="cp-in" placeholder="agent id" autocomplete="off">' +
        '<button type="button" id="cp-set">Connect</button>';
      document.getElementById("cp-set").onclick = function () { var val = (document.getElementById("cp-in").value || "").trim(); if (val) { setAgent(val); voice(); } };
      unmountWidget();
    }
  }

  function card() {
    var c = document.getElementById("cp-card");
    if (!c) { c = document.createElement("div"); c.id = "cp-card"; document.body.appendChild(c); }
    var ex = explainerFor(cfg && cfg.sections, cfg && cfg.getSection ? cfg.getSection() : null);
    c.innerHTML = '<div class="cp-ct">' + ex.title + '</div><div class="cp-cb">' + ex.body + '</div>';
  }

  function teardown() {
    ["cp-card", "cp-voice"].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    unmountWidget();
  }

  function build() { css(); card(); voice(); }
  // The Present control now lives in each portal's page header (class
  // cp-present-btn), so the module no longer paints a fixed corner pill. The
  // header button calls toggle(); refresh() reruns after every host render.
  function toggle() { on = !on; if (on) build(); else teardown(); }
  function refresh() { if (on) build(); }
  function attach(config) { cfg = config; css(); }

  g.ContinuumPresenter = {
    attach: attach, refresh: refresh, toggle: toggle,
    AGENT_KEY: AGENT_KEY, getAgent: getAgent, setAgent: setAgent, explainerFor: explainerFor,
    isOn: function () { return on; }, isMounted: function () { return mounted; }
  };
})(typeof window !== "undefined" ? window : this);
