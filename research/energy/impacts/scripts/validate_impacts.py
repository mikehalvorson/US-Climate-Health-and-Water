"""Validate the power-generation impact corpus and its evidence contract."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlparse


IMPACTS = Path(__file__).resolve().parents[1]
ENERGY = IMPACTS.parent


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def duplicates(values):
    seen = set()
    repeated = set()
    for value in values:
        if value in seen:
            repeated.add(value)
        seen.add(value)
    return repeated


def collect_references(value, key=None):
    refs = {"source": set(), "claim": set()}
    if isinstance(value, dict):
        for child_key, child_value in value.items():
            child_refs = collect_references(child_value, child_key)
            for kind in refs:
                refs[kind].update(child_refs[kind])
    elif isinstance(value, list):
        for child in value:
            child_refs = collect_references(child, key)
            for kind in refs:
                refs[kind].update(child_refs[kind])
    elif isinstance(value, str):
        if key in {"source_id", "source_ids", "primary_source_id", "corroborating_source_ids"} and value.startswith("SRC-"):
            refs["source"].add(value)
        if key in {"claim_id", "claim_ids", "evidence"} and value.startswith("CLM-"):
            refs["claim"].add(value)
    return refs


def main():
    errors = []
    sources = load(ENERGY / "sources.json")
    claims = load(ENERGY / "claims.json")
    manifest = load(ENERGY / "manifest.json")
    source_ids = [item["source_id"] for item in sources]
    claim_ids = [item["claim_id"] for item in claims]
    source_set = set(source_ids)
    claim_set = set(claim_ids)

    for repeated in sorted(duplicates(source_ids)):
        errors.append(f"duplicate source id: {repeated}")
    for repeated in sorted(duplicates(claim_ids)):
        errors.append(f"duplicate claim id: {repeated}")

    for source in sources:
        source_id = source["source_id"]
        if source.get("identity_check", {}).get("status") != "verified":
            errors.append(f"{source_id}: identity check is not verified")
        if not source.get("identity_check", {}).get("method"):
            errors.append(f"{source_id}: identity-check method missing")
        if source.get("accessed_at") != manifest["as_of"]:
            errors.append(f"{source_id}: access date differs from corpus as-of date")
        url = source.get("canonical_url", "")
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc:
            errors.append(f"{source_id}: canonical URL is not an absolute HTTPS URL")

    exception_ids = {
        claim_id
        for item in manifest.get("corroboration_exceptions", [])
        for claim_id in item.get("claim_ids", [])
    }
    for claim in claims:
        claim_id = claim["claim_id"]
        if claim.get("status") != "verified":
            errors.append(f"{claim_id}: claim status is not verified")
        if claim.get("fidelity_check", {}).get("status") != "verified":
            errors.append(f"{claim_id}: fidelity check is not verified")
        if not claim.get("fidelity_check", {}).get("method"):
            errors.append(f"{claim_id}: fidelity-check method missing")
        supports = claim.get("support", [])
        for support in supports:
            if support.get("source_id") not in source_set:
                errors.append(f"{claim_id}: unknown support source {support.get('source_id')}")
            if not support.get("locator") or not support.get("support_note"):
                errors.append(f"{claim_id}: support locator or note missing")
        if claim.get("load_bearing") and len(supports) < 2 and claim_id not in exception_ids:
            errors.append(f"{claim_id}: load-bearing claim lacks corroboration and exception")

    for claim_id in sorted(exception_ids - claim_set):
        errors.append(f"corroboration exception names unknown claim {claim_id}")

    impact_json = sorted(IMPACTS.glob("*.json"))
    for path in impact_json:
        document = load(path)
        refs = collect_references(document)
        for source_id in sorted(refs["source"] - source_set):
            errors.append(f"{path.name}: unknown source reference {source_id}")
        for claim_id in sorted(refs["claim"] - claim_set):
            errors.append(f"{path.name}: unknown claim reference {claim_id}")

    for relative in manifest["files"]:
        if not (ENERGY / relative).exists():
            errors.append(f"manifest file missing: {relative}")

    matrix = load(IMPACTS / "technology-impact-matrix.json")
    required_technologies = {
        "coal_power",
        "natural_gas_power",
        "petroleum_liquid_power",
        "nuclear_fission_power",
        "solar_photovoltaic",
        "concentrating_solar_power",
        "onshore_wind",
        "offshore_wind",
        "hydropower",
        "geothermal_power",
        "biomass_and_biogas_power",
        "municipal_and_industrial_waste_to_energy",
        "marine_and_hydrokinetic_power",
        "fossil_power_with_ccs",
        "hydrogen_and_fuel_cell_power",
        "electricity_storage_context",
    }
    matrix_ids = {item["technology_id"] for item in matrix["technologies"]}
    for technology_id in sorted(required_technologies - matrix_ids):
        errors.append(f"technology matrix missing {technology_id}")

    regulation = load(IMPACTS / "regulatory-status.json")
    if regulation.get("as_of") != manifest["as_of"]:
        errors.append("regulatory registry as-of date differs from corpus")
    for record in regulation["records"]:
        if not record.get("update_risk") or not isinstance(record.get("reverification_interval_days"), int):
            errors.append(f"{record['record_id']}: update risk or reverification interval missing")

    nuclear = load(IMPACTS / "nuclear-generation.json")
    count_metrics = {
        item["metric_id"]: item for item in nuclear["observed_metrics"]
        if item["metric_id"].startswith("us_operating_reactor_count")
    }
    if count_metrics.get("us_operating_reactor_count_nrc", {}).get("value") != 94:
        errors.append("nuclear module NRC operating-reactor value changed")
    if count_metrics.get("us_operating_reactor_count_eia", {}).get("value") != 96:
        errors.append("nuclear module EIA operating-reactor value changed")
    if nuclear.get("official_count_conflict", {}).get("status") != "unresolved_preserved":
        errors.append("nuclear official count conflict is not preserved")

    if errors:
        raise SystemExit("\n".join(errors))

    print(json.dumps({
        "status": "pass",
        "impact_json_files": len(impact_json),
        "technology_records": len(matrix["technologies"]),
        "regulatory_records": len(regulation["records"]),
        "source_ids": len(source_set),
        "claim_ids": len(claim_set),
        "load_bearing_claims": sum(bool(item.get("load_bearing")) for item in claims),
        "corroboration_exceptions": len(exception_ids),
        "nrc_eia_reactor_count_conflict": "preserved",
    }, indent=2))


if __name__ == "__main__":
    main()

