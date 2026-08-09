import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CANONICAL_REGISTRIES } from '../registry/store';
import type { ChartRecord, SourceRecord } from '../registry/types';
import type { ChartType } from '../registry/values';
import { parseCsv, type CsvRow } from './csv';
import type { EnergyBar, EnergyDotRange, EnergyLineSeries } from './energy';

const CLIMATE_ROOT = resolve(process.cwd(), 'research', 'climate');

function readClimateCsv(path: string): readonly CsvRow[] {
  return parseCsv(readFileSync(resolve(CLIMATE_ROOT, path), 'utf8'));
}

function readClimateJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(CLIMATE_ROOT, path), 'utf8')) as T;
}

function numberField(row: CsvRow, field: string): number {
  const raw = row[field];
  if (raw === undefined || raw === '') throw new Error(`Climate adapter requires ${field}.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Climate adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

function nullableNumberField(row: CsvRow, field: string): number | null {
  const raw = row[field];
  if (raw === undefined || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Climate adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

function humanize(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/gu, (character) => character.toUpperCase());
}

export function climateSource(identity: string): SourceRecord {
  const source = CANONICAL_REGISTRIES.source?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!source) throw new Error(`Canonical source ${identity} is missing.`);
  return source;
}

export function approvedClimateChart(identity: string, chartType: ChartType): ChartRecord {
  const chart = CANONICAL_REGISTRIES.chart?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!chart) throw new Error(`Canonical climate chart ${identity} is missing.`);
  const constrainedFreshwaterOverride = identity === 'freshwater-risk' && chart.chartType === 'map' && chartType === 'flow';
  if (chart.chartType !== 'none' && chart.chartType !== chartType && !constrainedFreshwaterOverride) {
    throw new Error(`${identity} is registered as ${chart.chartType}, not ${chartType}.`);
  }
  return chart.chartType === chartType ? chart : { ...chart, chartType };
}

export const CLIMATE_SOURCES = {
  synthesis: climateSource('IPCC-AR6-SYR-SPM'),
  physical: climateSource('IPCC-AR6-WGI-SPM'),
  attribution: climateSource('IPCC-AR6-WGI-FAQ31'),
  extremes: climateSource('IPCC-AR6-WGI-CH11'),
  impacts: climateSource('IPCC-AR6-WGII-SPM'),
  impactSummary: climateSource('IPCC-AR6-WGII-TS'),
  biodiversity: climateSource('IPCC-AR6-WGII-CH2'),
  freshwater: climateSource('IPCC-AR6-WGII-CH4'),
  food: climateSource('IPCC-AR6-WGII-CH5'),
  displacement: climateSource('IPCC-AR6-WGII-CH7'),
  aggi: climateSource('NOAA-AGGI-2025'),
  co2: climateSource('NOAA-CO2-GLOBAL'),
  nasaTemperature: climateSource('NASA-GISTEMP-V4'),
  noaaTemperature: climateSource('NOAA-GLOBALTEMP-V61'),
  carbonBudget: climateSource('GCB-2025-DATA'),
  cyclones: climateSource('KNUTSON-ET-AL-2020'),
  cycloneSynthesis: climateSource('NOAA-GFDL-HURRICANES'),
  ipbes: climateSource('IPBES-GLOBAL-2019'),
  cropAttribution: climateSource('ORTIZ-BOBEA-ET-AL-2021'),
  cropSensitivity: climateSource('ZHAO-ET-AL-2017'),
  waterStatus: climateSource('WMO-WATER-2024'),
  waterDevelopment: climateSource('UNESCO-WWDR-2024'),
  worldBankMobility: climateSource('WORLD-BANK-GROUNDSWELL-II'),
  unhcr: climateSource('UNHCR-MYTHS-FACTS'),
} as const;

interface CausalChainFile {
  chain: readonly { order: number; node: string; evidence: string; sources: readonly string[] }[];
  counterfactual_attribution: {
    period: string;
    observed_warming_c: { best_estimate: number; likely_low: number; likely_high: number };
    total_human_caused_warming_c: { best_estimate: number; likely_low: number; likely_high: number };
    well_mixed_ghg_warming_c: { likely_low: number; likely_high: number };
    other_human_drivers_principally_aerosols_cooling_c: { likely_low: number; likely_high: number };
    natural_drivers_change_c: { likely_low: number; likely_high: number };
    internal_variability_change_c: { likely_low: number; likely_high: number };
  };
}

const causalFile = readClimateJson<CausalChainFile>('attribution/causal-chain.json');
const causalLabels = ['Human activity', 'Emissions', 'Atmospheric concentration', 'Radiative forcing', 'Energy imbalance', 'Warming', 'Impacts'] as const;
const causalPositions = [[0.02, 0.22], [0.28, 0.22], [0.55, 0.22], [0.82, 0.22], [0.82, 0.76], [0.48, 0.76], [0.10, 0.76]] as const;
export const CLIMATE_CAUSAL_CHAIN = {
  nodes: causalLabels.map((label, index) => ({ id: `cause-${index}`, label, x: causalPositions[index]?.[0] ?? 0, y: causalPositions[index]?.[1] ?? 0 })),
  edges: causalLabels.slice(1).map((_, index) => ({
    id: `cause-edge-${index}`,
    label: index === 0 ? 'Human systems release heat-trapping gases' : causalFile.chain[Math.min(index, causalFile.chain.length - 1)]?.evidence ?? 'Assessed physical relationship',
    source: `cause-${index}`,
    target: `cause-${index + 1}`,
    weight: null,
  })),
  table: causalFile.chain.map((item) => ({
    order: item.order,
    step: humanize(item.node),
    evidence: item.evidence,
    sourceFamilies: item.sources.join('; '),
  })),
} as const;

const observedRows = readClimateCsv('timeseries/normalized/observed-ghg-temperature.csv');
interface ObservedPanel {
  id: string;
  label: string;
  unit: string;
  baseline: string;
  series: readonly EnergyLineSeries[];
}

function observedPanel(id: string, label: string, unit: string, baseline: string): ObservedPanel {
  return {
    id,
    label,
    unit,
    baseline,
    series: [{
      id,
      label,
      values: observedRows.map((row) => ({ x: numberField(row, 'year'), y: nullableNumberField(row, id) })),
    }],
  };
}

export const CLIMATE_OBSERVED_PANELS: readonly ObservedPanel[] = [
  observedPanel('co2_ppm', 'Atmospheric carbon dioxide', 'ppm', 'Absolute concentration; no anomaly baseline'),
  observedPanel('forcing_total_long_lived_ghg_w_m2', 'Long-lived greenhouse-gas forcing', 'W/m²', 'Relative to 1750'),
  observedPanel('nasa_gistemp_anomaly_c_1951_1980', 'NASA global temperature anomaly', '°C', '1951–1980 mean'),
  observedPanel('noaa_globaltemp_anomaly_c_1971_2000', 'NOAA global temperature anomaly', '°C', '1971–2000 mean'),
];

export const CLIMATE_OBSERVED_TABLE = CLIMATE_OBSERVED_PANELS.flatMap((panel) => {
  const present = panel.series[0]?.values.filter((point) => point.y !== null) ?? [];
  const first = present.at(0);
  const last = present.at(-1);
  return [{
    series: panel.label,
    firstYear: first?.x ?? null,
    lastYear: last?.x ?? null,
    latestValue: last?.y ?? null,
    unit: panel.unit,
    nativeBaseline: panel.baseline,
  }];
});
export const CAUSE_HEADLINE_METRICS = [
  { label: 'Latest atmospheric CO₂', value: CLIMATE_OBSERVED_TABLE.find((item) => item.series === 'Atmospheric carbon dioxide')?.latestValue ?? null, unit: 'ppm', period: CLIMATE_OBSERVED_TABLE.find((item) => item.series === 'Atmospheric carbon dioxide')?.lastYear ?? null, state: 'Observed' },
  { label: 'Latest long-lived GHG forcing', value: CLIMATE_OBSERVED_TABLE.find((item) => item.series === 'Long-lived greenhouse-gas forcing')?.latestValue ?? null, unit: 'W/m²', period: CLIMATE_OBSERVED_TABLE.find((item) => item.series === 'Long-lived greenhouse-gas forcing')?.lastYear ?? null, state: 'Observed' },
  { label: 'Human-caused warming', value: causalFile.counterfactual_attribution.total_human_caused_warming_c.best_estimate, unit: '°C', period: causalFile.counterfactual_attribution.period, state: 'Assessed attribution' },
] as const;

interface CorrelationFile {
  statistics: readonly {
    x: string;
    y: string;
    period: readonly [number, number];
    n_years: number;
    pearson_levels: number;
    spearman_levels: number;
    pearson_first_differences: number;
    pearson_trailing_10_year_means: number;
  }[];
  not_an_attribution_model: boolean;
}

const correlationFile = readClimateJson<CorrelationFile>('timeseries/normalized/observed-correlation-statistics.json');
const correlation = correlationFile.statistics[0];
if (!correlation) throw new Error('Climate correlation diagnostic is empty.');
export const CORRELATION_DIAGNOSTIC: readonly EnergyBar[] = [
  { id: 'pearson-levels', label: 'Pearson · levels', value: correlation.pearson_levels },
  { id: 'spearman-levels', label: 'Spearman · levels', value: correlation.spearman_levels },
  { id: 'first-differences', label: 'Pearson · annual changes', value: correlation.pearson_first_differences },
  { id: 'trailing-means', label: 'Pearson · 10-year means', value: correlation.pearson_trailing_10_year_means },
];
export const CORRELATION_TABLE = CORRELATION_DIAGNOSTIC.map((item) => ({
  statistic: item.label,
  coefficient: item.value,
  period: `${correlation.period[0]}–${correlation.period[1]}`,
  sampleYears: correlation.n_years,
  role: correlationFile.not_an_attribution_model ? 'Descriptive diagnostic; not attribution' : 'Not classified',
}));

const attribution = causalFile.counterfactual_attribution;
export const ATTRIBUTION_RANGES: readonly EnergyDotRange[] = [
  { id: 'observed', label: 'Observed warming', low: attribution.observed_warming_c.likely_low, value: attribution.observed_warming_c.best_estimate, high: attribution.observed_warming_c.likely_high },
  { id: 'human', label: 'Total human-caused', low: attribution.total_human_caused_warming_c.likely_low, value: attribution.total_human_caused_warming_c.best_estimate, high: attribution.total_human_caused_warming_c.likely_high },
  { id: 'ghg', label: 'Well-mixed GHG', low: attribution.well_mixed_ghg_warming_c.likely_low, value: null, high: attribution.well_mixed_ghg_warming_c.likely_high },
  { id: 'other-human', label: 'Other human drivers', low: -attribution.other_human_drivers_principally_aerosols_cooling_c.likely_high, value: null, high: attribution.other_human_drivers_principally_aerosols_cooling_c.likely_low === 0 ? 0 : -attribution.other_human_drivers_principally_aerosols_cooling_c.likely_low },
  { id: 'natural', label: 'Natural drivers', low: attribution.natural_drivers_change_c.likely_low, value: null, high: attribution.natural_drivers_change_c.likely_high },
  { id: 'variability', label: 'Internal variability', low: attribution.internal_variability_change_c.likely_low, value: null, high: attribution.internal_variability_change_c.likely_high },
];
export const ATTRIBUTION_PERIOD = attribution.period;

const cumulativeRows = readClimateCsv('timeseries/normalized/global-co2-emissions-and-cumulative-1850-2024.csv');
export const CUMULATIVE_CO2_SERIES: readonly EnergyLineSeries[] = [{
  id: 'cumulative-co2',
  label: 'Cumulative anthropogenic CO₂ sources since 1850',
  values: cumulativeRows.map((row) => ({ x: numberField(row, 'year'), y: numberField(row, 'cumulative_anthropogenic_co2_sources_since_1850_gtco2') })),
}];
export const CUMULATIVE_CO2_TABLE = cumulativeRows
  .filter((row) => [1850, 1900, 1950, 2000, 2024].includes(numberField(row, 'year')))
  .map((row) => ({
    year: numberField(row, 'year'),
    annualSources: numberField(row, 'anthropogenic_co2_sources_gtco2'),
    cumulativeSources: numberField(row, 'cumulative_anthropogenic_co2_sources_since_1850_gtco2'),
  }));

interface RelationshipFile {
  relationships: readonly {
    relationship_id: string;
    coefficient?: {
      warming_c_per_1000_gtco2_best: number;
      warming_c_per_1000_gtco2_likely_low: number;
      warming_c_per_1000_gtco2_likely_high: number;
    };
  }[];
}
const relationshipFile = readClimateJson<RelationshipFile>('attribution/ghg-temperature-relationship.json');
const tcre = relationshipFile.relationships.find((item) => item.relationship_id === 'cumulative-co2-to-warming')?.coefficient;
if (!tcre) throw new Error('The registered TCRE relationship is unavailable.');
export const TCRE_RANGE: readonly EnergyDotRange[] = [{
  id: 'tcre',
  label: 'TCRE assessed response',
  low: tcre.warming_c_per_1000_gtco2_likely_low,
  value: tcre.warming_c_per_1000_gtco2_best,
  high: tcre.warming_c_per_1000_gtco2_likely_high,
}];

const warmingRows = readClimateCsv('timeseries/scenario-warming.csv');
export const WARMING_PERIODS = ['2021-2040', '2041-2060', '2081-2100'] as const;
export const WARMING_SCENARIO_RANGES: Readonly<Record<string, readonly EnergyDotRange[]>> = Object.fromEntries(WARMING_PERIODS.map((period) => [
  period,
  warmingRows.filter((row) => row.period === period).map((row) => ({
    id: row.scenario ?? '',
    label: row.scenario ?? '',
    low: numberField(row, 'very_likely_low_c'),
    value: numberField(row, 'best_estimate_c_above_1850_1900'),
    high: numberField(row, 'very_likely_high_c'),
  })),
]));
export const WARMING_SCENARIO_TABLE = warmingRows.map((row) => ({
  scenario: row.scenario ?? '',
  period: row.period ?? '',
  bestEstimate: numberField(row, 'best_estimate_c_above_1850_1900'),
  veryLikelyLow: numberField(row, 'very_likely_low_c'),
  veryLikelyHigh: numberField(row, 'very_likely_high_c'),
  baseline: '1850–1900',
}));

export const CAUSE_WORKBENCH_RECORDS = CLIMATE_OBSERVED_PANELS.flatMap((panel) => {
  const latest = panel.series[0]?.values.filter((point) => point.y !== null).at(-1);
  return warmingRows.map((row) => ({
    series: panel.id,
    seriesLabel: panel.label,
    observedValue: latest?.y ?? null,
    observedYear: latest?.x ?? null,
    observedUnit: panel.unit,
    nativeBaseline: panel.baseline,
    scenario: row.scenario ?? '',
    period: row.period ?? '',
    warmingBest: numberField(row, 'best_estimate_c_above_1850_1900'),
    warmingLow: numberField(row, 'very_likely_low_c'),
    warmingHigh: numberField(row, 'very_likely_high_c'),
    warmingBaseline: '1850–1900',
  }));
});

interface RiskLadderFile {
  levels: readonly { warming_c: number; metrics: Readonly<Record<string, number | string | readonly number[]>> }[];
}
const riskLadderFile = readClimateJson<RiskLadderFile>('impacts/temperature-risk-ladder.json');
function ladderSeries(id: string, label: string, field: string): EnergyLineSeries {
  return {
    id,
    label,
    values: riskLadderFile.levels.map((level) => ({
      x: level.warming_c,
      y: typeof level.metrics[field] === 'number' ? level.metrics[field] as number : null,
    })),
  };
}
export const RISK_LADDER_PANELS = [
  { id: 'heat', label: '1-in-10-year hot extreme frequency', unit: 'multiplier', series: [ladderSeries('heat', 'Hot-extreme frequency', 'one_in_10_year_hot_extreme_frequency_multiplier')] },
  { id: 'precipitation', label: '1-in-10-year heavy precipitation intensity', unit: '%', series: [ladderSeries('precipitation', 'Heavy-precipitation intensity', 'one_in_10_year_heavy_precipitation_intensity_change_percent')] },
  { id: 'drought', label: 'Agricultural/ecological drought frequency in drying regions', unit: 'multiplier', series: [ladderSeries('drought', 'Drought frequency', 'agricultural_ecological_drought_frequency_multiplier_in_drying_regions')] },
] as const;

const impactRows = readClimateCsv('timeseries/impact-dose-response.csv');
export const RISK_LADDER_TABLE = impactRows.map((row) => ({
  risk: humanize(row.impact ?? ''),
  metric: humanize(row.metric ?? ''),
  warming: numberField(row, 'warming_c'),
  low: nullableNumberField(row, 'value_low'),
  central: nullableNumberField(row, 'value_central'),
  high: nullableNumberField(row, 'value_high'),
  unit: row.unit ?? '',
  confidence: row.confidence ?? '',
  geography: humanize(row.geography ?? ''),
}));

export const EXTREME_HEAT_PANELS = [
  { id: 'heat-frequency', label: '1-in-10-year hot extreme frequency', unit: 'multiplier', series: [ladderSeries('heat-frequency', 'Frequency', 'one_in_10_year_hot_extreme_frequency_multiplier')] },
  { id: 'heat-intensity', label: '1-in-10-year hot extreme intensity', unit: '°C', series: [ladderSeries('heat-intensity', 'Intensity', 'one_in_10_year_hot_extreme_intensity_change_c')] },
] as const;
export const EXTREME_HEAT_TABLE = riskLadderFile.levels.flatMap((level) => {
  const frequency = level.metrics.one_in_10_year_hot_extreme_frequency_multiplier;
  const intensity = level.metrics.one_in_10_year_hot_extreme_intensity_change_c;
  return typeof frequency === 'number' && typeof intensity === 'number' ? [{
    warming: level.warming_c,
    frequencyMultiplier: frequency,
    intensityChange: intensity,
    geography: 'Global land',
    confidence: 'Likely',
  }] : [];
});

interface HurricaneFile {
  headline: string;
  observed_assessment: Readonly<Record<string, { direction: string | null; confidence: string; reason?: string }>>;
  projected_response_at_2c_anthropogenic_warming: readonly { metric: string; median_percent_change: number; assessed_range_percent?: readonly [number, number]; note?: string }[];
}
const hurricaneFile = readClimateJson<HurricaneFile>('impacts/hurricanes.json');
export const CYCLONE_PROJECTION_RANGES: readonly EnergyDotRange[] = hurricaneFile.projected_response_at_2c_anthropogenic_warming.map((item) => ({
  id: item.metric,
  label: humanize(item.metric),
  low: item.assessed_range_percent?.[0] ?? null,
  value: item.median_percent_change,
  high: item.assessed_range_percent?.[1] ?? null,
}));
export const CYCLONE_EVIDENCE_TABLE = [
  ...Object.entries(hurricaneFile.observed_assessment).map(([metric, assessment]) => ({
    evidenceClass: 'Observed assessment', metric: humanize(metric), result: assessment.direction ?? 'No robust direction', confidence: assessment.confidence, guardrail: assessment.reason ?? 'Assessment statement; not an event count per degree',
  })),
  ...hurricaneFile.projected_response_at_2c_anthropogenic_warming.map((item) => ({
    evidenceClass: 'Projected response at 2°C anthropogenic warming', metric: humanize(item.metric), result: `${item.median_percent_change}% median${item.assessed_range_percent ? ` (${item.assessed_range_percent[0]}–${item.assessed_range_percent[1]}%)` : ''}`, confidence: 'Assessed synthesis', guardrail: item.note ?? 'Conditional modeled response; not a storm-count forecast',
  })),
];

interface BiodiversityFile {
  terrestrial_species_very_high_extinction_risk: readonly { warming_c: number; percent_range: readonly [number, number]; median_percent: number }[];
  driver_context: { global_direct_drivers_in_descending_impact_order: readonly string[] };
}
const biodiversityFile = readClimateJson<BiodiversityFile>('impacts/biodiversity.json');
export const BIODIVERSITY_RANGES: readonly EnergyDotRange[] = biodiversityFile.terrestrial_species_very_high_extinction_risk.map((item) => ({
  id: `${item.warming_c}c`, label: `${item.warming_c}°C warming`, low: item.percent_range[0], value: item.median_percent, high: item.percent_range[1],
}));
export const BIODIVERSITY_TABLE = biodiversityFile.terrestrial_species_very_high_extinction_risk.map((item) => ({
  warming: item.warming_c, low: item.percent_range[0], median: item.median_percent, high: item.percent_range[1], evidenceClass: 'Modeled very-high-risk category; not observed extinctions',
}));
export const BIODIVERSITY_DRIVERS = biodiversityFile.driver_context.global_direct_drivers_in_descending_impact_order.map(humanize);

interface FoodFile {
  historical_attribution: { estimated_slowdown_percent: number; equivalent_recent_productivity_growth_years_lost: number; study_interpretation: string };
  projected_yield_effects: {
    ipcc_no_adaptation_median_percent_per_decade_with_co2_fertilization: readonly { crop: string; percent_per_decade: number }[];
    multi_method_isolated_effect_percent_per_1c: { excludes: readonly string[]; values: readonly { crop: string; percent_per_c: number }[] };
  };
}
const foodFile = readClimateJson<FoodFile>('impacts/food-systems.json');
export const CROP_IPCC_BARS: readonly EnergyBar[] = foodFile.projected_yield_effects.ipcc_no_adaptation_median_percent_per_decade_with_co2_fertilization.map((item) => ({ id: item.crop, label: humanize(item.crop), value: item.percent_per_decade }));
export const CROP_ISOLATED_BARS: readonly EnergyBar[] = foodFile.projected_yield_effects.multi_method_isolated_effect_percent_per_1c.values.map((item) => ({ id: item.crop, label: humanize(item.crop), value: item.percent_per_c }));
export const CROP_TABLE = [
  ...CROP_IPCC_BARS.map((item) => ({ studyFrame: 'IPCC median; no adaptation; with CO₂ fertilization', crop: item.label, effect: item.value, unit: '% per decade' })),
  ...CROP_ISOLATED_BARS.map((item) => ({ studyFrame: 'Multi-method isolated temperature effect', crop: item.label, effect: item.value, unit: '% per 1°C' })),
];
export const CROP_PRODUCTIVITY_CONTEXT = foodFile.historical_attribution;

interface FreshwaterFile {
  current_context: readonly { metric: string; value: string; note?: string }[];
  projected_temperature_conditioned_metrics: readonly Readonly<Record<string, string | number | readonly number[]>>[];
}
const freshwaterFile = readClimateJson<FreshwaterFile>('impacts/freshwater.json');
export const FRESHWATER_FRAMEWORK = {
  nodes: [
    { id: 'hazard', label: 'Hazard', x: 0.03, y: 0.25 },
    { id: 'exposure', label: 'Exposure', x: 0.34, y: 0.25 },
    { id: 'vulnerability', label: 'Vulnerability', x: 0.66, y: 0.25 },
    { id: 'risk', label: 'Water-service risk', x: 0.84, y: 0.72 },
    { id: 'adaptation', label: 'Adaptation', x: 0.25, y: 0.72 },
  ],
  edges: [
    { id: 'hazard-exposure', label: 'Timing, quality, flood, drought, and runoff shifts', source: 'hazard', target: 'exposure', weight: null },
    { id: 'exposure-vulnerability', label: 'People, ecosystems, and assets depend on service', source: 'exposure', target: 'vulnerability', weight: null },
    { id: 'vulnerability-risk', label: 'Demand, infrastructure, governance, and inequality shape consequences', source: 'vulnerability', target: 'risk', weight: null },
    { id: 'adaptation-risk', label: 'Management and investment can reduce but not erase risk', source: 'adaptation', target: 'risk', weight: null },
  ],
} as const;
export const FRESHWATER_TABLE = [
  ...freshwaterFile.current_context.map((item) => ({ evidenceClass: 'Current context', metric: humanize(item.metric), warming: null, value: humanize(item.value), confidence: item.note ?? 'Climate and non-climate factors' })),
  ...freshwaterFile.projected_temperature_conditioned_metrics.map((item) => ({ evidenceClass: 'Temperature-conditioned assessment', metric: humanize(String(item.metric)), warming: typeof item.warming_c === 'number' ? item.warming_c : null, value: Object.entries(item).filter(([key]) => !['metric', 'warming_c', 'confidence'].includes(key)).map(([key, value]) => `${humanize(key)}: ${Array.isArray(value) ? value.join('–') : value}`).join('; '), confidence: humanize(String(item.confidence ?? 'not assessed')) })),
];

interface DisplacementFile {
  observed_context: { people_internally_displaced_annually_by_weather_related_extremes_since_2008: string; confidence: string; attribution_guardrail: string };
  scenario_based_projection: { year: number; upper_scenario_internal_climate_migrants_million: number; regions_million: readonly { region: string; value: number }[]; potential_reduction_percent: number; interpretation: string };
  temperature_response_coefficient: number | null;
}
const displacementFile = readClimateJson<DisplacementFile>('impacts/displacement.json');
export const DISPLACEMENT_OBSERVED = displacementFile.observed_context;
export const DISPLACEMENT_SCENARIO_BARS: readonly EnergyBar[] = displacementFile.scenario_based_projection.regions_million.map((item) => ({ id: item.region, label: item.region, value: item.value }));
export const DISPLACEMENT_TABLE = [
  { evidenceClass: 'Observed weather-related displacement flow', scope: 'Within countries; annually since 2008', value: displacementFile.observed_context.people_internally_displaced_annually_by_weather_related_extremes_since_2008.replaceAll('_', ' '), unit: 'people per year', interpretation: displacementFile.observed_context.attribution_guardrail },
  ...displacementFile.scenario_based_projection.regions_million.map((item) => ({ evidenceClass: 'World Bank upper scenario', scope: `${item.region}; ${displacementFile.scenario_based_projection.year}`, value: item.value, unit: 'million internal climate migrants', interpretation: displacementFile.scenario_based_projection.interpretation })),
  { evidenceClass: 'Unsupported universal coefficient', scope: 'Global per degree', value: displacementFile.temperature_response_coefficient, unit: 'unavailable', interpretation: 'Deliberate null; do not infer.' },
];

export const RISK_PRIORITY_MATRIX = [
  { priority: 'Protect life now', risk: 'Extreme heat', exposure: 'People, workers, buildings, and power systems', action: 'Heat-health plans, cooling access, labor protection, resilient power', evidence: 'High-confidence hazard response; local exposure still required' },
  { priority: 'Protect essential service', risk: 'Water extremes', exposure: 'Supply, drainage, treatment, ecosystems, and agriculture', action: 'Basin-specific reliability, demand, quality, and flood measures', evidence: 'Multivariate and place-specific' },
  { priority: 'Protect adaptive capacity', risk: 'Food and ecosystems', exposure: 'Crops, fisheries, habitats, and livelihoods', action: 'Diversification, habitat protection, monitoring, and targeted adaptation', evidence: 'Context-sensitive assessed relationships' },
  { priority: 'Prepare for movement', risk: 'Displacement', exposure: 'Origin and receiving communities', action: 'Risk reduction, voluntary mobility support, housing and service capacity', evidence: 'Observed flows plus conditional internal-migration scenarios' },
] as const;

const heatAt15 = riskLadderFile.levels.find((level) => level.warming_c === 1.5)?.metrics.one_in_10_year_hot_extreme_frequency_multiplier;
const biodiversityAt2 = biodiversityFile.terrestrial_species_very_high_extinction_risk.find((item) => item.warming_c === 2);
const waterAt2 = freshwaterFile.projected_temperature_conditioned_metrics.find((item) => item.metric === 'population_exposed_to_physical_water_scarcity' && item.warming_c === 2)?.population_billion;
export const RISK_HEADLINE_METRICS = [
  { label: '1-in-10-year hot extreme at 1.5°C', value: typeof heatAt15 === 'number' ? heatAt15 : null, unit: '× as frequent', scope: 'Global land · likely' },
  { label: 'Very-high extinction risk at 2°C', value: biodiversityAt2?.median_percent ?? null, unit: '% median', scope: `Modeled terrestrial species range: ${biodiversityAt2?.percent_range.join('–') ?? 'unavailable'}%` },
  { label: 'Weather-related internal displacement', value: displacementFile.observed_context.people_internally_displaced_annually_by_weather_related_extremes_since_2008.replace('>20_million', '>20'), unit: 'million/year', scope: 'Observed since 2008 · not solely attributable to warming' },
  { label: 'Physical water-scarcity exposure at 2°C', value: typeof waterAt2 === 'number' ? waterAt2 : null, unit: 'billion people', scope: 'Low confidence · scenario-conditioned' },
] as const;

export const RISK_WORKBENCH_RECORDS = impactRows.map((row) => ({
  family: row.impact ?? '',
  metric: row.metric ?? '',
  warming: numberField(row, 'warming_c'),
  low: nullableNumberField(row, 'value_low'),
  central: nullableNumberField(row, 'value_central'),
  high: nullableNumberField(row, 'value_high'),
  unit: row.unit ?? '',
  confidence: row.confidence ?? '',
  geography: row.geography ?? '',
  guardrail: row.interpretation_guardrail ?? '',
}));
