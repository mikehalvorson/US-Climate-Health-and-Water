# Research index

This directory is the public evidence base for the dashboard. Research is
organized by domain, but all publishable claims share one source register and
one verification protocol.

## Research passes

| File | Scope |
|---|---|
| `01_climate_observations.md` | Global and U.S. observed climate indicators, drivers, attribution boundaries, and uncertainty |
| [`climate/`](climate/) | Machine-readable causal attribution, observed GHG/forcing/temperature series, IPCC scenario warming, temperature-risk relationships, hurricanes, biodiversity, food, freshwater, sea level, and displacement—with three-check headline-claim audits |
| [`energy/`](energy/) | Machine-readable global/U.S. production, generation, consumption, transmission, technology ontology, dataset catalog, verified claims, and En-ROADS clean-room model specification |
| [`water/`](water/) | Machine-readable national withdrawals and consumptive use, sector demand, source-dependent city profiles, dated risk horizons, desalination/AWG scale scenarios, gaps, chart contracts, and three-check claim audits |
| [`plastics/`](plastics/) | Machine-readable U.S. plastic material flows, major-resin manufacturing, water-intensity ranges, alternatives, international policies, seaweed scale tests, health/environmental evidence, replacement strategy, and three-check claim audits |
| `05_water_current_use.md` | Current withdrawals and consumptive use by source, sector, basin, state, and available time series |
| `06_water_future_use.md` | Demand and supply projections, climate exposure, population and sector scenarios, and uncertainty |
| `07_climate_energy_water_nexus.md` | Thermal generation water needs, hydropower, pumping and treatment energy, drought and heat constraints, and cross-sector tradeoffs |
| `08_scenarios_and_reconciliation.md` | Scenario definitions, incompatible baselines, cross-source reconciliation, and dashboard-ready parameter choices |

Additional corpora will be added only after their claims have been checked under
[`../docs/RESEARCH_PROTOCOL.md`](../docs/RESEARCH_PROTOCOL.md).

## Source register

[`source-register.csv`](source-register.csv) defines the flat exchange schema.
Domain corpora may store the same control information in normalized JSON, as
the domain corpora do in [`energy/sources.json`](energy/sources.json),
[`energy/claims.json`](energy/claims.json), [`climate/sources.json`](climate/sources.json),
[`climate/claims.json`](climate/claims.json), [`water/sources.json`](water/sources.json),
[`water/claims.json`](water/claims.json), [`plastics/sources.json`](plastics/sources.json),
and [`plastics/claims.json`](plastics/claims.json). One claim may have several support
records and one source may support several claims. Identity and fidelity checks
remain separate and auditable in either representation.

Status values:

- `verified`: eligible for public use;
- `provisional`: promising, but one or more checks remain open;
- `rejected`: source or claim match failed;
- `superseded`: retained for history, but replaced by a later source vintage.

The CSV currently contains the exchange headers only. Candidate links are not
inserted as if they were verified evidence.
