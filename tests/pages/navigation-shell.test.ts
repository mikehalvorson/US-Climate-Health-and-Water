import { describe, expect, it } from 'vitest';

import {
  chapterNavigationFor,
  hrefForRoute,
  localNavigationFor,
  narrativeProgress,
  primaryNavigationFor,
  STORY_ANCHORS,
} from '../../src/lib/navigation/shell';
import { ROUTES, SUPERSECTION_DEFINITIONS } from '../../src/lib/registry/routes';

describe('application shell navigation', () => {
  it('derives five primary destinations and one active state from canonical routes', () => {
    expect(primaryNavigationFor(ROUTES[0]).map((item) => item.label)).toEqual([
      'Overview', 'Energy', 'Climate', 'Food & Water', 'Evidence & Methods',
    ]);
    for (const route of ROUTES) {
      expect(primaryNavigationFor(route).filter((item) => item.active)).toHaveLength(1);
    }
  });

  it('derives local tab order and active state without a second route list', () => {
    for (const section of SUPERSECTION_DEFINITIONS) {
      const routes = ROUTES.filter((route) => route.supersection === section.key);
      for (const route of routes) {
        const tabs = localNavigationFor(route);
        expect(tabs.map((tab) => tab.id)).toEqual(routes.map((candidate) => candidate.id));
        expect(tabs.filter((tab) => tab.active).map((tab) => tab.id)).toEqual([route.id]);
      }
    }
    expect(localNavigationFor(ROUTES[0])).toEqual([]);
    expect(localNavigationFor(ROUTES[15])).toEqual([]);
  });

  it('keeps normal chapter order separate from mechanism jumps', () => {
    const demand = chapterNavigationFor(ROUTES[2]);
    expect(demand.previous?.id).toBe('RTE-000002');
    expect(demand.next?.id).toBe('RTE-000004');
    expect(demand.mechanisms.map((item) => item.route.id)).toEqual(['RTE-000005']);
  });

  it('builds base-safe links and clear narrative progress', () => {
    expect(hrefForRoute('/', '/US-Climate-Health-and-Water/')).toBe('/US-Climate-Health-and-Water/');
    expect(hrefForRoute('/energy/system', '/US-Climate-Health-and-Water')).toBe('/US-Climate-Health-and-Water/energy/system');
    expect(narrativeProgress(ROUTES[0])).toBe('Overview');
    expect(narrativeProgress(ROUTES[1])).toBe('Chapter 01 of 14');
    expect(narrativeProgress(ROUTES[15])).toBe('Evidence & Methods');
  });

  it('uses the required six-part story rail contract', () => {
    expect(STORY_ANCHORS.map((anchor) => anchor.id)).toEqual([
      'current-system', 'problems', 'choices', 'recommendation', 'model', 'delivery',
    ]);
  });
});
