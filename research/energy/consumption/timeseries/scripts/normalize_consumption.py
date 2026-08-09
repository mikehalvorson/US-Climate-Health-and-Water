"""Build deterministic electricity-consumption and demand-driver datasets.

The outputs preserve accounting scope, source values, units, scenario identity,
and value semantics. Identifiable loads such as EV charging are not treated as
additive to totals unless the source explicitly defines a disjoint component.
"""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

import pandas as pd


BASE = Path(__file__).resolve().parents[1]
ENERGY = BASE.parents[1]
RAW = ENERGY / "timeseries" / "raw"
OUT = BASE / "normalized"
OUT.mkdir(parents=True, exist_ok=True)

QUAD_TO_TWH = 1_000_000_000_000_000 / 3_412 / 1_000_000_000
EJ_TO_TWH = 277.77777777777777

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
    "sector",
    "end_use",
    "accounting_scope",
    "value",
    "unit",
    "value_semantics",
    "source_value",
    "source_unit",
    "source_variable",
    "upstream_status",
    "source_vintage",
    "source_file",
]


def item(**kwargs):
    output = {field: "" for field in FIELDS}
    output.update(kwargs)
    for field in ("value", "source_value"):
        if output[field] != "":
            output[field] = round(float(output[field]), 9)
    return output


def write_csv(filename: str, rows):
    rows = list(rows)
    rows.sort(
        key=lambda record: (
            record["dataset_id"],
            record["geography"],
            record["model"],
            record["scenario"],
            int(record["year"]),
            record["metric"],
            record["sector"],
            record["end_use"],
            record["value_semantics"],
        )
    )
    path = OUT / filename
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    return path, rows


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def annual_columns(frame: pd.DataFrame):
    years = []
    for column in range(2, frame.shape[1]):
        value = frame.iloc[142, column]
        try:
            year = int(float(value))
        except (TypeError, ValueError):
            continue
        if 2025 <= year <= 2050:
            years.append((column, year))
    if [year for _, year in years] != list(range(2025, 2051)):
        raise AssertionError("AEO workbook year columns are not 2025-2050")
    return years


def code_row(frame: pd.DataFrame, code: str):
    matches = frame.index[frame[0] == code].tolist()
    if len(matches) != 1:
        raise AssertionError(f"Expected one AEO row for {code}; found {len(matches)}")
    return int(matches[0])


AEO_CASE_FILES = {
    "eia-aeo2026-yearbyyear.xlsx": "Counterfactual Baseline",
    "eia-aeo2026-highogs-yearbyyear.xlsx": "High Oil and Gas Supply",
    "eia-aeo2026-lowogs-yearbyyear.xlsx": "Low Oil and Gas Supply",
    "eia-aeo2026-highmacro-yearbyyear.xlsx": "High Economic Growth",
    "eia-aeo2026-lowmacro-yearbyyear.xlsx": "Low Economic Growth",
    "eia-aeo2026-highZTC-yearbyyear.xlsx": "High Zero-Carbon Technology Cost",
    "eia-aeo2026-lowZTC-yearbyyear.xlsx": "Low Zero-Carbon Technology Cost",
    "eia-aeo2026-altelec-yearbyyear.xlsx": "Alternative Electricity",
    "eia-aeo2026-alttrnp-yearbyyear.xlsx": "Alternative Transportation",
    "eia-aeo2026-electrnp-yearbyyear.xlsx": "Alternative Electricity and Transportation",
    "eia-aeo2026-higheldmd-yearbyyear.xlsx": "High Electricity Demand",
}


AEO_BALANCE = {
    "ESD000:ga_TotalElectric": ("electricity_generation", "total", "all_sources", "total_net_generation_all_producers"),
    "ESD000:ga_TotalNetGener": ("net_generation_to_grid", "total", "all_sources", "generation_delivered_to_grid_after_direct_use"),
    "ESD000:ha_NetImports": ("net_imports", "total", "cross_border", "net_imports"),
    "ESD000:ia_Residential": ("electricity_sales", "residential", "all_end_uses", "sales_to_ultimate_customers"),
    "ESD000:ia_Commercial": ("electricity_sales", "commercial", "all_end_uses", "sales_to_ultimate_customers"),
    "ESD000:ia_Industrial": ("electricity_sales", "industrial", "all_end_uses", "sales_to_ultimate_customers"),
    "ESD000:ia_Transportatio": ("electricity_sales", "transportation", "all_end_uses", "sales_to_ultimate_customers"),
    "ESD000:ia_Total": ("electricity_sales", "total", "all_end_uses", "sales_to_ultimate_customers"),
    "ESD000:ia_DirectUse": ("direct_use", "total", "all_end_uses", "generation_used_on_site"),
    "ESD000:ia_TotalConsumpt": ("electricity_use", "total", "all_end_uses", "sales_plus_direct_use"),
}


