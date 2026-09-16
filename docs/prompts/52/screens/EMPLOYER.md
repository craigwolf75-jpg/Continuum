# Prompt 52 Employer surface: feel specification

Specification for builders. Not a visitor-facing product screen.
Source: Prompt 52 section 3.5.

Two screens, no section 4 specification, and the strictest privacy
rules in the product. The employer never sees clinical fields.
Clinical vocabulary is absent from employer-facing content.

Reading convention:

- **[SPEC]** reports what an existing document already requires.
  Verify it, do not redecide it.
- **[NEW]** is authored by this prompt because no specification
  exists.
- **[CHANGE]** overrides an existing specification, and says what it
  overrides and why.

No em dashes or en dashes anywhere. Standing holds: no live Bedrock,
no occupational seed, no schema apply, `package.json` locked. This
file does not invent Prompt 38 screens.

---

## SCR-EMP-01, Employer dashboard

**No specification. [NEW] unless marked.**

- **Feels like: a message, not a portal.** **[NEW]** A portal you
  must remember to visit is a portal you visit twice. This screen
  exists for the supervisor who followed a link from a notification
  and will not see it again for a month.
- **Eye lands on:** **[NEW]** the list of workers currently under
  restriction, with a date beside each. Nothing else.
- **The one thing that must be true:** **[SPEC, Project Obsession
  improvement 19]** the wall is stated "in one visible line, every
  time". **[NEW]** Implement that as a permanent element of the
  layout on every employer screen, not a one time notice.
  `Continuum shows you what work is safe. It does not tell you the
  worker's diagnosis, symptoms, medications or examination findings,
  and never will.`
- **Empty:** **[NEW]** `No workers are currently under restriction.`
  Nothing else. No illustration, no invitation to explore.
- **Loading and error:** **[NEW]** on any error, render nothing and
  say so. This is the one surface in the product where a blank screen
  is safer than a partial one.
- **[SPEC]** Nothing on this surface is ever an alert about a
  worker's clinical status. Clinical urgency never routes to an
  employer.

The disclosure line is protected string 3 in
`docs/prompts/52/VOICE.md`. [SPEC]. Do not shorten, warm, or brand
it.

---

## SCR-EMP-02, Employer case view and duty list

**Wireframe only. [NEW] unless marked.**

- **Feels like: an instruction.** **[NEW]** Three duty columns,
  counts on each, and a supervisor who can act without asking anyone
  anything.
- **Eye lands on:** **[NEW]** `Work status: FIT WITH RESTRICTIONS`
  and the reassessment date, in that order. **[SPEC, Obsession
  improvement 18]** Three lines, then everything else one click down:
  can they work, doing what, when is the next assessment.
- **The one thing that must be true:** CONDITIONAL is explained, not
  just labelled. **[SPEC, BR-WF-010]** A duty is conditional because
  nobody has rated what it requires. **[NEW]** Say that in functional
  terms and say what would fix it once. One wrong SAFE costs the
  relationship; a hundred honest CONDITIONALs build it.
- **Expired renders as expired, never as current.** **[SPEC,
  BR-WF-011]** **[NEW]** This is the most dangerous state on the
  surface, because a supervisor acting on a stale duty list believes
  it is current. Give expired the same visual weight as the work
  status line, not a small grey label.
- **No profile means no employer view at all.** **[SPEC, Prompt 40
  section 5 and acceptance criterion 3]** Where the employer has no
  job profile, publish nothing, do not guess duties, and surface the
  reason to the coordinator. A worker whose employer has no job
  profile produces a Pink Copy and no employer view and no error.
  **[CHANGE]**, correcting the build package journey 6.6 step 4,
  which says the Pink Copy payload is "available" in that case: the
  Pink Copy is the worker's, delivered by print or by a secure link
  the worker controls, and Continuum never sends it to an employer.
  Prompt 40 section 7 is explicit: "the lawful channel is the worker
  handing it over. We are not a party to that disclosure." The Pink
  Copy also carries per axis restriction values, the worker's home
  address and phone, hospitalisation status and the practitioner's
  billing number, none of which the employer view may hold.
- **The counts carry the meaning:** **[SPEC]** `SAFE NOW (14)` ·
  `CONDITIONAL (6)` · `NOT SUITABLE (9)`. **[NEW]** A supervisor
  reads three numbers and knows the shape of the problem before
  reading a single duty name.
- **Read on a phone, in a truck, between other things.** **[NEW]**
  Mobile first, 44 px targets per Prompt 51 section 6.1, and the
  three columns become three stacked sections in the same order.
