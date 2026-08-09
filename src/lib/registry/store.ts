import generatedRegistry from '../../generated/registry.json';
import { INTEGRITY_TEST_REGISTRY } from './integrity';
import { ROUTES } from './routes';
import type {
  ChartRecord,
  ClaimRecord,
  DatasetRecord,
  DenominatorRecord,
  MetricRecord,
  ModelRecord,
  OpenItemRecord,
  ParameterRecord,
  RegistryStore,
  ScenarioRecord,
  SourceRecord,
  TransformationRecord,
} from './types';
import { VOCABULARY_REGISTRY } from './vocabularies';

interface GeneratedRegistryStore {
  source: readonly SourceRecord[];
  claim: readonly ClaimRecord[];
  dataset: readonly DatasetRecord[];
  metric: readonly MetricRecord[];
  parameter: readonly ParameterRecord[];
  scenario: readonly ScenarioRecord[];
  chart: readonly ChartRecord[];
  transformation: readonly TransformationRecord[];
  model: readonly ModelRecord[];
  denominator: readonly DenominatorRecord[];
  open_item: readonly OpenItemRecord[];
}

const generated = generatedRegistry as unknown as GeneratedRegistryStore;

export const CANONICAL_REGISTRIES: RegistryStore = {
  source: generated.source,
  claim: generated.claim,
  dataset: generated.dataset,
  metric: generated.metric,
  parameter: generated.parameter,
  scenario: generated.scenario,
  chart: generated.chart,
  transformation: generated.transformation,
  model: generated.model,
  route: ROUTES,
  vocabulary: VOCABULARY_REGISTRY,
  denominator: generated.denominator,
  open_item: generated.open_item,
  integrity_test: INTEGRITY_TEST_REGISTRY,
};
