import { describe, expect, it } from 'vitest';

import { chapterContentFor, releaseStatusFor } from '../../src/lib/content/release';
import { ROUTES } from '../../src/lib/registry/routes';

describe('chapter release mapping', () => {
  it('releases all fourteen completed story chapters', () => {
    expect(chapterContentFor('RTE-000002')).toBe('energy-system');
    expect(chapterContentFor('RTE-000003')).toBe('energy-demand');
    expect(chapterContentFor('RTE-000004')).toBe('generation-choices');
    expect(chapterContentFor('RTE-000005')).toBe('grid-delivery');
    expect(chapterContentFor('RTE-000006')).toBe('energy-plan');
    expect(chapterContentFor('RTE-000007')).toBe('climate-cause');
    expect(chapterContentFor('RTE-000008')).toBe('climate-risks');
    expect(chapterContentFor('RTE-000009')).toBe('coasts-communities');
    expect(chapterContentFor('RTE-000010')).toBe('climate-plan');
    expect(chapterContentFor('RTE-000011')).toBe('freshwater-security');
    expect(chapterContentFor('RTE-000012')).toBe('food-agriculture');
    expect(chapterContentFor('RTE-000013')).toBe('industry-water');
    expect(chapterContentFor('RTE-000014')).toBe('plastics-materials');
    expect(chapterContentFor('RTE-000015')).toBe('food-water-plan');
    expect(ROUTES.filter((route) => releaseStatusFor(route.id) === 'chapter').map((route) => route.id)).toEqual(ROUTES.map((route) => route.id));
  });

  it('keeps overview and methods on their dedicated non-chapter surfaces', () => {
    for (const route of ROUTES.filter((candidate) => ['RTE-000001', 'RTE-000016'].includes(candidate.id))) {
      expect(chapterContentFor(route.id)).toBeNull();
      expect(releaseStatusFor(route.id)).toBe('chapter');
    }
  });
});
