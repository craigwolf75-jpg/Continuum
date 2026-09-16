/* Prompt 47 Part 6 and E1: organisation to region to location.

   E1 already landed at tenancy.* (platform/db/0002_tenancy.sql) and
   clinical.clinic.location_id (0010). This module is the resolver, not a second
   hierarchy. A tenant without all three levels fails named. Jurisdiction is
   never silently defaulted. No em dashes or en dashes anywhere. */

import { namedError, requireStore, readLayer } from "./clinic_ops_util.mjs";

const norm = (v) => String(v === null || v === undefined ? "" : v).trim();

function listOf(store, key) {
  if (!store) return [];
  if (Array.isArray(store[key])) return store[key];
  if (store.cache && Array.isArray(store.cache[key])) return store.cache[key];
  return [];
}

export function ensureSingleSiteHierarchy(input, store) {
  requireStore(store, "HIERARCHY-STORE-MISSING", "A hierarchy store is required. Never default.");
  const src = input || {};
  const jurisdiction = norm(src.jurisdiction_code);
  if (!jurisdiction) {
    throw namedError("JURISDICTION-MISSING", "A single-site hierarchy requires an explicit jurisdiction_code. Never default.");
  }
  const orgId = src.organisation_id || src.id || store.nextId && store.nextId("organisation");
  const regionId = src.region_id || (store.nextId && store.nextId("region"));
  const locationId = src.location_id || (store.nextId && store.nextId("location"));
  if (!orgId || !regionId || !locationId) {
    throw namedError("E1-IDS-MISSING", "ensureSingleSiteHierarchy needs organisation, region, and location ids (or a store.nextId).");
  }
  const organisation = {
    id: orgId,
    legal_name: src.legal_name || src.name || "Single site organisation",
    display_name: src.display_name || src.legal_name || src.name || "Single site organisation",
    jurisdiction_code: jurisdiction,
    status: src.status || "onboarding",
  };
  const region = {
    id: regionId,
    organisation_id: orgId,
    name: src.region_name || "Default region",
    status: "active",
  };
  const location = {
    id: locationId,
    organisation_id: orgId,
    region_id: regionId,
    name: src.location_name || src.legal_name || "Default location",
    jurisdiction_code: jurisdiction,
    timezone: src.timezone || "America/Edmonton",
    status: "active",
  };
  store.organisations = store.organisations || [];
  store.regions = store.regions || [];
  store.locations = store.locations || [];
  store.organisations.push(organisation);
  store.regions.push(region);
  store.locations.push(location);
  return { organisation, region, location };
}

export function resolveLocationParents(locationId, store) {
  requireStore(store, "HIERARCHY-STORE-MISSING", "A hierarchy store is required. Never default.");
  const id = norm(locationId);
  if (!id) {
    throw namedError("LOCATION-MISSING", "resolveLocationParents requires a location_id. Never default.");
  }
  const found = readLayer(
    store,
    (s) => (s.locations || []).find((l) => l.id === id),
    (s) => s.cache && (s.cache.locations || []).find((l) => l.id === id),
    undefined,
    "LOCATION-UNKNOWN",
    "Location " + id + " is not in the live or cached store."
  );
  const location = found.value;
  const regions = listOf(store, "regions");
  const orgs = listOf(store, "organisations");
  const region = regions.find((r) => r.id === location.region_id);
  const organisation = orgs.find((o) => o.id === location.organisation_id);
  if (!region) {
    throw namedError("E1-INCOMPLETE", "Location " + id + " has no region. E1 requires organisation, region, and location.", { missing: "region" });
  }
  if (!organisation) {
    throw namedError("E1-INCOMPLETE", "Location " + id + " has no organisation. E1 requires organisation, region, and location.", { missing: "organisation" });
  }
  return { location, region, organisation, layer: found.layer };
}

export function assertE1Complete(organisationId, store) {
  requireStore(store, "HIERARCHY-STORE-MISSING", "A hierarchy store is required. Never default.");
  const id = norm(organisationId);
  if (!id) {
    throw namedError("ORGANISATION-MISSING", "assertE1Complete requires an organisation_id. Never default.");
  }
  const org = readLayer(
    store,
    (s) => (s.organisations || []).find((o) => o.id === id),
    (s) => s.cache && (s.cache.organisations || []).find((o) => o.id === id),
    undefined,
    "E1-INCOMPLETE",
    "Organisation " + id + " is missing. E1 requires organisation, region, and location."
  );
  const regions = listOf(store, "regions").filter((r) => r.organisation_id === id);
  const locations = listOf(store, "locations").filter((l) => l.organisation_id === id);
  const missing = [];
  if (!org.value) missing.push("organisation");
  if (regions.length === 0) missing.push("region");
  if (locations.length === 0) missing.push("location");
  if (missing.length) {
    throw namedError("E1-INCOMPLETE", "Tenant " + id + " is missing " + missing.join(", ") + ". E1 requires all three levels.", { missing });
  }
  for (const loc of locations) {
    if (!regions.some((r) => r.id === loc.region_id)) {
      throw namedError("E1-INCOMPLETE", "Location " + loc.id + " is not linked to a region of this organisation.", { missing: ["region-link"] });
    }
    if (!norm(loc.jurisdiction_code)) {
      throw namedError("JURISDICTION-MISSING", "Location " + loc.id + " has no jurisdiction_code. Never default.");
    }
  }
  return { ok: true, organisation: org.value, regions, locations };
}
