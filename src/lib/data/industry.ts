import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { EnergyBar, EnergyDotRange } from './energy';
import { approvedFoodWaterChart, foodWaterSource } from './foodWater';

const WATER_ROOT = resolve(process.cwd(), 'research', 'water');
function readJson<T>(path: string): T { return JSON.parse(readFileSync(resolve(WATER_ROOT, path), 'utf8')) as T; }

export const approvedIndustryChart = approvedFoodWaterChart;
export const INDUSTRY_SOURCES = {
  inventory: foodWaterSource('USGS-CIR1441'),
  consumption: foodWaterSource('USGS-PP1894D'),
  industrial: foodWaterSource('USGS-INDUSTRIAL'),
  nationalRisk: foodWaterSource('USGS-NWAA-2026'),
  dataCenters: foodWaterSource('LBNL-DATA-CENTER-2024'),
  dataCenterProjection: foodWaterSource('LBNL-DATA-CENTER-WATER-2026'),
  workload: foodWaterSource('LBNL-WORKLOAD-WATER-2025'),
  plasticsLca: foodWaterSource('RCR-PLASTICS-LCA-2023'),
} as const;

interface DataCenterFile {
  direct_water: { year_2023_billion_liters: number; year_2023_million_gallons_per_day: number; year_2028_projection_million_gallons_per_day: readonly [number, number]; direct_wue_liters_per_kilowatt_hour: Readonly<Record<string, number | readonly number[]>> };
  indirect_electricity_water: { year_2023_billion_liters: number; year_2023_million_gallons_per_day: number; average_liters_per_kilowatt_hour: number; includes: string; accounting_rule: string };
  electricity_context: { year_2023_terawatt_hours: number; year_2028_projection_terawatt_hours: readonly [number, number]; year_2028_us_electricity_share_percent: readonly [number, number] };
  scale_comparisons: readonly Readonly<Record<string, unknown>>[];
  site_level_drivers: readonly string[];
  coefficient_guardrail: { finding: string; rule: string };
}
const dataCenterFile = readJson<DataCenterFile>('sectors/data-centers.json');
interface NationalFile { inventory_2015: { categories: readonly Readonly<Record<string, string | number | null>>[] }; modeled_2010_2020: { covered_sectors: readonly { sector: string; withdrawal: number; consumptive_use: number; consumptive_fraction_percent: number }[] } }
const nationalFile = readJson<NationalFile>('national-water-use.json');
interface ManufacturingFile { industrial_water_2015: { self_supplied_total_withdrawal_billion_gallons_per_day: number; self_supplied_freshwater_withdrawal_billion_gallons_per_day: number; excluded: string }; plastics_boundary_problem: { status: string; reasons: readonly string[] }; next_data_actions: readonly string[] }
const manufacturingFile = readJson<ManufacturingFile>('sectors/manufacturing-plastics.json');

export const INDUSTRY_NATIONAL_LOCAL_SCALE = [
  { id: 'thermoelectric', label: 'Thermoelectric self-supplied withdrawal, 2015', value: 133, unit: 'Bgal/day', boundary: 'National total, fresh and saline; withdrawal, not consumption' },
  { id: 'industrial', label: 'Industrial self-supplied withdrawal, 2015', value: manufacturingFile.industrial_water_2015.self_supplied_total_withdrawal_billion_gallons_per_day, unit: 'Bgal/day', boundary: manufacturingFile.industrial_water_2015.excluded },
  { id: 'data-center', label: 'Data-center direct water estimate, 2023', value: dataCenterFile.direct_water.year_2023_million_gallons_per_day / 1000, unit: 'Bgal/day', boundary: 'National estimate; spatially concentrated; not a facility coefficient' },
] as const;

