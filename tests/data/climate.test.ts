import { describe, expect, it } from 'vitest';

import {
  approvedClimateChart,
  ATTRIBUTION_RANGES,
  BIODIVERSITY_RANGES,
  CAUSE_WORKBENCH_RECORDS,
  CLIMATE_CAUSAL_CHAIN,
  CLIMATE_OBSERVED_PANELS,
  CLIMATE_SOURCES,
  CORRELATION_DIAGNOSTIC,
  DISPLACEMENT_TABLE,
  RISK_LADDER_PANELS,
  RISK_WORKBENCH_RECORDS,
  TCRE_RANGE,
  WARMING_PERIODS,
  WARMING_SCENARIO_TABLE,
} from '../../src/lib/data/climate';

describe('climate evidence adapter', () => {
  it('resolves canonical sources and chart identities', () => {
    expect(CLIMATE_SOURCES.physical.legacyIds).toContain('IPCC-AR6-WGI-SPM');
    expect(approvedClimateChart('climate-causal-chain', 'flow').id).toMatch(/^CHT-/u);
    expect(approvedClimateChart('extreme-heat-response', 'line').legacyIds).toContain('extreme-heat-response');
    expect(approvedClimateChart('climate-risk-priority-matrix', 'matrix').legacyIds).toContain('climate-risk-priority-matrix');
  });

  it('preserves the causal chain and native observation baselines', () => {
    expect(CLIMATE_CAUSAL_CHAIN.nodes).toHaveLength(7);
    expect(CLIMATE_CAUSAL_CHAIN.edges).toHaveLength(6);
    expect(CLIMATE_OBSERVED_PANELS.map((panel) => panel.baseline)).toEqual([
      'Absolute concentration; no anomaly baseline',
      'Relative to 1750',
      '1951–1980 mean',
      '1971–2000 mean',
    ]);
  });

  it('keeps descriptive correlation separate from attribution ranges', () => {
    const levels = CORRELATION_DIAGNOSTIC.find((item) => item.id === 'pearson-levels')?.value ?? 0;
    const changes = CORRELATION_DIAGNOSTIC.find((item) => item.id === 'first-differences')?.value ?? 1;
    expect(levels).toBeGreaterThan(changes);
    const otherHuman = ATTRIBUTION_RANGES.find((item) => item.id === 'other-human');
    expect(otherHuman?.low).toBeLessThanOrEqual(0);
    expect(otherHuman?.high).toBe(0);
  });

  it('retains TCRE bounds and assessed period ranges without annual interpolation', () => {
    expect(TCRE_RANGE[0]).toMatchObject({ low: 0.27, value: 0.45, high: 0.63 });
    expect(WARMING_SCENARIO_TABLE).toHaveLength(15);
    expect(new Set(WARMING_SCENARIO_TABLE.map((row) => row.period))).toEqual(new Set(WARMING_PERIODS));
    expect(WARMING_SCENARIO_TABLE.every((row) => row.veryLikelyLow <= row.bestEstimate && row.bestEstimate <= row.veryLikelyHigh)).toBe(true);
    expect(CAUSE_WORKBENCH_RECORDS).toHaveLength(CLIMATE_OBSERVED_PANELS.length * WARMING_SCENARIO_TABLE.length);
  });

  it('preserves risk domains, assessed ranges, and deliberate gaps', () => {
    for (const panel of RISK_LADDER_PANELS) {
      const values = panel.series[0]?.values.flatMap((point) => point.y === null ? [] : [point.y]) ?? [];
      expect(values.every((value, index) => index === 0 || value >= (values[index - 1] ?? value))).toBe(true);
    }
    expect(BIODIVERSITY_RANGES.every((item) => item.low !== null && item.value !== null && item.high !== null && item.low <= item.value && item.value <= item.high)).toBe(true);
    expect(DISPLACEMENT_TABLE.at(-1)).toMatchObject({ value: null, unit: 'unavailable' });
    expect(RISK_WORKBENCH_RECORDS).toHaveLength(19);
  });

  it('rejects incompatible non-null chart overrides', () => {
    expect(() => approvedClimateChart('climate-causal-chain', 'bar')).toThrow(/registered as flow/u);
  });
});
