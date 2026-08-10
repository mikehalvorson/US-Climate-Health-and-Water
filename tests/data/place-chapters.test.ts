import { describe, expect, it } from 'vitest';

import {
  approvedCoastChart,
  COAST_ADAPTATION_PATHWAYS,
  COAST_FLOOD_TABLE,
  COAST_MIGRATION_TABLE,
  COAST_RECEIVING_DOMAINS,
  COAST_SCENARIO_SERIES,
  COAST_TREND_RANGES,
  COAST_WORKBENCH,
} from '../../src/lib/data/coasts';
import {
  approvedIndustryChart,
  DATA_CENTER_BOUNDARY_TABLE,
  DATA_CENTER_WATER_RANGES,
  FACILITY_MAP_REQUIREMENTS,
  INDUSTRY_NATIONAL_LOCAL_SCALE,
  INDUSTRY_SCORE_MATRIX,
  INDUSTRY_WORKBENCH,
  THERMOELECTRIC_TABLE,
} from '../../src/lib/data/industry';

describe('Coasts and facility-water adapters', () => {
  it('preserves exact coastal trend and city-location bindings', () => {
    expect(COAST_TREND_RANGES).toHaveLength(3);
    expect(COAST_TREND_RANGES.map((item) => item.value)).toEqual([3.2004, 5.9944, 9.1186]);
    const miami = COAST_WORKBENCH.cities.find((item) => item.id === 'miami');
    const newOrleans = COAST_WORKBENCH.cities.find((item) => item.id === 'new_orleans');
    expect(miami).toMatchObject({ gauge: 'Virginia Key', stationId: '8723214', scenarioLocation: 'virginia_key', baseline: 'NOAA local scenario change since 2020' });
    expect(newOrleans).toMatchObject({ gauge: 'New Canal Station', stationId: '8761927', scenarioLocation: 'grid_30n_90w' });
    expect(newOrleans?.floodContext).toMatch(/not New Orleans/iu);
  });

  it('keeps scenario baselines, threshold semantics, and migration states explicit', () => {
    expect(COAST_SCENARIO_SERIES).toHaveLength(5);
    expect(COAST_SCENARIO_SERIES.every((series) => series.values[0]?.y === 0)).toBe(true);
    expect(COAST_WORKBENCH.records).toHaveLength(30);
    expect(COAST_FLOOD_TABLE.every((item) => item.threshold.includes('minor'))).toBe(true);
    expect(COAST_MIGRATION_TABLE.every((item) => item.interpretation.includes('not forecast'))).toBe(true);
    expect(approvedCoastChart('high-tide-flood-days', 'line').chartType).toBe('line');
  });

  it('publishes capacity and pathways as frameworks rather than scores or forecasts', () => {
    expect(COAST_RECEIVING_DOMAINS).toHaveLength(7);
    expect(COAST_RECEIVING_DOMAINS.every((item) => item.status === 'Capacity denominator required')).toBe(true);
    expect(COAST_ADAPTATION_PATHWAYS).toHaveLength(5);
  });

  it('keeps national and facility water boundaries separate', () => {
    expect(INDUSTRY_NATIONAL_LOCAL_SCALE).toHaveLength(3);
    expect(DATA_CENTER_WATER_RANGES).toMatchObject([{ low: 47.77, high: 47.77 }, { low: 101.3, high: 202.7 }]);
    expect(DATA_CENTER_BOUNDARY_TABLE[1]?.accounting).toMatch(/Do not add/iu);
    expect(THERMOELECTRIC_TABLE).toMatchObject([{ value: 82656 }, { value: 2904 }]);
    expect(approvedIndustryChart('industry-direct-indirect-boundary', 'flow').chartType).toBe('flow');
  });

  it('keeps the facility map and unsupported boundary combinations unavailable', () => {
    expect(FACILITY_MAP_REQUIREMENTS).toHaveLength(7);
    expect(INDUSTRY_SCORE_MATRIX).toHaveLength(24);
    const availableRecords: readonly string[] = INDUSTRY_WORKBENCH.records.map((item) => `${item.facility}:${item.boundary}`);
    expect(availableRecords).not.toContain('plastics_manufacturing:direct_withdrawal');
    expect(availableRecords).not.toContain('data_center:discharge_quality');
  });
});
