import { describe, expect, it } from 'vitest';

import {
  assertRegistry,
  assertVocabularyValue,
  isVocabularyValue,
  VOCABULARY_REGISTRY,
  VOCABULARY_VALUES,
} from '../../src/lib/registry';

describe('controlled vocabularies', () => {
  it('registers every vocabulary exactly once', () => {
    expect(() => assertRegistry('vocabulary', VOCABULARY_REGISTRY)).not.toThrow();
    expect(VOCABULARY_REGISTRY).toHaveLength(Object.keys(VOCABULARY_VALUES).length);
    expect(new Set(VOCABULARY_REGISTRY.map((record) => record.key)).size).toBe(VOCABULARY_REGISTRY.length);
  });

  it('accepts declared values', () => {
    expect(isVocabularyValue('evidence_state', 'observed')).toBe(true);
    expect(() => assertVocabularyValue('unit_family', 'energy')).not.toThrow();
  });

  it('fails closed on unknown values', () => {
    expect(isVocabularyValue('evidence_state', 'other')).toBe(false);
    expect(() => assertVocabularyValue('confidence', 'very_high')).toThrow('Unknown confidence vocabulary value');
  });
});
