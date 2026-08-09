import type {
  ClaimRecord,
  MetricRecord,
  ParameterRecord,
  RegistryStore,
  SourceRecord,
} from '../registry/types';
import type { Confidence, GeographyType, Participation, UseClass } from '../registry/values';

export interface EvidenceValidationIssue {
  code: string;
  recordId: string;
  message: string;
}

const confidenceRank: Readonly<Record<Confidence, number>> = { not_assessed: 0, low: 1, medium: 2, high: 3 };

export function validateSourceFidelity(store: RegistryStore): EvidenceValidationIssue[] {
  const issues: EvidenceValidationIssue[] = [];
  const sourceById = new Map((store.source ?? []).map((source) => [source.id, source]));
  for (const source of store.source ?? []) {
    if (source.status !== 'active') continue;
    if (!source.publisher.trim() || !source.title.trim() || !source.url.trim() || !source.accessedAt || source.identityStatus !== 'verified') {
      issues.push({ code: 'incomplete_active_source', recordId: source.id, message: `${source.id} is active without a verified identity, locator URL, and access vintage.` });
    }
  }
  for (const claim of store.claim ?? []) {
    if (claim.status !== 'active') continue;
    if (claim.publicationStatus !== 'verified' || claim.fidelityStatus !== 'verified' || claim.confidence === 'not_assessed') {
      issues.push({ code: 'incomplete_active_claim', recordId: claim.id, message: `${claim.id} is active without verified fidelity, publication status, and assessed confidence.` });
    }
    if (claim.sourceIds.length === 0 || claim.sourceIds.some((id) => sourceById.get(id)?.status !== 'active')) {
      issues.push({ code: 'inactive_claim_source', recordId: claim.id, message: `${claim.id} is active but lacks a complete set of active source records.` });
    }
  }
  return issues;
}

export function validateConfidencePropagation(
  outputId: string,
  outputConfidence: Confidence,
  inputConfidences: readonly Confidence[],
): EvidenceValidationIssue[] {
  if (inputConfidences.length === 0 && outputConfidence !== 'not_assessed') {
    return [{ code: 'confidence_without_inputs', recordId: outputId, message: `${outputId} has assessed confidence without assessed inputs.` }];
  }
  const weakest = Math.min(...inputConfidences.map((confidence) => confidenceRank[confidence]));
  return confidenceRank[outputConfidence] > weakest
    ? [{ code: 'confidence_overstatement', recordId: outputId, message: `${outputId} is more confident than its weakest input without an explicit independent validation.` }]
    : [];
}

function ordered(record: ParameterRecord, low: number | undefined, high: number | undefined, label: string): EvidenceValidationIssue[] {
  if (low !== undefined && high !== undefined && low > high) {
    return [{ code: 'reversed_bounds', recordId: record.id, message: `${record.id} has reversed ${label} bounds.` }];
  }
  return [];
}

export function validateParameterBounds(records: readonly ParameterRecord[]): EvidenceValidationIssue[] {
  const issues: EvidenceValidationIssue[] = [];
  for (const record of records) {
    if (record.status === 'pending') continue;
    issues.push(...ordered(record, record.low, record.high, 'value'));
    issues.push(...ordered(record, record.baseMin, record.baseMax, 'base'));
    issues.push(...ordered(record, record.stressMin, record.stressMax, 'stress'));
    issues.push(...ordered(record, record.naturalMin, record.naturalMax, 'natural'));
    if (record.mode !== undefined && ((record.low !== undefined && record.mode < record.low) || (record.high !== undefined && record.mode > record.high))) {
      issues.push({ code: 'mode_outside_range', recordId: record.id, message: `${record.id} has a mode outside its low/high range.` });
    }
    if (record.naturalMin !== undefined && record.baseMin !== undefined && record.baseMin < record.naturalMin) {
      issues.push({ code: 'base_outside_natural_bounds', recordId: record.id, message: `${record.id} base minimum is below its natural minimum.` });
    }
    if (record.naturalMax !== undefined && record.baseMax !== undefined && record.baseMax > record.naturalMax) {
      issues.push({ code: 'base_outside_natural_bounds', recordId: record.id, message: `${record.id} base maximum is above its natural maximum.` });
    }
  }
  return issues;
}

export function validateNullPreservation(input: number | null, output: number | null, outputId: string): EvidenceValidationIssue[] {
  return input === null && output !== null
    ? [{ code: 'fabricated_null', recordId: outputId, message: `${outputId} replaced a null input with a numeric output without an authorized imputation.` }]
    : [];
}

export function validateUseClass(useClass: UseClass, participation: Participation, recordId: string): EvidenceValidationIssue[] {
  if (participation === 'model_input' && (useClass === 'display_only' || useClass === 'trend')) {
    return [{ code: 'invalid_model_use_class', recordId, message: `${recordId} cannot use a ${useClass} value as a model input.` }];
  }
  return [];
}

export function validateCurrencyVintage(records: readonly ParameterRecord[]): EvidenceValidationIssue[] {
  return records.flatMap((record) => record.unitFamily === 'currency' && record.status !== 'pending' && record.currencyYear === undefined
    ? [{ code: 'missing_currency_year', recordId: record.id, message: `${record.id} is a currency parameter without a currency year.` }]
    : []);
}

export function intervalsOverlap(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
  return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
}