const direct2028 = dataCenterFile.direct_water.year_2028_projection_million_gallons_per_day;
export const DATA_CENTER_WATER_RANGES: readonly EnergyDotRange[] = [
  { id: '2023', label: '2023 national direct estimate', low: dataCenterFile.direct_water.year_2023_million_gallons_per_day, value: dataCenterFile.direct_water.year_2023_million_gallons_per_day, high: dataCenterFile.direct_water.year_2023_million_gallons_per_day },
  { id: '2028', label: '2028 source projection range', low: direct2028[0], value: (direct2028[0] + direct2028[1]) / 2, high: direct2028[1] },
];
export const DATA_CENTER_WATER_TABLE = [
  { period: '2023', evidenceState: 'Reported estimate', low: dataCenterFile.direct_water.year_2023_million_gallons_per_day, central: dataCenterFile.direct_water.year_2023_million_gallons_per_day, high: dataCenterFile.direct_water.year_2023_million_gallons_per_day, unit: 'Mgal/day direct', boundary: 'National direct on-site water estimate' },
  { period: '2028', evidenceState: 'Source scenario range', low: direct2028[0], central: null, high: direct2028[1], unit: 'Mgal/day direct', boundary: 'National projection range; not facility forecast' },
] as const;

export const DATA_CENTER_BOUNDARY_NETWORK = {
  nodes: [
    { id: 'source-direct', label: 'Local water source', x: 0.02, y: 0.2 },
    { id: 'facility', label: 'Data center', x: 0.42, y: 0.2 },
    { id: 'power-water', label: 'Power-sector water', x: 0.02, y: 0.78 },
    { id: 'grid', label: 'Electricity system', x: 0.42, y: 0.78 },
    { id: 'service', label: 'Computing service', x: 0.98, y: 0.5 },
  ],
  edges: [
    { id: 'direct', label: 'Direct on-site water estimate', source: 'source-direct', target: 'facility', weight: dataCenterFile.direct_water.year_2023_million_gallons_per_day },
    { id: 'indirect-source', label: 'Upstream water attributed to electricity', source: 'power-water', target: 'grid', weight: dataCenterFile.indirect_electricity_water.year_2023_million_gallons_per_day },
    { id: 'facility-service', label: 'Direct water supports facility cooling and humidification', source: 'facility', target: 'service', weight: null },
    { id: 'grid-service', label: 'Electricity and attributed upstream water remain separate', source: 'grid', target: 'service', weight: null },
  ],
} as const;
export const DATA_CENTER_BOUNDARY_TABLE = [
  { boundary: 'Direct on-site water', value: dataCenterFile.direct_water.year_2023_million_gallons_per_day, unit: 'Mgal/day', year: 2023, accounting: 'Facility cooling and humidification estimate; national, not site-specific' },
  { boundary: 'Indirect electricity water', value: dataCenterFile.indirect_electricity_water.year_2023_million_gallons_per_day, unit: 'Mgal/day attributed', year: 2023, accounting: dataCenterFile.indirect_electricity_water.accounting_rule },
] as const;

const thermoelectric = nationalFile.modeled_2010_2020.covered_sectors.find((item) => item.sector === 'thermoelectric_freshwater');
if (!thermoelectric) throw new Error('Thermoelectric covered-sector record is missing.');
export const THERMOELECTRIC_BARS: readonly EnergyBar[] = [
  { id: 'withdrawal', label: 'Freshwater withdrawal', value: thermoelectric.withdrawal },
  { id: 'consumption', label: 'Consumptive use', value: thermoelectric.consumptive_use },
];
export const THERMOELECTRIC_TABLE = [
  { measure: 'Freshwater withdrawal', value: thermoelectric.withdrawal, unit: 'Mgal/day', period: '2010–20 modeled average', fraction: '100% withdrawal reference', interpretation: 'Water removed from a source; much is returned' },
  { measure: 'Consumptive use', value: thermoelectric.consumptive_use, unit: 'Mgal/day', period: '2010–20 modeled average', fraction: `${thermoelectric.consumptive_fraction_percent}% of withdrawal`, interpretation: 'Water removed from immediate reuse, including evaporation' },
] as const;

