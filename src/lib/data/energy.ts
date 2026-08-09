import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CANONICAL_REGISTRIES } from '../registry/store';
import type { ChartRecord, MetricRecord, SourceRecord } from '../registry/types';
import type { ChartType } from '../registry/values';
import { parseCsv, type CsvRow } from './csv';

export interface EnergyLineSeries {
  id: string;
  label: string;
  values: readonly { x: number; y: number | null }[];
}

export interface EnergyBar {
  id: string;
  label: string;
  value: number | null;
}

export interface EnergyDotRange {
  id: string;
  label: string;
  low: number | null;
  value: number | null;
  high: number | null;
}

const ENERGY_ROOT = resolve(process.cwd(), 'research', 'energy');

function readEnergyCsv(path: string): readonly CsvRow[] {
  return parseCsv(readFileSync(resolve(ENERGY_ROOT, path), 'utf8'));
}

function readEnergyJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ENERGY_ROOT, path), 'utf8')) as T;
}

function numberField(row: CsvRow, field: string): number {
  const raw = row[field];
  if (raw === undefined || raw === '') throw new Error(`Energy adapter requires ${field}.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Energy adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

function stringField(row: CsvRow, field: string): string {
  const value = row[field];
  if (!value) throw new Error(`Energy adapter requires ${field}.`);
  return value;
}

function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/gu, (character) => character.toUpperCase());
}

function lineSeries(
  rows: readonly CsvRow[],
  identityField: string,
  identities: readonly string[],
  labels: Readonly<Record<string, string>> = {},
): readonly EnergyLineSeries[] {
  return identities.map((identity) => ({
    id: identity,
    label: labels[identity] ?? label(identity),
    values: rows
      .filter((row) => row[identityField] === identity)
      .map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'value') }))
      .sort((first, second) => first.x - second.x),
  }));
}

export function sourceByIdentity(identity: string): SourceRecord {
  const source = CANONICAL_REGISTRIES.source?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!source) throw new Error(`Canonical source ${identity} is missing.`);
  return source;
}

export function metricById(id: string): MetricRecord {
  const metric = CANONICAL_REGISTRIES.metric?.find((candidate) => candidate.id === id);
  if (!metric) throw new Error(`Canonical metric ${id} is missing.`);
  return metric;
}

export function approvedEnergyChart(id: string, chartType: ChartType): ChartRecord {
  const chart = CANONICAL_REGISTRIES.chart?.find((candidate) => candidate.id === id);
  if (!chart) throw new Error(`Canonical chart ${id} is missing.`);
  if (chart.chartType !== 'none' && chart.chartType !== chartType) {
    throw new Error(`${id} is registered as ${chart.chartType}, not ${chartType}.`);
  }
  return chart.chartType === chartType ? chart : { ...chart, chartType };
}

const globalGeneration = readEnergyCsv('timeseries/normalized/global-electricity-generation-history.csv');
const usGeneration = readEnergyCsv('timeseries/normalized/us-electricity-generation-history.csv');
const aeoGeneration = readEnergyCsv('timeseries/normalized/us-electricity-projections-aeo2026.csv');
const reedsGeneration = readEnergyCsv('timeseries/normalized/us-electricity-projections-nrel-standard-scenarios-2024.csv');
const usConsumption = readEnergyCsv('consumption/timeseries/normalized/us-electricity-consumption-history.csv');
const aeoDemand = readEnergyCsv('consumption/timeseries/normalized/us-electricity-supply-demand-aeo2026.csv');
const aeoEndUse = readEnergyCsv('consumption/timeseries/normalized/us-electricity-end-use-aeo2026.csv');
const demandDrivers = readEnergyCsv('consumption/timeseries/normalized/us-demand-drivers-aeo2026.csv');
const demandMilestones = readEnergyCsv('consumption/timeseries/normalized/global-and-us-demand-milestones.csv');
const nrelEfs = readEnergyCsv('consumption/timeseries/normalized/us-electrification-scenarios-nrel-efs.csv');
const loadProfiles = readEnergyCsv('transmission/load-shape/timeseries/normalized/average-hourly-load-profiles-2024.csv');
const loadSummary = readEnergyCsv('transmission/load-shape/timeseries/normalized/load-shape-summary-2024.csv');
const taxonomy = readEnergyJson<{ nodes: readonly { id: string; label: string }[]; classification_rules: readonly string[] }>('technology-taxonomy.json');

export const ENERGY_SOURCES = {
  worldHistory: sourceByIdentity('SRC-OWID-ENERGY'),
  usGeneration: sourceByIdentity('SRC-EIA-MER-7.2A'),
  usSolar: sourceByIdentity('SRC-EIA-MER-10.6'),
  production: sourceByIdentity('SRC-EIA-MER-T12'),
  consumption: sourceByIdentity('SRC-EIA-MER-T13'),
  demandHistory: sourceByIdentity('SRC-EIA-MER-7.6'),
  aeo: sourceByIdentity('SRC-EIA-AEO2026-TABLES'),
  reeds: sourceByIdentity('SRC-NREL-STANDARD-SCENARIOS-2024'),
  efs: sourceByIdentity('SRC-NREL-EFS18'),
  eia930: sourceByIdentity('SRC-EIA-930'),
  dataCenterWorld: sourceByIdentity('SRC-IEA-ENERGY-AI25'),
  dataCenterUs: sourceByIdentity('SRC-LBNL-DATACENTER24'),
  evWorld: sourceByIdentity('SRC-IEA-GEVO26'),
} as const;

const worldTechnologies = ['coal', 'natural_gas', 'hydropower', 'nuclear', 'wind', 'solar'] as const;
const usTechnologies = ['coal', 'natural_gas', 'nuclear', 'hydropower', 'wind', 'solar_total'] as const;

export const WORLD_GENERATION_SERIES = lineSeries(globalGeneration, 'technology', worldTechnologies, {
  natural_gas: 'Natural gas', hydropower: 'Hydropower', nuclear: 'Nuclear', solar: 'Solar', wind: 'Wind', coal: 'Coal',
});
export const US_GENERATION_SERIES = lineSeries(usGeneration, 'technology', usTechnologies, {
  natural_gas: 'Natural gas', hydropower: 'Hydropower', nuclear: 'Nuclear', solar_total: 'Solar, all scales', wind: 'Wind', coal: 'Coal',
});

export interface EnergyTableRow extends Readonly<Record<string, string | number | null>> {
  source: string;
  value: number;
  unit: string;
  status: string;
}

export const WORLD_GENERATION_2025: readonly EnergyTableRow[] = globalGeneration
  .filter((row) => numberField(row, 'year') === 2025 && row.technology !== 'total')
  .map((row) => ({ source: label(stringField(row, 'technology')), value: numberField(row, 'value'), unit: stringField(row, 'unit'), status: stringField(row, 'upstream_status') }));

export const US_GENERATION_2025: readonly EnergyTableRow[] = usGeneration
  .filter((row) => numberField(row, 'year') === 2025 && !['solar_utility_scale', 'solar_small_scale'].includes(row.technology ?? ''))
  .map((row) => ({ source: label(stringField(row, 'technology')), value: numberField(row, 'value'), unit: stringField(row, 'unit'), status: stringField(row, 'upstream_status') }));

export const US_PRIMARY_METRICS = {
  production: metricById('MET-000051'),
  consumption: metricById('MET-000063'),
} as const;

function taxonomyLabel(id: string): string {
  const node = taxonomy.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Energy taxonomy node ${id} is missing.`);
  return node.label;
}

