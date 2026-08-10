interface WorkbenchLayer { controlId: string; value: string; title: string; finding: string; evidence: string; gate: string }
interface WorkbenchConfig { layers: readonly WorkbenchLayer[] }

function update(container: HTMLElement): void {
  const config = JSON.parse(container.dataset.strategyConfig ?? '{"layers":[]}') as WorkbenchConfig;
  const selects = [...container.querySelectorAll<HTMLSelectElement>('[data-scenario-control]')];
  const outputs = [...container.querySelectorAll<HTMLElement>('.strategy-workbench-output > section')];
  selects.forEach((select, index) => {
    const layer = config.layers.find((candidate) => candidate.controlId === select.dataset.scenarioControl && candidate.value === select.value);
    const output = outputs[index];
    if (!layer || !output) return;
    const set = (selector: string, value: string) => { const element = output.querySelector<HTMLElement>(selector); if (element) element.textContent = value; };
    set('[data-strategy-title]', layer.title);
    set('[data-strategy-finding]', layer.finding);
    set('[data-strategy-evidence]', layer.evidence);
    set('[data-strategy-gate]', layer.gate);
  });
}

document.querySelectorAll<HTMLElement>('[data-strategy-workbench]').forEach((container) => {
  container.addEventListener('change', () => update(container));
  container.addEventListener('click', (event) => { if ((event.target as HTMLElement).closest('[data-scenario-reset]')) window.setTimeout(() => update(container)); });
  update(container);
});
