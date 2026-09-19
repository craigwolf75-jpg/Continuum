# Prompt 69. Report source record

REGISTERED. Reading lane. Draft PR.
Source record only. Not a release.
Not a product PASS.

Write date: 19 September 2026.
Registration date in the stream:
21 August 2026.

Craig named BUILD Prompt 69:
CANADIAN PHYSICIAN SYSTEMS
RESEARCH. Registered unified
Prompt 69 on 21 August 2026.
Research report dated
21 August 2026.

Named report md5
`08ebb4545b2cbd900fb2a0a87f730a95`.
Supplied `.txt` md5
`ea361a919cbc9dd557e85161cf487b0d`.
Supplied `.docx` md5
`26506f88413db36c2a03e69ad3616ab7`.
Named report md5 versus this
wrapper: UNVERIFIED. Do not
invent a match.

Source arrived with zero em
or en dashes. No prompt
citations. Nothing was
normalized or translated.

This file is the FULL source
record, not a summary. The
research voice is kept. Do
not treat this text as a ship
order. Research claims remain
UNVERIFIED for product use
until a dated re-check.

Tables that the upload dumped
after END OF PROMPT 69 are
the technology map, board
map, room-workflow, access
classification, scoring
weights, target scores, and
architecture options. They
are restored after the
verbatim narrative, using
only the exact cell values
from the upload. No cell was
invented.

Governing register files:

- REGISTER.md
- SECTION_00.md
- STOPS.md
- ACCEPTANCE.md

No em dashes or en dashes
anywhere.

---

WHERE THE CANADIAN PHYSICIAN ACTUALLY ENTERS THE DATA
Research report for Continuum. 21 August 2026.
This document is self contained. It carries the Continuum context it needs, so it can be handed to another reader, or another model, for a second opinion on the ranking and the architecture call without any of this session's history.

CONTEXT THIS REPORT ASSUMES
Continuum is a Canadian workplace injury recovery and return to work platform. Its clinician product captures a first report and follow up reports, records functional measurement, derives restrictions, and produces the board submission, the worker copy and the employer view from one act of measurement.
Four facts about Continuum's own position shape every recommendation below.
Only Alberta has a built form pack. Saskatchewan and Ontario exist as architecture with no form definitions, code lists, rules, fee schedule or holiday table.
Its practitioners are not in Alberta. Work is running in Ontario, with Saskatchewan expected.
Its own build specification already forbids one of the six architectures under consideration. Section 13.4 of the Continuum Developer Build Package says: do not architect around SMART on FHIR in Alberta, because the largest Alberta system publishes no third party interface at all.
It is a very small company. Any recommendation requiring a negotiated enterprise agreement with a telecommunications company is a recommendation to do nothing.

EXECUTIVE CONCLUSION
Answer first.
If Continuum wants to reach the largest practical share of Canadian physicians doing workplace injury care, four counterparties matter and everything else is noise.
1. The provincial boards themselves, and only three of them publish enough to build against. WorkSafeBC publishes a 133 page vendor record specification. WCB Alberta publishes a downloadable vendor accreditation package and names its twelve accredited vendors. WCB Saskatchewan publishes XML schemas, but for invoices only. Ontario, where Continuum's practitioners actually are, publishes nothing, because WSIB has outsourced its entire provider submission channel to TELUS Health.
2. Ocean, owned by WELL Health. The only genuine common layer above Canadian EMRs. Roughly 20,000 physicians and 3,800 clinics across four provinces, embedded inside PS Suite, Med Access, Accuro, OSCAR Pro, Juno and Profile at once. Public developer documentation, a public test sandbox, published pricing, and a self startable route to being reachable from inside the chart. There is nothing else like it in Canada.
3. QHR Accuro, owned by Loblaw. The best documented single vendor interface in the country, with a published OpenAPI specification and a sandbox. Already submits electronically to WCB Alberta and to WorkSafeBC, and is one of only two vendors Saskatchewan lists as batch capable.
4. TELUS Health, which is simultaneously the most valuable and the least available. It owns the largest community EMR in Ontario, four of Alberta's twelve accredited vendors, two of Quebec's six certified products, and the WSIB provider portal itself. PS Suite, Med Access and Wolf publish no interface at all.
The uncomfortable finding. The three parent companies above control roughly 92 per cent of Ontario's community EMR installed base, and one of them, WELL, owns both the only multi EMR layer and the second largest app channel. Any distribution strategy built on Canadian EMRs terminates at two or three counterparties.
The opening. Every incumbent EMR that does submit a workers compensation report models it as a billing artifact, not a clinical one. In Accuro you reach the Alberta form through Claim Details, Insurer, WCB. In the TELUS CHR the WCB button only appears once the payment issuer and billing provider are both set to Alberta WCB. Nobody in Canada has built the workplace injury encounter as a clinical workflow. That is the gap Continuum is standing in.

1. CANADIAN PHYSICIAN TECHNOLOGY MAP
The only real installed base data in Canada
OntarioMD publishes vendor reported physician and nurse practitioner counts for every certified EMR, updated monthly. It is the only public, product level, near census dataset in the country. Everything else is vendor marketing or nothing.
Figures below are the June 2026 counts published 29 July 2026. Source: https://www.ontariomd.ca/emr-certification/omd-certified-emrs-numbers/vendor-reported-numbers-physicians-and-nps
Caveat the publisher implies. These are vendor reported and not audited, they are Ontario only, and they mix family physicians, community specialists and nurse practitioners. They are not a family medicine figure.
Consolidated by parent
No other province publishes anything comparable. Provincial approval and certification lists tell you which products are permitted, not how many physicians use them. Do not let anyone convert the Ontario table into a national market share number. It cannot be done honestly from public sources.
The technology map

