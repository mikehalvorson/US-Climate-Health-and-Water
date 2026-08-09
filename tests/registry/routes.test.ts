import { describe, expect, it } from 'vitest';

import {
  assertForeignKeys,
  assertRegistry,
  CANONICAL_REGISTRIES,
  MECHANISM_LINKS,
  nextRoute,
  previousRoute,
  ROUTE_FOREIGN_KEYS,
  ROUTES,
  SUPERSECTION_DEFINITIONS,
  routesForSupersection,
  supersectionLanding,
} from '../../src/lib/registry';

const expectedPaths = [
  '/',
  '/energy/system',
  '/energy/demand',
  '/energy/generation',
  '/energy/grid',
  '/energy/plan',
  '/climate/cause',
  '/climate/risks',
  '/climate/coasts',
  '/climate/plan',
  '/food-water/freshwater',
  '/food-water/food',
  '/food-water/industry',
  '/food-water/plastics',
  '/food-water/plan',
  '/methods',
];

describe('route registry', () => {
  it('contains all 16 routes in the required narrative order', () => {
    expect(() => assertRegistry('route', ROUTES)).not.toThrow();
    expect(ROUTES).toHaveLength(16);
    expect(ROUTES.map((route) => route.path)).toEqual(expectedPaths);
    expect(ROUTES.map((route) => route.order)).toEqual([...Array(16).keys()]);
  });

  it('owns contiguous local-tab order and supersection landings', () => {
    expect(SUPERSECTION_DEFINITIONS.map((section) => section.landingRouteId)).toEqual(['RTE-000002', 'RTE-000007', 'RTE-000011']);
    expect(routesForSupersection('energy').map((route) => route.localTabOrder)).toEqual([0, 1, 2, 3, 4]);
    expect(routesForSupersection('climate').map((route) => route.localTabOrder)).toEqual([0, 1, 2, 3]);
    expect(routesForSupersection('food_water').map((route) => route.localTabOrder)).toEqual([0, 1, 2, 3, 4]);
    expect(supersectionLanding('energy').path).toBe('/energy/system');
    expect(supersectionLanding('climate').path).toBe('/climate/cause');
    expect(supersectionLanding('food_water').path).toBe('/food-water/freshwater');
  });

  it('derives previous and next chapters from one canonical order', () => {
    expect(previousRoute('RTE-000001')).toBeUndefined();
    expect(nextRoute('RTE-000001')?.id).toBe('RTE-000002');
    expect(previousRoute('RTE-000016')?.id).toBe('RTE-000015');
    expect(nextRoute('RTE-000016')).toBeUndefined();
  });

  it('resolves every mechanism link without changing normal story order', () => {
    expect(MECHANISM_LINKS).toHaveLength(8);
    expect(() => assertForeignKeys(ROUTE_FOREIGN_KEYS, CANONICAL_REGISTRIES)).not.toThrow();
  });
});
