# Prompt 52 Worker surface: feel specification

Specification for builders. Not a visitor-facing product screen.
Source: Prompt 52 section 3.6.

**No worker facing copy exists anywhere in the build package.**
Everything below is **[NEW]** unless marked. Section 3.6 specifies
the register, the content and the obligations. The strings must be
written and then tested with real users, per the Government of
Canada content standard. Recommended strings in this file are draft
for the catalogue. They are not shipped product copy.

**The published evidence is not Canadian and must never be described
as Canadian.** Across one systematic review and four cohort studies,
all Australian or Dutch and two of them road traffic rather than
workers compensation, workers reporting a negative or neutral claims
experience were substantially less likely to be working at interview,
and perceived procedural fairness tracked health outcomes. Prompt 51
section 9 turns procedural justice into build requirements. This
section turns them into screens.

The least specified surface in the product and the one where the
published evidence says design tracks outcomes.

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

Worker register: plain, second person, short sentences, no jargon, no
numbers they did not give. Fifth to sixth grade. The next step is
always visible.

---

## SCR-WRK-01, Worker plan

- **Feels like: being told what happens next by someone who is not
  going to change their mind later.** **[NEW]** Not friendly. Not
  encouraging. Predictable. Anxiety in a workers compensation claim
  is almost entirely fear of an invisible process.
- **Eye lands on:** **[NEW]** the next appointment, with a date, a
  day and a timezone. First line on the screen, above everything,
  every time.
- **The one thing that must be true:** **[NEW]** the worker is told,
  on the first screen, that what they type here never changes their
  medical record and that they can withdraw in one tap. They decide
  within two screens whether this is a recovery companion or a
  surveillance device.
- **Restrictions in plain language from the derived band.** **[SPEC,
  BR-PRIV-005]** A practitioner who measured 8 kg produces LIMITED,
  and the worker is told about 5 kilograms, matching what the board
  was told. The worker never sees 8.
- **Empty:** **[NEW]** there is no empty state on this screen. If
  there is nothing else to show there is still a next step and a
  date. No screen on this surface ever ends without a next step.
- **Loading:** **[NEW]** a phone, on clinic wifi or on data, held by
  someone in pain. Render the appointment line from cache first,
  before anything else resolves.
- **Error:** **[NEW]** never technical. Recommended draft:
  `Your plan cannot be shown right now. Nothing has changed and
  nothing has been sent to anyone. Try again in a few minutes.`
  The second sentence is the one that matters, because the worker's
  first fear is not that the app is broken.
- **Revocation is one tap, confirmed in plain words, effective in 60
  seconds.** **[SPEC, Prompt 40 section 6]** The interface must state
  plainly that information already lawfully disclosed cannot be
  recalled, and the wording does not exist yet. Recommended draft
  (consent language, human gate for Gary): `Your employer stops
  seeing your duty list within one minute. What they have already
  seen cannot be taken back.`
- **Guided exercise content never defaults on.** **[SPEC,
  BR-CLIN-006]** It activates only where the practitioner authorised
  it for that case.
- **No streaks, no compliance scores, no badges, no nudging
  language, no guilt. Ever.** **[NEW]**

---

## SCR-WRK-02, Worker check in

- **Feels like: thirty seconds that gave something back.** **[NEW]**
  A check in that only takes is a check in they abandon in week two.
- **Eye lands on:** **[NEW]** the first question. Not a greeting, not
  a summary of yesterday.
- **The one thing that must be true:** **[NEW]** the check in always
  answers. Something comes back every time: what the doctor said in
  plain words, when the next visit is, what happens next.
- **Their words are theirs.** **[SPEC, BR-CLIN-007]** Everything
  typed is labelled `worker reported`, never auto applied to a
  measurement, never entering a report field. Say that on the screen
  where they type, not only in onboarding.
- **A completed check in is visibly complete.** **[NEW]** The QA pass
  of 30 to 31 July found the opposite in the running app: after an
  evening check in, the toggle, four sliders, the notes field and a
  full colour submit button all still appeared active and none
  responded. "This is your least technical user hitting your worst
  interface defect."
- **Two screens must never disagree about the same record.** **[NEW]**
  The same QA pass found the Today card showing Pain 5, Movement 5
  for a record the History screen showed as Pain 9, Movement 2. One
  record, one value, everywhere.
- **Error:** **[NEW]** a failed submission never loses what they
  typed and never silently discards it. Retain locally, retry, say
  plainly that it has not been sent yet.
- **Check in frequency is a clinical cadence, not a UI preference.**
  **[NEW]** Obsession argues it should fall as the worker
  stabilises. Nothing defines "stabilised", who authorises the
  change, or what it does to the data feeding the next follow up.
  That is open item 5 and it is not built until it is answered.
