import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { EnergyDotRange, EnergyLineSeries } from './energy';
import { parseCsv, type CsvRow } from './csv';
import { approvedClimateChart, climateSource } from './climate';

const COAST_ROOT = resolve(process.cwd(), 'research', 'climate', 'coastal-cities');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(COAST_ROOT, path), 'utf8')) as T;
}

function readCsv(path: string): readonly CsvRow[] {
  return parseCsv(readFileSync(resolve(COAST_ROOT, path), 'utf8'));
}

function numberField(row: CsvRow, field: string): number {
  const raw = row[field];
  if (raw === undefined || raw === '') throw new Error(`Coastal adapter requires ${field}.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Coastal adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

export const approvedCoastChart = approvedClimateChart;
export const COAST_SOURCES = {
  observed: climateSource('NOAA-COOPS-DPAPI'),
  scenarios: climateSource('NOAA-SLR-ITF-2022'),
  exposure: climateSource('NATURE-OHENHEN-2024'),
  migration: climateSource('NATURE-HAUER-2017'),
  receiving: climateSource('URBAN-GULF-MIGRATION-2023'),
  miamiPlanning: climateSource('MIAMI-DADE-LMS-2025'),
  nationalAssessment: climateSource('NCA5-COASTS'),
} as const;

const trendRows = readCsv('timeseries/observed-relative-sea-level-trends.csv');
export const COAST_TREND_RANGES: readonly EnergyDotRange[] = trendRows.map((row) => {
  const value = numberField(row, 'trend_mm_per_year');
  const error = numberField(row, 'trend_error_mm_per_year');
  return { id: row.location_id ?? '', label: row.station_name ?? '', low: value - error, value, high: value + error };
});
export const COAST_TREND_TABLE = trendRows.map((row) => ({ station: row.station_name ?? '', stationId: row.station_id ?? '', record: `${row.start_date}–${row.end_date}`, trend: numberField(row, 'trend_mm_per_year'), uncertainty: numberField(row, 'trend_error_mm_per_year'), unit: 'mm/year', interpretation: row.interpretation ?? '', geographicGuardrail: row.geographic_guardrail ?? '' }));

const scenarioRows = readCsv('timeseries/noaa-relative-sea-level-scenarios.csv');
const scenarioOrder = ['Low', 'Intermediate-Low', 'Intermediate', 'Intermediate-High', 'High'] as const;
const virginiaKeyRows = scenarioRows.filter((row) => row.location_id === 'virginia_key');
export const COAST_SCENARIO_SERIES: readonly EnergyLineSeries[] = scenarioOrder.map((scenario) => ({
  id: scenario.toLowerCase().replaceAll('-', '_'),
  label: scenario,
  values: virginiaKeyRows.filter((row) => row.scenario === scenario).map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'change_from_2020_m') })),
}));
export const COAST_SCENARIO_TABLE = virginiaKeyRows.map((row) => ({ location: row.display_name ?? '', scenario: row.scenario ?? '', year: numberField(row, 'year'), changeFrom2020: numberField(row, 'change_from_2020_m'), unit: 'm', baseline: 'Change since 2020', landMotionContribution: numberField(row, 'vlm_contribution_cm_per_year'), guardrail: row.geographic_guardrail ?? '' }));

const floodRows = readCsv('timeseries/noaa-high-tide-flood-days.csv').filter((row) => row.severity === 'minor' && ['Intermediate', 'High'].includes(row.scenario ?? ''));
export const COAST_FLOOD_SERIES: readonly EnergyLineSeries[] = ['virginia_key', 'grand_isle'].flatMap((location) => ['Intermediate', 'High'].map((scenario) => {
  const rows = floodRows.filter((row) => row.location_id === location && row.scenario === scenario);
  return { id: `${location}-${scenario}`, label: `${rows[0]?.station_name ?? location} · ${scenario}`, values: rows.map((row) => ({ x: numberField(row, 'decade'), y: numberField(row, 'days_per_year') })) };
}));
export const COAST_FLOOD_TABLE = floodRows.map((row) => ({ station: row.station_name ?? '', stationId: row.station_id ?? '', threshold: `${row.severity} · ${row.severity_definition}`, decade: numberField(row, 'decade'), scenario: row.scenario ?? '', daysPerYear: numberField(row, 'days_per_year'), guardrail: row.geographic_guardrail ?? '' }));

interface CityProfile {
  city_id: string;
  display_name: string;
  geographic_guardrail: string;
  risk_pathways: readonly { hazard: string; mechanism: string; consequences: readonly string[] }[];
  habitability_sequence: readonly string[];
  headline: string;
  time_anchors: readonly Readonly<Record<string, unknown>>[];
}
interface CityProfileFile { cities: readonly CityProfile[] }
const cityProfiles = readJson<CityProfileFile>('city-risk-profiles.json');
export const COAST_HABITABILITY_NETWORK = {
  nodes: [
    { id: 'water', label: 'Relative water level', x: 0.02, y: 0.5 },
    { id: 'flood', label: 'Threshold flooding', x: 0.21, y: 0.3 },
    { id: 'ground', label: 'Drainage & groundwater', x: 0.21, y: 0.72 },
    { id: 'service', label: 'Access & service failure', x: 0.48, y: 0.5 },
    { id: 'cost', label: 'Housing, insurance & finance', x: 0.73, y: 0.5 },
    { id: 'move', label: 'Displacement or adaptation', x: 0.98, y: 0.5 },
  ],
  edges: [
    { id: 'water-flood', label: 'Higher tidal and surge baseline', source: 'water', target: 'flood', weight: null },
    { id: 'water-ground', label: 'Reduced drainage head and higher water table', source: 'water', target: 'ground', weight: null },
    { id: 'flood-service', label: 'Road, building, utility, and emergency disruption', source: 'flood', target: 'service', weight: null },
    { id: 'ground-service', label: 'Outfall, septic, aquifer, and infrastructure pathways', source: 'ground', target: 'service', weight: null },
    { id: 'service-cost', label: 'Repair, reliability, premium, credit, and public cost', source: 'service', target: 'cost', weight: null },
    { id: 'cost-move', label: 'Unequal ability to remain, adapt, or relocate', source: 'cost', target: 'move', weight: null },
  ],
} as const;
export const COAST_HABITABILITY_TABLE = cityProfiles.cities.flatMap((city) => city.risk_pathways.map((item) => ({ city: city.display_name, hazard: item.hazard.replaceAll('_', ' '), mechanism: item.mechanism, consequences: item.consequences.join('; '), guardrail: city.geographic_guardrail })));

export const COAST_EXPOSURE_RANGES = [
  { metric: 'Additional exposed area across 32 study domains', low: 1334, high: 1813, unit: 'km²', context: 'SSP2-4.5, 2050, vertical land motion included' },
  { metric: 'Additional exposed people across 32 study domains', low: 176000, high: 518000, unit: 'people', context: '2010 population baseline; exposure, not displacement' },
  { metric: 'Additional exposed properties across 32 study domains', low: 94000, high: 288000, unit: 'properties', context: 'Static connected-inundation study domains; defenses absent' },
] as const;

const migrationRows = readCsv('timeseries/hauer-2100-cbsa-net-migration.csv');
const noAdaptationMigration = migrationRows.filter((row) => row.adaptation_variant === 'no_adaptation');
export const COAST_MIGRATION_RANGES: readonly EnergyDotRange[] = noAdaptationMigration.map((row) => ({ id: row.cbsa?.toLowerCase().replaceAll(/[^a-z0-9]+/gu, '-') ?? '', label: row.cbsa ?? '', low: numberField(row, 'interval_low'), value: numberField(row, 'net_migration_estimate'), high: numberField(row, 'interval_high') }));
export const COAST_MIGRATION_TABLE = migrationRows.map((row) => ({ cbsa: row.cbsa ?? '', adaptation: row.adaptation_variant?.replaceAll('_', ' ') ?? '', estimate: numberField(row, 'net_migration_estimate'), intervalLow: numberField(row, 'interval_low'), intervalHigh: numberField(row, 'interval_high'), horizon: numberField(row, 'horizon'), seaLevelRise: numberField(row, 'sea_level_rise_m'), interpretation: row.interpretation ?? '' }));

interface ReceivingFile {
  capacity_domains: readonly { domain_id: string; failure_modes: readonly string[]; minimum_indicators: readonly string[]; capacity_denominators: readonly string[]; equity_slices?: readonly string[] }[];
  evidence_summary: { headline: string; guardrail: string };
  planning_actions: readonly string[];
}
const receivingFile = readJson<ReceivingFile>('receiving-city-strain.json');
export const COAST_RECEIVING_DOMAINS = receivingFile.capacity_domains.map((item) => ({ id: item.domain_id, label: item.domain_id.replaceAll('_', ' '), failureModes: item.failure_modes.join('; '), indicators: item.minimum_indicators.join('; '), denominators: item.capacity_denominators.join('; '), equitySlices: item.equity_slices?.join('; ') ?? 'Domain-specific distribution required', status: 'Capacity denominator required' }));
export const COAST_RECEIVING_CONTEXT = { ...receivingFile.evidence_summary, planningActions: receivingFile.planning_actions } as const;

interface PathwayFile {
  principle: string;
  timeline_rule: string;
  pathways: readonly { pathway_id: string; measures: readonly string[]; best_for: readonly string[]; limitations: readonly string[] }[];
  city_strategies: readonly { city_id: string; current_foundation: readonly string[]; decision_triggers_to_track: readonly string[] }[];
}
const pathwayFile = readJson<PathwayFile>('adaptation-pathways.json');
const pathwayTiming: Readonly<Record<string, readonly [string, string]>> = {
  protect: ['Long lead', 'High capital and maintenance commitment'],
  accommodate: ['Near to medium term', 'Building and service thresholds remain'],
  restore_and_buffer: ['Begin early', 'Ecological space, sediment, and maintenance'],
  avoid: ['Immediate for new exposure', 'Land-use decisions can lock in risk'],
  relocate: ['Plan early; use when triggered', 'Voluntary, funded, community-protective process'],
};
export const COAST_ADAPTATION_PATHWAYS = pathwayFile.pathways.map((item) => ({ id: item.pathway_id, label: item.pathway_id.replaceAll('_', ' '), measures: item.measures.join('; '), bestFor: item.best_for.join('; '), limitations: item.limitations.join('; '), leadTime: pathwayTiming[item.pathway_id]?.[0] ?? 'Site-specific', commitment: pathwayTiming[item.pathway_id]?.[1] ?? 'Review required' }));
export const COAST_ADAPTATION_CONTEXT = { principle: pathwayFile.principle, timelineRule: pathwayFile.timeline_rule } as const;

const trendsById = new Map(COAST_TREND_TABLE.map((item, index) => [trendRows[index]?.location_id ?? '', item]));
const cityBindings = [
  { id: 'miami', label: 'Miami / Miami-Dade', gaugeId: 'virginia_key', gauge: 'Virginia Key', stationId: '8723214', scenarioLocation: 'virginia_key', scenarioLabel: 'Virginia Key tide gauge', floodContext: 'Virginia Key tide gauge', planningContext: 'Miami-Dade planning ranges use a Key West 2000 reference and cannot be silently spliced to NOAA change-since-2020 values.', guardrail: cityProfiles.cities.find((item) => item.city_id === 'miami')?.geographic_guardrail ?? '' },
  { id: 'new_orleans', label: 'New Orleans', gaugeId: 'new_canal_station', gauge: 'New Canal Station', stationId: '8761927', scenarioLocation: 'grid_30n_90w', scenarioLabel: '30°N / 90°W one-degree grid near New Orleans', floodContext: 'Grand Isle is coastal Louisiana context, not New Orleans', planningContext: 'The NOAA grid is a scenario point; New Canal is the observed station; engineered defenses and drainage remain essential context.', guardrail: cityProfiles.cities.find((item) => item.city_id === 'new_orleans')?.geographic_guardrail ?? '' },
] as const;
export const COAST_WORKBENCH = {
  cities: cityBindings.map((city) => ({ ...city, gaugeTrend: trendsById.get(city.gaugeId)?.trend ?? null, gaugeUnit: 'mm/year', baseline: 'NOAA local scenario change since 2020' })),
  scenarios: scenarioOrder.map((scenario) => ({ id: scenario, label: scenario })),
  horizons: [2050, 2070, 2100].map((year) => ({ id: String(year), label: String(year) })),
  records: cityBindings.flatMap((city) => scenarioRows.filter((row) => row.location_id === city.scenarioLocation && [2050, 2070, 2100].includes(Number(row.year))).map((row) => ({ city: city.id, scenario: row.scenario ?? '', horizon: numberField(row, 'year'), changeFrom2020M: numberField(row, 'change_from_2020_m'), location: row.display_name ?? '', locationType: row.location_type ?? '', sourceId: row.source_id ?? '' }))),
} as const;
