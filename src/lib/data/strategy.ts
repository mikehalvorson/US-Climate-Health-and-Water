import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CANONICAL_REGISTRIES } from '../registry/store';
import type { ChartRecord, OpenItemRecord, SourceRecord } from '../registry/types';
import type { ChartType } from '../registry/values';
import type { ScenarioControlDefinition } from '../scenarios/state';
import { CLIMATE_SOURCES, CROP_IPCC_BARS, CROP_ISOLATED_BARS, CROP_TABLE, WARMING_SCENARIO_RANGES, WARMING_SCENARIO_TABLE } from './climate';
import { ENERGY_SCENARIO_SEAM, ENERGY_SOURCES, type EnergyLineSeries } from './energy';
import { WATER_SOURCES } from './foodWater';

export interface FrameworkItem {
  label: string;
  value: string | number | null;
  state: string;
  detail: string;
  gate: string;
}

export interface StrategyWorkbenchLayer {
  controlId: string;
  value: string;
  title: string;
  finding: string;
  evidence: string;
  gate: string;
}

export interface StrategyWorkbenchConfig {
  id: string;
  title: string;
  decision: string;
  modelFamily: string;
  seamNote: string;
  readiness: string;
  controls: readonly ScenarioControlDefinition[];
  layers: readonly StrategyWorkbenchLayer[];
}

export function approvedStrategyChart(identity: string, expectedType: ChartType): ChartRecord {
  const chart = CANONICAL_REGISTRIES.chart?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!chart) throw new Error(`Canonical strategy chart ${identity} is missing.`);
  if (chart.chartType !== expectedType) throw new Error(`${identity} is registered as ${chart.chartType}, not ${expectedType}.`);
  return chart;
}

export function strategySource(identity: string): SourceRecord {
  const source = CANONICAL_REGISTRIES.source?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!source) throw new Error(`Canonical strategy source ${identity} is missing.`);
  return source;
}

export function strategyGap(identity: string): OpenItemRecord {
  const item = CANONICAL_REGISTRIES.open_item?.find((candidate) => candidate.id === identity || candidate.legacyGapId === identity || candidate.legacyIds?.includes(identity));
  if (!item) throw new Error(`Canonical strategy gap ${identity} is missing.`);
  return item;
}

export const STRATEGY_SOURCES = {
  energy: [ENERGY_SOURCES.aeo, ENERGY_SOURCES.reeds],
  climate: [CLIMATE_SOURCES.synthesis, CLIMATE_SOURCES.impacts],
  food: [CLIMATE_SOURCES.food, CLIMATE_SOURCES.cropSensitivity, WATER_SOURCES.inventory, strategySource('USGS-HPA-SIR2023'), strategySource('TWDB-REGION-O-2026')],
  foodWater: [WATER_SOURCES.inventory, WATER_SOURCES.consumption, WATER_SOURCES.nationalRisk, CLIMATE_SOURCES.freshwater],
} as const;

export const FOOD_CROP_IPCC_BARS = CROP_IPCC_BARS;
export const FOOD_CROP_ISOLATED_BARS = CROP_ISOLATED_BARS;
export const FOOD_CROP_TABLE = CROP_TABLE;

interface AgricultureFile {
  national_significance: {
    inventory_2015_withdrawal_billion_gallons_per_day: number;
    inventory_2015_consumptive_use_billion_gallons_per_day: number;
    interpretation: string;
  };
  high_plains_aquifer: {
    recoverable_storage_2019_billion_acre_feet: number;
    storage_decline_since_predevelopment_million_acre_feet: number;
    modeled_current_irrigated_area_unable_to_support_irrigation_by_2100_percent: number;
    modeled_area_square_kilometers: number;
    subset_also_unsuitable_for_dryland_percent_of_affected: number;
    interpretation: string;
  };
  llano_estacado_case: {
    geography: string;
    values: readonly { year: number; value: number }[];
    change_2030_to_2080_percent: number;
    interpretation: string;
  };
  management_context: readonly string[];
}

const agriculture = JSON.parse(readFileSync(resolve(process.cwd(), 'research', 'water', 'sectors', 'agriculture.json'), 'utf8')) as AgricultureFile;
export const FOOD_GROUNDWATER_SERIES: readonly EnergyLineSeries[] = [{
  id: 'hale-county-existing-supply',
  label: 'Hale County existing groundwater supply planning estimate',
  values: agriculture.llano_estacado_case.values.map((item) => ({ x: item.year, y: item.value })),
}];
export const FOOD_GROUNDWATER_TABLE = agriculture.llano_estacado_case.values.map((item) => ({
  geography: agriculture.llano_estacado_case.geography,
  year: item.year,
  existingSupply: item.value,
  unit: 'acre-feet/year',
  interpretation: agriculture.llano_estacado_case.interpretation,
}));
export const AGRICULTURE_CONTEXT = agriculture;

