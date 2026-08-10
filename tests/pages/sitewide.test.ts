import { describe, expect, it } from 'vitest';

import { OVERVIEW_SCORECARD, overviewChart } from '../../src/lib/data/overview';
import { CANONICAL_REGISTRIES } from '../../src/lib/registry/store';

describe('sitewide Overview reconciliation', () => {
  it('keeps six mixed-unit indicators attached to canonical chapter owners', () => {
    expect(OVERVIEW_SCORECARD).toHaveLength(6);
    expect(OVERVIEW_SCORECARD.map((item) => item.ownerPath)).toEqual([
      '/energy/demand',
      '/energy/generation',
      '/climate/cause',
      '/climate/cause',
      '/food-water/freshwater',
      '/food-water/plastics',
    ]);
    expect(OVERVIEW_SCORECARD.map((item) => item.unit)).toEqual(['TWh', 'TWh', 'GtCO₂', '°C', 'billion_gallons_per_day', 'million_metric_tons']);
    expect(OVERVIEW_SCORECARD.every((item) => item.source.id.startsWith('SRC-') && item.value !== null)).toBe(true);
  });

  it('reuses the canonical values owned by generated chapter registries', () => {
    const metric = (id: string) => CANONICAL_REGISTRIES.metric?.find((item) => item.id === id)?.value;
    expect(OVERVIEW_SCORECARD[1]?.value).toBe(metric('MET-000067'));
    expect(OVERVIEW_SCORECARD[4]?.value).toBe(metric('MET-000092'));
    expect(OVERVIEW_SCORECARD[5]?.value).toBe(metric('MET-000114'));
  });

  it('registers every required Overview figure contract', () => {
    expect(overviewChart('overview-connected-system', 'flow').id).toMatch(/^CHT-/u);
    expect(overviewChart('overview-current-scorecard', 'table').id).toMatch(/^CHT-/u);
    expect(overviewChart('overview-dependency-map', 'matrix').id).toMatch(/^CHT-/u);
    expect(overviewChart('overview-portfolio-architecture', 'flow').id).toMatch(/^CHT-/u);
    expect(overviewChart('overview-outcome-readiness', 'matrix').id).toMatch(/^CHT-/u);
    expect(overviewChart('overview-roadmap', 'flow').id).toMatch(/^CHT-/u);
  });
});
