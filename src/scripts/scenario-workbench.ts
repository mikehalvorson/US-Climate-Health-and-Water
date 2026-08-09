import {
  readScenarioState,
  writeScenarioState,
  type ScenarioControlDefinition,
  type ScenarioState,
} from '../lib/scenarios/state';

const forms = document.querySelectorAll<HTMLFormElement>('[data-scenario-workbench]');

for (const form of forms) {
  if (form.dataset.scenarioBound === 'true') continue;
  form.dataset.scenarioBound = 'true';
  const container = form.closest<HTMLElement>('[data-scenario-workbench-container]');
  const summary = container?.querySelector<HTMLElement>('[data-scenario-summary]');
  const reset = form.querySelector<HTMLButtonElement>('[data-scenario-reset]');
  const controls = JSON.parse(form.dataset.scenarioControls ?? '[]') as ScenarioControlDefinition[];

  const applyToForm = (state: ScenarioState) => {
    for (const control of controls) {
      const select = form.querySelector<HTMLSelectElement>(`[data-scenario-control="${control.id}"]`);
      const value = state[control.id];
      if (select && value !== undefined) select.value = value;
    }
  };
  const stateFromForm = (): ScenarioState => Object.fromEntries(controls.map((control) => {
    const select = form.querySelector<HTMLSelectElement>(`[data-scenario-control="${control.id}"]`);
    return [control.id, select?.value ?? control.defaultValue];
  }));
  const announce = (state: ScenarioState, resetState = false) => {
    if (!summary) return;
    if (resetState) {
      summary.textContent = 'Published defaults restored.';
      return;
    }
    const labels = controls.filter((control) => !control.disabledReason).map((control) => {
      const value = state[control.id] ?? control.defaultValue;
      return `${control.label}: ${control.options.find((option) => option.value === value)?.label ?? value}`;
    });
    summary.textContent = labels.length ? `Active view — ${labels.join('; ')}.` : 'Published defaults are active.';
  };
  const updateUrl = (state: ScenarioState, resetState = false) => {
    const parameters = writeScenarioState(window.location.search, controls, state, { reset: resetState });
    const query = parameters.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  };

  const initial = readScenarioState(window.location.search, controls);
  applyToForm(initial);
  announce(initial);

  form.addEventListener('change', () => {
    const state = stateFromForm();
    updateUrl(state);
    announce(state);
    container?.dispatchEvent(new CustomEvent('scenario:change', { bubbles: true, detail: state }));
  });
  reset?.addEventListener('click', () => {
    form.reset();
    const defaults = readScenarioState('', controls);
    applyToForm(defaults);
    updateUrl(defaults, true);
    announce(defaults, true);
    container?.dispatchEvent(new CustomEvent('scenario:change', { bubbles: true, detail: defaults }));
    reset.focus();
  });
}
