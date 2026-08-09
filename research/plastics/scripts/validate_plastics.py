#!/usr/bin/env python3
"""Offline structural, citation, and calculation checks for the plastics package."""

from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LITERS_PER_US_GALLON = 3.785411784


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def close(actual: float, expected: float, rel: float = 1e-6, abs_tol: float = 0.02) -> bool:
    return math.isclose(actual, expected, rel_tol=rel, abs_tol=abs_tol)


def walk_source_refs(node):
    if isinstance(node, dict):
        if isinstance(node.get("source_id"), str):
            yield node["source_id"]
        if isinstance(node.get("source_ids"), list):
            yield from (item for item in node["source_ids"] if isinstance(item, str))
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

    require(sources_doc["source_count"] == len(sources), "Declared source_count mismatch", errors)
    require(len(source_ids) == len(source_set), "Duplicate source_id", errors)
    for source in sources:
        source_id = source["source_id"]
        require(source.get("url", "").startswith("https://"), f"Missing HTTPS URL: {source_id}", errors)
        require(bool(source.get("title")), f"Missing title: {source_id}", errors)
        require(bool(source.get("publisher")), f"Missing publisher: {source_id}", errors)
        require(bool(source.get("supports")), f"Missing supports: {source_id}", errors)
        require(bool(source.get("limitations")), f"Missing limitations: {source_id}", errors)
        verification = source.get("verification", {})
        require(bool(verification.get("identity")), f"Missing identity check: {source_id}", errors)
        require(bool(verification.get("fidelity")), f"Missing fidelity check: {source_id}", errors)

    for relative in manifest["normative_files"]:
        require((ROOT / relative).is_file(), f"Manifest file missing: {relative}", errors)

    json_paths = sorted(ROOT.rglob("*.json"))
    parsed: dict[Path, object] = {}
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
        require(bool(claim.get("dashboard_text")), f"Claim lacks dashboard text: {claim['claim_id']}", errors)
        require(bool(claim.get("source_refs")), f"Claim lacks sources: {claim['claim_id']}", errors)
        require(bool(claim.get("misuse_guardrail")), f"Claim lacks guardrail: {claim['claim_id']}", errors)

    audit_rows = load_json(ROOT / "source-verification.json")["audits"]
    audits = {row["claim_id"]: row for row in audit_rows}
    require(len(audits) == len(audit_rows), "Duplicate verification claim_id", errors)
    require(set(audits) == set(claim_ids), "Verification claim set differs from claims.json", errors)
    for claim_id, audit in audits.items():
        checks = audit.get("checks", [])
        require(len(checks) == 3, f"{claim_id} must have exactly three checks", errors)
        require({row.get("check") for row in checks} == {1, 2, 3}, f"{claim_id} checks must be 1,2,3", errors)
        require(all(bool(row.get("evidence")) for row in checks), f"{claim_id} has blank evidence", errors)

    flows = load_json(ROOT / "us-material-flows.json")
    ranks = flows["leading_resins_by_consumption"]
    require([row["rank"] for row in ranks] == [1, 2, 3, 4], "Resin ranks changed", errors)
    require([row["resin_id"] for row in ranks] == ["PP", "HDPE", "LLDPE", "PVC"], "Leading resin order changed", errors)
    require(sum(row["percent"] for row in flows["disposal_destination_percent_of_48_mmt"]) == 100, "Disposal shares do not sum to 100", errors)
    epa = flows["separate_epa_msw_baseline"]
    require(close(epa["recycled"] + epa["combusted_with_energy_recovery"] + epa["landfilled"], epa["generated"]), "EPA MSW arithmetic mismatch", errors)

    water = load_json(ROOT / "water-intensities.json")
    catalog_ids = {row["resin_id"] for row in load_json(ROOT / "resin-catalog.json")["resins"]}
    coverage_ids = {row["resin_id"] for row in water["coverage_by_resin"]}
    require(coverage_ids == catalog_ids, "Water coverage matrix differs from resin catalog", errors)
    expected_ranges = {"PET": (3.3, 23.5, 44.4), "HDPE": (5.9, 12.8, 24.1), "PP": (5.2, 11.7, 20.5)}
    water_lookup = {row["resin_id"]: row for row in water["four_database_figure_estimates"]}
    for resin, (low, central, high) in expected_ranges.items():
        row = water_lookup[resin]
        require(close(row["minimum"], low), f"{resin} low water changed", errors)
        require(close(row["cross_database_mean_approximate"], central), f"{resin} central water changed", errors)
        require(close(row["maximum"], high), f"{resin} high water changed", errors)
        require(row["minimum"] <= row["cross_database_mean_approximate"] <= row["maximum"], f"{resin} range order invalid", errors)

    with (ROOT / "scenarios" / "gross-water-avoidance.csv").open("r", encoding="utf-8", newline="") as handle:
        scenario_rows = list(csv.DictReader(handle))
    require(len(scenario_rows) >= 9, "Gross-water scenario table unexpectedly short", errors)
    for row in scenario_rows:
        mass = float(row["mass_avoided_kg"])
        for label in ("low", "central", "high"):
            intensity = float(row[f"intensity_{label}_l_per_kg"])
            liters = float(row[f"gross_{label}_liters"])
            gallons = float(row[f"gross_{label}_us_gallons"])
            require(close(liters, mass * intensity, abs_tol=1.0), f"{row['scenario_id']} {label} liter mismatch", errors)
            require(close(gallons, liters / LITERS_PER_US_GALLON, abs_tol=1.0), f"{row['scenario_id']} {label} gallon mismatch", errors)
        require("not_net" in row["status"], f"Scenario lacks not-net status: {row['scenario_id']}", errors)
        require(row["source_id"] in source_set, f"Unknown CSV source: {row['scenario_id']}", errors)

    seaweed = load_json(ROOT / "seaweed.json")
    baseline = seaweed["resource_context"]["doe_screened_model"]["modeled_supply_at_or_below_1000_usd_per_dry_ton_billion_metric_tons_per_year"] * 1000
    us_total = flows["primary_baseline"]["domestic_consumption"]
    for row in seaweed["illustrative_conversion_scenarios_not_forecasts"]:
        expected_material = baseline * row["share_to_bioplastic_percent"] / 100 * row["finished_polymer_yield_percent_of_dry_biomass"] / 100
        expected_share = 100 * expected_material / us_total
        require(close(row["doe_modeled_dry_biomass_mmt_per_year"], baseline), f"Seaweed baseline mismatch: {row['scenario_id']}", errors)
        require(close(row["finished_material_mmt_per_year"], expected_material), f"Seaweed output mismatch: {row['scenario_id']}", errors)
        require(close(row["share_of_2019_us_plastic_consumption_percent"], expected_share, rel=0.001), f"Seaweed share mismatch: {row['scenario_id']}", errors)

    health = load_json(ROOT / "health-evidence.json")
    require(health["pregnancy_vaccine_claim_audit"]["verdict"] == "misstated_entity_and_overstated_outcome", "Vaccine correction verdict changed", errors)

    forbidden_dashboard_phrases = [
        "vaccines didn't take",
        "microplastics made vaccines fail",
        "all plastics are toxic",
        "seaweed plastic uses no water",
        "is plastic-free",
        "water saved by banning plastic",
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
        "PASS: plastics package validated "
        f"({len(source_ids)} sources, {len(claim_ids)} claims, {len(audit_rows)} triple-check audits, "
        f"{len(scenario_rows)} water scenarios, {len(json_paths)} JSON files)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
