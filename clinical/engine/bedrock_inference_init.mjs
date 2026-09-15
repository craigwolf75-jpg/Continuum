/* Continuum Prompt 45a: Bedrock startup assertion stub.

   Refuses to initialize an inference client until Region and no-train evidence
   flags are present and not UNVERIFIED. Flags are documented as UNVERIFIED by
   default. On success this module still does not open a socket or invent a
   vendor client. It returns ready: false, documented as "evidence recorded,
   client not constructed". Live inference stays STOPPED.

   No AWS SDK. No network. No production submission enablement. No dashes. */

import {
  REQUIRED_REGION,
  assertCanadaRegion,
  assertInRegionProfile,
} from "./bedrock_canada_guard.mjs";

export const ENV_REGION = "CONTINUUM_BEDROCK_REGION";
export const ENV_NO_TRAIN_EVIDENCE = "CONTINUUM_BEDROCK_NO_TRAIN_EVIDENCE";
export const ENV_NO_TRAIN_SOURCE = "CONTINUUM_BEDROCK_NO_TRAIN_SOURCE";
export const ENV_NO_TRAIN_RETRIEVED_AT = "CONTINUUM_BEDROCK_NO_TRAIN_RETRIEVED_AT";

export const UNVERIFIED = "UNVERIFIED";

const FLAG_KEYS = [ENV_NO_TRAIN_EVIDENCE, ENV_NO_TRAIN_SOURCE, ENV_NO_TRAIN_RETRIEVED_AT];

function readEnv(env) {
  if (env && typeof env === "object") return env;
  return typeof process !== "undefined" && process.env ? process.env : {};
}

function norm(v) {
  return String(v === null || v === undefined ? "" : v).trim();
}

function isUnrecorded(v) {
  const s = norm(v);
  if (s === "") return true;
  const u = s.toUpperCase();
  return u === UNVERIFIED || u === "UNKNOWN" || s === "0" || u === "FALSE";
}

function throwCoded(code, message) {
  const e = new Error(message);
  e.code = code;
  throw e;
}

export function assertNoTrainEvidence(env) {
  const e = readEnv(env);
  for (const key of FLAG_KEYS) {
    if (isUnrecorded(e[key])) {
      throwCoded(
        "BEDROCK-NO-TRAIN-UNVERIFIED",
        "Bedrock no-train evidence flag " + key + " is missing, UNVERIFIED, UNKNOWN, or empty. Live inference stays STOPPED (Prompt 44 Section 1, Prompt 45a Prerequisite 2).",
      );
    }
  }
  return {
    evidence: norm(e[ENV_NO_TRAIN_EVIDENCE]),
    source: norm(e[ENV_NO_TRAIN_SOURCE]),
    retrieved_at: norm(e[ENV_NO_TRAIN_RETRIEVED_AT]),
  };
}

export function assertInferenceReady(env, opts = {}) {
  const e = readEnv(env);
  const region = assertCanadaRegion(e[ENV_REGION]);
  const noTrain = assertNoTrainEvidence(e);
  if (Object.prototype.hasOwnProperty.call(opts, "profileId") || Object.prototype.hasOwnProperty.call(opts, "modelId")) {
    const id = opts.profileId !== undefined ? opts.profileId : opts.modelId;
    assertInRegionProfile(id);
  }
  return {
    ready: false,
    region,
    no_train: noTrain,
    message: "evidence recorded, client not constructed",
  };
}

export function createInferenceClient(env, opts = {}) {
  const asserted = assertInferenceReady(env, opts);
  return {
    ready: false,
    constructed: false,
    network: false,
    kind: "evidence-recorded-client-not-constructed",
    region: asserted.region || REQUIRED_REGION,
    no_train: asserted.no_train,
    message: "evidence recorded, client not constructed",
    invoke() {
      const err = new Error("Live Bedrock inference is STOPPED. Evidence may be recorded; no vendor client is constructed (Prompt 45a).");
      err.code = "BEDROCK-INFERENCE-NOT-READY";
      throw err;
    },
  };
}
