# U.S. Climate, Energy, and Water Dashboard

An evidence-linked public dashboard about climate change, global and U.S.
energy production and consumption, U.S. electricity transmission, and current
and future water use.

The site will use Astro and will follow the general visual and narrative
structure of the National Health Assurance dashboard: a guided overview,
chapter routes, interactive working views, explicit sources and uncertainty,
and chapter-to-chapter navigation.

## Current phase

The project is in research and documentation. The first verified corpus covers
global and U.S. energy production, generation, consumption, transmission, and
the public En-ROADS model architecture. It now also includes a verified
technical, health, regulatory, and lifecycle-sustainability problem framework;
an all-method technology impact matrix; and a dedicated nuclear-generation,
fuel-cycle, safety, water, licensing, and waste module. Chart-ready historical and scenario
series cover world observations through 2025, U.S. observations through 2025,
U.S. scenarios through 2050, and world scenarios through 2100. A dedicated
electricity-consumption package adds 20,997 rows covering World system demand, U.S. sector sales
and use, all eleven AEO2026 demand cases, residential/commercial/industrial
end uses, data centers, EV charging, macro drivers, an electrification stress
test, and global sector-demand scenarios. The
transmission package adds 1,264,896 source hourly load records, 191,530 derived
aggregate/profile/summary records, a 10,031-feature federal high-voltage line
layer, 20 sourced major-corridor records (including NECEC), a graphable project
process, and transformer plus cross-sector supply-chain evidence. The
machine-readable index is
[`research/energy/README.md`](research/energy/README.md).

The climate cause-and-impact corpus adds observed greenhouse-gas, forcing, and
temperature time series; formal causal attribution and cumulative-CO2 response;
IPCC warming scenarios; and qualified impact relationships for extreme heat,
tropical cyclones, biodiversity, food systems, freshwater, sea level, and
climate-related displacement. Headline claims carry three-check verification
audits, and unsupported universal coefficients remain explicit nulls. A coastal
city module audits claims about New Orleans and Miami, supplies local NOAA
scenario series through 2100, separates exposure from displacement, and defines
receiving-city capacity indicators. Its index is
[`research/climate/README.md`](research/climate/README.md).

The freshwater corpus adds national withdrawal and consumptive-use accounting,
1950–2015 historical data, household/agriculture/manufacturing/plastics/data-center
sector files, 18 city and regional source-dependency profiles, 14 explicitly typed
risk horizons, and scale-tested desalination and atmospheric-water-generation
modules. Its 20 headline claims have three-check audits, all 63 sources have a
recorded link/content review path, and unsupported plastics coefficients remain
explicit gaps. Its index is [`research/water/README.md`](research/water/README.md).

The plastics corpus adds a 2019 U.S. economy-wide material-flow baseline,
major-resin manufacturing pathways, bounded resin-water estimates, functional
replacement strategies, international policy cases, seaweed scale scenarios,
and health and environmental evidence that separates polymers, monomers,
additives, PFAS, and particles. Its 21 dashboard claims each carry a three-check
audit; the disputed pregnancy-and-vaccine claim is preserved as a correction,
not repeated as fact. Its index is
[`research/plastics/README.md`](research/plastics/README.md).

No factual claim or numeric parameter is ready for publication until it passes
the verification process in
[`docs/RESEARCH_PROTOCOL.md`](docs/RESEARCH_PROTOCOL.md).

## Planned repository structure

```text
docs/                 Project standards and design documentation
research/             Verified claims, source register, and domain research
src/                   Astro pages, components, data models, and client code
public/data/           Published datasets with provenance metadata
tests/                 Evidence, data, model, and interface checks
```

See [`docs/INFORMATION_ARCHITECTURE.md`](docs/INFORMATION_ARCHITECTURE.md)
for the proposed dashboard story and reusable NHA design patterns.

The implementation will proceed in verified segments documented in
[`docs/FIRST_DRAFT_IMPLEMENTATION_PLAN.md`](docs/FIRST_DRAFT_IMPLEMENTATION_PLAN.md).
The initial repository, runtime, validator, and data-size audit is recorded in
[`docs/BUILD_READINESS.md`](docs/BUILD_READINESS.md).

## Evidence rule

Hallucinated facts, invented citations, citation laundering, and sources that
do not support the attached claim are release-blocking defects. When a source
cannot be verified, the claim remains explicitly open and stays out of the
public dashboard.
