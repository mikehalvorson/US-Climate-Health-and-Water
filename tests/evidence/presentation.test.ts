import { describe, expect, it } from 'vitest';

import { EVIDENCE_PRESENTATION, evidencePresentation, formatEvidenceValue } from '../../src/lib/evidence/presentation';
import { EVIDENCE_STATES } from '../../src/lib/registry/values';

describe('evidence presentation', () => {
  it('provides a label, non-color symbol, and description for every controlled state', () => {
    expect(Object.keys(EVIDENCE_PRESENTATION).sort()).toEqual([...EVIDENCE_STATES].sort());
    for (const state of EVIDENCE_STATES) {
      expect(evidencePresentation(state).label.length).toBeGreaterThan(0);
      expect(evidencePresentation(state).symbol.length).toBeGreaterThan(0);
      expect(evidencePresentation(state).description.length).toBeGreaterThan(0);
    }
  });

  it('distinguishes missing from zero and rejects non-finite output', () => {
    expect(formatEvidenceValue(null)).toBe('Missing');
    expect(formatEvidenceValue(0)).toBe('0');
    expect(() => formatEvidenceValue(Number.NaN)).toThrow(/finite/u);
    expect(() => formatEvidenceValue(Number.NEGATIVE_INFINITY)).toThrow(/finite/u);
  });
});
