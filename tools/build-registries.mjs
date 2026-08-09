import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const GENERATED_AT = '2026-08-09';
const ID_MAP_PATH = resolve(ROOT, 'src/data/registry/id-map.json');
const REGISTRY_PATH = resolve(ROOT, 'src/generated/registry.json');
const AUDIT_PATH = resolve(ROOT, 'src/generated/registry-audit.json');
const MANIFEST_PATH = resolve(ROOT, 'src/generated/registry-manifest.json');
const PREFIX = {
  source: 'SRC', claim: 'CLM', dataset: 'DAT', metric: 'MET', parameter: 'PAR',
  scenario: 'SCN', chart: 'CHT', transformation: 'TRN', model: 'MOD',
  denominator: 'DEN', open_item: 'OPN',
};

const normalizePath = (value) => value.replaceAll('\\', '/');
const relativePath = (value) => normalizePath(relative(ROOT, value));
const stable = (value) => JSON.stringify(value, Object.keys(value ?? {}).sort());
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fingerprint = (kind, legacyId) => `fp-${sha256(`${kind}:${legacyId}`).slice(0, 20)}`;
const unique = (values) => [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ''))].sort();
const text = (value) => typeof value === 'string' ? value : value === undefined || value === null ? '' : JSON.stringify(value);
const writeJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const textInputPattern = /\.(?:asc|csv|geojson|json|md|py|txt)$/u;
const hashInput = (path) => {
  const bytes = readFileSync(resolve(ROOT, path));
  return sha256(textInputPattern.test(path) ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes);
};

const trackedFiles = execFileSync('git', ['ls-files', 'research'], { cwd: ROOT, encoding: 'utf8' })
  .split(/\r?\n/u).filter(Boolean).map(normalizePath).sort();
const jsonFiles = trackedFiles.filter((path) => extname(path) === '.json');
const csvFiles = trackedFiles.filter((path) => extname(path) === '.csv' && !path.includes('/raw/'));
const jsonDocuments = new Map(jsonFiles.map((path) => [path, readJson(path)]));

function visit(value, callback, path = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, callback, [...path, index]));
  } else if (value && typeof value === 'object') {
    callback(value, path);
    Object.entries(value).forEach(([key, item]) => visit(item, callback, [...path, key]));
  }
}

function collectKeyValues(value, keys) {
  const found = [];
  visit(value, (object) => {
    for (const [key, item] of Object.entries(object)) {
      if (!keys.has(key)) continue;
      if (Array.isArray(item)) found.push(...item.filter((entry) => typeof entry === 'string'));
      else if (typeof item === 'string') found.push(item);
    }
  });
  return unique(found);
}

