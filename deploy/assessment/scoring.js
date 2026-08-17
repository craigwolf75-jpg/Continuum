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

  function countExactExposureValues(exposureResolved) {
    if (!exposureResolved) return 0;
    return Object.keys(exposureResolved).filter(function (k) {
      var v = exposureResolved[k];
      return v && v.provenance === 'USER_PROVIDED';
    }).length;
  }

  // Extended signature: (answers, dimScores, exposureResolved, config). Also
  // accepts the CRS_1.0 three argument call (answers, dimScores, config) for
  // backward compatibility, detected by argument count, not by parameter name.
  function assessmentConfidence(answers, dimScores, arg3, arg4) {
    var exposureResolved, config;
    if (arguments.length >= 4) {
      exposureResolved = arg3;
      config = arg4;
    } else {
      exposureResolved = undefined;
      config = arg3;
    }
    var notSure = countNotSure(answers, config);
    var scored = countScoredDimensions(dimScores);
    var exactCount = countExactExposureValues(exposureResolved);
    var rule = config.confidence.rules.find(function (r) {
      var minExact = (typeof r.minExactExposureValues === 'number') ? r.minExactExposureValues : 0;
      return notSure <= r.maxNotSure && scored >= r.minDimensionsScored && exactCount >= minExact;
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

  // resolveExposure: exposureAnswers[kind] may be { exact:N }, { band:"Bn" },
  // or absent. Exact wins (USER_PROVIDED); else band repValue (MODELED_ESTIMATE);
  // else null (UNKNOWN). Every kind declared in config.exposure is present in
  // the result, so an absent field still resolves to UNKNOWN rather than
  // being missing from the returned object.
  function resolveExposure(exposureAnswers, config) {
    exposureAnswers = exposureAnswers || {};
    var out = {};
    (config.exposure || []).forEach(function (e) {
      var kind = e.kind;
      var answer = exposureAnswers[kind];
      if (answer && typeof answer.exact === 'number') {
        out[kind] = { value: answer.exact, provenance: 'USER_PROVIDED' };
      } else if (answer && answer.band) {
        var band = (e.bands || []).find(function (b) { return b.key === answer.band; });
        out[kind] = band ? { value: band.repValue, provenance: 'MODELED_ESTIMATE' } : { value: null, provenance: 'UNKNOWN' };
      } else {
        out[kind] = { value: null, provenance: 'UNKNOWN' };
      }
    });
    return out;
  }

  // A field is either a resolved { value, provenance } object (CRS_1.1 caller,
  // via resolveExposure) or a raw number (CRS_1.0 caller, old behavior: a raw
  // number is treated as USER_PROVIDED).
  function resolveDaysField(field) {
    if (field && typeof field === 'object' && 'value' in field) {
      return { value: field.value, provenance: field.provenance || 'UNKNOWN' };
    }
    if (typeof field === 'number') {
      return { value: field, provenance: 'USER_PROVIDED' };
    }
    return { value: null, provenance: 'UNKNOWN' };
  }

  function lostWorkerDays(exposureResolved, config) {
    exposureResolved = exposureResolved || {};
    var cases = resolveDaysField(exposureResolved.annual_lost_time_cases);
    var days = resolveDaysField(exposureResolved.avg_lost_time_duration_days);
    if (typeof cases.value !== 'number' || typeof days.value !== 'number') {
      return { days: null, provenance: 'UNKNOWN', scenarios: [] };
    }
    var total = Math.round(cases.value * days.value);
    var scenarios = [5, 10, 20].map(function (pct) {
      return { pct: pct, days: Math.round(total * pct / 100) };
    });
    var prov = (cases.provenance === 'USER_PROVIDED' && days.provenance === 'USER_PROVIDED') ? 'USER_PROVIDED' : 'MODELED_ESTIMATE';
    return { days: total, provenance: prov, scenarios: scenarios };
  }

  // financialModel: dollars stay null unless loaded_daily_labour_cost is
  // supplied and lostWorkerDays resolves a non-null day total. Every financial
  // variable actually read (supplied by the caller, or an accepted config
  // industry estimate) is recorded in assumptions with its provenance and
  // label. A variable with neither a supplied value nor a config estimate is
  // omitted, never silently assumed.
  function financialModel(exposureResolved, financialInputs, config) {
    financialInputs = financialInputs || {};
    var lwd = lostWorkerDays(exposureResolved, config);
    var inputsCfg = (config.financial && config.financial.inputs) || [];
    var assumptions = [];
    inputsCfg.forEach(function (input) {
      if (typeof financialInputs[input.key] === 'number') {
        assumptions.push({ key: input.key, value: financialInputs[input.key], provenance: 'USER_PROVIDED', label: input.label });
      } else if (input.industry_estimate !== null && input.industry_estimate !== undefined) {
        assumptions.push({ key: input.key, value: input.industry_estimate, provenance: 'MODELED_ESTIMATE', label: input.label });
      }
    });
    var dailyCost = financialInputs.loaded_daily_labour_cost;
    var dollars = null;
    if (typeof dailyCost === 'number' && lwd.days !== null) {
      var dollarProv = (lwd.provenance === 'USER_PROVIDED') ? 'USER_PROVIDED' : 'MODELED_ESTIMATE';
      var perScenario = lwd.scenarios.map(function (s) {
        return { pct: s.pct, dollars: Math.round(s.days * dailyCost), provenance: dollarProv };
      });
      dollars = { perScenario: perScenario };
    }
    return { dollars: dollars, assumptions: assumptions };
  }

  // priorityOpportunities: up to the three lowest scored dimensions (unscored
  // dimensions are excluded, same as strongestAndGap), each carrying its line
  // from config.opportunityTemplates. Sort is stable, so ties keep the
  // dimension declaration order from config.dimensions.
  function priorityOpportunities(dimScores, config) {
    var scored = Object.keys(dimScores).filter(function (d) { return dimScores[d] !== null && dimScores[d] !== undefined; });
    scored.sort(function (a, b) { return dimScores[a] - dimScores[b]; });
    var templates = config.opportunityTemplates || {};
    return scored.slice(0, 3).map(function (d) {
      return { dimension: d, line: templates[d] || '' };
    });
  }

  var api = { dimensionScores: dimensionScores, overallScore: overallScore,
    missingDataRate: missingDataRate, assessmentConfidence: assessmentConfidence,
    bandFor: bandFor, strongestAndGap: strongestAndGap, observation: observation,
    resolveExposure: resolveExposure, lostWorkerDays: lostWorkerDays,
    financialModel: financialModel, priorityOpportunities: priorityOpportunities };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ContinuumScoring = api;
})(typeof window !== "undefined" ? window : globalThis);
