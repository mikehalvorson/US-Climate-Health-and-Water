import { describe, expect, it } from 'vitest';

import {
  assertForeignKeys,
  assertRegistry,
  assertRegistryStore,
  CANONICAL_REGISTRIES,
  ROUTES,
  type ForeignKeyReference,
  type RegistryStore,
  type RouteDefinition,
} from '../../src/lib/registry';

const copyRoute = (overrides: Partial<RouteDefinition> = {}): RouteDefinition => ({
  ...ROUTES[0],
  ...overrides,
});

describe('registry schemas and binding', () => {
  it('validates the complete canonical registry store', () => {
    expect(() => assertRegistryStore(CANONICAL_REGISTRIES)).not.toThrow();
  });

  it('rejects duplicate IDs and malformed namespaces', () => {
    expect(() => assertRegistry('route', [ROUTES[0], copyRoute()])).toThrow('Duplicate route ID');
    expect(() => assertRegistry('route', [copyRoute({ id: 'ROUTE-1' })])).toThrow('does not match its canonical namespace');
  });

  it('requires complete and resolvable supersession metadata', () => {
    expect(() => assertRegistry('route', [copyRoute({ status: 'superseded' })])).toThrow('requires a replacement ID and migration note');

    const replacement = copyRoute({
      id: 'RTE-900002',
      path: '/replacement',
      semanticFingerprint: 'route-replacement',
    });
    const superseded = copyRoute({
      id: 'RTE-900001',
      status: 'superseded',
      replacementId: replacement.id,
      migrationNote: 'Replaced to preserve the corrected route meaning.',
      semanticFingerprint: 'route-superseded',
    });
    expect(() => assertRegistry('route', [superseded, replacement])).not.toThrow();
    expect(() => assertRegistry('route', [superseded])).toThrow('does not exist');
  });

  it('rejects supersession metadata on an active record', () => {
    expect(() => assertRegistry('route', [copyRoute({
      replacementId: 'RTE-000002',
      migrationNote: 'Invalid because the record is active.',
    })])).toThrow('cannot declare supersession metadata');
  });

  it('resolves foreign keys exactly once and verifies semantic binding', () => {
    const valid: ForeignKeyReference = {
      sourceId: 'RTE-000001',
      field: 'nextRouteId',
      targetKind: 'route',
      targetId: 'RTE-000002',
      expectedSemanticFingerprint: 'route-energy-system',
    };
    expect(() => assertForeignKeys([valid], CANONICAL_REGISTRIES)).not.toThrow();
    expect(() => assertForeignKeys([{ ...valid, targetId: 'RTE-999999' }], CANONICAL_REGISTRIES)).toThrow('found 0');
    expect(() => assertForeignKeys([{ ...valid, expectedSemanticFingerprint: 'route-wrong-meaning' }], CANONICAL_REGISTRIES)).toThrow('expected semantic fingerprint');
  });

  it('rejects a registry store that silently omits a canonical registry', () => {
    const incomplete = { ...CANONICAL_REGISTRIES } as RegistryStore;
    delete incomplete.source;
    expect(() => assertRegistryStore(incomplete)).toThrow('Canonical registry source is missing');
  });
});