function parseCsv(raw) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (quoted) {
      if (character === '"' && raw[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(field); field = ''; }
    else if (character === '\n') { row.push(field.replace(/\r$/u, '')); rows.push(row); row = []; field = ''; }
    else field += character;
  }
  if (field || row.length) { row.push(field.replace(/\r$/u, '')); rows.push(row); }
  const headers = rows.shift() ?? [];
  return rows.filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

const csvDocuments = new Map(csvFiles.map((path) => [path, parseCsv(readFileSync(resolve(ROOT, path), 'utf8'))]));

const existingMap = existsSync(ID_MAP_PATH)
  ? JSON.parse(readFileSync(ID_MAP_PATH, 'utf8'))
  : { schemaVersion: '1.0.0', entries: [] };
const oldEntries = new Map(existingMap.entries.map((entry) => [`${entry.kind}:${entry.legacyId}`, { ...entry }]));
const entries = existingMap.entries.map((entry) => ({ ...entry }));
const entryByKey = new Map(entries.map((entry) => [`${entry.kind}:${entry.legacyId}`, entry]));
const nextByKind = new Map(Object.keys(PREFIX).map((kind) => {
  const used = entries.filter((entry) => entry.kind === kind)
    .map((entry) => Number(entry.canonicalId.slice(-6))).filter(Number.isFinite);
  return [kind, Math.max(0, ...used) + 1];
}));

function idFor(kind, legacyId) {
  const key = `${kind}:${legacyId}`;
  const prior = entryByKey.get(key);
  if (prior) return prior.canonicalId;
  const sequence = nextByKind.get(kind);
  const entry = { kind, legacyId, canonicalId: `${PREFIX[kind]}-${String(sequence).padStart(6, '0')}`, semanticHash: null };
  nextByKind.set(kind, sequence + 1);
  entries.push(entry);
  entryByKey.set(key, entry);
  return entry.canonicalId;
}

function base(kind, legacyId, label, description, status = 'provisional') {
  return {
    id: idFor(kind, legacyId), registryKind: kind, label: text(label) || legacyId,
    description: text(description) || `Imported from legacy record ${legacyId}.`, status,
    semanticFingerprint: fingerprint(kind, legacyId), legacyIds: [legacyId],
  };
}

const sourcePriority = [
  'research/energy/sources.json', 'research/climate/sources.json', 'research/water/sources.json',
  'research/plastics/sources.json', 'research/energy/transmission/source-verification.json',
  'research/energy/consumption/source-verification.json', 'research/energy/timeseries/source-access.json',
  'research/climate/timeseries/source-access.json', 'research/water/timeseries/source-access.json',
];
const priorityFor = (path) => {
  const exact = sourcePriority.indexOf(path);
  return exact === -1 ? 100 + trackedFiles.indexOf(path) : exact;
};

const sourceCandidates = new Map();
for (const [path, document] of jsonDocuments) {
  visit(document, (object) => {
    const legacyId = object.source_id;
    const url = object.canonical_url ?? object.url;
    const publisher = object.publisher ?? object.organization;
    if (typeof legacyId !== 'string' || typeof object.title !== 'string' || typeof url !== 'string' || typeof publisher !== 'string') return;
    const candidates = sourceCandidates.get(legacyId) ?? [];
    candidates.push({ path, priority: priorityFor(path), raw: object });
    sourceCandidates.set(legacyId, candidates);
  });
}

const referencedSourceIds = new Set();
for (const document of jsonDocuments.values()) {
  collectKeyValues(document, new Set(['source_id', 'source_ids', 'sourceId', 'sourceIds'])).forEach((id) => referencedSourceIds.add(id));
}
for (const rows of csvDocuments.values()) {
  for (const row of rows) {
    for (const key of ['source_id', 'source_ids']) {
      if (row[key]) row[key].split(/[|;]/u).filter(Boolean).forEach((id) => referencedSourceIds.add(id.trim()));
    }
  }
}

function sourceType(value) {
  const type = text(value).toLowerCase();
  if (/(peer.?review|journal|meta.analysis|academic)/u.test(type)) return 'peer_reviewed';
  if (/(assessment|ipcc|intergovernmental|un_assessment)/u.test(type)) return 'scientific_assessment';
  if (/(national.?laboratory|nrel|laboratory)/u.test(type)) return 'national_laboratory';
  if (/(legal|regulat|statute|rule)/u.test(type)) return 'official_legal_regulatory';
  if (/(model|scenario)/u.test(type)) return 'official_model';
  if (/(dataset|api|data_product|data_release|statistical)/u.test(type)) return 'official_dataset';
  if (/(government|official|federal|state|local|agency|technical_report)/u.test(type)) return 'official_statistical';
  if (/(synthesis|review|research_report)/u.test(type)) return 'high_quality_synthesis';
  return 'context_only';
}

function identityStatus(raw) {
  const value = raw.identity_check?.status ?? raw.identity_status ?? raw.identity_check;
  const normalized = text(value).toLowerCase();
  if (normalized.includes('verified')) return 'verified';
  if (normalized.includes('reject')) return 'rejected';
  if (normalized) return 'provisional';
  return 'not_assessed';
}

const collisionReport = [];
const sources = [];
for (const legacyId of unique([...sourceCandidates.keys(), ...referencedSourceIds])) {
  const candidates = [...(sourceCandidates.get(legacyId) ?? [])].sort((a, b) => a.priority - b.priority || a.path.localeCompare(b.path));
  if (candidates.length === 0) {
    sources.push({
      ...base('source', legacyId, legacyId, 'Referenced by the research corpus but missing a complete source definition.', 'pending'),
      publisher: 'Unresolved', title: legacyId, url: '', sourceType: 'context_only', publishedAt: null,
      accessedAt: null, domain: 'unresolved', originalSourceType: 'unresolved', identityStatus: 'not_assessed',
    });
    continue;
  }
  const chosen = candidates[0];
  const raw = chosen.raw;
  const accessedAt = raw.accessed_at ?? raw.accessedAt ?? null;
  const verification = identityStatus(raw);
  const originalType = text(raw.source_type) || 'unspecified';
  sources.push({
    ...base('source', legacyId, raw.title, raw.scope_note ?? raw.content_check ?? `Imported from ${chosen.path}.`, accessedAt && verification === 'verified' ? 'active' : 'provisional'),
    publisher: raw.publisher ?? raw.organization, title: raw.title, url: raw.canonical_url ?? raw.url,
    sourceType: sourceType(originalType), publishedAt: raw.publication_date ?? (raw.year ? String(raw.year) : null),
    accessedAt, locator: Array.isArray(raw.locators) ? raw.locators.join('; ') : text(raw.locator) || undefined,
    locators: Array.isArray(raw.locators) ? raw.locators : undefined,
    dataPeriod: raw.data_period ?? null, domain: chosen.path.split('/')[1] ?? 'cross_domain',
    originalSourceType: originalType, identityStatus: verification,
  });
  if (candidates.length > 1) {
    collisionReport.push({
      legacyId, canonicalId: idFor('source', legacyId), chosenPath: chosen.path,
      candidatePaths: unique(candidates.map((candidate) => candidate.path)),
      resolution: 'owner_precedence',
      metadataVariants: unique(candidates.map((candidate) => sha256(JSON.stringify(candidate.raw)))).length,
    });
  }
}

const sourceId = (legacyId) => idFor('source', legacyId);
const claimId = (legacyId) => idFor('claim', legacyId);
const claims = [];
const claimInputs = [
  ['research/energy/claims.json', (document) => document],
  ['research/climate/claims.json', (document) => document.claims],
  ['research/water/claims.json', (document) => document.claims],
  ['research/plastics/claims.json', (document) => document.claims],
  ['research/climate/coastal-cities/claim-audit.json', (document) => document.claims],
];

function claimStatus(value) {
  if (value === 'verified') return 'verified';
  if (value === 'rejected') return 'rejected';
  if (value === 'superseded') return 'superseded';
  return 'provisional';
}

function geographyFor(value) {
  const content = text(value).toLowerCase();
  if (/world|global/u.test(content)) return ['World', 'global'];
  if (/united states|u\.s\.|\bus\b/u.test(content)) return ['United States', 'national'];
  if (/miami|new orleans|city/u.test(content)) return ['Named city or community in claim', 'city'];
  return ['Unspecified', 'unspecified'];
}

for (const [path, select] of claimInputs) {
  const records = select(jsonDocuments.get(path));
  for (const raw of records) {
    const legacyId = raw.claim_id;
    const statement = raw.claim ?? raw.dashboard_text ?? raw.dashboard_safe_text ?? raw.candidate_claim;
    const rawStatus = raw.status ?? raw.result;
    const sourcesForClaim = collectKeyValues(raw, new Set(['source_id', 'source_ids'])).map(sourceId);
    const [geography, geographyType] = geographyFor(`${raw.scope ?? ''} ${statement ?? ''}`);
    const periodMatch = text(raw.scope ?? raw.quantification ?? statement).match(/(?:18|19|20|21)\d{2}(?:[–-](?:18|19|20|21)\d{2})?/u);
    const energyClaim = path.includes('/energy/');
    const fidelityRaw = raw.fidelity_check?.status ?? rawStatus;
    claims.push({
      ...base('claim', legacyId, raw.topic ?? raw.claim_type ?? raw.domain ?? legacyId, statement, rawStatus === 'rejected' ? 'provisional' : energyClaim && rawStatus === 'verified' ? 'active' : 'provisional'),
      statement: text(statement), publicationStatus: claimStatus(rawStatus), evidenceState: 'qualitative_evidence',
      sourceIds: sourcesForClaim, geography, geographyType, period: periodMatch?.[0] ?? 'undated',
      confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'not_assessed',
      fidelityStatus: energyClaim && fidelityRaw === 'verified' ? 'verified' : rawStatus === 'rejected' ? 'rejected' : 'not_assessed',
      domain: path.replace('research/', '').split('/')[0],
      misuseGuardrail: text(raw.dashboard_rule ?? raw.misuse_guardrail ?? raw.guardrail ?? raw.prohibited_rewrite ?? raw.prohibited_transformations) || 'Use only with its stated scope, source family, and evidence class.',
    });
  }
}

function inferUnitFamily(unit) {
  const value = text(unit).toLowerCase();
  if (/twh|mwh|kwh|btu|joule|\bej\b/u.test(value)) return 'energy';
  if (/\bgw\b|\bmw\b|\bkw\b|capacity/u.test(value)) return 'capacity';
  if (/w\/m|watt/u.test(value)) return 'power';
  if (/co2|emission/u.test(value)) return 'emissions';
  if (/ton|tonne|kg|mass/u.test(value)) return 'mass';
  if (/gallon|litre|liter|cubic|acre.?feet|volume/u.test(value)) return 'volume';
  if (/per.day|\/d|flow/u.test(value)) return 'flow';
  if (/°?c|celsius|fahrenheit|temperature/u.test(value)) return 'temperature';
  if (/\$|usd|dollar/u.test(value)) return 'currency';
  if (/percent|share|%/u.test(value)) return 'share';
  if (/mile|meter|metre|km|distance/u.test(value)) return 'distance';
  if (/year|day|hour|time/u.test(value)) return 'time';
  if (/index/u.test(value)) return 'index';
  if (/count|people|population|household/u.test(value)) return 'count';
  if (/ratio|dimensionless|multiple/u.test(value)) return 'dimensionless';
  return 'qualitative';
}

const datasetRaw = new Map();
function addDataset(legacyId, path, raw = {}) {
  if (!legacyId) return;
  const prior = datasetRaw.get(legacyId) ?? { paths: new Set(), sourceIds: new Set(), periods: new Set(), geographies: new Set(), units: new Set(), raw: [] };
  prior.paths.add(path);
  collectKeyValues(raw, new Set(['source_id', 'source_ids'])).forEach((id) => prior.sourceIds.add(id));
  for (const key of ['period', 'year', 'years', 'data_period']) if (raw[key] !== undefined) prior.periods.add(text(raw[key]));
  for (const key of ['geography', 'geography_type']) if (raw[key] !== undefined) prior.geographies.add(text(raw[key]));
  for (const key of ['unit', 'units']) if (raw[key] !== undefined) prior.units.add(text(raw[key]));
  prior.raw.push(raw);
  datasetRaw.set(legacyId, prior);
}
for (const [path, document] of jsonDocuments) visit(document, (object) => {
  if (typeof object.dataset_id === 'string') addDataset(object.dataset_id, path, object);
});
for (const [path, rows] of csvDocuments) for (const row of rows) if (row.dataset_id) addDataset(row.dataset_id, path, row);

const chartFiles = jsonFiles.filter((path) => path.endsWith('chart-contracts.json'));
const chartRaw = [];
function fileReferences(value) {
  const found = [];
  visit(value, (object) => Object.values(object).forEach((item) => {
    if (typeof item === 'string' && /\.(csv|json|geojson)(?:$|\?)/u.test(item)) found.push(item);
    if (Array.isArray(item)) item.filter((entry) => typeof entry === 'string' && /\.(csv|json|geojson)$/u.test(entry)).forEach((entry) => found.push(entry));
  }));
  return unique(found);
}
for (const path of chartFiles) {
  const document = jsonDocuments.get(path);
  const records = document.contracts ?? document.charts ?? [];
  for (const raw of records) {
    const refs = fileReferences(raw).map((file) => normalizePath(posix.normalize(posix.join(posix.dirname(path), file))));
    refs.forEach((ref) => addDataset(`path:${ref}`, ref, raw));
    chartRaw.push({ path, raw, refs });
  }
}

const datasets = [...datasetRaw.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([legacyId, info]) => {
  const paths = unique([...info.paths]);
  const units = unique([...info.units]);
  const geographyText = [...info.geographies].join(' ').toLowerCase();
  const geographyTypes = geographyText.includes('world') || geographyText.includes('global') ? ['global'] : geographyText.includes('state') ? ['state'] : geographyText.includes('city') ? ['city'] : geographyText ? ['national'] : ['unspecified'];
  const scenario = info.raw.some((raw) => raw.scenario || raw.scenario_id || raw.model);
  return {
    ...base('dataset', legacyId, legacyId.replace(/^path:/u, ''), `Research dataset represented by ${paths.join(', ')}.`, 'provisional'),
    path: paths[0], paths, sourceIds: unique([...info.sourceIds]).map(sourceId), geographyTypes,
    periods: unique([...info.periods]).length ? unique([...info.periods]) : ['undated'],
    unitFamilies: units.length ? unique(units.map(inferUnitFamily)) : ['qualitative'],
    useClass: scenario ? 'benchmark' : 'trend', participation: 'display_only',
  };
});
const datasetId = (legacyId) => idFor('dataset', legacyId);

function chartType(value) {
  const type = text(value).toLowerCase();
  if (type.includes('heat')) return 'heatmap';
  if (type.includes('sankey')) return 'sankey';
  if (type.includes('flow')) return 'flow';
  if (type.includes('causal') || type.includes('network')) return 'causal_path';
  if (type.includes('map')) return 'map';
  if (type.includes('matrix') || type.includes('scorecard')) return 'matrix';
  if (type.includes('range') || type.includes('fan')) return type.includes('area') ? 'area_range' : 'dot_range';
  if (type.includes('bar') || type.includes('waterfall')) return 'bar';
  if (type.includes('line') || type.includes('time')) return 'line';
  if (type.includes('table')) return 'table';
  return 'none';
}
const charts = chartRaw.sort((a, b) => a.raw.chart_id.localeCompare(b.raw.chart_id)).map(({ path, raw, refs }) => ({
  ...base('chart', raw.chart_id, raw.title ?? raw.question ?? raw.chart_id, raw.purpose ?? raw.question ?? `Chart contract imported from ${path}.`, refs.length ? 'provisional' : 'pending'),
  chartType: chartType(raw.type ?? raw.chart_type ?? raw.render),
  decisionQuestion: text(raw.question ?? raw.purpose ?? raw.title), metricIds: [],
  sourceIds: collectKeyValues(raw, new Set(['source_id', 'source_ids'])).map(sourceId),
  permittedFilters: Object.keys(raw.filters ?? {}),
  mandatoryAnnotations: unique([...(raw.annotations ?? []), ...(raw.required_annotations ?? []), text(raw.annotation)].filter(Boolean)),
  forbiddenComparisons: unique([...(raw.forbidden ?? []), ...(raw.prohibited ?? []), ...(raw.do_not_combine ?? []), text(raw.scope_rule), text(raw.scenario_rule)].filter(Boolean)),
  emptyState: 'No compatible evidence is available for the selected scope.',
  errorState: 'The evidence view could not be generated; use the accessible source table.',
  accessibilitySummary: `Accessible table and source disclosure required for ${raw.title ?? raw.chart_id}.`,
  dataReferences: refs, legacyContract: raw,
}));

const metrics = [];
const sourceStatusByLegacy = new Map(sources.map((record) => [record.legacyIds[0], record.status]));
const claimStatusByLegacy = new Map(claims.map((record) => [record.legacyIds[0], record.status]));
function addMetric(legacyId, label, value, unit, geography, geographyType, period, evidenceState, sourceLegacyIds, claimLegacyIds, datasetLegacyId, accountingBoundary, status = 'active') {
  const effectiveStatus = status === 'active'
    && sourceLegacyIds.every((id) => sourceStatusByLegacy.get(id) === 'active')
    && claimLegacyIds.every((id) => claimStatusByLegacy.get(id) === 'active')
    ? 'active' : 'provisional';
  metrics.push({
    ...base('metric', legacyId, label, accountingBoundary, effectiveStatus), value: typeof value === 'number' && Number.isFinite(value) ? value : null,
    unit: unit || 'not_available', unitFamily: inferUnitFamily(unit), geography, geographyType, period,
    evidenceState, sourceIds: unique(sourceLegacyIds).map(sourceId), claimIds: unique(claimLegacyIds).map(claimId),
    ...(datasetLegacyId ? { datasetId: datasetId(datasetLegacyId) } : {}), accountingBoundary,
    confidence: evidenceState === 'observed' ? 'high' : evidenceState === 'reported_estimate' ? 'medium' : 'not_assessed',
    useClass: 'display_only', participation: 'display_only',
  });
}
const globalObservations = jsonDocuments.get('research/energy/observations-global-2025.json');
for (const raw of globalObservations.observations) addMetric(
  `energy-global:${raw.observation_id}`, [raw.measure, raw.technology].filter(Boolean).join(': '), raw.value, raw.unit,
  globalObservations.geography, 'global', globalObservations.period,
  /observation|compilation|reported$/u.test(raw.status) ? 'observed' : 'reported_estimate',
  [raw.source_id], [raw.claim_id], globalObservations.dataset_id,
  `${raw.method_family ?? 'Published global energy series'}; status ${raw.status}.`,
);
const usObservations = jsonDocuments.get('research/energy/observations-us-2025.json');
for (const [group, raw] of Object.entries(usObservations)) {
  if (!raw || typeof raw !== 'object' || !raw.values) continue;
  const unit = group.includes('quadrillion_btu') ? 'quadrillion Btu' : group.includes('twh') ? 'TWh' : group.includes('percent') ? 'percent' : text(raw.unit) || 'reported unit';
  for (const [measure, value] of Object.entries(raw.values)) if (typeof value === 'number') addMetric(
    `energy-us:${group}:${measure}`, `${group}: ${measure}`, value, unit, usObservations.geography, 'national', usObservations.period,
    group.includes('derived') || text(raw.status).includes('estimate') ? 'reported_estimate' : 'preliminary',
    unique([raw.source_id, ...(raw.source_ids ?? [])]), raw.claim_ids ?? [], usObservations.dataset_id,
    raw.accounting ?? raw.note ?? `Boundary defined by ${group}.`, 'provisional',
  );
}
const waterUse = jsonDocuments.get('research/water/national-water-use.json');
const inventory = waterUse.inventory_2015;
for (const key of ['total_withdrawals_fresh_and_saline', 'freshwater_withdrawals', 'fresh_surface_water_withdrawals', 'fresh_groundwater_withdrawals', 'saline_water_withdrawals']) addMetric(
  `water:2015:${key}`, key, inventory[key], inventory.unit, inventory.geography, 'national', String(inventory.year), 'observed',
  [inventory.source.source_id], ['WTR-NAT-001'], undefined, 'USGS 2015 national inventory; withdrawal is not consumption.',
);
for (const category of inventory.categories) for (const key of ['total_withdrawal', 'freshwater_withdrawal', 'estimated_consumptive_use']) if (typeof category[key] === 'number') addMetric(
  `water:2015:${category.category}:${key}`, `${category.category}: ${key}`, category[key], inventory.unit, inventory.geography, 'national', String(inventory.year),
  key.includes('estimated') ? 'reported_estimate' : 'observed', [inventory.source.source_id], [], undefined, category.boundary,
);
const plastics = jsonDocuments.get('research/plastics/us-material-flows.json');
for (const key of ['domestic_production', 'exports', 'imports_resin_and_finished_products', 'domestic_consumption', 'disposed', 'addition_to_in_use_stock', 'recovered_for_reuse_percent']) if (typeof plastics.primary_baseline[key] === 'number') addMetric(
  `plastics:2019:${key}`, key, plastics.primary_baseline[key], key.endsWith('_percent') ? 'percent' : plastics.primary_baseline.unit,
  plastics.primary_baseline.geography, 'national', String(plastics.primary_baseline.year), 'reported_estimate',
  [plastics.primary_baseline.source.source_id], [], undefined, plastics.primary_baseline.scope,
);

const denominators = [];
const historicalWater = csvDocuments.get('research/water/timeseries/usgs-historical-water-use-1950-2015.csv') ?? [];
for (const row of historicalWater) if (row.population_millions && Number.isFinite(Number(row.population_millions))) denominators.push({
  ...base('denominator', `us-population:${row.year}`, `U.S. population (${row.year})`, 'Population denominator retained in the units published by the USGS historical water-use series.', sourceStatusByLegacy.get(row.source_id || 'USGS-CIR1441') === 'active' ? 'active' : 'provisional'),
  value: Number(row.population_millions), unit: 'million people', unitFamily: 'count', geography: row.geography_name ?? 'United States',
  geographyType: 'national', period: row.year, sourceIds: [sourceId(row.source_id || 'USGS-CIR1441')], useClass: 'display_only', participation: 'display_only',
});

const transformationScripts = trackedFiles.filter((path) => /\/scripts\/normalize_[^/]+\.py$/u.test(path));
const transformations = transformationScripts.map((path) => ({
  ...base('transformation', path, `Normalizer: ${path.split('/').at(-1)}`, `Read-only corpus normalization implementation at ${path}.`, 'provisional'),
  version: 'research-corpus-v1', formula: 'Implementation-defined normalization; formal input/output equations remain an open item.',
  inputIds: [], outputMetricIds: [], confidence: 'not_assessed',
  nullRule: 'Source nulls and absent values must remain null; the adapter may not convert them to zero.', implementationPath: path,
}));

const modelRaw = new Map();
const scenarioRaw = new Map();
function addModel(name, sourceIds = []) {
  if (!name) return;
  const prior = modelRaw.get(name) ?? new Set();
  sourceIds.filter(Boolean).forEach((id) => prior.add(id));
  modelRaw.set(name, prior);
}
function addScenario(model, scenario, sourceIds = []) {
  if (!model || !scenario) return;
  addModel(model, sourceIds);
  const key = `${model}::${scenario}`;
  const prior = scenarioRaw.get(key) ?? { model, scenario, sourceIds: new Set() };
  sourceIds.filter(Boolean).forEach((id) => prior.sourceIds.add(id));
  scenarioRaw.set(key, prior);
}
for (const rows of csvDocuments.values()) for (const row of rows) if (row.model && row.scenario) addScenario(row.model, row.scenario, [row.source_id]);
const catalog = jsonDocuments.get('research/energy/timeseries/scenario-catalog.json');
for (const family of catalog.scenario_families) {
  const names = family.models ?? [family.model ?? family.scenario_family_id];
  names.forEach((model) => (family.scenarios ?? []).forEach((scenario) => addScenario(model, scenario)));
}
const pendingModelNames = ['dashboard-integrated-energy', 'dashboard-climate-strategy', 'dashboard-food-water', 'dashboard-food-system'];
pendingModelNames.forEach((name) => addModel(name));
const models = [...modelRaw.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, sourceIds]) => ({
  ...base('model', name, name, `Canonical boundary for ${name}.`, pendingModelNames.includes(name) ? 'pending' : 'provisional'),
  version: 'v0.1-contract', modelClass: pendingModelNames.includes(name) ? 'strategy' : 'source_response',
  inputIds: [], sourceIds: unique([...sourceIds]).map(sourceId), outputMetricIds: [],
  interpretation: pendingModelNames.includes(name) ? 'Contract only; no authorized quantitative output.' : 'Conditional source-response model; outputs are not predictions.',
  prohibitedInterpretations: ['Do not treat a conditional scenario as a forecast or probability distribution.'],
  validationRequirements: ['Source-family seam is visible.', 'Inputs, units, geography, period, and scenario are explicit.'],
}));
const modelId = (legacyId) => idFor('model', legacyId);
const scenarios = [...scenarioRaw.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([legacyId, raw]) => ({
  ...base('scenario', legacyId, raw.scenario, `Source scenario from ${raw.model}.`, 'provisional'),
  scenarioType: 'source_scenario', modelId: modelId(raw.model), purpose: 'Preserve a named source scenario without cross-family collapse.',
  evidenceState: 'source_scenario', overrides: [],
}));

