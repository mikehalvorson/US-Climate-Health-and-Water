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

const EMPTY_SOURCES: readonly SourceRecord[] = [];
const EMPTY_CLAIMS: readonly ClaimRecord[] = [];
const EMPTY_DATASETS: readonly DatasetRecord[] = [];
const EMPTY_METRICS: readonly MetricRecord[] = [];
const EMPTY_PARAMETERS: readonly ParameterRecord[] = [];
const EMPTY_SCENARIOS: readonly ScenarioRecord[] = [];
const EMPTY_CHARTS: readonly ChartRecord[] = [];
const EMPTY_TRANSFORMATIONS: readonly TransformationRecord[] = [];
const EMPTY_MODELS: readonly ModelRecord[] = [];
const EMPTY_DENOMINATORS: readonly DenominatorRecord[] = [];
const EMPTY_OPEN_ITEMS: readonly OpenItemRecord[] = [];

// Step 3 populates the currently empty registries through read-only research
// adapters. Keeping every registry present now makes absence explicit and
// prevents later code from inventing local identity stores.
export const CANONICAL_REGISTRIES: RegistryStore = {
  source: EMPTY_SOURCES,
  claim: EMPTY_CLAIMS,
  dataset: EMPTY_DATASETS,
  metric: EMPTY_METRICS,
  parameter: EMPTY_PARAMETERS,
  scenario: EMPTY_SCENARIOS,
  chart: EMPTY_CHARTS,
  transformation: EMPTY_TRANSFORMATIONS,
  model: EMPTY_MODELS,
  route: ROUTES,
  vocabulary: VOCABULARY_REGISTRY,
  denominator: EMPTY_DENOMINATORS,
  open_item: EMPTY_OPEN_ITEMS,
  integrity_test: INTEGRITY_TEST_REGISTRY,
};