2. PROVINCIAL BOARD TECHNOLOGY MAP
Four conclusions from that table
No Canadian board publishes a claim status interface for health care providers. Every board is one way for clinical reports. The closest to two way is CNESST, which returns the official patient documents in the same transaction, and Saskatchewan, which publishes a structured return schema but for invoices only.
Five of thirteen jurisdictions have no structured electronic report ingest at all. Manitoba, Nova Scotia for the report, Yukon, the Northwest Territories and Nunavut, and New Brunswick. In those places the physician's report leaves the clinic as a fax or an email attachment.
Only three boards publish a specification you could build against without asking permission. British Columbia, Alberta, and Saskatchewan for invoices.
Four jurisdictions pay a documented premium for electronic submission. Ontario pays twenty dollars more for an electronic Form 8 and fifteen more for a Form 26. Saskatchewan pays a flat sixteen dollars and twenty five cents more. British Columbia pays a higher Teleplan tier than fax. Newfoundland states a premium without publishing the amount. This is boards paying physicians to stop faxing, which is the clearest possible signal that faxing is still the problem.

3. WHAT ACTUALLY HAPPENS IN THE ROOM
Reconstructed from vendor documentation, board documentation and provincial programme material.
Where the duplicate entry actually is, in the vendor's own words
TELUS PS Suite, Ontario, from the vendor's own help documentation:
"the WSIB eServices portal currently accepts the electronic submission of only Form 8. For all other forms, you must fill them in and then submit them by fax to WSIB, or enter the information directly in the WSIB eServices portal."
That is the largest EMR in Ontario documenting, on its own support site, that the Functional Abilities Form and the progress report require either a fax or a re-key into a separate portal.
And even Form 8, the one that does transmit, is not clean. The documented PS Suite workflow is: demographics populate, then print the form, then obtain a wet signature, then tick a box in the software confirming the worker signed the printed form, then transmit. The paper never leaves the process.
Nova Scotia generates the form inside the provincial EMR and then faxes it. Newfoundland's provincial EMR programme ships a template whose stated purpose is to print or eFax three copies. Quebec transmits in real time and then requires the physician to print two copies for the worker by statute.
Who does the keying
No board publishes a rule that the physician must key the form personally. What is published is who may complete and attest it. WSIB restricts the Functional Abilities Form to regulated health practitioners and the mental stress form to physicians and nurse practitioners.
The structural evidence points at clinic staff. Alberta issues clinics an "online administrator" role and clinic level myWCB accounts. Saskatchewan issues clinic numbers. Newfoundland states that "clinics must have a connect account." Canadian medical office assistant job postings name "preparation and electronic submission of WCB billings" as a duty.
This matters directly to Continuum, which has an open question, OQ-008, asking whether the practitioner or the office assistant completes the return to work section. The published evidence does not answer it, and I am not going to pretend it does. But every board that has built electronic access has built it at the clinic level, not the physician level, and the incumbent EMRs put the form behind the billing menu. Both facts lean towards the assistant.

4. IS THERE A LAYER ABOVE THE EMRs
Yes. There is exactly one, and it is Ocean.
Ocean was CognisantMD, acquired by WELL Health on 2 December 2021 for roughly 10.6 million dollars cash plus an earn out.
Scale. WELL reported in November 2025: four provinces, 1.7 million referrals a year, more than 20,000 physicians, more than 3,800 clinics. An independent Ontario market survey in March 2026 put Ocean at 8,165 Ontario physicians across 1,669 clinics and called it "Ontario's de facto interoperability platform."
Depth. Ocean embeds a toolbar inside the chart with bidirectional sync for PS Suite, Med Access, Accuro, OSCAR Pro, OSCAR Classic, Juno and Profile. That is TELUS, Loblaw and WELL products simultaneously. Lighter eReferral integration reaches Epic, Cerner, Meditech, Avaros, Cerebrum and EMR Advantage.
It is genuinely open, which almost nothing else in Canadian health technology is. Public developer documentation, a published FHIR eReferral implementation guide, a public test environment at test.cognisantmd.com you can create your own accounts on, and published pricing.
Provincial contracts. Ontario, where Ocean is the eReferral component of the provincial eServices programme. Nova Scotia, where eReferral has been mandatory since April 2024. British Columbia, through a 38.5 million dollar sole source award to the Provincial Health Services Authority announced 10 August 2023.
Three things a third party can actually do. Become a validated receiver listed in the Ocean Healthmap, so any Ocean connected EMR can send you a structured referral from inside the chart. Build a documented FHIR integration against the sandbox. Publish forms from your own Ocean site with answers writing back into the chart.
What Ocean is not. It is an application layer, not a general data pipe. There is no app store where you publish once and appear in every Ocean clinic. Its SMART on FHIR documentation has Ocean as the app launching out of an EHR, which is the opposite direction from what Continuum would want.
And it does not touch the boards. Ocean carries no workers compensation content.
Everything else, checked and dismissed
Canada Health Infoway is not a route. The ACCESS Gateway procurement is from February 2019 with no evidence of a usable service in 2026. The developer tools are standards artefacts, terminology services and registries, which reach no patient data. PrescribeIT is real and its specifications are genuinely public, but it is prescribing only.
SMART on FHIR in Canadian community EMRs is a roadmap, not a product. No Canadian community EMR was found exposing a working SMART launch to independent third parties with public documentation you can self register against. OSCAR Pro is claimed to have "open FHIR based API and SMART on FHIR infrastructure," but the documentation is released only after intake, privacy review and a signed partner agreement. Treat any Canadian vendor claim of SMART on FHIR support as meaning "we will do it for you under contract." This independently confirms section 13.4 of Continuum's own build specification.
Provincial programmes other than the Ocean run ones are closed. Alberta Netcare and the Alberta Referral Directory publish no interface, no developer documentation and no partner programme. Saskatchewan's EMR interoperability programme connects the provincial record to Accuro and Med Access only. Manitoba certifies EMR products rather than admitting third parties.
There is no Canadian equivalent of a unified EMR interface vendor. No company resells access across PS Suite, Med Access, Accuro and OSCAR. Every multi EMR company found, including Strata Health, Caredove, Careteam and OrderWise, reaches those EMRs through Ocean, which confirms Ocean is the layer rather than being one of several.
Access, honestly classified

