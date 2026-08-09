# Energy transmission, hourly load, and supply chains

Machine-consumable research package for the U.S. Climate, Health, and Water dashboard. It covers:

- 2024 EIA-930 hourly and geographic demand shape;
- a national >=230 kV HIFLD context layer;
- a curated major-corridor map and capacity ontology, including NECEC;
- transmission need and load-growth study comparisons;
- a graphable development, permitting, procurement, and construction process;
- technical, regulatory, worker/community health, ecological, equity, and security challenges;
- transformer and cross-system generation/transmission/consumption supply chains; and
- a prioritized cross-domain information-gap register.

Start with `manifest.json`, `findings.json`, and `chart-contracts.json`. Resolve citations through `source-verification.json`; `source-link-check.json` records a separate dated machine accessibility audit.

Non-negotiable semantics:

- Voltage is not capacity.
- Project rating, conductor capability, equipment limit, energy-import capability, capacity-import capability, firm service, and capacity-delivery rights are different quantities.
- A scenario is not a forecast; a draft is not a final study; a permit is not an operating asset.
- Missing is not zero.
- Annual demand is not an hourly load shape.
- The HIFLD line layer is not an operational power-flow model.
- Approximate corridor geometry is not suitable for engineering, siting, or parcel analysis.
- Sensitive asset detail and CEII must not be reconstructed or published.

Run `load-shape/timeseries/scripts/validate_eia930.py` and `scripts/validate_transmission.py` before publishing.
