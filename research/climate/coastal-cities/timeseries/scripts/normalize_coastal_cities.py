#!/usr/bin/env python3
"""Build dashboard-ready coastal-city data from retained primary files."""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve()
OUT = HERE.parents[1]
CLIMATE = HERE.parents[3]
RAW = CLIMATE / "timeseries" / "raw"

NOAA_PROJECTIONS = RAW / "noaa-sea-level-rise-datasets-2022" / "SLR_TF U.S. Sea Level Projections.csv"
TREND_FILES = [
    RAW / "noaa-sea-level-trend-virginia-key.json",
    RAW / "noaa-sea-level-trend-new-canal.json",
    RAW / "noaa-sea-level-trend-grand-isle.json",
]
HTF_FILES = [
    RAW / "noaa-htf-decadal-virginia-key.json",
    RAW / "noaa-htf-decadal-grand-isle.json",
]

SCENARIOS = {
    "0.3": "Low",
    "0.5": "Intermediate-Low",
    "1.0": "Intermediate",
    "1.5": "Intermediate-High",
    "2.0": "High",
}
LOCATIONS = {
    "VIRGINIA_KEY": {"location_id": "virginia_key", "display_name": "Virginia Key, FL", "location_type": "tide_gauge", "geographic_guardrail": "Miami-area indicator; not the City of Miami polygon"},
    "GRAND_ISLE": {"location_id": "grand_isle", "display_name": "Grand Isle, LA", "location_type": "tide_gauge", "geographic_guardrail": "Coastal Louisiana indicator; not New Orleans"},
    "grid_30.0_270.0": {"location_id": "grid_30n_90w", "display_name": "30 N / 90 W grid near New Orleans", "location_type": "one_degree_grid", "geographic_guardrail": "One-degree grid; not a parcel or municipal depth map"},
}


def write_csv(name: str, fieldnames: list[str], rows: list[dict]) -> None:
    with (OUT / name).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def projection_reader():
    lines = NOAA_PROJECTIONS.read_text(encoding="utf-8-sig").splitlines()
    header_index = next(i for i, line in enumerate(lines) if line.startswith("PSMSL Site,"))
    return csv.DictReader(lines[header_index:])


def build_slr() -> None:
    years = list(range(2020, 2101, 10))
    rows = []
    for row in projection_reader():
        site = row.get("PSMSL Site")
        scenario_raw = row.get("Scenario", "")
        if site not in LOCATIONS or not scenario_raw.endswith(" - MED"):
            continue
        scenario_target = scenario_raw.split(" ", 1)[0]
        meta = LOCATIONS[site]
        baseline_cm = float(row["RSL2020 (cm)"])
        for year in years:
            cm = float(row[f"RSL{year} (cm)"])
            rows.append({
                **meta,
                "latitude": row["Lat"],
                "longitude": row["Long"],
                "global_scenario_2100_m": scenario_target,
                "scenario": SCENARIOS[scenario_target],
                "quantile": "median",
                "year": year,
                "relative_sea_level_m": f"{cm / 100:.2f}",
                "change_from_2020_m": f"{(cm - baseline_cm) / 100:.2f}",
                "vlm_contribution_cm_per_year": row["RSL contribution from VLM (trend: cm/year)"],
                "source_id": "NOAA-SLR-ITF-2022",
            })
    rows.sort(key=lambda x: (x["location_id"], float(x["global_scenario_2100_m"]), int(x["year"])))
    write_csv("noaa-relative-sea-level-scenarios.csv", list(rows[0]), rows)


def build_htf() -> None:
    key_map = {"low": "Low", "intLow": "Intermediate-Low", "intermediate": "Intermediate", "intHigh": "Intermediate-High", "high": "High"}
    severity_definition = {"minor": "disruptive", "moderate": "typically damaging", "major": "often destructive"}
    rows = []
    for path in HTF_FILES:
        doc = json.loads(path.read_text(encoding="utf-8"))
        location_id = "virginia_key" if doc["stnId"] == "8723214" else "grand_isle"
        guardrail = "Miami-area tide gauge; threshold days are not citywide flood days" if location_id == "virginia_key" else "Coastal Louisiana tide gauge; not New Orleans"
        for group in doc["DecadalProjection"]:
            for severity, projections in group.items():
                for item in projections:
                    for source_key, scenario in key_map.items():
                        rows.append({
                            "location_id": location_id,
                            "station_id": doc["stnId"],
                            "station_name": doc["stnName"],
                            "latitude": doc["lat"],
                            "longitude": doc["lon"],
                            "severity": severity,
                            "severity_definition": severity_definition[severity],
                            "decade": item["decade"],
                            "scenario": scenario,
                            "days_per_year": item[source_key],
                            "geographic_guardrail": guardrail,
                            "source_id": "NOAA-COOPS-DPAPI",
                        })
    rows.sort(key=lambda x: (x["location_id"], x["severity"], int(x["decade"]), x["scenario"]))
    write_csv("noaa-high-tide-flood-days.csv", list(rows[0]), rows)


