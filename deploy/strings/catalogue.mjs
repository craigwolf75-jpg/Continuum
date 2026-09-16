/* Prompt 52 string catalogue scaffolding. Board-sourced entries must be
   rendered with data-board. No em/en dashes. Catalogue is the source for
   new strings; existing surfaces remain inline until those screens are
   built. getString is the resolver. */

const SURFACES = new Set(["practitioner", "coordinator", "employer", "worker", "auth", "legal"]);
const VOICES = new Set(["software", "user", "legal", "board"]);
const MARKERS = new Set(["SPEC", "NEW", "CHANGE"]);
const SCREEN_RE = /^SCR-[A-Z]+-\d{2}$/;

function namedMissing(id) {
  const err = new Error("String id " + id + " is not in the catalogue.");
  err.name = "StringUnknownError";
  err.code = "STRING-UNKNOWN";
  return err;
}

function freezeEntry(row) {
  if (!row || typeof row !== "object") {
    throw new Error("Catalogue entry must be an object.");
  }
  const entry = {
    id: row.id,
    text: row.text,
    board: row.board,
    protected: row.protected,
    surface: row.surface,
    screen: row.screen,
    source: row.source,
    voice: row.voice,
    marker: row.marker,
  };
  if (typeof entry.id !== "string" || !entry.id) {
    throw new Error("Catalogue entry is missing a stable id.");
  }
  if (typeof entry.text !== "string" || !entry.text) {
    throw new Error("Catalogue entry " + entry.id + " is missing text.");
  }
  if (typeof entry.board !== "boolean" || typeof entry.protected !== "boolean") {
    throw new Error("Catalogue entry " + entry.id + " must set board and protected.");
  }
  if (!SURFACES.has(entry.surface)) {
    throw new Error("Catalogue entry " + entry.id + " has an unknown surface.");
  }
  if (entry.screen !== "none" && !SCREEN_RE.test(entry.screen)) {
    throw new Error("Catalogue entry " + entry.id + " has an unknown screen.");
  }
  if (/^SCR-(COORD|OWNER)/.test(entry.screen)) {
    throw new Error("Catalogue entry " + entry.id + " must not invent a screen id.");
  }
  if (typeof entry.source !== "string" || !entry.source) {
    throw new Error("Catalogue entry " + entry.id + " is missing source.");
  }
  if (!VOICES.has(entry.voice)) {
    throw new Error("Catalogue entry " + entry.id + " has an unknown voice.");
  }
  if (!MARKERS.has(entry.marker)) {
    throw new Error("Catalogue entry " + entry.id + " has an unknown marker.");
  }
  if (entry.voice === "board" && entry.board !== true) {
    throw new Error("Catalogue entry " + entry.id + " is board voice without board:true.");
  }
  if (entry.board === true && entry.voice !== "board") {
    throw new Error("Catalogue entry " + entry.id + " is board:true without board voice.");
  }
  return Object.freeze(entry);
}

