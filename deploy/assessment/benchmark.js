// Continuum Recovery Benchmark engine, Step 2B Task 2. Pure functions, no
// DOM, no network, no LLM. Ships DARK: not loaded by index.html. Consumes a
// CRB config (see config/crb-2026-01.js) and, in tests, a SYNTH dataset. No
// em or en dashes anywhere.
(function (root) {
  // The five cohort rungs from the design spec (section 3), most specific
  // first. This is the fixed dimension-name structure of the hierarchy, not
  // a cohort value or a tunable threshold, so it is not config data. Rung 4
  // (broader industry family) has no supplying dimension yet in this dark
  // shell (config.cohortDimensions carries no industry_family field), so it
  // is structurally present but unreachable until a future config adds it;
  // it is never removed, just never completed by any current cohort.
  var RUNG_DEFINITIONS = [
    { rung: 1, fields: ['industry', 'province_state', 'workforce_size_band'] },
    { rung: 2, fields: ['industry', 'country', 'workforce_size_band'] },
    { rung: 3, fields: ['industry', 'country'] },
    { rung: 4, fields: ['industry_family', 'country'] },
    { rung: 5, fields: ['country'] }
  ];

  function hasValue(v) {
    return v !== undefined && v !== null && v !== '';
  }

  // cohortHierarchy: builds the ordered list of credible cohort rungs for
  // this respondent. A rung is included only when the cohort supplies every
  // field that rung requires; it is never manufactured or partially filled.
  function cohortHierarchy(cohort, config) {
    cohort = cohort || {};
    var rungs = [];
    RUNG_DEFINITIONS.forEach(function (def) {
      var on = {};
      var complete = def.fields.every(function (field) {
        var v = cohort[field];
        if (!hasValue(v)) return false;
        on[field] = v;
        return true;
      });
      if (complete) rungs.push({ rung: def.rung, on: on });
    });
    return rungs;
  }

  // confidenceFor: below the config adequacy floor is always INSUFFICIENT,
  // regardless of rung. Otherwise rung 1 or 2 (direct comparison) is HIGH,
  // rung 3 or 4 (broader but relevant) is MODERATE, rung 5 (broadest
  // occupational benchmark) is ESTIMATED. The floor is read from config, not
  // hardcoded.
  function confidenceFor(matchRung, observations, config) {
    if (typeof observations !== 'number' || observations < config.adequacyFloor) return 'INSUFFICIENT';
    if (matchRung === 1 || matchRung === 2) return 'HIGH';
    if (matchRung === 3 || matchRung === 4) return 'MODERATE';
    if (matchRung === 5) return 'ESTIMATED';
    return 'INSUFFICIENT';
  }

  function isKnownMetric(metric, config) {
    return (config.metrics || []).some(function (m) { return m.key === metric; });
  }

  // lookupBenchmark: rejects any metric outside config.metrics (the
  // frequency-context guard, so a maturity metric can never be looked up
  // here). Walks the cohort hierarchy most specific first and returns the
  // first rung with a dataset entry that meets the adequacy floor. Never
  // blends rungs, never interpolates a missing cohort; a rung short of
  // observations is skipped, not padded out with a neighboring rung's data.
  function lookupBenchmark(cohort, metric, dataset, config) {
    if (!isKnownMetric(metric, config)) return null;
    dataset = dataset || {};
    var byKey = dataset[metric] || {};
    var rungs = cohortHierarchy(cohort, config);
    for (var i = 0; i < rungs.length; i++) {
      var rung = rungs[i];
      var key = JSON.stringify(rung.on);
      var entry = byKey[key];
      if (entry && typeof entry.observations === 'number' && entry.observations >= config.adequacyFloor) {
        return {
          value: entry.value,
          matchedCohortRung: rung.rung,
          confidence: confidenceFor(rung.rung, entry.observations, config),
          sourceId: entry.sourceId,
          benchmarkVersion: benchmarkVersion(config)
        };
      }
    }
    return null;
  }

  function benchmarkVersion(config) {
    return config.benchmarkVersion;
  }

  var api = {
    cohortHierarchy: cohortHierarchy,
    confidenceFor: confidenceFor,
    lookupBenchmark: lookupBenchmark,
    benchmarkVersion: benchmarkVersion
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ContinuumBenchmark = api;
})(typeof window !== "undefined" ? window : globalThis);
