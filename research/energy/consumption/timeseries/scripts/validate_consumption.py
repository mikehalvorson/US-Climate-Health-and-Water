"""Validate consumption-package provenance, accounting, and selected source values."""

from __future__ import annotations

import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path

import pandas as pd


BASE = Path(__file__).resolve().parents[1]
ENERGY = BASE.parents[1]
RAW = ENERGY / "timeseries" / "raw"
NORMALIZED = BASE / "normalized"

FIELDS = [
    "dataset_id", "source_id", "record_type", "model", "scenario",
    "scenario_family", "geography", "geography_code", "region_level", "year",
    "metric", "sector", "end_use", "accounting_scope", "value", "unit",
    "value_semantics", "source_value", "source_unit", "source_variable",
    "upstream_status", "source_vintage", "source_file",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path):
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != FIELDS:
            raise AssertionError(f"{path.name}: field order/schema mismatch")
        return list(reader)


def near(actual, expected, tolerance=1e-6):
    return abs(float(actual) - float(expected)) <= tolerance


def one(rows, **filters):
    matches = [row for row in rows if all(str(row[key]) == str(value) for key, value in filters.items())]
    if len(matches) != 1:
        raise AssertionError(f"Expected one row for {filters}; found {len(matches)}")
    return matches[0]


