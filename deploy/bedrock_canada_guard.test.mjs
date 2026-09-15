/* Continuum Prompt 45a: CI proof that the Bedrock Canada guard fails closed
   and that recorded in-region evidence still does not construct a network
   client. CI runs deploy/*.test.mjs. No dashes anywhere. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  REQUIRED_REGION,
  FORBIDDEN_CRIS_PROFILE_IDS,
  FORBIDDEN_PREFIX_CLASSES,
  assertCanadaRegion,
  assertInRegionProfile,
  assertBedrockGuard,
} from "../clinical/engine/bedrock_canada_guard.mjs";
import {
  createInferenceClient,
  assertInferenceReady,
  ENV_REGION,
  ENV_NO_TRAIN_EVIDENCE,
  ENV_NO_TRAIN_SOURCE,
  ENV_NO_TRAIN_RETRIEVED_AT,
  UNVERIFIED,
} from "../clinical/engine/bedrock_inference_init.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };
const threw = (fn) => { try { fn(); return null; } catch (e) { return e.code || "threw"; } };

const here = dirname(fileURLToPath(import.meta.url));
const guardSrc = readFileSync(join(here, "../clinical/engine/bedrock_canada_guard.mjs"), "utf8");
const initSrc = readFileSync(join(here, "../clinical/engine/bedrock_inference_init.mjs"), "utf8");

const recordedEnv = {
  [ENV_REGION]: REQUIRED_REGION,
  [ENV_NO_TRAIN_EVIDENCE]: "recorded",
  [ENV_NO_TRAIN_SOURCE]: "https://aws.amazon.com/bedrock/security-privacy-responsible-ai/",
  [ENV_NO_TRAIN_RETRIEVED_AT]: "2026-09-15",
};

const inRegionClaude = "anthropic.claude-3-haiku-20240307-v1:0";
const inRegionNova = "amazon.nova-lite-v1:0";
const inRegionLlama = "meta.llama3-8b-instruct-v1:0";

ok("required Region is exactly ca-central-1", REQUIRED_REGION === "ca-central-1");
const importsNetwork = (src) => /from\s+["']@aws-sdk|from\s+["'](?:net|tls|http|https|dns|undici)["']|require\(\s*["'](?:net|tls|http|https|@aws-sdk)|createConnection/.test(src);
ok("guard source has no AWS SDK and no network import", importsNetwork(guardSrc) === false);
ok("init source has no AWS SDK and no network import", importsNetwork(initSrc) === false);

ok("wrong Region us-east-1 is forbidden", threw(() => assertCanadaRegion("us-east-1")) === "BEDROCK-REGION-FORBIDDEN");
ok("wrong Region ca-west-1 is forbidden", threw(() => assertCanadaRegion("ca-west-1")) === "BEDROCK-REGION-FORBIDDEN");
ok("missing Region fails closed", threw(() => assertCanadaRegion("")) === "BEDROCK-REGION-MISSING");
ok("UNKNOWN Region fails closed", threw(() => assertCanadaRegion("UNKNOWN")) === "BEDROCK-REGION-MISSING");
ok("UNVERIFIED Region fails closed", threw(() => assertCanadaRegion("UNVERIFIED")) === "BEDROCK-REGION-MISSING");
ok("0 is not a Region", threw(() => assertCanadaRegion("0")) === "BEDROCK-REGION-MISSING");
ok("null Region fails closed", threw(() => assertCanadaRegion(null)) === "BEDROCK-REGION-MISSING");
ok("exact ca-central-1 passes the Region assert", assertCanadaRegion("ca-central-1") === "ca-central-1");

ok("empty profile fails closed", threw(() => assertInRegionProfile("")) === "BEDROCK-PROFILE-MISSING");
ok("UNKNOWN profile fails closed", threw(() => assertInRegionProfile("UNKNOWN")) === "BEDROCK-PROFILE-MISSING");
ok("missing profile fails closed", threw(() => assertInRegionProfile(undefined)) === "BEDROCK-PROFILE-MISSING");

ok(
  "named CRIS Sonnet US profile is forbidden",
  threw(() => assertInRegionProfile("us.anthropic.claude-sonnet-4-5-20250929-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "named CRIS Sonnet Global profile is forbidden",
  threw(() => assertInRegionProfile("global.anthropic.claude-sonnet-4-5-20250929-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "named CRIS Haiku US profile is forbidden",
  threw(() => assertInRegionProfile("us.anthropic.claude-haiku-4-5-20251001-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "named CRIS Haiku Global profile is forbidden",
  threw(() => assertInRegionProfile("global.anthropic.claude-haiku-4-5-20251001-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);

ok(
  "every frozen named CRIS id is forbidden",
  FORBIDDEN_CRIS_PROFILE_IDS.every((id) => threw(() => assertInRegionProfile(id)) === "BEDROCK-PROFILE-FORBIDDEN"),
);

ok(
  "prefix class us. is forbidden on a new name",
  threw(() => assertInRegionProfile("us.anthropic.claude-something-new-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "prefix class eu. is forbidden",
  threw(() => assertInRegionProfile("eu.anthropic.claude-sonnet-4-5-20250929-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "prefix class apac. is forbidden",
  threw(() => assertInRegionProfile("apac.anthropic.claude-sonnet-4-5-20250929-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "prefix class global. is forbidden on Nova",
  threw(() => assertInRegionProfile("global.amazon.nova-lite-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "required prefix classes are us. eu. apac. global.",
  ["us.", "eu.", "apac.", "global."].every((p) => FORBIDDEN_PREFIX_CLASSES.includes(p)),
);

ok(
  "CRIS ARN in ca-central-1 is still forbidden",
  threw(() => assertInRegionProfile("arn:aws:bedrock:ca-central-1::inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0")) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "in-region model ARN whose Region is us-east-1 is forbidden",
  threw(() => assertInRegionProfile("arn:aws:bedrock:us-east-1::foundation-model/" + inRegionClaude)) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "application inference profile fails closed",
  threw(() => assertInRegionProfile("arn:aws:bedrock:ca-central-1:123456789012:application-inference-profile/abc")) === "BEDROCK-PROFILE-FORBIDDEN",
);

ok(
  "in-region Claude id passes the profile guard",
  assertInRegionProfile(inRegionClaude) === inRegionClaude,
);
ok(
  "in-region Nova id passes the profile guard",
  assertInRegionProfile(inRegionNova) === inRegionNova,
);
ok(
  "in-region Llama id passes the profile guard",
  assertInRegionProfile(inRegionLlama) === inRegionLlama,
);

ok(
  "combined guard accepts ca-central-1 plus in-region Claude and reports no network",
  (() => {
    const r = assertBedrockGuard({ region: "ca-central-1", profileId: inRegionClaude });
    return r.ok === true && r.network === false && r.region === "ca-central-1";
  })(),
);

ok(
  "missing CONTINUUM_BEDROCK_REGION fails init",
  threw(() => assertInferenceReady({
    [ENV_NO_TRAIN_EVIDENCE]: "recorded",
    [ENV_NO_TRAIN_SOURCE]: "https://example.invalid/source",
    [ENV_NO_TRAIN_RETRIEVED_AT]: "2026-09-15",
  })) === "BEDROCK-REGION-MISSING",
);
ok(
  "UNVERIFIED no-train evidence fails init",
  threw(() => assertInferenceReady({
    [ENV_REGION]: "ca-central-1",
    [ENV_NO_TRAIN_EVIDENCE]: UNVERIFIED,
    [ENV_NO_TRAIN_SOURCE]: "https://example.invalid/source",
    [ENV_NO_TRAIN_RETRIEVED_AT]: "2026-09-15",
  })) === "BEDROCK-NO-TRAIN-UNVERIFIED",
);
ok(
  "missing no-train source fails init",
  threw(() => assertInferenceReady({
    [ENV_REGION]: "ca-central-1",
    [ENV_NO_TRAIN_EVIDENCE]: "recorded",
    [ENV_NO_TRAIN_RETRIEVED_AT]: "2026-09-15",
  })) === "BEDROCK-NO-TRAIN-UNVERIFIED",
);
ok(
  "UNKNOWN retrieved-at fails init",
  threw(() => assertInferenceReady({
    [ENV_REGION]: "ca-central-1",
    [ENV_NO_TRAIN_EVIDENCE]: "recorded",
    [ENV_NO_TRAIN_SOURCE]: "https://example.invalid/source",
    [ENV_NO_TRAIN_RETRIEVED_AT]: "UNKNOWN",
  })) === "BEDROCK-NO-TRAIN-UNVERIFIED",
);
ok(
  "0 is not no-train evidence",
  threw(() => assertInferenceReady({
    [ENV_REGION]: "ca-central-1",
    [ENV_NO_TRAIN_EVIDENCE]: "0",
    [ENV_NO_TRAIN_SOURCE]: "https://example.invalid/source",
    [ENV_NO_TRAIN_RETRIEVED_AT]: "2026-09-15",
  })) === "BEDROCK-NO-TRAIN-UNVERIFIED",
);
ok(
  "wrong Region with recorded evidence still fails",
  threw(() => assertInferenceReady({
    ...recordedEnv,
    [ENV_REGION]: "us-west-2",
  })) === "BEDROCK-REGION-FORBIDDEN",
);
ok(
  "recorded evidence plus forbidden CRIS profile fails",
  threw(() => assertInferenceReady(recordedEnv, { profileId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0" })) === "BEDROCK-PROFILE-FORBIDDEN",
);
ok(
  "recorded evidence plus empty profile fails",
  threw(() => assertInferenceReady(recordedEnv, { profileId: "" })) === "BEDROCK-PROFILE-MISSING",
);

ok(
  "ca-central-1 plus in-region model plus recorded flags pass without a network client",
  (() => {
    const client = createInferenceClient(recordedEnv, { profileId: inRegionClaude });
    const invokeCode = threw(() => client.invoke());
    return client.ready === false
      && client.constructed === false
      && client.network === false
      && client.kind === "evidence-recorded-client-not-constructed"
      && client.message === "evidence recorded, client not constructed"
      && client.region === "ca-central-1"
      && invokeCode === "BEDROCK-INFERENCE-NOT-READY";
  })(),
);

ok(
  "Nova and Llama in-region ids also pass init without constructing a client",
  (() => {
    const nova = createInferenceClient(recordedEnv, { modelId: inRegionNova });
    const llama = createInferenceClient(recordedEnv, { profileId: inRegionLlama });
    return nova.network === false && llama.network === false && nova.ready === false && llama.ready === false;
  })(),
);

console.log("\ndeploy bedrock canada guard suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
