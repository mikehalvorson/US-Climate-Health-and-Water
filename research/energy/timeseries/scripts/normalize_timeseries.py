"""Build deterministic, chart-ready energy time series from verified source files.

The script never joins historical observations to scenario output. Every row retains
its source variable, original value/unit, model/scenario identifiers, and record type.
"""

from __future__ import annotations

import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path

import pandas as pd


BASE = Path(__file__).resolve().parents[1]
RAW = BASE / "raw"
OUT = BASE / "normalized"
OUT.mkdir(parents=True, exist_ok=True)

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


def clean_number(value):
    if pd.isna(value):
        return None
    if isinstance(value, str):
        if value.strip().lower() in {"", "--", "not available", "na", "nan"}:
            return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def row(**kwargs):
    result = {field: "" for field in FIELDS}
    result.update(kwargs)
    if result["value"] != "":
        result["value"] = round(float(result["value"]), 9)
    if result["source_value"] != "":
        result["source_value"] = round(float(result["source_value"]), 9)
    return result


def write_csv(name, rows):
    rows = list(rows)
    rows.sort(
        key=lambda x: (
            x["dataset_id"],
            x["geography"],
            x["model"],
            x["scenario"],
            int(x["year"]),
            x["metric"],
            x["technology"],
            x["scope"],
        )
    )
    path = OUT / name
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    return path, rows


def normalize_owid_global():
    source_file = "owid-energy-data.csv"
    data = pd.read_csv(RAW / source_file)
    data = data[data["country"] == "World"]
    mapping = {
        "electricity_generation": ("total", "all sources"),
        "coal_electricity": ("coal", ""),
        "gas_electricity": ("natural_gas", ""),
        "oil_electricity": ("oil", ""),
        "nuclear_electricity": ("nuclear", ""),
        "hydro_electricity": ("hydropower", ""),
        "wind_electricity": ("wind", ""),
        "solar_electricity": ("solar", ""),
        "biofuel_electricity": ("bioenergy", "biofuels"),
        "other_renewable_exc_biofuel_electricity": (
            "other_renewables",
            "geothermal, marine, and other renewables excluding bioenergy",
        ),
    }
    rows = []
    for source_variable, (technology, detail) in mapping.items():
        for record in data[["year", source_variable]].dropna().itertuples(index=False):
            value = float(record[1])
            rows.append(
                row(
                    dataset_id="DS-OWID-ENERGY",
                    source_id="SRC-OWID-ENERGY",
                    record_type="historical",
                    geography="World",
                    geography_code="OWID_WRL",
                    region_level="world",
                    year=int(record.year),
                    metric="electricity_generation",
                    technology=technology,
                    technology_detail=detail,
                    scope="all_generation_reported_by_upstream_compilation",
                    value=value,
                    unit="TWh",
                    source_value=value,
                    source_unit="TWh",
                    source_variable=source_variable,
                    upstream_status="historical_compilation; latest years may be estimated upstream",
                    source_vintage="downloaded_2026-08-01",
                    source_file=source_file,
                )
            )
    return write_csv("global-electricity-generation-history.csv", rows)


IRENA_TECH = {
    "Total renewable energy": "renewables_total",
    "Total renewable": "renewables_total",
    "Solar energy": "solar",
    "Wind energy": "wind",
    "Renewable hydropower": "hydropower",
    "Hydropower (excl. Pumped Storage)": "hydropower",
    "Pumped hydro": "pumped_hydro_storage",
    "Pumped storage": "pumped_hydro_storage",
    "Marine energy": "marine_energy",
    "Bioenergy": "bioenergy",
    "Geothermal energy": "geothermal",
    "Total non-renewable energy": "nonrenewables_total",
    "Total non-renewable": "nonrenewables_total",
    "Fossil fuels": "fossil_fuels_total",
    "Nuclear energy": "nuclear",
    "Nuclear": "nuclear",
    "Other non-renewable energy": "other_nonrenewable",
    "Other non-renewable energy n.e.s.": "other_nonrenewable_nec",
}


