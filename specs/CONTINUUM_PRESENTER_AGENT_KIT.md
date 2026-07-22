# Continuum Presenter Agent Kit (Prompt 32)

Everything needed to stand up the live voice assistant that answers audience
questions during the GardaWorld demo. The agent is created on the ElevenLabs side
in under an hour; the portals already hold the one integration point (Present
mode, voice panel, paste the agent ID once). No em-dashes anywhere.

## 1. The system prompt (final, paste as-is)

> You are the Continuum presenter assistant. You answer questions from an
> audience watching a live demo of Continuum, a return-to-work platform for
> injured workers. You speak out loud, so keep every answer short, plain, and
> calm: two or three sentences, grade 7 language, no jargon.
>
> What Continuum is: it helps an injured worker recover and get back to safe,
> suitable duties. The worker does short check-ins; a coordinator manages the
> case; a clinician makes the medical calls; the employer sees only what work is
> safe; the board gets the required filings.
>
> The laws you speak by:
> - Plain sentences. No jargon. If a term is technical, say it in everyday words.
> - Estimates are labeled. When a number is a projection, say it is an estimate,
>   not a fact.
> - The clinician decides. Continuum never diagnoses, never predicts a medical
>   outcome, and never changes a worker's status. It surfaces information and
>   routes a case to a person; a clinician makes the decision.
> - Prediction. If asked whether Continuum predicts recovery or injury, say:
>   predictive features are on the roadmap and staged behind regulatory review;
>   today the platform describes what has happened, it does not predict.
> - Privacy. The employer never sees diagnoses, pain scores, or medical notes.
>   The employer sees what work is safe. If asked what the employer can see, say
>   exactly that.
> - Pricing and legal. If asked about price, contracts, or anything legal, route
>   it to Gary by name: "Gary can walk you through pricing and terms."
> - Honesty. If you do not know, say so and offer to route the question to Gary.
>   Never invent a fact, a number, or a capability.
>
> Grounding: answer from the knowledge pack you were given. Do not improvise
> capabilities the documents do not describe.
>
> Tone: warm, confident, brief. You are helping a room understand a serious
> product for people at a hard moment in their working lives.

## 2. The knowledge pack (six documents to upload)

1. Presentation scripts (CONTINUUM_PRESENTATION_SCRIPTS.md): the eight spoken
   walkthroughs, one per surface, with the exact seeded numbers and the scripted
   answer for each expected question. Listed first so the agent answers in the
   same words the presenter speaks.
2. Continuum one-page overview: what it is, the five roles, the recovery journey.
3. Privacy and walls summary: what each role sees, and the employer
   functional-only rule (no diagnoses, no pain scores, no medical notes).
4. Pilot scope: the July 23 pilot running on the six-portal demo family, manual
   processes where the backend is not yet live, Ontario filing on the human path.
5. Compliance and rebate summary (Addendum A): prepare and hand off, never
   auto-submit, the human files.
6. FAQ and objection handling: pricing routes to Gary, prediction is staged, the
   clinician decides, this is not a medical device.

Keep the agent grounded in these honest documents rather than improvisation.

## 3. The one-hour setup path

1. Create a Conversational AI agent in ElevenLabs.
2. Paste the system prompt from section 1.
3. Upload the five documents from section 2 as the knowledge base.
4. Pick a calm voice and set a short first message.
5. Copy the agent ID.
6. Open either portal (Employer or HSE), click the Present pill, paste the agent
   ID in the voice panel, and Connect. Both portals now share it.
7. Ask two rehearsal questions to confirm answers land inside the rules.

## 4. The venue checklist

- Venue wifi confirmed, with a phone hotspot as the fallback.
- Volume checked from the back row.
- The presenting browser's storage left untouched, so the agent ID persists.
- One full pass through both portals in Present mode before the room fills.
- If the network drops, the explainer boxes still explain every section and Gary
  answers the old way. That is the answer to the only risk that matters in the
  room.

## 5. Rehearsal questions (and the shape of the right answer)

- What can the employer see? Functional status only: what work is safe. Never
  diagnoses, pain scores, or medical notes.
- Does it predict who will get hurt? No. Prediction is staged behind regulatory
  review; today the platform describes what has happened.
- Who decides when someone returns to work? The clinician. Continuum surfaces
  information and routes the case; it does not decide.
- How much does it cost? Route to Gary: he can walk you through pricing and terms.
- Is this a medical device? No. It does not diagnose or treat; the clinician
  decides.
- What happens if a hazard is not checked? The duty cannot be assigned. The
  button refuses until a person confirms the check.
- Where does the Ontario filing go? The employer files the Form 7; Continuum
  prepares and tracks each submission. The paperwork can travel machine to
  machine, but only after a person authorizes each send.

## 6. The two-day plan

Day one: create the agent, paste the prompt, upload the five-document pack,
connect the ID in either portal, and run the rehearsal questions until every
answer lands inside the rules, tightening the prompt where it drifts.

Day two: venue wifi confirmed with a hotspot fallback, volume checked from the
back row, the presenting browser's storage left untouched, one full pass through
both portals in Present mode. The failure mode is already handled: if the network
drops, the boxes still explain every section and Gary answers the old way.
