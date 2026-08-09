#!/usr/bin/env python3
"""Normalize authoritative climate observations into dashboard-ready files.

This script never converts annual temperature anomalies to a different baseline.
Baseline changes do not alter correlations, but undocumented rebasing would create
false precision.  Each source therefore retains its native published baseline.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import urllib.request
from pathlib import Path

import pandas as pd


BASE = Path(__file__).resolve().parents[1]
RAW = BASE / "raw"
OUT = BASE / "normalized"
PRIMAP_URL = (
    "https://zenodo.org/records/17090760/files/"
    "Guetschow_et_al_2025a-PRIMAP-hist_v2.7_final_22-Aug-2025.csv?download=1"
)
PRIMAP_FILTERED = RAW / "primap-hist-v2.7-earth-selected.csv"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_nasa_temperature() -> pd.DataFrame:
    data = pd.read_csv(RAW / "nasa-gistemp-v4-global.csv", skiprows=1)
    data["nasa_gistemp_anomaly_c_1951_1980"] = pd.to_numeric(
        data["J-D"], errors="coerce"
    )
    data["year"] = pd.to_numeric(data["Year"], errors="coerce")
    return data.loc[
        data["year"].notna() & data["nasa_gistemp_anomaly_c_1951_1980"].notna(),
        ["year", "nasa_gistemp_anomaly_c_1951_1980"],
    ].astype({"year": "int64"})


def read_noaa_temperature() -> pd.DataFrame:
    data = pd.read_csv(
        RAW / "noaa-globaltemp-v6.1-annual.asc",
        sep=r"\s+",
        header=None,
        names=["year", "anomaly", "lower", "upper", "coverage", "status"],
    )
    # The current calendar year is incomplete in the live product.  Preserve only
    # complete years, defined here as years before the acquisition year (2026).
    data = data[(data["year"] <= 2025) & (data["anomaly"] > -900)]
    return data[["year", "anomaly"]].rename(
        columns={"anomaly": "noaa_globaltemp_anomaly_c_1971_2000"}
    )


def read_noaa_co2() -> pd.DataFrame:
    data = pd.read_csv(RAW / "noaa-global-co2-annual.csv", comment="#")
    return data.rename(
        columns={"mean": "co2_ppm", "unc": "co2_uncertainty_ppm"}
    )[["year", "co2_ppm", "co2_uncertainty_ppm"]]


def read_aggi() -> pd.DataFrame:
    data = pd.read_csv(RAW / "noaa-aggi-radiative-forcing.csv")
    data.columns = [
        "year",
        "forcing_co2_w_m2",
        "forcing_ch4_w_m2",
        "forcing_n2o_w_m2",
        "forcing_cfc_group_w_m2",
        "forcing_hcfc_group_w_m2",
        "forcing_hfc_group_w_m2",
        "forcing_total_long_lived_ghg_w_m2",
        "co2_equivalent_ppm",
        "aggi_1990_equals_1",
        "annual_forcing_change_percent_of_1990",
    ]
    return data


def read_aggi_mole_fractions() -> pd.DataFrame:
    data = pd.read_csv(
        RAW / "noaa-aggi-annual-mean-mole-fractions.csv", skiprows=2
    )
    first = data.columns[0]
    data["year"] = pd.to_numeric(data[first], errors="coerce").apply(
        lambda value: int(math.floor(value)) if pd.notna(value) else value
    )
    data = data[data["year"].notna()].copy()
    selected = {"CO2": "co2_ppm_aggi", "CH4": "ch4_ppb", "N2O": "n2o_ppb", "SF6": "sf6_ppt"}
    keep = ["year"]
    for source, target in selected.items():
        if source in data.columns:
            data[target] = pd.to_numeric(data[source], errors="coerce")
            keep.append(target)
    return data[keep].astype({"year": "int64"})


def write_observations() -> pd.DataFrame:
    nasa = read_nasa_temperature()
    noaa_temp = read_noaa_temperature()
    co2 = read_noaa_co2()
    aggi = read_aggi()
    gases = read_aggi_mole_fractions()
    years = pd.DataFrame(
        {"year": range(min(nasa.year.min(), noaa_temp.year.min()), 2026)}
    )
    merged = years.merge(nasa, on="year", how="left")
    for frame in (noaa_temp, co2, aggi, gases):
        merged = merged.merge(frame, on="year", how="left")
    merged.to_csv(OUT / "observed-ghg-temperature.csv", index=False, na_rep="")
    return merged


def correlation_record(
    data: pd.DataFrame, x: str, y: str, start: int, end: int
) -> dict:
    pair = data.loc[data["year"].between(start, end), ["year", x, y]].dropna()
    differences = pair[[x, y]].diff().dropna()
    rolling = pair.set_index("year")[[x, y]].rolling(10, min_periods=10).mean().dropna()
    return {
        "x": x,
        "y": y,
        "period": [int(pair.year.min()), int(pair.year.max())],
        "n_years": int(len(pair)),
        "pearson_levels": float(pair[x].corr(pair[y], method="pearson")),
        "spearman_levels": float(
            pair[x].rank(method="average").corr(
                pair[y].rank(method="average"), method="pearson"
            )
        ),
        "pearson_first_differences": float(
            differences[x].corr(differences[y], method="pearson")
        ),
        "pearson_trailing_10_year_means": float(
            rolling[x].corr(rolling[y], method="pearson")
        ),
        "interpretation_guardrail": (
            "Levels and smoothed-series correlations are descriptive and inflated by "
            "shared trends/autocorrelation; first differences emphasize short-term "
            "variability and do not estimate equilibrium climate response. Causal "
            "attribution must use the assessed physical evidence in attribution files."
        ),
    }


def write_correlations(observations: pd.DataFrame) -> None:
    work = observations.copy()
    work["ln_co2_ppm"] = work["co2_ppm"].apply(
        lambda value: math.log(value) if pd.notna(value) else value
    )
    records = [
        correlation_record(
            work,
            "co2_ppm",
            "nasa_gistemp_anomaly_c_1951_1980",
            1979,
            2025,
        ),
        correlation_record(
            work,
            "ln_co2_ppm",
            "nasa_gistemp_anomaly_c_1951_1980",
            1979,
            2025,
        ),
        correlation_record(
            work,
            "forcing_total_long_lived_ghg_w_m2",
            "nasa_gistemp_anomaly_c_1951_1980",
            1979,
            2024,
        ),
    ]
    payload = {
        "schema_version": "1.0.0",
        "generated_from": [
            "NOAA global CO2 annual mean",
            "NOAA Annual Greenhouse Gas Index",
            "NASA GISTEMP v4",
        ],
        "statistics": records,
        "not_an_attribution_model": True,
    }
    (OUT / "observed-correlation-statistics.json").write_text(
        json.dumps(payload, indent=2) + "\n", encoding="utf-8"
    )


def write_carbon_budget() -> None:
    data = pd.read_excel(
        RAW / "global-carbon-budget-2025.xlsx",
        sheet_name="Historical Budget",
        skiprows=15,
        nrows=300,
        usecols="A:H",
    )
    data = data[pd.to_numeric(data["Year"], errors="coerce").between(1850, 2024)].copy()
    data["year"] = data["Year"].astype(int)
    conversion = 3.664
    data["fossil_and_industry_gtco2"] = (
        data["fossil emissions excluding carbonation"] * conversion
    )
    data["land_use_change_gtco2"] = data["land-use change emissions"] * conversion
    data["anthropogenic_co2_sources_gtco2"] = (
        data["fossil_and_industry_gtco2"] + data["land_use_change_gtco2"]
    )
    data["cumulative_anthropogenic_co2_sources_since_1850_gtco2"] = data[
        "anthropogenic_co2_sources_gtco2"
    ].cumsum()
    output = data[
        [
            "year",
            "fossil_and_industry_gtco2",
            "land_use_change_gtco2",
            "anthropogenic_co2_sources_gtco2",
            "cumulative_anthropogenic_co2_sources_since_1850_gtco2",
        ]
    ]
    output.to_csv(OUT / "global-co2-emissions-and-cumulative-1850-2024.csv", index=False)


def refresh_primap_filtered() -> None:
    selected_entities = {
        "CO2",
        "CH4",
        "N2O",
        "FGASES (AR6GWP100)",
        "KYOTOGHG (AR6GWP100)",
    }
    with urllib.request.urlopen(PRIMAP_URL, timeout=180) as response:
        wrapper = io.TextIOWrapper(response, encoding="utf-8-sig", newline="")
        reader = csv.DictReader(wrapper)
        if reader.fieldnames is None:
            raise RuntimeError("PRIMAP CSV did not expose a header")
        area_field = next(
            name for name in reader.fieldnames if name.lower().startswith(("area", "country"))
        )
        category_field = next(
            name for name in reader.fieldnames if name.lower().startswith("category")
        )
        with PRIMAP_FILTERED.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=reader.fieldnames)
            writer.writeheader()
            for row in reader:
                if (
                    row.get(area_field) == "EARTH"
                    and row.get(category_field) == "M.0.EL"
                    and row.get("entity") in selected_entities
                ):
                    writer.writerow(row)


def write_primap() -> None:
    if not PRIMAP_FILTERED.exists():
        return
    raw = pd.read_csv(PRIMAP_FILTERED)
    scenario_field = next(name for name in raw.columns if name.lower().startswith("scenario"))
    year_columns = [name for name in raw.columns if str(name).isdigit()]
    rows: list[dict] = []
    for _, source in raw.iterrows():
        unit = str(source["unit"])
        if "gigagram" not in unit:
            raise ValueError(f"Unexpected PRIMAP unit: {unit}")
        for year in year_columns:
            value = pd.to_numeric(source[year], errors="coerce")
            if pd.notna(value):
                rows.append(
                    {
                        "year": int(year),
                        "scenario": source[scenario_field],
                        "entity": source["entity"],
                        "value_gt_per_year": float(value) / 1_000_000,
                        "source_unit": unit,
                    }
                )
    long = pd.DataFrame(rows)
    pivot = long.pivot_table(
        index=["year", "scenario"],
        columns="entity",
        values="value_gt_per_year",
        aggfunc="first",
    ).reset_index()
    pivot = pivot.rename(
        columns={
            "CO2": "co2_gtco2_per_year_excl_lulucf",
            "CH4": "ch4_gtch4_per_year_excl_lulucf",
            "N2O": "n2o_gtn2o_per_year_excl_lulucf",
            "FGASES (AR6GWP100)": "f_gases_gtco2e_ar6gwp100_per_year_excl_lulucf",
            "KYOTOGHG (AR6GWP100)": "kyoto_ghg_gtco2e_ar6gwp100_per_year_excl_lulucf",
        }
    )
    pivot.to_csv(OUT / "global-ghg-emissions-primap-hist-v2.7.csv", index=False)


def write_hashes() -> None:
    files = sorted(path for path in RAW.iterdir() if path.is_file())
    payload = {
        "algorithm": "sha256",
        "files": [
            {"path": str(path.relative_to(BASE)).replace("\\", "/"), "sha256": sha256(path)}
            for path in files
        ],
    }
    (OUT / "raw-file-sha256.json").write_text(
        json.dumps(payload, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--refresh-primap",
        action="store_true",
        help="Stream the 75 MB PRIMAP source and retain only global headline rows.",
    )
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if args.refresh_primap:
        refresh_primap_filtered()
    observations = write_observations()
    write_correlations(observations)
    write_carbon_budget()
    write_primap()
    write_hashes()


if __name__ == "__main__":
    main()