def normalize_irena_world():
    rows = []
    capacity_file = "irena-world-capacity-2000-2025.csv"
    capacity = pd.read_csv(RAW / capacity_file)
    value_col = "Electricity capacity statistics"
    capacity[value_col] = pd.to_numeric(capacity[value_col], errors="coerce")
    grouped = capacity.groupby(["Region", "Technology", "Year"], as_index=False)[value_col].sum(min_count=1)
    for record in grouped.to_dict(orient="records"):
        source_value = clean_number(record[value_col])
        if source_value is None:
            continue
        rows.append(
            row(
                dataset_id="DS-IRENASTAT-CAP26",
                source_id="SRC-IRENASTAT-CAP26",
                record_type="historical",
                geography="World",
                geography_code="GLO",
                region_level="world",
                year=int(record["Year"]),
                metric="installed_capacity",
                technology=IRENA_TECH.get(record["Technology"], record["Technology"].lower().replace(" ", "_")),
                technology_detail=record["Technology"],
                scope="on_grid_plus_off_grid",
                value=source_value / 1000,
                unit="GW",
                source_value=source_value,
                source_unit="MW",
                source_variable=record["Technology"],
                upstream_status="reported",
                source_vintage="2026-04-16",
                source_file=capacity_file,
            )
        )

    generation_file = "irena-world-generation-2000-2023.csv"
    generation = pd.read_csv(RAW / generation_file)
    value_col = "Electricity generation statistics"
    for record in generation.to_dict(orient="records"):
        source_value = clean_number(record[value_col])
        if source_value is None:
            continue
        rows.append(
            row(
                dataset_id="DS-IRENASTAT-GEN25",
                source_id="SRC-IRENASTAT-GEN25",
                record_type="historical",
                geography="World",
                geography_code="GLO",
                region_level="world",
                year=int(record["Year"]),
                metric=("storage_discharge" if record["Technology"] == "Pumped storage" else "electricity_generation"),
                technology=IRENA_TECH.get(record["Technology"], record["Technology"].lower().replace(" ", "_")),
                technology_detail=record["Technology"],
                scope="gross_generation_including_self_consumption",
                value=source_value / 1000,
                unit="TWh",
                source_value=source_value,
                source_unit="GWh",
                source_variable=record["Technology"],
                upstream_status="reported; 2024 omitted because IRENA flags aggregate generation as preliminary and inaccurate",
                source_vintage="2026-04-16",
                source_file=generation_file,
            )
        )
    return write_csv("global-irena-capacity-and-generation-history.csv", rows)


EIA_MER_TECH = {
    "CLETPUS": "coal",
    "PAETPUS": "petroleum",
    "NGETPUS": "natural_gas",
    "OJETPUS": "other_fossil_gases",
    "NUETPUS": "nuclear",
    "HPETPUS": "pumped_hydro_storage",
    "HVETPUS": "hydropower",
    "WDETPUS": "wood",
    "WSETPUS": "waste",
    "GEETPUS": "geothermal",
    "SOETPUS": "solar_utility_scale",
    "WYETPUS": "wind",
    "ELETPUS": "total",
}


