"""Validate transmission package structure, cross-references, and acquired data."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]


def load(relative):
    return json.loads((BASE / relative).read_text(encoding="utf-8"))


def collect_source_ids(value):
    found = set()
    if isinstance(value, dict):
        for key, item in value.items():
            if key == "source_id" and isinstance(item, str) and item:
                found.add(item)
            elif key == "source_ids" and isinstance(item, list):
                found.update(source for source in item if source)
            else:
                found.update(collect_source_ids(item))
    elif isinstance(value, list):
        for item in value:
            found.update(collect_source_ids(item))
    return found


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    manifest = load("manifest.json")
    sources = load("source-verification.json")
    source_ids = [source["source_id"] for source in sources["sources"]]
    if len(source_ids) != len(set(source_ids)):
        raise AssertionError("Duplicate source IDs")
    if any(not source.get("identity_verification") or not source.get("claim_verification") for source in sources["sources"]):
        raise AssertionError("Every source needs identity and claim verification")

    for record in manifest["files"]:
        if not (BASE / record["path"]).exists():
            raise AssertionError(f"Manifest file missing: {record['path']}")

    referenced = set()
    json_paths = [
        "findings.json", "needs-and-expectations.json", "infrastructure-challenges.json",
        "cross-domain-gap-register.json", "chart-contracts.json",
        "corridors/corridor-catalog.json", "corridors/major-corridors.geojson",
        "process/process-graph.json", "supply-chain/transformers.json",
        "supply-chain/supply-chain-map.json", "supply-chain/bottleneck-register.json",
    ]
    for relative in json_paths:
        referenced.update(collect_source_ids(load(relative)))
    missing_sources = sorted(referenced - set(source_ids))
    if missing_sources:
        raise AssertionError(f"Unregistered source IDs: {missing_sources}")

    definitions = load("corridors/capacity-definitions.json")
    allowed_types = {record["code"] for record in definitions["definitions"]}
    catalog = load("corridors/corridor-catalog.json")
    corridor_ids = [record["corridor_id"] for record in catalog["records"]]
    if len(corridor_ids) != len(set(corridor_ids)):
        raise AssertionError("Duplicate corridor IDs")
    for corridor in catalog["records"]:
        if not corridor.get("capacity_records"):
            raise AssertionError(f"Corridor has no capacity records: {corridor['corridor_id']}")
        for capacity in corridor["capacity_records"]:
            if capacity["capacity_type"] not in allowed_types:
                raise AssertionError(f"Unknown capacity type: {capacity}")
            if not capacity.get("source_id"):
                raise AssertionError(f"Unsourced capacity: {capacity}")

    overlay = load("corridors/major-corridors.geojson")
    feature_ids = [feature["id"] for feature in overlay["features"]]
    if set(feature_ids) != set(corridor_ids):
        raise AssertionError({"missing_from_map": sorted(set(corridor_ids) - set(feature_ids)), "missing_from_catalog": sorted(set(feature_ids) - set(corridor_ids))})
    for feature in overlay["features"]:
        properties = feature["properties"]
        if properties["primary_capacity_type"] not in allowed_types:
            raise AssertionError(f"Unknown mapped capacity type: {properties}")
        if properties.get("secondary_capacity_type") and properties["secondary_capacity_type"] not in allowed_types:
            raise AssertionError(f"Unknown mapped secondary capacity type: {properties}")

    hifld = load("corridors/base-layers/hifld-transmission-lines-230kv-plus.geojson")
    if len(hifld["features"]) != 10031:
        raise AssertionError(f"Expected 10,031 HIFLD features, found {len(hifld['features'])}")
    sample_properties = hifld["features"][0]["properties"]
    if any("MW" in key.upper() or "CAPACITY" in key.upper() or "RATING" in key.upper() for key in sample_properties):
        raise AssertionError("Unexpected apparent MW/capacity field in HIFLD schema; review acquisition")

    process = load("process/process-graph.json")
    node_ids = {node["node_id"] for node in process["nodes"]}
    for edge in process["edges"]:
        if edge["from"] not in node_ids or edge["to"] not in node_ids:
            raise AssertionError(f"Broken process edge: {edge}")

    supply = load("supply-chain/supply-chain-map.json")
    supply_nodes = {node["node_id"] for node in supply["nodes"]}
    for edge in supply["edges"]:
        if edge["from"] not in supply_nodes or edge["to"] not in supply_nodes:
            raise AssertionError(f"Broken supply-chain edge: {edge}")

    coverage = load("load-shape/coverage.json")
    for raw in coverage["raw_files"]:
        path = BASE / "load-shape" / "timeseries" / "raw" / raw["filename"]
        if path.stat().st_size != raw["bytes"] or sha256(path) != raw["sha256"]:
            raise AssertionError(f"Raw file integrity failure: {raw['filename']}")

    gaps = load("cross-domain-gap-register.json")["gaps"]
    priorities = {record["priority"] for record in gaps}
    if priorities != {"P0", "P1", "P2"}:
        raise AssertionError(f"Unexpected gap priorities: {priorities}")

    print(json.dumps({
        "status": "pass",
        "verified_sources": len(source_ids),
        "referenced_sources": len(referenced),
        "corridors": len(corridor_ids),
        "hifld_features": len(hifld["features"]),
        "process_nodes": len(node_ids),
        "process_edges": len(process["edges"]),
        "supply_chain_nodes": len(supply_nodes),
        "supply_chain_edges": len(supply["edges"]),
        "information_gaps": len(gaps),
    }, indent=2))


if __name__ == "__main__":
    main()
