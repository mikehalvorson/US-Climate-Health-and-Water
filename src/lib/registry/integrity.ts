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
  {
    id: allocateCanonicalId('integrity_test', 6),
    registryKind: 'integrity_test',
    label: 'Source and claim fidelity',
    description: 'Every published claim retains registered sources, evidence state, geography, period, confidence, and a misuse guardrail.',
    status: 'active',
    semanticFingerprint: 'integrity-source-claim-fidelity',
    group: 'source_and_claim',
    required: true,
    owner: 'evidence',
  },
  {
    id: allocateCanonicalId('integrity_test', 7),
    registryKind: 'integrity_test',
    label: 'Data schema and null preservation',
    description: 'Datasets, metrics, denominators, and parameters keep declared units, boundaries, use classes, participation, and missing values.',
    status: 'active',
    semanticFingerprint: 'integrity-data-schema-null-preservation',
    group: 'data_schema',
    required: true,
    owner: 'data',
  },
  {
    id: allocateCanonicalId('integrity_test', 8),
    registryKind: 'integrity_test',
    label: 'Scenario authorization',
    description: 'Reference, recommended, stress, source, planning, and sensitivity cases resolve to one registered model without family splicing.',
    status: 'active',
    semanticFingerprint: 'integrity-scenario-authorization',
    group: 'scenario',
    required: true,
    owner: 'modeling',
  },
  {
    id: allocateCanonicalId('integrity_test', 9),
    registryKind: 'integrity_test',
    label: 'Model boundary publication',
    description: 'Every model publishes version, inputs, outputs, interpretation, validation requirements, and prohibited interpretations.',
    status: 'active',
    semanticFingerprint: 'integrity-model-boundary-publication',
    group: 'model',
    required: true,
    owner: 'modeling',
  },
  {
    id: allocateCanonicalId('integrity_test', 10),
    registryKind: 'integrity_test',
    label: 'Chart alternatives and caveats',
    description: 'Published figures expose decision questions, accessible tables, text summaries, annotations, sources, empty states, and forbidden comparisons.',
    status: 'active',
    semanticFingerprint: 'integrity-chart-alternatives-caveats',
    group: 'chart',
    required: true,
    owner: 'visualization',
  },
  {
    id: allocateCanonicalId('integrity_test', 11),
    registryKind: 'integrity_test',
    label: 'Public download provenance',
    description: 'Public registry downloads publish record counts, evidence vintage, and SHA-256 checksums that reconcile to served files.',
    status: 'active',
    semanticFingerprint: 'integrity-public-download-provenance',
    group: 'data_schema',
    required: true,
    owner: 'publication',
  },
  {
    id: allocateCanonicalId('integrity_test', 12),
    registryKind: 'integrity_test',
    label: 'Cross-viewport browser review',
    description: 'Keyboard, contrast, focus, overflow, interactive state, and visual layout receive final browser and viewport inspection.',
    status: 'active',
    semanticFingerprint: 'integrity-cross-viewport-browser-review',
    group: 'accessibility',
    required: true,
    owner: 'publication',
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

export const PUBLIC_INTEGRITY_RESULTS: readonly IntegrityResult[] = [
  { testId: 'TST-000001', state: 'passed', message: 'Executable namespace ownership tests pass.' },
  { testId: 'TST-000002', state: 'passed', message: 'Canonical identities, legacy mappings, and foreign keys reconcile.' },
  { testId: 'TST-000003', state: 'passed', message: 'Controlled vocabulary validation fails closed and passes the registered records.' },
  { testId: 'TST-000004', state: 'passed', message: 'All 16 routes, story order, and required mechanism links reconcile.' },
  { testId: 'TST-000005', state: 'passed', message: 'Integrity totals reconcile across every result state.' },
  { testId: 'TST-000006', state: 'passed', message: 'Source and claim registry fidelity checks pass.' },
  { testId: 'TST-000007', state: 'passed', message: 'Schema, unit, boundary, participation, and null-preservation tests pass.' },
  { testId: 'TST-000008', state: 'passed', message: 'Scenario identities and model-family boundaries pass.' },
  { testId: 'TST-000009', state: 'passed', message: 'Model registry publication contracts pass.' },
  { testId: 'TST-000010', state: 'passed', message: 'Figure contracts publish accessible alternatives and caveats.' },
  { testId: 'TST-000011', state: 'passed', message: 'Public data manifest checksums and record counts reconcile.' },
  { testId: 'TST-000012', state: 'passed', message: 'Keyboard, theme, interaction, and overflow checks pass across the Step 13 viewport review matrix.' },
];

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
