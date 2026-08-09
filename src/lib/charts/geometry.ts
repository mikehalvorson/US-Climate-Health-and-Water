export interface ChartInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  insets?: Partial<ChartInsets>;
}

export interface Point {
  x: number;
  y: number;
}

export interface NullablePointInput {
  x: number;
  y: number | null;
}

export interface LineGeometry {
  domainX: readonly [number, number];
  domainY: readonly [number, number];
  segments: readonly (readonly Point[])[];
}

export interface RangeInput {
  x: number;
  low: number | null;
  high: number | null;
}

export interface RangeGeometry {
  domainX: readonly [number, number];
  domainY: readonly [number, number];
  upper: readonly Point[];
  lower: readonly Point[];
  path: string;
  segments: readonly {
    upper: readonly Point[];
    lower: readonly Point[];
    path: string;
  }[];
}

export interface BarInput {
  id: string;
  value: number | null;
}

export interface BarGeometry {
  id: string;
  value: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  missing: boolean;
}

export interface DotRangeInput {
  id: string;
  low: number | null;
  value: number | null;
  high: number | null;
}

export interface DotRangeGeometry {
  id: string;
  lowX: number | null;
  valueX: number | null;
  highX: number | null;
  y: number;
  missing: boolean;
}

export interface HeatmapInput {
  row: string;
  column: string;
  value: number | null;
}

export interface HeatmapCellGeometry extends HeatmapInput {
  x: number;
  y: number;
  width: number;
  height: number;
  missing: boolean;
}

export interface NetworkNodeInput {
  id: string;
  x: number;
  y: number;
}

export interface NetworkEdgeInput {
  id: string;
  source: string;
  target: string;
  weight: number | null;
}

export interface NetworkGeometry {
  nodes: readonly (NetworkNodeInput & Point)[];
  edges: readonly (NetworkEdgeInput & { path: string; strokeWidth: number; missing: boolean })[];
}

export interface MapPointInput {
  id: string;
  longitude: number;
  latitude: number;
  value?: number | null;
}

export interface MapPointGeometry extends MapPointInput, Point {
  missing: boolean;
}

const DEFAULT_INSETS: ChartInsets = { top: 18, right: 18, bottom: 36, left: 48 };

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
  return value;
}

function nonNegative(value: number, label: string): number {
  const checked = finite(value, label);
  if (checked < 0) throw new RangeError(`${label} must not be negative.`);
  return checked;
}

function normalized(value: number, label: string): number {
  const checked = finite(value, label);
  if (checked < 0 || checked > 1) throw new RangeError(`${label} must be between 0 and 1.`);
  return checked;
}

function layout(dimensions: ChartDimensions) {
  const width = finite(dimensions.width, 'Chart width');
  const height = finite(dimensions.height, 'Chart height');
  const insets = { ...DEFAULT_INSETS, ...dimensions.insets };
  for (const [key, value] of Object.entries(insets)) nonNegative(value, `Chart inset ${key}`);
  const innerWidth = width - insets.left - insets.right;
  const innerHeight = height - insets.top - insets.bottom;
  if (innerWidth <= 0 || innerHeight <= 0) throw new RangeError('Chart dimensions must leave a positive plotting area.');
  return { width, height, insets, innerWidth, innerHeight };
}

export function finiteValues(values: readonly (number | null | undefined)[]): number[] {
  return values.flatMap((value, index) => {
    if (value === null || value === undefined) return [];
    return [finite(value, `Value ${index + 1}`)];
  });
}

export function numericExtent(
  values: readonly (number | null | undefined)[],
  options: { includeZero?: boolean; padding?: number } = {},
): readonly [number, number] {
  const present = finiteValues(values);
  if (present.length === 0) return [0, 1];
  let low = Math.min(...present);
  let high = Math.max(...present);
  if (options.includeZero) {
    low = Math.min(0, low);
    high = Math.max(0, high);
  }
  if (low === high) {
    const expansion = Math.max(Math.abs(low) * 0.05, 1);
    low -= expansion;
    high += expansion;
  }
  const padding = nonNegative(options.padding ?? 0.04, 'Domain padding');
  const expansion = (high - low) * padding;
  return [low - expansion, high + expansion];
}

