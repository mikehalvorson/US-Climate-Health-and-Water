import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const chapters = [
  {
    path: resolve(root, 'dist/food-water/freshwater/index.html'),
    route: 'RTE-000011',
    key: 'freshwater-security',
    minimumCharts: 9,
    requiredCopy: ['Basin and utility portfolios that begin with efficiency', 'Planning horizons are not run-out dates', 'Withdrawal is not consumption', 'no run-out model'],
  },
  {
    path: resolve(root, 'dist/food-water/plastics/index.html'),
    route: 'RTE-000014',
    key: 'plastics-materials',
    minimumCharts: 11,
    requiredCopy: ['Eliminate unnecessary and high-exposure uses first', 'Gross avoided resin water is net water savings', 'Detected particles prove causation', 'Every required national functional-unit water-balance term is explicitly unavailable'],
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
  for (const forbidden of ['Publication gate not yet cleared', 'evidence remains gated', 'content not released', '>undefined<', '>NaN<', '>Infinity<']) {
    if (html.includes(forbidden)) failures.push(`${label}: contains forbidden output ${forbidden}.`);
  }
  const charts = (html.match(/data-chart-frame(?:\s|>)/gu) ?? []).length;
  const readyCharts = (html.match(/data-chart-status="ready"/gu) ?? []).length;
  const tables = (html.match(/data-data-table(?:\s|>)/gu) ?? []).length;
  const sourceLinks = (html.match(/data-source-drawer-trigger/gu) ?? []).length;
  if (charts < chapter.minimumCharts || readyCharts !== charts) failures.push(`${label}: expected at least ${chapter.minimumCharts} ready chart frames; found ${readyCharts}/${charts}.`);
  if (tables < charts) failures.push(`${label}: every chart requires an accessible data table; found ${tables} tables for ${charts} charts.`);
  if (sourceLinks < 10) failures.push(`${label}: expected direct source access near evidence; found ${sourceLinks} links.`);
  if ((html.match(/Open accessible data table/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its table alternative.`);
  if ((html.match(/Text summary:/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its text summary.`);
  if (!html.includes('data-scenario-reset')) failures.push(`${label}: working-view reset is missing.`);
  if (!html.includes('aria-live="polite"')) failures.push(`${label}: working-view updates are not announced.`);
  if (!html.includes('class="recommendation-panel"')) failures.push(`${label}: recommendation panel is missing.`);
  for (const copy of chapter.requiredCopy) if (!html.includes(copy)) failures.push(`${label}: required conclusion, boundary, or guardrail is missing: ${copy}.`);
  if (statSync(chapter.path).size > 2_000_000) failures.push(`${label}: HTML exceeds the 2 MB chapter budget.`);
}

if (failures.length) throw new Error(`Food and water chapter validation failed:\n${failures.join('\n')}`);
console.log('PASS Freshwater Security and Plastics & Materials contracts (2 released routes, 20 evidence figures, source access, working views, accounting boundaries, typed horizons, health classes, and explicit net-water gaps).');
