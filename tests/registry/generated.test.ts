import { describe, expect, it } from 'vitest';

import audit from '../../src/generated/registry-audit.json';
import manifest from '../../src/generated/registry-manifest.json';
import idMap from '../../src/data/registry/id-map.json';
import { collectForeignKeyReferences } from '../../src/lib/registry/references';
import { CANONICAL_REGISTRIES } from '../../src/lib/registry/store';
import { assertForeignKeys, assertRegistryStore } from '../../src/lib/registry/validate';

describe('generated canonical evidence layer', () => {
  it('loads every canonical registry and resolves every foreign key exactly once', () => {
    expect(() => assertRegistryStore(CANONICAL_REGISTRIES)).not.toThrow();
    expect(() => assertForeignKeys(collectForeignKeyReferences(CANONICAL_REGISTRIES), CANONICAL_REGISTRIES)).not.toThrow();
  });

  it('preserves the complete claim and chart-contract inventories', () => {
    expect(CANONICAL_REGISTRIES.claim).toHaveLength(157);
    expect(CANONICAL_REGISTRIES.chart).toHaveLength(91);
    expect(CANONICAL_REGISTRIES.source).toHaveLength(336);
    expect(audit.sourceDefinitionCollisions).toHaveLength(25);
    expect(audit.duplicateCanonicalIds).toEqual([]);
    expect(audit.orphanResolution).toEqual([]);
    expect(audit.sourceCoverage.every((entry) => entry.sourceCount > 0)).toBe(true);
  });

  it('keeps one stable mapping for every legacy identity', () => {
    const legacyKeys = idMap.entries.map((entry) => `${entry.kind}:${entry.legacyId}`);
    const canonicalIds = idMap.entries.map((entry) => entry.canonicalId);
    expect(new Set(legacyKeys).size).toBe(legacyKeys.length);
    expect(new Set(canonicalIds).size).toBe(canonicalIds.length);
    expect(idMap.entries.every((entry) => /^[A-Z]{3}-\d{6}$/u.test(entry.canonicalId) && /^[a-f0-9]{64}$/u.test(entry.semanticHash ?? ''))).toBe(true);
  });

  it('publishes complete SHA-256 input and output checksum ledgers', () => {
    expect(Object.keys(manifest.outputs)).toEqual([
      'src/data/registry/id-map.json',
      'src/generated/registry.json',
      'src/generated/registry-audit.json',
    ]);
    expect(Object.values(manifest.outputs).every((hash) => /^[a-f0-9]{64}$/u.test(hash))).toBe(true);
    expect(Object.values(manifest.inputs).every((hash) => /^[a-f0-9]{64}$/u.test(hash))).toBe(true);
    expect(Object.keys(manifest.inputs)).toHaveLength(manifest.trackedInputCount);
  });
});
