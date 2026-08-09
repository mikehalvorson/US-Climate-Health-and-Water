# EIA-930 hourly load-shape package

This directory contains a deterministic 2024 load-shape layer for U.S. balancing authorities, EIA regions, and the BA-subregions reported in EIA's six-month Form EIA-930 downloads.

UTC hour ending is the canonical key for coincident geography comparisons. Local hour ending is retained for daily customer-load profiles. The two clocks must not be interchanged.

Demand selection is `adjusted`, then `imputed`, then `reported`. Missing stays null. Eight of the 61 BAs in the balance files report no demand; three demand-reporting BAs have isolated missing hours. See `coverage.json` for exact coverage, raw-file hashes, and limitations.

Normalized outputs:

- `timeseries/normalized/us-balancing-authority-hourly-demand-2024.csv.gz`
- `timeseries/normalized/us-subregion-hourly-demand-2024.csv.gz`
- `timeseries/normalized/us-region-and-reporting-footprint-hourly-demand-2024.csv.gz`
- `timeseries/normalized/load-shape-summary-2024.csv`
- `timeseries/normalized/average-hourly-load-profiles-2024.csv`

Rebuild with `timeseries/scripts/normalize_eia930.py`; validate with `timeseries/scripts/validate_eia930.py`.

The national aggregate is labeled the **EIA-930 reporting footprint**. It is not represented as a perfectly bounded Lower-48 control total, and incomplete UTC edge hours are excluded from the summary.
