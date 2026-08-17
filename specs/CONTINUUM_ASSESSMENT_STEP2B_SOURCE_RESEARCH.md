# Continuum Public Assessment, Step 2B: Benchmark Source Research (Prompt 63 Section 26)

Date: 2026-08-17. Status: RESEARCH DELIVERABLE for Craig and Gary to review.
Lane: public marketing site, outside the held platform. No em dashes or en dashes.

This is B1, the un-gated source research required by Prompt 63 Section 26 before
any benchmark calculation is finalized. It is reading and assessment only. No
dataset was scraped, downloaded, ingested, or republished. Every ingestion
decision (even for the free public sources) comes AFTER this table is reviewed
and requires Craig's explicit approval, per Section 00 item 3.

## The one finding that governs the whole benchmark design

Every authoritative Canadian and US source publishes injury FREQUENCY, claim
DURATION, COST, or FATALITY data. NONE of them measures RTW MATURITY as Continuum
defines it: restriction communication, modified duty matching, recovery
visibility, integrated workflow. The closest a government body gets is the WSIB
Ontario "RTW success rate," which is a single outcome KPI, not a multi-dimensional
maturity measure.

Consequence (Prompt 63 Section 11, kept in the data model and results language):

1. External datasets are a FREQUENCY and EXPOSURE CONTEXT layer only. They let us
   frame a respondent's injury frequency against an industry baseline. They do
   not benchmark process maturity.
2. The Continuum RTW-maturity benchmark must be built from Continuum's own
   aggregated assessment responses. That is sub-project C, and it stays gated on
   the privacy disclosure plus counsel and a minimum sample size (Section 00.4,
   14). No external dataset substitutes for it.

## Source registry: Canada

| Source | Metrics (context, not maturity) | Access | Licensing / use | Usefulness | Verdict |
|---|---|---|---|---|---|
| Statistics Canada (work-injury tables, CCHS-derived) | Population-level injury prevalence, self-reported | Open, free | Statistics Canada Open Licence: commercial use, resale, and value-added products explicitly allowed with attribution. Best licence of any source reviewed | Population injury-prevalence context; cross-check claims-based rates | CONTEXT-ONLY (feature as a credited context stat) |
| AWCBC, National Work Injury/Disease Statistics Program (NWISP) | Lost-time claim counts and rates, fatalities, by 20 industries x 10 occupations | Free tables; custom cross-tabs by data request | Attribution and non-endorsement required; terms are SILENT on commercial reuse and benchmark building. Confirm with AWCBC directly before commercial reliance (UNVERIFIED) | Closest Canada-wide claims-based frequency baseline | CONTEXT-ONLY (confirm terms with AWCBC first) |
| WSIB Ontario (By the Numbers, Open Data Catalogue) | Lost-time injury rate, claim volume, RTW success-rate KPI, benefits | Open data catalogue, free | Open Government Licence Ontario (commercial reuse with attribution) | Ontario frequency/cost context; RTW-success KPI is a comparator concept, not maturity | CONTEXT-ONLY |
| WorkSafeBC (Data and Insights dashboards) | Claim counts, assessment rates, duration/payment (dashboards) | Public dashboards free | WorkSafeBC Terms of Use (commercial wording UNVERIFIED) | BC frequency/cost context | CONTEXT-ONLY (public dashboards) |
| WorkSafeBC microdata via Population Data BC | Richest disability-duration microdata found | Data Access Request, ethics review, research-gated | Restricted to approved research; not for a public commercial product | Attractive duration fields, incompatible access model | DO-NOT-USE |
| WCB Alberta, Saskatchewan, Manitoba, CNESST Quebec | Frequency, cost, and (SK explicitly) average claim duration by province | Free provincial or open-data portals | Provincial open licences (OGL-style, mostly permissive; per-dataset UNVERIFIED) | Province-specific frequency context; SK duration useful for calibration | CONTEXT-ONLY |
| CCOHS injury-statistics fact sheet | Restates AWCBC data | Free | Secondary summary with an explicit accuracy disclaimer; no primary data | Lay-audience explainer only | DO-NOT-USE as a citation (cite AWCBC directly) |
| Institute for Work and Health (IWH), work-disability duration and RTW-intervention systematic reviews | Disability duration by age/jurisdiction; evidence that accommodation and employer-worker contact shorten duration | Journal paywall; IWH plain-language summaries free | Journal text copyrighted, cannot be republished or mined; findings citable with attribution | Best Canadian bridge between injury data and the maturity constructs Continuum measures | RECOMMEND for citation and validation only, not as a data feed |

## Source registry: United States