export const ENERGY_ONTOLOGY = {
  nodes: [
    { id: 'resource', label: 'Primary resources', x: 0.05, y: 0.5 },
    { id: 'conversion', label: taxonomyLabel('conversion'), x: 0.36, y: 0.5 },
    { id: 'carrier', label: taxonomyLabel('carrier'), x: 0.67, y: 0.5 },
    { id: 'storage', label: taxonomyLabel('storage'), x: 0.95, y: 0.22 },
  ],
  edges: [
    { id: 'resource-conversion', label: 'Physical or chemical input', source: 'resource', target: 'conversion', weight: null },
    { id: 'conversion-carrier', label: 'Conversion produces a deliverable carrier', source: 'conversion', target: 'carrier', weight: null },
    { id: 'carrier-storage', label: 'Carrier can charge storage', source: 'carrier', target: 'storage', weight: null },
    { id: 'storage-carrier', label: 'Storage returns a carrier later', source: 'storage', target: 'carrier', weight: null },
  ],
  rules: taxonomy.classification_rules,
} as const;

const observedTotalGeneration = usGeneration.filter((row) => row.technology === 'total');
const aeoBaselineGeneration = aeoGeneration.filter((row) => row.scenario === 'Counterfactual Baseline' && row.metric === 'electricity_generation' && row.technology === 'total');
const reedsMidGeneration = reedsGeneration.filter((row) => row.scenario === 'Mid_Case' && row.metric === 'electricity_generation' && row.technology === 'total');
export const ENERGY_SCENARIO_SEAM: readonly EnergyLineSeries[] = [
  { id: 'observed', label: 'EIA observed, 50 states + D.C.', values: observedTotalGeneration.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'value') })) },
  { id: 'aeo2026', label: 'AEO2026 Counterfactual Baseline', values: aeoBaselineGeneration.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'value') })) },
  { id: 'reeds2024', label: 'ReEDS 2024 Mid-case, contiguous U.S.', values: reedsMidGeneration.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'value') })) },
];

