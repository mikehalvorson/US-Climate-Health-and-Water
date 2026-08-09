"""Validate the versioned energy time-series package and selected raw-to-normalized values."""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
ENERGY = BASE.parent
NORMALIZED = BASE / "normalized"
RAW = BASE / "raw"

FIELDS = [
    "dataset_id",
    "source_id",
    "record_type",
    "model",
    "scenario",
    "scenario_family",
    "geography",
    "geography_code",
    "region_level",
    "year",
    "metric",
    "technology",
    "technology_detail",
    "scope",
    "value",
    "unit",
    "source_value",
    "source_unit",
    "source_variable",
    "upstream_status",
    "source_vintage",
    "source_file",
]

REQUIRED_NONEMPTY = {
    "dataset_id",
    "source_id",
    "record_type",
    "geography",
    "geography_code",
    "region_level",
    "year",
    "metric",
    "technology",
    "scope",
    "value",
    "unit",
    "source_value",
    "source_unit",
    "source_variable",
    "upstream_status",
    "source_vintage",
    "source_file",
}


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
            raise AssertionError(f"{path.name}: schema mismatch")
        return list(reader)


def index_rows(rows):
    return {
        (row["dataset_id"], row["scenario"], int(row["year"]), row["metric"], row["technology"], row["scope"]): row
        for row in rows
    }


def eia_raw_value(filename: str, msn: str, yyyymm: str) -> float:
    with (RAW / filename).open("r", encoding="utf-8-sig", newline="") as handle:
        matches = [row for row in csv.DictReader(handle) if row["MSN"] == msn and row["YYYYMM"] == yyyymm]
    if len(matches) != 1:
        raise AssertionError(f"Expected one raw {msn}/{yyyymm} row in {filename}")
    return float(matches[0]["Value"])


def collect_prefixed_references(value, key=None):
    """Collect identifier references without confusing unrelated free-text values."""
    references = {"source": set(), "dataset": set(), "claim": set()}
    if isinstance(value, dict):
        for child_key, child_value in value.items():
            child_refs = collect_prefixed_references(child_value, child_key)
            for kind in references:
                references[kind].update(child_refs[kind])
    elif isinstance(value, list):
        for child in value:
            child_refs = collect_prefixed_references(child, key)
            for kind in references:
                references[kind].update(child_refs[kind])
    elif isinstance(value, str):
        if key in {"source_id", "source_ids"} and value.startswith("SRC-"):
            references["source"].add(value)
        if key in {"dataset_id", "dataset_ids"} and value.startswith("DS-"):
            references["dataset"].add(value)
        if (key in {"claim_id", "claim_ids", "evidence"}) and value.startswith("CLM-"):
            references["claim"].add(value)
    return references


