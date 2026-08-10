import { describe, expect, it } from 'vitest';

import {
  assertIntegritySummary,
  assertRegistry,
  INTEGRITY_TEST_REGISTRY,
  PUBLIC_INTEGRITY_RESULTS,
  summarizeIntegrity,
  type IntegrityResult,
  type IntegritySummary,
} from '../../src/lib/registry';

describe('unified integrity harness', () => {
  it('registers stable integrity test identities', () => {
    expect(() => assertRegistry('integrity_test', INTEGRITY_TEST_REGISTRY)).not.toThrow();
    expect(INTEGRITY_TEST_REGISTRY).toHaveLength(12);
  });

  it('counts absent results as unloaded instead of hiding them', () => {
    const summary = summarizeIntegrity(INTEGRITY_TEST_REGISTRY, []);
    expect(summary).toMatchObject({ registered: 12, executed: 0, unloaded: 12, passed: 0 });
  });

  it('reconciles passed, failed, skipped, and pending results', () => {
    const results: IntegrityResult[] = [
      { testId: 'TST-000001', state: 'passed', message: 'Passed.' },
      { testId: 'TST-000002', state: 'failed', message: 'Failed.' },
      { testId: 'TST-000003', state: 'skipped', message: 'Skipped explicitly.' },
      { testId: 'TST-000004', state: 'pending', message: 'Pending and visible.' },
    ];
    const summary = summarizeIntegrity(INTEGRITY_TEST_REGISTRY, results);
    expect(summary).toMatchObject({
      registered: 12,
      executed: 4,
      passed: 1,
      failed: 1,
      skipped: 1,
      pending: 1,
      unloaded: 8,
    });
  });

  it('publishes a fully reconciled sitewide result feed without hiding pending review', () => {
    const summary = summarizeIntegrity(INTEGRITY_TEST_REGISTRY, PUBLIC_INTEGRITY_RESULTS);
    expect(summary).toMatchObject({ registered: 12, executed: 12, passed: 11, failed: 0, skipped: 0, pending: 1, unloaded: 0 });
  });

  it('rejects unknown and duplicate test results', () => {
    expect(() => summarizeIntegrity(INTEGRITY_TEST_REGISTRY, [
      { testId: 'TST-999999', state: 'passed', message: 'Unknown.' },
    ])).toThrow('is not registered');

    const duplicate: IntegrityResult = { testId: 'TST-000001', state: 'passed', message: 'Duplicate.' };
    expect(() => summarizeIntegrity(INTEGRITY_TEST_REGISTRY, [duplicate, duplicate])).toThrow('more than once');
  });

  it('rejects a summary whose advertised counts do not reconcile', () => {
    const invalid: IntegritySummary = {
      registered: 12,
      executed: 12,
      passed: 12,
      failed: 0,
      skipped: 0,
      pending: 0,
      unloaded: 1,
      byState: { passed: 12, failed: 0, skipped: 0, pending: 0, unloaded: 1 },
    };
    expect(() => assertIntegritySummary(invalid)).toThrow('does not reconcile');
  });
});