def normalize_eia_us_history():
    source_file = "eia-mer-table-7.2a.csv"
    data = pd.read_csv(RAW / source_file, dtype=str)
    data = data[data["YYYYMM"].str.endswith("13", na=False)]
    rows = []
    for record in data.itertuples(index=False):
        value = clean_number(record.Value)
        if value is None or record.MSN not in EIA_MER_TECH:
            continue
        year = int(record.YYYYMM[:4])
        technology = EIA_MER_TECH[record.MSN]
        rows.append(
            row(
                dataset_id="DS-EIA-MER-7.2A",
                source_id="SRC-EIA-MER-7.2A",
                record_type="historical",
                geography="United States",
                geography_code="USA",
                region_level="country",
                year=year,
                metric=("storage_net_generation" if technology == "pumped_hydro_storage" else "electricity_generation"),
                technology=technology,
                technology_detail=record.Description,
                scope="all_sectors; utility_scale for solar",
                value=value / 1000,
                unit="TWh",
                source_value=value,
                source_unit=record.Unit,
                source_variable=record.MSN,
                upstream_status="preliminary" if year == 2025 else "reported",
                source_vintage="MER_June_2026",
                source_file=source_file,
            )
        )

    solar_file = "eia-mer-table-10.6.csv"
    solar = pd.read_csv(RAW / solar_file, dtype=str)
    solar = solar[solar["YYYYMM"].str.endswith("13", na=False)]
    solar_mapping = {
        "SOT7PUS": ("solar_small_scale", "small_scale_all_sectors"),
        "SOT5PUS": ("solar_utility_scale", "utility_scale_all_sectors"),
        "SOTEPUS": ("solar_total", "utility_plus_small_scale"),
    }
    for record in solar.itertuples(index=False):
        value = clean_number(record.Value)
        if value is None or record.MSN not in solar_mapping:
            continue
        technology, scope = solar_mapping[record.MSN]
        year = int(record.YYYYMM[:4])
        rows.append(
            row(
                dataset_id="DS-EIA-MER-10.6",
                source_id="SRC-EIA-MER-10.6",
                record_type="historical",
                geography="United States",
                geography_code="USA",
                region_level="country",
                year=year,
                metric="electricity_generation",
                technology=technology,
                technology_detail=record.Description,
                scope=scope,
                value=value / 1000,
                unit="TWh",
                source_value=value,
                source_unit=record.Unit,
                source_variable=record.MSN,
                upstream_status="preliminary" if year == 2025 else "reported_or_upstream_estimate",
                source_vintage="MER_June_2026",
                source_file=solar_file,
            )
        )
    return write_csv("us-electricity-generation-history.csv", rows)


AEO_CASES = {
    "baseline": "Counterfactual Baseline",
    "highogs": "High Oil and Gas Supply",
    "lowogs": "Low Oil and Gas Supply",
    "highmacro": "High Economic Growth",
    "lowmacro": "Low Economic Growth",
    "highZTC": "High Zero-Carbon Technology Cost",
    "lowZTC": "Low Zero-Carbon Technology Cost",
    "altelec": "Alternative Electricity",
    "alttrnp": "Alternative Transportation",
    "electrnp": "Alternative Electricity and Transportation",
    "higheldmd": "High Electricity Demand",
}

AEO_TABLE8 = {
    "ESD000:xx_CoalInSocks": "coal",
    "ESD000:xx_Petroleum": "petroleum",
    "ESD000:xx_NaturalGas": "natural_gas",
    "ESD000:xx_NuclearPower": "nuclear",
    "ESD000:xx_RenewableSour": "renewables_total",
    "ESD000:xx_Hydrogen": "hydrogen",
    "ESD000:xx_OtherWithPump": "other_including_pumped_storage",
    "ESD000:ga_TotalElectric": "total",
}

AEO_RENEWABLE_CODES = {
    "Hydropowers": "hydropower",
    "ConventionalH": "hydropower",
    "Geothermal": "geothermal",
    "MunicipalSoli": "municipal_waste",
    "AllSolidWaste": "municipal_waste",
    "WoodandOtherB": "bioenergy",
    "AllBiomass": "bioenergy",
    "Biomass": "bioenergy",
    "SolarPhotovol": "solar",
    "AllSunnyOut": "solar",
    "OffshoreWind": "wind_offshore",
    "WindWind": "wind",
    "WindyWindy": "wind",
    "WetandDryWind": "wind",
    "Wind": "wind_onshore",
    "TotalTotal": "renewables_total",
    "Total": "renewables_total",
}


