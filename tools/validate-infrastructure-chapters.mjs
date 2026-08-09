import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const chapters = [
  {
    path: resolve(root, 'dist/energy/generation/index.html'), route: 'RTE-000004', key: 'generation-choices', minimumCharts: 7,
    requiredCopy: ['Rapid renewables, preservation of safe and economical existing firm low-carbon assets', 'Compatible portfolio coefficients do not exist', 'without producing a clean score'],
  },
  {
    path: resolve(root, 'dist/energy/grid/index.html'), route: 'RTE-000005', key: 'grid-delivery', minimumCharts: 8,
    requiredCopy: ['Combine grid-enhancing technologies and reconductoring with new interregional corridors', 'exactly 20 released features', 'missing; not zero', 'not an operational power-flow model'],
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
  for (const forbidden of ['Publication gate not yet cleared', 'evidence remains gated', '>undefined<', '>NaN<', '>Infinity<']) if (html.includes(forbidden)) failures.push(`${label}: contains forbidden output ${forbidden}.`);
  const charts = (html.match(/data-chart-frame(?:\s|>)/gu) ?? []).length;
  const readyCharts = (html.match(/data-chart-status="ready"/gu) ?? []).length;
  const tables = (html.match(/data-data-table(?:\s|>)/gu) ?? []).length;
  if (charts < chapter.minimumCharts || readyCharts !== charts) failures.push(`${label}: expected at least ${chapter.minimumCharts} ready chart frames; found ${readyCharts}/${charts}.`);
  if (tables < charts) failures.push(`${label}: every chart requires an accessible data table; found ${tables} tables for ${charts} charts.`);
  if ((html.match(/Open accessible data table/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its table alternative.`);
  if ((html.match(/Text summary:/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its text summary.`);
  if (!html.includes('data-scenario-reset') || !html.includes('aria-live="polite"')) failures.push(`${label}: accessible working-view controls are missing.`);
  if (!html.includes('class="recommendation-panel"') || !html.includes('data-evidence-gap')) failures.push(`${label}: recommendation or explicit evidence gap is missing.`);
  for (const copy of chapter.requiredCopy) if (!html.includes(copy)) failures.push(`${label}: required conclusion or guardrail is missing: ${copy}.`);
  if (statSync(chapter.path).size > 2_000_000) failures.push(`${label}: HTML exceeds the 2 MB chapter budget.`);
}

if (failures.length) throw new Error(`Generation and grid chapter validation failed:\n${failures.join('\n')}`);
console.log('PASS Generation Choices and Grid & Delivery contracts (2 released routes, 15 evidence figures, exact corridor cardinality, hourly null preservation, capacity semantics, working views, recommendations, and explicit model gaps).');