const salesRows = usConsumption.filter((row) => row.metric === 'electricity_sales' && ['residential', 'commercial', 'industrial', 'transportation'].includes(row.sector ?? ''));
const totalUseRows = usConsumption.filter((row) => row.metric === 'electricity_use' && row.sector === 'total');
export const US_ELECTRICITY_USE_SERIES: readonly EnergyLineSeries[] = [
  ...lineSeries(salesRows, 'sector', ['residential', 'commercial', 'industrial', 'transportation']),
  { id: 'total_use', label: 'Total use, including direct use', values: totalUseRows.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'value') })) },
];

export const US_ELECTRICITY_USE_2025: readonly EnergyTableRow[] = usConsumption
  .filter((row) => numberField(row, 'year') === 2025 && ((row.metric === 'electricity_sales' && ['residential', 'commercial', 'industrial', 'transportation', 'total'].includes(row.sector ?? '')) || row.metric === 'direct_use' || row.metric === 'electricity_use'))
  .map((row) => ({ source: row.metric === 'electricity_sales' ? `${label(stringField(row, 'sector'))} sales` : label(stringField(row, 'metric')), value: numberField(row, 'value'), unit: stringField(row, 'unit'), status: stringField(row, 'upstream_status') }));

const aeoUseRows = aeoDemand.filter((row) => row.metric === 'electricity_use' && row.sector === 'total');
const aeoScenarios = [...new Set(aeoUseRows.map((row) => stringField(row, 'scenario')))];
export const AEO_DEMAND_SERIES = lineSeries(aeoUseRows, 'scenario', aeoScenarios);
export const AEO_DEMAND_2050: readonly EnergyTableRow[] = aeoUseRows
  .filter((row) => numberField(row, 'year') === 2050)
  .map((row) => ({ source: stringField(row, 'scenario'), value: numberField(row, 'value'), unit: stringField(row, 'unit'), status: stringField(row, 'upstream_status') }))
  .sort((first, second) => first.value - second.value);

const baselineSectorRows = aeoDemand.filter((row) => row.scenario === 'Counterfactual Baseline' && row.metric === 'electricity_sales' && ['residential', 'commercial', 'industrial', 'transportation'].includes(row.sector ?? ''));
export const AEO_BASELINE_SECTOR_2050: readonly EnergyBar[] = baselineSectorRows
  .filter((row) => numberField(row, 'year') === 2050)
  .map((row) => ({ id: stringField(row, 'sector'), label: label(stringField(row, 'sector')), value: numberField(row, 'value') }));
export const AEO_BASELINE_SECTOR_TABLE = baselineSectorRows
  .filter((row) => [2025, 2050].includes(numberField(row, 'year')))
  .map((row) => ({ sector: label(stringField(row, 'sector')), year: numberField(row, 'year'), value: numberField(row, 'value'), unit: stringField(row, 'unit') }));

export interface MilestoneRow extends Readonly<Record<string, string | number | null>> {
  label: string;
  year: number;
  value: number | null;
  low: number | null;
  high: number | null;
  unit: string;
  scope: string;
  evidence: string;
}

const dataCenterMilestones = demandMilestones.filter((row) => row.end_use === 'data_centers_total_facility');
export const DATA_CENTER_FACILITY_ROWS: readonly MilestoneRow[] = dataCenterMilestones
  .filter((row) => row.value_semantics !== 'range_high')
  .map((row) => {
    const matchingHigh = dataCenterMilestones.find((candidate) => candidate.geography === row.geography && candidate.year === row.year && candidate.value_semantics === 'range_high');
    const isRange = row.value_semantics === 'range_low';
    return {
      label: `${row.geography} · ${row.year} · ${row.scenario}`,
      year: numberField(row, 'year'),
      value: isRange ? null : numberField(row, 'value'),
      low: isRange ? numberField(row, 'value') : null,
      high: matchingHigh ? numberField(matchingHigh, 'value') : null,
      unit: stringField(row, 'unit'),
      scope: stringField(row, 'accounting_scope'),
      evidence: stringField(row, 'value_semantics'),
    };
  });

