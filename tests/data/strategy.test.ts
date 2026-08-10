import { describe, expect, it } from 'vitest';

import {
  AGRICULTURE_CONTEXT,
  approvedStrategyChart,
  CLIMATE_PLAN_WARMING_RANGES,
  ENERGY_PLAN_SCENARIO_SERIES,
  FOOD_GROUNDWATER_SERIES,
  FOOD_WATER_PLAN_WORKBENCH,
  FOOD_WORKBENCH,
  ENERGY_PLAN_WORKBENCH,
  CLIMATE_PLAN_WORKBENCH,
  strategyGap,
} from '../../src/lib/data/strategy';

describe('Step 11 strategy adapters', () => {
  it('binds all 26 chart contracts to their authorized chart types', () => {
    const contracts = [
      ['energy-plan-architecture', 'flow'], ['energy-plan-source-scenarios', 'line'], ['energy-plan-requirements', 'matrix'], ['energy-plan-robustness', 'matrix'], ['energy-plan-roadmap', 'flow'], ['energy-plan-model-contract', 'flow'],
      ['climate-plan-causal-map', 'causal_path'], ['climate-plan-source-scenarios', 'dot_range'], ['climate-plan-mitigation-levers', 'matrix'], ['climate-plan-adaptation-packages', 'matrix'], ['climate-plan-residual-risk', 'matrix'], ['climate-plan-roadmap', 'flow'], ['climate-plan-model-contract', 'flow'],
      ['food-system-boundary', 'flow'], ['food-crop-yield-sensitivity', 'bar'], ['food-groundwater-transition', 'line'], ['food-evidence-readiness', 'matrix'], ['food-water-land-model', 'flow'], ['food-options-comparison', 'matrix'],
      ['food-water-plan-system-map', 'flow'], ['food-water-plan-outcomes', 'matrix'], ['food-water-plan-contributions', 'bar'], ['food-water-plan-stress', 'matrix'], ['food-water-plan-tradeoffs', 'matrix'], ['food-water-plan-governance', 'flow'], ['food-water-plan-model-contract', 'flow'],
    ] as const;
    expect(contracts.map(([id, type]) => approvedStrategyChart(id, type).chartType)).toEqual(contracts.map(([, type]) => type));
  });

  it('keeps quantitative evidence source-native and bounded', () => {
    expect(ENERGY_PLAN_SCENARIO_SERIES).toHaveLength(3);
    expect(CLIMATE_PLAN_WARMING_RANGES).toHaveLength(5);
    expect(FOOD_GROUNDWATER_SERIES[0]?.values).toHaveLength(6);
    expect(AGRICULTURE_CONTEXT.llano_estacado_case.geography).toBe('Hale County, Texas');
    expect(AGRICULTURE_CONTEXT.high_plains_aquifer.interpretation).toContain('not a single aquifer-empty date');
  });

  it('links model gaps and keeps every workbench to lookup or qualitative logic', () => {
    expect(strategyGap('GAP-TS-003').legacyGapId).toBe('GAP-TS-003');
    expect(strategyGap('GAP-CLIM-004').legacyGapId).toBe('GAP-CLIM-004');
    expect(strategyGap('GAP-CLIM-005').legacyGapId).toBe('GAP-CLIM-005');
    expect(strategyGap('WGAP-EQUITY').legacyGapId).toBe('WGAP-EQUITY');
    for (const workbench of [ENERGY_PLAN_WORKBENCH, CLIMATE_PLAN_WORKBENCH, FOOD_WORKBENCH, FOOD_WATER_PLAN_WORKBENCH]) {
      expect(workbench.controls.length).toBeGreaterThanOrEqual(2);
      expect(workbench.seamNote.length).toBeGreaterThan(20);
      expect(workbench.layers.every((layer) => !/optimized result|reliability proof|damage total achieved/iu.test(layer.finding))).toBe(true);
    }
  });
});
