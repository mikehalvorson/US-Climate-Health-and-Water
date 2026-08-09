import { describe, expect, it } from 'vitest';

import { chapterContentFor, releaseStatusFor } from '../../src/lib/content/release';
import { ROUTES } from '../../src/lib/registry/routes';

describe('chapter release mapping', () => {
  it('releases only the two Step 6 energy vertical slices', () => {
    expect(chapterContentFor('RTE-000002')).toBe('energy-system');
    expect(chapterContentFor('RTE-000003')).toBe('energy-demand');
    expect(ROUTES.filter((route) => releaseStatusFor(route.id) === 'chapter').map((route) => route.id)).toEqual([
      'RTE-000002',
      'RTE-000003',
    ]);
  });

  it('keeps every unreleased route on the honest shell state', () => {
    for (const route of ROUTES.filter((candidate) => !['RTE-000002', 'RTE-000003'].includes(candidate.id))) {
      expect(chapterContentFor(route.id)).toBeNull();
      expect(releaseStatusFor(route.id)).toBe('shell');
    }
  });
});