5. IS THERE A PROBLEM PHYSICIANS RECOGNISE
Yes, and it is documented at national scale.
Strong evidence
The Canadian Medical Association and the Canadian Federation of Independent Business, 26 January 2026. Canadian physicians spend 19.8 million hours a year on unnecessary administrative tasks, up from 18.5 million in the 2023 iteration. 82 per cent say their administrative workload impedes patient care. 47 per cent of the tasks could be done by someone else or eliminated. The total is equivalent to 9,093 full time physicians. Doctors Manitoba's read of the same data reports 76 per cent of physicians naming insurance companies as a primary contributor.
Peer reviewed, and the single best piece of evidence available. Moravac, Bergin, Easley and colleagues, "No Band-Aids for papercuts: understanding and addressing challenges of administrative workload in primary care in Canada," Family Practice, 20 January 2026. Thirty six interviews with family physicians, nurse practitioners and administrative staff in Nova Scotia and New Brunswick. A participant quote the authors chose to foreground:
"insurance paperwork, which is the bane of our existence"
The paper names the failure modes precisely: lengthy forms, requests for historical information not readily available in the record, repeat requests for more information, disrespecting clinicians' assessments, moral distress about charging patients for form completion or doing the work free, and time spent advocating when coverage is denied. It names occupational health assessments explicitly as one of the categories.
A government of Nova Scotia volume figure. Patients Before Paperwork, February 2024, states the WCB 8/10 form is completed over 26,000 times a year by physicians in Nova Scotia alone, and lists improving that form and its submission process as a named red tape target.
The best quantified return on putting a board form inside an EMR, anywhere in Canada. Doctors Nova Scotia, measured to 31 March 2024: the WCB form is 40 per cent faster for family physicians in the EMR, and 67 per cent faster in the EMR than on paper. And that is from auto population alone, with no electronic transmission at all.
Provincial baselines. Doctors Nova Scotia measured 10.6 hours a week on administration with 38 per cent judged unnecessary, and physicians ranked medical forms as the single largest contributor. Doctors Manitoba measured 10.1 hours a week in 2023 and 9.7 in January 2026, which is 667,000 unnecessary hours a year in one province. The Alberta College of Family Physicians and the Alberta Medical Association reported 15 to 20 hours a week, 40 per cent unnecessary, with 80 per cent of respondents considering leaving comprehensive care.
The structural point that sharpens all of it
Physicians cannot charge their way out of WSIB work. The Ontario Medical Association states plainly that "not all fees are up to the physician's discretion, for example WSIB services." Ontario uninsured service fee schedules consistently carve WSIB out. The normal escape valve for burdensome paperwork, charging a block fee or a per form fee, is closed for workers compensation.
And the duty is mandatory. The Canadian Medical Protective Association, 2024: "You have a mandatory duty to provide a workers' compensation board with a medical report about an injured worker."
Non discretionary work, that cannot be delegated away, that cannot be charged for, that varies by province, and that the boards themselves pay a premium to move off fax. That is an unusually well shaped problem.
Moderate evidence, physician voice on workers compensation specifically
British Columbia Medical Journal, May 2017, Dr Paul Winston, on WorkSafeBC billing: "Calling patients, WorkSafeBC, and referring offices to obtain information, and fixing rejected billing is time consuming." "I know too well how difficult this system is to navigate and how poor most physicians' and medical office assistants' understanding of the system is." "My research revealed widespread gaps in knowledge, misunderstanding, and incorrect application of procedures."
OSCAR Pro's own support documentation frames the board form as a rejection trap: "Fill out all fields, it's better to take the additional minute to insure this is filled out correctly due to time limitations then to get rejections as it can impact you being paid for this service."
Anecdotal, labelled as such
Searching physician forums returned almost entirely worker side complaints rather than physician side: injured workers on Ontario forums struggling to get forms completed, being quoted fees, and being advised not to leave the office until the form is filled in. That is indirect evidence of physician reluctance. It is not a physician saying so, and it should not be presented as one.
The gap I could not close
No Canadian source isolates hours spent specifically on workers compensation forms. Every association study folds them into "medical forms" or "insurance forms." The closest public quantifications are Nova Scotia's 26,000 forms a year and the 40 to 67 per cent EMR speed up. If Continuum needs a workers compensation specific hours number, it does not exist publicly and would have to be generated primary. Do not let anyone put a fabricated one in a deck.

