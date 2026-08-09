"""Normalize EIA-930 calendar-year 2024 balancing-authority load data.

The raw files are EIA's six-month CSV downloads.  UTC is the canonical key for
coincident-load aggregation.  Local hour-ending timestamps are retained for
within-geography daily profiles and are never used to join different BAs.
"""

from __future__ import annotations

import csv
import gzip
import hashlib
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from statistics import fmean


TS = Path(__file__).resolve().parents[1]
RAW = TS / "raw"
OUT = TS / "normalized"
OUT.mkdir(parents=True, exist_ok=True)

BALANCE_FILES = (
    "EIA930_BALANCE_2024_Jan_Jun.csv",
    "EIA930_BALANCE_2024_Jul_Dec.csv",
)
SUBREGION_FILES = (
    "EIA930_SUBREGION_2024_Jan_Jun.csv",
    "EIA930_SUBREGION_2024_Jul_Dec.csv",
)
TIME_FORMAT = "%m/%d/%Y %I:%M:%S %p"


def number(value: str):
    value = (value or "").strip()
    if not value:
        return None
    return float(value)


def display_number(value):
    if value is None:
        return ""
    return f"{value:.6f}".rstrip("0").rstrip(".")


def iso_time(value: str) -> str:
    return datetime.strptime(value, TIME_FORMAT).isoformat(timespec="minutes")


def choose_demand(row):
    """Use EIA's adjusted series first, then imputed, then reported."""
    choices = (
        ("adjusted", number(row.get("Demand (MW) (Adjusted)", ""))),
        ("imputed", number(row.get("Demand (MW) (Imputed)", ""))),
        ("reported", number(row.get("Demand (MW)", ""))),
    )
    for label, value in choices:
        if value is not None:
            return value, label
    return None, "missing"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_gzip_csv(path: Path, fields, rows):
    with gzip.open(path, "wt", encoding="utf-8", newline="", compresslevel=9) as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def summarize_series(scope, code, name, parent, clock_basis, records):
    ordered = sorted(records, key=lambda item: item[0])
    values = [item[1] for item in ordered]
    maximum = max(ordered, key=lambda item: item[1])
    minimum = min(ordered, key=lambda item: item[1])
    ramps = [
        (ordered[index][1] - ordered[index - 1][1], ordered[index][0])
        for index in range(1, len(ordered))
        if (ordered[index][0] - ordered[index - 1][0]).total_seconds() == 3600
    ]
    up = max(ramps, key=lambda item: item[0]) if ramps else (None, None)
    down = min(ramps, key=lambda item: item[0]) if ramps else (None, None)
    peak = maximum[1]
    return {
        "geography_type": scope,
        "geography_code": code,
        "geography_name": name,
        "parent_geography": parent,
        "clock_basis": clock_basis,
        "observation_count": len(values),
        "mean_demand_mw": round(fmean(values), 3),
        "minimum_demand_mw": round(minimum[1], 3),
        "minimum_time_end": minimum[0].isoformat(timespec="minutes"),
        "peak_demand_mw": round(peak, 3),
        "peak_time_end": maximum[0].isoformat(timespec="minutes"),
        "load_factor_mean_divided_by_peak": round(fmean(values) / peak, 6),
        "maximum_one_hour_increase_mw": round(up[0], 3) if up[0] is not None else "",
        "maximum_one_hour_increase_time_end": up[1].isoformat(timespec="minutes") if up[1] else "",
        "maximum_one_hour_decrease_mw": round(down[0], 3) if down[0] is not None else "",
        "maximum_one_hour_decrease_time_end": down[1].isoformat(timespec="minutes") if down[1] else "",
        "unit": "MW",
        "source_id": "SRC-EIA-930",
    }


