import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const chapters = [
  {
    path: resolve(root, 'dist/climate/coasts/index.html'), route: 'RTE-000009', key: 'coasts-communities', charts: 8, ready: 8, empty: 0,
    requiredCopy: ['Local adaptive pathways combining protection, accommodation, restoration, exposure avoidance', 'A threshold-exceedance day does not mean an entire city is flooded', '30°N / 90°W one-degree grid near New Orleans', 'high-end 2100 migration scenario is a forecast'],
  },
  {
    path: resolve(root, 'dist/food-water/industry/index.html'), route: 'RTE-000013', key: 'industry-water', charts: 7, ready: 6, empty: 1,
    requiredCopy: ['Watershed-budget siting and operation with disclosure', 'Nationally small demand does not establish locally small impact', 'Facility map unavailable', 'Evidence required to enable a facility-water map', 'National averages must not be assigned to facilities'],
  },
];
const anchors = ['current-system', 'problems', 'choices', 'recommendation', 'model', 'delivery'];
const failures = [];

for (const chapter of chapters) {
  const html = readFileSync(chapter.path, 'utf8');
  const label = chapter.path.replace(root, '');
  if (!html.includes(`data-current-route="${chapter.route}"`) || !html.includes('data-release-status="chapter"') || !html.includes(`data-chapter-content="${chapter.key}"`)) failures.push(`${label}: route or release identity is missing.`);
  for (const anchor of anchors) if (!html.includes(`id="${anchor}"`)) failures.push(`${label}: missing story anchor ${anchor}.`);
  for (const forbidden of ['Publication gate not yet cleared', 'evidence remains gated', '>undefined<', '>NaN<', '>Infinity<']) if (html.includes(forbidden)) failures.push(`${label}: contains forbidden output ${forbidden}.`);
  const charts = (html.match(/data-chart-frame(?:\s|>)/gu) ?? []).length;
  const ready = (html.match(/data-chart-status="ready"/gu) ?? []).length;
  const empty = (html.match(/data-chart-status="empty"/gu) ?? []).length;
  const tables = (html.match(/data-data-table(?:\s|>)/gu) ?? []).length;
  if (charts !== chapter.charts || ready !== chapter.ready || empty !== chapter.empty) failures.push(`${label}: expected ${chapter.charts} charts (${chapter.ready} ready, ${chapter.empty} empty); found ${charts} (${ready} ready, ${empty} empty).`);
  if (tables !== charts) failures.push(`${label}: expected one accessible table per chart; found ${tables}/${charts}.`);
  if ((html.match(/Text summary:/gu) ?? []).length !== charts || (html.match(/Open accessible data table/gu) ?? []).length !== charts) failures.push(`${label}: chart text or table alternatives are incomplete.`);
  if (!html.includes('data-scenario-reset') || !html.includes('aria-live="polite"')) failures.push(`${label}: accessible working view is missing.`);
  if (!html.includes('class="recommendation-panel"')) failures.push(`${label}: recommendation panel is missing.`);
  for (const copy of chapter.requiredCopy) if (!html.includes(copy)) failures.push(`${label}: required boundary or conclusion is missing: ${copy}.`);
  if (statSync(chapter.path).size > 2_000_000) failures.push(`${label}: HTML exceeds the 2 MB chapter budget.`);
}

if (failures.length) throw new Error(`Place-dependent chapter validation failed:\n${failures.join('\n')}`);
console.log('PASS Coasts & Communities and Water for Energy & Industry contracts (15 figures, city/gauge/baseline bindings, threshold and scenario guardrails, facility accounting boundaries, disabled site map, map alternatives, and accessible working views).');
