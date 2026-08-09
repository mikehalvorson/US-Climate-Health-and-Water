import { allocateCanonicalId } from './namespaces';
import type { ForeignKeyReference, RouteDefinition } from './types';
import type { Supersection } from './values';

const route = (
  sequence: number,
  order: number,
  path: string,
  label: string,
  supersection: Supersection,
  routeKind: RouteDefinition['routeKind'],
  role: string,
  decisionQuestion: string,
  localTabOrder?: number,
): RouteDefinition => ({
  id: allocateCanonicalId('route', sequence),
  registryKind: 'route',
  label,
  description: role,
  status: 'active',
  semanticFingerprint: `route-${path === '/' ? 'overview' : path.slice(1).replaceAll('/', '-')}`,
  order,
  path,
  supersection,
  routeKind,
  role,
  decisionQuestion,
  ...(localTabOrder === undefined ? {} : { localTabOrder }),
});

export const ROUTES = [
  route(1, 0, '/', 'Overview', 'sitewide', 'overview', 'Connect the system and introduce the recommended portfolio.', 'How can reliable energy, a stable climate, secure food and water, and safer material use be advanced together?'),
  route(2, 1, '/energy/system', 'Energy System', 'energy', 'story', 'Explain services, flows, accounting, and electrification.', 'What services does the energy system provide, where does energy come from, and why is electricity becoming more important?', 0),
  route(3, 2, '/energy/demand', 'Demand & Electrification', 'energy', 'story', 'Explain demand growth, end uses, peaks, efficiency, and flexibility.', 'How much electricity will be needed, what drives the range, and which loads can be reduced or shifted without reducing service?', 1),
  route(4, 3, '/energy/generation', 'Generation Choices', 'energy', 'story', 'Compare generation, storage, impacts, and portfolio roles.', 'Which combination of generation, storage, and firm capacity can deliver reliable low-carbon electricity with acceptable burdens?', 2),
  route(5, 4, '/energy/grid', 'Grid & Delivery', 'energy', 'story', 'Explain hourly demand, queues, transmission, process, and supply chains.', 'What prevents generation and flexible demand from connecting and delivering power where and when it is needed?', 3),
  route(6, 5, '/energy/plan', 'Energy Plan', 'energy', 'story', 'Synthesize and stress-test the advocated energy portfolio.', 'What national energy portfolio should be built, in what order, and how does it perform when key assumptions change?', 4),
  route(7, 6, '/climate/cause', 'Cause & Trajectory', 'climate', 'story', 'Explain attribution, cumulative emissions, and warming pathways.', 'What is causing contemporary warming, what determines future temperature, and which emissions cuts change the trajectory?', 0),
  route(8, 7, '/climate/risks', 'Impacts & Risk', 'climate', 'story', 'Explain the temperature-risk ladder and multivariate impacts.', 'What becomes more dangerous with additional warming, who is exposed, and which risks deserve priority?', 1),
  route(9, 8, '/climate/coasts', 'Coasts & Communities', 'climate', 'story', 'Explain local sea level, habitability, adaptation, and migration.', 'How does sea-level rise erode habitability, when should communities protect or relocate assets, and how should receiving places prepare?', 2),
  route(10, 9, '/climate/plan', 'Climate Plan', 'climate', 'story', 'Combine mitigation and adaptation under uncertainty.', 'Which combined mitigation and adaptation strategy performs acceptably across uncertain climate and implementation futures?', 3),
  route(11, 10, '/food-water/freshwater', 'Freshwater Security', 'food_water', 'story', 'Explain use, consumption, sources, risk horizons, and portfolios.', 'Where, when, and why does water become unavailable, and which portfolio best protects essential service?', 0),
  route(12, 11, '/food-water/food', 'Food & Agriculture', 'food_water', 'story', 'Explain nutrition, production, water, climate, waste, and resilience.', 'How can the food system provide affordable nutrition while reducing water, climate, soil, ecosystem, and supply-chain risk?', 1),
  route(13, 12, '/food-water/industry', 'Water for Energy & Industry', 'food_water', 'story', 'Explain facility demand, siting, reuse, and watershed constraints.', 'How should power plants, data centers, manufacturing, and other large facilities grow without exceeding local limits?', 2),
  route(14, 13, '/food-water/plastics', 'Plastics & Materials', 'food_water', 'story', 'Explain flows, health, water, alternatives, and circular strategies.', 'Which plastic uses should be eliminated, reused, captured, redesigned, substituted, or retained?', 3),
  route(15, 14, '/food-water/plan', 'Food & Water Plan', 'food_water', 'story', 'Combine basin, food, industrial, and material portfolios.', 'What portfolio secures essential food and water services across regions while respecting physical and social constraints?', 4),
  route(16, 15, '/methods', 'Evidence & Methods', 'sitewide', 'methods', 'Expose sources, definitions, transformations, models, gaps, and checks.', 'What evidence supports the dashboard, how is it transformed, and what remains unresolved?'),
] as const satisfies readonly RouteDefinition[];