6. OCCUPATIONAL MEDICINE IS TWO DISJOINT WORLDS
World one, employer side. Cority, which began as Medgate in Toronto around 1985 and is now owned by Thoma Bravo, plus Meddbase, which Cority acquired on 23 January 2025. Systoc, now PureEHS, in the United States. These serve corporate medical departments, surveillance, fitness for duty and third party administrators.
Cority publishes marketing arguing that occupational health records should not live in an EMR at all. Its occupational medicine product page contains no reference to Canadian board integration, workers compensation forms or Canadian clinics.
Meddbase is UK centric. Cority's own release describes particular strength in the United Kingdom and Europe. No named Canadian Meddbase clinic was found. Treat its Canadian install base as unevidenced.
World two, treating clinician side. PS Suite, Accuro, CHR, Healthquest, OSCAR, Myle, Omnimed. This is where the board forms live and where provincial billing runs.
Nothing bridges them, and no Canadian specific occupational medicine clinical platform was found. Canadian occupational medicine physicians and workplace injury clinics, the ones who must file a C050 or a Form 8 or an Attestation médicale, are almost certainly on standard provincial EMRs, because that is where the board integration and the billing are.
This is the clearest statement of Continuum's opening in the whole report. The employer side software has no board integration. The clinician side software treats the board report as a bill. Nobody owns the clinical workflow between them.

7. TOP FIVE INTEGRATION TARGETS
Scored out of 100. Weights reflect what actually determines whether Continuum can ship and sell, not company size.

On the raw score Ocean wins. On sequence the board comes first, and the reason is not scoring. Without a board channel Continuum produces a beautiful screen and no report. Board integration is not an option to be ranked, it is the condition of being a product at all. Ocean is what makes it reachable once it works.
Integration 1. The board channel for the province you are actually operating in
Why first. It is the difference between a product and a demonstration. It is also the only integration where the counterparty wants you: Alberta publishes its accreditation package for download and names its accredited vendors, and British Columbia publishes 133 pages of record layout without asking who you are.
Do it in this order, and note that this order is not Alberta first.
British Columbia is the most open door in Canada. A complete public record specification, revision 1.10, with a published vendor testing procedure. Nobody has to grant permission to start building.
Alberta is the most complete and Continuum already has the form pack. Electronic submission is mandatory, which means every Alberta clinic is already doing this electronically and the only question is through which vendor. Twelve are accredited, four of them TELUS.
Saskatchewan is half a door. The published schemas are invoices only, and only two vendors are listed as batch capable. The clinical reports still go through a hand keyed web form. That is a gap, and Continuum's practitioners are heading there.
Ontario is the problem, and it should be named as such. WSIB has outsourced the provider channel to TELUS Health, publishes no specification, and runs no vendor programme. Continuum cannot submit electronically to WSIB without going through a company that sells a competing return to work product. The public fallbacks are a portal re-key or a fax.
Integration 2. Ocean
Why second, and why it is the most valuable thing in this report. One relationship makes Continuum reachable from inside PS Suite, Med Access, Accuro, OSCAR Pro, Juno and Profile at the same time. That is TELUS, Loblaw and WELL products at once, without negotiating with any of them. Roughly 20,000 physicians. Public documentation, a real sandbox, published prices, and a route a two person company can start on a Tuesday.
The specific mechanism. Become a validated receiver with a directory listing so a physician can send Continuum a structured referral from inside the chart without leaving it, and use Ocean forms to return the completed clinical document into the chart so the EMR stays the legal record.
The risk to price in. WELL Health owns Ocean and apps.health. Integrations two and four terminate at the same counterparty. And Ontario opened procurement for a single province wide primary care EMR on 22 July 2026, which could reshape every route in this report inside Continuum's planning horizon.
Integration 3. QHR Accuro
Why third. The best documented single vendor interface in Canada, with a published OpenAPI specification, defined scopes and a sandbox. Critically, Accuro already submits electronically to WCB Alberta and to WorkSafeBC and is one of only two vendors Saskatchewan names as batch capable. It is the one EMR that has already solved board submission in three provinces, which makes it the most natural partner rather than the most natural competitor.
The catch. A signed agreement and QHR issued credentials are mandatory. There is no self service.
Integration 4. WELL apps.health and OSCAR Pro
Why fourth. A documented intake process, a marketplace that actively wants partners, and the most modern technical surface in Canadian community EMRs. OSCAR Pro already submits to WorkSafeBC.
The catch. Documentation is released only after a partner agreement, pricing is unpublished, and reach is WELL's own estate. And it is the same counterparty as Ocean.
Integration 5. TELUS Health
Why last despite being the largest. TELUS is the most valuable integration in Canada and the least available. It owns the biggest Ontario EMR, four of Alberta's twelve accredited vendors, two of Quebec's certified products, and the WSIB provider portal itself. PS Suite, Med Access and Wolf publish nothing. The CHR interface exists but has no scopes, so a consumer receives unrestricted access to an organisation's entire record, which is difficult to defend in a privacy review that Alberta law requires Continuum to file anyway.
And TELUS Health sells return to work and disability management products. Treat it as a competitor that also owns the road.