def build_profiles(profile_inputs):
    buckets = defaultdict(list)
    for scope, code, clock_basis, timestamp, value in profile_inputs:
        month = timestamp.month
        season = (
            "winter" if month in (12, 1, 2) else
            "spring" if month in (3, 4, 5) else
            "summer" if month in (6, 7, 8) else "autumn"
        )
        hour_ending = timestamp.hour or 24
        day_type = "weekend" if timestamp.weekday() >= 5 else "weekday"
        buckets[(scope, code, clock_basis, "annual", "all", "all", hour_ending)].append(value)
        buckets[(scope, code, clock_basis, "month", str(month), "all", hour_ending)].append(value)
        buckets[(scope, code, clock_basis, "season", season, "all", hour_ending)].append(value)
        buckets[(scope, code, clock_basis, "annual", "all", day_type, hour_ending)].append(value)
    output = []
    for key, values in sorted(buckets.items()):
        scope, code, clock_basis, period_type, period, day_type, hour_ending = key
        output.append({
            "geography_type": scope,
            "geography_code": code,
            "clock_basis": clock_basis,
            "period_type": period_type,
            "period": period,
            "day_type": day_type,
            "hour_ending": hour_ending,
            "mean_demand_mw": round(fmean(values), 3),
            "minimum_demand_mw": round(min(values), 3),
            "maximum_demand_mw": round(max(values), 3),
            "observation_count": len(values),
            "unit": "MW",
            "source_id": "SRC-EIA-930",
        })
    return output


