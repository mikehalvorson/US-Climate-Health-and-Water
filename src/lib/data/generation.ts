import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CANONICAL_REGISTRIES } from '../registry/store';
import type { ChartRecord } from '../registry/types';
import type { ChartType } from '../registry/values';
import { parseCsv, type CsvRow } from './csv';
import type { EnergyBar, EnergyDotRange } from './energy';
import { sourceByIdentity } from './energy';

const ENERGY_ROOT = resolve(process.cwd(), 'research', 'energy');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ENERGY_ROOT, path), 'utf8')) as T;
}

function readCsv(path: string): readonly CsvRow[] {
  return parseCsv(readFileSync(resolve(ENERGY_ROOT, path), 'utf8'));
}

function numberField(row: CsvRow, field: string): number {
  const raw = row[field];
  if (raw === undefined || raw === '') throw new Error(`Generation adapter requires ${field}.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Generation adapter received a non-finite ${field}: ${raw}.`);
  return value;
}

export function generationLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/gu, (character) => character.toUpperCase());
}

export function approvedGenerationChart(identity: string, chartType: ChartType): ChartRecord {
  const chart = CANONICAL_REGISTRIES.chart?.find((candidate) => candidate.id === identity || candidate.legacyIds?.includes(identity));
  if (!chart) throw new Error(`Canonical generation chart ${identity} is missing.`);
  if (chart.chartType !== 'none' && chart.chartType !== chartType) throw new Error(`${identity} is registered as ${chart.chartType}, not ${chartType}.`);
  return chart.chartType === chartType ? chart : { ...chart, chartType };
}

export const GENERATION_SOURCES = {
  capacity: sourceByIdentity('SRC-IRENASTAT-CAP26'),
  lifecycle: sourceByIdentity('SRC-IPCC-AR5-LCA'),
  health: sourceByIdentity('SRC-EPA-POWER-HEALTH'),
  nuclearRegulator: sourceByIdentity('SRC-NRC-OPERATING26'),
  nuclearStatistics: sourceByIdentity('SRC-EIA-NUCLEAR-US26'),
  nuclearWorkers: sourceByIdentity('SRC-NRC-OCC-DOSE24'),
  nuclearWaste: sourceByIdentity('SRC-GAO-SPENT-FUEL'),
  thermoelectricWater: sourceByIdentity('SRC-USGS-THERMO-WATER'),
} as const;

interface TechnologyRecord {
  technology_id: string;
  system_role: readonly string[];
  deployment_status: string;
  technical: { strengths?: readonly string[]; problems?: readonly string[] };
  health: Readonly<Record<string, string | readonly string[]>>;
  regulatory: readonly string[];
  sustainability: readonly string[];
  mitigation_options: readonly string[];
  residual_risks: readonly string[];
}
interface TechnologyFile { technologies: readonly TechnologyRecord[] }
const technologyFile = readJson<TechnologyFile>('impacts/technology-impact-matrix.json');
const technologyLabels: Readonly<Record<string, string>> = {
  coal_power: 'Coal', natural_gas_power: 'Natural gas', petroleum_liquid_power: 'Petroleum',
  nuclear_fission_power: 'Nuclear', solar_photovoltaic: 'Solar PV', concentrating_solar_power: 'Concentrating solar',
  onshore_wind: 'Onshore wind', offshore_wind: 'Offshore wind', hydropower: 'Hydropower', geothermal_power: 'Geothermal',
  biomass_and_biogas_power: 'Biomass & biogas', municipal_and_industrial_waste_to_energy: 'Waste to energy',
  marine_and_hydrokinetic_power: 'Marine energy', fossil_power_with_ccs: 'Fossil with CCS',
  hydrogen_and_fuel_cell_power: 'Hydrogen power', electricity_storage_context: 'Electricity storage',
};

function technologyLabel(id: string): string {
  return technologyLabels[id] ?? generationLabel(id);
}

function flattenHealth(health: TechnologyRecord['health']): string[] {
  return Object.values(health).flatMap((value) => typeof value === 'string' ? [value] : value);
}

