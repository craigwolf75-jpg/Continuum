# Prompt 60 C1447 verification

Inspected 2026-09-17. Read only. Companion to
[SECTION_1.md](SECTION_1.md). This file records the form
extract. It is not a seed, not a schema, and not a board
alignment claim.

No em dashes or en dashes anywhere. Do not invent Prompt 61.
Hermes ships only when Craig names ship.

---

## Source

PDF downloaded 2026-09-17 from
https://www.wcb.ab.ca/assets/pdfs/employers/C1447.pdf

Local copy: `/tmp/c1447/C1447.pdf`

| Fact | Value |
|---|---|
| Bytes | 2476632 |
| Pages | 7 (pypdf `len(reader.pages)` = 7) |
| Printed page header | `C1447 REV NOV 2025 Page 1 of 7` (and pages 2 to 7) |
| Extract text | `/tmp/c1447/C1447.txt` (pypdf) |
| PDF metadata `/Title` | `C1447 - REV JAN 2025` |

The printed page header and the metadata title do not
match. Later work must cite the printed header (REV NOV
2025) and may note the metadata title as a file property,
not as a second form edition.

Form title on the extract:

- Page 1 wrap: `Cognitive-Psychosocial Job Demand s Analysis`
  (space inside Demands from the PDF line break).
- Pages 2 to 7: `Cognitive-Psychosocial Job Demands Analysis`.

---

## The thirteen prompt labels

The thirteen prompt labels match the form task names when
line wraps are joined. Extract order from the summary
block (`C1447.txt` lines 23 to 43):

1. Short-term memory and recall
2. Attention to detail
3. Completing multiple tasks
4. Mental endurance
5. Problem solving and decision making
6. Self-supervision
7. Supervision of others
8. Time pressures
9. Exposure to environmental distractions
10. Interpersonal relationships (working cooperatively with others)
11. Exposure to emotional situations and/or distressed individuals
12. Exposure to confrontational situations
13. Verbal communication

Do not rename these. Do not "improve" them.

---

## Items 14 and 15 (report the form wording)

Summary page extract (`C1447.txt` lines 44 to 45):

- `14.Additional tasks:` (no space after the period, plural,
  colon).
- `15. Additional tasks:` (space after the period, plural,
  colon).

Detail pages extract (`C1447.txt` lines 340 and 352):

- `14. Additional task` (singular, no colon in the heading
  extract).
- `15. Additional task` (singular, no colon in the heading
  extract).

Use the form wording where it matters. Do not normalise
plural vs singular in a later seed.

---

## Printed frequency key (page 7)

Extract (`C1447.txt` lines 455 to 484), transcribed with
ASCII hyphens in place of the PDF's dash glyphs:

| Printed label | Printed percent |
|---|---|
| Not required (N/R) | 0% |
| Rare | 1-5% |
| Occasional | 6-33% |
| Frequent | 34-66% |
| Constant | 67-100% |
| Not daily | separate row: `Tasks not required on a daily basis` |

Printed gaps exist. Example: 5.5 belongs to no printed
percent band (it sits between Rare 1-5 and Occasional 6-33).
The 8-hour duration column also prints `5.51` on both the
Frequent upper bound and the Constant lower bound
(`C1447.txt` lines 473 to 480).

Prompt 2.2 derivation fills those printed gaps. A later
build must use the Prompt 2.2 derivation and must report
the printed-key gap. Do not invent a Continuum percent
scale that pretends the printed key is complete.

---

## Intensity definitions were retrieved

Low, moderate, and high definitions exist on the form for
each of the thirteen numbered tasks. Store the rating plus
the retrieved definition. Do not claim customer-facing
board alignment. Section 8.2 is Craig's (see
[REGISTER.md](REGISTER.md) and [STOPS.md](STOPS.md)).

Retrieved definitions (joined wraps, form wording kept):

1. Short-term memory and recall
   - Low: Minimal need to remember and recall information
     that is applied to work tasks and/or there are clear
     processes and instructions available to carry out work
     tasks.
   - Moderate: Recall information that is harder to remember
     because it is not often used or there are time
     constraints within which to recall the information.
   - High: Recall many difference pieces of detailed
     information and/or sequences which may have ot be
     recalled in demanding situations (e.g., tight timeline
     pressures or being out of control).
2. Attention to detail
   - Low: Minimal attention or concentration is required,
     and this is not an intense level. Errors made would
     not create serious difficulty.
   - Moderate: Significant attention of concentration is
     required for many tasks. Errors made would not impact
     safety of others.
   - High: Intense level of attention or concentration is
     required. Errors made would have detrimental
     consequences (e.g., safety of others).
3. Completing multiple tasks
   - Low: Completion of one task at a time with few
     interruptions until completion or until further
     direction from a supervisor.
   - Moderate: Completion of multiple tasks at a time with
     need to exercise some time management and judgement to
     determine priorities.
   - High: Completion of multiple, concurrent tasks with
     need to exercise a high degree of time management and
     judgement to determine when to attend to each task.
4. Mental endurance
   - Low: Ability to take regular breaks throughout the
     workday and most often work shift ends at a consistent
     time.
   - Moderate: May need to move breaks around, working
     extended periods of time without stopping and/or often
     need to work overtime.
   - High: Not able to take breaks at regular intervals,
     working non-stop for extended periods of time and/or
     performing overnight or on-call shifts.