RESIDENTIAL_END_USES = {
    "RKI000:fa_SpaceHeating": "space_heating",
    "RKI000:fa_SpaceCooling": "space_cooling",
    "RKI000:fa_WaterHeating": "water_heating",
    "RKI000:fa_Refrigeration": "refrigeration",
    "RKI000:fa_Cooking": "cooking",
    "RKI000:fa_ClothesDryers": "clothes_dryers",
    "RKI000:fa_Freezers": "freezers",
    "RKI000:fa_Lighting": "lighting",
    "RKI000:fa_ClothesWasher": "clothes_washers",
    "RKI000:fa_Dishwashers": "dishwashers",
    "RKI000:fa_ColorTelevisi": "televisions_and_related_equipment",
    "RKI000:fa_PersonalCompu": "computers_and_related_equipment",
    "RKI000:fa_FurnaceFans": "furnace_fans_and_boiler_pumps",
    "RKI000:fa_OtherUses": "other_uses",
    "RKI000:fa_DeliveredEner": "gross_end_use_electricity",
    "RKI000:fa_PurchElecEVCha": "ev_charging",
    "RKI000:fa_OwnGeneration": "onsite_generation_for_own_use",
    "RKI000:fa_PurchasedElec": "purchased_electricity_at_location",
}


COMMERCIAL_END_USES = {
    "CKI000:ga_SpaceHeating": "space_heating",
    "CKI000:ga_SpaceCooling": "space_cooling",
    "CKI000:ga_WaterHeating": "water_heating",
    "CKI000:ga_Ventilation": "ventilation",
    "CKI000:ga_Cooking": "cooking",
    "CKI000:ga_Lighting": "lighting",
    "CKI000:ga_Refrigeration": "refrigeration",
    "CKI000:ga_DataCtrServ": "data_center_servers",
    "CKI000:ha_CompOfficeEquipme": "computers_and_office_equipment",
    "CKI000:ha_OtherUses": "other_uses",
    "CKI000:ha_ElecSubtotal": "gross_end_use_electricity",
    "CKI000:ha_PurchElecEVCha": "ev_charging",
    "CKI000:ha_OwnGeneration": "onsite_generation_for_own_use",
    "CKI000:ha_PurchasedElec": "purchased_electricity_at_location",
}


INDUSTRIAL_COMPONENTS = {
    "IKI000:ia_PurchasedElec": "excluding_refining_and_hydrogen_production",
    "IKI000:ka_PurchasedElec": "refining",
    "IKI000:la_PurchasedElec": "hydrogen_production",
    "IKI000:fa_PurchasedElec": "total_purchased_electricity",
}


DRIVERS = {
    "MEI000:ba_RealGrossDome": ("economy", "real_gdp", "billion_2012_chain_weighted_usd"),
    "MEI000:ka_Populationwit": ("population", "population", "million_people"),
    "MEI000:ba_RealDisposabl": ("economy", "real_disposable_personal_income", "billion_2012_chain_weighted_usd"),
    "MEI000:ga_HousingStarts": ("residential", "housing_starts", "million_units_per_year"),
    "MEI000:ha_(billionsquar": ("commercial", "commercial_floorspace", "billion_square_feet"),
    "MEI000:ia_UnitSalesofLi": ("transportation", "light_duty_vehicle_sales", "million_vehicles_per_year"),
    "RKI000:ba_Total": ("residential", "households", "million_households"),
    "TKI000:ba_Light-DutyVeh": ("transportation", "light_duty_vehicle_miles", "billion_vehicle_miles"),
    "TKI000:ba_CommercialLig": ("transportation", "commercial_light_truck_miles", "billion_vehicle_miles"),
    "TKI000:ba_FreightTrucks": ("transportation", "freight_truck_miles", "billion_vehicle_miles"),
}


