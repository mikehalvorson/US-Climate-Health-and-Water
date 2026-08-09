export {};

function selected(container: Element, id: string): string {
  return container.querySelector<HTMLSelectElement>(`[data-scenario-control="${id}"]`)?.value ?? '';
}

function setText(container: Element, selector: string, value: unknown): void {
  const element = container.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value === null || value === undefined || value === '' ? 'Unavailable' : String(value);
}

function initializeWater(container: HTMLElement): void {
  if (container.dataset.foodWaterBound === 'true') return;
  container.dataset.foodWaterBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '{}') as {
    sectors: { id: string; withdrawal: number; consumption: number; fraction: number }[];
    sources: { id: string; label: string; value: number; unit: string }[];
    cities: { id: string; label: string; profile: string; exposure: string; qualification: string }[];
    risks: { id: string; label: string; type: string; horizon: string; finding: string; confidence: string }[];
    technologies: { id: string; family: string; service: string; energy: string; interpretation: string }[];
  };
  const update = () => {
    const sector = records.sectors.find((item) => item.id === selected(container, 'sector'));
    const source = records.sources.find((item) => item.id === selected(container, 'source'));
    const city = records.cities.find((item) => item.id === selected(container, 'city'));
    const risk = records.risks.find((item) => item.id === selected(container, 'risk'));
    const technology = records.technologies.find((item) => item.id === selected(container, 'technology'));
    setText(container, '[data-water-sector-withdrawal]', sector?.withdrawal.toLocaleString('en-US'));
    setText(container, '[data-water-sector-consumption]', sector ? `${sector.consumption.toLocaleString('en-US')} Mgal/day` : null);
    setText(container, '[data-water-sector-fraction]', sector ? `${sector.fraction}%` : null);
    setText(container, '[data-water-source-value]', source?.value);
    setText(container, '[data-water-source-unit]', source?.unit);
    setText(container, '[data-water-source-label]', source?.label);
    setText(container, '[data-water-city-label]', city?.label);
    setText(container, '[data-water-city-profile]', city?.profile);
    setText(container, '[data-water-city-exposure]', city?.exposure);
    setText(container, '[data-water-city-qualification]', city?.qualification);
    setText(container, '[data-water-risk-label]', risk?.label);
    setText(container, '[data-water-risk-type]', risk?.type.replaceAll('_', ' '));
    setText(container, '[data-water-risk-horizon]', risk?.horizon.replaceAll('_', ' '));
    setText(container, '[data-water-risk-finding]', risk?.finding);
    setText(container, '[data-water-risk-confidence]', risk?.confidence.replaceAll('_', ' '));
    setText(container, '[data-water-tech-family]', technology?.family);
    setText(container, '[data-water-tech-service]', technology?.service);
    setText(container, '[data-water-tech-energy]', technology?.energy);
    setText(container, '[data-water-tech-interpretation]', technology?.interpretation);
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

function initializePlastics(container: HTMLElement): void {
  if (container.dataset.foodWaterBound === 'true') return;
  container.dataset.foodWaterBound = 'true';
  const records = JSON.parse(container.dataset.workbenchRecords ?? '{}') as {
    resins: { id: string; label: string; resinClass: string; uses: string; priority: string; healthGuardrail: string }[];
    applications: { id: string; label: string; volume: number | null; decision: string }[];
    exposures: { id: string; label: string; boundary: string }[];
    healthClasses: { id: string; label: string; finding: string; causalStatus: string; guardrail: string }[];
    policies: { id: string; label: string; mechanisms: string; scope: string }[];
    replacements: { id: string; label: string; eligibility: string; applications: string; water: string }[];
  };
  const update = () => {
    const resin = records.resins.find((item) => item.id === selected(container, 'resin'));
    const application = records.applications.find((item) => item.id === selected(container, 'application'));
    const exposure = records.exposures.find((item) => item.id === selected(container, 'exposure'));
    const health = records.healthClasses.find((item) => item.id === selected(container, 'health'));
    const policy = records.policies.find((item) => item.id === selected(container, 'policy'));
    const replacement = records.replacements.find((item) => item.id === selected(container, 'replacement'));
    setText(container, '[data-plastic-resin-label]', resin?.label);
    setText(container, '[data-plastic-resin-class]', resin?.resinClass);
    setText(container, '[data-plastic-resin-uses]', resin?.uses);
    setText(container, '[data-plastic-resin-priority]', resin?.priority);
    setText(container, '[data-plastic-resin-guardrail]', resin?.healthGuardrail);
    setText(container, '[data-plastic-application-label]', application?.label);
    setText(container, '[data-plastic-application-volume]', application?.volume);
    setText(container, '[data-plastic-application-decision]', application?.decision);
    setText(container, '[data-plastic-exposure-label]', exposure?.label);
    setText(container, '[data-plastic-exposure-boundary]', exposure?.boundary);
    setText(container, '[data-plastic-health-label]', health?.label);
    setText(container, '[data-plastic-health-finding]', health?.finding);
    setText(container, '[data-plastic-health-causal]', health?.causalStatus);
    setText(container, '[data-plastic-health-guardrail]', health?.guardrail);
    setText(container, '[data-plastic-policy-label]', policy?.label);
    setText(container, '[data-plastic-policy-mechanisms]', policy?.mechanisms);
    setText(container, '[data-plastic-policy-scope]', policy?.scope);
    setText(container, '[data-plastic-replacement-label]', replacement?.label);
    setText(container, '[data-plastic-replacement-eligibility]', replacement?.eligibility);
    setText(container, '[data-plastic-replacement-applications]', replacement?.applications);
    setText(container, '[data-plastic-replacement-water]', replacement?.water);
  };
  container.addEventListener('scenario:change', update);
  queueMicrotask(update);
}

document.querySelectorAll<HTMLElement>('[data-water-workbench]').forEach(initializeWater);
document.querySelectorAll<HTMLElement>('[data-plastics-workbench]').forEach(initializePlastics);
