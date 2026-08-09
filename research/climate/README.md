# Climate cause-and-impact evidence package

Machine-first research corpus for dashboard implementation.  JSON and CSV files are
the normative artifacts; this README is only a routing index.

## Rules encoded in this package

- `correlation` is never used as a synonym for `causation` or `attribution`.
- Annual GHG emissions, atmospheric concentration, radiative forcing, and warming
  are separate variables with different units and response times.
- A single warm year above 1.5 C is not the Paris Agreement's long-term 1.5 C level.
- Impact estimates retain their warming baseline, time horizon, geography,
  confidence, scenario, adaptation assumptions, and non-climate drivers.
- Weather-related displacement is not identical to displacement attributable to
  anthropogenic climate change; `climate refugee` is not used as a legal category.
- Null or unavailable global temperature-response coefficients remain null. They are
  not inferred from unrelated observations.

## Files

- `manifest.json`: package inventory and scope.
- `sources.json`: source identity, authority, exact locators, and verification state.
- `claims.json`: dashboard-safe claims and prohibited transformations.
- `source-verification.json`: three-check audit for every headline claim.
- `attribution/`: causal chain, attributable warming, TCRE, and interpretation rules.
- `impacts/`: hurricanes, biodiversity, food, freshwater, sea level, displacement,
  and the cross-impact temperature-risk ladder.
- `coastal-cities/`: New Orleans and Miami claim audit, local NOAA sea-level and
  high-tide-flood scenarios, city-specific failure pathways, adaptation,
  displacement models, destination-city capacity, chart contracts, and gaps.
- `timeseries/`: source data, normalizer, schemas, correlations, scenario tables, and
  chart contracts.
- `chart-contracts.json`: dashboard render and annotation requirements.
- `gaps.json`: unresolved evidence and data-access gaps.
- `scripts/validate_climate.py`: structural and semantic validator.

## Reproduction

Run `timeseries/scripts/normalize_climate.py` with the bundled workspace Python.
Use `--refresh-primap` only when network access is available; it streams the large
source dataset and retains only the global rows needed here.

Run `coastal-cities/timeseries/scripts/normalize_coastal_cities.py` to reproduce
the coastal-city CSVs, then `coastal-cities/scripts/validate_coastal_cities.py`.
