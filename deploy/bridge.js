/* Continuum worker bridge, single-source functional-only projection (Mission
   S12d). Every worker surface writes the cross-tab bridge through this one
   function, so the functional-only law has exactly one enforcement point: any
   key not on the allowlist is dropped before it can reach a functional consumer
   (the employer and other non-clinical seats). Clinical fields (pain, mobility,
   fatigue, confidence, notes, diagnosis) are not on the allowlist and therefore
   can never cross, even if a surface passes one by mistake. No em-dashes. */
(function (g) {
  var KEY = "continuum_worker_bridge_v1";
  // The functional allowlist. Nothing outside this list is ever written.
  var ALLOW = ["source", "name", "trade", "injury", "restr", "day",
    "prognosisDays", "status", "escalated", "checkedInToday", "dutiesDone",
    "dutiesTotal", "consented", "dutyAckDay", "dutyAckTs", "ts"];

  function projectBridge(fields) {
    fields = fields || {};
    var out = {};
    for (var i = 0; i < ALLOW.length; i++) {
      var k = ALLOW[i];
      if (fields[k] !== undefined) out[k] = fields[k];
    }
    if (out.ts === undefined) out.ts = Date.now();
    return out;
  }

  function writeBridgeShared(fields) {
    var payload = projectBridge(fields);
    try { localStorage.setItem(KEY, JSON.stringify(payload)); } catch (e) {}
    return payload;
  }

  g.ContinuumBridge = { KEY: KEY, ALLOW: ALLOW, projectBridge: projectBridge, writeBridgeShared: writeBridgeShared };
})(typeof window !== "undefined" ? window : this);