def aeo_year_columns(frame):
    columns = []
    for index, value in enumerate(frame.iloc[9].tolist()):
        number = clean_number(value)
        if number is not None and 2025 <= int(number) <= 2050:
            columns.append((index, int(number)))
    return columns


def renewable_code_to_technology(code):
    suffix = code.split("_", 1)[-1]
    for token, technology in AEO_RENEWABLE_CODES.items():
        if token in suffix:
            return technology
    return suffix.lower()


def normalize_aeo_us():
    rows = []
    for case_key, scenario in AEO_CASES.items():
        if case_key == "baseline":
            table8_file = "eia-aeo2026-table8-electricity.xlsx"
            table16_file = "eia-aeo2026-table16-renewables.xlsx"
        else:
            table8_file = f"eia-aeo2026-{case_key}-table8.xlsx"
            table16_file = f"eia-aeo2026-{case_key}-table16.xlsx"

        table8 = pd.read_excel(RAW / table8_file, header=None)
        for index, year in aeo_year_columns(table8):
            for source_code, technology in AEO_TABLE8.items():
                matches = table8.index[table8.iloc[:, 0] == source_code]
                if len(matches) != 1:
                    raise ValueError(f"Expected one {source_code} row in {table8_file}")
                source_row = matches[0]
                source_value = clean_number(table8.iat[source_row, index])
                if source_value is None:
                    continue
                rows.append(
                    row(
                        dataset_id="DS-EIA-AEO2026",
                        source_id="SRC-EIA-AEO2026-TABLES",
                        record_type="scenario",
                        model="NEMS",
                        scenario=scenario,
                        scenario_family="AEO2026 case",
                        geography="United States",
                        geography_code="USA",
                        region_level="country",
                        year=year,
                        metric="electricity_generation",
                        technology=technology,
                        technology_detail=str(table8.iat[source_row, 1]),
                        scope="all_sectors",
                        value=source_value,
                        unit="TWh",
                        source_value=source_value,
                        source_unit="billion kilowatthours",
                        source_variable=source_code,
                        upstream_status="scenario_output_not_forecast",
                        source_vintage="AEO2026_April_2026",
                        source_file=table8_file,
                    )
                )

        table16 = pd.read_excel(RAW / table16_file, header=None)
        year_columns = aeo_year_columns(table16)
        for source_row in table16.index:
            code = table16.iat[source_row, 0]
            if not isinstance(code, str) or not code.startswith("REN000:"):
                continue
            prefix = code.split(":", 1)[1].split("_", 1)[0]
            if prefix not in {"ba", "ca", "da", "ea", "x1", "x2"}:
                continue
            if prefix in {"ba", "da", "x1"}:
                metric = "installed_capacity"
            else:
                metric = "electricity_generation"
            scope = {
                "ba": "electric_power_sector",
                "ca": "electric_power_sector",
                "da": "end_use_sectors",
                "ea": "end_use_sectors",
                "x1": "all_sectors",
                "x2": "all_sectors",
            }[prefix]
            technology = renewable_code_to_technology(code)
            for index, year in year_columns:
                source_value = clean_number(table16.iat[source_row, index])
                if source_value is None:
                    continue
                if metric == "electricity_generation":
                    unit = "TWh"
                elif technology == "solar" and scope == "end_use_sectors":
                    unit = "GWdc"
                elif technology == "solar" and scope == "all_sectors":
                    unit = "GW_mixed_ac_dc"
                else:
                    unit = "GW"
                rows.append(
                    row(
                        dataset_id="DS-EIA-AEO2026",
                        source_id="SRC-EIA-AEO2026-TABLES",
                        record_type="scenario",
                        model="NEMS",
                        scenario=scenario,
                        scenario_family="AEO2026 case",
                        geography="United States",
                        geography_code="USA",
                        region_level="country",
                        year=year,
                        metric=metric,
                        technology=technology,
                        technology_detail=str(table16.iat[source_row, 1]),
                        scope=scope,
                        value=source_value,
                        unit=unit,
                        source_value=source_value,
                        source_unit=("billion kilowatthours" if metric == "electricity_generation" else "gigawatts; solar end-use capacity is DC"),
                        source_variable=code,
                        upstream_status="scenario_output_not_forecast",
                        source_vintage="AEO2026_April_2026",
                        source_file=table16_file,
                    )
                )
    return write_csv("us-electricity-projections-aeo2026.csv", rows)


