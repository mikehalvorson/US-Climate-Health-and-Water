import type { EvidenceState } from '../registry/values';

export interface EvidencePresentation {
  label: string;
  symbol: string;
  description: string;
}

export const EVIDENCE_PRESENTATION: Readonly<Record<EvidenceState, EvidencePresentation>> = {
  observed: { label: 'Observed', symbol: '●', description: 'Directly observed or measured evidence.' },
  reported_estimate: { label: 'Reported estimate', symbol: '≈', description: 'An estimate reported by the cited source.' },
  preliminary: { label: 'Preliminary', symbol: '◇', description: 'Evidence that has not cleared the final publication or verification gate.' },
  source_scenario: { label: 'Source scenario', symbol: 'S', description: 'A scenario or pathway published by the cited source.' },
  dashboard_transformation: { label: 'Dashboard transformation', symbol: 'T', description: 'A reproducible transformation of cited source evidence.' },
  dashboard_strategy_model: { label: 'Dashboard strategy model', symbol: 'M', description: 'Output from an explicitly identified dashboard model.' },
  qualitative_evidence: { label: 'Qualitative evidence', symbol: 'Q', description: 'Scoped qualitative evidence without a numeric claim.' },
  data_gap: { label: 'Evidence gap', symbol: '—', description: 'Required evidence is missing or not authorized for publication.' },
};

export function evidencePresentation(state: EvidenceState): EvidencePresentation {
  return EVIDENCE_PRESENTATION[state];
}

export function formatEvidenceValue(value: number | null, options: Intl.NumberFormatOptions = {}): string {
  if (value === null) return 'Missing';
  if (!Number.isFinite(value)) throw new RangeError('Evidence values must be finite or null.');
  return new Intl.NumberFormat('en-US', options).format(value);
}