| Source | Metrics (context, not maturity) | Access | Licensing / use | Usefulness | Verdict |
|---|---|---|---|---|---|
| OSHA Injury Tracking Application (Form 300A establishment data) | Injury/illness counts, Total Case Rate, DART rate, at ESTABLISHMENT level with NAICS | Open, free, no login | US public domain, no reuse restriction | Establishment-level NAICS granularity lets us build industry-and-size peer cohorts for a frequency context panel. Most operationally useful source found | RECOMMEND (context layer) |
| BLS SOII (Survey of Occupational Injuries and Illnesses) | Incidence rates, DART, days-away cases, by 1,100 plus NAICS industries (industry counts UNVERIFIED at that specificity) | Open, free | Public domain; citation requested, no legal restriction; disclaim BLS endorsement of derived analyses | Industry injury-rate baseline to contextualize a client's frequency | RECOMMEND (context layer) |
| BLS CFOI (Census of Fatal Occupational Injuries) | Fatality counts and rates by industry, occupation, event | Open, free | Public domain, same BLS terms | Fatal cases do not RTW; overall risk-context narrative only | CONTEXT-ONLY |
| WCRI, CompScope Benchmarks | Claim duration, indemnity, litigation, medical, by state | Membership fee 6,800 to 220,000 per year, or per-report purchase | Licensed content, not republishable, cannot be mined into a proprietary product | Best duration/outcome proxy, but state-system level not employer maturity, and paid | CONTEXT-ONLY if licensed; DO-NOT-USE without a paid license |
| NCCI | Aggregated WC frequency, severity, cost trends | Underlying data member/carrier only; summaries public | Raw data proprietary; public summaries copyrighted, cite-only | Cost/frequency context at most; no data feed | DO-NOT-USE (data access); CONTEXT-ONLY (cite summaries) |
| State WC agencies and rating bureaus (e.g. California WCIRB/WCIS, IAIABC EDI) | Premium/loss, frequency/severity, some duration in raw EDI | Public reports free; raw claims restricted | Government reports citable but fragmented across ~50 inconsistent state schemas | State-specific spot checks only, never a unified national feed | CONTEXT-ONLY (spot checks, note fragmentation) |
| Santos et al. 2025 meta-analysis (Journal of Clinical Medicine) | RTW incidence 79 percent pooled, mean time-to-RTW approx 102 days, 16 cohorts, mixed international | Open access | CC BY: citable and quotable with attribution; not a licensable raw dataset, cannot be repackaged as proprietary norms | External anchor statistic for narrative context | CONTEXT-ONLY |
| Krause et al. 2001 (American Journal of Industrial Medicine) | Qualitative synthesis of RTW/disability-duration determinants | Paywall; abstract free | Standard copyright, cannot republish or mine | Determinant categories (accommodation offer, employer-worker contact) map onto Continuum's maturity dimensions; 20 plus years old | RECOMMEND for citation and framing only, not a data source |

## Recommendations

1. **Context layer (recommended, free, safe to cite and reuse with attribution):**
   OSHA ITA and BLS SOII for the US, Statistics Canada and (terms permitting)
   AWCBC/NWISP for Canada. These give an injury-FREQUENCY-by-industry-and-size
   context panel. Attribution is required for each. Confirm AWCBC commercial-use
   terms directly before relying on it.
2. **Do not ingest:** WCRI and NCCI (paid, non-republishable), WorkSafeBC
   Population-Data-BC microdata (research-gated), and any state raw claims EDI
   (fragmented, restricted). CCOHS is a secondary summary; cite AWCBC directly.
3. **Academic evidence (citation and framing only, never a data feed):** Santos
   2025 (CC BY, the approx 102-day RTW anchor), Krause 2001 (determinants that
   map to Continuum's maturity dimensions), and the IWH reviews. Use these to
   support WHY RTW maturity matters, not to produce benchmark numbers.
4. **The RTW-maturity benchmark itself:** build from Continuum's own aggregated
   assessment responses (sub-project C), gated on the privacy disclosure plus
   counsel and a minimum sample size. No external dataset provides this.
5. **Benchmark confidence levels (Section 13)** should reflect the above: a
   frequency-context comparison from OSHA/BLS/StatCan can be labelled a real
   external benchmark where the cohort matches; a maturity comparison stays
   INSUFFICIENT until Continuum's own aggregate clears its minimum sample.

## Gate and open items

- INGESTION GATE (Section 00.3): activating ingestion of ANY source above, even
  the free federal ones, is Craig's explicit decision, made after this review.
  This deliverable does not ingest anything.
- AWCBC commercial-use terms: confirm directly before commercial reliance.
- WCRI: only if Continuum decides a paid license is worthwhile for duration
  context; still not republishable.
- The frequency-vs-maturity distinction (Section 11) must be enforced in the
  sub-project B data model and the results language: never present an external
  frequency figure as an RTW-maturity comparison.

All access, granularity, and licensing claims reflect page content as read on
2026-08-17. Items that could not be confirmed by a direct primary-page read are
labelled UNVERIFIED above (notably BLS SOII industry-count specifics, fetched
via secondary pages after a 403 on the primary URL).
