import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const chapters = [
  {
    path: resolve(root, 'dist/energy/system/index.html'),
    route: 'RTE-000002',
    key: 'energy-system',
    minimumCharts: 2,
    minimumTables: 4,
    requiredCopy: ['Use less primary energy per unit of service', 'not an hourly reliability model', 'Observed U.S. generation and two conditional scenario families'],
  },
  {
    path: resolve(root, 'dist/energy/demand/index.html'),
    route: 'RTE-000003',
    key: 'energy-demand',
    minimumCharts: 7,
    minimumTables: 7,
    requiredCopy: ['Pursue efficient and flexible electrification', 'EV charging is already contained', 'Do not fabricate future hourly load profiles'],
  },
];
const anchors = ['current-system', 'problems', 'choices', 'recommendation', 'model', 'delivery'];
const failures = [];

for (const chapter of chapters) {
  const html = readFileSync(chapter.path, 'utf8');
  const label = chapter.path.replace(root, '');
  if (!html.includes(`data-current-route="${chapter.route}"`)) failures.push(`${label}: canonical route identity is missing.`);
  if (!html.includes('data-release-status="chapter"')) failures.push(`${label}: release status is not chapter.`);
  if (!html.includes(`data-chapter-content="${chapter.key}"`)) failures.push(`${label}: chapter content identity is missing.`);
  for (const anchor of anchors) if (!html.includes(`id="${anchor}"`)) failures.push(`${label}: missing story anchor ${anchor}.`);
  for (const forbidden of ['Publication gate not yet cleared', 'evidence remains gated', 'content not released', 'undefined', 'NaN', 'Infinity']) {
    if (html.includes(forbidden)) failures.push(`${label}: contains forbidden output ${forbidden}.`);
  }
  const charts = (html.match(/data-chart-frame(?:\s|>)/gu) ?? []).length;
  const readyCharts = (html.match(/data-chart-status="ready"/gu) ?? []).length;
  const tables = (html.match(/data-data-table(?:\s|>)/gu) ?? []).length;
  const sourceLinks = (html.match(/data-source-drawer-trigger/gu) ?? []).length;
  if (charts < chapter.minimumCharts || readyCharts !== charts) failures.push(`${label}: expected at least ${chapter.minimumCharts} ready chart frames; found ${readyCharts}/${charts}.`);
  if (tables < chapter.minimumTables) failures.push(`${label}: expected at least ${chapter.minimumTables} accessible tables; found ${tables}.`);
  if (sourceLinks < 5) failures.push(`${label}: expected direct source access near evidence; found ${sourceLinks} links.`);
  if ((html.match(/Open accessible data table/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its table alternative.`);
  if ((html.match(/Text summary:/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its text summary.`);
  if (!html.includes('data-scenario-reset')) failures.push(`${label}: working-view reset is missing.`);
  if (!html.includes('aria-live="polite"')) failures.push(`${label}: working-view updates are not announced.`);
  if (!html.includes('class="recommendation-panel"')) failures.push(`${label}: recommendation panel is missing.`);
  for (const copy of chapter.requiredCopy) if (!html.includes(copy)) failures.push(`${label}: required conclusion or guardrail is missing: ${copy}.`);
  if (statSync(chapter.path).size > 1_500_000) failures.push(`${label}: HTML exceeds the 1.5 MB chapter budget.`);
}

if (failures.length) throw new Error(`Energy chapter validation failed:\n${failures.join('\n')}`);
console.log('PASS Energy System and Demand chapter contracts (2 released routes, evidence figures, source access, working views, required conclusions, and model guardrails).');
