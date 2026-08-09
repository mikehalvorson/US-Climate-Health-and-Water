export const RECORD_STATUSES = ['active', 'provisional', 'pending', 'superseded'] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'not_assessed'] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const EVIDENCE_STATES = [
  'observed',
  'reported_estimate',
  'preliminary',
  'source_scenario',
  'dashboard_transformation',
  'dashboard_strategy_model',
  'qualitative_evidence',
  'data_gap',
] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const CLAIM_STATUSES = ['verified', 'provisional', 'rejected', 'superseded'] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const VERIFICATION_STATUSES = ['verified', 'provisional', 'not_assessed', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VIEWPOINTS = [
  'people_and_households',
  'workers_and_operators',
  'businesses_and_producers',
  'utilities_and_infrastructure_owners',
  'host_communities_and_tribes',
  'public_health',
  'ecosystems_and_nonhuman_life',
  'government_and_taxpayers',
  'national_security_and_supply_chains',
  'future_generations',
] as const;
export type Viewpoint = (typeof VIEWPOINTS)[number];

export const UNIT_FAMILIES = [
  'energy',
  'power',
  'capacity',
  'emissions',
  'mass',
  'volume',
  'flow',
  'temperature',
  'currency',
  'share',
  'count',
  'distance',
  'area',
  'time',
  'index',
  'dimensionless',
  'qualitative',
] as const;
export type UnitFamily = (typeof UNIT_FAMILIES)[number];

export const USE_CLASSES = ['calibration', 'trend', 'benchmark', 'constraint', 'display_only'] as const;
export type UseClass = (typeof USE_CLASSES)[number];

export const PARTICIPATION_STATES = ['model_input', 'validation_only', 'display_only'] as const;
export type Participation = (typeof PARTICIPATION_STATES)[number];

export const GEOGRAPHY_TYPES = [
  'global',
  'national',
  'state',
  'tribal',
  'region',
  'balancing_authority',
  'basin',
  'watershed',
  'utility',
  'city',
  'county',
  'facility',
  'point',
  'corridor',
  'grid_cell',
  'unspecified',
] as const;
export type GeographyType = (typeof GEOGRAPHY_TYPES)[number];

export const SOURCE_TYPES = [
  'official_statistical',
  'official_dataset',
  'official_model',
  'official_legal_regulatory',
  'scientific_assessment',
  'peer_reviewed',
  'national_laboratory',
  'high_quality_synthesis',
  'context_only',
  'internal_transformation',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SCENARIO_TYPES = [
  'reference',
  'recommended',
  'stress',
  'source_scenario',
  'planning_case',
  'sensitivity',
] as const;
export type ScenarioType = (typeof SCENARIO_TYPES)[number];

export const MODEL_CLASSES = ['accounting', 'source_response', 'strategy'] as const;
export type ModelClass = (typeof MODEL_CLASSES)[number];

export const CHART_TYPES = [
  'line',
  'area_range',
  'bar',
  'dot_range',
  'heatmap',
  'matrix',
  'flow',
  'sankey',
  'causal_path',
  'map',
  'table',
  'none',
] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const SUPERSECTIONS = ['sitewide', 'energy', 'climate', 'food_water'] as const;
export type Supersection = (typeof SUPERSECTIONS)[number];

export const ROUTE_KINDS = ['overview', 'story', 'methods'] as const;
export type RouteKind = (typeof ROUTE_KINDS)[number];

export const OPEN_ITEM_STATUSES = ['open', 'in_progress', 'blocked', 'closed'] as const;
export type OpenItemStatus = (typeof OPEN_ITEM_STATUSES)[number];

export const OPEN_ITEM_SEVERITIES = ['release_blocking', 'high', 'medium', 'low'] as const;
export type OpenItemSeverity = (typeof OPEN_ITEM_SEVERITIES)[number];

export const INTEGRITY_GROUPS = [
  'registry_identity',
  'semantic_binding',
  'source_and_claim',
  'data_schema',
  'scenario',
  'model',
  'chart',
  'route_and_navigation',
  'accessibility',
] as const;
export type IntegrityGroup = (typeof INTEGRITY_GROUPS)[number];

export const INTEGRITY_STATES = ['passed', 'failed', 'skipped', 'pending', 'unloaded'] as const;
export type IntegrityState = (typeof INTEGRITY_STATES)[number];

export const VOCABULARY_VALUES = {
  record_status: RECORD_STATUSES,
  confidence: CONFIDENCE_LEVELS,
  evidence_state: EVIDENCE_STATES,
  claim_status: CLAIM_STATUSES,
  verification_status: VERIFICATION_STATUSES,
  viewpoint: VIEWPOINTS,
  unit_family: UNIT_FAMILIES,
  use_class: USE_CLASSES,
  participation: PARTICIPATION_STATES,
  geography_type: GEOGRAPHY_TYPES,
  source_type: SOURCE_TYPES,
  scenario_type: SCENARIO_TYPES,
  model_class: MODEL_CLASSES,
  chart_type: CHART_TYPES,
  supersection: SUPERSECTIONS,
  route_kind: ROUTE_KINDS,
  open_item_status: OPEN_ITEM_STATUSES,
  open_item_severity: OPEN_ITEM_SEVERITIES,
  integrity_group: INTEGRITY_GROUPS,
  integrity_state: INTEGRITY_STATES,
} as const;

export type VocabularyKey = keyof typeof VOCABULARY_VALUES;
export type VocabularyValue<K extends VocabularyKey> = (typeof VOCABULARY_VALUES)[K][number];
