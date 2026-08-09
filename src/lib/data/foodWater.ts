import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CANONICAL_REGISTRIES } from '../registry/store';
import type { ChartRecord, SourceRecord } from '../registry/types';
import type { ChartType } from '../registry/values';
import { parseCsv, type CsvRow } from './csv';
import type { EnergyBar, EnergyDotRange, EnergyLineSeries } from './energy';

const WATER_ROOT = resolve(process.cwd(), 'research', 'water');
const PLASTICS_ROOT = resolve(process.cwd(), 'research', 'plastics');

function readJson<T>(root: string, path: string): T {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8')) as T;
}

function readCsv(root: string, path: string): readonly CsvRow[] {
  return parseCsv(readFileSync(resolve(root, path), 'utf8'));
}

function numberField(row: CsvRow, field: string): number {
  const raw = row[field];
  if (raw === undefined || raw === '') throw new Error(`Food and water adapter requires ${field}.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Food and water adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

function nullableNumberField(row: CsvRow, field: string): number | null {
  const raw = row[field];
  if (raw === undefined || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Food and water adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

export function humanizeEvidence(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/gu, (character) => character.toUpperCase());
}

export function foodWaterSource(identity: string): SourceRecord {
  const source = CANONICAL_REGISTRIES.source?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!source) throw new Error(`Canonical food and water source ${identity} is missing.`);
  return source;
}

export function approvedFoodWaterChart(identity: string, chartType: ChartType): ChartRecord {
  const chart = CANONICAL_REGISTRIES.chart?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!chart) throw new Error(`Canonical food and water chart ${identity} is missing.`);
  if (chart.chartType !== 'none' && chart.chartType !== chartType) {
    throw new Error(`${identity} is registered as ${chart.chartType}, not ${chartType}.`);
  }
  return chart.chartType === chartType ? chart : { ...chart, chartType };
}

export const WATER_SOURCES = {
  inventory: foodWaterSource('USGS-CIR1441'),
  consumption: foodWaterSource('USGS-PP1894D'),
  household: foodWaterSource('WHO-DOMESTIC-WATER'),
  nationalRisk: foodWaterSource('USGS-NWAA-2026'),
  colorado: foodWaterSource('USBR-POST2026'),
  coastal: foodWaterSource('USGS-COASTAL-INTRUSION'),
  desalination: foodWaterSource('LBNL-DESAL-2018'),
  carlsbad: foodWaterSource('SDCWA-CARLSBAD'),
  awg: foodWaterSource('EPA-AWG-2019'),
  awgProxy: foodWaterSource('ENERGY-STAR-DEHUMIDIFIER'),
} as const;

export const PLASTIC_SOURCES = {
  materialFlow: foodWaterSource('US-PLASTICS-MFA-2019'),
  resinWater: foodWaterSource('RCR-RESIN-WATER-2023'),
  resinWaterSi: foodWaterSource('RCR-RESIN-WATER-SI-2023'),
  foodParticles: foodWaterSource('FDA-MNP-FOOD'),
  particleReview: foodWaterSource('WHO-MNP-2022'),
  cardiovascular: foodWaterSource('NEJM-MNP-2024'),
  vaccine: foodWaterSource('JAMA-PFAS-VACCINE'),
  euPolicy: foodWaterSource('EU-SUPD'),
  francePolicy: foodWaterSource('FR-AGEC'),
  germanyPolicy: foodWaterSource('DE-UBA-PACKAGING'),
  rwandaPolicy: foodWaterSource('RW-REMA-LAW2019'),
  globalRoadmap: foodWaterSource('UNEP-TAP-2023'),
  seaweedResource: foodWaterSource('DOE-BT23-MACRO'),
  seaweedLca: foodWaterSource('ACS-SEAWEED-LCA-2026'),
} as const;

interface NationalWaterFile {
  inventory_2015: {
    total_withdrawals_fresh_and_saline: number;
    freshwater_withdrawals: number;
    fresh_surface_water_withdrawals: number;
    fresh_groundwater_withdrawals: number;
    saline_water_withdrawals: number;
    categories: readonly Readonly<Record<string, string | number | null | Readonly<Record<string, number>>>>[];
  };
  modeled_2010_2020: {
    covered_sectors: readonly { sector: string; withdrawal: number; consumptive_use: number; consumptive_fraction_percent: number }[];
  };
}

const nationalWater = readJson<NationalWaterFile>(WATER_ROOT, 'national-water-use.json');
const waterHistory = readCsv(WATER_ROOT, 'timeseries/usgs-historical-water-use-1950-2015.csv');
const withdrawalFields = [
  ['public_supply_bgd', 'Public supply'],
  ['self_supplied_domestic_bgd', 'Self-supplied domestic'],
  ['livestock_bgd', 'Livestock'],
  ['irrigation_bgd', 'Irrigation'],
  ['thermoelectric_bgd', 'Thermoelectric'],
  ['industrial_bgd', 'Industrial'],
] as const;

export const WATER_WITHDRAWAL_SERIES: readonly EnergyLineSeries[] = [
  {
    id: 'total',
    label: 'Total withdrawals',
    values: waterHistory.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'total_withdrawals_bgd') })),
  },
  ...withdrawalFields.map(([field, label]) => ({
    id: field,
    label,
    values: waterHistory.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, field) })),
  })),
];

export const WATER_WITHDRAWAL_TABLE = waterHistory.flatMap((row) => withdrawalFields.map(([field, label]) => ({
  year: numberField(row, 'year'),
  category: label,
  withdrawal: numberField(row, field),
  unit: 'billion gallons per day',
  accountingNote: row.accounting_note ?? '',
})));

const coveredSectors = nationalWater.modeled_2010_2020.covered_sectors;
export const WATER_CONSUMPTION_NETWORK = {
  nodes: [
    { id: 'source', label: 'Sector withdrawals', x: 0.02, y: 0.5 },
    ...coveredSectors.map((sector, index) => ({ id: sector.sector, label: humanizeEvidence(sector.sector), x: 0.42, y: 0.15 + index * 0.35 })),
    { id: 'consumed', label: 'Consumptive use', x: 0.95, y: 0.5 },
  ],
  edges: [
    ...coveredSectors.map((sector) => ({ id: `withdrawal-${sector.sector}`, label: `${humanizeEvidence(sector.sector)} withdrawal`, source: 'source', target: sector.sector, weight: sector.withdrawal })),
    ...coveredSectors.map((sector) => ({ id: `consumption-${sector.sector}`, label: `${humanizeEvidence(sector.sector)} consumptive use`, source: sector.sector, target: 'consumed', weight: sector.consumptive_use })),
  ],
} as const;
export const WATER_CONSUMPTION_TABLE = coveredSectors.map((sector) => ({
  sector: humanizeEvidence(sector.sector),
  withdrawal: sector.withdrawal,
  consumptiveUse: sector.consumptive_use,
  fraction: sector.consumptive_fraction_percent,
  unit: 'million gallons per day',
  geography: 'Conterminous United States',
  period: '2010–20 average',
}));

interface HouseholdFile {
  dashboard_comparisons: readonly { metric: string; value_liters_per_person_per_day: number; meaning: string }[];
}
const household = readJson<HouseholdFile>(WATER_ROOT, 'sectors/households.json');
export const HOUSEHOLD_SERVICE_RANGES: readonly EnergyDotRange[] = household.dashboard_comparisons.map((item) => ({
  id: item.metric,
  label: humanizeEvidence(item.metric),
  low: item.value_liters_per_person_per_day,
  value: item.value_liters_per_person_per_day,
  high: item.value_liters_per_person_per_day,
}));
export const HOUSEHOLD_SERVICE_TABLE = household.dashboard_comparisons.map((item) => ({
  serviceLevel: humanizeEvidence(item.metric),
  litersPerPersonPerDay: item.value_liters_per_person_per_day,
  meaning: item.meaning,
}));

interface CityFile {
  cities_and_regions: readonly {
    place_id: string;
    place: string;
    supply_profile: string;
    primary_exposures: readonly string[];
    adaptation_context?: string | readonly string[];
    critical_qualification?: string;
  }[];
}
const cityFile = readJson<CityFile>(WATER_ROOT, 'risk/city-source-dependencies.json');
const cityCoordinates: Readonly<Record<string, readonly [number, number]>> = {
  'phoenix-az': [-112.07, 33.45], 'las-vegas-nv': [-115.14, 36.17], 'tucson-az': [-110.97, 32.22],
  'el-paso-tx': [-106.49, 31.76], 'albuquerque-nm': [-106.65, 35.08], 'los-angeles-ca': [-118.24, 34.05],
  'san-diego-ca': [-117.16, 32.72], 'dallas-tx': [-96.80, 32.78], 'houston-tx': [-95.37, 29.76],
  'san-antonio-tx': [-98.49, 29.42], 'miami-dade-fl': [-80.19, 25.76], 'long-island-ny': [-73.13, 40.79],
  'brunswick-ga': [-81.49, 31.15], 'washington-dc': [-77.04, 38.91], 'new-orleans-la': [-90.07, 29.95],
  'new-york-city-ny': [-74.01, 40.71], 'tampa-bay-fl': [-82.46, 27.95], 'corpus-christi-tx': [-97.40, 27.80],
};
export const WATER_CITY_POINTS = cityFile.cities_and_regions.flatMap((city) => {
  const coordinates = cityCoordinates[city.place_id];
  return coordinates ? [{ id: city.place_id, label: city.place, longitude: coordinates[0], latitude: coordinates[1] }] : [];
});
export const WATER_CITY_TABLE = cityFile.cities_and_regions.map((city) => ({
  place: city.place,
  supplyProfile: city.supply_profile,
  primaryExposures: city.primary_exposures.join('; '),
  adaptation: typeof city.adaptation_context === 'string' ? city.adaptation_context : city.adaptation_context?.join('; ') ?? 'Not stated',
  qualification: city.critical_qualification ?? 'Source dependency is an exposure pathway, not a forecast of failure.',
}));

interface RiskFile {
  risks: readonly {
    risk_id: string;
    geography: string;
    risk_type: string;
    manifestation_horizon: string;
    finding: string;
    severity: string;
    confidence: string;
  }[];
}
const riskFile = readJson<RiskFile>(WATER_ROOT, 'risk/risk-register.json');
const riskHorizonRows = readCsv(WATER_ROOT, 'timeseries/risk-horizons.csv');
export const WATER_RISK_HORIZONS = riskHorizonRows.map((row) => ({
  riskId: row.risk_id ?? '',
  geography: row.geography ?? '',
  riskType: row.risk_type ?? '',
  startYear: nullableNumberField(row, 'start_year'),
  endYear: nullableNumberField(row, 'end_year'),
  horizon: humanizeEvidence(row.horizon_label ?? ''),
  metric: humanizeEvidence(row.metric ?? ''),
  value: nullableNumberField(row, 'value'),
  unit: humanizeEvidence(row.unit ?? ''),
  interpretation: row.evidence_interpretation ?? '',
}));

export const SALTWATER_CAUSAL_MODEL = {
  nodes: [
    { id: 'sea', label: 'Sea level & tides', x: 0.02, y: 0.08 },
    { id: 'pumping', label: 'Pumping', x: 0.02, y: 0.38 },
    { id: 'canals', label: 'Canals & drainage', x: 0.02, y: 0.68 },
    { id: 'drought', label: 'Drought & recharge', x: 0.02, y: 0.95 },
    { id: 'gradient', label: 'Hydraulic gradient', x: 0.43, y: 0.5 },
    { id: 'interface', label: 'Salt interface', x: 0.72, y: 0.5 },
    { id: 'well', label: 'Well screen', x: 0.96, y: 0.3 },
    { id: 'quality', label: 'Delivered quality', x: 0.96, y: 0.78 },
  ],
  edges: [
    { id: 'sea-gradient', label: 'Raises coastal boundary', source: 'sea', target: 'gradient', weight: null },
    { id: 'pump-gradient', label: 'Lowers freshwater head', source: 'pumping', target: 'gradient', weight: null },
    { id: 'canal-gradient', label: 'Changes inland water level', source: 'canals', target: 'gradient', weight: null },
    { id: 'drought-gradient', label: 'Reduces recharge', source: 'drought', target: 'gradient', weight: null },
    { id: 'gradient-interface', label: 'Moves saltwater interface', source: 'gradient', target: 'interface', weight: null },
    { id: 'interface-well', label: 'Intersects screened depth', source: 'interface', target: 'well', weight: null },
    { id: 'well-quality', label: 'Raises delivered salinity', source: 'well', target: 'quality', weight: null },
  ],
} as const;

interface DesalinationFile {
  scale_scenarios: readonly {
    target: string;
    target_million_gallons_per_day: number;
    fifty_mgd_plant_equivalents: number;
    electricity_terawatt_hours_per_year: readonly [number, number];
    interpretation: string;
  }[];
}
interface AwgFile {
  scale_scenarios: readonly {
    service: string;
    water_liters_per_day: number;
    proxy_electricity_kilowatt_hours_per_day?: readonly [number, number];
    proxy_electricity_gigawatt_hours_per_day?: readonly [number, number];
    interpretation: string;
  }[];
}
const desalination = readJson<DesalinationFile>(WATER_ROOT, 'technologies/desalination.json');
const awg = readJson<AwgFile>(WATER_ROOT, 'technologies/atmospheric-water-generation.json');
export const DESALINATION_SCALE_BARS: readonly EnergyBar[] = desalination.scale_scenarios.map((item) => ({ id: item.target, label: item.target.replace('2015 U.S. ', '').replace('Carlsbad-size 50 Mgal/d municipal increment', '50 Mgal/d increment'), value: item.fifty_mgd_plant_equivalents }));
export const DESALINATION_SCALE_TABLE = desalination.scale_scenarios.map((item) => ({
  target: item.target,
  capacity: item.target_million_gallons_per_day,
  plantEquivalents: item.fifty_mgd_plant_equivalents,
  electricityLow: item.electricity_terawatt_hours_per_year[0],
  electricityHigh: item.electricity_terawatt_hours_per_year[1],
  interpretation: item.interpretation,
}));
export const AWG_ENERGY_RANGES: readonly EnergyDotRange[] = awg.scale_scenarios.flatMap((item) => item.proxy_electricity_kilowatt_hours_per_day ? [{
  id: item.service,
  label: humanizeEvidence(item.service),
  low: item.proxy_electricity_kilowatt_hours_per_day[0],
  value: (item.proxy_electricity_kilowatt_hours_per_day[0] + item.proxy_electricity_kilowatt_hours_per_day[1]) / 2,
  high: item.proxy_electricity_kilowatt_hours_per_day[1],
}] : []);
export const AWG_SCALE_TABLE = awg.scale_scenarios.map((item) => ({
  service: humanizeEvidence(item.service),
  waterLitersPerDay: item.water_liters_per_day,
  electricityLow: item.proxy_electricity_kilowatt_hours_per_day?.[0] ?? item.proxy_electricity_gigawatt_hours_per_day?.[0] ?? null,
  electricityHigh: item.proxy_electricity_kilowatt_hours_per_day?.[1] ?? item.proxy_electricity_gigawatt_hours_per_day?.[1] ?? null,
  electricityUnit: item.proxy_electricity_kilowatt_hours_per_day ? 'kWh/day' : 'GWh/day',
  interpretation: item.interpretation,
}));

interface CrossDomainFile {
  intervention_fit: readonly {
    problem_type: string;
    preferred_interventions: readonly string[];
    conditional_interventions: readonly string[];
    poor_fit: readonly string[];
  }[];
}
const crossDomain = readJson<CrossDomainFile>(WATER_ROOT, 'cross-domain-findings.json');
export const WATER_INTERVENTION_ROWS = crossDomain.intervention_fit.map((item) => humanizeEvidence(item.problem_type));
export const WATER_INTERVENTION_COLUMNS = ['Preferred', 'Conditional', 'Poor fit'] as const;
export const WATER_INTERVENTION_MATRIX = crossDomain.intervention_fit.flatMap((item) => [
  { row: humanizeEvidence(item.problem_type), column: 'Preferred', value: 3 },
  { row: humanizeEvidence(item.problem_type), column: 'Conditional', value: 2 },
  { row: humanizeEvidence(item.problem_type), column: 'Poor fit', value: 1 },
]);
export const WATER_INTERVENTION_TABLE = crossDomain.intervention_fit.map((item) => ({
  problem: humanizeEvidence(item.problem_type),
  preferred: item.preferred_interventions.join('; '),
  conditional: item.conditional_interventions.join('; '),
  poorFit: item.poor_fit.join('; '),
}));

export const WATER_WORKBENCH = {
  sectors: coveredSectors.map((item) => ({ id: item.sector, label: humanizeEvidence(item.sector), withdrawal: item.withdrawal, consumption: item.consumptive_use, fraction: item.consumptive_fraction_percent })),
  sources: [
    { id: 'fresh_surface', label: 'Fresh surface water', value: nationalWater.inventory_2015.fresh_surface_water_withdrawals, unit: 'Bgal/day' },
    { id: 'fresh_ground', label: 'Fresh groundwater', value: nationalWater.inventory_2015.fresh_groundwater_withdrawals, unit: 'Bgal/day' },
    { id: 'saline', label: 'Saline water', value: nationalWater.inventory_2015.saline_water_withdrawals, unit: 'Bgal/day' },
  ],
  cities: cityFile.cities_and_regions.map((item) => ({ id: item.place_id, label: item.place, profile: item.supply_profile, exposure: item.primary_exposures.join('; '), qualification: item.critical_qualification ?? 'Source dependency is an exposure pathway, not a failure forecast.' })),
  risks: riskFile.risks.map((item) => ({ id: item.risk_id, label: item.geography, type: item.risk_type, horizon: item.manifestation_horizon, finding: item.finding, confidence: item.confidence })),
  technologies: [
    ...desalination.scale_scenarios.map((item) => ({ id: `desal-${item.fifty_mgd_plant_equivalents}`, label: item.target, family: 'Seawater reverse osmosis', service: `${item.target_million_gallons_per_day.toLocaleString('en-US')} Mgal/day`, energy: `${item.electricity_terawatt_hours_per_year[0]}–${item.electricity_terawatt_hours_per_year[1]} TWh/year`, interpretation: item.interpretation })),
    ...awg.scale_scenarios.map((item) => ({ id: `awg-${item.service}`, label: humanizeEvidence(item.service), family: 'Atmospheric water generation', service: `${item.water_liters_per_day.toLocaleString('en-US')} L/day`, energy: item.proxy_electricity_kilowatt_hours_per_day ? `${item.proxy_electricity_kilowatt_hours_per_day[0]}–${item.proxy_electricity_kilowatt_hours_per_day[1]} kWh/day` : `${item.proxy_electricity_gigawatt_hours_per_day?.[0]}–${item.proxy_electricity_gigawatt_hours_per_day?.[1]} GWh/day`, interpretation: item.interpretation })),
  ],
} as const;

interface MaterialFlowFile {
  primary_baseline: {
    domestic_production: number;
    exports: number;
    imports_resin_and_finished_products: number;
    domestic_consumption: number;
    disposed: number;
    addition_to_in_use_stock: number;
    recovered_for_reuse_percent: number;
  };
  leading_resins_by_consumption: readonly { resin_id: string; million_metric_tons: number; rank: number }[];
  major_use_categories: readonly { category: string; million_metric_tons_into_use: number; quality_flag?: string }[];
  disposal_destination_percent_of_48_mmt: readonly { destination: string; percent: number }[];
}
const materialFlow = readJson<MaterialFlowFile>(PLASTICS_ROOT, 'us-material-flows.json');
export const PLASTIC_FLOW_NETWORK = {
  nodes: [
    { id: 'production', label: 'Domestic production', x: 0.02, y: 0.2 },
    { id: 'imports', label: 'Imports', x: 0.02, y: 0.8 },
    { id: 'consumption', label: 'Domestic consumption', x: 0.43, y: 0.5 },
    { id: 'exports', label: 'Exports', x: 0.45, y: 0.08 },
    { id: 'disposed', label: 'Disposed', x: 0.92, y: 0.32 },
    { id: 'stock', label: 'Added to stock', x: 0.92, y: 0.7 },
    { id: 'recovery', label: 'Recovered for reuse', x: 0.92, y: 0.95 },
  ],
  edges: [
    { id: 'production-consumption', label: 'Modeled domestic production after exports', source: 'production', target: 'consumption', weight: 44.9 },
    { id: 'production-exports', label: 'Exports', source: 'production', target: 'exports', weight: 12.1 },
    { id: 'imports-consumption', label: 'Imported resin and products', source: 'imports', target: 'consumption', weight: 12 },
    { id: 'consumption-disposed', label: 'Disposed', source: 'consumption', target: 'disposed', weight: 48 },
    { id: 'consumption-stock', label: 'Addition to in-use stock', source: 'consumption', target: 'stock', weight: 8.8 },
    { id: 'disposed-recovery', label: 'Recovery magnitude not published as a compatible flow', source: 'disposed', target: 'recovery', weight: null },
  ],
} as const;
export const PLASTIC_FLOW_TABLE = [
  { flow: 'Domestic production', value: materialFlow.primary_baseline.domestic_production, unit: 'million metric tons', qualifier: 'Greater than', year: 2019 },
  { flow: 'Exports', value: materialFlow.primary_baseline.exports, unit: 'million metric tons', qualifier: 'Modeled', year: 2019 },
  { flow: 'Imports, resin and finished products', value: materialFlow.primary_baseline.imports_resin_and_finished_products, unit: 'million metric tons', qualifier: 'Modeled', year: 2019 },
  { flow: 'Domestic consumption', value: materialFlow.primary_baseline.domestic_consumption, unit: 'million metric tons', qualifier: 'Greater than', year: 2019 },
  { flow: 'Disposed', value: materialFlow.primary_baseline.disposed, unit: 'million metric tons', qualifier: 'Modeled', year: 2019 },
  { flow: 'Added to in-use stock', value: materialFlow.primary_baseline.addition_to_in_use_stock, unit: 'million metric tons', qualifier: 'Modeled', year: 2019 },
  { flow: 'Recovered for reuse', value: materialFlow.primary_baseline.recovered_for_reuse_percent, unit: 'percent', qualifier: 'Less than; not converted to mass', year: 2019 },
];
export const LEADING_RESIN_BARS: readonly EnergyBar[] = materialFlow.leading_resins_by_consumption.map((item) => ({ id: item.resin_id, label: item.resin_id, value: item.million_metric_tons }));
export const LEADING_RESIN_TABLE = materialFlow.leading_resins_by_consumption.map((item) => ({ rank: item.rank, resin: item.resin_id, modeledConsumption: item.million_metric_tons, unit: 'million metric tons', year: 2019 }));

interface ResinCatalogFile {
  resins: readonly {
    resin_id: string;
    name: string;
    class: string;
    us_2019_consumption_mmt: number | null;
    common_uses: readonly string[];
    functional_strengths: readonly string[];
    replacement_priority: string;
    health_entity_note: string;
  }[];
}
interface ManufacturingFile {
  pathways: readonly {
    resin_id: string;
    primary_inputs: readonly string[];
    steps: readonly string[];
    principal_water_nodes: readonly string[];
    process_note?: string;
    regional_note?: string;
  }[];
}
const resinCatalog = readJson<ResinCatalogFile>(PLASTICS_ROOT, 'resin-catalog.json');
const manufacturing = readJson<ManufacturingFile>(PLASTICS_ROOT, 'manufacturing-pathways.json');
export const RESIN_PROCESS_NETWORK = {
  nodes: [
    { id: 'feedstock', label: 'Feedstock', x: 0.02, y: 0.5 },
    { id: 'monomer', label: 'Monomer & precursor', x: 0.27, y: 0.5 },
    { id: 'polymer', label: 'Polymerization', x: 0.52, y: 0.5 },
    { id: 'finishing', label: 'Resin finishing', x: 0.76, y: 0.5 },
    { id: 'conversion', label: 'Product conversion', x: 0.98, y: 0.5 },
  ],
  edges: [
    { id: 'feedstock-monomer', label: 'Cracking, refining, or chemical synthesis', source: 'feedstock', target: 'monomer', weight: null },
    { id: 'monomer-polymer', label: 'Resin-specific reaction', source: 'monomer', target: 'polymer', weight: null },
    { id: 'polymer-finishing', label: 'Recovery, additives, cooling, pelletizing', source: 'polymer', target: 'finishing', weight: null },
    { id: 'finishing-conversion', label: 'Molding, extrusion, spinning, foaming, or curing', source: 'finishing', target: 'conversion', weight: null },
  ],
} as const;
export const RESIN_PROCESS_TABLE = manufacturing.pathways.map((item) => ({
  resin: item.resin_id,
  primaryInputs: item.primary_inputs.join('; '),
  processSteps: item.steps.join(' → '),
  waterNodes: item.principal_water_nodes.join('; '),
  qualification: item.process_note ?? item.regional_note ?? 'Process structure only; not a quantitative water coefficient.',
}));

interface WaterIntensityFile {
  four_database_figure_estimates: readonly {
    resin_id: string;
    minimum: number;
    maximum: number;
    cross_database_mean_approximate: number;
    precision: string;
    use_rule?: string;
  }[];
  coverage_by_resin: readonly { resin_id: string; status: string; reason?: string }[];
  net_service_rule: { functional_unit: string; minimum_sensitivity_dimensions: readonly string[] };
}
const waterIntensity = readJson<WaterIntensityFile>(PLASTICS_ROOT, 'water-intensities.json');
export const RESIN_WATER_RANGES: readonly EnergyDotRange[] = waterIntensity.four_database_figure_estimates.map((item) => ({ id: item.resin_id, label: item.resin_id, low: item.minimum, value: item.cross_database_mean_approximate, high: item.maximum }));
export const RESIN_WATER_TABLE = waterIntensity.four_database_figure_estimates.map((item) => ({ resin: item.resin_id, low: item.minimum, approximateMean: item.cross_database_mean_approximate, high: item.maximum, unit: 'L/kg resin', precision: humanizeEvidence(item.precision), guardrail: item.use_rule ?? 'Not a plant coefficient or net product saving.' }));
const grossAvoidanceRows = readCsv(PLASTICS_ROOT, 'scenarios/gross-water-avoidance.csv');
export const GROSS_WATER_RANGES: readonly EnergyDotRange[] = grossAvoidanceRows.slice(0, 3).map((row) => ({ id: row.material_id ?? '', label: row.material_id ?? '', low: numberField(row, 'gross_low_us_gallons'), value: numberField(row, 'gross_central_us_gallons'), high: numberField(row, 'gross_high_us_gallons') }));
export const GROSS_WATER_TABLE = grossAvoidanceRows.slice(0, 3).map((row) => ({ resin: row.material_id ?? '', massAvoided: numberField(row, 'mass_avoided_kg'), grossLowGallons: numberField(row, 'gross_low_us_gallons'), grossCentralGallons: numberField(row, 'gross_central_us_gallons'), grossHighGallons: numberField(row, 'gross_high_us_gallons'), status: humanizeEvidence(row.status ?? '') }));

interface HealthFile {
  micro_and_nanoplastics: readonly { endpoint: string; evidence_type: string; evidence_strength: string; causal_status: string; dashboard_text: string; prohibited_text: string }[];
  pregnancy_vaccine_claim_audit: { verdict: string; what_the_study_measured: string; key_results: readonly string[]; correct_dashboard_text: string; prohibited_text: string };
  resin_and_chemistry_matrix: readonly { material_group: string; polymer_evidence: string; priority_hazards: readonly string[]; high_confidence_reason_to_act: string; guardrail: string }[];
}
const health = readJson<HealthFile>(PLASTICS_ROOT, 'health-evidence.json');
export const HEALTH_EVIDENCE_ROWS = ['Food particle exposure', 'Carotid plaque cohort', 'PFAS vaccine cohort', 'Vinyl chloride monomer', 'Isocyanate workers'] as const;
export const HEALTH_EVIDENCE_COLUMNS = ['Exposure', 'Association', 'Causal finding', 'Action basis'] as const;
const healthValues = [
  [3, 1, null, 1],
  [3, 2, null, 2],
  [3, 2, null, 2],
  [3, 3, 3, 3],
  [3, 3, 3, 3],
] as const;
export const HEALTH_EVIDENCE_MATRIX = HEALTH_EVIDENCE_ROWS.flatMap((row, rowIndex) => HEALTH_EVIDENCE_COLUMNS.map((column, columnIndex) => ({ row, column, value: healthValues[rowIndex]?.[columnIndex] ?? null })));
export const HEALTH_EVIDENCE_TABLE = [
  ...health.micro_and_nanoplastics.map((item) => ({ entity: humanizeEvidence(item.endpoint), evidenceClass: humanizeEvidence(item.evidence_type), finding: item.dashboard_text, causalStatus: humanizeEvidence(item.causal_status), guardrail: item.prohibited_text })),
  { entity: 'PFAS serum concentrations and vaccine antibodies', evidenceClass: 'Prospective observational birth cohort', finding: health.pregnancy_vaccine_claim_audit.correct_dashboard_text, causalStatus: 'Association; not a microplastic ingestion study', guardrail: health.pregnancy_vaccine_claim_audit.prohibited_text },
  ...health.resin_and_chemistry_matrix.filter((item) => ['PVC', 'polyurethane'].includes(item.material_group)).map((item) => ({ entity: humanizeEvidence(item.material_group), evidenceClass: 'Chemical and exposure-specific evidence', finding: item.polymer_evidence, causalStatus: item.high_confidence_reason_to_act, guardrail: item.guardrail })),
];
export const PFAS_VACCINE_AUDIT = [
  { panel: 'Viral claim', text: health.pregnancy_vaccine_claim_audit.prohibited_text, status: 'Rejected' },
  { panel: 'Measured exposure', text: health.pregnancy_vaccine_claim_audit.what_the_study_measured, status: 'Observed serum concentrations' },
  { panel: 'Measured outcome', text: health.pregnancy_vaccine_claim_audit.key_results.join(' '), status: 'Antibody associations' },
  { panel: 'Qualified finding', text: health.pregnancy_vaccine_claim_audit.correct_dashboard_text, status: humanizeEvidence(health.pregnancy_vaccine_claim_audit.verdict) },
] as const;

interface CountryFile {
  cases: readonly { jurisdiction: string; mechanisms: readonly string[]; replacement_pattern: readonly string[]; caution?: string }[];
}
const countryFile = readJson<CountryFile>(PLASTICS_ROOT, 'country-case-studies.json');
export const POLICY_ROWS = countryFile.cases.map((item) => humanizeEvidence(item.jurisdiction));
export const POLICY_COLUMNS = ['Targeted restriction', 'Reuse', 'Deposit', 'EPR', 'Exceptions or scope limit'] as const;
export const POLICY_MATRIX = countryFile.cases.flatMap((item) => {
  const mechanisms = item.mechanisms.join(' ').toLowerCase();
  return POLICY_COLUMNS.map((column) => {
    const present = column === 'Targeted restriction' ? /restriction|prohibition|single-use/u.test(mechanisms)
      : column === 'Reuse' ? /reuse|reusable|refill/u.test(`${mechanisms} ${item.replacement_pattern.join(' ')}`.toLowerCase())
      : column === 'Deposit' ? /deposit/u.test(mechanisms)
      : column === 'EPR' ? /producer responsibility/u.test(mechanisms)
      : Boolean(item.caution) || item.jurisdiction === 'Rwanda';
    return { row: humanizeEvidence(item.jurisdiction), column, value: present ? 1 : null };
  });
});
export const POLICY_TABLE = countryFile.cases.map((item) => ({ jurisdiction: humanizeEvidence(item.jurisdiction), mechanisms: item.mechanisms.join('; '), replacementPattern: item.replacement_pattern.join('; '), scopeGuardrail: item.caution ?? 'Targeted mechanisms; not an economy without plastic.' }));

interface ReplacementFile {
  tiers: readonly { tier: number; name: string; eligibility: string; candidate_applications: readonly string[]; instruments: readonly string[]; water_measurement: string }[];
  water_accounting_protocol: { required_terms: readonly string[]; functional_unit_examples: readonly string[]; national_estimate_gate: string };
  stop_conditions: readonly string[];
}
const replacement = readJson<ReplacementFile>(PLASTICS_ROOT, 'replacement-strategy.json');
export const REPLACEMENT_NETWORK = {
  nodes: [
    { id: 'use', label: 'Plastic-enabled service', x: 0.02, y: 0.5 },
    { id: 'essential', label: 'Essential?', x: 0.26, y: 0.5 },
    { id: 'exposure', label: 'Exposure or leakage?', x: 0.5, y: 0.5 },
    { id: 'alternative', label: 'Validated alternative?', x: 0.73, y: 0.5 },
    { id: 'transition', label: 'Eliminate, reuse, capture, or substitute', x: 0.98, y: 0.25 },
    { id: 'retain', label: 'Retain with controls & review', x: 0.98, y: 0.78 },
  ],
  edges: [
    { id: 'use-essential', label: 'Define function and performance', source: 'use', target: 'essential', weight: null },
    { id: 'essential-exposure', label: 'Assess service criticality', source: 'essential', target: 'exposure', weight: null },
    { id: 'exposure-alternative', label: 'Assess hazard, release, and loss', source: 'exposure', target: 'alternative', weight: null },
    { id: 'alternative-transition', label: 'Functional LCA and safety gates pass', source: 'alternative', target: 'transition', weight: null },
    { id: 'alternative-retain', label: 'No validated safer system yet', source: 'alternative', target: 'retain', weight: null },
  ],
} as const;
export const REPLACEMENT_TABLE = replacement.tiers.map((item) => ({ tier: item.tier, strategy: humanizeEvidence(item.name), eligibility: item.eligibility, candidateApplications: item.candidate_applications.join('; '), instruments: item.instruments.join('; '), waterMeasurement: item.water_measurement }));
export const FUNCTIONAL_WATER_BARS: readonly EnergyBar[] = replacement.water_accounting_protocol.required_terms.map((term) => ({ id: term, label: humanizeEvidence(term).replace('Water', ''), value: null }));
export const FUNCTIONAL_WATER_TABLE = replacement.water_accounting_protocol.required_terms.map((term) => ({ term: humanizeEvidence(term), value: null, unit: 'liters per specified service', status: 'Unavailable until a product-service counterfactual is selected and measured' }));

interface SeaweedFile {
  resource_context: { doe_screened_model: { modeled_supply_at_or_below_1000_usd_per_dry_ton_billion_metric_tons_per_year: number; qualifier: string } };
  illustrative_conversion_scenarios_not_forecasts: readonly { scenario_id: string; doe_modeled_dry_biomass_mmt_per_year: number; share_to_bioplastic_percent: number; finished_polymer_yield_percent_of_dry_biomass: number; finished_material_mmt_per_year: number; share_of_2019_us_plastic_consumption_percent: number }[];
  scenario_exclusions: readonly string[];
  national_scale_conclusion: string;
}
const seaweed = readJson<SeaweedFile>(PLASTICS_ROOT, 'seaweed.json');
export const SEAWEED_SCENARIO_BARS: readonly EnergyBar[] = seaweed.illustrative_conversion_scenarios_not_forecasts.map((item) => ({ id: item.scenario_id, label: humanizeEvidence(item.scenario_id).replace(' Allocation', ''), value: item.finished_material_mmt_per_year }));
export const SEAWEED_SCENARIO_TABLE = seaweed.illustrative_conversion_scenarios_not_forecasts.map((item) => ({ scenario: humanizeEvidence(item.scenario_id), modeledDryBiomass: item.doe_modeled_dry_biomass_mmt_per_year, allocation: item.share_to_bioplastic_percent, yield: item.finished_polymer_yield_percent_of_dry_biomass, finishedMaterial: item.finished_material_mmt_per_year, shareOf2019Consumption: item.share_of_2019_us_plastic_consumption_percent, status: 'Illustrative scenario, not forecast' }));

export const PLASTIC_WORKBENCH = {
  resins: resinCatalog.resins.map((item) => ({ id: item.resin_id, label: `${item.resin_id} · ${item.name}`, resinClass: humanizeEvidence(item.class), consumption: item.us_2019_consumption_mmt, uses: item.common_uses.join('; '), priority: item.replacement_priority, healthGuardrail: item.health_entity_note })),
  applications: [
    ...materialFlow.major_use_categories.map((item) => ({ id: item.category, label: humanizeEvidence(item.category), volume: item.million_metric_tons_into_use, decision: item.quality_flag ? 'Resolve the category before product policy.' : 'Assess elimination, reuse, high capture, and product-service alternatives.' })),
    { id: 'critical_services', label: 'Critical medical, infrastructure, and food service', volume: null, decision: 'Use application-specific transition, functional performance, and safety stop conditions.' },
  ],
  exposures: [
    { id: 'consumer', label: 'Consumers', boundary: 'Separate finished polymer, additives, residuals, particles, and food-contact conditions.' },
    { id: 'worker', label: 'Workers', boundary: 'Production chemicals, dust, heat, and reactive application stages can dominate exposure.' },
    { id: 'fenceline', label: 'Fence-line communities', boundary: 'Facility air and water releases require place- and chemical-specific evidence.' },
    { id: 'patient', label: 'Patients', boundary: 'Sterility and clinical function are safety constraints; medical uses require application-specific transition.' },
  ],
  healthClasses: HEALTH_EVIDENCE_TABLE.map((item, index) => ({ id: `health-${index + 1}`, label: item.entity, finding: item.finding, causalStatus: item.causalStatus, guardrail: item.guardrail })),
  policies: countryFile.cases.map((item) => ({ id: item.jurisdiction, label: humanizeEvidence(item.jurisdiction), mechanisms: item.mechanisms.join('; '), scope: item.caution ?? 'Targeted policy package; not plastic-free.' })),
  replacements: replacement.tiers.map((item) => ({ id: item.name, label: `Tier ${item.tier} · ${humanizeEvidence(item.name)}`, eligibility: item.eligibility, applications: item.candidate_applications.join('; '), water: item.water_measurement })),
} as const;

export const PLASTIC_GUARDRAILS = {
  functionalUnit: waterIntensity.net_service_rule.functional_unit,
  sensitivity: waterIntensity.net_service_rule.minimum_sensitivity_dimensions,
  nationalGate: replacement.water_accounting_protocol.national_estimate_gate,
  stopConditions: replacement.stop_conditions,
  seaweedExclusions: seaweed.scenario_exclusions,
  seaweedConclusion: seaweed.national_scale_conclusion,
} as const;