def normalize_balance():
    fields = [
        "dataset_id", "source_id", "balancing_authority", "region", "data_date",
        "hour_number", "local_time_end", "utc_time_end", "demand_reported_mw",
        "demand_imputed_mw", "demand_adjusted_mw", "demand_selected_mw",
        "selection_basis", "demand_forecast_mw", "net_generation_adjusted_mw",
        "total_interchange_adjusted_mw", "source_file",
    ]
    rows = []
    ba_series = defaultdict(list)
    ba_names = {}
    region_by_ba = {}
    region_hour = defaultdict(float)
    region_hour_counts = defaultdict(int)
    total_hour = defaultdict(float)
    total_hour_counts = defaultdict(int)
    selections = defaultdict(int)
    profile_inputs = []
    ba_row_counts = defaultdict(int)

    for filename in BALANCE_FILES:
        with (RAW / filename).open("r", encoding="utf-8-sig", newline="") as handle:
            for source in csv.DictReader(handle):
                demand, basis = choose_demand(source)
                ba = source["Balancing Authority"].strip()
                region = source["Region"].strip()
                local = datetime.strptime(source["Local Time at End of Hour"], TIME_FORMAT)
                utc = datetime.strptime(source["UTC Time at End of Hour"], TIME_FORMAT)
                ba_row_counts[ba] += 1
                selections[basis] += 1
                ba_names[ba] = ba
                region_by_ba[ba] = region
                if demand is not None:
                    ba_series[ba].append((utc, demand))
                    region_hour[(region, utc)] += demand
                    region_hour_counts[(region, utc)] += 1
                    total_hour[utc] += demand
                    total_hour_counts[utc] += 1
                    profile_inputs.append(("balancing_authority", ba, "local_hour_ending", local, demand))
                rows.append({
                    "dataset_id": "DS-EIA-930-LOAD-2024",
                    "source_id": "SRC-EIA-930",
                    "balancing_authority": ba,
                    "region": region,
                    "data_date": source["Data Date"],
                    "hour_number": source["Hour Number"],
                    "local_time_end": local.isoformat(timespec="minutes"),
                    "utc_time_end": utc.isoformat(timespec="minutes") + "Z",
                    "demand_reported_mw": display_number(number(source.get("Demand (MW)", ""))),
                    "demand_imputed_mw": display_number(number(source.get("Demand (MW) (Imputed)", ""))),
                    "demand_adjusted_mw": display_number(number(source.get("Demand (MW) (Adjusted)", ""))),
                    "demand_selected_mw": display_number(demand),
                    "selection_basis": basis,
                    "demand_forecast_mw": display_number(number(source.get("Demand Forecast (MW)", ""))),
                    "net_generation_adjusted_mw": display_number(number(source.get("Net Generation (MW) (Adjusted)", ""))),
                    "total_interchange_adjusted_mw": display_number(number(source.get("Total Interchange (MW) (Adjusted)", ""))),
                    "source_file": filename,
                })
    rows.sort(key=lambda row: (row["balancing_authority"], row["utc_time_end"]))
    write_gzip_csv(OUT / "us-balancing-authority-hourly-demand-2024.csv.gz", fields, rows)

    if any(count != 8784 for count in ba_row_counts.values()):
        raise AssertionError("Every balancing authority must have 8,784 source rows")
    if len(ba_row_counts) != 61:
        raise AssertionError(f"Expected 61 balancing authorities, found {len(ba_row_counts)}")
    if len(ba_series) != 53:
        raise AssertionError(f"Expected 53 demand-reporting balancing authorities, found {len(ba_series)}")

    region_members = defaultdict(set)
    for ba in ba_series:
        region_members[region_by_ba[ba]].add(ba)
    aggregate_rows = []
    region_series = defaultdict(list)
    for (region, utc), value in sorted(region_hour.items()):
        complete = region_hour_counts[(region, utc)] == len(region_members[region])
        if complete:
            region_series[region].append((utc, value))
            profile_inputs.append(("eia_region", region, "utc_hour_ending", utc, value))
        aggregate_rows.append({
            "geography_type": "eia_region",
            "geography_code": region,
            "utc_time_end": utc.isoformat(timespec="minutes") + "Z",
            "demand_mw": round(value, 3),
            "reporting_units": region_hour_counts[(region, utc)],
            "expected_reporting_units": len(region_members[region]),
            "complete_coincident_coverage": str(complete).lower(),
            "source_id": "SRC-EIA-930",
        })

    total_series = []
    for utc, value in sorted(total_hour.items()):
        complete = total_hour_counts[utc] == len(ba_series)
        if complete:
            total_series.append((utc, value))
            profile_inputs.append(("eia_930_reporting_footprint", "EIA930-US", "utc_hour_ending", utc, value))
        aggregate_rows.append({
            "geography_type": "eia_930_reporting_footprint",
            "geography_code": "EIA930-US",
            "utc_time_end": utc.isoformat(timespec="minutes") + "Z",
            "demand_mw": round(value, 3),
            "reporting_units": total_hour_counts[utc],
            "expected_reporting_units": len(ba_series),
            "complete_coincident_coverage": str(complete).lower(),
            "source_id": "SRC-EIA-930",
        })
    aggregate_fields = list(aggregate_rows[0])
    write_gzip_csv(OUT / "us-region-and-reporting-footprint-hourly-demand-2024.csv.gz", aggregate_fields, aggregate_rows)

    summaries = []
    for ba, records in ba_series.items():
        summaries.append(summarize_series(
            "balancing_authority", ba, ba_names[ba], region_by_ba[ba], "UTC", records
        ))
    for region, records in region_series.items():
        summaries.append(summarize_series("eia_region", region, region, "United States", "UTC", records))
    summaries.append(summarize_series(
        "eia_930_reporting_footprint", "EIA930-US", "EIA-930 reporting footprint",
        "United States", "UTC", total_series
    ))
    no_demand_bas = sorted(set(ba_row_counts) - set(ba_series))
    partial_demand_bas = {
        ba: len(records) for ba, records in sorted(ba_series.items()) if len(records) != 8784
    }
    return (
        summaries, profile_inputs, selections, region_members, len(total_series),
        no_demand_bas, partial_demand_bas,
    )


