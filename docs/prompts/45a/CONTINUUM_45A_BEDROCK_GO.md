# CONTINUUM 45A: Amazon Bedrock Canada GO instruction

Paste-ready decision instruction for Amazon Bedrock in `ca-central-1` (Canada Central, Montreal). Status: GO instruction for Gary to send or approve. This document is not a live enablement. No agent, no Claude session, and no CI job may treat this file as permission to call a live model API.

Retrieval date for every AWS citation in this file: 2026-09-15.

No em dashes and no en dashes anywhere in this instruction. A missing or unknown value is UNKNOWN, never 0.

## 0. What this instruction is, and is not

This is a binding GO packet Gary can send to counsel, to AWS account owners, and to a later Continuum mission. It states the only lawful Bedrock path Continuum may ever consider: regional, in-region, Canada Central, with a recorded no-train clause.

It does not enable production inference. It does not open a socket. It does not invent a vendor client. It does not replace `clinical/engine/ai_stub_provider.mjs`. It does not flip `clinical/engine/submission_gate.mjs`. It does not apply schema. It does not seed occupational data.

Until Gary records Prerequisite 1 evidence and Prerequisite 2 evidence in writing, and a later human-approved mission wires a provider, live inference stays STOPPED.

## 1. Binding conditions (all must hold)

1. Regional or in-region deployment only. The resolved AWS Region must be exactly `ca-central-1`. Any other Region is a stop.
2. Invocation must target the official Canada Central Bedrock endpoints. Control plane: `https://bedrock.ca-central-1.amazonaws.com`. Runtime (InvokeModel, Converse): `https://bedrock-runtime.ca-central-1.amazonaws.com`. No other host.
3. Every cross-Region inference profile is forbidden by name and by prefix class. CRIS routes requests out of Canada. That is a residency stop, not a preference.
4. The no-train clause must exist, be cited, and be recorded as Prerequisite 2 evidence. If the clause does not exist for the chosen model, STOP.
5. A startup assertion must refuse to initialize if the resolved Region is not exactly `ca-central-1`.
6. The in-process stub remains the only allowed provider until both prerequisites are recorded. No live provider is invented in 45a.
7. Consent language, legal pages, pricing, schema live apply, `package.json`, and email templates stay human-gated.

If any condition fails, the answer is STOP, not a workaround.

## 2. Regional or in-region deployment only

Identifiable Canadian worker data must never leave Canada. Prompt 39 prerequisite 7 already treats residency as a stop. Prompt 44 Section 1 treats an unverified Canada path as a stop. This GO instruction restates both.

Allowed:

- A foundation model invoked in `ca-central-1` using an in-region foundation model ID (no CRIS prefix).
- The official `ca-central-1` Bedrock control-plane and runtime endpoints named above.
- A startup assertion that the resolved Region string is exactly `ca-central-1`.

Forbidden:

- Any Region other than `ca-central-1`, including `ca-west-1` (Calgary), every US Region, every EU Region, every APAC Region, and every GovCloud Region.
- Any Cross-Region Inference (CRIS) profile, geographic or global.
- Any application inference profile whose destination Regions include a Region outside Canada.
- Any "process in another Region, store logs in Canada" construction. Transient inference outside Canada is still a residency breach for Continuum.

AWS blog, retrieved 2026-09-15, title "Accelerate generative AI innovation in Canada with Amazon Bedrock cross-Region inference", source: https://aws.amazon.com/blogs/machine-learning/accelerate-generative-ai-innovation-in-canada-with-amazon-bedrock-cross-region-inference/

That post states, as of 2026-09-15:

- From the Canada (Central) Region, CRIS US profiles route requests to multiple US Regions.
- From the Canada (Central) Region, Global profiles route requests to global AWS Regions.
- The post distinguishes transient inference processing (which CRIS may place in another Region) from data at rest (which the post says can remain in Canada). Continuum does not accept that split. If the prompt or completion is processed outside Canada, the path fails residency.

Therefore every CRIS profile is forbidden, including profiles that an operator might enable "from" `ca-central-1`. Source Region is not destination Region. Destination outside Canada is the stop.

## 3. Forbidden cross-Region inference profiles, by name and by prefix class

Prefix-class forbid is required so a new CRIS name cannot slip through. A later AWS launch that adds `us.anthropic.claude-something-new` is already forbidden without an edit to this list.

### 3.1 Named system-defined profile IDs (forbidden)

These IDs are named in the 2026-09-15 AWS Canada CRIS blog. Each is forbidden:

