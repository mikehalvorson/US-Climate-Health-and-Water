import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const failures = [];
const base = '/US-Climate-Health-and-Water/';
const routes = [
  '', 'energy/system', 'energy/demand', 'energy/generation', 'energy/grid', 'energy/plan',
  'climate/cause', 'climate/risks', 'climate/coasts', 'climate/plan',
  'food-water/freshwater', 'food-water/food', 'food-water/industry', 'food-water/plastics', 'food-water/plan',
  'methods',
];

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

for (const route of routes) {
  const path = resolve(dist, route, 'index.html');
  if (!existsSync(path)) { failures.push(`Missing route output: ${route || '/'}.`); continue; }
  const html = readFileSync(path, 'utf8');
  const label = route || '/';
  const expectedCanonical = `https://mikehalvorson.github.io${base}${route}`;
  if (!html.includes('<html lang="en"')) failures.push(`${label}: missing document language.`);
  if (!html.includes('name="viewport" content="width=device-width, initial-scale=1"')) failures.push(`${label}: missing responsive viewport.`);
  if (!html.includes(`rel="canonical" href="${expectedCanonical}"`)) failures.push(`${label}: canonical URL does not use the Pages base path.`);
  if ((html.match(/<main(?:\s|>)/gu) ?? []).length !== 1 || !html.includes('id="main-content"')) failures.push(`${label}: requires one addressable main landmark.`);
  if (!html.includes('class="skip-link" href="#main-content"')) failures.push(`${label}: skip link is missing.`);
  if (!html.includes('<noscript>') || !html.includes('chart summaries, and data tables remain readable')) failures.push(`${label}: no-JavaScript disclosure is missing.`);
  if (!html.includes('data-release-status="chapter"')) failures.push(`${label}: route is not released.`);
  if (!html.includes('12 passed · 0 failed · 0 pending · 0 unloaded')) failures.push(`${label}: final integrity summary is not reconciled.`);
  if ((html.match(/<h1(?:\s|>)/gu) ?? []).length !== 1) failures.push(`${label}: requires exactly one h1.`);
  const charts = (html.match(/data-chart-frame(?:\s|>)/gu) ?? []).length;
  const alternatives = (html.match(/Open accessible data table/gu) ?? []).length;
  if (charts !== alternatives) failures.push(`${label}: ${charts} chart frames do not reconcile to ${alternatives} table alternatives.`);
  if (statSync(path).size > (route === 'methods' ? 3_000_000 : 2_000_000)) failures.push(`${label}: HTML exceeds its release budget.`);
}

const assetFiles = filesUnder(resolve(dist, '_astro'));
const cssFiles = assetFiles.filter((path) => extname(path) === '.css');
const jsFiles = assetFiles.filter((path) => extname(path) === '.js');
const cssBytes = cssFiles.reduce((sum, path) => sum + statSync(path).size, 0);
const jsBytes = jsFiles.reduce((sum, path) => sum + statSync(path).size, 0);
if (cssBytes > 90_000) failures.push(`CSS budget exceeded: ${cssBytes} > 90000 bytes.`);
if (jsBytes > 75_000) failures.push(`JavaScript budget exceeded: ${jsBytes} > 75000 bytes.`);
for (const path of jsFiles) if (statSync(path).size > 15_000) failures.push(`JavaScript chunk budget exceeded: ${relative(dist, path)}.`);

const dataFiles = filesUnder(resolve(dist, 'data'));
const dataBytes = dataFiles.reduce((sum, path) => sum + statSync(path).size, 0);
if (dataBytes > 1_200_000) failures.push(`Public data budget exceeded: ${dataBytes} > 1200000 bytes.`);
for (const path of dataFiles) if (statSync(path).size > 400_000) failures.push(`Public data file budget exceeded: ${relative(dist, path)}.`);

const css = readFileSync(resolve(root, 'src', 'styles', 'global.css'), 'utf8');
for (const contract of [
  ':focus-visible', '@media (max-width: 24rem)', '@media (prefers-reduced-motion: reduce)', '@media print',
  'body {\n  margin: 0;\n  min-width: 0;',
  '.source-disclosure__trigger { display: inline-flex; min-height: 2.75rem;',
  '.svg-plot { display: block; width: 100%; height: auto;',
  '.overview-dashboard > *, .methods-workspace > * { min-width: 0; }',
  '.methods-table-scroll, .data-table-scroll { max-height: none; overflow: visible; border: 0; }',
  '.chart-frame__table > :not(summary) { display: block !important; }',
]) if (!css.includes(contract)) failures.push(`Release CSS contract is missing: ${contract}`);

if (failures.length) throw new Error(`Release validation failed:\n${failures.join('\n')}`);
console.log(`PASS release hardening (16 routes, ${cssBytes} CSS bytes, ${jsBytes} JS bytes, ${dataBytes} public-data bytes, no-script disclosure, touch targets, reduced motion, print expansion, and accessible chart alternatives).`);
