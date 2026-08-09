#!/usr/bin/env python3
"""Validate the machine-readable climate evidence package without network access."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def walk_source_refs(node):
    if isinstance(node, dict):
        if "source_id" in node:
            yield node["source_id"]
        if isinstance(node.get("source"), str) and node["source"].isupper():
            yield node["source"]
        if isinstance(node.get("sources"), list):
            for item in node["sources"]:
                if isinstance(item, str) and item.isupper():
                    yield item
        for value in node.values():
            yield from walk_source_refs(value)
    elif isinstance(node, list):
        for value in node:
            yield from walk_source_refs(value)


def require(condition: bool, message: str, errors: list[str]):
    if not condition:
        errors.append(message)


def main() -> int:
    errors: list[str] = []
    manifest = load_json(ROOT / "manifest.json")
    sources_doc = load_json(ROOT / "sources.json")
    source_ids = [item["source_id"] for item in sources_doc["sources"]]
    require(len(source_ids) == len(set(source_ids)), "Duplicate source_id", errors)

    for rel in manifest["normative_files"] + manifest["generated_files"]:
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
            require(source_id in source_ids, f"Unknown source_id {source_id} in {path.relative_to(ROOT)}", errors)

    claims_doc = load_json(ROOT / "claims.json")
    claims = claims_doc["claims"]
    claim_ids = [item["claim_id"] for item in claims]
    require(len(claim_ids) == len(set(claim_ids)), "Duplicate claim_id", errors)
    allowed_status = set(claims_doc["status_vocabulary"])
    for claim in claims:
        require(claim["status"] in allowed_status, f"Invalid status for {claim['claim_id']}", errors)
        if claim["status"] != "rejected":
            require(bool(claim.get("source_refs")), f"No source_refs for {claim['claim_id']}", errors)

    verification = load_json(ROOT / "source-verification.json")
    audits = {item["claim_id"]: item for item in verification["audits"]}
    for claim_id in claim_ids:
        require(claim_id in audits, f"Missing verification audit for {claim_id}", errors)
    for claim_id, audit in audits.items():
        checks = audit.get("checks", [])
        require(len(checks) == 3, f"{claim_id} does not have exactly three checks", errors)
        require({item.get("check") for item in checks} == {1, 2, 3}, f"{claim_id} check numbers invalid", errors)

    ladder = load_json(ROOT / "impacts" / "temperature-risk-ladder.json")
    levels = {row["warming_c"]: row["metrics"] for row in ladder["levels"]}
    heat = [levels[w]["one_in_10_year_hot_extreme_frequency_multiplier"] for w in (1.1, 1.5, 2.0, 4.0)]
    require(heat == sorted(heat), "Heat-frequency ladder is not monotonic", errors)
    biodiversity = [levels[w]["terrestrial_species_very_high_extinction_risk_percent_median"] for w in (1.5, 2.0, 3.0, 4.0, 5.0)]
    require(biodiversity == sorted(biodiversity), "Biodiversity-risk medians are not monotonic", errors)

    with (ROOT / "timeseries" / "scenario-warming.csv").open("r", encoding="utf-8", newline="") as handle:
        scenarios = list(csv.DictReader(handle))
    require(len(scenarios) == 15, f"Expected 15 scenario rows, found {len(scenarios)}", errors)
    for row in scenarios:
        best, low, high = map(float, (row["best_estimate_c_above_1850_1900"], row["very_likely_low_c"], row["very_likely_high_c"]))
        require(low <= best <= high, f"Scenario range excludes best estimate: {row}", errors)

    required_fields = {"year", "nasa_gistemp_anomaly_c_1951_1980", "noaa_globaltemp_anomaly_c_1971_2000", "co2_ppm", "forcing_total_long_lived_ghg_w_m2", "aggi_1990_equals_1"}
    with (ROOT / "timeseries" / "normalized" / "observed-ghg-temperature.csv").open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        require(required_fields.issubset(set(reader.fieldnames or [])), "Observed series missing required fields", errors)
        observed_rows = list(reader)
    require(len(observed_rows) >= 170, "Observed series unexpectedly short", errors)

    correlation = json.dumps(load_json(ROOT / "timeseries" / "normalized" / "observed-correlation-statistics.json")).lower()
    require("caus" in correlation and ("not" in correlation or "does not" in correlation), "Correlation output lacks causal guardrail", errors)

    forbidden = ["climate refugees per degree", "more hurricanes everywhere", "21 percent of global food"]
    for claim in claims:
        dashboard_text = str(claim.get("dashboard_text") or "").lower()
        for phrase in forbidden:
            require(phrase not in dashboard_text, f"Forbidden dashboard phrase in {claim['claim_id']}: {phrase}", errors)

    if errors:
        print(f"FAIL: {len(errors)} validation error(s)")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"PASS: climate package validated ({len(source_ids)} sources, {len(claims)} claims, {len(json_paths)} JSON files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