NREL_CAPACITY = {
    "battery_4_MW": ("battery_storage_4h", "storage_power_capacity"),
    "battery_8_MW": ("battery_storage_8h", "storage_power_capacity"),
    "bio_MW": ("bioenergy", "installed_capacity"),
    "bio-ccs_MW": ("bioenergy_ccs", "installed_capacity"),
    "coal_ccs_MW": ("coal_ccs", "installed_capacity"),
    "coal_MW": ("coal", "installed_capacity"),
    "csp_MW": ("solar_csp", "installed_capacity"),
    "distpv_MW": ("solar_pv_distributed", "installed_capacity"),
    "gas_cc_ccs_MW": ("natural_gas_combined_cycle_ccs", "installed_capacity"),
    "gas_cc_MW": ("natural_gas_combined_cycle", "installed_capacity"),
    "gas_ct_MW": ("natural_gas_combustion_turbine", "installed_capacity"),
    "geo_MW": ("geothermal", "installed_capacity"),
    "hydro_MW": ("hydropower", "installed_capacity"),
    "nuclear_MW": ("nuclear", "installed_capacity"),
    "nuclear_smr_MW": ("nuclear_smr", "installed_capacity"),
    "o-g-s_MW": ("oil_gas_steam", "installed_capacity"),
    "pumped-hydro_MW": ("pumped_hydro_storage", "storage_power_capacity"),
    "h2-ct_MW": ("hydrogen_combustion_turbine", "installed_capacity"),
    "upv_MW": ("solar_pv_utility", "installed_capacity"),
    "wind_offshore_MW": ("wind_offshore", "installed_capacity"),
    "wind_onshore_MW": ("wind_onshore", "installed_capacity"),
}

NREL_GENERATION = {
    "battery_4_MWh": ("battery_storage_4h", "storage_discharge"),
    "battery_8_MWh": ("battery_storage_8h", "storage_discharge"),
    "bio_MWh": ("bioenergy", "electricity_generation"),
    "bio-ccs_MWh": ("bioenergy_ccs", "electricity_generation"),
    "coal_ccs_MWh": ("coal_ccs", "electricity_generation"),
    "coal_MWh": ("coal", "electricity_generation"),
    "csp_MWh": ("solar_csp", "electricity_generation"),
    "distpv_MWh": ("solar_pv_distributed", "electricity_generation"),
    "gas_cc_ccs_MWh": ("natural_gas_combined_cycle_ccs", "electricity_generation"),
    "gas_cc_MWh": ("natural_gas_combined_cycle", "electricity_generation"),
    "gas_ct_MWh": ("natural_gas_combustion_turbine", "electricity_generation"),
    "geo_MWh": ("geothermal", "electricity_generation"),
    "hydro_MWh": ("hydropower", "electricity_generation"),
    "nuclear_MWh": ("nuclear", "electricity_generation"),
    "nuclear_smr_MWh": ("nuclear_smr", "electricity_generation"),
    "o-g-s_MWh": ("oil_gas_steam", "electricity_generation"),
    "pumped-hydro_MWh": ("pumped_hydro_storage", "storage_discharge"),
    "h2-ct_MWh": ("hydrogen_combustion_turbine", "electricity_generation"),
    "upv_MWh": ("solar_pv_utility", "electricity_generation"),
    "wind_offshore_MWh": ("wind_offshore", "electricity_generation"),
    "wind_onshore_MWh": ("wind_onshore", "electricity_generation"),
    "canada_MWh": ("electricity_imports_canada", "electricity_imports"),
    "generation": ("total", "electricity_generation"),
}


