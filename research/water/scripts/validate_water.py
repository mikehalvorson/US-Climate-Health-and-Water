#!/usr/bin/env python3
"""Validate the machine-readable U.S. freshwater evidence package offline."""

from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def close(actual: float, expected: float, rel: float = 0.002, abs_tol: float = 0.01) -> bool:
    return math.isclose(actual, expected, rel_tol=rel, abs_tol=abs_tol)


def walk_source_refs(node):
    if isinstance(node, dict):
        if isinstance(node.get("source_id"), str):
            yield node["source_id"]
        if isinstance(node.get("source_ids"), list):
            for item in node["source_ids"]:
                if isinstance(item, str):
                    yield item
        for value in node.values():
            yield from walk_source_refs(value)
    elif isinstance(node, list):
        for value in node:
            yield from walk_source_refs(value)


def main() -> int:
    errors: list[str] = []
    manifest = load_json(ROOT / "manifest.json")
    sources_doc = load_json(ROOT / "sources.json")
    sources = sources_doc["sources"]
    source_ids = [row["source_id"] for row in sources]
    source_set = set(source_ids)

    require(len(source_ids) == len(source_set), "Duplicate source_id", errors)
    for source in sources:
        require(source.get("url", "").startswith("https://"), f"Non-HTTPS or missing URL: {source['source_id']}", errors)
        require(bool(source.get("title")), f"Missing title: {source['source_id']}", errors)
        require(bool(source.get("publisher")), f"Missing publisher: {source['source_id']}", errors)
        require(bool(source.get("limitations")), f"Missing limitations: {source['source_id']}", errors)

    for rel in manifest["normative_files"]:
        require((ROOT / rel).is_file(), f"Manifest file missing: {rel}", errors)

    json_paths = sorted(ROOT.rglob("*.json"))
    parsed = {}
    for path in json_paths:
        try:
            parsed[path] = load_json(path)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"Invalid JSON {path.relative_to(ROOT)}: {exc}")
    for path, document in parsed.items():
        if path.name == "sources.json":
            continue
        for source_id in walk_source_refs(document):
            require(source_id in source_set, f"Unknown source_id {source_id} in {path.relative_to(ROOT)}", errors)

    claims_doc = load_json(ROOT / "claims.json")
    claims = claims_doc["claims"]
    claim_ids = [row["claim_id"] for row in claims]
    require(len(claim_ids) == len(set(claim_ids)), "Duplicate claim_id", errors)
    allowed_status = set(claims_doc["status_vocabulary"])
    for claim in claims:
        require(claim["status"] in allowed_status, f"Invalid status: {claim['claim_id']}", errors)
        require(bool(claim.get("source_refs")), f"Claim lacks source_refs: {claim['claim_id']}", errors)
        require(bool(claim.get("misuse_guardrail")), f"Claim lacks misuse_guardrail: {claim['claim_id']}", errors)

    verification = load_json(ROOT / "source-verification.json")
    audits = {row["claim_id"]: row for row in verification["audits"]}
    require(set(audits) == set(claim_ids), "Verification audit claim set differs from claims.json", errors)
    for claim_id, audit in audits.items():
        checks = audit.get("checks", [])
        require(len(checks) == 3, f"{claim_id} must have exactly three verification checks", errors)
        require({row.get("check") for row in checks} == {1, 2, 3}, f"{claim_id} check numbers must be 1,2,3", errors)
        require(all(bool(row.get("evidence")) for row in checks), f"{claim_id} has empty verification evidence", errors)

    link_check = load_json(ROOT / "source-link-check.json")
    link_results = link_check["results"]
    require(link_results["source_count"] == len(source_ids), "Link-check source count mismatch", errors)
    require(link_results["known_http_404_remaining"] == 0, "Known HTTP 404 remains in source register", errors)
    require(
        link_results["automated_http_200_or_206_final"] + link_results["automation_exceptions_final"] == len(source_ids),
        "Link-check result categories do not cover every source",
        errors,
    )

    national = load_json(ROOT / "national-water-use.json")
    inv = national["inventory_2015"]
    require(close(inv["fresh_surface_water_withdrawals"] + inv["fresh_groundwater_withdrawals"], 280.3), "2015 freshwater source arithmetic changed", errors)
    require(abs(inv["freshwater_withdrawals"] - 280.3) <= 1.0, "2015 freshwater rounded total is inconsistent", errors)
    domestic = next(row for row in inv["categories"] if row["category"] == "domestic_total")
    require(close(sum(domestic["components"].values()), 26.56), "Domestic component sum changed", errors)

    modeled = national["modeled_2010_2020"]
    require(sum(row["withdrawal"] for row in modeled["covered_sectors"]) == modeled["covered_sector_subtotals"]["withdrawal"], "Modeled covered withdrawal subtotal mismatch", errors)
    require(sum(row["consumptive_use"] for row in modeled["covered_sectors"]) == modeled["covered_sector_subtotals"]["consumptive_use"], "Modeled covered consumption subtotal mismatch", errors)
    for row in modeled["covered_sectors"]:
        expected = 100 * row["consumptive_use"] / row["withdrawal"]
        require(abs(expected - row["consumptive_fraction_percent"]) < 0.5, f"Modeled fraction mismatch: {row['sector']}", errors)

    with (ROOT / "timeseries" / "usgs-historical-water-use-1950-2015.csv").open("r", encoding="utf-8", newline="") as handle:
        historical = list(csv.DictReader(handle))
    require(len(historical) == 14, f"Expected 14 historical rows, found {len(historical)}", errors)
    years = [int(row["year"]) for row in historical]
    require(years == sorted(years) and years[0] == 1950 and years[-1] == 2015, "Historical years invalid", errors)
    last = historical[-1]
    require(close(float(last["total_withdrawals_bgd"]), 322), "2015 historical total mismatch", errors)

    dc = load_json(ROOT / "sectors" / "data-centers.json")
    direct = dc["direct_water"]
    converted_2023 = direct["year_2023_billion_liters"] * 1e9 / 3.785411784 / 1e6 / 365
    require(close(converted_2023, direct["year_2023_million_gallons_per_day"]), "Data-center 2023 conversion mismatch", errors)
    for liters, mgd in zip(direct["year_2028_projection_billion_liters"], direct["year_2028_projection_million_gallons_per_day"]):
        converted = liters * 1e9 / 3.785411784 / 1e6 / 365
        require(close(converted, mgd), f"Data-center 2028 conversion mismatch: {liters}", errors)

    ag = load_json(ROOT / "sectors" / "agriculture.json")
    hale = ag["llano_estacado_case"]
    first, last_hale = hale["values"][0]["value"], hale["values"][-1]["value"]
    decline = 100 * (last_hale - first) / first
    require(close(decline, hale["change_2030_to_2080_percent"], rel=0.0005), "Hale County decline calculation mismatch", errors)

    risk = load_json(ROOT / "risk" / "risk-register.json")
    allowed_risk_types = set(risk["risk_type_vocabulary"])
    risk_ids = [row["risk_id"] for row in risk["risks"]]
    require(len(risk_ids) == len(set(risk_ids)), "Duplicate risk_id", errors)
    for row in risk["risks"]:
        require(row["risk_type"] in allowed_risk_types, f"Invalid risk type: {row['risk_id']}", errors)
        require(bool(row.get("source_refs")), f"Risk lacks sources: {row['risk_id']}", errors)

    cities = load_json(ROOT / "risk" / "city-source-dependencies.json")["cities_and_regions"]
    place_ids = [row["place_id"] for row in cities]
    require(len(place_ids) == len(set(place_ids)), "Duplicate place_id", errors)
    require(len(place_ids) >= 15, "City dependency catalog unexpectedly short", errors)

    gallons_to_liters = 3.785411784
    desal_low, desal_high = 3.2, 4.5
    with (ROOT / "timeseries" / "technology-scale-scenarios.csv").open("r", encoding="utf-8", newline="") as handle:
        tech_rows = list(csv.DictReader(handle))
    for row in tech_rows:
        water_lpd = float(row["water_liters_per_day"])
        low, high = float(row["energy_low"]), float(row["energy_high"])
        if row["technology"] == "seawater_reverse_osmosis":
            expected_low_kwh_year = water_lpd / 1000 * 365 * desal_low
            expected_high_kwh_year = water_lpd / 1000 * 365 * desal_high
            divisor = 1e6 if row["energy_unit"] == "gigawatt_hours_per_year" else 1e9
            require(close(low, expected_low_kwh_year / divisor, rel=0.002), f"Desal low energy mismatch: {row['scenario_id']}", errors)
            require(close(high, expected_high_kwh_year / divisor, rel=0.002), f"Desal high energy mismatch: {row['scenario_id']}", errors)
            target_mgd = float(row["target_mgd"])
            require(close(water_lpd, target_mgd * 1e6 * gallons_to_liters, rel=0.0001), f"Desal water conversion mismatch: {row['scenario_id']}", errors)
        elif row["technology"] == "atmospheric_water_generation":
            expected_low_kwh_day = water_lpd / 3.81
            expected_high_kwh_day = water_lpd / 1.70
            divisor = 1e6 if row["energy_unit"] == "gigawatt_hours_per_day" else 1
            require(close(low, expected_low_kwh_day / divisor, rel=0.005), f"AWG low proxy mismatch: {row['scenario_id']}", errors)
            require(close(high, expected_high_kwh_day / divisor, rel=0.005), f"AWG high proxy mismatch: {row['scenario_id']}", errors)

    forbidden_dashboard_phrases = [
        "miami runs out of water by",
        "aquifer empty by 2100",
        "data centers consume 800 billion liters directly",
        "universal water per kilogram",
        "awg is source-free",
    ]
    dashboard_text = "\n".join(str(claim.get("dashboard_text", "")).lower() for claim in claims)
    for phrase in forbidden_dashboard_phrases:
        require(phrase not in dashboard_text, f"Forbidden dashboard phrase: {phrase}", errors)

    if errors:
        print(f"FAIL: {len(errors)} validation error(s)")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "PASS: water package validated "
        f"({len(source_ids)} sources, {len(claim_ids)} claims, {len(risk_ids)} risks, "
        f"{len(place_ids)} place profiles, {len(json_paths)} JSON files)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
