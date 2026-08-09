"""Fail-fast validation for normalized EIA-930 load-shape outputs."""

from __future__ import annotations

import csv
import gzip
import json
from collections import Counter
from pathlib import Path


TS = Path(__file__).resolve().parents[1]
OUT = TS / "normalized"


def rows(path, compressed=False):
    opener = gzip.open if compressed else open
    with opener(path, "rt", encoding="utf-8", newline="") as handle:
        yield from csv.DictReader(handle)


def main():
    coverage = json.loads((TS.parent / "coverage.json").read_text(encoding="utf-8"))
    ba_path = OUT / "us-balancing-authority-hourly-demand-2024.csv.gz"
    sub_path = OUT / "us-subregion-hourly-demand-2024.csv.gz"
    agg_path = OUT / "us-region-and-reporting-footprint-hourly-demand-2024.csv.gz"

    ba_count = 0
    ba_keys = set()
    ba_observations = Counter()
    missing_demand = 0
    for row in rows(ba_path, True):
        ba_count += 1
        key = (row["balancing_authority"], row["utc_time_end"])
        if key in ba_keys:
            raise AssertionError(f"Duplicate BA-hour: {key}")
        ba_keys.add(key)
        if row["demand_selected_mw"]:
            float(row["demand_selected_mw"])
            ba_observations[row["balancing_authority"]] += 1
        else:
            missing_demand += 1
            if row["selection_basis"] != "missing":
                raise AssertionError(f"Missing demand with nonmissing basis: {key}")
    if ba_count != coverage["balancing_authority_rows"]:
        raise AssertionError((ba_count, coverage["balancing_authority_rows"]))
    if missing_demand != coverage["demand_selection_counts"]["missing"]:
        raise AssertionError((missing_demand, coverage["demand_selection_counts"]["missing"]))

    sub_count = 0
    sub_keys = set()
    for row in rows(sub_path, True):
        sub_count += 1
        key = (row["balancing_authority"], row["subregion"], row["utc_time_end"])
        if key in sub_keys:
            raise AssertionError(f"Duplicate subregion-hour: {key}")
        sub_keys.add(key)
        if row["demand_mw"]:
            float(row["demand_mw"])
    if sub_count != coverage["subregion_rows"]:
        raise AssertionError((sub_count, coverage["subregion_rows"]))

    complete_national = 0
    aggregate_keys = set()
    for row in rows(agg_path, True):
        key = (row["geography_type"], row["geography_code"], row["utc_time_end"])
        if key in aggregate_keys:
            raise AssertionError(f"Duplicate aggregate hour: {key}")
        aggregate_keys.add(key)
        float(row["demand_mw"])
        if (
            row["geography_type"] == "eia_930_reporting_footprint"
            and row["complete_coincident_coverage"] == "true"
        ):
            complete_national += 1
    if complete_national != coverage["complete_all_BA_coincident_UTC_hours"]:
        raise AssertionError((complete_national, coverage["complete_all_BA_coincident_UTC_hours"]))

    summaries = list(rows(OUT / "load-shape-summary-2024.csv"))
    profiles = list(rows(OUT / "average-hourly-load-profiles-2024.csv"))
    if len(summaries) != 150:
        raise AssertionError(f"Expected 150 summary records, found {len(summaries)}")
    if not any(row["geography_code"] == "EIA930-US" for row in summaries):
        raise AssertionError("Missing EIA-930 reporting-footprint summary")
    if not profiles:
        raise AssertionError("No average hourly profiles")
    print(json.dumps({
        "status": "pass",
        "balancing_authority_rows": ba_count,
        "subregion_rows": sub_count,
        "aggregate_rows": len(aggregate_keys),
        "summary_rows": len(summaries),
        "profile_rows": len(profiles),
        "complete_national_utc_hours": complete_national,
    }, indent=2))


if __name__ == "__main__":
    main()
