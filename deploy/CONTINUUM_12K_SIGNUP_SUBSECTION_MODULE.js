/* Continuum 12k: the worker sign-up as its own Get started sub-section,
   loading the portal on completion (pre-build, Prompt 12k). House piggyback
   pattern: this module installs beside worker-dashboard.html and binds to it
   through an eight slot adapter; it never re-renders the 12j wizard's copy,
   so the consent text (a counsel item) cannot drift by construction. Install
   refuses until every slot is bound, with the missing slots named, so a
   partial binding can never half-run on the pilot surface. No em-dashes
   anywhere. */
(function (g) {
  var ROUTING = "escalated to the clinician per program rules";
  var SLOTS = [
    "hasProfile",          // () -> boolean: a worker profile exists (including a restored demo)
    "mountSignup",         // (hostEl) -> void: mount the existing 12j wizard into the host
    "onSignupComplete",    // (cb) -> void: register cb({pain, ...}) for wizard completion
    "registerNavItem",     // (id, label, onOpen) -> void: add the Get started nav entry
    "removeNavItem",       // (id) -> void: remove the Get started nav entry
    "navigate",            // (sectionId) -> void: switch the visible section
    "refreshDashboard",    // () -> void: re-render the dashboard from the worker storage key
    "escalationToastText"  // () -> string: the text of the escalation toast now on screen
  ];
  var NAV_ID = "getstarted";
  var NAV_LABEL = "Get started";
  var host = null;

  function refuse(missing) {
    console.error("12k install refused, missing adapter slots: " + missing.join(", "));
    return false;
  }

  // Install checks hasProfile: when a profile exists no sign-up entry appears
  // at all. When the app opens blank, the module registers the Get started
  // item, navigates to it, and mounts the existing wizard into its host.
  function install(adapter) {
    var missing = SLOTS.filter(function (k) { return !adapter || typeof adapter[k] !== "function"; });
    if (missing.length) return refuse(missing);
    if (adapter.hasProfile()) return true;
    adapter.registerNavItem(NAV_ID, NAV_LABEL, function () { open(adapter); });
    adapter.navigate(NAV_ID);
    open(adapter);
    return true;
  }

  // One host, reused: a second open mounts into the same element.
  function open(adapter) {
    if (!host) {
      host = document.createElement("div");
      host.id = "cw12k-host";
      document.body.appendChild(host);
    }
    adapter.mountSignup(host);
    adapter.onSignupComplete(function (result) { complete(adapter, result); });
  }

  // Completion is a handoff, not a rewrite: the wizard has already written the
  // profile and the day one check-in through its own storage path. If that
  // first check-in reported pain of eight or more, the portal load halts
  // unless the routing phrase is on the escalation toast verbatim; the safety
  // contract is a tested gate, not an assumption. An ordinary completion never
  // consults the toast.
  function complete(adapter, result) {
    if (result && typeof result.pain === "number" && result.pain >= 8) {
      var toast = String(adapter.escalationToastText() || "");
      if (toast.indexOf(ROUTING) === -1) {
        console.error("12k halt: the escalation toast is missing the routing phrase; portal load stopped.");
        return;
      }
    }
    adapter.removeNavItem(NAV_ID);
    if (host) { host.remove(); host = null; }
    adapter.refreshDashboard();
    adapter.navigate("dashboard");
  }

  g.Continuum12k = { install: install, ROUTING: ROUTING, SLOTS: SLOTS.slice(), NAV_ID: NAV_ID, NAV_LABEL: NAV_LABEL };
})(typeof window !== "undefined" ? window : globalThis);
