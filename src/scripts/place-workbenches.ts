export {};

function selected(container: Element, id: string): string {
  return container.querySelector<HTMLSelectElement>(`[data-scenario-control="${id}"]`)?.value ?? '';
}
function setText(container: Element, selector: string, value: unknown): void {
  const element = container.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value === null || value === undefined || value === '' ? 'Unavailable' : String(value);
}

function initializeCoast(container: HTMLElement): void {
  if (container.dataset.placeBound === 'true') return;
  container.dataset.placeBound = 'true';
  const data = JSON.parse(container.dataset.workbenchRecords ?? '{}') as {
    cities: { id: string; label: string; gauge: string; stationId: string; scenarioLabel: string; gaugeTrend: number | null; gaugeUnit: string; baseline: string; planningContext: string; floodContext: string; guardrail: string }[];
    records: { city: string; scenario: string; horizon: number; changeFrom2020M: number; locationType: string }[];
  };
  const update = () => {
    const city = data.cities.find((item) => item.id === selected(container, 'city'));
    const record = data.records.find((item) => item.city === selected(container, 'city') && item.scenario === selected(container, 'scenario') && String(item.horizon) === selected(container, 'horizon'));
    setText(container, '[data-coast-city]', city?.label);
    setText(container, '[data-coast-gauge]', city?.gauge);
    setText(container, '[data-coast-station]', city?.stationId);
    setText(container, '[data-coast-trend]', city?.gaugeTrend);
    setText(container, '[data-coast-scenario-location]', city?.scenarioLabel);
    setText(container, '[data-coast-change]', record?.changeFrom2020M);
    setText(container, '[data-coast-scenario]', record?.scenario);
    setText(container, '[data-coast-horizon]', record?.horizon);
    setText(container, '[data-coast-location-type]', record?.locationType);
    setText(container, '[data-coast-planning]', city?.planningContext);
    setText(container, '[data-coast-flood-context]', city?.floodContext);
    setText(container, '[data-coast-guardrail]', city?.guardrail);
    setText(container, '[data-coast-baseline]', city?.baseline);
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

function initializeIndustry(container: HTMLElement): void {
  if (container.dataset.placeBound === 'true') return;
  container.dataset.placeBound = 'true';
  const data = JSON.parse(container.dataset.workbenchRecords ?? '{}') as {
    facilityTypes: { id: string; label: string; context: string }[];
    boundaries: { id: string; label: string }[];
    records: { facility: string; boundary: string; value: number; unit: string; period: string; geography: string; evidenceState: string; qualification: string }[];
  };
  const update = () => {
    const facility = data.facilityTypes.find((item) => item.id === selected(container, 'facility'));
    const boundary = data.boundaries.find((item) => item.id === selected(container, 'boundary'));
    const record = data.records.find((item) => item.facility === selected(container, 'facility') && item.boundary === selected(container, 'boundary'));
    setText(container, '[data-industry-facility]', facility?.label);
    setText(container, '[data-industry-context]', facility?.context);
    setText(container, '[data-industry-boundary]', boundary?.label);
    setText(container, '[data-industry-value]', record?.value);
    setText(container, '[data-industry-unit]', record?.unit);
    setText(container, '[data-industry-period]', record?.period);
    setText(container, '[data-industry-geography]', record?.geography);
    setText(container, '[data-industry-state]', record?.evidenceState ?? 'Data gap');
    setText(container, '[data-industry-qualification]', record?.qualification ?? 'No compatible quantitative record is available for this facility and boundary.');
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

document.querySelectorAll<HTMLElement>('[data-coast-workbench]').forEach(initializeCoast);
document.querySelectorAll<HTMLElement>('[data-industry-workbench]').forEach(initializeIndustry);
