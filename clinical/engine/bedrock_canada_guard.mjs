/* Continuum Prompt 45a: Canada Bedrock residency guard.

   Pure functions. Assert the resolved Region is exactly ca-central-1. Reject known
   Cross-Region Inference (CRIS) profile names and prefix classes (us. eu. apac.
   global. plus jp. and au.). Fail closed on empty, missing, or UNKNOWN Region and
   on forbidden or empty profiles. No AWS SDK. No network. No provider client.
   No production submission enablement. No dashes anywhere. */

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

export const REQUIRED_REGION = "ca-central-1";
export const BEDROCK_CONTROL_PLANE_ENDPOINT = "https://bedrock.ca-central-1.amazonaws.com";
export const BEDROCK_RUNTIME_ENDPOINT = "https://bedrock-runtime.ca-central-1.amazonaws.com";

export const FORBIDDEN_CRIS_PROFILE_IDS = Object.freeze([
  "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
  "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
  "us.anthropic.claude-haiku-4-5-20251001-v1:0",
  "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  "us.anthropic.claude-3-haiku-20240307-v1:0",
  "us.anthropic.claude-3-sonnet-20240229-v1:0",
  "us.anthropic.claude-3-5-sonnet-20240620-v1:0",
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
  "global.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "us.amazon.nova-lite-v1:0",
  "us.amazon.nova-micro-v1:0",
  "us.amazon.nova-pro-v1:0",
  "global.amazon.nova-lite-v1:0",
  "us.meta.llama3-8b-instruct-v1:0",
  "us.meta.llama3-70b-instruct-v1:0",
]);

export const FORBIDDEN_PREFIX_CLASSES = Object.freeze([
  "us.", "eu.", "apac.", "global.", "jp.", "au.",
]);

function isBlankOrUnknown(v) {
  const s = norm(v);
  if (s === "") return true;
  const u = s.toUpperCase();
  return u === "UNKNOWN" || u === "UNVERIFIED" || s === "0";
}

function throwCoded(code, message) {
  const e = new Error(message);
  e.code = code;
  throw e;
}

export function profileToken(profileId) {
  const s = norm(profileId);
  if (!s) return "";
  const parts = s.split("/");
  return parts[parts.length - 1];
}

export function arnRegion(profileId) {
  const s = norm(profileId);
  if (!s.toLowerCase().startsWith("arn:")) return null;
  const parts = s.split(":");
  return parts.length > 3 ? parts[3] : "";
}

export function assertCanadaRegion(region) {
  if (isBlankOrUnknown(region)) {
    throwCoded(
      "BEDROCK-REGION-MISSING",
      "Bedrock Region is missing, empty, UNKNOWN, or UNVERIFIED. Fail closed. Required Region is exactly ca-central-1.",
    );
  }
  if (norm(region) !== REQUIRED_REGION) {
    throwCoded(
      "BEDROCK-REGION-FORBIDDEN",
      "Bedrock Region " + JSON.stringify(norm(region)) + " is not ca-central-1. Regional or in-region Canada Central only.",
    );
  }
  return REQUIRED_REGION;
}

export function assertInRegionProfile(profileId) {
  if (isBlankOrUnknown(profileId)) {
    throwCoded(
      "BEDROCK-PROFILE-MISSING",
      "Bedrock profile is missing, empty, UNKNOWN, or UNVERIFIED. Fail closed. A CRIS or blank profile cannot default to in-region.",
    );
  }
  const raw = norm(profileId);
  const token = profileToken(raw);
  const regionFromArn = arnRegion(raw);

  if (regionFromArn !== null && regionFromArn !== REQUIRED_REGION) {
    throwCoded(
      "BEDROCK-PROFILE-FORBIDDEN",
      "Bedrock ARN Region " + JSON.stringify(regionFromArn) + " is not ca-central-1. Cross-Region inference is forbidden.",
    );
  }

  if (/application-inference-profile/i.test(raw)) {
    throwCoded(
      "BEDROCK-PROFILE-FORBIDDEN",
      "Application inference profiles are forbidden until destination Regions are proven Canada only. Fail closed.",
    );
  }

  const lowerToken = token.toLowerCase();
  for (const prefix of FORBIDDEN_PREFIX_CLASSES) {
    if (lowerToken.startsWith(prefix)) {
      throwCoded(
        "BEDROCK-PROFILE-FORBIDDEN",
        "Bedrock profile " + JSON.stringify(token) + " uses forbidden CRIS prefix " + prefix + ". Cross-Region inference is forbidden.",
      );
    }
  }

  const named = FORBIDDEN_CRIS_PROFILE_IDS.some((id) => id === token || raw.endsWith("/" + id));
  if (named) {
    throwCoded(
      "BEDROCK-PROFILE-FORBIDDEN",
      "Bedrock profile " + JSON.stringify(token) + " is a named CRIS profile. Cross-Region inference is forbidden.",
    );
  }

  return token;
}

export function assertBedrockGuard({ region, profileId } = {}) {
  const resolved = assertCanadaRegion(region);
  const token = assertInRegionProfile(profileId);
  return {
    ok: true,
    region: resolved,
    profileId: token,
    control_plane: BEDROCK_CONTROL_PLANE_ENDPOINT,
    runtime: BEDROCK_RUNTIME_ENDPOINT,
    network: false,
  };
}