export function validateGeographyCardinality<T>(
  records: readonly T[],
  keyFor: (record: T) => string,
  expectedKeys: readonly string[],
  recordId = 'geography-set',
): EvidenceValidationIssue[] {
  const actual = records.map(keyFor);
  const duplicates = actual.filter((key, index) => actual.indexOf(key) !== index);
  const missing = expectedKeys.filter((key) => !actual.includes(key));
  const unexpected = actual.filter((key) => !expectedKeys.includes(key));
  return uniqueIssues([
    ...(duplicates.length ? [{ code: 'duplicate_geography', recordId, message: `Duplicate geography keys: ${[...new Set(duplicates)].join(', ')}.` }] : []),
    ...(missing.length ? [{ code: 'missing_geography', recordId, message: `Missing geography keys: ${missing.join(', ')}.` }] : []),
    ...(unexpected.length ? [{ code: 'unexpected_geography', recordId, message: `Unexpected geography keys: ${[...new Set(unexpected)].join(', ')}.` }] : []),
  ]);
}

function uniqueIssues(issues: EvidenceValidationIssue[]): EvidenceValidationIssue[] {
  return issues.filter((issue, index) => issues.findIndex((candidate) => candidate.code === issue.code && candidate.message === issue.message) === index);
}

export function validateMetricUse(records: readonly MetricRecord[]): EvidenceValidationIssue[] {
  return records.flatMap((record) => validateUseClass(record.useClass, record.participation, record.id));
}

export function validateMetricFidelity(store: RegistryStore): EvidenceValidationIssue[] {
  const issues: EvidenceValidationIssue[] = [];
  const sourceById = new Map((store.source ?? []).map((source) => [source.id, source]));
  const claimById = new Map((store.claim ?? []).map((claim) => [claim.id, claim]));
  const denominatorById = new Map((store.denominator ?? []).map((denominator) => [denominator.id, denominator]));
  for (const record of store.metric ?? []) {
    if (record.status !== 'active') continue;
    if (record.value === null || !Number.isFinite(record.value)) issues.push({ code: 'missing_active_value', recordId: record.id, message: `${record.id} is active without a finite value.` });
    if (!record.unit.trim() || record.unit === 'not_available') issues.push({ code: 'missing_active_unit', recordId: record.id, message: `${record.id} is active without an explicit unit.` });
    if (!record.period.trim() || record.period === 'undated') issues.push({ code: 'missing_active_period', recordId: record.id, message: `${record.id} is active without an explicit period.` });
    if (!record.geography.trim() || record.geographyType === 'unspecified') issues.push({ code: 'missing_active_geography', recordId: record.id, message: `${record.id} is active without an explicit geography.` });
    if (!record.accountingBoundary.trim()) issues.push({ code: 'missing_accounting_boundary', recordId: record.id, message: `${record.id} is active without an accounting boundary.` });
    if (record.evidenceState === 'data_gap') issues.push({ code: 'active_data_gap', recordId: record.id, message: `${record.id} cannot be active while classified as a data gap.` });
    if (record.sourceIds.length === 0 || record.sourceIds.some((id) => sourceById.get(id)?.status !== 'active')) issues.push({ code: 'inactive_metric_source', recordId: record.id, message: `${record.id} is active without complete active source provenance.` });
    if (record.claimIds.some((id) => claimById.get(id)?.status !== 'active')) issues.push({ code: 'inactive_metric_claim', recordId: record.id, message: `${record.id} is active but depends on a non-active claim.` });
    if (/per_(person|capita|household)|per (person|capita|household)/iu.test(record.unit) && (!record.denominatorId || denominatorById.get(record.denominatorId)?.status !== 'active')) {
      issues.push({ code: 'missing_metric_denominator', recordId: record.id, message: `${record.id} uses a population or household rate without an active denominator.` });
    }
  }
  return issues;
}

export function validateDenominatorFidelity(store: RegistryStore): EvidenceValidationIssue[] {
  const sourceById = new Map((store.source ?? []).map((source) => [source.id, source]));
  return (store.denominator ?? []).flatMap((record) => {
    if (record.status !== 'active') return [];
    const issues: EvidenceValidationIssue[] = [];
    if (record.value === null || !Number.isFinite(record.value)) issues.push({ code: 'missing_denominator_value', recordId: record.id, message: `${record.id} is active without a finite value.` });
    if (!record.unit || !record.period || !record.geography || record.geographyType === 'unspecified') issues.push({ code: 'incomplete_denominator_scope', recordId: record.id, message: `${record.id} lacks a unit, period, or geography.` });
    if (record.sourceIds.length === 0 || record.sourceIds.some((id) => sourceById.get(id)?.status !== 'active')) issues.push({ code: 'inactive_denominator_source', recordId: record.id, message: `${record.id} lacks active source provenance.` });
    return issues;
  });
}

export function validateEvidenceLayer(store: RegistryStore): EvidenceValidationIssue[] {
  return [
    ...validateSourceFidelity(store),
    ...validateParameterBounds(store.parameter ?? []),
    ...validateCurrencyVintage(store.parameter ?? []),
    ...validateMetricUse(store.metric ?? []),
    ...validateMetricFidelity(store),
    ...validateDenominatorFidelity(store),
  ];
}

export function hasCompleteSourceLocator(source: SourceRecord): boolean {
  return Boolean(source.url && source.publisher && source.title && source.accessedAt);
}

export function hasExplicitClaimScope(claim: ClaimRecord): boolean {
  return Boolean(claim.period && claim.geography && claim.geographyType as GeographyType);
}
