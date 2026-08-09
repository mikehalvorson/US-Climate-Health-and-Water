import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CANONICAL_REGISTRIES } from '../registry/store';
import type { ChartRecord } from '../registry/types';
import type { ChartType } from '../registry/values';
import { parseCsv, type CsvRow } from './csv';
import type { EnergyDotRange, EnergyLineSeries } from './energy';
import { sourceByIdentity } from './energy';

const ENERGY_ROOT = resolve(process.cwd(), 'research', 'energy');
const TRANSMISSION_ROOT = resolve(ENERGY_ROOT, 'transmission');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(TRANSMISSION_ROOT, path), 'utf8')) as T;
}

function readEnergyCsv(path: string): readonly CsvRow[] {
  return parseCsv(readFileSync(resolve(ENERGY_ROOT, path), 'utf8'));
}

function readTransmissionCsv(path: string): readonly CsvRow[] {
  return parseCsv(readFileSync(resolve(TRANSMISSION_ROOT, path), 'utf8'));
}

function numberField(row: CsvRow, field: string): number {
  const raw = row[field];
  if (raw === undefined || raw === '') throw new Error(`Grid adapter requires ${field}.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Grid adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

function nullableNumberField(row: CsvRow, field: string): number | null {
  const raw = row[field];
  if (raw === undefined || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Grid adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

export function gridLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/gu, (character) => character.toUpperCase());
}

export function approvedGridChart(identity: string, chartType: ChartType): ChartRecord {
  const chart = CANONICAL_REGISTRIES.chart?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!chart) throw new Error(`Canonical grid chart ${identity} is missing.`);
  if (chart.chartType !== 'none' && chart.chartType !== chartType) throw new Error(`${identity} is registered as ${chart.chartType}, not ${chartType}.`);
  return chart.chartType === chartType ? chart : { ...chart, chartType };
}

export const GRID_SOURCES = {
  hourly: sourceByIdentity('SRC-EIA-930'),
  transmissionStudy: sourceByIdentity('SRC-DOE-NTPS24'),
  reliability: sourceByIdentity('SRC-NERC-LTRA25'),
  hifld: sourceByIdentity('SRC-HIFLD-TRANSMISSION-LINES'),
  gridSupplyChain: sourceByIdentity('SRC-DOE-GRID-SC22'),
  transformerGao: sourceByIdentity('SRC-GAO-LPT23'),
  transformerDoe: sourceByIdentity('SRC-DOE-LPT24'),
  planning: sourceByIdentity('SRC-FERC-ORDER1920'),
  permitting: sourceByIdentity('SRC-DOE-CITAP'),
} as const;

const selectedBalancingAuthorities = ['CISO', 'ERCO', 'PJM', 'ISNE', 'BPAT', 'MISO'] as const;
const hourlyPath = resolve(TRANSMISSION_ROOT, 'load-shape/timeseries/normalized/us-balancing-authority-hourly-demand-2024.csv.gz');
const hourlyRaw = gunzipSync(readFileSync(hourlyPath)).toString('utf8');
const [hourlyHeader = '', ...hourlyLines] = hourlyRaw.split(/\r?\n/u);
const selectedHourlyLines = hourlyLines.filter((line) => selectedBalancingAuthorities.some((code) => line.includes(`,SRC-EIA-930,${code},`)));
const selectedHourlyRows = parseCsv(`${hourlyHeader}\n${selectedHourlyLines.join('\n')}\n`);

function isoDate(value: string): string {
  const [month = '', day = '', year = ''] = value.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

const cisoPeakWeekRows = selectedHourlyRows.filter((row) => row.balancing_authority === 'CISO' && (row.local_time_end ?? '') >= '2024-09-01' && (row.local_time_end ?? '') < '2024-09-08');
export const GRID_HOURLY_SERIES: readonly EnergyLineSeries[] = [{
  id: 'CISO',
  label: 'California ISO (CISO)',
  values: cisoPeakWeekRows.map((row, index) => ({ x: index + 1, y: nullableNumberField(row, 'demand_selected_mw') })),
}];
export const GRID_HOURLY_TABLE = cisoPeakWeekRows.map((row) => ({ localTimeEnd: row.local_time_end ?? '', utcTimeEnd: row.utc_time_end ?? '', demandMw: nullableNumberField(row, 'demand_selected_mw'), selectionBasis: row.selection_basis ?? '', status: row.demand_selected_mw ? 'Observed adjusted demand' : 'Missing; not zero' }));

interface DailyAccumulator { values: number[]; missingHours: number; region: string }
const dailyByBa = new Map<string, DailyAccumulator>();
for (const row of selectedHourlyRows) {
  const ba = row.balancing_authority ?? '';
  const date = isoDate(row.data_date ?? '');
  const key = `${ba}:${date}`;
  const record = dailyByBa.get(key) ?? { values: [], missingHours: 0, region: row.region ?? '' };
  const value = nullableNumberField(row, 'demand_selected_mw');
  if (value === null) record.missingHours += 1;
  else record.values.push(value);
  dailyByBa.set(key, record);
}
export const GRID_DAILY_RECORDS = [...dailyByBa.entries()].map(([key, item]) => {
  const [balancingAuthority = '', date = ''] = key.split(':');
  return { balancingAuthority, date, region: item.region, peakMw: item.values.length ? Math.max(...item.values) : null, meanMw: item.values.length ? item.values.reduce((sum, value) => sum + value, 0) / item.values.length : null, missingHours: item.missingHours };
}).sort((first, second) => first.balancingAuthority.localeCompare(second.balancingAuthority) || first.date.localeCompare(second.date));

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const cisoDaily = GRID_DAILY_RECORDS.filter((item) => item.balancingAuthority === 'CISO');
export const GRID_CALENDAR_VALUES = monthLabels.flatMap((month, monthIndex) => Array.from({ length: 31 }, (_, dayIndex) => {
  const date = `2024-${String(monthIndex + 1).padStart(2, '0')}-${String(dayIndex + 1).padStart(2, '0')}`;
  const validDate = new Date(`${date}T00:00:00Z`).getUTCMonth() === monthIndex;
  const record = cisoDaily.find((item) => item.date === date);
  return { month, day: dayIndex + 1, value: validDate ? record?.peakMw ?? null : null, missingHours: validDate ? record?.missingHours ?? 0 : 0, date: validDate ? date : null };
}));
export const GRID_CALENDAR_TABLE = cisoDaily.map((item) => ({ date: item.date, dailyPeakMw: item.peakMw, dailyMeanMw: item.meanMw, missingHours: item.missingHours, status: item.peakMw === null ? 'Missing full day; not zero' : item.missingHours ? 'Partial day; peak retained with missing-hour flag' : 'Complete selected-demand observations' }));

interface CorridorFeature {
  properties: { name: string; status: string; primary_capacity_mw: number; primary_capacity_type: string; technology: string; source_id: string; geometry_quality: string };
  geometry: { type: 'LineString'; coordinates: readonly (readonly [number, number])[] };
}
interface CorridorGeoJson { features: readonly CorridorFeature[] }
const corridorGeoJson = readJson<CorridorGeoJson>('corridors/major-corridors.geojson');
export const GRID_CORRIDOR_LINES = corridorGeoJson.features.map((feature, index) => ({ id: `corridor-${index + 1}`, ...feature.properties, coordinates: feature.geometry.coordinates }));
export const GRID_CORRIDOR_TABLE = GRID_CORRIDOR_LINES.map((item) => ({ name: item.name, status: gridLabel(item.status), technology: item.technology, primaryCapacityMw: item.primary_capacity_mw, capacityType: gridLabel(item.primary_capacity_type), geometryQuality: gridLabel(item.geometry_quality), sourceId: item.source_id }));

interface CapacityDefinition { code: string; definition: string; dashboard_label: string; may_be_summed: false; warning: string }
interface CapacityFile { definitions: readonly CapacityDefinition[]; prohibited_transforms: readonly string[] }
interface CapacityRecord { value_mw: number; capacity_type: string; direction?: string; status?: string; study_years?: string; source_id: string }
interface CorridorCatalogRecord { corridor_id: string; name: string; status: string; capacity_records: readonly CapacityRecord[]; capacity_note?: string }
interface CorridorCatalogFile { records: readonly CorridorCatalogRecord[]; limitations: readonly string[] }
const capacityFile = readJson<CapacityFile>('corridors/capacity-definitions.json');
const corridorCatalog = readJson<CorridorCatalogFile>('corridors/corridor-catalog.json');
export const GRID_CAPACITY_RECORDS = corridorCatalog.records.flatMap((corridor) => corridor.capacity_records.map((record, index) => ({ id: `${corridor.corridor_id}-${index + 1}`, corridor: corridor.name, corridorStatus: gridLabel(corridor.status), value: record.value_mw, capacityType: gridLabel(record.capacity_type), capacityTypeId: record.capacity_type, direction: record.direction ? gridLabel(record.direction) : 'Not stated', recordStatus: record.status ? gridLabel(record.status) : 'As stated', studyYears: record.study_years ?? 'Not stated', sourceId: record.source_id, qualification: corridor.capacity_note ?? capacityFile.definitions.find((item) => item.code === record.capacity_type)?.warning ?? 'Not additive with other capacity records' })));
export const GRID_CAPACITY_DEFINITIONS = capacityFile.definitions.map((item) => ({ id: item.code, label: item.dashboard_label, definition: item.definition, mayBeSummed: item.may_be_summed ? 'Yes' : 'No', warning: item.warning }));

interface NeedsFile {
  study_comparison: readonly {
    study_id: string;
    horizon?: number;
    retained_results: readonly Readonly<Record<string, string | number | readonly string[]>>[] | string;
    dashboard_label: string;
  }[];
}
const needsFile = readJson<NeedsFile>('needs-and-expectations.json');
const aeoRows = readEnergyCsv('consumption/timeseries/normalized/us-electricity-supply-demand-aeo2026.csv');
function aeoIndex(scenario: string, year: number): number {
  const rows = aeoRows.filter((row) => row.scenario === scenario && row.metric === 'electricity_use' && row.sector === 'total');
  const base = rows.find((row) => Number(row.year) === 2025);
  const target = rows.find((row) => Number(row.year) === year);
  if (!base || !target) throw new Error(`AEO grid index rows are missing for ${scenario}/${year}.`);
  return numberField(target, 'value') / numberField(base, 'value') * 100;
}
const ntps = needsFile.study_comparison.find((item) => item.study_id === 'NTPS-2024');
const ntpsResults = Array.isArray(ntps?.retained_results) ? ntps.retained_results : [];
const ntpsTransmission = ntpsResults.find((item) => item.metric === 'total_transmission_relative_to_2020');
if (!ntpsTransmission || typeof ntpsTransmission.range_min !== 'number' || typeof ntpsTransmission.range_max !== 'number') throw new Error('NTPS transmission range is missing.');
const needs2035 = needsFile.study_comparison.find((item) => item.study_id === 'NEEDS-2023');
const needsResults = Array.isArray(needs2035?.retained_results) ? needs2035.retained_results : [];
export const GRID_INDEX_RANGES: readonly EnergyDotRange[] = [
  { id: 'aeo-baseline', label: 'AEO baseline demand, 2050 (2025=100)', low: aeoIndex('Counterfactual Baseline', 2050), value: aeoIndex('Counterfactual Baseline', 2050), high: aeoIndex('Counterfactual Baseline', 2050) },
  { id: 'aeo-high', label: 'AEO high demand, 2050 (2025=100)', low: aeoIndex('High Electricity Demand', 2050), value: aeoIndex('High Electricity Demand', 2050), high: aeoIndex('High Electricity Demand', 2050) },
  { id: 'ntps', label: 'DOE modeled transmission, 2050 (2020=100)', low: ntpsTransmission.range_min * 100, value: (ntpsTransmission.range_min + ntpsTransmission.range_max) * 50, high: ntpsTransmission.range_max * 100 },
  ...needsResults.filter((item) => typeof item.value === 'number' && item.metric === 'median_within_region_expansion').map((item) => ({ id: `needs-${item.context}`, label: `DOE 2035 ${gridLabel(String(item.context))} (2020s study baseline=100)`, low: 100 + Number(item.value), value: 100 + Number(item.value), high: 100 + Number(item.value) })),
];
export const GRID_INDEX_TABLE = GRID_INDEX_RANGES.map((item) => ({ series: item.label, lowIndex: item.low, centralIndex: item.value, highIndex: item.high, boundary: item.id.startsWith('aeo') ? 'AEO2026 annual electricity use; 2025=100 within scenario' : item.id === 'ntps' ? 'DOE NTPS modeled total transmission; 2020 grid=100' : 'DOE 2023 needs synthesis; study baseline plus reported within-region expansion', status: 'Source scenario or study comparison; not forecast' }));

interface ProcessNode { node_id: string; label: string; phase: string; actors: readonly string[]; outputs?: readonly string[]; conditional?: boolean; parallel?: boolean; warning?: string }
interface ProcessFile { nodes: readonly ProcessNode[]; graph_semantics: { duration_rule: string; parallelism_rule: string } }
const processFile = readJson<ProcessFile>('process/process-graph.json');
const laneForPhase = (phase: string): string => ['need', 'planning'].includes(phase) ? 'Planning' : phase === 'commercial' ? 'Commercial' : ['siting', 'engagement', 'land'].includes(phase) ? 'Siting & engagement' : phase === 'federal_review' ? 'Federal review' : ['engineering', 'procurement'].includes(phase) ? 'Engineering & procurement' : 'Construction & operation';
export const GRID_PROCESS_LANES = ['Planning', 'Commercial', 'Siting & engagement', 'Federal review', 'Engineering & procurement', 'Construction & operation'] as const;
export const GRID_PROCESS_NODES = processFile.nodes.map((item) => ({ id: item.node_id, label: item.label, lane: laneForPhase(item.phase), phase: gridLabel(item.phase), actors: item.actors.join('; '), outputs: item.outputs?.join('; ') ?? 'Stage completion or decision', status: item.conditional ? 'Conditional' : item.parallel ? 'Parallel branch' : 'Core or recurring', warning: item.warning ?? processFile.graph_semantics.duration_rule }));

interface SupplyNode { node_id: string; layer: string; label: string }
interface SupplyEdge { from: string; to: string; dependency: string; criticality: string; substitutability: string; source_ids: readonly string[] }
interface SupplyFile { nodes: readonly SupplyNode[]; edges: readonly SupplyEdge[] }
const supplyFile = readJson<SupplyFile>('supply-chain/supply-chain-map.json');
const supplyNodeIds = ['MAT-ELEC-STEEL', 'MAT-COPPER', 'CMP-TRANSFORMER', 'LOG-HEAVY', 'LAB-SKILLED', 'SYS-TRANSMISSION', 'LOAD-DATACENTER', 'LOAD-EV', 'LOAD-BUILDING'] as const;
const supplyPositions: Readonly<Record<string, readonly [number, number]>> = {
  'MAT-ELEC-STEEL': [0.02, 0.15], 'MAT-COPPER': [0.02, 0.45], 'LOG-HEAVY': [0.02, 0.75], 'LAB-SKILLED': [0.02, 0.95],
  'CMP-TRANSFORMER': [0.39, 0.3], 'SYS-TRANSMISSION': [0.65, 0.6], 'LOAD-DATACENTER': [0.98, 0.15], 'LOAD-EV': [0.98, 0.5], 'LOAD-BUILDING': [0.98, 0.85],
};
export const GRID_SUPPLY_NETWORK = {
  nodes: supplyFile.nodes.filter((item) => supplyNodeIds.includes(item.node_id as typeof supplyNodeIds[number])).map((item) => ({ id: item.node_id, label: item.label, x: supplyPositions[item.node_id]?.[0] ?? 0, y: supplyPositions[item.node_id]?.[1] ?? 0 })),
  edges: supplyFile.edges.filter((item) => supplyNodeIds.includes(item.from as typeof supplyNodeIds[number]) && supplyNodeIds.includes(item.to as typeof supplyNodeIds[number])).map((item, index) => ({ id: `supply-${index + 1}`, label: `${gridLabel(item.dependency)}; ${gridLabel(item.criticality)} criticality`, source: item.from, target: item.to, weight: null })),
} as const;
export const GRID_SUPPLY_TABLE = supplyFile.edges.filter((item) => supplyNodeIds.includes(item.from as typeof supplyNodeIds[number]) && supplyNodeIds.includes(item.to as typeof supplyNodeIds[number])).map((item) => ({ from: supplyFile.nodes.find((node) => node.node_id === item.from)?.label ?? item.from, to: supplyFile.nodes.find((node) => node.node_id === item.to)?.label ?? item.to, dependency: gridLabel(item.dependency), criticality: gridLabel(item.criticality), substitutability: gridLabel(item.substitutability), sourceStatus: item.source_ids.length ? item.source_ids.join('; ') : 'Research gap' }));

interface TransformerStage { stage_id: string; stage: string; inputs: readonly string[]; failure_modes: readonly string[] }
interface TransformerFile { product_classes: readonly { class_id: string; name: string; definition_used_by_source: string; applications: readonly string[] }[]; supply_chain_stages: readonly TransformerStage[]; dashboard_metrics: readonly { metric_id: string; unit: string; status: string; warning?: string }[] }
const transformerFile = readJson<TransformerFile>('supply-chain/transformers.json');
export const GRID_TRANSFORMER_STAGES = transformerFile.supply_chain_stages.map((item, index) => ({ order: index + 1, id: item.stage_id, stage: gridLabel(item.stage), inputs: item.inputs.join('; '), failureModes: item.failure_modes.join('; ') }));
export const GRID_TRANSFORMER_GAPS = transformerFile.dashboard_metrics.map((item) => ({ metric: gridLabel(item.metric_id), unit: item.unit, status: gridLabel(item.status), warning: item.warning ?? 'Public nationally comparable data are unavailable or fragmented.' }));

const loadSummaryRows = readTransmissionCsv('load-shape/timeseries/normalized/load-shape-summary-2024.csv');
export const GRID_REGION_SUMMARIES = loadSummaryRows.filter((row) => row.geography_type === 'balancing_authority' && selectedBalancingAuthorities.includes((row.geography_code ?? '') as typeof selectedBalancingAuthorities[number])).map((row) => ({ id: row.geography_code ?? '', label: `${row.geography_code} · ${row.parent_geography}`, region: row.parent_geography ?? '', meanMw: numberField(row, 'mean_demand_mw'), peakMw: numberField(row, 'peak_demand_mw'), peakTime: row.peak_time_end ?? '', loadFactor: numberField(row, 'load_factor_mean_divided_by_peak'), observationCount: numberField(row, 'observation_count'), clockBasis: row.clock_basis ?? '' }));
export const GRID_WORKBENCH = {
  regions: GRID_REGION_SUMMARIES,
  daily: GRID_DAILY_RECORDS,
  corridorStatuses: [...new Set(GRID_CORRIDOR_LINES.map((item) => item.status))].map((status) => ({ id: status, label: gridLabel(status), corridors: GRID_CORRIDOR_LINES.filter((item) => item.status === status).map((item) => item.name) })),
  capacityTypes: GRID_CAPACITY_DEFINITIONS,
  processStages: GRID_PROCESS_NODES,
} as const;

export const GRID_CONTEXT = {
  hifldFeatureCount: readJson<{ feature_count: number }>('corridors/base-layer-acquisition.json').feature_count,
  corridorCount: GRID_CORRIDOR_LINES.length,
  corridorLimits: corridorCatalog.limitations,
  prohibitedCapacityTransforms: capacityFile.prohibited_transforms,
  processDurationRule: processFile.graph_semantics.duration_rule,
  processParallelismRule: processFile.graph_semantics.parallelism_rule,
} as const;