const rows = [
  {
    id: "consent.say_no",
    text: "You can say no. Your care will be exactly the same either way.",
    board: false,
    protected: true,
    surface: "worker",
    screen: "SCR-CONS-01",
    source: "Prompt 52 section 2.5 protected five, Consent A",
    voice: "legal",
    marker: "SPEC",
  },
  {
    id: "consent.employer_never_shown",
    text: "Your employer would NEVER be shown: your diagnosis, your symptoms, your medications, or anything the doctor found on examination.",
    board: false,
    protected: true,
    surface: "worker",
    screen: "SCR-CONS-01",
    source: "Prompt 52 section 2.5 protected five, Consent B",
    voice: "legal",
    marker: "SPEC",
  },
  {
    id: "employer.privacy_wall",
    text: "Continuum shows you what work is safe. It does not tell you the worker's diagnosis, symptoms, medications or examination findings, and never will.",
    board: false,
    protected: true,
    surface: "employer",
    screen: "SCR-EMP-01",
    source: "Prompt 52 section 2.5 protected five, employer view",
    voice: "legal",
    marker: "SPEC",
  },
  {
    id: "rejection.phn_inconsistency",
    text: "In plain terms: the PHN box is filled in but the form says the worker has no PHN. One of the two has to change.",
    board: false,
    protected: true,
    surface: "practitioner",
    screen: "SCR-REJ-01",
    source: "Prompt 52 section 2.5 protected five, rejection",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "measurement.clinical_judgement",
    text: "This is recorded as your clinical judgement.",
    board: false,
    protected: true,
    surface: "practitioner",
    screen: "SCR-MEAS-01",
    source: "Prompt 52 section 2.5 protected five, bulk Able confirmation",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "measurement.limited_band",
    text: "Limited to, LIMITED (5 kg / 11 lb)",
    board: true,
    protected: false,
    surface: "practitioner",
    screen: "SCR-MEAS-01",
    source: "Prompt 38 section 3.3 form wording, Prompt 52 section 2.5",
    voice: "board",
    marker: "SPEC",
  },
  {
    id: "measurement.rounded_down",
    text: "you measured 8 kg, rounded down for safety",
    board: false,
    protected: false,
    surface: "practitioner",
    screen: "SCR-MEAS-01",
    source: "Prompt 38 section 3.3 pairing note, Prompt 52 section 2.5 CHANGE",
    voice: "software",
    marker: "CHANGE",
  },
  {
    id: "rejection.not_mapped",
    text: "Not mapped to a field automatically. Logged for review.",
    board: false,
    protected: false,
    surface: "practitioner",
    screen: "SCR-REJ-01",
    source: "Prompt 52 section 2.5 copy decision, recommended replacement",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "auth.email_or_password",
    text: "Email or password is not right.",
    board: false,
    protected: false,
    surface: "auth",
    screen: "SCR-AUTH-01",
    source: "Prompt 52 section 3.1 SCR-AUTH-01",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "auth.code_not_right",
    text: "That code is not right. Codes expire after five minutes.",
    board: false,
    protected: false,
    surface: "auth",
    screen: "SCR-AUTH-02",
    source: "Prompt 52 section 3.1 SCR-AUTH-02",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "auth.reset_sent",
    text: "If that address has an account, a reset link is on its way. It expires in one hour.",
    board: false,
    protected: false,
    surface: "auth",
    screen: "SCR-AUTH-03",
    source: "Prompt 52 section 3.1 SCR-AUTH-03",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "auth.signed_out",
    text: "You have been signed out for security.",
    board: false,
    protected: false,
    surface: "auth",
    screen: "SCR-AUTH-01",
    source: "Prompt 52 section 3.1 session expiry",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "session.draft_held",
    text: "Your draft is held for 15 minutes.",
    board: false,
    protected: false,
    surface: "auth",
    screen: "SCR-AUTH-01",
    source: "Prompt 52 section 3.1 session expiry",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "worklist.empty",
    text: "No open cases. Start one when a worker arrives.",
    board: false,
    protected: false,
    surface: "practitioner",
    screen: "SCR-WL-01",
    source: "Prompt 52 section 3.2 SCR-WL-01 empty",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "worklist.due_today",
    text: "4 due today. 2 safe. 1 at risk, needs Dr. Chen's signature by 15:40 MDT. 1 will miss.",
    board: false,
    protected: false,
    surface: "practitioner",
    screen: "SCR-WL-01",
    source: "Prompt 52 section 3.2 rollup, timezone CHANGE from Prompt 50 7.4",
    voice: "software",
    marker: "CHANGE",
  },
  {
    id: "employer.empty_restrictions",
    text: "No workers are currently under restriction.",
    board: false,
    protected: false,
    surface: "employer",
    screen: "SCR-EMP-01",
    source: "Prompt 52 section 3.5 SCR-EMP-01 empty",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "worker.plan_unavailable",
    text: "Your plan cannot be shown right now. Nothing has changed and nothing has been sent to anyone. Try again in a few minutes.",
    board: false,
    protected: false,
    surface: "worker",
    screen: "SCR-WRK-01",
    source: "Prompt 52 section 3.6 SCR-WRK-01 error draft",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "worker.employer_view_clears",
    text: "Your employer stops seeing your duty list within one minute. What they have already seen cannot be taken back.",
    board: false,
    protected: false,
    surface: "worker",
    screen: "SCR-WRK-01",
    source: "Prompt 52 section 3.6 revocation draft, Prompt 40 section 6",
    voice: "legal",
    marker: "NEW",
  },
  {
    id: "followup.no_checkins",
    text: "No check ins recorded",
    board: false,
    protected: false,
    surface: "practitioner",
    screen: "SCR-FUP-01",
    source: "Prompt 52 section 3.2 SCR-FUP-01 empty",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "treatment.no_change",
    text: "No change since last visit",
    board: false,
    protected: false,
    surface: "practitioner",
    screen: "SCR-TREAT-01",
    source: "Prompt 52 section 3.2 SCR-TREAT-01 carry forward",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "coordinator.empty_rejections",
    text: "No rejections. Anything the board returns lands here within an hour of the batch.",
    board: false,
    protected: false,
    surface: "coordinator",
    screen: "none",
    source: "Prompt 52 section 3.3 coordinator empty example, no screen id",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "duty.safe_now",
    text: "SAFE NOW (14)",
    board: false,
    protected: false,
    surface: "employer",
    screen: "SCR-EMP-02",
    source: "Prompt 52 section 3.5 duty count example",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "duty.conditional",
    text: "CONDITIONAL (6)",
    board: false,
    protected: false,
    surface: "employer",
    screen: "SCR-EMP-02",
    source: "Prompt 52 section 3.5 duty count example",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "duty.not_suitable",
    text: "NOT SUITABLE (9)",
    board: false,
    protected: false,
    surface: "employer",
    screen: "SCR-EMP-02",
    source: "Prompt 52 section 3.5 duty count example",
    voice: "software",
    marker: "SPEC",
  },
  {
    id: "consent.show_employer_view",
    text: "SHOW ME EXACTLY WHAT MY EMPLOYER SEES",
    board: false,
    protected: false,
    surface: "worker",
    screen: "SCR-CONS-01",
    source: "Prompt 52 section 3.2 SCR-CONS-01 secondary control",
    voice: "software",
    marker: "NEW",
  },
  {
    id: "session.work_status",
    text: "Work status: FIT WITH RESTRICTIONS",
    board: true,
    protected: false,
    surface: "employer",
    screen: "SCR-EMP-02",
    source: "Prompt 52 section 3.5 employer case view, board work status",
    voice: "board",
    marker: "NEW",
  },
];

const seen = new Set();
for (const row of rows) {
  if (seen.has(row.id)) throw new Error("Duplicate catalogue id: " + row.id);
  seen.add(row.id);
}

export const STRINGS = Object.freeze(rows.map(freezeEntry));

const BY_ID = new Map(STRINGS.map((entry) => [entry.id, entry]));

export const PROTECTED_IDS = Object.freeze(
  STRINGS.filter((entry) => entry.protected).map((entry) => entry.id)
);

export function getEntry(id) {
  return BY_ID.get(id);
}

export function getString(id) {
  const entry = BY_ID.get(id);
  if (!entry) throw namedMissing(id);
  return entry.text;
}

export function boardMarkerAttribute() {
  return "data-board";
}

export function listByScreen(screen) {
  return STRINGS.filter((entry) => entry.screen === screen);
}

export function listBySurface(surface) {
  return STRINGS.filter((entry) => entry.surface === surface);
}
