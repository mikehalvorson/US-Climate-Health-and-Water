export {};

interface CauseRecord {
  series: string;
  observedValue: number | null;
  observedYear: number | null;
  observedUnit: string;
  nativeBaseline: string;
  scenario: string;
  period: string;
  warmingBest: number;
  warmingLow: number;
  warmingHigh: number;
  warmingBaseline: string;
}

interface RiskRecord {
  family: string;
  metric: string;
  warming: number;
  low: number | null;
  central: number | null;
  high: number | null;
  unit: string;
  confidence: string;
  geography: string;
  guardrail: string;
}

function selected(container: Element, id: string): string {
  return container.querySelector<HTMLSelectElement>(`[data-scenario-control="${id}"]`)?.value ?? '';
}

function setText(container: Element, selector: string, value: string): void {
  const element = container.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value;
}

function formatted(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? 'Unavailable' : value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function initializeCause(container: HTMLElement): void {
  if (container.dataset.climateCauseBound === 'true') return;
  container.dataset.climateCauseBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '[]') as CauseRecord[];
  const update = () => {
    const record = records.find((candidate) => candidate.series === selected(container, 'series') && candidate.scenario === selected(container, 'scenario') && candidate.period === selected(container, 'period'));
    setText(container, '[data-observed-value]', formatted(record?.observedValue, 3));
    setText(container, '[data-observed-unit]', record?.observedUnit ?? '');
    setText(container, '[data-observed-year]', formatted(record?.observedYear, 0));
    setText(container, '[data-observed-baseline]', record?.nativeBaseline ?? 'Unavailable');
    setText(container, '[data-warming-best]', formatted(record?.warmingBest, 1));
    setText(container, '[data-warming-range]', record ? `${formatted(record.warmingLow, 1)}–${formatted(record.warmingHigh, 1)}°C` : 'Unavailable');
    setText(container, '[data-warming-baseline]', record?.warmingBaseline ?? 'Unavailable');
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

function initializeRisk(container: HTMLElement): void {
  if (container.dataset.climateRiskBound === 'true') return;
  container.dataset.climateRiskBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '[]') as RiskRecord[];
  const update = () => {
    const record = records.find((candidate) => candidate.family === selected(container, 'family') && candidate.warming === Number(selected(container, 'warming')) && candidate.geography === selected(container, 'geography') && candidate.confidence === selected(container, 'confidence'));
    setText(container, '[data-risk-metric]', record ? record.metric.replaceAll('_', ' ') : 'Unavailable for this combination');
    setText(container, '[data-risk-value]', formatted(record?.central, 1));
    setText(container, '[data-risk-unit]', record?.central === null || record?.central === undefined ? '' : record.unit.replaceAll('_', ' '));
    setText(container, '[data-risk-range]', record?.low === null || record?.low === undefined || record.high === null ? 'Not published for this metric' : `${formatted(record.low, 1)}–${formatted(record.high, 1)} ${record.unit.replaceAll('_', ' ')}`);
    setText(container, '[data-risk-status]', record ? 'Compatible assessed relationship' : 'Deliberate null · no interpolation');
    setText(container, '[data-risk-guardrail]', record?.guardrail ?? 'No compatible assessed row exists. The dashboard does not interpolate across warming levels, geographies, confidence classes, or risk families.');
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

document.querySelectorAll<HTMLElement>('[data-cause-workbench]').forEach(initializeCause);
document.querySelectorAll<HTMLElement>('[data-risk-workbench]').forEach(initializeRisk);
