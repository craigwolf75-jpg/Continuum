# Prompt 52 Voice: what Continuum sounds like

Specification for builders. Not visitor-facing product copy to paste
into a screen from this file. Prompt 51 says what the product may not
say. This file says what it does say. Every user facing string is
written to this section.

**All of section 2 is [NEW]** except the five protected strings, which
are **[SPEC]**. [CHANGE] lines name what they override.

No em dashes or en dashes anywhere. Standing holds: no live Bedrock,
no occupational seed, no schema apply, `package.json` locked. This
file does not invent Prompt 38 screens and does not create a
coordinator dashboard.

Source: Prompt 52 section 2, written 8 August 2026.

---

## 2.1 The character [NEW]

Continuum speaks like an experienced occupational physician sitting
beside you: plain, certain about what it knows, and openly uncertain
about what it does not.

Four attributes, in priority order when they conflict:

1. **Accurate before brief.** A shorter sentence that is slightly
   wrong is worse than a longer one that is exactly right. This is a
   clinical product.
2. **Specific before general.** `Needs Dr. Chen's signature by 15:40
   MDT` beats `Action required`.
3. **Plain before formal.** Say `the box is filled in but the form
   says the worker has no PHN` rather than `PHN indicator
   inconsistency`.
4. **Calm before reassuring.** State the fact. Do not add comfort the
   product cannot back.

---

## 2.2 The nine rules of Continuum copy [NEW]

1. **Speak to the reader as "you". Do not give the software a first
   person voice.** No "I", and no "we" where "we" means the software.
   "We" is permitted only in consent, privacy and legal text, where a
   legal entity is genuinely the speaker. Two existing strings breach
   this and are listed in section 2.5 as copy decisions, not as
   models.
2. **Name the thing.** Never "an error occurred", never "something
   went wrong", never "this item". Name the field, the form, the
   worker, the person.
3. **Say what happens next, in the same sentence or the next one.**
   Every message that reports a state also states the action or the
   wait.
4. **Numbers are exact or absent.** Never "several", "a few", "many".
   If the count is computable, compute it. If it is not, do not
   gesture at it.
5. **Uncertainty is stated as uncertainty, in the same register as
   certainty.** `Not mapped to a field automatically. Logged for
   review.` is correct. `Oops, we had trouble with that one` is not.
6. **No praise, no encouragement, no apology.** Not "Great, that's
   done", not "Sorry about that", not "Almost there". The product is a
   colleague, not a host.
7. **No verb inflation.** "Save", not "Save your changes now".
   "Sign", not "Complete your signature". Buttons are verbs and
   objects, at most three words.
8. **The board's words are the board's words.** Where a string is
   reproduced from a board document, reproduce it character for
   character, mark it as board sourced in the string catalogue, and
   put the plain language explanation beside it, never instead of it.
9. **The worker is spoken to at a fifth to sixth grade reading
   level, and the practitioner is not.** Two registers, one voice.

---

## 2.3 Symbols in strings

**[NEW]** No glyph carries meaning on its own. Prompt 51 section 0.2
bans emoji. Prompt 51 section 6.6 defines the five named status icons
as `aria-hidden` SVG accompanied by text. WCAG 1.4.1 forbids any
state conveyed without a second channel.

Several existing wireframe strings embed glyphs directly: `⚠`, `ⓘ`,
`●`, `⛔`, `✓`, `⧗`, `✕`, `⚑`. U+26A0 is emoji classified and will
trip a standard linter. Every one of these must be re-rendered
through the Prompt 51 section 6.6 icon contract, with the text of the
string unchanged.

**[CHANGE]**, overriding the glyph rendering in the build package
wireframes, not their wording.

---

## 2.4 The register, by surface [NEW]

| Surface | Register | Test |
|---|---|---|
| Practitioner and clinic staff | Colleague to colleague. Clinical vocabulary used correctly and without explanation | Would a physician wince at it? |
| Coordinator | Operational and specific. Every line names a thing, a time and a person | Could they act on it without asking anyone? |
| Employer | Instructional and bounded. What this person can do, until when, and what Continuum will not tell them | Could a supervisor assign work from it alone? |
| Worker | Plain, second person, short sentences, no jargon, no numbers they did not give | Would someone reading at grade five understand it on the first pass, on a phone, in pain? |

---

## 2.5 Six strings that carry disproportionate weight, and two that need a decision

### The five protected strings [SPEC]

Protect these five, character for character. All from the build
package or Prompt 38. Any copy pass that makes the protected five
shorter, warmer or more branded has made the product worse.

1. `"You can say no. Your care will be exactly the same either way."` (Consent A)
2. `"Your employer would NEVER be shown: your diagnosis, your symptoms, your medications, or anything the doctor found on examination."` (Consent B)
3. `"Continuum shows you what work is safe. It does not tell you the worker's diagnosis, symptoms, medications or examination findings, and never will."` (Employer view, glyph stripped per section 2.3)
4. `"In plain terms: the PHN box is filled in but the form says the worker has no PHN. One of the two has to change."` (Rejection)
5. `"This is recorded as your clinical judgement."` (Bulk Able confirmation)

Consent A, Consent B, and the employer wall line are consent and
privacy language. This file records them as [SPEC]. It does not
rewrite them. Human gate for Gary if anyone proposes a change.

### The measured value and band pairing [CHANGE]

Prompt 38 section 3.3 and Prompt 51 section 4.3.4 both specify:

`Limited to, LIMITED (5 kg / 11 lb)`

with the note:

`you measured 8 kg, rounded down for safety`

The build package wireframe carries a different variant with a glyph
and a middle dot. **The Prompt 38 form governs.** **[CHANGE]**,
overriding wireframe 5.9.

### Two copy decisions [NEW]

Two existing strings breach rule 1 and need a decision, not
preservation:

- `"We could not map this to a field automatically. Logged for review."`
  Recommended replacement: `Not mapped to a field automatically. Logged for review.`
- Any consent or privacy string using "we" is permitted and unchanged.
  "We" is lawful there because a legal entity is the speaker.