def normalize_aeo():
    balance_rows = []
    end_use_rows = []
    driver_rows = []
    for filename, expected_case in AEO_CASE_FILES.items():
        frame = pd.read_excel(RAW / filename, header=None)
        scenario = str(frame.iloc[136, 5]).strip()
        if scenario != expected_case:
            raise AssertionError(f"{filename}: expected {expected_case}, found {scenario}")
        years = annual_columns(frame)
        source_vintage = "2026-04"

        balance_values = {}
        for code, (metric, sector, end_use, scope) in AEO_BALANCE.items():
            index = code_row(frame, code)
            balance_values[code] = {}
            for column, year in years:
                source_value = float(frame.iloc[index, column])
                balance_values[code][year] = source_value
                balance_rows.append(
                    item(
                        dataset_id="DS-EIA-AEO2026",
                        source_id="SRC-EIA-AEO2026-TABLES",
                        record_type="scenario",
                        model="NEMS",
                        scenario=scenario,
                        scenario_family="AEO2026",
                        geography="United States",
                        geography_code="USA",
                        region_level="country",
                        year=year,
                        metric=metric,
                        sector=sector,
                        end_use=end_use,
                        accounting_scope=scope,
                        value=source_value,
                        unit="TWh",
                        value_semantics="point",
                        source_value=source_value,
                        source_unit="billion_kWh",
                        source_variable=code,
                        upstream_status="conditional_projection_not_prediction",
                        source_vintage=source_vintage,
                        source_file=filename,
                    )
                )
        for _, year in years:
            loss_value = (
                balance_values["ESD000:ga_TotalNetGener"][year]
                + balance_values["ESD000:ha_NetImports"][year]
                - balance_values["ESD000:ia_Total"][year]
            )
            balance_rows.append(
                item(
                    dataset_id="DS-EIA-AEO2026",
                    source_id="SRC-EIA-AEO2026-TABLES",
                    record_type="scenario",
                    model="NEMS",
                    scenario=scenario,
                    scenario_family="AEO2026",
                    geography="United States",
                    geography_code="USA",
                    region_level="country",
                    year=year,
                    metric="transmission_distribution_and_unaccounted",
                    sector="total",
                    end_use="system_balance_residual",
                    accounting_scope="net_grid_generation_plus_net_imports_minus_total_sales",
                    value=loss_value,
                    unit="TWh",
                    value_semantics="derived_point",
                    source_value=loss_value,
                    source_unit="billion_kWh_derived",
                    source_variable="ESD000:ga_TotalNetGener + ESD000:ha_NetImports - ESD000:ia_Total",
                    upstream_status="derived_from_conditional_projection",
                    source_vintage=source_vintage,
                    source_file=filename,
                )
            )

        for sector, mapping in (("residential", RESIDENTIAL_END_USES), ("commercial", COMMERCIAL_END_USES)):
            for code, end_use in mapping.items():
                index = code_row(frame, code)
                for column, year in years:
                    source_value = float(frame.iloc[index, column])
                    if end_use == "data_center_servers":
                        scope = "server_compute_only_not_total_data_center_facility"
                    elif end_use == "ev_charging":
                        scope = "charging_at_sector_location_already_in_sector_electricity_sales"
                    elif end_use == "gross_end_use_electricity":
                        scope = "gross_end_use_subtotal_before_onsite_generation_accounting"
                    else:
                        scope = "aeo_sector_end_use_accounting"
                    end_use_rows.append(
                        item(
                            dataset_id="DS-EIA-AEO2026",
                            source_id="SRC-EIA-AEO2026-TABLES",
                            record_type="scenario",
                            model="NEMS",
                            scenario=scenario,
                            scenario_family="AEO2026",
                            geography="United States",
                            geography_code="USA",
                            region_level="country",
                            year=year,
                            metric=("identifiable_load" if end_use in {"data_center_servers", "ev_charging"} else "sector_end_use_electricity"),
                            sector=sector,
                            end_use=end_use,
                            accounting_scope=scope,
                            value=source_value * QUAD_TO_TWH,
                            unit="TWh",
                            value_semantics="point",
                            source_value=source_value,
                            source_unit="quadrillion_Btu",
                            source_variable=code,
                            upstream_status="conditional_projection_not_prediction",
                            source_vintage=source_vintage,
                            source_file=filename,
                        )
                    )

        for code, end_use in INDUSTRIAL_COMPONENTS.items():
            index = code_row(frame, code)
            for column, year in years:
                source_value = float(frame.iloc[index, column])
                end_use_rows.append(
                    item(
                        dataset_id="DS-EIA-AEO2026",
                        source_id="SRC-EIA-AEO2026-TABLES",
                        record_type="scenario",
                        model="NEMS",
                        scenario=scenario,
                        scenario_family="AEO2026",
                        geography="United States",
                        geography_code="USA",
                        region_level="country",
                        year=year,
                        metric="sector_end_use_electricity",
                        sector="industrial",
                        end_use=end_use,
                        accounting_scope="purchased_electricity; total_equals_three_disjoint_components",
                        value=source_value * QUAD_TO_TWH,
                        unit="TWh",
                        value_semantics="point",
                        source_value=source_value,
                        source_unit="quadrillion_Btu",
                        source_variable=code,
                        upstream_status="conditional_projection_not_prediction",
                        source_vintage=source_vintage,
                        source_file=filename,
                    )
                )

        for code, (sector, end_use, unit) in DRIVERS.items():
            index = code_row(frame, code)
            for column, year in years:
                source_value = float(frame.iloc[index, column])
                driver_rows.append(
                    item(
                        dataset_id="DS-EIA-AEO2026",
                        source_id="SRC-EIA-AEO2026-TABLES",
                        record_type="scenario",
                        model="NEMS",
                        scenario=scenario,
                        scenario_family="AEO2026",
                        geography="United States",
                        geography_code="USA",
                        region_level="country",
                        year=year,
                        metric="demand_driver_indicator",
                        sector=sector,
                        end_use=end_use,
                        accounting_scope="native_aeo_indicator",
                        value=source_value,
                        unit=unit,
                        value_semantics="point",
                        source_value=source_value,
                        source_unit=unit,
                        source_variable=code,
                        upstream_status="conditional_projection_not_prediction",
                        source_vintage=source_vintage,
                        source_file=filename,
                    )
                )
    return (
        write_csv("us-electricity-supply-demand-aeo2026.csv", balance_rows),
        write_csv("us-electricity-end-use-aeo2026.csv", end_use_rows),
        write_csv("us-demand-drivers-aeo2026.csv", driver_rows),
    )