def normalize_subregions():
    fields = [
        "dataset_id", "source_id", "balancing_authority", "subregion",
        "data_date", "hour_number", "local_time_end", "utc_time_end",
        "demand_mw", "source_file",
    ]
    rows = []
    series = defaultdict(list)
    parents = {}
    profiles = []
    source_counts = defaultdict(int)
    for filename in SUBREGION_FILES:
        with (RAW / filename).open("r", encoding="utf-8-sig", newline="") as handle:
            for source in csv.DictReader(handle):
                value = number(source["Demand (MW)"])
                ba = source["Balancing Authority"].strip()
                subregion = source["Sub-Region"].strip()
                code = f"{ba}:{subregion}"
                local = datetime.strptime(source["Local Time at End of Hour"], TIME_FORMAT)
                utc = datetime.strptime(source["UTC Time at End of Hour"], TIME_FORMAT)
                parents[code] = ba
                source_counts[code] += 1
                if value is not None:
                    series[code].append((utc, value))
                    profiles.append(("subregion", code, "local_hour_ending", local, value))
                rows.append({
                    "dataset_id": "DS-EIA-930-SUBREGION-LOAD-2024",
                    "source_id": "SRC-EIA-930",
                    "balancing_authority": ba,
                    "subregion": subregion,
                    "data_date": source["Data Date"],
                    "hour_number": source["Hour Number"],
                    "local_time_end": local.isoformat(timespec="minutes"),
                    "utc_time_end": utc.isoformat(timespec="minutes") + "Z",
                    "demand_mw": display_number(value),
                    "source_file": filename,
                })
    rows.sort(key=lambda row: (row["balancing_authority"], row["subregion"], row["utc_time_end"]))
    write_gzip_csv(OUT / "us-subregion-hourly-demand-2024.csv.gz", fields, rows)
    if any(count != 8784 for count in source_counts.values()):
        raise AssertionError("Every subregion must have 8,784 source rows")
    if len(source_counts) != 83:
        raise AssertionError(f"Expected 83 BA-subregions, found {len(source_counts)}")
    summaries = [
        summarize_series("subregion", code, code, parents[code], "UTC", records)
        for code, records in series.items()
    ]
    return summaries, profiles


def main():
    (
        balance_summaries, balance_profiles, selections, region_members,
        coincident_hours, no_demand_bas, partial_demand_bas,
    ) = normalize_balance()
    subregion_summaries, subregion_profiles = normalize_subregions()
    summaries = sorted(balance_summaries + subregion_summaries, key=lambda row: (row["geography_type"], row["geography_code"]))
    with (OUT / "load-shape-summary-2024.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(summaries[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(summaries)

    profiles = build_profiles(balance_profiles + subregion_profiles)
    with (OUT / "average-hourly-load-profiles-2024.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(profiles[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(profiles)

    raw_files = []
    for filename in BALANCE_FILES + SUBREGION_FILES:
        path = RAW / filename
        raw_files.append({
            "filename": filename,
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
        })
    coverage = {
        "dataset_id": "DS-EIA-930-LOAD-2024",
        "source_id": "SRC-EIA-930",
        "calendar_year": 2024,
        "expected_hours_per_local_reporting_geography": 8784,
        "balancing_authorities": 61,
        "demand_reporting_balancing_authorities": 53,
        "balancing_authorities_with_no_demand_series": no_demand_bas,
        "balancing_authorities_with_partial_demand_series": partial_demand_bas,
        "eia_regions": 13,
        "ba_subregions": 83,
        "balancing_authority_rows": 61 * 8784,
        "subregion_rows": 83 * 8784,
        "complete_all_BA_coincident_UTC_hours": coincident_hours,
        "demand_selection_counts": dict(sorted(selections.items())),
        "region_members": {key: sorted(value) for key, value in sorted(region_members.items())},
        "time_semantics": {
            "canonical_cross_geography_join": "utc_time_end",
            "local_profile_clock": "local_time_end",
            "hour_semantics": "hour ending",
            "edge_rule": "national and regional aggregates expose completeness and summaries exclude incomplete UTC edge hours",
        },
        "raw_files": raw_files,
        "limitations": [
            "EIA-930 is operational demand, not sector-attributed consumption.",
            "BA reporting practices and adjustment methods vary; adjusted values are preferred when present.",
            "The aggregate is the EIA-930 reporting footprint, not a claim of a perfectly bounded Lower-48 control total.",
            "Local calendar-year downloads produce incomplete cross-BA UTC coverage at the beginning and end of the file window.",
            "Subregion identifiers are only unique when paired with balancing authority.",
        ],
    }
    (TS.parent / "coverage.json").write_text(json.dumps(coverage, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "balancing_authority_rows": 61 * 8784,
        "subregion_rows": 83 * 8784,
        "summaries": len(summaries),
        "profiles": len(profiles),
        "complete_all_BA_coincident_UTC_hours": coincident_hours,
        "outputs": [str(path.relative_to(TS.parent.parent)) for path in sorted(OUT.glob("*"))],
    }, indent=2))


if __name__ == "__main__":
    main()