const roleTechnologyIds = ['coal_power', 'natural_gas_power', 'nuclear_fission_power', 'solar_photovoltaic', 'onshore_wind', 'hydropower', 'geothermal_power', 'biomass_and_biogas_power', 'electricity_storage_context'] as const;
export const GENERATION_ROLE_ROWS = roleTechnologyIds.map(technologyLabel);
export const GENERATION_ROLE_COLUMNS = ['Energy', 'Firm capacity', 'Ramping & balancing', 'Grid services', 'Stored fuel or duration'] as const;
function roleValue(record: TechnologyRecord, column: typeof GENERATION_ROLE_COLUMNS[number]): number | null {
  const role = record.system_role.join(' ').toLowerCase();
  if (column === 'Energy') return role.includes('energy') ? 3 : role.includes('time shifting') ? 1 : null;
  if (column === 'Firm capacity') return role.includes('capacity') && !role.includes('depending') ? 3 : role.includes('capacity') ? 2 : null;
  if (column === 'Ramping & balancing') return /ramp|balanc|frequency|reserve|time shifting/u.test(role) ? 2 : null;
  if (column === 'Grid services') return /inertia|voltage|frequency|black start|grid-forming/u.test(role) ? 2 : null;
  return /fuel stored|storable|seasonal|long-duration|duration|storage/u.test(role) ? 2 : null;
}
export const GENERATION_ROLE_MATRIX = roleTechnologyIds.flatMap((id) => {
  const record = technologyFile.technologies.find((item) => item.technology_id === id);
  if (!record) throw new Error(`Generation role technology ${id} is missing.`);
  return GENERATION_ROLE_COLUMNS.map((column) => ({ row: technologyLabel(id), column, value: roleValue(record, column) }));
});
export const GENERATION_ROLE_TABLE = roleTechnologyIds.map((id) => {
  const record = technologyFile.technologies.find((item) => item.technology_id === id);
  if (!record) throw new Error(`Generation role technology ${id} is missing.`);
  return { technology: technologyLabel(id), roles: record.system_role.join('; '), deploymentStatus: generationLabel(record.deployment_status), boundary: 'Qualitative system role; not regional accredited capacity or reliability proof' };
});

const capacityRows = readCsv('timeseries/normalized/global-irena-capacity-and-generation-history.csv');
const comparedTechnologies = ['fossil_fuels_total', 'nuclear', 'hydropower', 'wind', 'solar', 'bioenergy', 'geothermal'] as const;
const capacityGenerationRows = capacityRows.filter((row) => Number(row.year) === 2023 && comparedTechnologies.includes((row.technology ?? '') as typeof comparedTechnologies[number]) && ['installed_capacity', 'electricity_generation'].includes(row.metric ?? ''));
export const GENERATION_CAPACITY_BARS: readonly EnergyBar[] = capacityGenerationRows.filter((row) => row.metric === 'installed_capacity').map((row) => ({ id: row.technology ?? '', label: generationLabel(row.technology ?? ''), value: numberField(row, 'value') }));
export const GENERATION_OUTPUT_BARS: readonly EnergyBar[] = capacityGenerationRows.filter((row) => row.metric === 'electricity_generation').map((row) => ({ id: row.technology ?? '', label: generationLabel(row.technology ?? ''), value: numberField(row, 'value') }));
export const GENERATION_CAPACITY_OUTPUT_TABLE = capacityGenerationRows.map((row) => ({ technology: generationLabel(row.technology ?? ''), measure: generationLabel(row.metric ?? ''), value: numberField(row, 'value'), unit: row.unit ?? '', year: numberField(row, 'year'), boundary: row.scope ?? '' }));

interface LifecycleFile {
  status: string;
  functional_unit: string;
  system_boundary: string;
  values: readonly { technology: string; median: number; min: number; max: number; unit: string; scope_warning?: string }[];
}
const lifecycleFile = readJson<LifecycleFile>('impacts/lifecycle-benchmarks.json');
export const GENERATION_LIFECYCLE_RANGES: readonly EnergyDotRange[] = lifecycleFile.values.map((item) => ({ id: item.technology, label: generationLabel(item.technology), low: item.min, value: item.median, high: item.max }));
export const GENERATION_LIFECYCLE_TABLE = lifecycleFile.values.map((item) => ({ technology: generationLabel(item.technology), minimum: item.min, median: item.median, maximum: item.max, unit: item.unit, status: generationLabel(lifecycleFile.status), scopeWarning: item.scope_warning ?? 'Literature range; configuration and study boundaries vary.' }));