def build_trends() -> None:
    rows = []
    for path in TREND_FILES:
        item = json.loads(path.read_text(encoding="utf-8"))["SeaLvlTrends"][0]
        location_id = {"8723214": "virginia_key", "8761927": "new_canal_station", "8761724": "grand_isle"}[item["stationId"]]
        guardrail = {"virginia_key": "Miami-area tide gauge", "new_canal_station": "New Orleans station", "grand_isle": "Coastal Louisiana station; not New Orleans"}[location_id]
        rows.append({
            "location_id": location_id,
            "station_id": item["stationId"],
            "station_name": item["stationName"],
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "start_date": item["startDate"],
            "end_date": item["endDate"],
            "trend_mm_per_year": f"{item['trend'] * 2.54:.4f}",
            "trend_error_mm_per_year": f"{item['trendError'] * 2.54:.4f}",
            "original_trend_inches_per_decade": item["trend"],
            "original_error_inches_per_decade": item["trendError"],
            "interpretation": "observed relative trend; combines ocean change and land motion; not a forecast",
            "geographic_guardrail": guardrail,
            "source_id": "NOAA-COOPS-DPAPI",
        })
    write_csv("observed-relative-sea-level-trends.csv", list(rows[0]), rows)


def build_migration() -> None:
    values = [
        ("Austin, TX", "no_adaptation", 818938, 243821), ("Austin, TX", "adaptation", 625627, 179186),
        ("Orlando, FL", "no_adaptation", 461411, 62665), ("Orlando, FL", "adaptation", 369120, 38834),
        ("Atlanta, GA", "no_adaptation", 320937, 131984), ("Atlanta, GA", "adaptation", 248684, 68868),
        ("New Orleans, LA", "no_adaptation", -500011, 24053), ("New Orleans, LA", "adaptation", -373283, 10733),
        ("Miami, FL", "no_adaptation", -2509978, 155119), ("Miami, FL", "adaptation", -2009263, 95845),
    ]
    rows = []
    for cbsa, adaptation, estimate, interval in values:
        rows.append({
            "cbsa": cbsa,
            "adaptation_variant": adaptation,
            "net_migration_estimate": estimate,
            "interval_plus_minus": interval,
            "interval_low": estimate - interval,
            "interval_high": estimate + interval,
            "horizon": 2100,
            "sea_level_rise_m": 1.8,
            "interpretation": "high-end scenario model output; not forecast",
            "source_id": "NATURE-HAUER-2017",
        })
    write_csv("hauer-2100-cbsa-net-migration.csv", list(rows[0]), rows)


def build_milestones() -> None:
    rows = []
    for scenario, values in {
        "medium_0.9m_by_2100": [(0.3, 2055), (0.6, 2080), (0.9, 2100)],
        "high_1.8m_by_2100": [(0.3, 2042), (0.6, 2059), (0.9, 2071), (1.2, 2082), (1.5, 2091), (1.8, 2100)],
    }.items():
        for rise, year in values:
            rows.append({"scenario": scenario, "sea_level_rise_m": rise, "milestone_year": year, "interpretation": "study scenario milestone; not current NOAA local projection", "source_id": "PLOS-ROBINSON-2020"})
    write_csv("scenario-milestones.csv", list(rows[0]), rows)


def write_hashes() -> None:
    inputs = [NOAA_PROJECTIONS, *TREND_FILES, *HTF_FILES]
    doc = {
        "schema_version": "1.0.0",
        "algorithm": "sha256",
        "files": [{"path": path.relative_to(CLIMATE).as_posix(), "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in inputs],
    }
    (OUT / "raw-file-sha256.json").write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    build_slr()
    build_htf()
    build_trends()
    build_migration()
    build_milestones()
    write_hashes()
    print("PASS: generated coastal-city time series")


if __name__ == "__main__":
    main()