def normalize_nrel_us():
    source_file = "nrel-standard-scenarios-2024-nations.csv"
    data = pd.read_csv(RAW / source_file, skiprows=3)
    rows = []
    mappings = [(NREL_CAPACITY, "MW", "GW", 1000), (NREL_GENERATION, "MWh", "TWh", 1_000_000)]
    for record in data.to_dict(orient="records"):
        for mapping, source_unit, unit, divisor in mappings:
            for source_variable, (technology, metric) in mapping.items():
                source_value = clean_number(record.get(source_variable))
                if source_value is None:
                    continue
                rows.append(
                    row(
                        dataset_id="DS-NREL-STANDARD-SCENARIOS-2024",
                        source_id="SRC-NREL-STANDARD-SCENARIOS-2024",
                        record_type="scenario",
                        model="ReEDS",
                        scenario=str(record["scenario"]),
                        scenario_family=str(record["policy"]),
                        geography="United States",
                        geography_code="USA",
                        region_level="country",
                        year=int(record["t"]),
                        metric=metric,
                        technology=technology,
                        technology_detail=source_variable,
                        scope="contiguous_United_States_model",
                        value=source_value / divisor,
                        unit=unit,
                        source_value=source_value,
                        source_unit=source_unit,
                        source_variable=source_variable,
                        upstream_status="scenario_output_not_forecast",
                        source_vintage="Standard_Scenarios_2024",
                        source_file=source_file,
                    )
                )
    return write_csv("us-electricity-projections-nrel-standard-scenarios-2024.csv", rows)


NGFS_TECH = {
    "": "total",
    "Biomass": "bioenergy",
    "Biomass|w/ CCS": "bioenergy_ccs",
    "Biomass|w/o CCS": "bioenergy_without_ccs",
    "Coal": "coal",
    "Coal|w/ CCS": "coal_ccs",
    "Coal|w/o CCS": "coal_without_ccs",
    "Fossil": "fossil_fuels_total",
    "Fossil|w/ CCS": "fossil_fuels_ccs",
    "Fossil|w/o CCS": "fossil_fuels_without_ccs",
    "Gas": "natural_gas",
    "Gas|w/ CCS": "natural_gas_ccs",
    "Gas|w/o CCS": "natural_gas_without_ccs",
    "Geothermal": "geothermal",
    "Hydro": "hydropower",
    "Non-Biomass Renewables": "non_biomass_renewables",
    "Nuclear": "nuclear",
    "Oil": "oil",
    "Oil|w/ CCS": "oil_ccs",
    "Oil|w/o CCS": "oil_without_ccs",
    "Other": "other",
    "Solar": "solar",
    "Solar|CSP": "solar_csp",
    "Solar|PV": "solar_pv",
    "Storage": "storage",
    "Storage Losses": "storage_losses",
    "Trade": "electricity_trade",
    "Transmission Losses": "transmission_losses",
    "Wind": "wind",
    "Wind|Offshore": "wind_offshore",
    "Wind|Onshore": "wind_onshore",
}


