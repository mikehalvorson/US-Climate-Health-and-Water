import { CAUSE_HEADLINE_METRICS, CLIMATE_SOURCES, CUMULATIVE_CO2_TABLE } from './climate';
import { ENERGY_SOURCES, US_ELECTRICITY_USE_2025 } from './energy';
import { PLASTIC_SOURCES, WATER_SOURCES } from './foodWater';
import { CANONICAL_REGISTRIES } from '../registry/store';
import type { ChartRecord, MetricRecord, SourceRecord } from '../registry/types';
import type { ChartType, EvidenceState } from '../registry/values';

export interface OverviewScorecardItem {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  geography: string;
  period: string;
  evidenceState: EvidenceState;
  source: SourceRecord;
  ownerPath: string;
  ownerLabel: string;
  boundary: string;
}

function metric(id: string): MetricRecord {
  const record = CANONICAL_REGISTRIES.metric?.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Overview owner metric ${id} is missing.`);
  return record;
}

function metricItem(id: string, label: string, source: SourceRecord, ownerPath: string, ownerLabel: string): OverviewScorecardItem {
  const record = metric(id);
  return {
    id: record.id,
    label,
    value: record.value,
    unit: record.unit,
    geography: record.geography,
    period: record.period,
    evidenceState: record.evidenceState,
    source,
    ownerPath,
    ownerLabel,
    boundary: record.accountingBoundary,
  };
}

export function overviewChart(identity: string, expectedType: ChartType): ChartRecord {
  const chart = CANONICAL_REGISTRIES.chart?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!chart) throw new Error(`Overview chart ${identity} is missing.`);
  if (chart.chartType !== expectedType) throw new Error(`${identity} is registered as ${chart.chartType}, not ${expectedType}.`);
  return chart;
}

const electricityUse = US_ELECTRICITY_USE_2025.find((row) => row.source === 'Electricity Use');
const cumulative = CUMULATIVE_CO2_TABLE.at(-1);
const warming = CAUSE_HEADLINE_METRICS.find((item) => item.label === 'Human-caused warming');

export const OVERVIEW_SCORECARD: readonly OverviewScorecardItem[] = [
  {
    id: 'overview-electricity-use-2025',
    label: 'U.S. electricity use',
    value: electricityUse?.value ?? null,
    unit: electricityUse?.unit ?? 'TWh',
    geography: 'United States',
    period: '2025',
    evidenceState: 'preliminary',
    source: ENERGY_SOURCES.demandHistory,
    ownerPath: '/energy/demand',
    ownerLabel: 'Demand & Electrification',
    boundary: 'Sales to ultimate customers plus direct use; EIA MER Table 7.6.',
  },
  {
    ...metricItem('MET-000067', 'U.S. generation mix · natural gas', ENERGY_SOURCES.usGeneration, '/energy/generation', 'Generation Choices'),
    boundary: 'Natural gas is shown as the largest 2025 generation component; the owning chapter publishes the complete source mix and total.',
  },
  {
    id: 'overview-cumulative-co2-2024',
    label: 'Cumulative anthropogenic CO₂ sources since 1850',
    value: cumulative?.cumulativeSources ?? null,
    unit: 'GtCO₂',
    geography: 'World',
    period: String(cumulative?.year ?? 'Unavailable'),
    evidenceState: 'reported_estimate',
    source: CLIMATE_SOURCES.carbonBudget,
    ownerPath: '/climate/cause',
    ownerLabel: 'Cause & Cumulative Emissions',
    boundary: 'Cumulative anthropogenic CO₂ sources beginning in 1850; source-native global carbon-budget accounting.',
  },
  {
    id: 'overview-human-warming',
    label: 'Assessed human-caused warming',
    value: warming?.value ?? null,
    unit: '°C',
    geography: 'World',
    period: String(warming?.period ?? 'Unavailable'),
    evidenceState: 'reported_estimate',
    source: CLIMATE_SOURCES.physical,
    ownerPath: '/climate/cause',
    ownerLabel: 'Cause & Cumulative Emissions',
    boundary: 'Best estimate for the assessed attribution period relative to 1850–1900.',
  },
  metricItem('MET-000092', 'U.S. water withdrawals', WATER_SOURCES.inventory, '/food-water/freshwater', 'Freshwater Security'),
  metricItem('MET-000114', 'U.S. plastics domestic consumption', PLASTIC_SOURCES.materialFlow, '/food-water/plastics', 'Plastics & Material Substitution'),
] as const;

export const OVERVIEW_SOURCES = [
  ENERGY_SOURCES.demandHistory,
  ENERGY_SOURCES.usGeneration,
  CLIMATE_SOURCES.carbonBudget,
  CLIMATE_SOURCES.physical,
  WATER_SOURCES.inventory,
  PLASTIC_SOURCES.materialFlow,
] as const;