def normalize_mer():
    filename = "eia-mer-table-7.6.csv"
    data = pd.read_csv(RAW / filename)
    data["YYYYMM"] = data["YYYYMM"].astype(str)
    data = data[data["YYYYMM"].str.endswith("13")]
    mapping = {
        "ESRCPUS": ("electricity_sales", "residential", "all_end_uses", "sales_to_ultimate_customers"),
        "ESCCPUS": ("electricity_sales", "commercial", "all_end_uses", "sales_to_ultimate_customers"),
        "ESICPUS": ("electricity_sales", "industrial", "all_end_uses", "sales_to_ultimate_customers"),
        "ESACPUS": ("electricity_sales", "transportation", "all_end_uses", "sales_to_ultimate_customers"),
        "ESTCPUS": ("electricity_sales", "total", "all_end_uses", "sales_to_ultimate_customers"),
        "ELDUPUS": ("direct_use", "total", "all_end_uses", "electricity_generated_and_used_on_site"),
        "ELTCPUS": ("electricity_use", "total", "all_end_uses", "sales_plus_direct_use"),
        "ESVHPUS": ("identifiable_load", "transportation", "on_road_light_duty_ev_charging", "overlay_already_in_sector_sales_do_not_add"),
    }
    rows = []
    for record in data.to_dict(orient="records"):
        if record["MSN"] not in mapping:
            continue
        try:
            source_value = float(record["Value"])
        except (TypeError, ValueError):
            continue
        year = int(record["YYYYMM"][:4])
        metric, sector, end_use, scope = mapping[record["MSN"]]
        if record["MSN"] == "ESVHPUS":
            status = "experimental_estimate; methodology_break_at_2023"
        elif year == 2025:
            status = "preliminary"
        else:
            status = "reported"
        rows.append(
            item(
                dataset_id="DS-EIA-MER-7.6",
                source_id="SRC-EIA-MER-7.6",
                record_type="historical",
                geography="United States",
                geography_code="USA",
                region_level="country",
                year=year,
                metric=metric,
                sector=sector,
                end_use=end_use,
                accounting_scope=scope,
                value=source_value / 1000,
                unit="TWh",
                value_semantics="point",
                source_value=source_value,
                source_unit="million_kWh",
                source_variable=record["MSN"],
                upstream_status=status,
                source_vintage="2026-07",
                source_file=filename,
            )
        )
    return write_csv("us-electricity-consumption-history.csv", rows)