export const GENERATION_HEALTH_PATHWAY = {
  nodes: [
    { id: 'hazard', label: 'Hazard or emission', x: 0.02, y: 0.5 },
    { id: 'pathway', label: 'Transport or pathway', x: 0.22, y: 0.5 },
    { id: 'contact', label: 'Concentration or contact', x: 0.42, y: 0.5 },
    { id: 'dose', label: 'Dose or exposure', x: 0.62, y: 0.5 },
    { id: 'response', label: 'Response evidence', x: 0.81, y: 0.5 },
    { id: 'outcome', label: 'Attributable outcome', x: 0.98, y: 0.5 },
  ],
  edges: [
    { id: 'hazard-pathway', label: 'Release, waste, accident, or occupational condition', source: 'hazard', target: 'pathway', weight: null },
    { id: 'pathway-contact', label: 'Dispersion, water, food chain, radiation, or direct contact', source: 'pathway', target: 'contact', weight: null },
    { id: 'contact-dose', label: 'Population, route, duration, and protective controls', source: 'contact', target: 'dose', weight: null },
    { id: 'dose-response', label: 'Toxicology, epidemiology, monitoring, or event evidence', source: 'dose', target: 'response', weight: null },
    { id: 'response-outcome', label: 'Requires population and causal attribution model', source: 'response', target: 'outcome', weight: null },
  ],
} as const;
export const GENERATION_HEALTH_TABLE = [
  { pathway: 'Routine air pollution', evidence: 'Plant emissions, atmospheric transport, exposure, and health-response evidence', boundary: 'Do not infer deaths from generation alone' },
  { pathway: 'Occupational', evidence: 'Mining, fuel, construction, operation, maintenance, and waste handling', boundary: 'Worker population, task, dose, controls, and period required' },
  { pathway: 'Water and waste', evidence: 'Thermal discharge, ash, chemicals, mine waste, spent fuel, and contamination pathways', boundary: 'Site, medium, receiving environment, and lifecycle stage required' },
  { pathway: 'Accident', evidence: 'Technology- and event-specific release, exposure, evacuation, and follow-up evidence', boundary: 'Separate routine fleet evidence from rare events' },
] as const;

export const GENERATION_TECHNOLOGY_CARDS = technologyFile.technologies.map((record) => ({
  id: record.technology_id,
  label: technologyLabel(record.technology_id),
  deployment: generationLabel(record.deployment_status),
  role: record.system_role.join('; '),
  technicalStrengths: record.technical.strengths?.join('; ') ?? 'Not stated',
  technicalProblems: record.technical.problems?.join('; ') ?? 'Not stated',
  health: flattenHealth(record.health).join('; '),
  regulatory: record.regulatory.join('; '),
  sustainability: record.sustainability.join('; '),
  mitigation: record.mitigation_options.join('; '),
  residual: record.residual_risks.join('; '),
}));
export const GENERATION_TECHNOLOGY_TABLE = GENERATION_TECHNOLOGY_CARDS.map((item) => ({ technology: item.label, systemRole: item.role, technicalProblems: item.technicalProblems, healthPathways: item.health, regulatoryScope: item.regulatory, sustainabilityBurdens: item.sustainability, mitigation: item.mitigation, residualRisks: item.residual }));