def normalize_ngfs_world():
    source_file = "ngfs-phase5-world-electricity-2020-2100.json"
    data = json.loads((RAW / source_file).read_text(encoding="utf-8-sig"))
    rows = []
    for record in data:
        variable = record["variable"]
        if variable.startswith("Capacity|Electricity"):
            suffix = variable.removeprefix("Capacity|Electricity").removeprefix("|")
            metric = "installed_capacity"
            unit = "GW"
            value = float(record["value"])
        elif variable.startswith("Secondary Energy|Electricity"):
            suffix = variable.removeprefix("Secondary Energy|Electricity").removeprefix("|")
            if suffix in {"Storage Losses", "Transmission Losses"}:
                metric = "electricity_losses"
            elif suffix == "Trade":
                metric = "electricity_trade"
            else:
                metric = "electricity_generation"
            unit = "TWh"
            value = float(record["value"]) * (1_000_000 / 3_600)
        else:
            continue
        scenario = "Below 2°C" if record["scenario"] == "Below 2?C" else record["scenario"]
        rows.append(
            row(
                dataset_id="DS-NGFS-PHASE5.1",
                source_id="SRC-NGFS-PHASE5.1",
                record_type="scenario",
                model=record["model"],
                scenario=scenario,
                scenario_family="NGFS long-term transition scenario",
                geography="World",
                geography_code="World",
                region_level="world",
                year=int(record["year"]),
                metric=metric,
                technology=NGFS_TECH.get(suffix, suffix.lower().replace(" ", "_").replace("|", "_")),
                technology_detail=suffix or "all electricity",
                scope="IAM_native_world_region",
                value=value,
                unit=unit,
                source_value=float(record["value"]),
                source_unit=record["unit"],
                source_variable=variable,
                upstream_status="scenario_output_not_forecast",
                source_vintage="NGFS_Phase_5.1_2026-03-20",
                source_file=source_file,
            )
        )
    return write_csv("global-electricity-projections-ngfs-phase5.1.csv", rows)


