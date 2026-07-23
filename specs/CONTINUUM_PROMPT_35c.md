# CONTINUUM PROMPT 35c: Connecting the Live Agent to the Presenter Chatbox (Corrected Edition)

**Deliverable:** The corrected connection runbook for the dedicated ElevenLabs presenter agent (public agent ID agent_8301ky420pc9f4e8ekswyekptnf2). This edition replaces the earlier 35c companion, which was written against the Prompt 32 paste-once architecture. The code that shipped moved past that design: the agent ID is baked into deploy/presenter.js and auto-connects, so there is no paste step, no propagation step, and no credential guard to demonstrate. What remains is a shorter runbook: the two-surface check, three corrected read-only console assertions, the override seam, the voice rehearsal gate from 35b, and the failure modes. Every claim this edition makes about the shipped code and pages was verified against the live deployment on July 22, 2026; process notes, such as the rotate list, are carried forward from the original as stated.
**Date:** July 22, 2026
**Supersedes:** the original 35c companion text where the two differ. The 35b rehearsal material lives in the prompt series stream outside this repo; it is unchanged and still governs.

## 1. What is actually connected, and how

The presenter kit in deploy/presenter.js carries the agent ID as a baked-in default (DEFAULT_AGENT) and mounts the official ElevenLabs Conversational AI element with it whenever Present is toggled on. The connection is made by shipping the file, not by configuring a browser. Any machine, any browser, any private window: open a presenter surface, toggle Present, and the voice is there. An ElevenLabs agent ID is a public embed identifier that is meant to live client side in the widget attribute, so hardcoding it in a public static file is correct posture, not a leak. The API key is a different value, never enters a page, and the key pasted into chat earlier in this stream stays on the rotate list.

An explicit override seam still exists for tuning days: window.ContinuumPresenter.setAgent(id) in the console stores an override under the shared key and both portals on that origin and browser will use it; setAgent("") clears the override and reverts to the dedicated default. No page ever writes that key on its own.

## 2. Where the presenter lives

The voice presenter lives on exactly two surfaces: the employer dashboard and the HSE portal. Each renders a Present button in its page header (gold while presenting) that toggles the shared kit: the explainer card for the section on screen, plus the voice widget. The worker dashboard has its own scripted Present walkthrough with narration beats and no voice widget, by design. The remaining pages carry no chatbox at all; their narration in the room is the eight spoken scripts from Prompt 35, which the Presenter Agent Kit lists first in the agent's knowledge pack so the agent answers in the same words the presenter speaks. The earlier claim that eight surfaces read a shared presenter key conflated the eight spoken scripts with the two chatbox mounts.

## 3. The connect procedure, on the presenting browser

The whole procedure: open the HSE portal, toggle Present on in the page header, and the ElevenLabs launcher appears in the bottom right corner. Grant the microphone permission once when the launcher is first used, during the day-two full pass (the full rehearsal walk of every surface on the day before the room), so no permission dialog appears mid-presentation. That is the entire setup. Nothing is pasted, nothing is stored, and clearing the browser's storage changes nothing, because the default is in the shipped file. The day-two checklist's step to leave the presenting browser's storage untouched is superseded by the shipped default and can be dropped. The coordinator machine (the second laptop that runs the pilot flow) needs no configuration and no avoidance either; blank pilot mode, its clean-slate demo state, is unaffected by the presenter default.

## 4. The two-surface check

In the presenting browser, toggle Present on the HSE portal and confirm the launcher appears, then do the same on the employer dashboard. Two for two with zero configuration is the pass condition. There is no propagation to check because there is nothing to propagate: both surfaces read the same shipped default.

## 5. Corrected read-only console assertions

Three checks in the browser console on either presenter surface, all read-only:

1. window.ContinuumPresenter.activeAgent() returns agent_8301ky420pc9f4e8ekswyekptnf2. This is the value that mounts, and it is never empty.
2. localStorage.getItem('continuum_presenter_agent_v1') returns null on a healthy default setup. A non-null value means someone set a deliberate override with setAgent; it is not required for the connection and null is not a failure. The original companion named the wrong key and treated null as broken; both points are corrected here.
3. document.querySelectorAll('elevenlabs-convai').length returns exactly 1 with Present on (mount-once holding) and 0 after Present is toggled off (teardown holding).

## 6. The override seam, and the guard that is not there

The original companion described a paste field with a credential guard that refuses key-shaped values. That UI does not exist in the shipped code; the test suite asserts its absence, because removing the sign-in step was the point of the auto-connect change. The risk the guard managed is closed at the source: with no input field on any page, nothing key-shaped can be pasted into a portal mid-demo. The only way to change the agent is the console API, which is a deliberate operator act. The API stores what it is given without shape checks, so the one operating rule is: only ever hand setAgent an agent ID from the Widget tab, never anything from the API keys page.

## 7. The voice rehearsal gate

Unchanged from the original, and still the gate: connection is not done until the voice passes rehearsal. With the microphone live, ask the agent the ten scripted questions from the 35b answer section aloud, in room conditions. Each answer must land inside the rules: nothing medical to an employer framed question, the routing phrase spoken exactly, proposed said out loud on anything SIGMA, the staging line on any prediction question, estimates labeled, and pricing or legal handed to Gary by name. Also ask one number the agent does not have, and confirm it declines to guess and hands it to Gary. Where an answer drifts, tighten the agent's prompt on the ElevenLabs side and ask again; the portals need no change during tuning, because the shipped default keeps pointing at the improved agent.

## 8. Failure modes, already handled

If the venue network drops, the explainer cards still narrate every section by design: the card is built from the page's own section map before the widget script is ever asked for, so the voice agent is an upgrade, not a dependency. One honest correction from the original: the tap-based common-question answers described in the Prompt 32 chatbox design did not ship, so offline coverage is narration only, and the presenter answers audience questions the old way if the network is down. If the venue wifi blocks the widget script, the hotspot fallback from the venue checklist carries the voice. The microphone permission is granted once per section 3, during the day-two full pass, before the room fills.

## 9. Verification summary

Verified against the live deployment at continuum-o51l.vercel.app on July 22, 2026: both presenter surfaces auto-connect with storage empty; the widget mounts exactly once with the correct agent-id attribute when Present is on and is removed when Present is off, on both surfaces; the ElevenLabs launcher renders, which shows the widget script loads and mounts with the shipped agent ID (the section 7 rehearsal is the end to end proof of the live conversation); the explainer card rendered before the launcher appeared, consistent with the narration-first design; the six pages outside the two voice surfaces carry none of the shared kit's markers, and the worker dashboard's separate scripted walkthrough is intact. The presenter test suite passes 45 of 45 on main, including the mount-once, teardown, and no-sign-in assertions. This corrected edition is issued as markdown in specs only; no docx counterpart ships with it. Dash audit clean on this file. Numbering: this file re-issues 35c in place; the ledger is unchanged (27 to 36 plus 34a, 35a, 35b, 12j, 13c).

Where care ends, Continuum begins.
