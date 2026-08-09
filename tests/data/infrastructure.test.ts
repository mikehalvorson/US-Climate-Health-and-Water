import { describe, expect, it } from 'vitest';

import {
  approvedGenerationChart,
  GENERATION_CAPACITY_BARS,
  GENERATION_OUTPUT_BARS,
  GENERATION_PORTFOLIO_MATRIX,
  GENERATION_ROLE_MATRIX,
  GENERATION_TECHNOLOGY_CARDS,
  NUCLEAR_COUNT_CONFLICT,
} from '../../src/lib/data/generation';
import {
  approvedGridChart,
  GRID_CALENDAR_VALUES,
  GRID_CAPACITY_DEFINITIONS,
  GRID_CAPACITY_RECORDS,
  GRID_CONTEXT,
  GRID_CORRIDOR_LINES,
  GRID_CORRIDOR_TABLE,
  GRID_DAILY_RECORDS,
  GRID_HOURLY_SERIES,
  GRID_PROCESS_NODES,
} from '../../src/lib/data/grid';

describe('generation and grid evidence adapters', () => {
  it('keeps generation roles and output measures separate', () => {
    expect(GENERATION_ROLE_MATRIX).toHaveLength(45);
    expect(GENERATION_CAPACITY_BARS).toHaveLength(7);
    expect(GENERATION_OUTPUT_BARS).toHaveLength(7);
    expect(GENERATION_TECHNOLOGY_CARDS).toHaveLength(16);
    expect(approvedGenerationChart('generation-capacity-versus-output', 'bar').chartType).toBe('bar');
  });

  it('retains official nuclear count conflicts and portfolio coefficient gaps', () => {
    expect(NUCLEAR_COUNT_CONFLICT.nrc?.value).not.toBe(NUCLEAR_COUNT_CONFLICT.eia?.value);
    expect(NUCLEAR_COUNT_CONFLICT.guardrail).toMatch(/not reconcile|do not|must not/iu);
    expect(GENERATION_PORTFOLIO_MATRIX.filter((item) => item.column === 'Compatible all-impact ledger').every((item) => item.value === null)).toBe(true);
  });

  it('releases exactly twenty map features with matching table records', () => {
    expect(GRID_CORRIDOR_LINES).toHaveLength(20);
    expect(GRID_CORRIDOR_TABLE).toHaveLength(GRID_CORRIDOR_LINES.length);
    expect(GRID_CONTEXT.corridorCount).toBe(20);
    expect(GRID_CORRIDOR_LINES.every((item) => /approximate|schematic/iu.test(item.geometry_quality))).toBe(true);
    expect(approvedGridChart('TR-CH-005', 'map').chartType).toBe('map');
  });

  it('preserves missing hourly observations as null rather than zero', () => {
    const missingDay = GRID_DAILY_RECORDS.find((item) => item.balancingAuthority === 'CISO' && item.date === '2024-11-02');
    const missingCell = GRID_CALENDAR_VALUES.find((item) => item.date === '2024-11-02');
    expect(missingDay).toMatchObject({ peakMw: null, missingHours: 24 });
    expect(missingCell).toMatchObject({ value: null, missingHours: 24 });
    expect(GRID_HOURLY_SERIES[0]?.values).toHaveLength(168);
  });

  it('never authorizes summing capacity meanings or a universal process duration', () => {
    expect(GRID_CAPACITY_RECORDS.length).toBeGreaterThan(20);
    expect(GRID_CAPACITY_DEFINITIONS.every((item) => item.mayBeSummed === 'No')).toBe(true);
    expect(GRID_PROCESS_NODES).toHaveLength(25);
    expect(GRID_CONTEXT.processDurationRule).toMatch(/not|no single|cannot/iu);
  });
});
