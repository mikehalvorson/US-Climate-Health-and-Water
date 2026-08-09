# Electricity-consumption time series

This directory is the chart-data layer for historical electricity consumption, U.S. projections through 2050, global scenarios through 2100, sector/end-use breakdowns, EV and data-center loads, and demand-driver indicators.

Files:

- `series-schema.json`: row schema and controlled metric/status fields.
- `ingestion-manifest.json`: raw artifact URLs, sizes, checksums, and conversion constants.
- `coverage.json`: generated output counts, year ranges, sources, scenarios, and checksums.
- `scripts/normalize_consumption.py`: deterministic raw-to-normalized transformation.
- `scripts/validate_consumption.py`: schema, provenance, source-cell, accounting-identity, and coverage checks.
- `normalized/us-electricity-consumption-history.csv`: 1949-2025 EIA sales/use history and 2018-2025 EV overlay.
- `normalized/global-electricity-demand-history-ember-owid.csv`: 2000-2025 World system demand on Ember's gross-generation-plus-net-imports basis.
- `normalized/us-electricity-supply-demand-aeo2026.csv`: all eleven AEO2026 cases, 2025-2050, with the generation-to-use bridge.
- `normalized/us-electricity-end-use-aeo2026.csv`: residential, commercial, industrial, data-center-server, and charging-location series.
- `normalized/us-demand-drivers-aeo2026.csv`: GDP, population, income, households, floorspace, housing starts, vehicle sales, and travel.
- `normalized/global-electricity-consumption-ngfs-phase5.1.csv`: three IAMs, seven scenarios, World final-electricity sectors/subsectors, 2020-2100.
- `normalized/global-electricity-supply-demand-ngfs-phase5.1.csv`: matched NGFS secondary generation, final consumption, and their model-specific accounting gap.
- `normalized/global-and-us-demand-milestones.csv`: sparse IEA and LBNL total-demand, data-center, and EV milestones.
- `normalized/us-electrification-scenarios-nrel-efs.csv`: NREL EFS Table 7.1 2016/2050 endpoints.

The package currently contains 20,997 normalized rows. Run the normalizer before the validator after any raw input or transformation change.

Non-additivity is part of the data contract: EV and data-center series are already contained within sector/system totals; NGFS aggregate and child variables overlap; and AEO accounting subtotals are not one flat hierarchy. The executable rules are in `../accounting-boundaries.json` and `../chart-contracts.json`.