export const ENERGY_PLAN_SCENARIO_SERIES = ENERGY_SCENARIO_SEAM;
export const ENERGY_PLAN_SCENARIO_TABLE = ENERGY_SCENARIO_SEAM.flatMap((series) => {
  const present = series.values.filter((point) => point.y !== null);
  const first = present[0];
  const last = present.at(-1);
  return [{ family: series.label, firstYear: first?.x ?? null, firstValue: first?.y ?? null, lastYear: last?.x ?? null, lastValue: last?.y ?? null, unit: 'TWh/year', rule: 'Source-native series; never splice across families or geographies' }];
});
export const CLIMATE_PLAN_WARMING_RANGES = WARMING_SCENARIO_RANGES['2081-2100'] ?? [];
export const CLIMATE_PLAN_WARMING_TABLE = WARMING_SCENARIO_TABLE.filter((item) => item.period === '2081-2100');

export const ENERGY_PLAN_WORKBENCH: StrategyWorkbenchConfig = {
  id: 'energy-plan-workbench',
  title: 'Switch source scenarios and stress the recommended architecture',
  decision: 'Inspect source-native scenario context and one planning stress at a time. The result is a design response and release gate, not an integrated-system solution.',
  modelFamily: 'Published AEO and NREL lookups plus qualitative architecture stress tests',
  seamNote: 'AEO and NREL retain their own boundaries. Stress responses are planning logic, not model outputs or reliability probabilities.',
  readiness: 'Scenario lookup ready · integrated optimization gated',
  controls: [
    { id: 'scenario', label: 'Published source family', defaultValue: 'aeo', options: [{ value: 'aeo', label: 'EIA AEO2026 · U.S.' }, { value: 'nrel', label: 'NREL Standard Scenarios · contiguous U.S.' }, { value: 'ngfs', label: 'NGFS Phase 5.1 · global context' }] },
    { id: 'stress', label: 'Planning stress', defaultValue: 'high_demand', options: [{ value: 'high_demand', label: 'High demand' }, { value: 'transmission_delay', label: 'Delayed transmission' }, { value: 'firm_constraint', label: 'Constrained firm capacity' }, { value: 'drought_weather', label: 'Drought and extreme weather' }] },
  ],
  layers: [
    { controlId: 'scenario', value: 'aeo', title: 'EIA AEO2026', finding: 'Use U.S. annual energy and sector pathways through 2050 within the EIA model boundary.', evidence: 'Source scenario', gate: 'Do not interpret as a project plan, probability, or post-2050 U.S. trajectory.' },
    { controlId: 'scenario', value: 'nrel', title: 'NREL Standard Scenarios', finding: 'Use contiguous-U.S. power-sector cases to compare technology and system conditions through 2050.', evidence: 'Source scenario', gate: 'Keep ReEDS geography, constraints, and scenario labels intact.' },
    { controlId: 'scenario', value: 'ngfs', title: 'NGFS Phase 5.1', finding: 'Use global pathway context without downscaling or relabeling it as United States output.', evidence: 'Source scenario', gate: 'Never splice global NGFS values into a national build mix.' },
    { controlId: 'stress', value: 'high_demand', title: 'High demand', finding: 'Prioritize efficient flexible demand, firm capacity options, interconnection, and a wider delivery range.', evidence: 'Qualitative stress response', gate: 'Requires hourly load, resource adequacy, and network validation.' },
    { controlId: 'stress', value: 'transmission_delay', title: 'Delayed transmission', finding: 'Retain regional supply diversity, local flexibility, storage, and sequenced generation commitments.', evidence: 'Qualitative stress response', gate: 'Requires corridor, queue, construction, and deliverability evidence.' },
    { controlId: 'stress', value: 'firm_constraint', title: 'Constrained firm capacity', finding: 'Protect reliability services, accelerate demand response, and test multiple firm low-carbon configurations.', evidence: 'Qualitative stress response', gate: 'Requires accredited-capacity and operating-reserve analysis.' },
    { controlId: 'stress', value: 'drought_weather', title: 'Drought and extreme weather', finding: 'Diversify water, fuel, grid, and facility dependencies; harden critical assets and recovery paths.', evidence: 'Qualitative stress response', gate: 'Requires geographically aligned weather, water, outage, and restoration scenarios.' },
  ],
};