def normalize_owid_world_demand():
    filename = "owid-energy-data.csv"
    data = pd.read_csv(RAW / filename)
    data = data[(data["country"] == "World") & data["electricity_demand"].notna()]
    rows = []
    for record in data[["year", "electricity_demand"]].to_dict(orient="records"):
        value = float(record["electricity_demand"])
        year = int(record["year"])
        rows.append(
            item(
                dataset_id="DS-OWID-ENERGY",
                source_id="SRC-OWID-ENERGY",
                record_type="historical",
                geography="World",
                geography_code="OWID_WRL",
                region_level="world",
                year=year,
                metric="electricity_demand",
                sector="total",
                end_use="all_system_demand",
                accounting_scope="Ember_definition_gross_generation_plus_net_imports; not_final_electricity_consumption",
                value=value,
                unit="TWh",
                value_semantics="point",
                source_value=value,
                source_unit="TWh",
                source_variable="electricity_demand",
                upstream_status=("processed_compilation; latest_year_estimated_and_subject_to_revision" if year == 2025 else "processed_compilation"),
                source_vintage="Ember_2026; OWID_downloaded_2026-08-01",
                source_file=filename,
            )
        )
    return write_csv("global-electricity-demand-history-ember-owid.csv", rows)


NGFS_VARIABLES = {
    "Final Energy|Electricity": ("total", "all_electricity", "aggregate_total"),
    "Final Energy|Industry|Electricity": ("industry", "all_industry", "sector_total"),
    "Final Energy|Industry|Cement|Electricity": ("industry", "cement", "industry_subsector"),
    "Final Energy|Industry|Chemicals|Electricity": ("industry", "chemicals", "industry_subsector"),
    "Final Energy|Industry|Chemicals|High value chemicals|Electricity": ("industry", "high_value_chemicals", "chemicals_subsector"),
    "Final Energy|Industry|Non-ferrous metals|Electricity": ("industry", "nonferrous_metals", "industry_subsector"),
    "Final Energy|Industry|Other|Electricity": ("industry", "other_industry", "industry_subsector"),
    "Final Energy|Industry|Steel|Electricity": ("industry", "steel", "industry_subsector"),
    "Final Energy|Other Sector|Electricity": ("other", "all_other", "sector_total"),
    "Final Energy|Residential and Commercial|Electricity": ("residential_and_commercial", "all_buildings", "sector_total"),
    "Final Energy|Residential and Commercial|Commercial|Electricity": ("commercial", "all_commercial", "buildings_subsector"),
    "Final Energy|Residential and Commercial|Residential|Electricity": ("residential", "all_residential", "buildings_subsector"),
    "Final Energy|Transportation|Electricity": ("transportation", "all_transportation", "sector_total"),
    "Final Energy|Transportation|Freight|Electricity": ("transportation", "freight", "transportation_subsector"),
    "Final Energy|Transportation|Passenger|Electricity": ("transportation", "passenger", "transportation_subsector"),
}


def normalize_ngfs():
    filename = "ngfs-phase5-world-electricity-demand-2020-2100.json"
    data = json.loads((RAW / filename).read_text(encoding="utf-8"))
    rows = []
    for record in data:
        variable = record["variable"]
        if variable not in NGFS_VARIABLES:
            raise AssertionError(f"Unmapped NGFS variable: {variable}")
        if record["unit"] != "EJ/yr" or record["region"] != "World":
            raise AssertionError("Unexpected NGFS unit or geography")
        sector, end_use, hierarchy = NGFS_VARIABLES[variable]
        scenario = record["scenario"].replace("?C", "°C")
        source_value = float(record["value"])
        rows.append(
            item(
                dataset_id="DS-NGFS-PHASE5.1",
                source_id="SRC-NGFS-PHASE5.1",
                record_type="scenario",
                model=record["model"],
                scenario=scenario,
                scenario_family="NGFS Phase 5.1",
                geography="World",
                geography_code="World",
                region_level="world",
                year=int(record["year"]),
                metric="final_electricity_consumption",
                sector=sector,
                end_use=end_use,
                accounting_scope=f"final_energy_electricity; hierarchy={hierarchy}; do_not_stack_across_hierarchy_levels",
                value=source_value * EJ_TO_TWH,
                unit="TWh",
                value_semantics="point",
                source_value=source_value,
                source_unit="EJ_per_year",
                source_variable=variable,
                upstream_status=f"conditional_scenario_not_forecast; run_id={record['runId']}",
                source_vintage="2026-03-20",
                source_file=filename,
            )
        )
    return write_csv("global-electricity-consumption-ngfs-phase5.1.csv", rows)


