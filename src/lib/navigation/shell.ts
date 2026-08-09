import {
  MECHANISM_LINKS,
  nextRoute,
  previousRoute,
  routeById,
  ROUTES,
  routesForSupersection,
  SUPERSECTION_DEFINITIONS,
} from '../registry/routes';
import type { RouteDefinition } from '../registry/types';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  active: boolean;
}

export interface ChapterNavigation {
  previous?: RouteDefinition;
  next?: RouteDefinition;
  mechanisms: readonly { route: RouteDefinition; label: string }[];
}

export const STORY_ANCHORS = [
  { id: 'current-system', label: 'Current system' },
  { id: 'problems', label: 'Problems' },
  { id: 'choices', label: 'Choices' },
  { id: 'recommendation', label: 'Recommendation' },
  { id: 'model', label: 'Model' },
  { id: 'delivery', label: 'Delivery' },
] as const;

export function hrefForRoute(path: string, base = '/'): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  if (path === '/') return normalizedBase;
  return `${normalizedBase}${path.replace(/^\//u, '')}`;
}

export function primaryNavigationFor(current: RouteDefinition): readonly NavigationItem[] {
  const overview = ROUTES[0];
  const methods = ROUTES.at(-1);
  if (!overview || !methods) throw new Error('Primary sitewide routes are missing.');
  return [
    { id: overview.id, label: overview.label, path: overview.path, active: current.id === overview.id },
    ...SUPERSECTION_DEFINITIONS.map((definition) => {
      const landing = routeById(definition.landingRouteId);
      if (!landing) throw new Error(`Missing landing route ${definition.landingRouteId}.`);
      return { id: landing.id, label: definition.label, path: landing.path, active: current.supersection === definition.key };
    }),
    { id: methods.id, label: methods.label, path: methods.path, active: current.id === methods.id },
  ];
}

export function localNavigationFor(current: RouteDefinition): readonly NavigationItem[] {
  if (current.supersection === 'sitewide') return [];
  return routesForSupersection(current.supersection).map((route) => ({
    id: route.id,
    label: route.label,
    path: route.path,
    active: route.id === current.id,
  }));
}

export function chapterNavigationFor(current: RouteDefinition): ChapterNavigation {
  const previous = previousRoute(current.id);
  const next = nextRoute(current.id);
  return {
    ...(previous ? { previous } : {}),
    ...(next ? { next } : {}),
    mechanisms: MECHANISM_LINKS.filter((link) => link.originRouteId === current.id).flatMap((link) => {
      const route = routeById(link.destinationRouteId);
      return route ? [{ route, label: link.label }] : [];
    }),
  };
}

export function narrativeProgress(current: RouteDefinition): string {
  if (current.routeKind === 'overview') return 'Overview';
  if (current.routeKind === 'methods') return 'Evidence & Methods';
  return `Chapter ${String(current.order).padStart(2, '0')} of 14`;
}