export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [domainStart, domainEnd] = domain.map((value, index) => finite(value, `Domain ${index + 1}`)) as [number, number];
  const [rangeStart, rangeEnd] = range.map((value, index) => finite(value, `Range ${index + 1}`)) as [number, number];
  if (domainStart === domainEnd) throw new RangeError('A scale domain must contain two distinct values.');
  return (value: number) => {
    const checked = finite(value, 'Scaled value');
    return rangeStart + ((checked - domainStart) / (domainEnd - domainStart)) * (rangeEnd - rangeStart);
  };
}

export function linePath(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${finite(point.x, 'Point x')} ${finite(point.y, 'Point y')}`).join(' ');
}

export function buildLineGeometry(
  values: readonly NullablePointInput[],
  dimensions: ChartDimensions,
  domains: { x?: readonly [number, number]; y?: readonly [number, number] } = {},
): LineGeometry {
  const { insets, innerWidth, innerHeight } = layout(dimensions);
  const present = values.filter((point) => point.y !== null);
  const domainX = domains.x ?? numericExtent(present.map((point) => point.x), { padding: 0 });
  const domainY = domains.y ?? numericExtent(present.map((point) => point.y));
  const scaleX = linearScale(domainX, [insets.left, insets.left + innerWidth]);
  const scaleY = linearScale(domainY, [insets.top + innerHeight, insets.top]);
  const segments: Point[][] = [];
  let segment: Point[] = [];
  for (const point of values) {
    finite(point.x, 'Line x');
    if (point.y === null) {
      if (segment.length) segments.push(segment);
      segment = [];
      continue;
    }
    segment.push({ x: scaleX(point.x), y: scaleY(finite(point.y, 'Line y')) });
  }
  if (segment.length) segments.push(segment);
  return { domainX, domainY, segments };
}

export function buildRangeGeometry(values: readonly RangeInput[], dimensions: ChartDimensions): RangeGeometry {
  const { insets, innerWidth, innerHeight } = layout(dimensions);
  const complete = values.filter((point) => point.low !== null && point.high !== null);
  for (const point of values) {
    finite(point.x, 'Range x');
    if (point.low !== null && point.high !== null && finite(point.low, 'Range low') > finite(point.high, 'Range high')) {
      throw new RangeError('Range low must not exceed range high.');
    }
  }
  const domainX = numericExtent(complete.map((point) => point.x), { padding: 0 });
  const domainY = numericExtent(complete.flatMap((point) => [point.low, point.high]));
  const scaleX = linearScale(domainX, [insets.left, insets.left + innerWidth]);
  const scaleY = linearScale(domainY, [insets.top + innerHeight, insets.top]);
  const runs: RangeInput[][] = [];
  let run: RangeInput[] = [];
  for (const point of values) {
    if (point.low === null || point.high === null) {
      if (run.length) runs.push(run);
      run = [];
      continue;
    }
    run.push(point);
  }
  if (run.length) runs.push(run);
  const segments = runs.map((points) => {
    const upper = points.map((point) => ({ x: scaleX(point.x), y: scaleY(point.high as number) }));
    const lower = points.map((point) => ({ x: scaleX(point.x), y: scaleY(point.low as number) })).reverse();
    return { upper, lower, path: `${linePath(upper)} ${linePath(lower).replace(/^M/u, 'L')} Z` };
  });
  const upper = segments.flatMap((segment) => segment.upper);
  const lower = segments.flatMap((segment) => segment.lower);
  const path = segments.map((segment) => segment.path).join(' ');
  return { domainX, domainY, upper, lower, path, segments };
}

export function buildBarGeometry(values: readonly BarInput[], dimensions: ChartDimensions): readonly BarGeometry[] {
  const { insets, innerWidth, innerHeight } = layout(dimensions);
  if (values.length === 0) return [];
  const domain = numericExtent(values.map((item) => item.value), { includeZero: true, padding: 0 });
  const scaleY = linearScale(domain, [insets.top + innerHeight, insets.top]);
  const baseline = scaleY(0);
  const step = innerWidth / values.length;
  const width = Math.max(1, step * 0.68);
  return values.map((item, index) => {
    if (item.value === null) {
      return { ...item, x: insets.left + index * step + (step - width) / 2, y: baseline, width, height: 0, missing: true };
    }
    const valueY = scaleY(finite(item.value, `Bar ${item.id}`));
    return {
      ...item,
      x: insets.left + index * step + (step - width) / 2,
      y: Math.min(valueY, baseline),
      width,
      height: Math.max(0, Math.abs(baseline - valueY)),
      missing: false,
    };
  });
}

export function buildDotRangeGeometry(values: readonly DotRangeInput[], dimensions: ChartDimensions): readonly DotRangeGeometry[] {
  const { insets, innerWidth, innerHeight } = layout(dimensions);
  if (values.length === 0) return [];
  for (const item of values) {
    if (item.low !== null && item.high !== null && finite(item.low, `${item.id} low`) > finite(item.high, `${item.id} high`)) {
      throw new RangeError(`${item.id} low must not exceed high.`);
    }
  }
  const domain = numericExtent(values.flatMap((item) => [item.low, item.value, item.high]));
  const scaleX = linearScale(domain, [insets.left, insets.left + innerWidth]);
  const step = innerHeight / values.length;
  const position = (value: number | null) => value === null ? null : scaleX(finite(value, 'Dot-range value'));
  return values.map((item, index) => ({
    id: item.id,
    lowX: position(item.low),
    valueX: position(item.value),
    highX: position(item.high),
    y: insets.top + step * (index + 0.5),
    missing: item.low === null && item.value === null && item.high === null,
  }));
}

export function buildHeatmapGeometry(
  values: readonly HeatmapInput[],
  rows: readonly string[],
  columns: readonly string[],
  dimensions: ChartDimensions,
): readonly HeatmapCellGeometry[] {
  const { insets, innerWidth, innerHeight } = layout(dimensions);
  if (!rows.length || !columns.length) return [];
  if (new Set(rows).size !== rows.length || new Set(columns).size !== columns.length) {
    throw new RangeError('Heatmap row and column identities must be unique.');
  }
  const width = innerWidth / columns.length;
  const height = innerHeight / rows.length;
  return values.map((item) => {
    const row = rows.indexOf(item.row);
    const column = columns.indexOf(item.column);
    if (row < 0 || column < 0) throw new RangeError(`Heatmap cell ${item.row}/${item.column} is outside the declared matrix.`);
    if (item.value !== null) finite(item.value, `Heatmap ${item.row}/${item.column}`);
    return {
      ...item,
      x: insets.left + column * width,
      y: insets.top + row * height,
      width,
      height,
      missing: item.value === null,
    };
  });
}

export function buildNetworkGeometry(
  nodes: readonly NetworkNodeInput[],
  edges: readonly NetworkEdgeInput[],
  dimensions: ChartDimensions,
): NetworkGeometry {
  const { insets, innerWidth, innerHeight } = layout(dimensions);
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodeIds.size !== nodes.length) throw new RangeError('Network node identities must be unique.');
  const positioned = nodes.map((node) => ({
    ...node,
    x: insets.left + normalized(node.x, `${node.id} x`) * innerWidth,
    y: insets.top + normalized(node.y, `${node.id} y`) * innerHeight,
  }));
  const byId = new Map(positioned.map((node) => [node.id, node]));
  const weights = finiteValues(edges.map((edge) => edge.weight));
  const maximum = Math.max(...weights, 1);
  const positionedEdges = edges.map((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new RangeError(`Network edge ${edge.id} references an unknown node.`);
    }
    if (edge.weight !== null && finite(edge.weight, `${edge.id} weight`) < 0) {
      throw new RangeError(`Network edge ${edge.id} weight must not be negative.`);
    }
    const midpoint = (source.x + target.x) / 2;
    return {
      ...edge,
      path: `M ${source.x} ${source.y} C ${midpoint} ${source.y}, ${midpoint} ${target.y}, ${target.x} ${target.y}`,
      strokeWidth: edge.weight === null ? 1.5 : Math.max(1.5, (edge.weight / maximum) * 16),
      missing: edge.weight === null,
    };
  });
  return { nodes: positioned, edges: positionedEdges };
}

export function buildMapPointGeometry(values: readonly MapPointInput[], dimensions: ChartDimensions): readonly MapPointGeometry[] {
  const { insets, innerWidth, innerHeight } = layout(dimensions);
  const scaleLongitude = linearScale([-180, 180], [insets.left, insets.left + innerWidth]);
  const scaleLatitude = linearScale([-90, 90], [insets.top + innerHeight, insets.top]);
  return values.map((item) => {
    const longitude = finite(item.longitude, `${item.id} longitude`);
    const latitude = finite(item.latitude, `${item.id} latitude`);
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new RangeError(`Map point ${item.id} is outside valid longitude/latitude bounds.`);
    }
    if (item.value !== undefined && item.value !== null) finite(item.value, `${item.id} value`);
    return {
      ...item,
      x: scaleLongitude(longitude),
      y: scaleLatitude(latitude),
      missing: item.value === null,
    };
  });
}