def main():
    errors = []
    sources = {record["source_id"] for record in load_json(ENERGY / "sources.json")}
    datasets = {record["dataset_id"] for record in load_json(ENERGY / "datasets.json")["datasets"]}
    coverage = load_json(BASE / "coverage.json")
    rows_by_file = {}

    for entry in coverage["files"]:
        path = BASE / entry["file"]
        rows = load_csv(path)
        rows_by_file[path.name] = rows
        if len(rows) != entry["rows"]:
            errors.append(f"{path.name}: coverage row count mismatch")
        if sha256(path) != entry["sha256"]:
            errors.append(f"{path.name}: coverage checksum mismatch")
        years = [int(row["year"]) for row in rows]
        if min(years) != entry["year_min"] or max(years) != entry["year_max"]:
            errors.append(f"{path.name}: coverage year mismatch")
        for number, row in enumerate(rows, start=2):
            if row["source_id"] not in sources:
                errors.append(f"{path.name}:{number}: unknown source {row['source_id']}")
            if row["dataset_id"] not in datasets:
                errors.append(f"{path.name}:{number}: unknown dataset {row['dataset_id']}")
            if not all(row[field] for field in FIELDS if field not in {"model", "scenario", "scenario_family"}):
                errors.append(f"{path.name}:{number}: required field empty")
            try:
                int(row["year"])
                float(row["value"])
                float(row["source_value"])
            except ValueError:
                errors.append(f"{path.name}:{number}: numeric parse failure")
            if "?C" in " ".join(row.values()) or "Ã" in " ".join(row.values()):
                errors.append(f"{path.name}:{number}: encoding artifact")

    expected_counts = {
        "us-electricity-consumption-history.csv": 507,
        "global-electricity-demand-history-ember-owid.csv": 26,
        "us-electricity-supply-demand-aeo2026.csv": 3146,
        "us-electricity-end-use-aeo2026.csv": 10296,
        "us-demand-drivers-aeo2026.csv": 2860,
        "global-electricity-consumption-ngfs-phase5.1.csv": 3193,
        "global-electricity-supply-demand-ngfs-phase5.1.csv": 903,
        "global-and-us-demand-milestones.csv": 16,
        "us-electrification-scenarios-nrel-efs.csv": 50,
    }
    for filename, count in expected_counts.items():
        if len(rows_by_file.get(filename, [])) != count:
            errors.append(f"{filename}: expected {count} rows")

    mer = rows_by_file["us-electricity-consumption-history.csv"]
    ev = one(mer, year="2025", source_variable="ESVHPUS")
    raw_mer = pd.read_csv(RAW / "eia-mer-table-7.6.csv")
    raw_ev = raw_mer[(raw_mer["MSN"] == "ESVHPUS") & (raw_mer["YYYYMM"] == 202513)]
    if len(raw_ev) != 1 or not near(float(ev["source_value"]), float(raw_ev.iloc[0]["Value"])):
        errors.append("MER 2025 EV value does not match raw source")
    if ev["accounting_scope"] != "overlay_already_in_sector_sales_do_not_add":
        errors.append("MER EV double-counting guard missing")

    world_history = rows_by_file["global-electricity-demand-history-ember-owid.csv"]
    world_2025 = one(world_history, year="2025", source_variable="electricity_demand")
    raw_owid = pd.read_csv(RAW / "owid-energy-data.csv")
    raw_world_2025 = raw_owid[(raw_owid["country"] == "World") & (raw_owid["year"] == 2025)]
    if len(raw_world_2025) != 1 or not near(world_2025["value"], raw_world_2025.iloc[0]["electricity_demand"]):
        errors.append("OWID/Ember World 2025 electricity-demand value mismatch")
    if "gross_generation_plus_net_imports" not in world_2025["accounting_scope"] or "not_final_electricity_consumption" not in world_2025["accounting_scope"]:
        errors.append("OWID/Ember demand accounting-scope guard missing")

    balance = rows_by_file["us-electricity-supply-demand-aeo2026.csv"]
    for scenario in {row["scenario"] for row in balance}:
        for year in range(2025, 2051):
            records = [row for row in balance if row["scenario"] == scenario and int(row["year"]) == year]
            lookup = {(row["metric"], row["sector"]): float(row["value"]) for row in records}
            generation = lookup[("electricity_generation", "total")]
            grid = lookup[("net_generation_to_grid", "total")]
            direct = lookup[("direct_use", "total")]
            sales = lookup[("electricity_sales", "total")]
            use = lookup[("electricity_use", "total")]
            imports = lookup[("net_imports", "total")]
            residual = lookup[("transmission_distribution_and_unaccounted", "total")]
            sector_sales = sum(lookup[("electricity_sales", sector)] for sector in ("residential", "commercial", "industrial", "transportation"))
            for label, actual, expected in (
                ("generation-direct=grid", generation - direct, grid),
                ("sales+direct=use", sales + direct, use),
                ("sector sales=sum", sector_sales, sales),
                ("grid+imports-sales=residual", grid + imports - sales, residual),
            ):
                if not near(actual, expected, 0.002):
                    errors.append(f"AEO {scenario} {year}: {label} failed ({actual} vs {expected})")

    baseline_2050 = {
        ("electricity_generation", "total"): 6273.273926,
        ("net_generation_to_grid", "total"): 5852.875,
        ("net_imports", "total"): 63.683556,
        ("electricity_sales", "residential"): 2016.697998,
        ("electricity_sales", "commercial"): 2298.145996,
        ("electricity_sales", "industrial"): 1250.876953,
        ("electricity_sales", "transportation"): 9.094662,
        ("direct_use", "total"): 420.398804,
        ("electricity_use", "total"): 5995.214844,
    }
    for (metric, sector), expected in baseline_2050.items():
        row = one(balance, scenario="Counterfactual Baseline", year="2050", metric=metric, sector=sector)
        if not near(row["value"], expected, 0.001):
            errors.append(f"AEO baseline 2050 {metric}/{sector}: source transcription mismatch")

    end_uses = rows_by_file["us-electricity-end-use-aeo2026.csv"]
    baseline_dc = one(end_uses, scenario="Counterfactual Baseline", year="2050", end_use="data_center_servers")
    high_dc = one(end_uses, scenario="High Electricity Demand", year="2050", end_use="data_center_servers")
    if not near(baseline_dc["source_value"], 1.5204612, 1e-6) or not near(baseline_dc["value"], 445.6, 0.1):
        errors.append("AEO baseline data-center-server value mismatch")
    if not near(high_dc["source_value"], 2.7934072, 1e-6) or not near(high_dc["value"], 818.7, 0.1):
        errors.append("AEO high-demand data-center-server value mismatch")

    for scenario in {row["scenario"] for row in end_uses}:
        for year in range(2025, 2051):
            industrial = [row for row in end_uses if row["scenario"] == scenario and int(row["year"]) == year and row["sector"] == "industrial"]
            lookup = {row["end_use"]: float(row["value"]) for row in industrial}
            components = sum(lookup[key] for key in ("excluding_refining_and_hydrogen_production", "refining", "hydrogen_production"))
            if not near(components, lookup["total_purchased_electricity"], 0.002):
                errors.append(f"AEO {scenario} {year}: industrial component sum failed")

    ngfs = rows_by_file["global-electricity-consumption-ngfs-phase5.1.csv"]
    if len({row["model"] for row in ngfs}) != 3 or len({row["scenario"] for row in ngfs}) != 7:
        errors.append("NGFS model/scenario coverage mismatch")
    if not {2050, 2060, 2070}.issubset({int(row["year"]) for row in ngfs}):
        errors.append("NGFS required comparison years missing")
    if any("hierarchy=" not in row["accounting_scope"] for row in ngfs):
        errors.append("NGFS hierarchy guard missing")

    ngfs_balance = rows_by_file["global-electricity-supply-demand-ngfs-phase5.1.csv"]
    grouped = defaultdict(dict)
    for row in ngfs_balance:
        grouped[(row["model"], row["scenario"], int(row["year"]))][row["metric"]] = float(row["value"])
    if len(grouped) != 301:
        errors.append("NGFS generation-consumption bridge coverage mismatch")
    for key, values in grouped.items():
        expected_gap = values["electricity_generation"] - values["final_electricity_consumption"]
        if not near(expected_gap, values["generation_minus_final_consumption"], 0.00001):
            errors.append(f"NGFS {key}: supply-demand accounting gap failed")

    efs = rows_by_file["us-electrification-scenarios-nrel-efs.csv"]
    for scenario in {row["scenario"] for row in efs if int(row["year"]) == 2050}:
        records = [row for row in efs if row["scenario"] == scenario]
        total = float(one(records, sector="total")["value"])
        sectors = sum(float(one(records, sector=sector)["value"]) for sector in ("transportation", "residential", "commercial", "industrial"))
        if not near(total, sectors, 2.0):
            errors.append(f"NREL EFS {scenario}: rounded sector sum differs materially from total")

    milestones = rows_by_file["global-and-us-demand-milestones.csv"]
    lbnl_low = one(milestones, dataset_id="DS-LBNL-DATACENTER24", year="2028", value_semantics="range_low")
    lbnl_high = one(milestones, dataset_id="DS-LBNL-DATACENTER24", year="2028", value_semantics="range_high")
    if not near(lbnl_low["value"], 325) or not near(lbnl_high["value"], 580):
        errors.append("LBNL 2028 range mismatch")
    if any(row["end_use"] in {"road_electric_vehicles", "data_centers_total_facility"} and "already_part" not in row["accounting_scope"] and row["dataset_id"] == "DS-IEA-GEVO26" for row in milestones):
        errors.append("IEA EV non-additivity guard missing")

    statistics = load_json(BASE.parent / "scenario-statistics.json")
    observed_total = float(one(mer, year="2025", metric="electricity_use", sector="total")["value"])
    if not near(statistics["us_observed_2025"]["total_electricity_use"], observed_total, 0.001):
        errors.append("scenario-statistics U.S. 2025 total mismatch")
    stats_world_2025 = next(entry["value"] for entry in statistics["global_historical_system_demand"]["values"] if entry["year"] == 2025)
    if not near(stats_world_2025, world_2025["value"], 0.001):
        errors.append("scenario-statistics World 2025 system-demand mismatch")
    aeo_stats = {entry["metric"]: entry for entry in statistics["us_aeo2026_2050"]["system_ranges"]}
    for metric in ("electricity_generation", "electricity_use", "electricity_sales"):
        values = [float(row["value"]) for row in balance if int(row["year"]) == 2050 and row["metric"] == metric and row["sector"] == "total"]
        if not near(aeo_stats[metric]["minimum"], min(values), 0.001) or not near(aeo_stats[metric]["maximum"], max(values), 0.001):
            errors.append(f"scenario-statistics AEO {metric} range mismatch")
    ngfs_stats = {entry["year"]: entry for entry in statistics["global_ngfs_final_electricity"]["ranges_across_all_model_scenario_pairs"]}
    for year in (2030, 2050, 2070):
        values = [float(row["value"]) for row in ngfs if int(row["year"]) == year and row["sector"] == "total" and row["end_use"] == "all_electricity"]
        if not near(ngfs_stats[year]["minimum"], min(values), 0.001) or not near(ngfs_stats[year]["maximum"], max(values), 0.001):
            errors.append(f"scenario-statistics NGFS {year} range mismatch")

    if coverage["total_rows"] != sum(entry["rows"] for entry in coverage["files"]):
        errors.append("coverage total_rows mismatch")

    if errors:
        raise AssertionError("\n".join(errors))
    print(f"PASS: {coverage['total_rows']:,} rows, {len(coverage['files'])} normalized files, accounting identities and source spot checks verified")


if __name__ == "__main__":
    main()
