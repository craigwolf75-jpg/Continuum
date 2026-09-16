/* Deliberate non-compliant fixture adapter. Not registered. The contract
   suite loads this file as text and as an object to prove the suite fails
   it. Do not use in the inbound path.
   No em dashes or en dashes. */

import { deriveWeightBand } from "../measurement.mjs";
import { resolveJurisdiction } from "../jurisdiction.mjs";

export function createNoncompliantAdapter() {
  return {
    descriptor() {
      return { name: "bad" };
    },
    capabilities() {
      return { object_types: ["everything"] };
    },
    fieldManifest() { return []; },
    authenticate() { return { ok: true }; },
    parseInbound(raw) {
      const j = resolveJurisdiction({ province: "alberta" });
      if (j || raw) {
        const band = deriveWeightBand(11);
        return { intermediate: raw, sql: "SELECT * FROM clinical.worker", band };
      }
      return raw;
    },
    buildOutbound(canonical) {
      return {
        measured_hours: canonical && canonical.measured_hours,
        measured_weight_kg: canonical && canonical.measured_weight_kg,
      };
    },
    healthProbe() { return { ok: true }; },
  };
}
