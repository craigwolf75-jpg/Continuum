// Continuum Recovery Readiness scoring model, version CRS_1.1. Data only, no
// scoring logic. No em or en dashes anywhere.
(function (root) {
  var CRS = {
    version: "CRS_1.1",
    changelog: "CRS_1.1 adds optional exact number entry for annual lost time cases and average lost time duration, config authored opportunity templates for all six dimensions, an expanded observations library, refined confidence tiers that read exact versus range and user provided versus estimated counts, and an optional financial block that turns worker day scenarios into dollar figures only when the employer supplies a loaded daily labour cost. No scoring weights, bands, or question wording changed from CRS_1.0.",
    scale: { STRUCTURED:100, ESTABLISHED:75, PARTIAL:50, MANUAL:25, ABSENT:0, NOT_SURE:null },
    dimensions: {
      MEDICAL_ACCESS:        { label:"Medical Access", weight:15 },
      RESTRICTIONS_WORKFLOW: { label:"Restrictions Workflow", weight:20 },
      MODIFIED_DUTY:         { label:"Modified Duty and RTW", weight:25 },
      RECOVERY_VISIBILITY:   { label:"Recovery Visibility", weight:20 },
      CLAIMS_COORDINATION:   { label:"Claims Coordination", weight:10 },
      WORKFLOW_INTEGRATION:  { label:"Workflow Integration", weight:10 }
    },
    bands: [
      { min:0,  max:39,  label:"Reactive" },
      { min:40, max:59,  label:"Developing" },
      { min:60, max:79,  label:"Established" },
      { min:80, max:100, label:"Advanced" }
    ],
    confidence: { rules: [
      { level:"High",     maxNotSure:1,  minDimensionsScored:5, minExactExposureValues:1 },
      { level:"Moderate", maxNotSure:3,  minDimensionsScored:4, minExactExposureValues:0 },
      { level:"Limited",  maxNotSure:99, minDimensionsScored:0, minExactExposureValues:0 }
    ]},
    industries: ["construction","mining","security","manufacturing","transportation","healthcare","other"],
    questions: [
      { id:"S1Q1", stage:1, dimension:"MEDICAL_ACCESS",
        text:"When a worker is injured, how do they get in to see a doctor or clinician?",
        options:[
          { label:"Same day, through a provider we have arranged", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"Usually within a day or two, through a known provider", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"The worker arranges it themselves, timing varies", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"Often delayed or hard to arrange", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"There is no set way", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] },
      { id:"S1Q2", stage:1, dimension:"RESTRICTIONS_WORKFLOW",
        text:"When a doctor sets work restrictions, how do those restrictions reach the people who plan the worker's duties?",
        options:[
          { label:"A system routes them to the right people automatically", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"A defined manual process that is reliably followed", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"Case by case, mostly by hand", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"By phone or paper, and it varies", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"There is no reliable process", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] },
      { id:"S1Q3", stage:1, dimension:"MODIFIED_DUTY",
        text:"How does your organization find suitable modified or light duties for a recovering worker?",
        options:[
          { label:"A maintained list of approved modified duties matched to the restrictions", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"A repeatable process, matched mostly by hand", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"Improvised for each case by a supervisor or coordinator", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"Rarely offered, workers usually stay off work", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"We do not offer modified duty", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] },
      { id:"S1Q4", stage:1, dimension:"RECOVERY_VISIBILITY",
        text:"How well can the right people see a worker's recovery progress and current status?",
        options:[
          { label:"A shared, up to date view for the roles that need it", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"Regular updates kept in one place", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"Occasional updates, spread across people and tools", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"Little visibility until a problem appears", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"No real visibility", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] },
      { id:"S1Q5", stage:1, dimension:"CLAIMS_COORDINATION",
        text:"How is the workers compensation claim coordinated alongside the worker's recovery?",
        options:[
          { label:"Claim and recovery are managed together, closely coordinated", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"Coordinated by one clear owner", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"Handled separately, with some handoffs", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"Fragmented, with frequent gaps", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"Not coordinated", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] },
      { id:"S1Q6", stage:1, dimension:"WORKFLOW_INTEGRATION",
        text:"How connected are the systems and people involved in recovery: medical, employer, and claims?",
        options:[
          { label:"Connected systems with defined handoffs", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"Some connection, coordinated mostly by hand", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"Separate systems with manual handoffs", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"Disconnected, information is re-entered", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"No connection between them", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] },
      { id:"S2Q5", stage:2, dimension:"MODIFIED_DUTY",
        text:"Once a worker starts modified duties, how is their progress tracked?",
        options:[
          { label:"Tracked and adjusted with the clinician", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"Tracked manually and reviewed", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"Started but not really tracked", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"Not tracked", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"Not applicable, we do not offer modified duty", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] },
      { id:"S2Q6", stage:2, dimension:"RECOVERY_VISIBILITY",
        text:"Can a worker and their supervisor see the current restrictions and the plan without having to ask someone?",
        options:[
          { label:"Both can, self serve", key:"STRUCTURED", value:100, provenance:"USER_PROVIDED" },
          { label:"One of them can", key:"ESTABLISHED", value:75, provenance:"USER_PROVIDED" },
          { label:"Only by asking a coordinator", key:"PARTIAL", value:50, provenance:"USER_PROVIDED" },
          { label:"No, it is not visible to them", key:"MANUAL", value:25, provenance:"USER_PROVIDED" },
          { label:"There is no plan to see", key:"ABSENT", value:0, provenance:"USER_PROVIDED" },
          { label:"Not sure", key:"NOT_SURE", value:null, provenance:"UNKNOWN" }
        ] }
    ],
    exposure: [
      { id:"S2Q1", stage:2, kind:"workforce_size", allowExact:false,
        bands:[
          { label:"Under 100", key:"B1", repValue:50 },
          { label:"100 to 499", key:"B2", repValue:300 },
          { label:"500 to 1999", key:"B3", repValue:1250 },
          { label:"2000 to 9999", key:"B4", repValue:6000 },
          { label:"10000 plus", key:"B5", repValue:10000 }
        ] },
      { id:"S2Q2", stage:2, kind:"annual_lost_time_cases", allowExact:true,
        bands:[
          { label:"Under 10", key:"B1", repValue:5 },
          { label:"10 to 49", key:"B2", repValue:30 },
          { label:"50 to 199", key:"B3", repValue:125 },
          { label:"200 to 999", key:"B4", repValue:600 },
          { label:"1000 plus", key:"B5", repValue:1000 }
        ] },
      { id:"S2Q3", stage:2, kind:"avg_lost_time_duration_days", allowExact:true,
        bands:[
          { label:"Under 1 week", key:"B1", repValue:5 },
          { label:"1 to 2 weeks", key:"B2", repValue:11 },
          { label:"3 to 4 weeks", key:"B3", repValue:25 },
          { label:"1 to 3 months", key:"B4", repValue:60 },
          { label:"3 months plus", key:"B5", repValue:120 }
        ] },
      { id:"S2Q4", stage:2, kind:"site_count", allowExact:false,
        bands:[
          { label:"1", key:"B1", repValue:1 },
          { label:"2 to 5", key:"B2", repValue:3 },
          { label:"6 to 20", key:"B3", repValue:13 },
          { label:"21 plus", key:"B4", repValue:21 }
        ] }
    ],
    opportunityTemplates: {
      MEDICAL_ACCESS: "Getting an injured worker in front of a doctor quickly and consistently is the opportunity here, since early medical contact tends to set the pace for everything that follows.",
      RESTRICTIONS_WORKFLOW: "Getting medical restrictions to the people who plan daily work, quickly and without relying on someone remembering to pass them along, is the opportunity in this area.",
      MODIFIED_DUTY: "Finding suitable modified duties still depends on manual coordination, which is where recovery time is most often lost.",
      RECOVERY_VISIBILITY: "Giving the right people a clear, current view of where each recovery stands, instead of waiting for someone to ask, is the opportunity here.",
      CLAIMS_COORDINATION: "Keeping the claim and the recovery plan moving together, under one clear owner, is the opportunity in claims coordination.",
      WORKFLOW_INTEGRATION: "Connecting the medical, employer, and claims pieces so information moves once instead of being re-entered is the opportunity in workflow integration."
    },
    observations: [
      { id:"restrictions_ok_duty_gap",
        when:[ { dimension:"RESTRICTIONS_WORKFLOW", op:">=", value:60 },
               { dimension:"MODIFIED_DUTY", op:"<=", value:50 } ],
        template:"Your responses suggest that medical restrictions are being received reasonably effectively, but translating those restrictions into suitable work may still require significant manual coordination." },
      { id:"visibility_gap",
        when:[ { dimension:"RECOVERY_VISIBILITY", op:"<=", value:25 } ],
        template:"Recovery progress appears to have limited visibility, which usually means problems are noticed late rather than prevented." },
      { id:"medical_access_strong_claims_weak",
        when:[ { dimension:"MEDICAL_ACCESS", op:">=", value:75 },
               { dimension:"CLAIMS_COORDINATION", op:"<=", value:50 } ],
        template:"Workers appear to reach medical care quickly, but the claim itself seems to run on a separate track from the recovery, which can create friction later." },
      { id:"workflow_integration_weak",
        when:[ { dimension:"WORKFLOW_INTEGRATION", op:"<=", value:25 } ],
        template:"The medical, employer, and claims pieces appear to be disconnected, which usually shows up as information being re-entered or lost between handoffs." },
      { id:"claims_strong_visibility_weak",
        when:[ { dimension:"CLAIMS_COORDINATION", op:">=", value:75 },
               { dimension:"RECOVERY_VISIBILITY", op:"<=", value:50 } ],
        template:"Claims coordination looks solid, but recovery status does not appear to be visible to the people who need it day to day." },
      { id:"broadly_advanced",
        when:[ { dimension:"MODIFIED_DUTY", op:">=", value:75 },
               { dimension:"RESTRICTIONS_WORKFLOW", op:">=", value:75 },
               { dimension:"RECOVERY_VISIBILITY", op:">=", value:75 } ],
        template:"Your responses describe a recovery process with structured handling across restrictions, modified duty, and visibility, which is a strong foundation to build on." },
      { id:"default",
        when:[],
        template:"Your responses give an initial picture of how your recovery and return to work process is working today. The deeper assessment will sharpen it." }
    ],
    financial: {
      enabled_when_inputs_present: true,
      operational_only_note: "Without a stated labour cost, results are shown as worker days only, never as a dollar estimate.",
      inputs: [
        { key:"loaded_daily_labour_cost", label:"Loaded daily labour cost per worker", unit:"dollars per day", required:true, industry_estimate:null },
        { key:"replacement_or_overtime_cost", label:"Replacement or overtime cost per lost day", unit:"dollars per day", required:false, industry_estimate:null },
        { key:"admin_handling_cost", label:"Administrative handling cost per case", unit:"dollars per case", required:false, industry_estimate:null },
        { key:"claim_cost", label:"Average claim cost", unit:"dollars per case", required:false, industry_estimate:null },
        { key:"indirect_cost_multiplier", label:"Indirect cost multiplier", unit:"multiplier", required:false, industry_estimate:null }
      ]
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = CRS;
  else root.ContinuumCRS = CRS;
})(typeof window !== "undefined" ? window : globalThis);