8. ARCHITECTURE RECOMMENDATION
Craig's brief lists six options. Four can be eliminated on evidence.
The recommendation
Continuum should be the workplace injury workflow layer. The EMR stays the legal patient chart. The board is the integration that matters. Ocean is the distribution.
Concretely, in this order:
Standalone clinical application. The practitioner does the injury encounter in Continuum. This is available immediately and requires nobody's permission.
Board submission is the product. Build to the published specifications, British Columbia and Alberta first because they are downloadable. This is the part that removes work rather than adding it.
Push the completed document back into the chart through Ocean, so the physician's legal record is complete and Continuum is not a parallel chart the college would object to.
Reach physicians through Ocean's directory, so Continuum can be started from inside the EMR they already have open.
Only then, and only if a specific customer requires it, negotiate a single vendor interface. Accuro first.
Why this is the right call for a company this size
It matches where the doors actually are. Three boards publish specifications you can download without asking. Zero EMRs do.
It does not depend on a competitor's goodwill. Every EMR route runs through TELUS, Loblaw or WELL. The board route runs through a public sector body that publishes its specification and names its accredited vendors.
It is the only route that removes work. An EMR integration that copies data between two systems still leaves the physician doing the encounter twice. Being the place the encounter happens, and the thing that files it, is the only architecture where the physician enters it once.
And there is a measured precedent for the value. Nova Scotia measured a 40 to 67 per cent time saving on the workers compensation form from auto population alone, with no transmission. Continuum proposes to do considerably more than auto populate.
The honest counter argument
The standalone application is the hardest thing to sell. A physician already has an EMR open and does not want a second window. Ocean's contextual launch is the mitigation, and it is the reason Ocean sits at number two rather than number four.

9. IS THERE AN OPPORTUNITY
Yes, and the shape of it is unusually clear.
The evidence that there is a hole.
The employer side occupational health platforms, Cority and Medgate and Meddbase, have no Canadian board integration at all, and Cority publishes marketing arguing occupational health records should not sit in an EMR.
The clinician side EMRs do carry board forms, but they model the workplace injury report as a billing artifact. In Accuro you reach it through the insurer menu. In the TELUS CHR the button does not appear until you have set the payment issuer. The injury report is treated as an invoice with clinical fields attached.
Nobody has built the workplace injury encounter as a clinical workflow. That is not a gap in features. It is a gap in how the entire Canadian market has conceptualised the problem.
No board offers claim status read back, so nobody has closed the loop between what the physician recorded and what happened to the worker.
The employer receives nothing. In the workflow map above, step ten is the worker carrying paper. There is no system in Canada that moves a functional restriction from the physician to the employer.
And the problem is documented at national scale: 19.8 million unnecessary hours a year, 82 per cent of physicians saying it impedes care, insurance paperwork named in the peer reviewed literature as "the bane of our existence," and boards paying premiums to move physicians off fax.
What stands in the way, stated plainly.
Ontario is structurally hostile. TELUS owns the largest EMR and operates the WSIB channel. That is where Continuum's practitioners are. This is the single biggest strategic problem in this report and it is not a technical one.
Continuum has one form pack and it is for the wrong province. Alberta is built. Ontario and Saskatchewan are architecture.
Distribution runs through two companies. WELL owns the only common layer. TELUS owns the largest estate. Neither is neutral.
Five of thirteen jurisdictions cannot receive an electronic report at all, which caps the addressable market until those boards move.
Ontario is procuring a single province wide primary care EMR, opened 22 July 2026. That could destroy or transform the distribution picture within Continuum's planning horizon, and it is worth watching closely.
The verdict. The layer Continuum wants to be does not exist, nobody is building it, the two adjacent software industries have both declined to build it, physicians have documented the pain at national scale, and three provincial boards publish the specifications needed to build the valuable half. The opportunity is real. What is not real is the idea that it can be reached through EMR integrations. It has to be reached through the boards, with Ocean as the way physicians find it.

10. WHAT I COULD NOT VERIFY
Stated plainly so nothing here is over claimed.
No national EMR market share exists. Only Ontario publishes product level counts, they are vendor reported and unaudited, and they mix physicians with nurse practitioners. Any national share figure would be manufactured.
The Alberta vendor accreditation package could not be opened, so its internal format is unconfirmed. The board describes it as a detailed technical schema.
What WCB Alberta accreditation formally requires is not published. No conformance criteria document was found. What it demonstrably is, from vendor behaviour, is a credentialed channel carrying reports bundled with invoices.
No published fee amounts were found for New Brunswick, PEI, the territories, or Quebec, and Newfoundland states a premium without publishing it.
Wolf EMR, Med Access and Avaros Alberta board behaviour is presumed from the accredited list, not from vendor documentation. Their help sites were not publicly reachable.
No Canadian source isolates hours spent on workers compensation paperwork specifically. It is always folded into medical or insurance forms.
Who physically keys the form is unverified across all thirteen boards. No board publishes a rule. The structural evidence leans towards clinic staff.
Whether a third party can publish into Ocean's shared form library rather than its own site is not publicly documented.
Ocean's endpoint inventory is unconfirmed. The API reference renders client side and could not be read, though the narrative implementation guides are substantive.
No named Canadian Meddbase customer was found, and no evidence was found that Cority or Medgate integrate with any Canadian board.
What the Occupational Health Clinics for Ontario Workers runs, and what remote site and camp clinics run, could not be determined.

