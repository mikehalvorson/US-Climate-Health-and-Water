import { describe, expect, it } from 'vitest';

import {
  approvedFoodWaterChart,
  FUNCTIONAL_WATER_TABLE,
  GROSS_WATER_RANGES,
  HEALTH_EVIDENCE_MATRIX,
  PLASTIC_FLOW_TABLE,
  PLASTIC_SOURCES,
  RESIN_WATER_RANGES,
  SEAWEED_SCENARIO_TABLE,
  WATER_CONSUMPTION_TABLE,
  WATER_RISK_HORIZONS,
  WATER_SOURCES,
  WATER_WITHDRAWAL_SERIES,
  WATER_WORKBENCH,
} from '../../src/lib/data/foodWater';

describe('freshwater and plastics evidence adapter', () => {
  it('resolves canonical sources and chart identities', () => {
    expect(WATER_SOURCES.inventory.legacyIds).toContain('USGS-CIR1441');
    expect(PLASTIC_SOURCES.materialFlow.legacyIds).toContain('US-PLASTICS-MFA-2019');
    expect(approvedFoodWaterChart('withdrawal-versus-consumption', 'sankey').id).toMatch(/^CHT-/u);
    expect(approvedFoodWaterChart('seaweed_scale_funnel', 'bar').chartType).toBe('bar');
  });

  it('preserves withdrawal and consumption boundaries', () => {
    expect(WATER_WITHDRAWAL_SERIES.find((item) => item.id === 'total')?.values.at(-1)).toEqual({ x: 2015, y: 322 });
    const crop = WATER_CONSUMPTION_TABLE.find((item) => item.sector === 'Crop Irrigation');
    const thermoelectric = WATER_CONSUMPTION_TABLE.find((item) => item.sector === 'Thermoelectric Freshwater');
    expect(crop).toMatchObject({ withdrawal: 105497, consumptiveUse: 75698, fraction: 72 });
    expect(thermoelectric).toMatchObject({ withdrawal: 82656, consumptiveUse: 2904, fraction: 4 });
  });

  it('keeps typed horizons and open dates explicit', () => {
    expect(new Set(WATER_RISK_HORIZONS.map((item) => item.riskType))).toContain('planning_counterfactual');
    expect(WATER_RISK_HORIZONS.find((item) => item.riskId === 'WRSK-NEW-ORLEANS-SALT-WEDGE')).toMatchObject({ startYear: null, endYear: null });
    expect(WATER_WORKBENCH.risks.find((item) => item.id === 'WRSK-COLORADO-2027')?.type).toBe('regulatory_deadline');
  });

  it('preserves material-flow units and water uncertainty ranges', () => {
    expect(PLASTIC_FLOW_TABLE.find((item) => item.flow === 'Domestic consumption')?.value).toBe(57);
    expect(RESIN_WATER_RANGES.find((item) => item.id === 'PET')).toMatchObject({ low: 3.3, value: 23.5, high: 44.4 });
    expect(GROSS_WATER_RANGES).toHaveLength(3);
  });

  it('publishes missing net terms and gated seaweed scenarios honestly', () => {
    expect(FUNCTIONAL_WATER_TABLE.every((item) => item.value === null)).toBe(true);
    expect(SEAWEED_SCENARIO_TABLE.every((item) => item.status === 'Illustrative scenario, not forecast')).toBe(true);
    expect(HEALTH_EVIDENCE_MATRIX.some((item) => item.value === null)).toBe(true);
  });

  it('rejects incompatible non-null chart overrides', () => {
    expect(() => approvedFoodWaterChart('us_plastic_material_flow_2019', 'bar')).toThrow(/registered as sankey/u);
  });
});
