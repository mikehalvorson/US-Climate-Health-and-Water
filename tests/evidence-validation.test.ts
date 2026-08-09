import { describe, expect, it } from 'vitest';

import {
  intervalsOverlap,
  validateConfidencePropagation,
  validateCurrencyVintage,
  validateEvidenceLayer,
  validateGeographyCardinality,
  validateNullPreservation,
  validateParameterBounds,
  validateUseClass,
} from '../src/lib/evidence/validation';
import { CANONICAL_REGISTRIES } from '../src/lib/registry/store';
import type { ParameterRecord } from '../src/lib/registry/types';

describe('evidence and model guardrails', () => {
  it('accepts the generated evidence layer without hard fidelity failures', () => {
    expect(validateEvidenceLayer(CANONICAL_REGISTRIES)).toEqual([]);
  });

  it('rejects confidence above the weakest input', () => {
    expect(validateConfidencePropagation('MET-999999', 'high', ['high', 'low'])).toEqual([
      expect.objectContaining({ code: 'confidence_overstatement' }),
    ]);
  });

  it('rejects reversed, out-of-range, and unbounded currency parameters', () => {
    const invalid = {
      id: 'PAR-999999', status: 'active', valueType: 'triangular', low: 10, mode: 12, high: 5,
      baseMin: -1, baseMax: 8, naturalMin: 0, naturalMax: 7, unitFamily: 'currency',
    } as unknown as ParameterRecord;
    expect(validateParameterBounds([invalid]).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'reversed_bounds', 'mode_outside_range', 'base_outside_natural_bounds',
    ]));
    expect(validateCurrencyVintage([invalid])).toEqual([expect.objectContaining({ code: 'missing_currency_year' })]);
  });

  it('preserves nulls and keeps display-only evidence out of model inputs', () => {
    expect(validateNullPreservation(null, 0, 'MET-999999')).toEqual([expect.objectContaining({ code: 'fabricated_null' })]);
    expect(validateUseClass('display_only', 'model_input', 'MET-999999')).toEqual([expect.objectContaining({ code: 'invalid_model_use_class' })]);
  });

  it('checks interval overlap and exact geography cardinality', () => {
    expect(intervalsOverlap(0, 2, 2, 4)).toBe(true);
    expect(intervalsOverlap(0, 1, 2, 4)).toBe(false);
    const issues = validateGeographyCardinality([{ id: 'A' }, { id: 'A' }, { id: 'C' }], (entry) => entry.id, ['A', 'B']);
    expect(issues.map((issue) => issue.code)).toEqual(['duplicate_geography', 'missing_geography', 'unexpected_geography']);
  });
});
