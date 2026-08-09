#!/usr/bin/env python3
"""Validate coastal-city research semantics and generated data offline."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIMATE = ROOT.parent


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def source_refs(node):
    if isinstance(node, dict):
        if "source_id" in node:
            yield node["source_id"]
        for value in node.values():
            yield from source_refs(value)
    elif isinstance(node, list):
        for value in node:
            yield from source_refs(value)


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def csv_rows(name: str) -> list[dict]:
    with (ROOT / "timeseries" / name).open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> int:
    errors: list[str] = []
    manifest = load_json(ROOT / "manifest.json")
    for rel in manifest["normative_files"] + manifest["generated_files"]:
        require((ROOT / rel).is_file(), f"Manifest file missing: {rel}", errors)

    registered = {item["source_id"] for item in load_json(CLIMATE / "sources.json")["sources"]}
    json_docs = {}
    for path in ROOT.rglob("*.json"):
        try:
            json_docs[path] = load_json(path)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"Invalid JSON {path.relative_to(ROOT)}: {exc}")
    for path, doc in json_docs.items():
        for source_id in source_refs(doc):
            require(source_id in registered, f"Unknown source_id {source_id} in {path.relative_to(ROOT)}", errors)

    audit = load_json(ROOT / "claim-audit.json")
    claims = audit["claims"]
    claim_ids = [item["claim_id"] for item in claims]
    require(len(claim_ids) == len(set(claim_ids)), "Duplicate claim_id", errors)
    require({item["status"] for item in claims} <= set(audit["status_vocabulary"]), "Invalid claim status", errors)
    for claim in claims:
        require(bool(claim.get("source_refs")), f"Claim lacks source_refs: {claim['claim_id']}", errors)

    verification = {item["claim_id"]: item for item in load_json(ROOT / "source-verification.json")["audits"]}
    for claim_id in claim_ids:
        require(claim_id in verification, f"Missing verification: {claim_id}", errors)
        if claim_id in verification:
            checks = verification[claim_id]["checks"]
            require(len(checks) == 3 and {item["check"] for item in checks} == {1, 2, 3}, f"Invalid verification checks: {claim_id}", errors)

    forbidden = ["will be underwater by 2070", "climate refugees by 2100", "flood-proof"]
    for phrase in forbidden:
        # Candidate claims may contain the exact phrase only when explicitly rejected.
        for claim in claims:
            safe = str(claim.get("dashboard_safe_text", "")).lower()
            require(phrase not in safe, f"Forbidden phrase in dashboard-safe text: {claim['claim_id']}", errors)

    slr = csv_rows("noaa-relative-sea-level-scenarios.csv")
    require(len(slr) == 135, f"Expected 135 NOAA SLR rows, found {len(slr)}", errors)
    slr_index = {(r["location_id"], r["scenario"], int(r["year"])): float(r["change_from_2020_m"]) for r in slr}
    expected_slr = {
        ("virginia_key", "Low", 2070): 0.24,
        ("virginia_key", "High", 2070): 0.89,
        ("grid_30n_90w", "Low", 2070): 0.48,
        ("grid_30n_90w", "High", 2070): 1.09,
        ("grand_isle", "Low", 2070): 0.57,
        ("grand_isle", "High", 2070): 1.20,
    }
    for key, expected in expected_slr.items():
        require(abs(slr_index.get(key, -999) - expected) < 1e-9, f"Unexpected SLR value {key}: {slr_index.get(key)}", errors)

    htf = csv_rows("noaa-high-tide-flood-days.csv")
    require(len(htf) == 270, f"Expected 270 high-tide-flood rows, found {len(htf)}", errors)
    htf_index = {(r["location_id"], r["severity"], int(r["decade"]), r["scenario"]): int(r["days_per_year"]) for r in htf}
    expected_htf = {
        ("virginia_key", "minor", 2070, "Low"): 45,
        ("virginia_key", "minor", 2070, "High"): 365,
        ("grand_isle", "minor", 2070, "Low"): 315,
        ("grand_isle", "moderate", 2070, "High"): 360,
    }
    for key, expected in expected_htf.items():
        require(htf_index.get(key) == expected, f"Unexpected HTF value {key}: {htf_index.get(key)}", errors)

    trends = {r["location_id"]: r for r in csv_rows("observed-relative-sea-level-trends.csv")}
    expected_trends = {"virginia_key": 3.2004, "new_canal_station": 5.9944, "grand_isle": 9.1186}
    for location, expected in expected_trends.items():
        actual = float(trends.get(location, {}).get("trend_mm_per_year", -999))
        require(abs(actual - expected) < 1e-9, f"Unexpected trend {location}: {actual}", errors)

    migration = csv_rows("hauer-2100-cbsa-net-migration.csv")
    require(len(migration) == 10, f"Expected 10 selected migration rows, found {len(migration)}", errors)
    require(all(r["interpretation"] == "high-end scenario model output; not forecast" for r in migration), "Migration guardrail missing", errors)

    city_profiles = load_json(ROOT / "city-risk-profiles.json")
    require({item["city_id"] for item in city_profiles["cities"]} == {"new_orleans", "miami"}, "City profiles incomplete", errors)
    gaps = load_json(ROOT / "gaps.json")["gaps"]
    require(len(gaps) >= 12, "Evidence gap register unexpectedly short", errors)

    if errors:
        print(f"FAIL: {len(errors)} validation error(s)")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"PASS: coastal-city package validated ({len(claims)} claims, {len(registered)} registered sources, {len(json_docs)} JSON files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
