import { allocateCanonicalId } from './namespaces';
import type { IntegrityTestDefinition } from './types';
import { INTEGRITY_STATES, type IntegrityState } from './values';

export const INTEGRITY_TEST_REGISTRY = [
  {
    id: allocateCanonicalId('integrity_test', 1),
    registryKind: 'integrity_test',
    label: 'Namespace ownership',
    description: 'Every registry kind has one unique prefix and an executable ID pattern.',
    status: 'active',
    semanticFingerprint: 'integrity-namespace-ownership',
    group: 'registry_identity',
    required: true,
    owner: 'registry',
  },
  {
    id: allocateCanonicalId('integrity_test', 2),
    registryKind: 'integrity_test',
    label: 'Canonical identity',
    description: 'Registry IDs are unique, well formed, stable, and correctly superseded.',
    status: 'active',
    semanticFingerprint: 'integrity-canonical-identity',
    group: 'registry_identity',
    required: true,
    owner: 'registry',
  },
  {
    id: allocateCanonicalId('integrity_test', 3),
    registryKind: 'integrity_test',
    label: 'Controlled vocabulary',
    description: 'Classified values resolve to a declared canonical vocabulary and fail closed.',
    status: 'active',
    semanticFingerprint: 'integrity-controlled-vocabulary',
    group: 'semantic_binding',
    required: true,
    owner: 'registry',
  },
  {
    id: allocateCanonicalId('integrity_test', 4),
    registryKind: 'integrity_test',
    label: 'Route registry',
    description: 'All required routes, supersections, story order, and mechanism links reconcile.',
    status: 'active',
    semanticFingerprint: 'integrity-route-registry',
    group: 'route_and_navigation',
    required: true,
    owner: 'navigation',
  },
  {
    id: allocateCanonicalId('integrity_test', 5),
    registryKind: 'integrity_test',
    label: 'Integrity harness reconciliation',
    description: 'Registered, executed, passed, failed, skipped, pending, and unloaded counts reconcile.',
    status: 'active',
    semanticFingerprint: 'integrity-harness-reconciliation',
    group: 'registry_identity',
    required: true,
    owner: 'integrity',
  },
] as const satisfies readonly IntegrityTestDefinition[];

export interface IntegrityResult {
  testId: string;
  state: Exclude<IntegrityState, 'unloaded'>;
  message: string;
}

export interface IntegritySummary {
  registered: number;
  executed: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  unloaded: number;
  byState: Readonly<Record<IntegrityState, number>>;
}

export function summarizeIntegrity(
  definitions: readonly IntegrityTestDefinition[],
  results: readonly IntegrityResult[],
): IntegritySummary {
  const definitionIds = new Set(definitions.map((definition) => definition.id));
  const seenResults = new Set<string>();

  for (const result of results) {
    if (!definitionIds.has(result.testId)) {
      throw new Error(`Integrity result ${result.testId} is not registered.`);
    }
    if (seenResults.has(result.testId)) {
      throw new Error(`Integrity result ${result.testId} was reported more than once.`);
    }
    seenResults.add(result.testId);
  }

  const byState: Record<IntegrityState, number> = {
    passed: 0,
    failed: 0,
    skipped: 0,
    pending: 0,
    unloaded: definitions.length - results.length,
  };

  for (const result of results) {
    byState[result.state] += 1;
  }

  const summary: IntegritySummary = {
    registered: definitions.length,
    executed: results.length,
    passed: byState.passed,
    failed: byState.failed,
    skipped: byState.skipped,
    pending: byState.pending,
    unloaded: byState.unloaded,
    byState,
  };
  assertIntegritySummary(summary);
  return summary;
}

export function assertIntegritySummary(summary: IntegritySummary): void {
  for (const state of INTEGRITY_STATES) {
    const value = summary.byState[state];
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Integrity state ${state} must have a non-negative integer count.`);
    }
  }

  const stateTotal = INTEGRITY_STATES.reduce((sum, state) => sum + summary.byState[state], 0);
  const reportedTotal = summary.passed + summary.failed + summary.skipped + summary.pending + summary.unloaded;
  if (summary.registered !== stateTotal || summary.registered !== reportedTotal) {
    throw new Error('Integrity registered count does not reconcile to all result states.');
  }
  if (summary.executed !== summary.passed + summary.failed + summary.skipped + summary.pending) {
    throw new Error('Integrity executed count does not reconcile to loaded result states.');
  }
  if (summary.unloaded !== summary.registered - summary.executed) {
    throw new Error('Integrity unloaded count does not reconcile to registered minus executed.');
  }
}