def normalize_specialized_global():
    rows = []
    for year, value, record_type, status in [
        (2021, 0.535, "historical_reference", "reported benchmark in scenario figure"),
        (2030, 70.0, "scenario", "IRENA WETO 2022 1.5°C scenario output"),
        (2050, 350.0, "scenario", "IRENA WETO 2022 1.5°C scenario output / market potential"),
    ]:
        rows.append(
            row(
                dataset_id="DS-IRENA-WETO2022-OCEAN",
                source_id="SRC-IRENA-OCEAN-INVESTMENT-2023",
                record_type=record_type,
                model="IRENA WETO",
                scenario="1.5°C Scenario",
                scenario_family="WETO 2022",
                geography="World",
                geography_code="GLO",
                region_level="world",
                year=year,
                metric="installed_capacity",
                technology="marine_energy",
                technology_detail="ocean energy; includes tidal, wave, and other ocean technologies",
                scope="global",
                value=value,
                unit="GW",
                source_value=value,
                source_unit="GW",
                source_variable="Figure 1 Global ocean energy capacity forecast",
                upstream_status=status,
                source_vintage="IRENA_2023_citing_WETO_2022",
                source_file="external_report_not_redistributed",
            )
        )
    return write_csv("global-specialized-technology-scenarios.csv", rows)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def build_coverage(outputs):
    files = []
    detailed = []
    for path, rows in outputs:
        years = [int(record["year"]) for record in rows]
        files.append(
            {
                "file": f"normalized/{path.name}",
                "sha256": sha256(path),
                "rows": len(rows),
                "year_min": min(years),
                "year_max": max(years),
                "datasets": sorted({record["dataset_id"] for record in rows}),
                "record_types": sorted({record["record_type"] for record in rows}),
                "models": sorted({record["model"] for record in rows if record["model"]}),
                "scenarios_count": len({record["scenario"] for record in rows if record["scenario"]}),
                "metrics": sorted({record["metric"] for record in rows}),
                "technologies": sorted({record["technology"] for record in rows}),
            }
        )
        groups = defaultdict(list)
        for record in rows:
            groups[(record["dataset_id"], record["geography"], record["record_type"], record["metric"], record["technology"])].append(int(record["year"]))
        for key, group_years in sorted(groups.items()):
            detailed.append(
                {
                    "dataset_id": key[0],
                    "geography": key[1],
                    "record_type": key[2],
                    "metric": key[3],
                    "technology": key[4],
                    "year_min": min(group_years),
                    "year_max": max(group_years),
                    "distinct_years": len(set(group_years)),
                    "rows": len(group_years),
                }
            )
    coverage = {
        "coverage_id": "energy-timeseries-coverage-v1",
        "generated_at": "2026-08-01",
        "chart_readiness": {
            "global_history_through_2025": "ready",
            "us_history_1949_through_2025": "ready",
            "us_scenarios_through_2050": "ready; EIA AEO2026 and NREL Standard Scenarios 2024",
            "global_scenarios_through_2070": "ready; NGFS Phase 5.1 includes 2070 and continues to 2100",
            "marine_history": "ready; IRENASTAT capacity through 2025 and generation through 2023",
            "marine_scenario_through_2050": "ready; IRENA WETO 1.5°C milestone series",
            "us_scenarios_after_2050": "not available in the selected U.S.-specific federal/laboratory models; do not extrapolate",
        },
        "non_splice_rule": "Historical and scenario records must remain visibly distinct. Scenario calibration years are not observations.",
        "files": files,
        "detailed_coverage": detailed,
    }
    path = BASE / "coverage.json"
    path.write_text(json.dumps(coverage, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def build_ingestion_manifest(outputs):
    raw_inputs = sorted(
        {
            record["source_file"]
            for _, rows in outputs
            for record in rows
            if record["source_file"] != "external_report_not_redistributed"
        }
    )
    manifest = {
        "manifest_id": "energy-timeseries-ingestion-v1",
        "as_of": "2026-08-01",
        "normalizer": "scripts/normalize_timeseries.py",
        "raw_directory_policy": "Raw downloads are retained locally and gitignored; normalized subsets and provenance are versioned.",
        "raw_inputs": [
            {
                "file": name,
                "bytes": (RAW / name).stat().st_size,
                "sha256": sha256(RAW / name),
            }
            for name in raw_inputs
        ],
        "normalized_outputs": [
            {
                "file": f"normalized/{path.name}",
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
                "rows": len(rows),
            }
            for path, rows in outputs
        ],
        "unit_conversions": [
            {"from": "million kilowatthours", "to": "TWh", "factor": 0.001},
            {"from": "billion kilowatthours", "to": "TWh", "factor": 1},
            {"from": "GWh", "to": "TWh", "factor": 0.001},
            {"from": "MWh", "to": "TWh", "factor": 0.000001},
            {"from": "MW", "to": "GW", "factor": 0.001},
            {"from": "EJ/yr", "to": "TWh", "factor": 277.7777777778},
        ],
        "known_limits": [
            "OWID is a processed compilation; source definitions and revisions must be retained.",
            "IRENA generation is gross and includes self-consumption; EIA generation is net. Do not compare without labeling.",
            "AEO and ReEDS outputs are scenarios, not predictions.",
            "NGFS public-license terms prohibit redistribution of a substantial portion of the database; this repository stores only a narrow world-electricity subset and links to the current explorer.",
            "AEO all-sector solar capacity mixes utility-scale AC and end-use DC measures and is labeled GW_mixed_ac_dc.",
        ],
    }
    (BASE / "ingestion-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def validate(outputs):
    errors = []
    for path, rows in outputs:
        if not rows:
            errors.append(f"{path.name}: empty")
        for index, record in enumerate(rows, start=2):
            missing = [field for field in ("dataset_id", "source_id", "record_type", "geography", "year", "metric", "technology", "unit", "source_variable") if record[field] == ""]
            if missing:
                errors.append(f"{path.name}:{index}: missing {missing}")
            if record["record_type"] == "scenario" and not record["scenario"]:
                errors.append(f"{path.name}:{index}: scenario row lacks scenario name")
    if errors:
        raise ValueError("\n".join(errors[:50]))


def main():
    outputs = [
        normalize_owid_global(),
        normalize_irena_world(),
        normalize_eia_us_history(),
        normalize_aeo_us(),
        normalize_nrel_us(),
        normalize_ngfs_world(),
        normalize_specialized_global(),
    ]
    validate(outputs)
    build_coverage(outputs)
    build_ingestion_manifest(outputs)
    print(json.dumps({"outputs": len(outputs), "rows": sum(len(rows) for _, rows in outputs)}, indent=2))


if __name__ == "__main__":
    main()
