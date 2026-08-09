import type {
  ChartType,
  ClaimStatus,
  Confidence,
  EvidenceState,
  GeographyType,
  IntegrityGroup,
  ModelClass,
  OpenItemSeverity,
  OpenItemStatus,
  Participation,
  RecordStatus,
  RouteKind,
  ScenarioType,
  SourceType,
  Supersection,
  UnitFamily,
  UseClass,
  VerificationStatus,
  VocabularyKey,
} from './values';

export type RegistryKind =
  | 'source'
  | 'claim'
  | 'dataset'
  | 'metric'
  | 'parameter'
  | 'scenario'
  | 'chart'
  | 'transformation'
  | 'model'
  | 'route'
  | 'vocabulary'
  | 'denominator'
  | 'open_item'
  | 'integrity_test';

export interface BaseRegistryRecord {
  id: string;
  registryKind: RegistryKind;
  label: string;
  description: string;
  status: RecordStatus;
  semanticFingerprint: string;
  legacyIds?: readonly string[];
  replacementId?: string;
  migrationNote?: string;
}

export interface SourceRecord extends BaseRegistryRecord {
  registryKind: 'source';
  publisher: string;
  title: string;
  url: string;
  sourceType: SourceType;
  publishedAt: string | null;
  accessedAt: string | null;
  locator?: string;
  locators?: readonly string[];
  dataPeriod?: string | null;
  domain: string;
  originalSourceType: string;
  identityStatus: VerificationStatus;
}

export interface ClaimRecord extends BaseRegistryRecord {
  registryKind: 'claim';
  statement: string;
  publicationStatus: ClaimStatus;
  evidenceState: EvidenceState;
  sourceIds: readonly string[];
  geography: string;
  geographyType: GeographyType;
  period: string;
  unit?: string;
  confidence: Confidence;
  fidelityStatus: VerificationStatus;
  domain: string;
  misuseGuardrail: string;
}

export interface DatasetRecord extends BaseRegistryRecord {
  registryKind: 'dataset';
  path: string;
  sourceIds: readonly string[];
  geographyTypes: readonly GeographyType[];
  periods: readonly string[];
  unitFamilies: readonly UnitFamily[];
  useClass: UseClass;
  participation: Participation;
  paths?: readonly string[];
}

export interface MetricRecord extends BaseRegistryRecord {
  registryKind: 'metric';
  value: number | null;
  unit: string;
  unitFamily: UnitFamily;
  geography: string;
  geographyType: GeographyType;
  period: string;
  evidenceState: EvidenceState;
  sourceIds: readonly string[];
  claimIds: readonly string[];
  datasetId?: string;
  denominatorId?: string;
  accountingBoundary: string;
  confidence: Confidence;
  useClass: UseClass;
  participation: Participation;
}

export type ParameterValueType = 'point' | 'range' | 'triangular' | 'categorical' | 'time_series';

export interface ParameterRecord extends BaseRegistryRecord {
  registryKind: 'parameter';
  valueType: ParameterValueType;
  low?: number;
  mode?: number;
  high?: number;
  baseMin?: number;
  baseMax?: number;
  stressMin?: number;
  stressMax?: number;
  unit: string;
  unitFamily: UnitFamily;
  geography: string;
  geographyType: GeographyType;
  period: string;
  currencyYear?: number;
  sourceIds: readonly string[];
  confidence: Confidence;
  useAs: UseClass;
  participation: Participation;
  adjustable: boolean;
  naturalMin?: number;
  naturalMax?: number;
  proxyFor?: string;
  assumptionNote?: string;
  divergenceNote?: string;
}

export interface ScenarioOverride {
  parameterId: string;
  value: number | string | boolean;
}

export interface ScenarioRecord extends BaseRegistryRecord {
  registryKind: 'scenario';
  scenarioType: ScenarioType;
  modelId: string;
  purpose: string;
  evidenceState: EvidenceState;
  overrides: readonly ScenarioOverride[];
}

export interface ChartRecord extends BaseRegistryRecord {
  registryKind: 'chart';
  chartType: ChartType;
  decisionQuestion: string;
  metricIds: readonly string[];
  sourceIds: readonly string[];
  permittedFilters: readonly string[];
  mandatoryAnnotations: readonly string[];
  forbiddenComparisons: readonly string[];
  emptyState: string;
  errorState: string;
  accessibilitySummary: string;
  dataReferences?: readonly string[];
  legacyContract?: Readonly<Record<string, unknown>>;
}

export interface TransformationRecord extends BaseRegistryRecord {
  registryKind: 'transformation';
  version: string;
  formula: string;
  inputIds: readonly string[];
  outputMetricIds: readonly string[];
  confidence: Confidence;
  nullRule: string;
  implementationPath?: string;
}

export interface ModelRecord extends BaseRegistryRecord {
  registryKind: 'model';
  version: string;
  modelClass: ModelClass;
  inputIds: readonly string[];
  sourceIds?: readonly string[];
  outputMetricIds: readonly string[];
  interpretation: string;
  prohibitedInterpretations: readonly string[];
  validationRequirements: readonly string[];
}

export interface RouteDefinition extends BaseRegistryRecord {
  registryKind: 'route';
  order: number;
  path: string;
  supersection: Supersection;
  routeKind: RouteKind;
  role: string;
  decisionQuestion: string;
  localTabOrder?: number;
}

export interface VocabularyRecord extends BaseRegistryRecord {
  registryKind: 'vocabulary';
  key: VocabularyKey;
  values: readonly string[];
}

export interface DenominatorRecord extends BaseRegistryRecord {
  registryKind: 'denominator';
  value: number | null;
  unit: string;
  unitFamily: UnitFamily;
  geography: string;
  geographyType: GeographyType;
  period: string;
  sourceIds: readonly string[];
  useClass: UseClass;
  participation: Participation;
}

export interface OpenItemRecord extends BaseRegistryRecord {
  registryKind: 'open_item';
  itemStatus: OpenItemStatus;
  severity: OpenItemSeverity;
  affectedIds: readonly string[];
  owner: string;
  blockingCondition?: string;
  nextAction: string;
  created: string;
  lastReviewed: string;
  closedByEvidenceIds?: readonly string[];
  legacyGapId?: string;
  sourcePath?: string;
}

export interface IntegrityTestDefinition extends BaseRegistryRecord {
  registryKind: 'integrity_test';
  group: IntegrityGroup;
  required: boolean;
  owner: string;
}

export interface RegistryByKind {
  source: SourceRecord;
  claim: ClaimRecord;
  dataset: DatasetRecord;
  metric: MetricRecord;
  parameter: ParameterRecord;
  scenario: ScenarioRecord;
  chart: ChartRecord;
  transformation: TransformationRecord;
  model: ModelRecord;
  route: RouteDefinition;
  vocabulary: VocabularyRecord;
  denominator: DenominatorRecord;
  open_item: OpenItemRecord;
  integrity_test: IntegrityTestDefinition;
}

export type AnyRegistryRecord = RegistryByKind[RegistryKind];
export type RegistryStore = Partial<{
  [K in RegistryKind]: readonly RegistryByKind[K][];
}>;

export interface ForeignKeyReference {
  sourceId: string;
  field: string;
  targetKind: RegistryKind;
  targetId: string;
  expectedSemanticFingerprint?: string;
}