export const CLIMATE_PLAN_WORKBENCH: StrategyWorkbenchConfig = {
  id: 'climate-plan-workbench',
  title: 'Mitigate low, adapt high',
  decision: 'Choose an assessed warming pathway and a planning risk. Adaptation remains stress-tested against more severe locally credible conditions.',
  modelFamily: 'IPCC assessed scenario ranges plus qualitative robust-decision logic',
  seamNote: 'Global assessed warming does not produce local damages. Local hazard, exposure, vulnerability, and adaptation evidence are separate required layers.',
  readiness: 'Assessed ranges ready · integrated damages gated',
  controls: [
    { id: 'warming', label: 'Assessed pathway', defaultValue: 'SSP1-1.9', options: CLIMATE_PLAN_WARMING_RANGES.map((item) => ({ value: item.id, label: item.label })) },
    { id: 'risk', label: 'Essential-system risk', defaultValue: 'heat', options: [{ value: 'heat', label: 'Extreme heat' }, { value: 'water', label: 'Freshwater reliability' }, { value: 'coasts', label: 'Coastal flooding' }, { value: 'food', label: 'Food systems' }] },
  ],
  layers: [
    ...CLIMATE_PLAN_WARMING_RANGES.map((item) => ({ controlId: 'warming', value: item.id, title: item.label, finding: `${item.value}°C best estimate; ${item.low}–${item.high}°C very likely range for 2081–2100 above 1850–1900.`, evidence: 'IPCC assessed source scenario', gate: 'Twenty-year mean; not a forecast probability or annual trajectory.' })),
    { controlId: 'risk', value: 'heat', title: 'Extreme heat', finding: 'Protect people, workers, buildings, power, health care, and cooling access under severe heat.', evidence: 'Risk-specific adaptation framework', gate: 'Requires local heat, exposure, health, power, and vulnerability layers.' },
    { controlId: 'risk', value: 'water', title: 'Freshwater reliability', finding: 'Pair demand, repair, operations, ecosystems, storage, and suitable supply within basin constraints.', evidence: 'Risk-specific adaptation framework', gate: 'Requires harmonized basin water quantity, quality, demand, and environmental-flow scenarios.' },
    { controlId: 'risk', value: 'coasts', title: 'Coastal flooding', finding: 'Combine protection, accommodation, restoration, and voluntary transition through adaptive pathways.', evidence: 'Risk-specific adaptation framework', gate: 'Requires local relative sea level, flood thresholds, exposure, and infrastructure dependencies.' },
    { controlId: 'risk', value: 'food', title: 'Food systems', finding: 'Protect climate-resilient production, water, supply chains, access, nutrition, workers, and ecosystems.', evidence: 'Risk-specific adaptation framework', gate: 'Requires common crop, trade, price, nutrition, and adaptation scenarios.' },
  ],
};

export const FOOD_WORKBENCH: StrategyWorkbenchConfig = {
  id: 'food-plan-workbench',
  title: 'Filter the authorized crop and groundwater evidence',
  decision: 'Change crop and geography while the dashboard keeps study frames and missing national food-security outcomes explicit.',
  modelFamily: 'Verified crop sensitivity and agriculture-water lookup',
  seamNote: 'Percent per decade and percent per degree are not combined. Hale County and High Plains evidence is not nationalized.',
  readiness: 'Evidence lookup ready · national food-system model gated',
  controls: [
    { id: 'crop', label: 'Crop evidence', defaultValue: 'maize', options: CROP_IPCC_BARS.map((item) => ({ value: item.id, label: item.label })) },
    { id: 'geography', label: 'Water geography', defaultValue: 'high_plains', options: [{ value: 'high_plains', label: 'High Plains aquifer' }, { value: 'hale_county', label: 'Hale County, Texas' }, { value: 'national', label: 'United States irrigation context' }] },
  ],
  layers: [
    ...CROP_IPCC_BARS.map((item) => ({ controlId: 'crop', value: item.id, title: item.label, finding: `${item.value}% per decade median yield sensitivity in the IPCC no-adaptation frame with CO₂ fertilization.`, evidence: 'Assessed crop sensitivity', gate: 'Not a local yield forecast, production total, price result, or food-security outcome.' })),
    { controlId: 'geography', value: 'high_plains', title: 'High Plains aquifer', finding: `${agriculture.high_plains_aquifer.modeled_current_irrigated_area_unable_to_support_irrigation_by_2100_percent}% of current irrigated area is modeled as unable to support irrigation by 2100; impacts are spatially uneven.`, evidence: 'Regional modeled result', gate: 'Not an aquifer-empty date or national crop result.' },
    { controlId: 'geography', value: 'hale_county', title: 'Hale County, Texas', finding: `${agriculture.llano_estacado_case.change_2030_to_2080_percent}% change in the local existing-supply planning estimate from 2030 to 2080.`, evidence: 'Local planning estimate', gate: 'Not a prediction that all wells fail.' },
    { controlId: 'geography', value: 'national', title: 'United States irrigation', finding: `${agriculture.national_significance.inventory_2015_withdrawal_billion_gallons_per_day} Bgal/day withdrawal and ${agriculture.national_significance.inventory_2015_consumptive_use_billion_gallons_per_day} Bgal/day consumptive use in the 2015 inventory.`, evidence: 'Observed national inventory', gate: '2015 values are not current and do not resolve basin reliability.' },
  ],
};

