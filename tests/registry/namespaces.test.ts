import { describe, expect, it } from 'vitest';

import {
  allocateCanonicalId,
  assertNamespaceDefinitions,
  isCanonicalId,
  NAMESPACE_DEFINITIONS,
  REGISTRY_KINDS,
} from '../../src/lib/registry';

describe('canonical namespaces', () => {
  it('assigns one valid prefix to every registry kind', () => {
    expect(() => assertNamespaceDefinitions()).not.toThrow();
    expect(Object.keys(NAMESPACE_DEFINITIONS)).toHaveLength(REGISTRY_KINDS.length);
    expect(new Set(REGISTRY_KINDS.map((kind) => NAMESPACE_DEFINITIONS[kind].prefix)).size).toBe(REGISTRY_KINDS.length);
  });

  it('allocates stable six-digit IDs and rejects malformed IDs', () => {
    expect(allocateCanonicalId('source', 1)).toBe('SRC-000001');
    expect(allocateCanonicalId('route', 16)).toBe('RTE-000016');
    expect(isCanonicalId('route', 'RTE-000016')).toBe(true);
    expect(isCanonicalId('route', 'RTE-16')).toBe(false);
    expect(isCanonicalId('route', 'SRC-000016')).toBe(false);
  });

  it('rejects sequence values outside the declared namespace', () => {
    expect(() => allocateCanonicalId('metric', 0)).toThrow(RangeError);
    expect(() => allocateCanonicalId('metric', 1_000_000)).toThrow(RangeError);
    expect(() => allocateCanonicalId('metric', 1.5)).toThrow(RangeError);
  });
});
