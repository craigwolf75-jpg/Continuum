// Continuum Recovery Benchmark reference config, version CRB_2026_01. Data
// only, no scoring or lookup logic. Ships DARK: sources carry metadata only,
// data is empty, no external values are loaded. No em or en dashes anywhere.
(function (root) {
  var CRB = {
    benchmarkVersion: "CRB_2026_01",
    changelog: "CRB_2026_01 introduces the benchmark reference config as a dark shell: cohort dimensions, confidence levels, an adequacy floor, the frequency-context metric definitions, and the free public source registry (OSHA ITA, BLS SOII, Statistics Canada, AWCBC NWISP) transcribed from the B1 source research. No benchmark values are loaded. The engine that consumes this config proves its logic against SYNTH fixtures only. Source URLs are the B1 verified references; the Statistics Canada entry uses the organization root pending a specific data table URL, so no deep link was invented.",
    cohortDimensions: [
      "country",
      "province_state",
      "industry",
      "workforce_size_band",
      "injury_volume_band",
      "site_count_band"
    ],
    confidenceLevels: ["HIGH", "MODERATE", "ESTIMATED", "INSUFFICIENT"],
    adequacyFloor: 5,
    metrics: [
      {
        key: "lost_time_incidence_rate",
        label: "Lost Time Incidence Rate",
        unit: "cases per 100 full time workers per year",
        note: "Frequency context only, not a return to work maturity measure."
      },
      {
        key: "total_case_rate",
        label: "Total Recordable Case Rate",
        unit: "cases per 100 full time workers per year",
        note: "Frequency context only, not a return to work maturity measure."
      }
    ],
    sources: [
      {
        id: "osha_ita",
        org: "U.S. Occupational Safety and Health Administration",
        title: "OSHA Injury Tracking Application, Form 300A establishment data",
        url: "https://www.osha.gov/Establishment-Specific-Injury-and-Illness-Data",
        dataPeriod: "Annual establishment year, most recent published collection year",
        geography: "United States, establishment level with NAICS code",
        industryClassification: "NAICS",
        metricKeys: ["total_case_rate", "lost_time_incidence_rate"],
        licensing: "US public domain, no reuse restriction",
        attribution: "Source: U.S. Occupational Safety and Health Administration, Injury Tracking Application",
        dateRetrieved: "2026-08-17",
        verdict: "RECOMMEND"
      },
      {
        id: "bls_soii",
        org: "U.S. Bureau of Labor Statistics",
        title: "Survey of Occupational Injuries and Illnesses (SOII)",
        url: "https://www.bls.gov/iif",
        dataPeriod: "Annual, most recent published survey year",
        geography: "United States, by NAICS industry",
        industryClassification: "NAICS",
        metricKeys: ["lost_time_incidence_rate", "total_case_rate"],
        licensing: "Public domain, citation requested, no legal restriction; BLS does not endorse derived analyses",
        attribution: "Source: U.S. Bureau of Labor Statistics, Survey of Occupational Injuries and Illnesses",
        dateRetrieved: "2026-08-17",
        verdict: "RECOMMEND"
      },
      {
        id: "statcan_work_injury",
        org: "Statistics Canada",
        title: "Work injury tables (CCHS derived, population level injury prevalence)",
        url: "https://www.statcan.gc.ca",
        dataPeriod: "Most recent published Canadian Community Health Survey cycle",
        geography: "Canada, national and provincial",
        industryClassification: "NAICS or self reported occupation category",
        metricKeys: ["lost_time_incidence_rate"],
        licensing: "Statistics Canada Open Licence: commercial use, resale, and value added products explicitly allowed with attribution",
        attribution: "Source: Statistics Canada",
        dateRetrieved: "2026-08-17",
        verdict: "CONTEXT-ONLY"
      },
      {
        id: "awcbc_nwisp",
        org: "Association of Workers Compensation Boards of Canada",
        title: "National Work Injury, Disease and Fatality Statistics Program (NWISP)",
        url: "https://awcbc.org/data-and-statistics/national-work-injury-disease-statistics-program",
        dataPeriod: "Annual, most recent published collection year",
        geography: "Canada, national, by 20 industries and 10 occupations",
        industryClassification: "AWCBC industry and occupation grouping",
        metricKeys: ["lost_time_incidence_rate"],
        licensing: "Attribution and non endorsement required; terms silent on commercial reuse and benchmark building, confirm with AWCBC directly before commercial reliance",
        attribution: "Source: Association of Workers Compensation Boards of Canada, National Work Injury, Disease and Fatality Statistics Program",
        dateRetrieved: "2026-08-17",
        verdict: "CONTEXT-ONLY"
      }
    ],
    data: {}
  };
  if (typeof module !== "undefined" && module.exports) module.exports = CRB;
  else root.ContinuumBenchmark_CRB = CRB;
})(typeof window !== "undefined" ? window : globalThis);