export const FOOD_WATER_PLAN_WORKBENCH: StrategyWorkbenchConfig = {
  id: 'food-water-plan-workbench',
  title: 'Compare portfolio families under one system stress',
  decision: 'Choose a portfolio family and stress condition. Results describe response coverage and missing evidence, not national water saved or reliability achieved.',
  modelFamily: 'Qualitative essential-service portfolio comparison',
  seamNote: 'Basin, utility, facility, crop, and household evidence retains its geography and accounting boundary.',
  readiness: 'Portfolio logic ready · basin-food-industry model gated',
  controls: [
    { id: 'portfolio', label: 'Portfolio family', defaultValue: 'integrated', options: [{ value: 'fragmented', label: 'Fragmented programs' }, { value: 'supply_only', label: 'Supply only' }, { value: 'demand_only', label: 'Demand only' }, { value: 'integrated', label: 'Integrated portfolio' }] },
    { id: 'stress', label: 'Planning condition', defaultValue: 'drought', options: [{ value: 'normal', label: 'Normal operations' }, { value: 'drought', label: 'Drought' }, { value: 'growth', label: 'Rapid growth' }, { value: 'failure', label: 'Infrastructure failure' }] },
  ],
  layers: [
    { controlId: 'portfolio', value: 'fragmented', title: 'Fragmented programs', finding: 'Projects proceed within separate agencies and budgets, leaving cross-system dependencies and cumulative burdens unresolved.', evidence: 'Qualitative comparator', gate: 'Cannot claim essential-service reliability across systems.' },
    { controlId: 'portfolio', value: 'supply_only', title: 'Supply-only expansion', finding: 'Adds selected capacity but can increase energy, cost, permitting, brine, conveyance, and ecological burdens.', evidence: 'Qualitative comparator', gate: 'Requires source-specific yield, cost, energy, quality, and environmental validation.' },
    { controlId: 'portfolio', value: 'demand_only', title: 'Demand-only strategy', finding: 'Reduces avoidable use and losses but may not cover growth, severe drought, quality failures, or minimum service.', evidence: 'Qualitative comparator', gate: 'Requires sector, season, rebound, equity, and return-flow evidence.' },
    { controlId: 'portfolio', value: 'integrated', title: 'Integrated portfolio', finding: 'Sequences demand, repair, reuse, operations, ecosystems, storage, and suitable new supply around essential outcomes.', evidence: 'Recommended architecture', gate: 'Requires basin-specific quantities, quality, governance, finance, and adaptive triggers.' },
    { controlId: 'stress', value: 'normal', title: 'Normal operations', finding: 'Track service, ecological floors, losses, quality, affordability, and operating headroom.', evidence: 'Planning condition', gate: 'Requires current utility and basin operations data.' },
    { controlId: 'stress', value: 'drought', title: 'Drought', finding: 'Activate staged conservation, protected essential use, environmental floors, transfers, backup sources, and recovery rules.', evidence: 'Planning condition', gate: 'Requires live drought state, seasonal budgets, rights, and enforceable allocation triggers.' },
    { controlId: 'stress', value: 'growth', title: 'Rapid growth', finding: 'Re-test source yield, treatment, conveyance, energy, housing affordability, ecosystems, and cumulative projects before commitments.', evidence: 'Planning condition', gate: 'Requires localized demand and infrastructure scenarios.' },
    { controlId: 'stress', value: 'failure', title: 'Infrastructure failure', finding: 'Use redundancy, repair priority, mutual aid, backup power, emergency water, communications, and equitable restoration.', evidence: 'Planning condition', gate: 'Requires asset condition, dependency, outage, recovery, and critical-customer data.' },
  ],
};