const parameterDefinitions = [
  ['energy-hourly-demand-shape', 'Regional hourly demand profiles', 'energy'],
  ['energy-capital-costs', 'Technology capital and operating costs', 'currency'],
  ['energy-capacity-contribution', 'Weather-conditioned capacity contribution', 'share'],
  ['energy-outage-rates', 'Technology outage rates', 'share'],
  ['energy-transmission-build-rate', 'Transmission build-rate constraint', 'capacity'],
  ['energy-weather-years', 'Representative and stress weather years', 'time'],
  ['climate-adaptation-exposure', 'Adaptation-conditioned exposure', 'count'],
  ['climate-adaptation-cost', 'Adaptation lifecycle cost', 'currency'],
  ['food-production-baseline', 'Food production and demand baseline', 'mass'],
  ['food-diet-demand', 'Diet and waste demand assumptions', 'mass'],
  ['water-facility-operations', 'Facility-level water operation data', 'flow'],
  ['water-watershed-availability', 'Watershed availability and ecological constraint', 'flow'],
];
const parameters = parameterDefinitions.map(([legacyId, label, unitFamily]) => ({
  ...base('parameter', legacyId, label, 'Decision-critical input is intentionally pending until authoritative evidence and model ownership are established.', 'pending'),
  valueType: 'range', unit: 'not_available', unitFamily, geography: 'Unspecified', geographyType: 'unspecified', period: 'undated',
  sourceIds: [], confidence: 'not_assessed', useAs: 'constraint', participation: 'validation_only', adjustable: false,
  assumptionNote: 'No numeric default is authorized. A null must remain visible until the linked open item closes.',
}));