5. Problem solving and decision making
   - Low: Minimal degree of judgment where any lapses would
     not create serious difficulty.
   - Moderate: Some level of judgement is required but does
     not assume the safety of others.
   - High: Significant level of judgment required and/or is
     responsible for safety of others.
6. Self-supervision
   - Low: Minimal self-supervision required and supervisor
     often provides work direction.
   - Moderate: Self-supervision is required with occasional
     direction from supervisor.
   - High: Predominantly self-supervised with ability to
     contact supervisor if needed.
7. Supervision of others
   - Low: May be required to provide work direction to
     others with no other supervisory duties.
   - Moderate: Provides work direction and manages some
     elements of work performance of others.
   - High: Full supervisory responsibility of other
     employees.
8. Time pressures
   - Low: Majority of work is self-paced with minimal time
     constraints.
   - Moderate: Pressure to meet deadlines or work within
     time constraints and/or the volume of work is high,
     and work pace is moderately fast.
   - High: Most work is performed under rigid time
     constraints and the volume of work is high (fast work
     pace or worker must extend the workday to manage work
     volumes).
9. Exposure to environmental distractions
   - Low: Minimal distracting visual, auditory or other
     sensory stimuli present during some tasks or portions
     of the shift.
   - Moderate: Some presence of distracting stimuli during
     some tasks or portions of the shift.
   - High: Significant presence of distracting stimuli
     during most tasks or portions of the shift where it is
     essential.
10. Interpersonal relationships (working cooperatively with others)
    - Low: Minimal need to work cooperatively with others;
      however, may be in close proximity to others.
    - Moderate: May need to work in cooperation with others
      for some tasks and/or consult with others to complete
      tasks.
    - High: Work requires close cooperation with others
      and/r work within a team to complete tasks.
11. Exposure to emotional situations and/or distressed individuals
    - Low: Minimal exposure to emotionally stressful
      circumstances or emotionally distressed individuals
      and no direct interaction from worker is required to
      complete job duties.
    - Moderate: Some exposure to emotionally stressful
      circumstances or emotionally distressed individuals
      with whom the worker must interact with in order to
      complete job duties. Assistance is available.
    - High: Significant exposure to emotionally stressful
      circumstances or emotionally distressed individuals
      with whom the worker must interact with in order to
      complete job duties. Assistance is not available, and
      implementation of de-escalation techniques is
      required.
12. Exposure to confrontational situations
    - Low: Minimal exposure to confrontational situations
      and no direct interaction from worker is required to
      complete job duties.
    - Moderate: Some exposure to confrontational situations
      with whom the worker must interact with in order to
      complete job duties. Assistance is available.
    - High: Significant exposure to confrontational
      situations or hostile individuals with whom the
      worker must interact with in order to complete job
      duties. Assistance is not available, and
      implementation of de escalation techniques is
      required.
13. Verbal communication
    - Low: Basic communication skills required to
      comprehend and communicate information at a basic
      level within well defined parameters (e.g.,
      communicate status of job or job task with supervisor
      to work crews).
    - Moderate: Moderate communication skills required to
      comprehend and communicate information fluently
      (e.g., to work crews).
    - High: Highly developed communication skills are
      required to comprehend and communicate complex
      information and ideas or communicate effectively in
      complex situations (e.g., explaining the design of a
      complex system, exchange information with physicians
      regarding public health issues, policy discussions,
      conflict resolution).

OCR / extract artefacts left as retrieved: `difference`
(likely different), `ot be` (likely to be), `and/r`
(likely and/or), `attention of concentration` (form
wording on task 2 moderate). Do not silently correct them
in a later seed.

Items 14 and 15 have empty Low / Moderate / High shells
on the detail pages. No definitions were printed there.

---

## Position classification (page 5)

Printed question (`C1447.txt` line 375):

`Is the position considered safety-sensitive, risk sensitive or decision critical?`

Hyphenation is inconsistent on the form: `safety-sensitive`
is hyphenated, `risk sensitive` is not, `decision critical`
is not. The three checkbox labels on the same page then
use `Safety-sensitive`, `Risk sensitive`, and
`Decision critical`.

Do not regularise this in a later seed.

---

## Task descriptors beyond the prompt minimum (page 5)

`Select all relevant job task descriptions that apply to
the position` (`C1447.txt` lines 389 to 405) includes more
than the prompt minimum:

- Driving
- Working with and around equipment
- Tool usage
- Providing direct care to persons
- Working with animals
- Climbing or working at heights
- Tasks including decision making which would affect
  another individual
- Tasks in which errors made would have negative
  consequences including privacy of information or
  confidentiality, legal and/or financial implications
- Other, please specify

A later SYNTH extension may need those extra descriptors
as rated or unmapped demands. This inspection does not
invent them as live axes.

---

## What this file is not

- Not imported by the duty match.
- Not a SQL table.
- Not a Prompt 61 Section 2 substitute.
- Not permission to seed beyond SYNTH.
- Not a customer-facing board alignment claim.
- Not a live schema apply.
