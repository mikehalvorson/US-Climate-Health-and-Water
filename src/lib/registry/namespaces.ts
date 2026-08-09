import type { RegistryKind } from './types';

export interface NamespaceDefinition {
  kind: RegistryKind;
  prefix: string;
  pattern: string;
  owner: string;
  description: string;
}

export const REGISTRY_KINDS = [
  'source',
  'claim',
  'dataset',
  'metric',
  'parameter',
  'scenario',
  'chart',
  'transformation',
  'model',
  'route',
  'vocabulary',
  'denominator',
  'open_item',
  'integrity_test',
] as const satisfies readonly RegistryKind[];

const numericPattern = (prefix: string) => `^${prefix}-[0-9]{6}$`;

export const NAMESPACE_DEFINITIONS: Readonly<Record<RegistryKind, NamespaceDefinition>> = {
  source: { kind: 'source', prefix: 'SRC', pattern: numericPattern('SRC'), owner: 'evidence', description: 'Canonical source identities.' },
  claim: { kind: 'claim', prefix: 'CLM', pattern: numericPattern('CLM'), owner: 'evidence', description: 'Canonical public and supporting claims.' },
  dataset: { kind: 'dataset', prefix: 'DAT', pattern: numericPattern('DAT'), owner: 'data', description: 'Canonical datasets and published subsets.' },
  metric: { kind: 'metric', prefix: 'MET', pattern: numericPattern('MET'), owner: 'data', description: 'Canonical observed, derived, and modeled metrics.' },
  parameter: { kind: 'parameter', prefix: 'PAR', pattern: numericPattern('PAR'), owner: 'models', description: 'Canonical load-bearing model and transformation parameters.' },
  scenario: { kind: 'scenario', prefix: 'SCN', pattern: numericPattern('SCN'), owner: 'models', description: 'Canonical source, dashboard, and stress scenarios.' },
  chart: { kind: 'chart', prefix: 'CHT', pattern: numericPattern('CHT'), owner: 'charts', description: 'Canonical chart and evidence-gap contracts.' },
  transformation: { kind: 'transformation', prefix: 'TRN', pattern: numericPattern('TRN'), owner: 'data', description: 'Canonical transformations and accounting adapters.' },
  model: { kind: 'model', prefix: 'MOD', pattern: numericPattern('MOD'), owner: 'models', description: 'Canonical accounting, source-response, and strategy models.' },
  route: { kind: 'route', prefix: 'RTE', pattern: numericPattern('RTE'), owner: 'navigation', description: 'Canonical public routes and narrative order.' },
  vocabulary: { kind: 'vocabulary', prefix: 'VOC', pattern: numericPattern('VOC'), owner: 'registry', description: 'Canonical controlled vocabularies.' },
  denominator: { kind: 'denominator', prefix: 'DEN', pattern: numericPattern('DEN'), owner: 'data', description: 'Canonical population, household, facility, and geographic denominators.' },
  open_item: { kind: 'open_item', prefix: 'OPN', pattern: numericPattern('OPN'), owner: 'integrity', description: 'Canonical research, evidence, model, and implementation gaps.' },
  integrity_test: { kind: 'integrity_test', prefix: 'TST', pattern: numericPattern('TST'), owner: 'integrity', description: 'Canonical integrity checks surfaced by the dashboard.' },
};

export function isCanonicalId(kind: RegistryKind, id: string): boolean {
  return new RegExp(NAMESPACE_DEFINITIONS[kind].pattern).test(id);
}

export function allocateCanonicalId(kind: RegistryKind, sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 999_999) {
    throw new RangeError(`Sequence for ${kind} must be an integer from 1 through 999999.`);
  }
  return `${NAMESPACE_DEFINITIONS[kind].prefix}-${String(sequence).padStart(6, '0')}`;
}

export function assertNamespaceDefinitions(): void {
  const prefixes = new Set<string>();
  for (const kind of REGISTRY_KINDS) {
    const definition = NAMESPACE_DEFINITIONS[kind];
    if (definition.kind !== kind) {
      throw new Error(`Namespace key ${kind} declares the wrong record kind ${definition.kind}.`);
    }
    if (prefixes.has(definition.prefix)) {
      throw new Error(`Namespace prefix ${definition.prefix} is owned more than once.`);
    }
    prefixes.add(definition.prefix);
    const example = allocateCanonicalId(kind, 1);
    if (!new RegExp(definition.pattern).test(example)) {
      throw new Error(`Namespace pattern for ${kind} rejects its allocated example ${example}.`);
    }
  }
}