const routeIds = {
  energy: ['RTE-000002', 'RTE-000003', 'RTE-000004', 'RTE-000005', 'RTE-000006'],
  climate: ['RTE-000007', 'RTE-000008', 'RTE-000009', 'RTE-000010'],
  water: ['RTE-000011', 'RTE-000013', 'RTE-000015'], plastics: ['RTE-000014', 'RTE-000015'],
  coastal: ['RTE-000009'], transmission: ['RTE-000005', 'RTE-000006'],
};
const gapFiles = jsonFiles.filter((path) => path.endsWith('/gaps.json') || path.endsWith('/gap-register.json') || path.endsWith('/cross-domain-gap-register.json'));
const openItems = [];
function severityFor(raw) {
  const value = text(raw.priority ?? raw.importance).toLowerCase();
  if (/critical|p0|release/u.test(value)) return 'release_blocking';
  if (/high|p1/u.test(value)) return 'high';
  if (/low|p3/u.test(value)) return 'low';
  return 'medium';
}
for (const path of gapFiles) {
  const document = jsonDocuments.get(path);
  const gaps = document.gaps ?? [];
  const domain = path.includes('/transmission/') ? 'transmission' : path.includes('/coastal-cities/') ? 'coastal' : path.split('/')[1];
  for (const raw of gaps) {
    const legacyId = `${path}:${raw.gap_id}`;
    openItems.push({
      ...base('open_item', legacyId, raw.topic ?? raw.subject ?? raw.gap ?? raw.gap_id, raw.missing ?? raw.gap ?? raw.reason ?? raw.why_it_matters, 'active'),
      itemStatus: raw.status === 'closed' ? 'closed' : 'open', severity: severityFor(raw), affectedIds: routeIds[domain] ?? ['RTE-000016'],
      owner: domain, blockingCondition: text(raw.risk_if_ignored ?? raw.why_it_matters ?? raw.dashboard_treatment) || undefined,
      nextAction: text(raw.next_action ?? raw.resolution ?? raw.recommended_path ?? raw.needed_data ?? raw.next_source_targets ?? raw.next_source_candidates) || 'Acquire and validate the missing evidence.',
      created: GENERATED_AT, lastReviewed: GENERATED_AT, legacyGapId: raw.gap_id, sourcePath: path,
    });
  }
}
for (const source of sources.filter((record) => record.status === 'pending')) openItems.push({
  ...base('open_item', `orphan-source:${source.legacyIds[0]}`, `Resolve source ${source.legacyIds[0]}`, 'A source reference exists without a complete canonical definition.', 'active'),
  itemStatus: 'open', severity: 'high', affectedIds: [source.id], owner: 'evidence',
  blockingCondition: 'Claims or datasets that depend on this source cannot become active.',
  nextAction: 'Add a verified publisher, title, canonical URL, publication vintage, and access date.', created: GENERATED_AT, lastReviewed: GENERATED_AT,
});
const groupedOpenItems = [
  ['missing-source-access-dates', 'Complete source access dates', 'Source records without access dates remain provisional.', sources.filter((record) => !record.accessedAt).map((record) => record.id)],
  ['missing-claim-confidence', 'Assess claim confidence', 'Claims without an explicit confidence grade remain provisional.', claims.filter((record) => record.confidence === 'not_assessed').map((record) => record.id)],
  ['formal-transformation-contracts', 'Formalize transformation contracts', 'Normalizer implementations require explicit equations and input/output bindings.', transformations.map((record) => record.id)],
  ['chart-data-bindings', 'Complete chart-to-metric bindings', 'Chart contracts are preserved, but route-specific metric bindings await vertical-slice implementation.', charts.map((record) => record.id)],
];
for (const [legacyId, label, description, affectedIds] of groupedOpenItems) if (affectedIds.length) openItems.push({
  ...base('open_item', legacyId, label, description, 'active'), itemStatus: 'open', severity: 'high', affectedIds,
  owner: 'evidence', blockingCondition: description, nextAction: label, created: GENERATED_AT, lastReviewed: GENERATED_AT,
});
for (const parameter of parameters) openItems.push({
  ...base('open_item', `parameter:${parameter.legacyIds[0]}`, `Supply ${parameter.label}`, parameter.description, 'active'),
  itemStatus: 'open', severity: 'release_blocking', affectedIds: [parameter.id], owner: 'models',
  blockingCondition: 'The related quantitative strategy output is unavailable.', nextAction: 'Select authoritative evidence, define bounds, and pass parameter validation.',
  created: GENERATED_AT, lastReviewed: GENERATED_AT,
});