export const FACILITY_WATER_NETWORK = {
  nodes: [
    { id: 'watershed', label: 'Watershed & aquifer', x: 0.02, y: 0.5 },
    { id: 'utility', label: 'Utility or self-supply', x: 0.25, y: 0.5 },
    { id: 'facility', label: 'Facility process & cooling', x: 0.5, y: 0.5 },
    { id: 'consume', label: 'Consumption', x: 0.76, y: 0.2 },
    { id: 'return', label: 'Return flow & quality', x: 0.76, y: 0.52 },
    { id: 'power', label: 'Power demand', x: 0.76, y: 0.84 },
    { id: 'community', label: 'People, users & ecosystems', x: 0.98, y: 0.5 },
  ],
  edges: [
    { id: 'source-utility', label: 'Seasonal reliable yield, rights, treatment, and conveyance', source: 'watershed', target: 'utility', weight: null },
    { id: 'utility-facility', label: 'Withdrawal or delivery with meter and source identity', source: 'utility', target: 'facility', weight: null },
    { id: 'facility-consume', label: 'Evaporation or incorporation', source: 'facility', target: 'consume', weight: null },
    { id: 'facility-return', label: 'Volume, temperature, chemistry, timing, and location', source: 'facility', target: 'return', weight: null },
    { id: 'facility-power', label: 'Hourly electricity and upstream water attribution', source: 'facility', target: 'power', weight: null },
    { id: 'consume-community', label: 'Reduces immediately available water', source: 'consume', target: 'community', weight: null },
    { id: 'return-community', label: 'Changes downstream quantity or quality', source: 'return', target: 'community', weight: null },
    { id: 'power-community', label: 'Grid and generation dependencies', source: 'power', target: 'community', weight: null },
  ],
} as const;
export const FACILITY_WATER_TABLE = [
  { stage: 'Source and season', requiredEvidence: 'Watershed or aquifer, utility source, rights, monthly reliable yield, drought state', decision: 'Is incremental withdrawal physically and legally available?' },
  { stage: 'Facility demand', requiredEvidence: 'Withdrawal, consumption, cooling/process configuration, hourly and monthly profile', decision: 'What water is removed and when?' },
  { stage: 'Return and quality', requiredEvidence: 'Return location, timing, volume, temperature, chemistry, treatment, permit', decision: 'What comes back and can downstream systems use it?' },
  { stage: 'Electricity linkage', requiredEvidence: 'Hourly load, grid location, generation attribution boundary', decision: 'What upstream water is attributed without double counting?' },
  { stage: 'Community and ecosystems', requiredEvidence: 'Competing users, environmental flow, affordability, Tribal rights, cumulative effects', decision: 'Who gains, who bears risk, and what must be protected?' },
] as const;

export const INDUSTRY_SCORE_ROWS = ['Source reliability', 'Seasonal budget', 'Withdrawal, consumption & return', 'Water quality', 'Power-water interaction', 'Community & ecosystems'] as const;
export const INDUSTRY_SCORE_COLUMNS = ['Disclosure', 'Siting', 'Normal operations', 'Drought operations'] as const;
const scoreValues = [
  [3, 3, 2, 3], [2, 3, 2, 3], [3, 3, 3, 3], [3, 3, 3, 3], [2, 3, 2, 3], [2, 3, 2, 3],
] as const;
export const INDUSTRY_SCORE_MATRIX = INDUSTRY_SCORE_ROWS.flatMap((row, rowIndex) => INDUSTRY_SCORE_COLUMNS.map((column, columnIndex) => ({ row, column, value: scoreValues[rowIndex]?.[columnIndex] ?? null })));
export const INDUSTRY_SCORE_TABLE = INDUSTRY_SCORE_ROWS.map((dimension, index) => ({ dimension, disclosure: scoreValues[index]?.[0] === 3 ? 'Decision gate' : 'Required context', siting: 'Decision gate', normalOperations: scoreValues[index]?.[2] === 3 ? 'Decision gate' : 'Monitor and disclose', droughtOperations: 'Decision gate with enforceable trigger', qualification: 'Evidence requirement, not a facility performance score' }));

