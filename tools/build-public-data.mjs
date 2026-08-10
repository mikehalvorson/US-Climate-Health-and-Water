import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const outputDirectory = resolve(root, 'public', 'data');
const registry = JSON.parse(readFileSync(resolve(root, 'src', 'generated', 'registry.json'), 'utf8'));
const audit = JSON.parse(readFileSync(resolve(root, 'src', 'generated', 'registry-audit.json'), 'utf8'));
const sourceManifest = JSON.parse(readFileSync(resolve(root, 'src', 'generated', 'registry-manifest.json'), 'utf8'));
const evidenceVintage = sourceManifest.evidenceVintage;

const exports = [
  ['sources.json', 'source', registry.source],
  ['claims.json', 'claim', registry.claim],
  ['datasets.json', 'dataset', registry.dataset],
  ['scenarios.json', 'scenario', registry.scenario],
  ['transformations.json', 'transformation', registry.transformation],
  ['models.json', 'model', registry.model],
  ['open-items.json', 'open_item', registry.open_item],
];

const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const hash = (content) => createHash('sha256').update(content).digest('hex');
const desired = new Map();

for (const [file, recordType, records] of exports) {
  desired.set(file, serialize({
    schemaVersion: '1.0.0',
    evidenceVintage,
    recordType,
    recordCount: records.length,
    provenance: {
      canonicalInput: 'src/generated/registry.json',
      generator: 'tools/build-public-data.mjs',
      hashAlgorithm: 'sha256',
    },
    records,
  }));
}

desired.set('registry-summary.json', serialize({
  schemaVersion: '1.0.0',
  evidenceVintage,
  trackedResearchInputs: sourceManifest.trackedInputCount,
  counts: Object.fromEntries(Object.entries(registry).map(([kind, records]) => [kind, records.length])),
  audit: {
    sourceDefinitionConflicts: audit.sourceDefinitionCollisions.length,
    duplicateCanonicalIds: audit.duplicateCanonicalIds.length,
    orphanResolutions: audit.orphanResolution.length,
    pendingSources: audit.unresolved.pendingSources,
    pendingParameters: audit.unresolved.pendingParameters,
    openItems: audit.unresolved.openItems,
  },
}));
desired.set('registry-manifest.json', serialize(sourceManifest));

const files = [...desired.entries()].map(([file, content]) => ({
  file,
  bytes: Buffer.byteLength(content),
  sha256: hash(content),
  recordCount: exports.find(([candidate]) => candidate === file)?.[2].length ?? null,
}));
desired.set('data-model-manifest.json', serialize({
  schemaVersion: '1.0.0',
  evidenceVintage,
  hashAlgorithm: 'sha256',
  provenance: 'Generated from the canonical evidence registry and audit. Null values, evidence states, accounting boundaries, and source identities are preserved.',
  files,
}));

const stale = [];
for (const [file, content] of desired) {
  const path = resolve(outputDirectory, file);
  if (!existsSync(path) || readFileSync(path, 'utf8') !== content) stale.push(file);
}

if (check) {
  if (stale.length > 0) {
    throw new Error(`Public data exports are stale or missing: ${stale.join(', ')}. Run pnpm generate:public.`);
  }
  console.log(`Verified ${desired.size} public data files and SHA-256 manifest entries.`);
} else {
  mkdirSync(outputDirectory, { recursive: true });
  for (const [file, content] of desired) writeFileSync(resolve(outputDirectory, file), content, 'utf8');
  console.log(`Generated ${desired.size} public data files from evidence vintage ${evidenceVintage}.`);
}
