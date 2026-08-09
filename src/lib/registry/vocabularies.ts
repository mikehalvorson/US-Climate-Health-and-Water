import { allocateCanonicalId } from './namespaces';
import type { VocabularyRecord } from './types';
import { VOCABULARY_VALUES, type VocabularyKey, type VocabularyValue } from './values';

const descriptions: Readonly<Record<VocabularyKey, string>> = {
  record_status: 'Lifecycle state shared by canonical registry records.',
  confidence: 'Evidence confidence after source, proxy, transformation, and model limits are considered.',
  evidence_state: 'Visible distinction among observations, estimates, scenarios, transformations, models, qualitative evidence, and gaps.',
  claim_status: 'Publication review state for factual and numeric claims.',
  viewpoint: 'Shared stakeholder and system viewpoints used across story chapters.',
  unit_family: 'Semantic unit families used to prevent incompatible comparisons and joins.',
  use_class: 'Declared computational role of a dataset, metric, denominator, or parameter.',
  participation: 'Whether a record may enter a model, validation only, or display only.',
  geography_type: 'Declared geographic resolution and entity type.',
  source_type: 'Source hierarchy and evidence-origin classification.',
  scenario_type: 'Scenario purpose without implying probability or prediction.',
  model_class: 'Authorized classes of dashboard calculation.',
  chart_type: 'Approved chart and evidence presentation forms.',
  supersection: 'Sitewide and story supersection ownership for routes.',
  route_kind: 'Overview, story, and methods route roles.',
  open_item_status: 'Lifecycle state for research and implementation gaps.',
  open_item_severity: 'Release and prioritization severity for open items.',
  integrity_group: 'Reconciled integrity-summary groups.',
  integrity_state: 'Executed and non-executed outcomes reported by the integrity harness.',
};

const vocabularyKeys = Object.keys(VOCABULARY_VALUES) as VocabularyKey[];

export const VOCABULARY_REGISTRY: readonly VocabularyRecord[] = vocabularyKeys.map((key, index) => ({
  id: allocateCanonicalId('vocabulary', index + 1),
  registryKind: 'vocabulary',
  label: key.replaceAll('_', ' '),
  description: descriptions[key],
  status: 'active',
  semanticFingerprint: `vocabulary-${key.replaceAll('_', '-')}`,
  key,
  values: VOCABULARY_VALUES[key],
}));

export function isVocabularyValue<K extends VocabularyKey>(
  key: K,
  value: string,
): value is VocabularyValue<K> {
  return (VOCABULARY_VALUES[key] as readonly string[]).includes(value);
}

export function assertVocabularyValue<K extends VocabularyKey>(
  key: K,
  value: string,
): asserts value is VocabularyValue<K> {
  if (!isVocabularyValue(key, value)) {
    throw new Error(`Unknown ${key} vocabulary value: ${value}.`);
  }
}
