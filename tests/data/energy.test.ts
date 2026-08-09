import { describe, expect, it } from 'vitest';

import {
  AEO_DEMAND_2050,
  AEO_DEMAND_SERIES,
  approvedEnergyChart,
  DATA_CENTER_FACILITY_ROWS,
  DATA_CENTER_SERVER_2050,
  DEMAND_WORKBENCH_RECORDS,
  ENERGY_SCENARIO_SEAM,
  ENERGY_SOURCES,
  EV_AEO_2050,
  EV_US_HISTORY,
  TEXAS_LOAD_SUMMARY,
  TEXAS_SEASONAL_LOAD_SERIES,
  US_GENERATION_SERIES,
  WORLD_GENERATION_SERIES,
} from '../../src/lib/data/energy';

describe('Step 6 Energy adapters', () => {
  it('binds six legible historical series without manufacturing early coverage', () => {
    expect(WORLD_GENERATION_SERIES).toHaveLength(6);
    expect(US_GENERATION_SERIES).toHaveLength(6);
    expect(WORLD_GENERATION_SERIES.find((series) => series.id === 'solar')?.values.at(-1)?.x).toBe(2025);
    expect(US_GENERATION_SERIES.find((series) => series.id === 'solar_total')?.values.at(0)?.x).toBe(1984);
    expect(US_GENERATION_SERIES.flatMap((series) => series.values).every((point) => point.y === null || Number.isFinite(point.y))).toBe(true);
  });

  it('keeps observed, AEO, and ReEDS source-family seams separate', () => {
    expect(ENERGY_SCENARIO_SEAM.map((series) => series.id)).toEqual(['observed', 'aeo2026', 'reeds2024']);
    expect(ENERGY_SCENARIO_SEAM[0]?.values.at(-1)?.x).toBe(2025);
    expect(ENERGY_SCENARIO_SEAM[1]?.values.at(0)?.x).toBe(2025);
    expect(ENERGY_SCENARIO_SEAM[2]?.values.at(0)?.x).toBe(2026);
    expect(ENERGY_SOURCES.aeo.identityStatus).toBe('verified');
    expect(ENERGY_SOURCES.reeds.identityStatus).toBe('verified');
  });

  it('preserves all eleven AEO cases as conditional scenarios', () => {
    expect(AEO_DEMAND_SERIES).toHaveLength(11);
    expect(AEO_DEMAND_SERIES.every((series) => series.values.length === 26)).toBe(true);
    expect(AEO_DEMAND_2050[0]?.value).toBeCloseTo(5439.089, 2);
    expect(AEO_DEMAND_2050.at(-1)?.value).toBeCloseTo(6469.614, 2);
    expect(AEO_DEMAND_2050.every((row) => row.status.includes('not_prediction'))).toBe(true);
  });

  it('keeps total-facility, server-only, and contained EV layers distinct', () => {
    expect(DATA_CENTER_FACILITY_ROWS.some((row) => row.scope.includes('servers_storage_network_and_infrastructure'))).toBe(true);
    expect(DATA_CENTER_SERVER_2050[0]?.low).toBeCloseTo(427.067, 2);
    expect(DATA_CENTER_SERVER_2050[0]?.high).toBeCloseTo(818.701, 2);
    expect(EV_US_HISTORY[0]?.values.at(-1)?.y).toBeCloseTo(23.533, 2);
    expect(EV_AEO_2050[0]?.value).toBeCloseTo(829.871, 2);
  });

  it('uses observed hourly profiles and never fills an unavailable NREL horizon', () => {
    expect(TEXAS_SEASONAL_LOAD_SERIES).toHaveLength(4);
    expect(TEXAS_SEASONAL_LOAD_SERIES.every((series) => series.values.length === 24)).toBe(true);
    expect(TEXAS_LOAD_SUMMARY.observationCount).toBe(8784);
    expect(DEMAND_WORKBENCH_RECORDS.find((record) => record.family === 'efs_high' && record.metric === 'total' && record.horizon === 2030)?.value).toBeNull();
    expect(DEMAND_WORKBENCH_RECORDS.find((record) => record.family === 'aeo_baseline' && record.metric === 'total' && record.horizon === 2050)?.value).toBeCloseTo(5995.215, 2);
  });

  it('derives approved display types without mutating incompatible registered charts', () => {
    expect(approvedEnergyChart('CHT-000022', 'line')).toMatchObject({ id: 'CHT-000022', chartType: 'line' });
    expect(approvedEnergyChart('CHT-000006', 'line')).toMatchObject({ id: 'CHT-000006', chartType: 'line' });
    expect(() => approvedEnergyChart('CHT-000006', 'bar')).toThrow(/registered as line/u);
  });
});