def normalize_ngfs_supply_demand(demand_rows):
    """Place NGFS secondary generation and final consumption on one scoped bridge."""
    generation_file = ENERGY / "timeseries" / "normalized" / "global-electricity-projections-ngfs-phase5.1.csv"
    generation = pd.read_csv(generation_file)
    generation = generation[(generation["metric"] == "electricity_generation") & (generation["technology"] == "total")]
    demand = {
        (record["model"], record["scenario"], int(record["year"])): record
        for record in demand_rows
        if record["sector"] == "total" and record["end_use"] == "all_electricity"
    }
    rows = []
    for record in generation.to_dict(orient="records"):
        key = (record["model"], record["scenario"], int(record["year"]))
        if key not in demand:
            raise AssertionError(f"NGFS total demand missing for {key}")
        final = demand[key]
        generation_value = float(record["value"])
        demand_value = float(final["value"])
        common = dict(
            dataset_id="DS-NGFS-PHASE5.1",
            source_id="SRC-NGFS-PHASE5.1",
            record_type="scenario",
            model=record["model"],
            scenario=record["scenario"],
            scenario_family="NGFS Phase 5.1",
            geography="World",
            geography_code="World",
            region_level="world",
            year=int(record["year"]),
            sector="total",
            source_vintage="2026-03-20",
        )
        rows.append(
            item(
                **common,
                metric="electricity_generation",
                end_use="all_sources",
                accounting_scope="secondary_energy_electricity_generation",
                value=generation_value,
                unit="TWh",
                value_semantics="point",
                source_value=record["source_value"],
                source_unit=record["source_unit"],
                source_variable=record["source_variable"],
                upstream_status="conditional_scenario_not_forecast",
                source_file=record["source_file"],
            )
        )
        rows.append(
            item(
                **common,
                metric="final_electricity_consumption",
                end_use="all_end_uses",
                accounting_scope="final_energy_electricity_consumption",
                value=demand_value,
                unit="TWh",
                value_semantics="point",
                source_value=final["source_value"],
                source_unit=final["source_unit"],
                source_variable=final["source_variable"],
                upstream_status="conditional_scenario_not_forecast",
                source_file=final["source_file"],
            )
        )
        rows.append(
            item(
                **common,
                metric="generation_minus_final_consumption",
                end_use="accounting_gap",
                accounting_scope="secondary_generation_minus_final_consumption; includes_model_specific_grid_loss_own_use_and_accounting_effects; not_technical_transmission_loss",
                value=generation_value - demand_value,
                unit="TWh",
                value_semantics="derived_point",
                source_value=generation_value - demand_value,
                source_unit="TWh_derived",
                source_variable="Secondary Energy|Electricity - Final Energy|Electricity",
                upstream_status="derived_from_conditional_scenario",
                source_file=f"{record['source_file']} + {final['source_file']}",
            )
        )
    return write_csv("global-electricity-supply-demand-ngfs-phase5.1.csv", rows)