const server2050 = aeoEndUse.filter((row) => row.metric === 'identifiable_load' && row.end_use === 'data_center_servers' && numberField(row, 'year') === 2050);
const serverValues = server2050.map((row) => numberField(row, 'value'));
const serverBaseline = server2050.find((row) => row.scenario === 'Counterfactual Baseline');
export const DATA_CENTER_SERVER_2050: readonly EnergyDotRange[] = [{
  id: 'server-only-2050',
  label: 'AEO2026 server-only · 2050',
  low: Math.min(...serverValues),
  value: serverBaseline ? numberField(serverBaseline, 'value') : null,
  high: Math.max(...serverValues),
}];

export const EV_US_HISTORY: readonly EnergyLineSeries[] = [{
  id: 'us-ev-history',
  label: 'U.S. observed experimental estimate',
  values: usConsumption.filter((row) => row.end_use === 'on_road_light_duty_ev_charging').map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'value') })),
}];
const evAeo2050 = aeoEndUse.filter((row) => row.end_use === 'ev_charging' && numberField(row, 'year') === 2050);
const evByScenario = new Map<string, number>();
for (const row of evAeo2050) evByScenario.set(stringField(row, 'scenario'), (evByScenario.get(stringField(row, 'scenario')) ?? 0) + numberField(row, 'value'));
const evAeoValues = [...evByScenario.values()];
export const EV_AEO_2050: readonly EnergyDotRange[] = [{
  id: 'aeo-ev-2050',
  label: 'AEO2026 charging-location load · 2050',
  low: Math.min(...evAeoValues),
  value: evByScenario.get('Counterfactual Baseline') ?? null,
  high: Math.max(...evAeoValues),
}];
export const EV_GLOBAL_MILESTONES: readonly EnergyDotRange[] = demandMilestones
  .filter((row) => row.end_use === 'road_electric_vehicles')
  .map((row) => ({
    id: `${row.scenario}-${row.year}`.toLowerCase().replace(/[^a-z0-9]+/gu, '-'),
    label: `${row.year} · ${row.scenario}${row.value_semantics === 'lower_bound' ? ' (lower bound)' : ''}`,
    low: row.value_semantics === 'lower_bound' ? numberField(row, 'value') : null,
    value: row.value_semantics === 'lower_bound' ? null : numberField(row, 'value'),
    high: null,
  }));

const profileRows = loadProfiles.filter((row) => row.geography_type === 'eia_region' && row.geography_code === 'TEX' && row.period_type === 'season' && row.day_type === 'all');
export const TEXAS_SEASONAL_LOAD_SERIES: readonly EnergyLineSeries[] = ['winter', 'spring', 'summer', 'autumn'].map((period) => ({
  id: period,
  label: label(period),
  values: profileRows
    .filter((row) => row.period === period)
    .map((row) => ({ x: numberField(row, 'hour_ending'), y: numberField(row, 'mean_demand_mw') }))
    .sort((first, second) => first.x - second.x),
}));
const texasSummary = loadSummary.find((row) => row.geography_type === 'eia_region' && row.geography_code === 'TEX');
if (!texasSummary) throw new Error('EIA-930 Texas regional load summary is missing.');
export const TEXAS_LOAD_SUMMARY = {
  meanMw: numberField(texasSummary, 'mean_demand_mw'),
  peakMw: numberField(texasSummary, 'peak_demand_mw'),
  peakTime: stringField(texasSummary, 'peak_time_end'),
  loadFactor: numberField(texasSummary, 'load_factor_mean_divided_by_peak'),
  observationCount: numberField(texasSummary, 'observation_count'),
  clockBasis: stringField(texasSummary, 'clock_basis'),
} as const;

const indexedDriverNames = ['population', 'households', 'commercial_floorspace', 'real_gdp'] as const;
const baselineDriverRows = demandDrivers.filter((row) => row.scenario === 'Counterfactual Baseline');
export const INDEXED_DEMAND_DRIVERS: readonly EnergyLineSeries[] = indexedDriverNames.map((name) => {
  const rows = baselineDriverRows.filter((row) => row.end_use === name).sort((first, second) => numberField(first, 'year') - numberField(second, 'year'));
  const base = rows.find((row) => numberField(row, 'year') === 2025);
  if (!base) throw new Error(`Demand driver ${name} has no 2025 baseline.`);
  const denominator = numberField(base, 'value');
  return { id: name, label: label(name), values: rows.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'value') / denominator * 100 })) };
});

