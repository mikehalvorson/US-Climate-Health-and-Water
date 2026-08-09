import { describe, expect, it } from 'vitest';

import {
  buildBarGeometry,
  buildDotRangeGeometry,
  buildHeatmapGeometry,
  buildLineGeometry,
  buildMapPointGeometry,
  buildNetworkGeometry,
  buildRangeGeometry,
  finiteValues,
  linearScale,
  numericExtent,
} from '../../src/lib/charts/geometry';

const dimensions = { width: 640, height: 320 } as const;

describe('chart geometry contracts', () => {
  it('preserves missing values instead of converting them to zero', () => {
    expect(finiteValues([0, null, 4])).toEqual([0, 4]);
    const bars = buildBarGeometry([
      { id: 'zero', value: 0 },
      { id: 'missing', value: null },
      { id: 'value', value: 5 },
    ], dimensions);
    expect(bars[0]?.missing).toBe(false);
    expect(bars[1]).toMatchObject({ value: null, missing: true, height: 0 });
    expect(bars[2]?.height).toBeGreaterThan(0);
  });

  it('breaks a line at each null and keeps a shared finite domain', () => {
    const geometry = buildLineGeometry([
      { x: 2000, y: 2 },
      { x: 2001, y: null },
      { x: 2002, y: 4 },
      { x: 2003, y: 5 },
    ], dimensions);
    expect(geometry.segments.map((segment) => segment.length)).toEqual([1, 2]);
    expect(geometry.domainX).toEqual([2000, 2003]);
    expect(geometry.segments.flat().every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });

  it('builds valid area, dot-range, heatmap, network, and map context geometry', () => {
    const range = buildRangeGeometry([{ x: 2030, low: 2, high: 4 }, { x: 2040, low: 3, high: 7 }], dimensions);
    expect(range.path.endsWith('Z')).toBe(true);
    expect(range.upper).toHaveLength(2);
    const gappedRange = buildRangeGeometry([
      { x: 2030, low: 2, high: 4 },
      { x: 2035, low: null, high: null },
      { x: 2040, low: 3, high: 7 },
    ], dimensions);
    expect(gappedRange.segments).toHaveLength(2);

    const dots = buildDotRangeGeometry([
      { id: 'known', low: 1, value: 2, high: 3 },
      { id: 'gap', low: null, value: null, high: null },
    ], dimensions);
    expect(dots[0]?.missing).toBe(false);
    expect(dots[1]?.missing).toBe(true);

    const cells = buildHeatmapGeometry(
      [{ row: 'A', column: 'Now', value: 0 }, { row: 'B', column: 'Now', value: null }],
      ['A', 'B'],
      ['Now'],
      dimensions,
    );
    expect(cells.map((cell) => cell.missing)).toEqual([false, true]);

    const network = buildNetworkGeometry(
      [{ id: 'a', x: 0, y: 0.5 }, { id: 'b', x: 1, y: 0.5 }],
      [{ id: 'edge', source: 'a', target: 'b', weight: null }],
      dimensions,
    );
    expect(network.edges[0]).toMatchObject({ missing: true, strokeWidth: 1.5 });

    const points = buildMapPointGeometry([{ id: 'place', longitude: -93, latitude: 45, value: null }], dimensions);
    expect(points[0]?.missing).toBe(true);
  });

  it('handles empty and collapsed domains without invalid geometry', () => {
    expect(numericExtent([])).toEqual([0, 1]);
    const collapsed = numericExtent([4, 4]);
    expect(collapsed[0]).toBeLessThan(4);
    expect(collapsed[1]).toBeGreaterThan(4);
    expect(linearScale([0, 1], [10, 20])(0.5)).toBe(15);
  });

  it('rejects NaN, infinity, invalid dimensions, reversed ranges, and broken references', () => {
    expect(() => finiteValues([Number.NaN])).toThrow(/finite/u);
    expect(() => buildBarGeometry([{ id: 'bad', value: Number.POSITIVE_INFINITY }], dimensions)).toThrow(/finite/u);
    expect(() => buildLineGeometry([{ x: 1, y: 2 }], { width: 10, height: 10 })).toThrow(/plotting area/u);
    expect(() => buildRangeGeometry([{ x: 1, low: 4, high: 2 }], dimensions)).toThrow(/must not exceed/u);
    expect(() => buildDotRangeGeometry([{ id: 'bad', low: 3, value: 2, high: 1 }], dimensions)).toThrow(/must not exceed/u);
    expect(() => buildHeatmapGeometry([{ row: 'B', column: 'Now', value: 1 }], ['A'], ['Now'], dimensions)).toThrow(/outside/u);
    expect(() => buildNetworkGeometry([{ id: 'a', x: 0, y: 0 }], [{ id: 'bad', source: 'a', target: 'b', weight: 1 }], dimensions)).toThrow(/unknown node/u);
    expect(() => buildMapPointGeometry([{ id: 'bad', longitude: 181, latitude: 0 }], dimensions)).toThrow(/bounds/u);
  });
});