export const FACILITY_MAP_REQUIREMENTS = [
  { field: 'Verified facility identity and coordinates', currentStatus: 'Unavailable nationally', enablementTest: 'Unique facility ID, geocoded parcel or campus, public source, access date' },
  { field: 'Water source and utility', currentStatus: 'Unavailable nationally', enablementTest: 'Named surface water, aquifer, reclaimed source, or public supplier with accounting boundary' },
  { field: 'Withdrawal and consumption', currentStatus: 'Unavailable nationally', enablementTest: 'Metered or permitted values, period, source, return-flow method, and uncertainty' },
  { field: 'Cooling/process configuration', currentStatus: 'Unavailable nationally', enablementTest: 'Technology, set points, reuse, blowdown, and operating state' },
  { field: 'Seasonal profile and drought rules', currentStatus: 'Unavailable nationally', enablementTest: 'Monthly or hourly demand plus enforceable trigger and curtailment terms' },
  { field: 'Return flow and discharge quality', currentStatus: 'Unavailable nationally', enablementTest: 'Receiving water, volume, timing, temperature, chemistry, treatment, and permit' },
  { field: 'Watershed and competing-use context', currentStatus: 'Unavailable nationally', enablementTest: 'Verified spatial join, source reliability, environmental flow, users, rights, and cumulative effects' },
] as const;

const facilityTypes = [
  { id: 'data_center', label: 'Data center', context: 'National direct and indirect estimates exist; verified facility-seasonal inventory does not.' },
  { id: 'thermoelectric', label: 'Thermoelectric generation', context: 'National freshwater withdrawal and consumption are available; plant assignment is prohibited.' },
  { id: 'self_supplied_industry', label: 'Self-supplied industry', context: manufacturingFile.industrial_water_2015.excluded },
  { id: 'plastics_manufacturing', label: 'Plastics manufacturing', context: 'No defensible current national total or universal resin coefficient.' },
] as const;
const boundaries = [
  { id: 'direct_withdrawal', label: 'Direct withdrawal' },
  { id: 'consumptive_use', label: 'Consumptive use' },
  { id: 'indirect_electricity', label: 'Indirect electricity water' },
  { id: 'return_flow', label: 'Return flow' },
  { id: 'discharge_quality', label: 'Discharge quality' },
] as const;
const records = [
  { facility: 'data_center', boundary: 'direct_withdrawal', value: dataCenterFile.direct_water.year_2023_million_gallons_per_day, unit: 'Mgal/day', period: '2023', geography: 'United States estimate', evidenceState: 'Reported estimate', qualification: 'Direct on-site water estimate; not a facility coefficient' },
  { facility: 'data_center', boundary: 'consumptive_use', value: dataCenterFile.direct_water.year_2023_million_gallons_per_day, unit: 'Mgal/day direct water use', period: '2023', geography: 'United States estimate', evidenceState: 'Reported estimate', qualification: 'Use source terminology; facility withdrawal and return flow are not separately resolved' },
  { facility: 'data_center', boundary: 'indirect_electricity', value: dataCenterFile.indirect_electricity_water.year_2023_million_gallons_per_day, unit: 'Mgal/day attributed', period: '2023', geography: 'United States estimate', evidenceState: 'Reported estimate', qualification: dataCenterFile.indirect_electricity_water.accounting_rule },
  { facility: 'thermoelectric', boundary: 'direct_withdrawal', value: thermoelectric.withdrawal, unit: 'Mgal/day freshwater', period: '2010–20 average', geography: 'Conterminous U.S.', evidenceState: 'Reported estimate', qualification: 'Covered-sector national model; not plant-specific' },
  { facility: 'thermoelectric', boundary: 'consumptive_use', value: thermoelectric.consumptive_use, unit: 'Mgal/day freshwater', period: '2010–20 average', geography: 'Conterminous U.S.', evidenceState: 'Reported estimate', qualification: 'Covered-sector national model; not plant-specific' },
  { facility: 'self_supplied_industry', boundary: 'direct_withdrawal', value: manufacturingFile.industrial_water_2015.self_supplied_total_withdrawal_billion_gallons_per_day, unit: 'Bgal/day', period: '2015', geography: 'United States inventory', evidenceState: 'Reported estimate', qualification: manufacturingFile.industrial_water_2015.excluded },
] as const;
export const INDUSTRY_WORKBENCH = { facilityTypes, boundaries, records, guardrail: dataCenterFile.coefficient_guardrail, plasticsGap: manufacturingFile.plastics_boundary_problem, nextDataActions: manufacturingFile.next_data_actions } as const;