export interface DemandWorkbenchRecord {
  family: string;
  metric: string;
  horizon: number;
  value: number | null;
  unit: string;
  index: number | null;
  referencePeriod: string;
  scope: string;
  evidence: string;
}

const workbenchMetrics: Readonly<Record<string, { aeoMetric: string; sector: string }>> = {
  total: { aeoMetric: 'electricity_use', sector: 'total' },
  residential: { aeoMetric: 'electricity_sales', sector: 'residential' },
  commercial: { aeoMetric: 'electricity_sales', sector: 'commercial' },
  industrial: { aeoMetric: 'electricity_sales', sector: 'industrial' },
  transportation: { aeoMetric: 'electricity_sales', sector: 'transportation' },
};
const familyScenarios: Readonly<Record<string, string>> = {
  aeo_baseline: 'Counterfactual Baseline',
  aeo_high_demand: 'High Electricity Demand',
  efs_reference: 'Reference electrification | Moderate technology advancement',
  efs_high: 'High electrification | Moderate technology advancement',
};
export const DEMAND_WORKBENCH_RECORDS: readonly DemandWorkbenchRecord[] = Object.entries(familyScenarios).flatMap(([family, scenario]) =>
  Object.entries(workbenchMetrics).flatMap(([metric, definition]) => [2030, 2050].map((horizon) => {
    if (family.startsWith('aeo_')) {
      const series = aeoDemand.filter((row) => row.scenario === scenario && row.metric === definition.aeoMetric && row.sector === definition.sector);
      const base = series.find((row) => numberField(row, 'year') === 2025);
      const selected = series.find((row) => numberField(row, 'year') === horizon);
      return {
        family, metric, horizon,
        value: selected ? numberField(selected, 'value') : null,
        unit: 'TWh',
        index: base && selected ? numberField(selected, 'value') / numberField(base, 'value') * 100 : null,
        referencePeriod: '2025 = 100 within this AEO case and measure',
        scope: metric === 'total' ? 'Total electricity use, including direct use' : `${label(metric)} sales`,
        evidence: 'AEO2026 conditional scenario; not a prediction',
      };
    }
    const reference = nrelEfs.find((row) => row.scenario === '2016 reference year' && row.sector === definition.sector);
    const selected = horizon === 2050 ? nrelEfs.find((row) => row.scenario === scenario && row.sector === definition.sector) : undefined;
    return {
      family, metric, horizon,
      value: selected ? numberField(selected, 'value') : null,
      unit: 'TWh',
      index: reference && selected ? numberField(selected, 'value') / numberField(reference, 'value') * 100 : null,
      referencePeriod: '2016 = 100 within the 2018 NREL study',
      scope: `${label(metric)} electricity consumption in NREL EFS accounting`,
      evidence: selected ? 'NREL EFS 2018 electrification stress test; not a current forecast' : 'NREL EFS publishes the selected national endpoints at 2050, not 2030',
    };
  })),
);

const worldTotal2025 = globalGeneration.find((row) => row.technology === 'total' && numberField(row, 'year') === 2025);
const usTotal2025 = usGeneration.find((row) => row.technology === 'total' && numberField(row, 'year') === 2025);
if (!worldTotal2025 || !usTotal2025) throw new Error('Energy-system 2025 total generation rows are missing.');
export const ENERGY_SYSTEM_WORKBENCH = [
  { geography: 'world', metric: 'electricity_generation', value: numberField(worldTotal2025, 'value'), unit: stringField(worldTotal2025, 'unit'), period: '2025', evidence: 'OWID/Ember historical compilation; latest year may be estimated upstream' },
  { geography: 'us', metric: 'electricity_generation', value: numberField(usTotal2025, 'value'), unit: stringField(usTotal2025, 'unit'), period: '2025', evidence: 'EIA preliminary utility-scale total; small-scale solar is separate' },
  { geography: 'us', metric: 'primary_energy_production', value: US_PRIMARY_METRICS.production.value, unit: US_PRIMARY_METRICS.production.unit, period: US_PRIMARY_METRICS.production.period, evidence: 'EIA preliminary captured-energy accounting' },
  { geography: 'us', metric: 'primary_energy_consumption', value: US_PRIMARY_METRICS.consumption.value, unit: US_PRIMARY_METRICS.consumption.unit, period: US_PRIMARY_METRICS.consumption.period, evidence: 'EIA preliminary primary-energy accounting including adjustments' },
] as const;