SOURCES
Ontario installed base: https://www.ontariomd.ca/emr-certification/omd-certified-emrs-numbers/vendor-reported-numbers-physicians-and-nps
Boards: https://www.worksafebc.com/resources/health-care-providers/guides/vendor-specifications-msp-inbound-records · https://www.worksafebc.com/resources/health-care-providers/guides/doctors-worksafebc-fee-schedule · https://www.wcb.ab.ca/resources/for-health-care-and-service-providers/online-services.html · https://www.wcb.ab.ca/assets/pdfs/providers/C459_physicians_reference_guide.pdf · https://www.wcb.ab.ca/assets/pdfs/providers/WCB_Fee_Schedule_Alberta_Physicians.pdf · https://www.wcbsask.com/physicians · https://myaccount.wcbsask.com/batch-invoice-info-vendors · https://www.wcbsask.com/documents/physician-service-rates-reporting · https://www.wcb.mb.ca/uploads/2025/03/0272.pdf · https://www.wsib.ca/en/healthcareforms · https://www.wsib.ca/en/fee-schedule-physician · https://www.wsib.ca/en/providers · https://www.cnesst.gouv.qc.ca/fr/demarches-formulaires/fournisseurs/autres-fournisseurs-fabricants/fabricants-logiciels-dme/logiciels-dme-certifies · https://www.worksafenb.ca/health-care/working-with-us/health-care-forms/medical-form-8-10/ · https://www.wcb.ns.ca/service-providers/reporting-and-invoicing · https://www.wcb.pe.ca/ServiceProviders/EServices · https://workplacenl.ca/health-care-providers/physicians/ · https://wscc.nt.ca/claims-services/resources-health-care-providers/medical-invoices-and-reports · https://www.wcb.yk.ca/web-0063/f-0043
Ocean and the layer: https://www.oceanmd.com/emr-integrations/ · https://www.oceanmd.com/network-integrations/ · https://www.oceanmd.com/pricing/ · https://support.cognisantmd.com/hc/en-us/sections/360006922672-API-Integrations · https://support.cognisantmd.com/hc/en-us/articles/360058125332-HL7-FHIR-eReferral-Integration-Setup-Guide · https://news-releases.well.company/news-releases/well-health-provides-corporate-update-on-wellstar-reflecting-organic-and-inorganic-growth-wins/ · https://opsmed.ca/resources/ontario-clinic-automation-landscape/ · https://www.oceanmd.com/news/oceanmd-phsa-ereferral-announcement/ · https://www.referralsns.ca/
Vendor interfaces: https://accuroemr.com/accuroapi/ · https://dev-exchange.qhrtech.com/ · https://apps.health/how-to-get-your-product-on-apps-health/ · https://help.inputhealth.com/en/articles/6483215-chr-enterprise-api · https://oscaremr.atlassian.net/wiki/spaces/OS/pages/79855638/Connecting+to+OSCAR+s+REST+API
Board forms inside EMRs: https://help.pssuiteemr.com/5.7/on/en/Content/03_User_topics_EN/EMR_general/Submitting_wsib_form8_ON.htm · https://qhrtech.my.site.com/community/s/article/Claims-BC-WorkSafeBC · https://help.inputhealth.com/en/articles/8129822-creating-workers-compensation-board-wcb-first-reports-alberta · https://help.healthquest.ca/portal/en/kb/articles/submitting-wcb-reports · https://oscarsupport.zendesk.com/hc/en-us/articles/38178834814868-Creating-and-Submitting-WorkSafeBC-WCB-Claims
The pain: https://www.cfib-fcei.ca/en/research-economic-analysis/losing-doctors-to-desk-work · https://pmc.ncbi.nlm.nih.gov/articles/PMC12816806/ · https://doctorsns.com/contract-and-support/admin-burden · https://doctorsns.com/contract-and-support/admin-burden/forms · https://www.novascotia.ca/sites/default/files/documents/1-3625/patients-paperwork-reducing-red-tape-physicians-february-2024-en.pdf · https://doctorsmanitoba.ca/about-us/advocacy-policy/administrative-burden · https://acfp.ca/decreasing-administrative-burden-update/ · https://bcmj.org/special-feature/untangling-worksafebc-billing-procedures · https://www.cmpa-acpm.ca/en/advice-publications/browse-articles/2024/workplace-injuries-the-duty-to-report-when-your-patient-is-an-injured-worker · https://www.oma.org/practice-professional-support/billing-and-payments/billing-for-uninsured-services/
Occupational medicine: https://www.cority.com/news-media/cority-acquires-occupational-health-software-meddbase/ · https://www.cority.com/blog/emrs-employee-occ-health-records/ · https://www.medgate.com/health-cloud/
Ontario provincial EMR procurement: https://www.canhealth.com/2026/07/22/ontario-begins-procurement-for-provincial-emr/
END OF PROMPT 69.

## Tables supplied as trailing rows in the transcript

The upload dumped these tables after END OF PROMPT 69. They are the technology map, board map, room-workflow, access classification, scoring weights, target scores, and architecture options. Rendered as markdown tables here without changing values.