export interface MechanismLink {
  originRouteId: string;
  destinationRouteId: string;
  label: string;
}

export interface SupersectionDefinition {
  key: Exclude<Supersection, 'sitewide'>;
  label: string;
  landingRouteId: string;
  purpose: string;
}

export const SUPERSECTION_DEFINITIONS = [
  { key: 'energy', label: 'Energy', landingRouteId: 'RTE-000002', purpose: 'Reliable, abundant, low-carbon energy and delivery.' },
  { key: 'climate', label: 'Climate', landingRouteId: 'RTE-000007', purpose: 'The causes, risks, and responses shaping climate outcomes.' },
  { key: 'food_water', label: 'Food & Water', landingRouteId: 'RTE-000011', purpose: 'Secure essential services within basin and material limits.' },
] as const satisfies readonly SupersectionDefinition[];

export const MECHANISM_LINKS = [
  { originRouteId: 'RTE-000003', destinationRouteId: 'RTE-000005', label: 'See how annual demand becomes hourly and geographic infrastructure need.' },
  { originRouteId: 'RTE-000004', destinationRouteId: 'RTE-000011', label: 'Continue into cooling, hydrology, and basin constraints.' },
  { originRouteId: 'RTE-000006', destinationRouteId: 'RTE-000007', label: 'Continue from the energy portfolio to emissions and warming.' },
  { originRouteId: 'RTE-000007', destinationRouteId: 'RTE-000008', label: 'Continue from warming to hazard and risk.' },
  { originRouteId: 'RTE-000008', destinationRouteId: 'RTE-000012', label: 'Continue into food-system exposure and resilience.' },
  { originRouteId: 'RTE-000009', destinationRouteId: 'RTE-000011', label: 'Continue into aquifers, drainage, pumping, and saltwater intrusion.' },
  { originRouteId: 'RTE-000013', destinationRouteId: 'RTE-000006', label: 'Continue into large-load demand and generation constraints.' },
  { originRouteId: 'RTE-000014', destinationRouteId: 'RTE-000015', label: 'Continue into replacement-system water, energy, land, and logistics.' },
] as const satisfies readonly MechanismLink[];

export const ROUTE_FOREIGN_KEYS: readonly ForeignKeyReference[] = MECHANISM_LINKS.flatMap((link) => [
  { sourceId: link.originRouteId, field: 'originRouteId', targetKind: 'route', targetId: link.originRouteId },
  { sourceId: link.originRouteId, field: 'destinationRouteId', targetKind: 'route', targetId: link.destinationRouteId },
]);

export function routeByPath(path: string): RouteDefinition | undefined {
  return ROUTES.find((candidate) => candidate.path === path);
}

export function routeById(id: string): RouteDefinition | undefined {
  return ROUTES.find((candidate) => candidate.id === id);
}

export function routesForSupersection(supersection: Exclude<Supersection, 'sitewide'>): readonly RouteDefinition[] {
  return ROUTES.filter((candidate) => candidate.supersection === supersection);
}

export function supersectionLanding(supersection: Exclude<Supersection, 'sitewide'>): RouteDefinition {
  const definition = SUPERSECTION_DEFINITIONS.find((candidate) => candidate.key === supersection);
  const landing = definition ? routeById(definition.landingRouteId) : undefined;
  if (!landing) {
    throw new Error(`Supersection ${supersection} has no route.`);
  }
  return landing;
}

export function previousRoute(id: string): RouteDefinition | undefined {
  const current = routeById(id);
  return current && current.order > 0 ? ROUTES[current.order - 1] : undefined;
}

export function nextRoute(id: string): RouteDefinition | undefined {
  const current = routeById(id);
  return current && current.order < ROUTES.length - 1 ? ROUTES[current.order + 1] : undefined;
}
