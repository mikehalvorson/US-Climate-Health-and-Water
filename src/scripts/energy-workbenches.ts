export {};

interface EnergySystemRecord {
  geography: string;
  metric: string;
  value: number | null;
  unit: string;
  period: string;
  evidence: string;
}

interface DemandRecord {
  family: string;
  metric: string;
  horizon: number;
  value: number | null;
  unit: string;
  index: number | null;
  referencePeriod: string;
  scope: string;
  evidence: string;
}

function selected(container: Element, id: string): string {
  return container.querySelector<HTMLSelectElement>(`[data-scenario-control="${id}"]`)?.value ?? '';
}

function setText(container: Element, selector: string, value: string): void {
  const element = container.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value;
}

function initializeEnergySystem(container: HTMLElement): void {
  if (container.dataset.energyWorkbenchBound === 'true') return;
  container.dataset.energyWorkbenchBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '[]') as EnergySystemRecord[];
  const update = () => {
    const record = records.find((candidate) => candidate.geography === selected(container, 'geography') && candidate.metric === selected(container, 'metric'));
    setText(container, '[data-workbench-value]', record?.value === null || record?.value === undefined ? 'Not available for this combination' : record.value.toLocaleString('en-US', { maximumFractionDigits: 3 }));
    setText(container, '[data-workbench-unit]', record?.unit ?? '—');
    setText(container, '[data-workbench-period]', record?.period ?? '—');
    setText(container, '[data-workbench-evidence]', record?.evidence ?? 'No compatible value is registered. Select the United States for primary-energy measures.');
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

function initializeDemand(container: HTMLElement): void {
  if (container.dataset.demandWorkbenchBound === 'true') return;
  container.dataset.demandWorkbenchBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '[]') as DemandRecord[];
  const update = () => {
    const family = selected(container, 'family');
    const record = records.find((candidate) => candidate.family === family && candidate.metric === selected(container, 'metric') && candidate.horizon === Number(selected(container, 'horizon')));
    setText(container, '[data-model-family]', family.startsWith('aeo_') ? 'AEO2026 · NEMS' : 'NREL EFS 2018');
    setText(container, '[data-workbench-value]', record?.value === null || record?.value === undefined ? 'Not published' : record.value.toLocaleString('en-US', { maximumFractionDigits: 1 }));
    setText(container, '[data-workbench-unit]', record?.value === null || record?.value === undefined ? '' : record.unit);
    setText(container, '[data-workbench-index]', record?.index === null || record?.index === undefined ? 'Not available' : record.index.toLocaleString('en-US', { maximumFractionDigits: 1 }));
    setText(container, '[data-workbench-reference]', record?.referencePeriod ?? 'No compatible reference period');
    setText(container, '[data-workbench-scope]', record?.scope ?? 'No compatible measure');
    setText(container, '[data-workbench-evidence]', record?.evidence ?? 'No compatible record is registered.');
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

document.querySelectorAll<HTMLElement>('[data-energy-system-workbench]').forEach(initializeEnergySystem);
document.querySelectorAll<HTMLElement>('[data-demand-workbench]').forEach(initializeDemand);
