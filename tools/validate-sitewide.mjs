import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const overviewPath = resolve(dist, 'index.html');
const methodsPath = resolve(dist, 'methods', 'index.html');
const failures = [];
const htmlFor = (relative) => readFileSync(resolve(dist, relative, 'index.html'), 'utf8');

for (const path of [overviewPath, methodsPath]) if (!existsSync(path)) failures.push(`Missing sitewide route ${path}.`);
if (failures.length === 0) {
  const overview = readFileSync(overviewPath, 'utf8');
  const methods = readFileSync(methodsPath, 'utf8');
  for (const [label, html] of [['Overview', overview], ['Methods', methods]]) {
    if (!html.includes('data-release-status="chapter"')) failures.push(`${label}: inspection route is not released.`);
    if (!html.includes('12 passed · 0 failed · 0 pending · 0 unloaded')) failures.push(`${label}: integrity summary does not reconcile.`);
    for (const forbidden of ['content not released', 'arrives in Step 12', 'Publication gate not yet cleared', '>undefined<', '>NaN<', '>Infinity<']) if (html.includes(forbidden)) failures.push(`${label}: contains forbidden output ${forbidden}.`);
  }

  if (!overview.includes('data-overview-dashboard')) failures.push('Overview: dashboard contract marker is missing.');
  if ((overview.match(/data-chart-frame(?:\s|>)/gu) ?? []).length !== 6) failures.push('Overview: expected exactly six required figures.');
  if ((overview.match(/Open accessible data table/gu) ?? []).length !== 6) failures.push('Overview: every figure must expose an accessible table.');
  if ((overview.match(/data-owner-route=/gu) ?? []).length !== 6) failures.push('Overview: six scorecard indicators must expose canonical chapter owners.');
  for (const owner of ['/energy/demand', '/energy/generation', '/climate/cause', '/food-water/freshwater', '/food-water/plastics']) if (!overview.includes(`data-owner-route="${owner}"`)) failures.push(`Overview: canonical scorecard owner ${owner} is missing.`);
  for (const required of ['The connected system', 'Current-system evidence', 'Three ways to organize the response', 'Recommended portfolio architecture', 'Outcome claims remain readiness-aware', 'Implementation and research roadmap', 'Essential services can be expanded and made more resilient only if energy, climate, water, food, and materials are planned together.']) if (!overview.includes(required)) failures.push(`Overview: required narrative or figure is missing: ${required}`);
  if ((overview.match(/class="chapter-guide"/gu) ?? []).length !== 1 || (overview.match(/Canonical owner ·/gu) ?? []).length !== 6) failures.push('Overview: chapter guide or canonical-owner reconciliation is incomplete.');

  if (!methods.includes('data-methods-workspace')) failures.push('Methods: workspace contract marker is missing.');
  if ((methods.match(/data-ledger-filter/gu) ?? []).length < 2 || (methods.match(/data-ledger-query/gu) ?? []).length < 2) failures.push('Methods: source and claim search controls are incomplete.');
  for (const id of ['evidence-classes', 'source-registry', 'claim-ledger', 'dataset-catalog', 'definitions', 'scenario-crosswalk', 'transformations', 'model-registry', 'source-conflicts', 'gap-register', 'integrity-results', 'downloads']) if (!methods.includes(`id="${id}"`)) failures.push(`Methods: missing section ${id}.`);
  for (const count of ['336 canonical sources', '157 claim-to-source chains', '130 registered datasets', '128 scenarios', '102 open items', '25 source-definition collisions']) if (!methods.includes(count)) failures.push(`Methods: public ledger count is missing: ${count}.`);
  for (const file of ['sources.json', 'claims.json', 'datasets.json', 'scenarios.json', 'transformations.json', 'models.json', 'open-items.json', 'registry-summary.json', 'registry-manifest.json', 'data-model-manifest.json']) if (!methods.includes(`data/${file}`)) failures.push(`Methods: download link ${file} is missing.`);
  if (statSync(methodsPath).size > 3_000_000) failures.push('Methods: HTML exceeds the 3 MB publication budget.');
}

const mechanismLinks = [
  ['energy/demand', 'energy/grid'],
  ['energy/generation', 'food-water/freshwater'],
  ['energy/plan', 'climate/cause'],
  ['climate/cause', 'climate/risks'],
  ['climate/risks', 'food-water/food'],
  ['climate/coasts', 'food-water/freshwater'],
  ['food-water/industry', 'energy/plan'],
  ['food-water/plastics', 'food-water/plan'],
];
for (const [origin, destination] of mechanismLinks) {
  const html = htmlFor(origin);
  if (!html.includes('class="mechanism-links"') || !html.includes(`/US-Climate-Health-and-Water/${destination}`)) failures.push(`Mechanism link ${origin} -> ${destination} is missing.`);
}

const dataDirectory = resolve(dist, 'data');
const manifestPath = resolve(dataDirectory, 'data-model-manifest.json');
if (!existsSync(manifestPath)) failures.push('Public data-model manifest is missing from static output.');
else {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const entry of manifest.files) {
    const path = resolve(dataDirectory, entry.file);
    if (!existsSync(path)) { failures.push(`Manifest file is missing: ${entry.file}.`); continue; }
    const content = readFileSync(path);
    const sha256 = createHash('sha256').update(content).digest('hex');
    if (sha256 !== entry.sha256 || content.length !== entry.bytes) failures.push(`Manifest checksum or byte count failed for ${entry.file}.`);
    if (entry.recordCount !== null) {
      const payload = JSON.parse(content.toString('utf8'));
      if (payload.recordCount !== entry.recordCount || payload.records.length !== entry.recordCount) failures.push(`Manifest record count failed for ${entry.file}.`);
    }
  }
}

if (failures.length) throw new Error(`Sitewide validation failed:\n${failures.join('\n')}`);
console.log('PASS sitewide publication (Overview reconciliation, searchable Methods ledgers, 8 mechanism links, 12 integrity results, 10 public downloads, and SHA-256 manifest provenance).');