def normalize_milestones():
    records = [
        # source, dataset, geography, year, metric, sector, end use, value,
        # semantics, record type, scenario, model, status, scope
        ("SRC-IEA-ELECTRICITY26-DEMAND", "DS-IEA-ELECTRICITY26-DEMAND", "World", "World", "world", 2025, "electricity_consumption", "total", "all_end_uses", 28200, "approximate", "estimate", "Observed estimate", "IEA Electricity 2026", "estimated", "global_electricity_consumption"),
        ("SRC-IEA-ELECTRICITY26-DEMAND", "DS-IEA-ELECTRICITY26-DEMAND", "World", "World", "world", 2030, "electricity_consumption", "total", "all_end_uses", 33600, "approximate", "forecast", "IEA 2026-2030 forecast", "IEA Electricity 2026", "forecast", "global_electricity_consumption"),
        ("SRC-IEA-ENERGY-AI25", "DS-IEA-ENERGY-AI25", "World", "World", "world", 2024, "identifiable_load", "commercial", "data_centers_total_facility", 415, "approximate", "estimate", "Observed estimate", "IEA Energy and AI", "estimated", "servers_storage_network_and_infrastructure"),
        ("SRC-IEA-ENERGY-AI25", "DS-IEA-ENERGY-AI25", "World", "World", "world", 2030, "identifiable_load", "commercial", "data_centers_total_facility", 945, "approximate", "forecast", "Base Case", "IEA Energy and AI", "forecast", "servers_storage_network_and_infrastructure"),
        ("SRC-IEA-ENERGY-AI25", "DS-IEA-ENERGY-AI25", "World", "World", "world", 2035, "identifiable_load", "commercial", "data_centers_total_facility", 1200, "approximate", "scenario", "Base Case", "IEA Energy and AI", "scenario", "servers_storage_network_and_infrastructure"),
        ("SRC-IEA-ENERGY-AI25", "DS-IEA-ENERGY-AI25", "World", "World", "world", 2035, "identifiable_load", "commercial", "data_centers_total_facility", 970, "approximate", "scenario", "High Efficiency Case", "IEA Energy and AI", "scenario", "servers_storage_network_and_infrastructure"),
        ("SRC-IEA-ENERGY-AI25", "DS-IEA-ENERGY-AI25", "World", "World", "world", 2035, "identifiable_load", "commercial", "data_centers_total_facility", 1700, "lower_bound", "scenario", "Lift-Off Case", "IEA Energy and AI", "exceeds_reported_value", "servers_storage_network_and_infrastructure"),
        ("SRC-LBNL-DATACENTER24", "DS-LBNL-DATACENTER24", "United States", "USA", "country", 2014, "identifiable_load", "commercial", "data_centers_total_facility", 60, "approximate", "estimate", "Historical estimate", "LBNL Data Center Energy Usage Report", "estimated", "servers_storage_network_and_infrastructure"),
        ("SRC-LBNL-DATACENTER24", "DS-LBNL-DATACENTER24", "United States", "USA", "country", 2018, "identifiable_load", "commercial", "data_centers_total_facility", 76, "approximate", "estimate", "Historical estimate", "LBNL Data Center Energy Usage Report", "estimated", "servers_storage_network_and_infrastructure"),
        ("SRC-LBNL-DATACENTER24", "DS-LBNL-DATACENTER24", "United States", "USA", "country", 2023, "identifiable_load", "commercial", "data_centers_total_facility", 176, "point", "estimate", "Historical estimate", "LBNL Data Center Energy Usage Report", "estimated", "servers_storage_network_and_infrastructure"),
        ("SRC-LBNL-DATACENTER24", "DS-LBNL-DATACENTER24", "United States", "USA", "country", 2028, "identifiable_load", "commercial", "data_centers_total_facility", 325, "range_low", "forecast", "Projection range", "LBNL Data Center Energy Usage Report", "projection_range", "servers_storage_network_and_infrastructure"),
        ("SRC-LBNL-DATACENTER24", "DS-LBNL-DATACENTER24", "United States", "USA", "country", 2028, "identifiable_load", "commercial", "data_centers_total_facility", 580, "range_high", "forecast", "Projection range", "LBNL Data Center Energy Usage Report", "projection_range", "servers_storage_network_and_infrastructure"),
        ("SRC-IEA-GEVO26", "DS-IEA-GEVO26", "World", "World", "world", 2025, "identifiable_load", "transportation", "road_electric_vehicles", 250, "approximate", "estimate", "Observed estimate", "IEA Global EV Outlook", "estimated", "already_part_of_total_electricity_consumption"),
        ("SRC-IEA-GEVO26", "DS-IEA-GEVO26", "World", "World", "world", 2035, "identifiable_load", "transportation", "road_electric_vehicles", 1500, "lower_bound", "scenario", "Current Policies Scenario", "IEA Global EV Outlook", "exceeds_reported_value", "already_part_of_total_electricity_consumption"),
        ("SRC-IEA-GEVO26", "DS-IEA-GEVO26", "World", "World", "world", 2035, "identifiable_load", "transportation", "road_electric_vehicles", 1700, "point", "scenario", "Stated Policies Scenario", "IEA Global EV Outlook", "scenario", "already_part_of_total_electricity_consumption"),
        ("SRC-IEA-GEVO26", "DS-IEA-GEVO26", "World", "World", "world", 2035, "identifiable_load", "transportation", "road_electric_vehicles", 3000, "lower_bound", "scenario", "Net Zero Emissions by 2050 Scenario", "IEA Global EV Outlook", "exceeds_reported_value", "already_part_of_total_electricity_consumption"),
    ]
    rows = []
    for source_id, dataset_id, geography, geo_code, level, year, metric, sector, end_use, value, semantics, record_type, scenario, model, status, scope in records:
        rows.append(
            item(
                dataset_id=dataset_id,
                source_id=source_id,
                record_type=record_type,
                model=model,
                scenario=scenario,
                scenario_family="publisher_assessment",
                geography=geography,
                geography_code=geo_code,
                region_level=level,
                year=year,
                metric=metric,
                sector=sector,
                end_use=end_use,
                accounting_scope=scope,
                value=value,
                unit="TWh",
                value_semantics=semantics,
                source_value=value,
                source_unit="TWh",
                source_variable="published_milestone",
                upstream_status=status,
                source_vintage={
                    "SRC-IEA-ELECTRICITY26-DEMAND": "2026-02",
                    "SRC-IEA-ENERGY-AI25": "2025-04",
                    "SRC-LBNL-DATACENTER24": "2024-12-20",
                    "SRC-IEA-GEVO26": "2026-04-13",
                }[source_id],
                source_file="source_verification.json",
            )
        )
    return write_csv("global-and-us-demand-milestones.csv", rows)