interface NuclearMetric { metric_id: string; geography: string; period: string | number; value: number; comparison?: string; unit: string; status: string; denominator?: string }
interface NuclearProblem { problem_id: string; dimension: string; problem: string; generalization_limit?: string; regulatory_response?: string }
interface NuclearFile {
  observed_metrics: readonly NuclearMetric[];
  official_count_conflict: { status: string; reason: string; prohibited_action: string };
  problem_register: readonly NuclearProblem[];
}
const nuclearFile = readJson<NuclearFile>('impacts/nuclear-generation.json');
export const NUCLEAR_HEADLINE_METRICS = nuclearFile.observed_metrics.filter((item) => ['us_nuclear_capacity_factor_2025', 'us_operating_reactor_count_nrc', 'us_operating_reactor_count_eia', 'us_commercial_spent_fuel_inventory', 'us_average_measurable_worker_dose_2024'].includes(item.metric_id));
export const NUCLEAR_EVIDENCE_TABLE = [
  ...nuclearFile.observed_metrics.map((item) => ({ evidenceType: 'Observed or reported metric', item: generationLabel(item.metric_id), dimension: 'Metric', value: `${item.comparison === 'greater_than' ? '>' : ''}${item.value}`, unit: item.unit, period: String(item.period), qualification: item.denominator ?? generationLabel(item.status) })),
  ...nuclearFile.problem_register.map((item) => ({ evidenceType: 'Problem register', item: generationLabel(item.problem_id), dimension: generationLabel(item.dimension), value: null, unit: 'qualitative', period: 'As of 2026-08-01', qualification: `${item.problem}${item.generalization_limit ? ` ${item.generalization_limit}` : ''}${item.regulatory_response ? ` ${item.regulatory_response}` : ''}` })),
];
export const NUCLEAR_COUNT_CONFLICT = {
  nrc: nuclearFile.observed_metrics.find((item) => item.metric_id === 'us_operating_reactor_count_nrc'),
  eia: nuclearFile.observed_metrics.find((item) => item.metric_id === 'us_operating_reactor_count_eia'),
  status: generationLabel(nuclearFile.official_count_conflict.status),
  reason: nuclearFile.official_count_conflict.reason,
  guardrail: nuclearFile.official_count_conflict.prohibited_action,
} as const;

export const GENERATION_PORTFOLIO_ROWS = ['Renewables & storage led', 'Firm low-carbon led', 'Diversified low-carbon'] as const;
export const GENERATION_PORTFOLIO_COLUMNS = ['Low-carbon energy', 'Firm capacity', 'Flexibility', 'Delivery diversity', 'Compatible all-impact ledger'] as const;
const portfolioValues = [
  [3, 1, 3, 2, null],
  [2, 3, 2, 1, null],
  [3, 3, 3, 3, null],
] as const;
export const GENERATION_PORTFOLIO_MATRIX = GENERATION_PORTFOLIO_ROWS.flatMap((row, rowIndex) => GENERATION_PORTFOLIO_COLUMNS.map((column, columnIndex) => ({ row, column, value: portfolioValues[rowIndex]?.[columnIndex] ?? null })));
export const GENERATION_PORTFOLIO_TABLE = [
  { portfolio: 'Renewables & storage led', benefit: 'Rapid scalable low-carbon energy with storage and flexible demand', dependencies: 'Transmission, siting, storage duration, grid services, supply chains', residualRisk: 'Extended low-output periods and regional coincidence', quantitativeComparison: 'Unavailable compatible reliability and all-impact ledger' },
  { portfolio: 'Firm low-carbon led', benefit: 'Firm energy and capacity from nuclear, hydro, geothermal, or CCS where feasible', dependencies: 'Long projects, fuel, cooling, geology, waste, finance, configuration', residualRisk: 'Schedule, cost, site, common-mode, and unit-outage exposure', quantitativeComparison: 'Unavailable compatible reliability and all-impact ledger' },
  { portfolio: 'Diversified low-carbon', benefit: 'Combines rapid renewables with safe economical firm assets, storage, flexibility, and new firm options', dependencies: 'Highest coordination across generation, demand, grid, permitting, and manufacturing', residualRisk: 'No portfolio removes delivery, environmental, affordability, or reliability risk', quantitativeComparison: 'Unavailable compatible reliability and all-impact ledger' },
] as const;

export const GENERATION_WORKBENCH = {
  technologies: GENERATION_TECHNOLOGY_CARDS,
  dimensions: [
    { id: 'technical', label: 'Technical', field: 'technicalProblems' },
    { id: 'health', label: 'Health pathway', field: 'health' },
    { id: 'regulatory', label: 'Regulatory', field: 'regulatory' },
    { id: 'sustainability', label: 'Sustainability', field: 'sustainability' },
    { id: 'mitigation', label: 'Mitigation', field: 'mitigation' },
    { id: 'residual', label: 'Residual risk', field: 'residual' },
  ],
} as const;
