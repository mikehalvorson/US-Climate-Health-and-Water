export {};

function selected(container: Element, id: string): string {
  return container.querySelector<HTMLSelectElement>(`[data-scenario-control="${id}"]`)?.value ?? '';
}

function setText(container: Element, selector: string, value: unknown): void {
  const element = container.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value === null || value === undefined || value === '' ? 'Unavailable' : String(value);
}

function initializeGeneration(container: HTMLElement): void {
  if (container.dataset.infrastructureBound === 'true') return;
  container.dataset.infrastructureBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '{}') as {
    technologies: { id: string; label: string; deployment: string; role: string; mitigation: string; residual: string; [key: string]: string }[];
    dimensions: { id: string; label: string; field: string }[];
  };
  const update = () => {
    const technology = records.technologies.find((item) => item.id === selected(container, 'technology'));
    const dimension = records.dimensions.find((item) => item.id === selected(container, 'dimension'));
    setText(container, '[data-generation-label]', technology?.label);
    setText(container, '[data-generation-deployment]', technology?.deployment);
    setText(container, '[data-generation-role]', technology?.role);
    setText(container, '[data-generation-dimension]', dimension?.label);
    setText(container, '[data-generation-finding]', technology && dimension ? technology[dimension.field] : null);
    setText(container, '[data-generation-mitigation]', technology?.mitigation);
    setText(container, '[data-generation-residual]', technology?.residual);
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

function initializeGrid(container: HTMLElement): void {
  if (container.dataset.infrastructureBound === 'true') return;
  container.dataset.infrastructureBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '{}') as {
    regions: { id: string; label: string; peakMw: number; peakTime: string; clockBasis: string }[];
    daily: { balancingAuthority: string; date: string; peakMw: number | null; missingHours: number }[];
    corridorStatuses: { id: string; label: string; corridors: string[] }[];
    capacityTypes: { id: string; label: string; definition: string; warning: string }[];
    processStages: { id: string; label: string; lane: string; status: string; actors: string; warning: string }[];
  };
  const regionSelect = container.querySelector<HTMLSelectElement>('[data-scenario-control="region"]');
  const dateSelect = container.querySelector<HTMLSelectElement>('[data-scenario-control="date"]');
  const allDates = [...new Set(records.daily.map((item) => item.date))];
  const updateDateOptions = () => {
    if (!dateSelect) return;
    const current = dateSelect.value;
    const available = records.daily.filter((item) => item.balancingAuthority === regionSelect?.value).map((item) => item.date);
    dateSelect.replaceChildren(...allDates.filter((date) => available.includes(date)).map((date) => new Option(date, date, false, date === current)));
    if (!available.includes(current)) dateSelect.value = available[0] ?? '';
  };
  const update = () => {
    const region = records.regions.find((item) => item.id === selected(container, 'region'));
    const daily = records.daily.find((item) => item.balancingAuthority === selected(container, 'region') && item.date === selected(container, 'date'));
    const corridor = records.corridorStatuses.find((item) => item.id === selected(container, 'corridor'));
    const capacity = records.capacityTypes.find((item) => item.id === selected(container, 'capacity'));
    const stage = records.processStages.find((item) => item.id === selected(container, 'stage'));
    setText(container, '[data-grid-region]', region?.label);
    setText(container, '[data-grid-region-peak]', region?.peakMw.toLocaleString('en-US'));
    setText(container, '[data-grid-region-time]', region?.peakTime);
    setText(container, '[data-grid-region-clock]', region?.clockBasis);
    setText(container, '[data-grid-date]', daily?.date);
    setText(container, '[data-grid-date-peak]', daily?.peakMw?.toLocaleString('en-US'));
    setText(container, '[data-grid-date-missing]', daily?.missingHours);
    setText(container, '[data-grid-corridor-status]', corridor?.label);
    setText(container, '[data-grid-corridor-names]', corridor?.corridors.join('; '));
    setText(container, '[data-grid-capacity-label]', capacity?.label);
    setText(container, '[data-grid-capacity-definition]', capacity?.definition);
    setText(container, '[data-grid-capacity-warning]', capacity?.warning);
    setText(container, '[data-grid-stage-label]', stage?.label);
    setText(container, '[data-grid-stage-lane]', stage?.lane);
    setText(container, '[data-grid-stage-status]', stage?.status);
    setText(container, '[data-grid-stage-actors]', stage?.actors);
    setText(container, '[data-grid-stage-warning]', stage?.warning);
  };
  regionSelect?.addEventListener('change', () => { updateDateOptions(); queueMicrotask(update); });
  container.addEventListener('scenario:change', update);
  updateDateOptions();
  queueMicrotask(update);
}

document.querySelectorAll<HTMLElement>('[data-generation-workbench]').forEach(initializeGeneration);
document.querySelectorAll<HTMLElement>('[data-grid-workbench]').forEach(initializeGrid);