const registry = {
  schemaVersion: '1.0.0', generatedFrom: 'tracked research corpus', evidenceVintage: '2026-08-01',
  source: sources.sort((a, b) => a.id.localeCompare(b.id)), claim: claims.sort((a, b) => a.id.localeCompare(b.id)),
  dataset: datasets.sort((a, b) => a.id.localeCompare(b.id)), metric: metrics.sort((a, b) => a.id.localeCompare(b.id)),
  parameter: parameters.sort((a, b) => a.id.localeCompare(b.id)), scenario: scenarios.sort((a, b) => a.id.localeCompare(b.id)),
  chart: charts.sort((a, b) => a.id.localeCompare(b.id)), transformation: transformations.sort((a, b) => a.id.localeCompare(b.id)),
  model: models.sort((a, b) => a.id.localeCompare(b.id)), denominator: denominators.sort((a, b) => a.id.localeCompare(b.id)),
  open_item: openItems.sort((a, b) => a.id.localeCompare(b.id)),
};

const semanticDrift = [];
const recordById = new Map(Object.values(registry).flatMap((value) => Array.isArray(value) ? value : []).map((record) => [record.id, record]));
for (const entry of entries) {
  const record = recordById.get(entry.canonicalId);
  const currentHash = record ? sha256(JSON.stringify(record)) : entry.semanticHash;
  const old = oldEntries.get(`${entry.kind}:${entry.legacyId}`);
  if (old?.semanticHash && currentHash && old.semanticHash !== currentHash) semanticDrift.push({
    kind: entry.kind, legacyId: entry.legacyId, canonicalId: entry.canonicalId,
    priorHash: old.semanticHash, currentHash,
  });
  entry.semanticHash = currentHash;
}
entries.sort((a, b) => a.kind.localeCompare(b.kind) || a.legacyId.localeCompare(b.legacyId));
const idMap = { schemaVersion: '1.0.0', entries };

