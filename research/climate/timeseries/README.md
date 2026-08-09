# Climate time-series data

Machine-readable source and derived series for climate-cause and impact charts.

## Reproduce

Run `scripts/normalize_climate.py` from the climate package directory. The
normalizer reads retained raw files, preserves source-native temperature
baselines, excludes incomplete NOAA 2026 temperature data, and writes normalized
files plus source hashes. `--refresh-primap` streams the large PRIMAP-Hist source
and retains only global, selected-gas rows.

## Interpretation rules

- Annual emissions, concentration, radiative forcing, and temperature are not interchangeable.
- Reported level correlations are descriptive and not causal estimates.
- Use IPCC TCRE only with cumulative anthropogenic CO2 under the IPCC definition.
- Scenario warming rows are 20-year assessment means, not annual forecasts.
- Null means unavailable or out of coverage and must remain null.
- Temperature baselines must be displayed or explicitly and reproducibly rebased.

See `series-schema.json`, `source-access.json`, and the package-level
`chart-contracts.json` before publishing a chart.
