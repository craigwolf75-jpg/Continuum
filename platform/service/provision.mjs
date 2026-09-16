/* Prompt 50 Section 3.6. One idempotent provision of organisation, region,
   location, default config, initial role, audit and event. No em dashes. */

import { namedError } from "./errors.mjs";

export function provisionTenant(input, store) {
  const src = input || {};
  if (!store || typeof store !== "object") {
    throw namedError("PROVISION-STORE-MISSING", "A provision store is required.");
  }
  const required = [
    "organisation_id", "region_id", "location_id",
    "legal_name", "display_name", "jurisdiction_code", "timezone", "actor_id",
  ];
  for (const key of required) {
    if (!src[key]) {
      throw namedError("PROVISION-ARGS-MISSING", "Provisioning needs " + key + ". Supply it and retry.");
    }
  }
  store.organisations = store.organisations || [];
  store.regions = store.regions || [];
  store.locations = store.locations || [];
  store.grants = store.grants || [];
  store.configValues = store.configValues || [];
  store.audit = store.audit || [];
  store.events = store.events || [];

  const existing = store.organisations.find((o) => o.id === src.organisation_id);
  if (existing) {
    return { organisation: existing, idempotent: true };
  }

  if (src.fail_step) {
    throw namedError("PROVISION-STEP-FAILED", "Provisioning stopped so nothing was kept.");
  }

  const organisation = {
    id: src.organisation_id,
    legal_name: src.legal_name,
    display_name: src.display_name,
    jurisdiction_code: src.jurisdiction_code,
    status: "onboarding",
  };
  const region = {
    id: src.region_id,
    organisation_id: src.organisation_id,
    name: "Default region",
    status: "active",
  };
  const location = {
    id: src.location_id,
    organisation_id: src.organisation_id,
    region_id: src.region_id,
    name: src.legal_name,
    jurisdiction_code: src.jurisdiction_code,
    timezone: src.timezone,
    status: "active",
  };
  store.organisations.push(organisation);
  store.regions.push(region);
  store.locations.push(location);
  store.configValues.push({
    key: "location.jurisdiction_code",
    scope_type: "location",
    scope_id: src.location_id,
    value: src.jurisdiction_code,
  });
  store.grants.push({
    principal_id: src.actor_id,
    role_key: "onboarding",
    scope_type: "organisation",
    scope_id: src.organisation_id,
  });
  store.audit.push({ action: "create", entity_type: "tenancy_organisation", outcome: "permitted" });
  store.events.push({ event_type: "tenant.provisioned", event_class: "domain" });
  return { organisation, region, location, idempotent: false };
}

export function rollbackStore(before) {
  return JSON.parse(JSON.stringify(before || {
    organisations: [], regions: [], locations: [], grants: [], configValues: [], audit: [], events: [],
  }));
}
