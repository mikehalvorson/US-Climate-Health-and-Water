# Energy time-series package

Purpose: deterministic, chart-ready historical and scenario data for the energy dashboard. This directory is a data interface, not narrative documentation.

## Normative artifacts

- `series-schema.json`: row contract shared by every normalized CSV.
- `source-access.json`: canonical acquisition endpoints, provenance checks, and redistribution constraints.
- `scenario-catalog.json`: model, scenario, geography, and time-horizon metadata.
- `chart-contracts.json`: permitted chart inputs and non-splicing rules.
- `gap-register.json`: explicit missing series and prohibited substitutions.
- `coverage.json`: generated coverage matrix and output checksums.
- `ingestion-manifest.json`: generated raw-input checksums, transformations, and normalized-output checksums.
- `scripts/normalize_timeseries.py`: reproducible transformation and validation pipeline.
- `scripts/validate_timeseries.py`: corpus, checksum, taxonomy, horizon, scenario-count, and selected raw-value checks.
- `normalized/*.csv`: versionable, long-form chart data.

The locally retained `raw/` directory is intentionally ignored by Git. Reacquire raw artifacts only from the endpoints in `source-access.json`, then compare their hashes with `ingestion-manifest.json` before rebuilding.

## Required interpretation rules

1. Never connect a historical series to a scenario series as if it were one observed line. Render a visible seam, change line style, and label the model and scenario.
2. Scenario values are conditional model outputs, not predictions. A model's calibration or base year is not an observation.
3. Do not add rows across scopes. In particular, AEO Table 16 contains electric-power-sector, end-use-sector, and all-sector records; selecting more than one of those scopes double counts.
4. Do not compare or combine capacity and generation. Capacity uses GW-family units; generation uses TWh.
5. Do not silently combine gross generation, net generation, storage discharge, imports, or losses.
6. Use a single source family within a plotted historical line. Cross-source differences belong in a comparison view, not in an invisible splice.
7. U.S.-specific scenario coverage ends in 2050. Do not manufacture U.S. values for 2051-2070. NGFS supplies world scenarios through 2100, including 2070.
8. Preserve `source_id`, `dataset_id`, `source_variable`, `source_vintage`, and `upstream_status` in every transformed dashboard record.

## Rebuild

Run the normalizer with the repository's Python environment. A successful run emits a JSON count, rewrites all normalized CSV files, recalculates hashes, and fails on missing required provenance fields.

Expected package size as of 2026-08-01: seven CSV files and 55,001 data rows.
