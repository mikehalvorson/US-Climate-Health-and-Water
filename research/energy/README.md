# Energy research corpus

Purpose: machine-consumable evidence for the global and United States energy-generation, production, transmission, consumption, technical reliability, human-health, regulatory, lifecycle-sustainability, and nuclear-generation dashboard.

Normative files:

- `manifest.json`: corpus version, coverage, and validation rules.
- `sources.json`: canonical source identities and access metadata.
- `claims.json`: atomic claims, exact support locators, corroboration, and confidence.
- `technology-taxonomy.json`: energy-source and conversion-technology ontology.
- `datasets.json`: ingestion catalog for future dashboard data pipelines.
- `observations-global-2025.json`: latest global observations and methodological conflicts.
- `observations-us-2025.json`: latest U.S. production, consumption, and generation observations.
- `transmission.json`: compact legacy global and U.S. transmission evidence.
- `transmission/`: exhaustive U.S. transmission package: validated 2024 hourly BA/region/subregion load shape, a 10,031-feature >=230 kV HIFLD layer, a sourced 20-corridor capacity map including NECEC, planning-needs comparisons, a graphable development process, infrastructure challenges, transformer and all-system supply chains, chart contracts, and a 30-item cross-domain gap register.
- `summary.json`: compact research conclusions and dashboard requirements.
- `en-roads/model-map.json`: attributed map of the public En-ROADS architecture.
- `en-roads/reproduction-assessment.json`: legal/technical boundary and clean-room implementation plan.
- `impacts/`: technical, health, regulatory, and lifecycle problem framework; all-method technology matrix; nuclear deep dive; current U.S. federal status register; lifecycle benchmarks; and dashboard contracts.
- `timeseries/`: chart-ready historical and scenario CSV files, source-access records, schemas, coverage, scenario metadata, and a reproducible normalizer.
- `consumption/`: verified electricity-demand findings, causal drivers, accounting boundaries, chart contracts, source audit, and nine additional normalized files for World and U.S. history, all AEO2026 cases, sector/end-use demand, data centers, EVs, demand drivers, NREL electrification stress tests, and global NGFS sector and supply-demand scenarios.

Rules:

1. Do not promote a value or assertion into the dashboard unless its `claim_id` is present in `claims.json` with `status: verified`.
2. A source identity check establishes that the source exists and is issued by the named publisher. A claim-fidelity check establishes that the cited locator supports the claim as written. They are distinct checks.
3. Derived values must include a formula and all input claim or observation identifiers.
4. Observed, estimated, preliminary, scenario, and forecast values are never interchangeable.
5. Capacity (GW), generation (TWh), primary energy (EJ or quadrillion Btu), final energy, and electricity sales are separate measures.
6. Historical observations and scenario outputs must have a visible seam; model base years are not observations.
7. Never extrapolate a series beyond its documented horizon. U.S.-specific model output currently ends in 2050; world NGFS pathways include 2070 and continue to 2100.
8. Never collapse technical, health, regulatory, and sustainability dimensions into a single score unless weights, normalization, missing-data rules, uncertainty, rationale, and sensitivity are published.
9. Regulatory proposals, final actions, effective requirements, implementation deadlines, stays, and repeals are distinct statuses and carry an as-of date.
10. Operational emissions are not lifecycle emissions; water withdrawal is not consumption; technical recyclability is not actual recycling; interim spent-fuel storage is not permanent disposal.
11. Identifiable loads such as EV charging and data centers are already contained in sector/system consumption and remain overlays unless a mutually exclusive decomposition is used.
12. Annual electricity use (TWh) does not determine peak demand (GW), resource adequacy, or transmission need; hourly and geographic evidence is required.
13. AEO data-center server electricity and IEA/LBNL total-facility electricity use different boundaries and are never spliced.
14. Transmission voltage, project rating, conductor capability, equipment limit, transfer capability, capacity accreditation, and contractual rights are different measures.
15. Public line geometry is not an operational network model; MW is never inferred from kV.
16. Missing hourly demand is not zero, and different geographies are joined only on UTC hour ending.
