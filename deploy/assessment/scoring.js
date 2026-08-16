// Deterministic Continuum Recovery Readiness scoring. Pure functions, no DOM,
// no network, no LLM. No em or en dashes.
(function (root) {
  function optionValue(config, questionId, optionKey) {
    var q = config.questions.find(function (x) { return x.id === questionId; });
    if (!q) return undefined;
    var o = q.options.find(function (x) { return x.key === optionKey; });
    return o ? o.value : undefined; // null for NOT_SURE
  }

  function dimensionScores(answers, config) {
    var buckets = {};
    Object.keys(config.dimensions).forEach(function (d) { buckets[d] = []; });
    config.questions.forEach(function (q) {
      if (!(q.id in answers)) return;
      var v = optionValue(config, q.id, answers[q.id]);
      if (v === null || v === undefined) return; // NOT_SURE excluded
      buckets[q.dimension].push(v);
    });
    var out = {};
    Object.keys(buckets).forEach(function (d) {
      out[d] = buckets[d].length
        ? Math.round(buckets[d].reduce(function (s, x) { return s + x; }, 0) / buckets[d].length)
        : null;
    });
    return out;
  }

  function overallScore(dimScores, config) {
    var num = 0, den = 0;
    Object.keys(dimScores).forEach(function (d) {
      if (dimScores[d] === null) return;
      var w = config.dimensions[d].weight;
      num += w * dimScores[d]; den += w;
    });
    return den ? Math.round(num / den) : null;
  }

  function maturityQuestionIds(config) {
    return config.questions.map(function (q) { return q.id; });
  }

  function missingDataRate(answers, config) {
    var ids = maturityQuestionIds(config).filter(function (id) { return id in answers; });
    if (!ids.length) return 0;
    var notSure = ids.filter(function (id) { return optionValue(config, id, answers[id]) === null; }).length;
    return notSure / ids.length;
  }

  function countScoredDimensions(dimScores) {
    return Object.keys(dimScores).filter(function (d) { return dimScores[d] !== null; }).length;
  }

  function countNotSure(answers, config) {
    return maturityQuestionIds(config).filter(function (id) {
      return (id in answers) && optionValue(config, id, answers[id]) === null;
    }).length;
  }

  function assessmentConfidence(answers, dimScores, config) {
    var notSure = countNotSure(answers, config);
    var scored = countScoredDimensions(dimScores);
    var rule = config.confidence.rules.find(function (r) {
      return notSure <= r.maxNotSure && scored >= r.minDimensionsScored;
    });
    return rule ? rule.level : 'Limited';
  }

  function bandFor(score, config) {
    if (score === null || score === undefined) return null;
    var b = config.bands.find(function (x) { return score >= x.min && score <= x.max; });
    return b ? b.label : null;
  }

  function strongestAndGap(dimScores) {
    var scored = Object.keys(dimScores).filter(function (d) { return dimScores[d] !== null; });
    if (!scored.length) return { strongest: null, gap: null };
    var strongest = scored.reduce(function (a, b) { return dimScores[b] > dimScores[a] ? b : a; });
    var gap = scored.reduce(function (a, b) { return dimScores[b] < dimScores[a] ? b : a; });
    return { strongest: strongest, gap: gap };
  }

  function matches(cond, dimScores) {
    var v = dimScores[cond.dimension];
    if (v === null || v === undefined) return false;
    if (cond.op === '>=') return v >= cond.value;
    if (cond.op === '<=') return v <= cond.value;
    if (cond.op === '>') return v > cond.value;
    if (cond.op === '<') return v < cond.value;
    if (cond.op === '==') return v === cond.value;
    return false;
  }

  function observation(dimScores, config) {
    var rule = config.observations.find(function (r) {
      return r.when.every(function (c) { return matches(c, dimScores); });
    });
    return rule ? rule.template : '';
  }

  function lostWorkerDays(exposureAnswers, config) {
    var cases = exposureAnswers.annual_lost_time_cases;
    var days = exposureAnswers.avg_lost_time_duration_days;
    if (typeof cases !== 'number' || typeof days !== 'number') {
      return { days: null, provenance: 'UNKNOWN', scenarios: [] };
    }
    var total = Math.round(cases * days);
    var scenarios = [5, 10, 20].map(function (pct) {
      return { pct: pct, days: Math.round(total * pct / 100) };
    });
    var prov = (exposureAnswers._provenance === 'MODELED_ESTIMATE') ? 'MODELED_ESTIMATE' : 'USER_PROVIDED';
    return { days: total, provenance: prov, scenarios: scenarios };
  }

  var api = { dimensionScores: dimensionScores, overallScore: overallScore,
    missingDataRate: missingDataRate, assessmentConfidence: assessmentConfidence,
    bandFor: bandFor, strongestAndGap: strongestAndGap, observation: observation,
    lostWorkerDays: lostWorkerDays };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ContinuumScoring = api;
})(typeof window !== "undefined" ? window : globalThis);