- `us.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `us.anthropic.claude-haiku-4-5-20251001-v1:0`
- `global.anthropic.claude-haiku-4-5-20251001-v1:0`

Any ARN that embeds one of those IDs is also forbidden, including:

- `arn:aws:bedrock:ca-central-1::inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `arn:aws:bedrock:ca-central-1::inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `arn:aws:bedrock:ca-central-1::inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0`
- `arn:aws:bedrock:ca-central-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0`

An ARN whose Region component is not `ca-central-1` is forbidden even when the model token looks in-region.

### 3.2 Older named CRIS IDs (also forbidden)

These older US and Global Claude 3, Claude 3.5, Nova, and Llama CRIS IDs are forbidden if they appear as a profile or as an ARN resource. The list is illustrative. Prefix-class forbid is the real gate.

- `us.anthropic.claude-3-haiku-20240307-v1:0`
- `us.anthropic.claude-3-sonnet-20240229-v1:0`
- `us.anthropic.claude-3-5-sonnet-20240620-v1:0`
- `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- `us.anthropic.claude-3-5-haiku-20241022-v1:0`
- `us.anthropic.claude-3-7-sonnet-20250219-v1:0`
- `global.anthropic.claude-3-5-sonnet-20241022-v2:0`
- `global.anthropic.claude-sonnet-4-20250514-v1:0`
- `us.amazon.nova-lite-v1:0`
- `us.amazon.nova-micro-v1:0`
- `us.amazon.nova-pro-v1:0`
- `us.amazon.nova-premier-v1:0`
- `global.amazon.nova-lite-v1:0`
- `us.meta.llama3-8b-instruct-v1:0`
- `us.meta.llama3-70b-instruct-v1:0`
- `us.meta.llama3-1-8b-instruct-v1:0`
- `us.meta.llama3-1-70b-instruct-v1:0`
- `us.meta.llama3-1-405b-instruct-v1:0`
- `us.meta.llama3-2-1b-instruct-v1:0`
- `us.meta.llama3-2-3b-instruct-v1:0`
- `us.meta.llama3-2-11b-instruct-v1:0`
- `us.meta.llama3-2-90b-instruct-v1:0`
- `us.meta.llama3-3-70b-instruct-v1:0`

### 3.3 Prefix classes (required forbid)

Any ID or ARN whose model or profile token starts with one of these prefixes is forbidden:

- `us.`
- `eu.`
- `apac.`
- `global.`

Additional CRIS geography prefixes, forbidden for the same reason (they route out of Canada):

- `jp.`
- `au.`

Examples that fail on prefix class alone:

- `us.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `eu.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `apac.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `jp.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `au.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `us.amazon.nova-lite-v1:0`
- `global.amazon.nova-pro-v1:0`
- `us.meta.llama3-70b-instruct-v1:0`

### 3.4 Application inference profiles

Any application inference profile whose destination Regions include a Region outside Canada is forbidden.

Until destinations are proven, in writing, to be Canada only, treat every application inference profile as forbidden. Continuum must not inspect destinations by making a live AWS call from an unverified session. Fail closed.

Any identifier containing `application-inference-profile` is therefore forbidden in 45a scaffolding and in this GO instruction.

### 3.5 Empty, missing, and UNKNOWN

An empty profile, a missing profile when a profile is required, or the token `UNKNOWN` is a fail-closed stop. UNKNOWN is never treated as 0, never treated as "default in-region", and never coerced into an allowed ID.

## 4. Prerequisite 1 evidence: invocation configuration plus a startup assertion

Prerequisite 1 is not "we intend to use Canada". It is two concrete artifacts.

### 4.1 Invocation configuration (must be recorded)

Gary records, in writing, all of the following:

1. AWS Region string: exactly `ca-central-1`.
2. Control-plane endpoint: `https://bedrock.ca-central-1.amazonaws.com`.
3. Runtime endpoint: `https://bedrock-runtime.ca-central-1.amazonaws.com` (the official `ca-central-1` Bedrock runtime endpoint).
4. The chosen in-region foundation model ID, with no CRIS prefix, or the explicit statement that no model is chosen yet.
5. Confirmation that no inference profile ID starting with `us.`, `eu.`, `apac.`, `global.`, `jp.`, or `au.` is configured.
6. Confirmation that no application inference profile is configured unless its destination Regions are proven Canada-only (none are proven in 45a).

Invocation must target `https://bedrock.ca-central-1.amazonaws.com` or the official `ca-central-1` Bedrock endpoint named above. A client constructed against `bedrock.us-east-1.amazonaws.com`, `bedrock-runtime.us-east-1.amazonaws.com`, a CRIS profile, or a global endpoint fails Prerequisite 1.