def normalize_nrel_efs():
    baseline = {
        "transportation": 7.5,
        "residential": 1418,
        "commercial": 1379,
        "industrial": 1084,
        "total": 3889,
    }
    scenarios = {
        ("Reference", "Rapid"): [78, 1462, 1751, 1405, 4696],
        ("Reference", "Moderate"): [88, 1474, 1755, 1405, 4722],
        ("Reference", "Slow"): [101, 1503, 1762, 1406, 4772],
        ("Medium", "Rapid"): [809, 1481, 1824, 1405, 5520],
        ("Medium", "Moderate"): [898, 1518, 1835, 1406, 5656],
        ("Medium", "Slow"): [1019, 1589, 1855, 1408, 5871],
        ("High", "Rapid"): [1365, 1491, 1909, 1515, 6280],
        ("High", "Moderate"): [1512, 1551, 1925, 1517, 6505],
        ("High", "Slow"): [1712, 1657, 1956, 1520, 6846],
    }
    sectors = ["transportation", "residential", "commercial", "industrial", "total"]
    rows = []
    for sector, value in baseline.items():
        rows.append(
            item(
                dataset_id="DS-NREL-EFS18",
                source_id="SRC-NREL-EFS18",
                record_type="historical_reference",
                model="NREL Electrification Futures Study",
                scenario="2016 reference year",
                scenario_family="NREL EFS 2018",
                geography="United States",
                geography_code="USA",
                region_level="country",
                year=2016,
                metric="electricity_consumption",
                sector=sector,
                end_use="all_end_uses",
                accounting_scope="EFS_national_sector_accounting",
                value=value,
                unit="TWh",
                value_semantics="point",
                source_value=value,
                source_unit="TWh",
                source_variable="Table 7.1",
                upstream_status="study_reference_value",
                source_vintage="2018-06",
                source_file="NREL/TP-6A20-71500.pdf",
            )
        )
    for (electrification, technology), values in scenarios.items():
        scenario = f"{electrification} electrification | {technology} technology advancement"
        for sector, value in zip(sectors, values):
            rows.append(
                item(
                    dataset_id="DS-NREL-EFS18",
                    source_id="SRC-NREL-EFS18",
                    record_type="scenario",
                    model="NREL Electrification Futures Study",
                    scenario=scenario,
                    scenario_family="NREL EFS 2018",
                    geography="United States",
                    geography_code="USA",
                    region_level="country",
                    year=2050,
                    metric="electricity_consumption",
                    sector=sector,
                    end_use="all_end_uses",
                    accounting_scope="EFS_national_sector_accounting",
                    value=value,
                    unit="TWh",
                    value_semantics="point",
                    source_value=value,
                    source_unit="TWh",
                    source_variable="Table 7.1",
                    upstream_status="conditional_scenario_not_forecast; 2018_publication_vintage",
                    source_vintage="2018-06",
                    source_file="NREL/TP-6A20-71500.pdf",
                )
            )
    return write_csv("us-electrification-scenarios-nrel-efs.csv", rows)


def main():
    outputs = []
    outputs.append(normalize_mer())
    outputs.append(normalize_owid_world_demand())
    for output in normalize_aeo():
        outputs.append(output)
    ngfs_output = normalize_ngfs()
    outputs.append(ngfs_output)
    outputs.append(normalize_ngfs_supply_demand(ngfs_output[1]))
    outputs.append(normalize_milestones())
    outputs.append(normalize_nrel_efs())

    coverage = []
    for path, rows in outputs:
        coverage.append(
            {
                "file": f"normalized/{path.name}",
                "rows": len(rows),
                "year_min": min(int(record["year"]) for record in rows),
                "year_max": max(int(record["year"]) for record in rows),
                "sha256": sha256(path),
                "datasets": sorted({record["dataset_id"] for record in rows}),
                "geographies": sorted({record["geography"] for record in rows}),
                "models": sorted({record["model"] for record in rows if record["model"]}),
                "scenarios": len({(record["model"], record["scenario"]) for record in rows if record["scenario"]}),
            }
        )
    (BASE / "coverage.json").write_text(
        json.dumps(
            {
                "coverage_id": "electricity-consumption-timeseries-v1",
                "generated_at": "2026-08-01",
                "files": coverage,
                "total_rows": sum(record["rows"] for record in coverage),
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"outputs": coverage, "total_rows": sum(x["rows"] for x in coverage)}, indent=2))


if __name__ == "__main__":
    main()
