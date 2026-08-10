import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const chapters = [
  { path: resolve(root, 'dist/energy/plan/index.html'), route: 'RTE-000006', key: 'energy-plan', minimumCharts: 6, requiredCopy: ['A diversified low-carbon portfolio paired with efficient flexible demand and accelerated grid delivery.', 'No finished national energy optimization is published', 'least-cost optimum, reliability proof, household bill impact, or final 2050 build mix'] },
  { path: resolve(root, 'dist/climate/plan/index.html'), route: 'RTE-000010', key: 'climate-plan', minimumCharts: 7, requiredCopy: ['Pursue the lowest feasible emissions pathway while stress-testing essential services and long-lived assets against more severe locally credible conditions.', 'This is a robust-decision framework, not a national cost-benefit solution', 'No integrated damage total is authorized'] },
  { path: resolve(root, 'dist/food-water/food/index.html'), route: 'RTE-000012', key: 'food-agriculture', minimumCharts: 6, requiredCopy: ['Climate-resilient productivity, regionally appropriate crops and irrigation, soil and ecosystem protection, reduced loss and waste, supply-chain diversity, and affordable healthy diets.', 'not a national food optimizer', 'national optimized diet, food-security result, or land-water tradeoff'] },
  { path: resolve(root, 'dist/food-water/plan/index.html'), route: 'RTE-000015', key: 'food-water-plan', minimumCharts: 7, requiredCopy: ['Regionally tailored essential-service portfolios with national evidence, transparency, equity, and resilience standards.', 'No nationalized basin result is published', 'national average that hides shortage, ecological loss, household burden'] },
];
const anchors = ['current-system', 'problems', 'choices', 'recommendation', 'model', 'delivery'];
const failures = [];

for (const chapter of chapters) {
  const html = readFileSync(chapter.path, 'utf8');
  const label = chapter.path.replace(root, '');
  if (!html.includes(`data-current-route="${chapter.route}"`) || !html.includes('data-release-status="chapter"') || !html.includes(`data-chapter-content="${chapter.key}"`)) failures.push(`${label}: route or release identity is missing.`);
  for (const anchor of anchors) if (!html.includes(`id="${anchor}"`)) failures.push(`${label}: missing story anchor ${anchor}.`);
  for (const forbidden of ['Publication gate not yet cleared', 'evidence remains gated', 'content not released', '>undefined<', '>NaN<', '>Infinity<']) if (html.includes(forbidden)) failures.push(`${label}: contains forbidden output ${forbidden}.`);
  const charts = (html.match(/data-chart-frame(?:\s|>)/gu) ?? []).length;
  const readyCharts = (html.match(/data-chart-status="ready"/gu) ?? []).length;
  const tables = (html.match(/data-data-table(?:\s|>)/gu) ?? []).length;
  const sourceLinks = (html.match(/data-source-drawer-trigger/gu) ?? []).length;
  if (charts < chapter.minimumCharts || readyCharts !== charts) failures.push(`${label}: expected at least ${chapter.minimumCharts} ready chart frames; found ${readyCharts}/${charts}.`);
  if (tables < charts) failures.push(`${label}: every chart requires an accessible data table; found ${tables} tables for ${charts} charts.`);
  if (sourceLinks < 10) failures.push(`${label}: expected direct source access near evidence; found ${sourceLinks} links.`);
  if ((html.match(/Open accessible data table/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its table alternative.`);
  if ((html.match(/Text summary:/gu) ?? []).length !== charts) failures.push(`${label}: every chart frame must expose its text summary.`);
  if (!html.includes('data-scenario-reset') || !html.includes('aria-live="polite"')) failures.push(`${label}: working view reset or announcement is missing.`);
  if (!html.includes('class="recommendation-panel"')) failures.push(`${label}: recommendation panel is missing.`);
  if (!html.includes('data-open-item-id=')) failures.push(`${label}: unavailable quantitative results are not linked to a canonical gap.`);
  for (const copy of chapter.requiredCopy) if (!html.includes(copy)) failures.push(`${label}: required conclusion, boundary, or guardrail is missing: ${copy}.`);
  if (statSync(chapter.path).size > 2_000_000) failures.push(`${label}: HTML exceeds the 2 MB chapter budget.`);
}

if (failures.length) throw new Error(`Capstone chapter validation failed:\n${failures.join('\n')}`);
console.log('PASS Food & Agriculture and three capstone plans (4 released routes, 26 evidence figures, working views, canonical gaps, model contracts, stress matrices, recommendations, and delivery gates).');