### 4.2 Startup assertion on the resolved Region (must be recorded)

The process that would later construct an inference client must assert the resolved Region before any client object exists.

Required behavior:

- Read the resolved Region from the recorded configuration (environment or injected map). The 45a flag name is `CONTINUUM_BEDROCK_REGION`.
- If the value is missing, empty, `UNKNOWN`, `UNVERIFIED`, or `0`, refuse to initialize. Error code: `BEDROCK-REGION-MISSING`.
- If the value is not exactly `ca-central-1`, refuse to initialize. Error code: `BEDROCK-REGION-FORBIDDEN`.
- Do not trim the decision into a sibling Region. `ca-west-1` is a stop. `ca-central-1 ` after trim may be accepted only after trim; the compared value must still be exactly `ca-central-1`.
- Do not construct an AWS SDK client, open a socket, or read a vendor key as part of the assertion.

45a ships a pure-function scaffold for this assertion:

- `clinical/engine/bedrock_canada_guard.mjs` (region and profile fail-closed)
- `clinical/engine/bedrock_inference_init.mjs` (startup assertion stub)
- `deploy/bedrock_canada_guard.test.mjs` (CI)

On success those functions still return a `ready: false` handle: "evidence recorded, client not constructed". Live inference stays STOPPED.

### 4.3 Prerequisite 1 is UNVERIFIED until Gary records it

This GO instruction is not the evidence. Marketing copy is not the evidence. A passing unit test of the guard is not the evidence. Gary records the invocation configuration and the startup assertion result. Until that writing exists, Prompt 44 criterion 10 stays UNVERIFIED (`deploy/ai_boundaries.test.mjs`).

## 5. Prerequisite 2 evidence: the no-train clause, cited

STOP if the clause does not exist. The clause does exist as of 2026-09-15 on the pages below. Cite them. Do not paste an em dash or an en dash from the AWS marketing page into Continuum files.

### 5.1 AWS Bedrock security page (verbatim no-train clause, no dash)

Source: https://aws.amazon.com/bedrock/security-privacy-responsible-ai/

Retrieved: 2026-09-15

Verbatim no-train clause (this sentence has no dash; quote it exactly):

> Amazon Bedrock never shares your data with model providers or uses it to train foundation models.

The same page also states a second marketing sentence. The live page uses a dash. Do not paste that dash. Continuum restatement, dash-free:

> inputs and outputs are never shared with model providers or used to train base models.

The first sentence is the clause Continuum records. The restatement is only a pointer that the page also claims inputs and outputs are unused for training. Passing marketing copy is not evidence that a specific model Continuum might choose is covered. Gary still records Prerequisite 2 against the chosen model.

### 5.2 AWS user guide, Data protection (Model Deployment Account language)

Source: https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html

Retrieved: 2026-09-15

The page states that Amazon Bedrock has a Model Deployment Account in each AWS Region where Bedrock is available, one such deployment account per model provider, owned and operated by the Amazon Bedrock service team. Verbatim:

> Model providers don't have any access to those accounts.

And:

> Because the model providers don't have access to those accounts, they don't have access to Amazon Bedrock logs or to customer prompts and completions.

That is the Model Deployment Account language this GO instruction requires. If a later retrieval no longer contains those sentences, STOP and re-record. Do not rely on memory.

### 5.3 AWS user guide, Data retention (mode `none`, and models that fail)

Source: https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html

Retrieved: 2026-09-15

The page defines `data_retention_mode` `none` as zero data retention. Verbatim:

> No request or response data is written to durable storage by AWS or shared with the model provider.

Continuum treats `none` as the only retention mode compatible with the no-train checklist. Modes `default`, `aws_review`, and `provider_data_share` fail the checklist until a no-share clause is recorded for the specific model.

Some models require a more permissive retention mode as a condition of access. The 45a brief names Claude Mythos 5 and Claude Fable 5 as models that require `provider_data_share`. The data-retention page retrieved 2026-09-15 lists Claude Fable 5 and Claude Fable 5.1 as models whose `allowed_modes` require `aws_review` or `provider_data_share`. Those models FAIL the no-train checklist until a no-share clause is recorded for them.

STOP if a chosen alternate lacks the no-train clause. Do not substitute a sibling model. Do not treat "Bedrock in general" as coverage for a model that requires provider share or AWS human review.

### 5.4 How Gary records Prerequisite 2

Gary records, in writing:

1. The exact clause quoted in 5.1: "Amazon Bedrock never shares your data with model providers or uses it to train foundation models."
2. The Data protection Model Deployment Account sentences in 5.2.
3. The data-retention `none` sentence in 5.3.
4. The source URLs and the retrieval date (2026-09-15, or a later date if Gary re-retrieves).
5. The chosen in-region model ID (or "no model chosen").
6. Confirmation that the chosen model is not Claude Mythos 5, Claude Fable 5, Claude Fable 5.1, or any other model whose `allowed_modes` exclude `none`.

45a flag names, documented as `UNVERIFIED` by default:

- `CONTINUUM_BEDROCK_NO_TRAIN_EVIDENCE`
- `CONTINUUM_BEDROCK_NO_TRAIN_SOURCE`
- `CONTINUUM_BEDROCK_NO_TRAIN_RETRIEVED_AT`

Setting those flags is still not a live enablement. `clinical/engine/bedrock_inference_init.mjs` refuses to construct a network client even when the flags are recorded. The in-process stub remains the only allowed provider until both prerequisites are recorded and a later human-approved mission wires a provider.

If any flag is missing, empty, `UNVERIFIED`, `UNKNOWN`, or `0`, the startup assertion throws `BEDROCK-NO-TRAIN-UNVERIFIED`. UNKNOWN is never rendered as 0.

## 6. Alternates, verified under the identical checklist

Each alternate below is a candidate family, not an approved production model. Each is UNVERIFIED for live Continuum use until Gary records Prerequisite 1 evidence and Prerequisite 2 evidence for that exact in-region foundation model ID. The checklist is identical. Passing marketing copy is not evidence.

Checklist (identical for every alternate):

1. In-region `ca-central-1` foundation model ID with no CRIS prefix (`us.`, `eu.`, `apac.`, `global.`, `jp.`, `au.`).
2. Invocation against `https://bedrock.ca-central-1.amazonaws.com` or `https://bedrock-runtime.ca-central-1.amazonaws.com`.
3. Startup assertion refuses to initialize unless the resolved Region is exactly `ca-central-1`.
4. No-train clause present for that model, cited with source and retrieval date. STOP if absent.
5. Retention mode compatible with `none`. Models that require `provider_data_share` or `aws_review` fail until a no-share clause is recorded.
6. No application inference profile with a destination outside Canada.
7. No live call is made to "check" availability from an unverified session.

### 6.1 Anthropic Claude on Bedrock, in-region

Candidate shape: a foundation model ID starting with `anthropic.` and not with a CRIS prefix. Examples of in-region ID shape (not an approval): `anthropic.claude-3-haiku-20240307-v1:0`, `anthropic.claude-3-sonnet-20240229-v1:0`.

Claude Sonnet 4.5 and Claude Haiku 4.5, as advertised for Canada on 2026-09-15, are offered through CRIS profile IDs (`us.anthropic...` and `global.anthropic...`). Those IDs are forbidden by name in Section 3. They are not alternates. They fail the checklist on residency before no-train is even reached.

Status: UNVERIFIED. Gary must record Prerequisite 1 and 2 against one exact in-region Claude ID that exists in `ca-central-1` without a CRIS prefix. If no such ID exists, Claude is not available to Continuum.

### 6.2 Amazon Nova, in-region if available in `ca-central-1`

Candidate shape: a foundation model ID starting with `amazon.nova` and not with a CRIS prefix. Example of ID shape (not an approval): `amazon.nova-lite-v1:0`.

Any `us.amazon.nova-...` or `global.amazon.nova-...` ID is forbidden by prefix class. If Nova is only offered in `ca-central-1` through a CRIS profile, Nova is not available to Continuum.

Status: UNVERIFIED. Confirm in-region (not profile-only) availability in `ca-central-1` as Prerequisite 1 evidence. Confirm the no-train clause covers that Nova ID as Prerequisite 2 evidence. Do not assume Amazon-branded models inherit the Bedrock marketing sentence without recording it.

### 6.3 Meta Llama, in-region if available in `ca-central-1`

Candidate shape: a foundation model ID starting with `meta.llama` and not with a CRIS prefix. Examples of ID shape (not an approval): `meta.llama3-8b-instruct-v1:0`, `meta.llama3-70b-instruct-v1:0`.

Any `us.meta.llama...` ID is forbidden by prefix class.

Status: UNVERIFIED. Confirm in-region availability in `ca-central-1` as Prerequisite 1 evidence. Confirm the no-train clause covers that Llama ID as Prerequisite 2 evidence. STOP if the chosen Llama ID lacks the clause.

### 6.4 What "verified under the identical checklist" means

Verified means Gary wrote down the six checklist items for that exact ID. It does not mean a blog listed the family. It does not mean a third-party availability table showed a bare model ID. It does not mean 45a named the family. Until that writing exists, every alternate stays UNVERIFIED.