const sourceById = new Map(registry.source.map((record) => [record.id, record]));
const sourceCoverage = registry.claim.map((claim) => ({
  claimId: claim.id, sourceCount: claim.sourceIds.length,
  activeSourceCount: claim.sourceIds.filter((id) => sourceById.get(id)?.status === 'active').length,
  unresolvedSourceIds: claim.sourceIds.filter((id) => sourceById.get(id)?.status === 'pending'),
}));
const audit = {
  schemaVersion: '1.0.0', generatedForEvidenceVintage: registry.evidenceVintage,
  counts: Object.fromEntries(Object.entries(registry).filter(([, value]) => Array.isArray(value)).map(([kind, records]) => [kind, records.length])),
  sourceDefinitionCollisions: collisionReport,
  orphanResolution: registry.source.filter((record) => record.status === 'pending').map((record) => ({ legacyId: record.legacyIds[0], canonicalId: record.id, resolution: 'provisional_placeholder_and_open_item' })),
  duplicateCanonicalIds: unique(Object.values(registry).flatMap((value) => Array.isArray(value) ? value : []).map((record) => record.id).filter((id, index, ids) => ids.indexOf(id) !== index)),
  controlledVocabularyFallbacks: unique(registry.source.filter((record) => record.sourceType === 'context_only').map((record) => record.originalSourceType)),
  semanticDrift, sourceCoverage,
  unresolved: {
    openItems: registry.open_item.filter((record) => record.itemStatus !== 'closed').length,
    pendingSources: registry.source.filter((record) => record.status === 'pending').length,
    pendingParameters: registry.parameter.filter((record) => record.status === 'pending').length,
    unboundCharts: registry.chart.filter((record) => record.metricIds.length === 0).length,
  },
  policies: {
    sourceCollision: 'Highest-precedence domain owner wins; all candidate paths remain in this audit.',
    orphan: 'A provisional canonical source and linked open item preserve referential integrity without fabricating metadata.',
    null: 'Missing values remain null or absent; zero is never substituted.',
    scenario: 'Source scenario families remain separate and conditional.',
  },
};

