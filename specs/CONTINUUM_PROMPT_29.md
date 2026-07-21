# CONTINUUM PROMPT 29: The Board Integration Matrix, Wired Into Every Section

**Source:** the Canadian Compensation Board Integration Matrix v1.0, researched from each board's own documentation on July 20, 2026: all twelve boards checked for machine submission and programmatic retrieval, with three integrable submission channels found (WSIB Ontario B2B XML, WorkSafeBC ISSv3, WCB Alberta C040 file import), nine portal-only boards, and a uniform finding that no Canadian board publishes a claim-data retrieval API.
**Deliverable:** the matrix adopted into the canon and wired into every section of the built system that speaks about board integration: the board portal, the admin portal, the HSE portal, and the Garda demo runner, all patched in place, suite-tested, with the six-portal canon regression green.
**Date:** July 20, 2026

## 1. The matrix, adopted with its two Addendum A changes

The document's discipline matches the house standard: findings graded (confirmed from board technical documentation versus not found in official documentation), the coverage note stating nothing was silently dropped, an honest-limits section, and a quarterly re-verification cadence. Its two build implications are adopted as written. First, the Ontario upgrade: the WSIB B2B Form 7 service means the pilot board's adapter is specified as a true machine-to-machine XML integration with a returned confirmation number, not the assemble-a-draft portal hand-off previously assumed, while the human-authorizes-the-send gate stays exactly where it was: the human clicks file, the adapter transmits. Second, the retrieval reality reroutes the rebate closed loop: no board API exists to feed it, so actuals enter through the system of record (the better source under the data-ownership contract anyway) or a customer-supplied portal export, and every rebate figure stays a labeled estimate until such an input arrives, which is W8 applied to money that has not landed. The certify-three, portal-assist-nine build posture is adopted: engineering effort goes only where boards expose channels.

## 2. What was wired, artifact by artifact

Board portal. A boardChannel helper maps every board to its channel and its one-line mechanics, test-verified for all four cases (Ontario B2B, Alberta C040, BC ISSv3, and the portal-assist fallback). Every claim drawer now carries a Submission channel row derived from its board, so an Ontario claim reads B2B XML web service with the schema mechanics on hover while an Alberta claim reads C040 file import. Settings gained a Board integration channels card stating the whole matrix honestly: the three machine channels with their mechanics, the nine portal-assist boards with Yukon's paper reality noted, and the retrieval finding as its own row: none published, actuals via system of record or customer export, rebate figures labeled estimates until then.

Admin portal. Every tenant card's board line now carries its channel in parentheses (GardaWorld reads WSIB Ontario, B2B XML, integrated; the Alberta tenants read C040 file import), and platform Settings gained a Board integrations row: three machine channels plus nine portal assist, the no-retrieval-API finding, the actuals rule, and the quarterly re-verification cadence, all in one status line beside the SMS rule and the CI serialization gate.

HSE portal. The Claims section's Form 7 boundary footer grew the upgrade: Ontario filings can transmit machine to machine on the WSIB B2B channel with a returned confirmation number, human authorizing every send, portal assist where no channel exists.

Demo runner. Scene 12's presenter note gained the sentence that turns a compliance caveat into a selling line: on the board side the channel is real, WSIB Ontario offers true B2B XML submission with a returned confirmation number, and Continuum is the software that fills that channel.

## 3. What deliberately did not change

The board portal's KPI reconciliation (19 open, 7 to acknowledge) is untouched and re-asserted, the Acknowledge workflow is unchanged because the matrix describes how filings travel, not how boards respond, and the one-way scope law holds: this seat still receives submissions rather than reading worker telemetry, and the retrieval finding strengthens that posture rather than weakening it, since the boards themselves offer nothing to pull.

## 4. Verification summary

Channel helper tested across all four mappings; the settings card, tenant-card channels, and admin status row asserted in rendered output; the retrieval and portal-assist language asserted present; board KPI and sort regressions green; admin canon KPIs, the crtw guard, and Olympus green after patching; the six-portal canon suite green end to end; dash audit clean on all four patched artifacts and this companion. The matrix's own caveat is carried into both settings surfaces: re-verify quarterly, because board digital services change.