def main():
    json_files = [path for path in ENERGY.rglob("*.json") if "raw" not in path.parts]
    for path in json_files:
        load_json(path)

    sources = {item["source_id"] for item in load_json(ENERGY / "sources.json")}
    transmission_sources = ENERGY / "transmission" / "source-verification.json"
    if transmission_sources.exists():
        sources.update(
            item["source_id"]
            for item in load_json(transmission_sources)["sources"]
        )
    datasets = {item["dataset_id"] for item in load_json(ENERGY / "datasets.json")["datasets"]}
    claims = {item["claim_id"] for item in load_json(ENERGY / "claims.json")}
    coverage = load_json(BASE / "coverage.json")
    ingestion = load_json(BASE / "ingestion-manifest.json")

    rows_by_file = {}
    all_rows = []
    errors = []
    for path in json_files:
        references = collect_prefixed_references(load_json(path))
        for source_id in sorted(references["source"] - sources):
            errors.append(f"{path.name}: unknown source reference {source_id}")
        for dataset_id in sorted(references["dataset"] - datasets):
            errors.append(f"{path.name}: unknown dataset reference {dataset_id}")
        for claim_id in sorted(references["claim"] - claims):
            errors.append(f"{path.name}: unknown claim reference {claim_id}")
    for item in coverage["files"]:
        path = BASE / item["file"]
        rows = load_csv(path)
        rows_by_file[path.name] = rows
        all_rows.extend(rows)
        if len(rows) != item["rows"]:
            errors.append(f"{path.name}: coverage row count mismatch")
        if sha256(path) != item["sha256"]:
            errors.append(f"{path.name}: coverage checksum mismatch")
        if min(int(row["year"]) for row in rows) != item["year_min"]:
            errors.append(f"{path.name}: minimum year mismatch")
        if max(int(row["year"]) for row in rows) != item["year_max"]:
            errors.append(f"{path.name}: maximum year mismatch")

    ingestion_outputs = {item["file"]: item for item in ingestion["normalized_outputs"]}
    for item in coverage["files"]:
        counterpart = ingestion_outputs.get(item["file"])
        if counterpart is None or counterpart["sha256"] != item["sha256"] or counterpart["rows"] != item["rows"]:
            errors.append(f"{item['file']}: ingestion manifest disagrees with coverage")

    allowed_types = {"historical", "historical_reference", "scenario"}
    allowed_units = {"TWh", "GW", "GWdc", "GW_mixed_ac_dc"}
    for number, row in enumerate(all_rows, start=1):
        missing = sorted(field for field in REQUIRED_NONEMPTY if not row[field])
        if missing:
            errors.append(f"row {number}: empty required fields {missing}")
        if row["dataset_id"] not in datasets:
            errors.append(f"row {number}: unknown dataset {row['dataset_id']}")
        if row["source_id"] not in sources:
            errors.append(f"row {number}: unknown source {row['source_id']}")
        if row["record_type"] not in allowed_types:
            errors.append(f"row {number}: invalid record type")
        if row["unit"] not in allowed_units:
            errors.append(f"row {number}: invalid unit {row['unit']}")
        if row["record_type"] == "scenario" and not all(row[field] for field in ("model", "scenario", "scenario_family")):
            errors.append(f"row {number}: scenario metadata missing")
        try:
            int(row["year"])
            float(row["value"])
            float(row["source_value"])
        except ValueError:
            errors.append(f"row {number}: numeric parse failure")
        if "Â" in " ".join(row.values()):
            errors.append(f"row {number}: mojibake detected")

    expected = {
        "global-electricity-generation-history.csv": (460, 1965, 2025),
        "global-irena-capacity-and-generation-history.csv": (626, 2000, 2025),
        "us-electricity-generation-history.csv": (940, 1949, 2025),
        "us-electricity-projections-aeo2026.csv": (14872, 2025, 2050),
        "us-electricity-projections-nrel-standard-scenarios-2024.csv": (24156, 2026, 2050),
        "global-electricity-projections-ngfs-phase5.1.csv": (13944, 2020, 2100),
        "global-specialized-technology-scenarios.csv": (3, 2021, 2050),
    }
    for name, (count, low, high) in expected.items():
        rows = rows_by_file[name]
        years = {int(row["year"]) for row in rows}
        if (len(rows), min(years), max(years)) != (count, low, high):
            errors.append(f"{name}: expected coverage invariant failed")

    aeo = rows_by_file["us-electricity-projections-aeo2026.csv"]
    nrel = rows_by_file["us-electricity-projections-nrel-standard-scenarios-2024.csv"]
    ngfs = rows_by_file["global-electricity-projections-ngfs-phase5.1.csv"]
    marine = rows_by_file["global-specialized-technology-scenarios.csv"]
    if len({row["scenario"] for row in aeo}) != 11 or any(row["technology"] == "hydropowers" for row in aeo):
        errors.append("AEO scenario count or hydropower taxonomy invariant failed")
    if len({row["scenario"] for row in nrel}) != 61:
        errors.append("NREL scenario count invariant failed")
    if len({row["model"] for row in ngfs}) != 3 or len({row["scenario"] for row in ngfs}) != 7:
        errors.append("NGFS model/scenario count invariant failed")
    if not {2050, 2060, 2070}.issubset({int(row["year"]) for row in ngfs}):
        errors.append("NGFS required dashboard years missing")
    marine_points = {(int(row["year"]), float(row["value"]), row["record_type"]) for row in marine}
    expected_marine = {(2021, 0.535, "historical_reference"), (2030, 70.0, "scenario"), (2050, 350.0, "scenario")}
    if marine_points != expected_marine:
        errors.append("IRENA ocean milestone transcription mismatch")

    us_history = rows_by_file["us-electricity-generation-history.csv"]
    us_index = index_rows(us_history)
    coal = us_index[("DS-EIA-MER-7.2A", "", 2025, "electricity_generation", "coal", "all_sectors; utility_scale for solar")]
    solar = us_index[("DS-EIA-MER-10.6", "", 2025, "electricity_generation", "solar_total", "utility_plus_small_scale")]
    raw_coal = eia_raw_value("eia-mer-table-7.2a.csv", "CLETPUS", "202513")
    raw_solar = eia_raw_value("eia-mer-table-10.6.csv", "SOTEPUS", "202513")
    if float(coal["source_value"]) != raw_coal or abs(float(coal["value"]) - raw_coal * 0.001) > 1e-9:
        errors.append("EIA coal raw-to-TWh cross-check failed")
    if float(solar["source_value"]) != raw_solar or abs(float(solar["value"]) - raw_solar * 0.001) > 1e-9:
        errors.append("EIA solar raw-to-TWh cross-check failed")

    irena = rows_by_file["global-irena-capacity-and-generation-history.csv"]
    marine_2025 = [
        row for row in irena
        if row["dataset_id"] == "DS-IRENASTAT-CAP26"
        and row["technology"] == "marine_energy"
        and row["year"] == "2025"
    ]
    if len(marine_2025) != 1 or abs(float(marine_2025[0]["value"]) - 0.48956) > 1e-9:
        errors.append("IRENA 2025 marine-capacity cross-check failed")

    if len(all_rows) != 55001:
        errors.append(f"Expected 55,001 total rows, found {len(all_rows)}")
    if errors:
        raise AssertionError("\n".join(errors[:100]))

    print(
        json.dumps(
            {
                "status": "pass",
                "json_files_parsed": len(json_files),
                "normalized_files": len(rows_by_file),
                "normalized_rows": len(all_rows),
                "source_ids": len(sources),
                "dataset_ids": len(datasets),
                "claim_ids": len(claims),
                "horizons": {"global_history": 2025, "us_history": 2025, "us_scenarios": 2050, "global_scenarios": 2100},
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
