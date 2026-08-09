import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const components = resolve(root, 'src/components');
const dist = resolve(root, 'dist');
const requiredComponents = [
  'ChapterIntro.astro',
  'MetricCard.astro',
  'ViewpointGrid.astro',
  'OptionComparison.astro',
  'RecommendationPanel.astro',
  'EvidenceBadge.astro',
  'SourceDrawer.astro',
  'CaveatPanel.astro',
  'EvidenceGap.astro',
  'ChartFrame.astro',
  'DataTable.astro',
  'ScenarioWorkbench.astro',
  'IntegrityFooter.astro',
];
const requiredPlots = [
  'LinePlot.astro',
  'AreaRangePlot.astro',
  'BarPlot.astro',
  'DotRangePlot.astro',
  'HeatmapPlot.astro',
  'NetworkPlot.astro',
  'MapContextPlot.astro',
  'CalendarHeatmapPlot.astro',
  'CorridorMapPlot.astro',
  'CapacitySemanticsPlot.astro',
];
const failures = [];

for (const file of requiredComponents) if (!existsSync(join(components, file))) failures.push(`Missing shared component ${file}.`);
for (const file of requiredPlots) if (!existsSync(join(components, 'charts', file))) failures.push(`Missing SVG primitive ${file}.`);

const sourceDrawer = readFileSync(join(components, 'SourceDrawer.astro'), 'utf8');
for (const contract of ['<dialog', 'data-source-drawer-close', 'href={source.url}', 'aria-haspopup="dialog"']) {
  if (!sourceDrawer.includes(contract)) failures.push(`SourceDrawer is missing ${contract}.`);
}
const chartFrame = readFileSync(join(components, 'ChartFrame.astro'), 'utf8');
for (const contract of ['data-chart-status', 'Open accessible data table', 'Text summary:', 'Sources and methods', 'forbiddenComparisons']) {
  if (!chartFrame.includes(contract)) failures.push(`ChartFrame is missing ${contract}.`);
}
const scenarioWorkbench = readFileSync(join(components, 'ScenarioWorkbench.astro'), 'utf8');
for (const contract of ['data-scenario-reset', 'aria-live="polite"', 'disabledReason', 'Model seam:']) {
  if (!scenarioWorkbench.includes(contract)) failures.push(`ScenarioWorkbench is missing ${contract}.`);
}

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : entry.name === 'index.html' ? [path] : [];
  });
}

const pages = htmlFiles(dist);
const storyPages = pages.filter((path) => /data-current-route="RTE-0000(?:0[2-9]|1[0-5])"/u.test(readFileSync(path, 'utf8')));
if (storyPages.length !== 14) failures.push(`Expected 14 story pages for shared-component checks; found ${storyPages.length}.`);
const shellStoryPages = storyPages.filter((path) => readFileSync(path, 'utf8').includes('data-release-status="shell"'));
const releasedStoryPages = storyPages.filter((path) => readFileSync(path, 'utf8').includes('data-release-status="chapter"'));
if (shellStoryPages.length !== 6) failures.push(`Expected 6 gated story shells; found ${shellStoryPages.length}.`);
if (releasedStoryPages.length !== 8) failures.push(`Expected 8 released story chapters; found ${releasedStoryPages.length}.`);
for (const path of shellStoryPages) {
  const html = readFileSync(path, 'utf8');
  if (!html.includes('data-evidence-badge="data_gap"')) failures.push(`${path}: missing explicit evidence-state badge.`);
  if (!html.includes('data-evidence-gap')) failures.push(`${path}: missing useful evidence-gap module.`);
  if (!html.includes('Next research action:')) failures.push(`${path}: evidence gap has no next action.`);
}
for (const path of releasedStoryPages) {
  const html = readFileSync(path, 'utf8');
  if (!html.includes('data-chart-frame')) failures.push(`${path}: released chapter has no shared chart frame.`);
  if (!html.includes('data-scenario-workbench-container')) failures.push(`${path}: released chapter has no shared working view.`);
}
const methods = pages.map((path) => readFileSync(path, 'utf8')).find((html) => html.includes('data-current-route="RTE-000016"'));
if (!methods?.includes('data-caveat-panel')) failures.push('Methods shell is missing the registry-count interpretation guardrail.');

if (failures.length) throw new Error(`Shared-component validation failed:\n${failures.join('\n')}`);
console.log(`PASS shared component contract (${requiredComponents.length} components, ${requiredPlots.length} SVG primitives, ${shellStoryPages.length} gated states, ${releasedStoryPages.length} released chapters).`);