const registryBytes = writeJson(registry);
const auditBytes = writeJson(audit);
const idMapBytes = writeJson(idMap);
const inputHashes = Object.fromEntries(trackedFiles.map((path) => [path, hashInput(path)]));
const manifest = {
  schemaVersion: '1.0.0', evidenceVintage: registry.evidenceVintage, trackedInputCount: trackedFiles.length,
  hashAlgorithm: 'sha256', inputs: inputHashes,
  outputs: {
    'src/data/registry/id-map.json': sha256(idMapBytes),
    'src/generated/registry.json': sha256(registryBytes),
    'src/generated/registry-audit.json': sha256(auditBytes),
  },
};
const manifestBytes = writeJson(manifest);

const outputs = [[ID_MAP_PATH, idMapBytes], [REGISTRY_PATH, registryBytes], [AUDIT_PATH, auditBytes], [MANIFEST_PATH, manifestBytes]];
if (CHECK) {
  const differences = outputs.filter(([path, bytes]) => !existsSync(path) || readFileSync(path, 'utf8') !== bytes).map(([path]) => relativePath(path));
  if (differences.length) {
    console.error(`Generated registries are stale: ${differences.join(', ')}`);
    process.exitCode = 1;
  } else console.log(`PASS deterministic registry generation (${trackedFiles.length} tracked inputs, ${registry.source.length} sources, ${registry.claim.length} claims, ${registry.open_item.length} open items).`);
} else {
  outputs.forEach(([path, bytes]) => writeFileSync(path, bytes));
  console.log(`Generated canonical registries from ${trackedFiles.length} tracked research files.`);
  console.log(JSON.stringify(audit.counts));
}