### Technology map. OntarioMD vendor reported counts

| EMR | Vendor | Parent | Ontario MDs and NPs |
|---|---|---|---|
| PS Suite | TELUS Health | TELUS | 9,106 |
| Accuro | QHR Technologies | Loblaw | 8,878 |
| OSCAR Professional | WELLSTAR | WELL Health | 5,260 |
| Avaros | Avaros Inc | Independent | 1,298 |
| Collaborative Health Record | TELUS Health | TELUS | 1,113 |
| EMR Advantage | Canadian Health Systems | Independent | 667 |
| Cerebrum | AwareMD | WELL Health | 523 |
| Juno | WELLSTAR | WELL Health | 393 |
| Med Access | TELUS Health | TELUS | 180 |
| YMS, GlobeMed, Alembico, YES | various | Independent | 366 combined |
| Total Ontario |  |  | 27,784 |

### Technology map. Consolidated by parent

| Parent | Products | Ontario physicians and NPs | Share of Ontario |
|---|---|---|---|
| TELUS Health | PS Suite, CHR, Med Access, Wolf, KinLogix, Medesync, Kroll, Pomelo | 10,399 | 37.4% |
| Loblaw / QHR | Accuro, Medeo | 8,878 | 32.0% |
| WELL Health | OSCAR Pro, Juno, Cerebrum, Intrahealth Profile, OceanMD, apps.health | 6,176 | 22.2% |
| Three parents combined |  | 25,453 | 91.6% |

### Technology map. Systems

| System | Owner | Type | Canadian footprint | Provinces | Primary care | Specialists | Occ med relevance | Board capability |
|---|---|---|---|---|---|---|---|---|
| PS Suite | TELUS | Community EMR | 9,106 in ON, national presence, no national figure published | ON, national | Dominant | Yes | High by volume | Yes. Ontario WSIB Form 8 electronic. Alberta accredited |
| Accuro | Loblaw / QHR | Community EMR | 8,878 in ON, national | National | Very strong | Yes | High | Yes. Alberta electronic, BC via Teleplan, one of two SK batch vendors |
| OSCAR Pro | WELL | Community EMR | 5,260 in ON | ON, BC, national | Strong | Yes | Moderate | Yes. BC WorkSafeBC via Teleplan |
| TELUS CHR | TELUS | Community EMR | 1,113 in ON | National | Growing | Yes | Moderate | Yes. Alberta, batched four times daily |
| Wolf EMR | TELUS | Community EMR | Not in ON list | AB, BC | Strong in AB | Yes | High in AB | Yes. Alberta accredited. No public documentation found |
| Med Access | TELUS | Community EMR | 180 in ON | AB, SK, NL, NS | Strong outside ON | Yes | High | Yes in AB. Category B only in NS and NL |
| Microquest Healthquest | Independent | Community EMR | No published figure | AB | Yes | Some | High in AB | Yes. Relays to WCB via Microquest roughly every 15 minutes |
| Avaros | Independent | Community EMR | 1,298 in ON | ON | Yes | Some | Low | Not evidenced |
| Myle | MEDFAR | Community EMR | No published figure | QC | Yes | Yes | Moderate | Yes. CNESST certified |
| Omnimed | Omnimed | Community EMR | No published figure | QC | Yes | Yes | Moderate | Yes. CNESST certified |
| KinLogix, Medesync | TELUS | Community EMR | No published figure | QC | Yes | Yes | Moderate | Yes. CNESST certified |
| Ocean | WELL | Layer above EMRs | 20,000+ physicians, 3,800+ clinics, 4 provinces | ON, NS, BC, +1 | Reaches all | Reaches all | Rails only, no board content | No |
| Epic, Oracle Health, MEDITECH | US vendors | Hospital EHR | Health authority scale | Various | No | Hospital based | Low for community injury care | No |
| Cority and Medgate | Thoma Bravo | Employer side occ health | 1,300 clients globally, vendor claim | Global, Toronto origin | No | No | High, but wrong side | None found in Canada |

### Board map

| Province | Board | Initial report | Progress report | Channel | Vendor specification published | Vendor list published | Electronic pays more |
|---|---|---|---|---|---|---|---|
| BC | WorkSafeBC | Form 8 | Form 11 | Teleplan fixed width record from billing software, else fax | YES. 133 page record layout, v1.10, Jan 2022. The best in Canada | No | Yes, plus speed tiers |
| Alberta | WCB Alberta | C050 | C151 | Electronic only. myWCB portal or accredited EMR | YES. Downloadable accreditation package | YES, twelve vendors | Single channel. Speed tiers $96.98 / $88.37 / $55.70 |
| Saskatchewan | WCB Sask | PPI | PPP | Online account web form, or PDF | Invoices only. Two XSDs plus error codes | YES, two: Accuro and CBS Navicert | Yes, plus $16.25 |
| Manitoba | WCB Manitoba | Form 0272 | Form 0526 | FAX ONLY | None | None | No electronic channel exists |
| Ontario | WSIB | Form 8 | Form 26 | TELUS Health provider portal. WSIB has outsourced the channel | NONE. It is TELUS private property | No | Yes. $65 to $85 on Form 8, $45 to $60 on Form 26 |
| Quebec | CNESST | 1936 Attestation | 1937 Rapport | Certified EMR web services, real time, else secure upload | Programme published, specification released on request only | YES, four partners, six products | Not found |
| New Brunswick | WorkSafeNB | Form 8-10 | Same form | Fillable PDF by secure email, fax, mail | None | None | Not found |
| Nova Scotia | WCB NS | Primary and Emergency Care Report | Same form | Form is in the EMR, then FAXED. Billing is electronic via MSI | None | None | No. Cut from 110% to 100% of MSI fee, August 2025 |
| PEI | WCB PEI | Form 8 | Same form | Online web form, else fax | None | None | Not found |
| Newfoundland | WorkplaceNL | Form MD | Same form | connect portal, else EMR template that prints or eFaxes | None | None | Yes, board states it, amounts unpublished |
| NT and Nunavut | WSCC | First Medical Report | Medical Progress Report | EMAIL | None | None | Not found |
| Yukon | YWCHSB | F-0043 | Doctor's Progress Report | Fax, mail, email | None | None | Not found |