## 7. What does NOT change

Restated so a GO approval cannot be read as a silent enablement.

1. Production submission remains disabled. `clinical/engine/submission_gate.mjs` (Prompt 43a gate 1) still requires accredited clinic, region recorded, cron secret, and an explicit operator flag. Even then the default uploader refuses. 45a does not flip `CONTINUUM_ALLOW_BOARD_SUBMISSION`.
2. Review and sign remains inert: zero model calls. `clinical/engine/ai_sign_guard.mjs` (Prompt 44 Section 7). A throwing adapter must still not be invoked. Generating on the sign screen would change the thing being signed.
3. Consent gating per component class stays as `clinical/engine/ai_runtime.mjs` `COMPONENT_SPEC`:
   - Field writing AI-01, AI-02, AI-03, AI-06: Consent A.
   - Advisory AI-05, AI-08: Consent B.
   - AI-04: deterministic, no model, consent none.
   - AI-07: advisory, consent none, still a model purpose when a provider exists; the stub is still the only provider.
4. Prompt 44 Canada and no-train stops remain until evidence is recorded. `clinical/engine/ai_stub_provider.mjs` still refuses a networked provider (`AI-PROVIDER-UNVERIFIED`). `deploy/ai_boundaries.test.mjs` criterion 10 stays UNVERIFIED.
5. No live provider is invented. The in-process stub remains the only allowed provider until both prerequisites are recorded.
6. Consent language, legal pages, pricing, schema live apply, `package.json`, and email templates stay human-gated. Zeus surfaces those; Gary decides. 45a does not edit them.
7. Schema 021 and 022 exist on main and remain HELD (Prompt 45 human gate). 45a does not apply them and does not widen Prompt 45 to Ontario or BC packs.
8. Proposed occupational data never seeds without line-by-line sign-off. This GO instruction does not seed, import, or replace `clinical/db/occupational_synth.data.mjs`.

## 8. 45a scaffolding (thin, no network)

Shipped so the fail-closed rules are executable in CI. Not a provider.

- `clinical/engine/bedrock_canada_guard.mjs`: pure functions. Assert Region `ca-central-1`. Reject named CRIS IDs and prefix classes. Fail closed on empty, missing, or UNKNOWN Region or profile. No AWS SDK. No network.
- `clinical/engine/bedrock_inference_init.mjs`: startup assertion stub. Refuses to initialize until Region and no-train evidence flags are present and not `UNVERIFIED`. On success returns `ready: false` ("evidence recorded, client not constructed"). Live inference stays STOPPED.
- `deploy/bedrock_canada_guard.test.mjs`: CI. Proves fail-closed and proves a recorded in-region path does not construct a network client.

Default flag values are `UNVERIFIED`. Do not set them in committed files. Do not print secrets.

## 9. Gary send / approve box

This box is the GO. Checking it approves the instruction, not a live cutover.

- [ ] I have read Sections 1 through 7.
- [ ] I approve regional or in-region `ca-central-1` only.
- [ ] I forbid every CRIS profile named in Section 3, every `us.` `eu.` `apac.` `global.` `jp.` `au.` prefix, and every application inference profile whose destinations leave Canada.
- [ ] I will record Prerequisite 1 evidence: invocation configuration plus a startup assertion on the resolved Region, before any later mission may construct a client.
- [ ] I will record Prerequisite 2 evidence: the 5.1 clause, the 5.2 Model Deployment Account language, the 5.3 `none` sentence, sources, and retrieval date. I will STOP if a chosen model lacks the no-train clause.
- [ ] I understand this GO is not live enablement. Production submission stays disabled. Review and sign stays inert. The stub stays the only provider until both prerequisites are recorded.
- [ ] I understand consent language, legal pages, pricing, schema live apply, `package.json`, and email templates remain human-gated.

Signed (Gary): ________________________  Date: __________

## 10. Holds this instruction surfaces

- Live Bedrock inference: STOPPED. Prerequisites 1 and 2 UNVERIFIED until Gary records them.
- Prompt 44 criterion 10: UNVERIFIED.
- Schema 021 / 022: HELD. Do not apply. Do not widen to Ontario or BC.
- Montreal clinical project: does not exist in this 45a run. See `CONTINUUM_45A_MONTREAL_PROJECT_RUNBOOK.md`.
- Proposed occupational frame: never seeds without line-by-line sign-off. See `PROPOSED_OCCUPATIONAL_DATASET_V1.md`.
- `package.json` and email templates: locked.