### Room-workflow

| Step | Who | System | What actually happens |
|---|---|---|---|
| 1. Worker arrives | Reception | EMR scheduling | Demographics already exist or are keyed |
| 2. Chart opened | Assistant | EMR | Standard |
| 3. Encounter documented | Physician | EMR clinical note | Standard |
| 4. Injury report started | Usually staff | EMR, reached through BILLING | In Accuro Alberta: Claim Details, Insurer, WCB. In TELUS CHR the WCB button only appears once payment issuer and billing provider are both set to WCB |
| 5. Demographics populate | System | EMR | This is the only automation that reliably exists |
| 6. Clinical content keyed | Physician or staff | EMR form | Re-stated from the note just written |
| 7. Restrictions recorded | Physician | EMR form fields | Free text or tick boxes. No measurement model anywhere |
| 8. Submission | Varies wildly | See below | The fracture point |
| 9. Worker copy | Staff | Printer | Statutory in Quebec. Common everywhere |
| 10. Employer information | Nobody, or the worker carries paper | No system | The gap |
| 11. Follow up | Physician | EMR form again | Largely re-keyed |

### Access classification

| Route | Reaches | Status |
|---|---|---|
| Ocean, validated receiver in the Healthmap | All deep integrated EMRs at once | Available today. Self startable |
| Ocean, FHIR eReferral with sandbox | Same | Available today. Documented, versioned |
| Ocean, forms from your own site | Same | Available today. Published pricing |
| QHR Accuro interface programme | Accuro only | Commercially available. Public OpenAPI specification and sandbox, agreement and QHR issued credentials mandatory |
| WELL apps.health, OSCAR Pro track | WELL estate only | Commercially available. Documented intake, but documentation only after agreement, pricing unpublished |
| TELUS CHR Enterprise interface | CHR clinics only | Commercially available per customer. GraphQL, documented, but every clinic must sign, and it has no scopes, so a consumer gets unrestricted access to all of an organisation's data, which is a privacy review liability |
| TELUS PS Suite, Med Access, Wolf | The largest estate in Canada | CLOSED. No public interface, no developer portal, no marketplace. Access restricted to affiliated businesses |
| OSCAR REST, clinic by clinic | One clinic at a time | Technically possible, does not scale. OAuth 1.0a, per clinic admin enablement |
| Alberta Netcare, Saskatchewan EMRI, Manitoba PCIS | Provincial records | CLOSED |
| Canada Health Infoway | Nothing usable | Roadmap only, or prescribing only |

### Scoring weights

| Weight | Criterion |
|---|---|
| 20 | Reach into Canadian physicians doing injury care |
| 20 | Access genuinely available to a very small company today |
| 15 | Removes duplicate entry rather than adding a system |
| 15 | Workplace injury relevance |
| 10 | Provincial coverage |
| 10 | Commercial accessibility without an enterprise negotiation |
| 10 | Technical tractability |

### Target scores

| Target | Reach /20 | Access /20 | No duplication /15 | Injury relevance /15 | Provinces /10 | Commercial /10 | Technical /10 | Total |
|---|---|---|---|---|---|---|---|---|
| 1. The provincial board channel itself | 8 | 17 | 14 | 15 | 6 | 9 | 7 | 76 |
| 2. Ocean | 18 | 19 | 9 | 8 | 8 | 9 | 8 | 79 |
| 3. QHR Accuro | 12 | 13 | 11 | 13 | 8 | 6 | 8 | 71 |
| 4. WELL apps.health and OSCAR Pro | 11 | 12 | 10 | 10 | 7 | 8 | 8 | 66 |
| 5. TELUS Health | 16 | 4 | 4 | 14 | 9 | 2 | 5 | 54 |

### Architecture options

| Option | Verdict |
|---|---|
| A. Full EMR integration | Eliminate for now. The largest estate in Canada publishes no interface at all. Everything else requires a signed agreement per vendor. This is a strategy for a company with a partnerships team |
| B. SMART on FHIR application | Eliminate. No Canadian community EMR was found exposing a working SMART launch to independent third parties with public documentation. Continuum's own build specification already forbids it in Alberta |
| C. Standalone physician application | Necessary but not sufficient. It is the only thing available immediately, and alone it adds a system rather than removing one |
| D. Document push into the EMR | Necessary. This is what keeps the EMR as the legal chart and stops Continuum being a parallel record |
| E. Board first integration | Necessary, and the value |
| F. Hybrid | This is the answer |
