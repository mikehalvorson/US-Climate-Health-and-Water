export interface ScenarioOption {
  value: string;
  label: string;
}

export interface ScenarioControlDefinition {
  id: string;
  label: string;
  defaultValue: string;
  options: readonly ScenarioOption[];
  disabledReason?: string;
}

export type ScenarioState = Readonly<Record<string, string>>;

const PARAMETER_PREFIX = 'scenario_';
const SAFE_ID = /^[a-z][a-z0-9_-]*$/u;

export function scenarioParameterName(id: string): string {
  if (!SAFE_ID.test(id)) throw new RangeError(`Scenario control ID ${id} is not URL-safe.`);
  return `${PARAMETER_PREFIX}${id}`;
}

function validateControl(control: ScenarioControlDefinition): void {
  scenarioParameterName(control.id);
  if (!control.options.length) throw new RangeError(`Scenario control ${control.id} must define at least one option.`);
  if (new Set(control.options.map((option) => option.value)).size !== control.options.length) {
    throw new RangeError(`Scenario control ${control.id} option values must be unique.`);
  }
  if (!control.options.some((option) => option.value === control.defaultValue)) {
    throw new RangeError(`Scenario control ${control.id} default must match an option.`);
  }
}

export function publishedScenarioDefaults(controls: readonly ScenarioControlDefinition[]): ScenarioState {
  return Object.fromEntries(controls.map((control) => {
    validateControl(control);
    return [control.id, control.defaultValue];
  }));
}

export function readScenarioState(search: string | URLSearchParams, controls: readonly ScenarioControlDefinition[]): ScenarioState {
  const parameters = typeof search === 'string' ? new URLSearchParams(search) : search;
  return Object.fromEntries(controls.map((control) => {
    validateControl(control);
    const candidate = parameters.get(scenarioParameterName(control.id));
    const permitted = candidate !== null && control.options.some((option) => option.value === candidate);
    return [control.id, permitted ? candidate : control.defaultValue];
  }));
}

export function writeScenarioState(
  search: string | URLSearchParams,
  controls: readonly ScenarioControlDefinition[],
  state: ScenarioState,
  options: { reset?: boolean } = {},
): URLSearchParams {
  const parameters = new URLSearchParams(typeof search === 'string' ? search : search.toString());
  for (const key of [...parameters.keys()]) if (key.startsWith(PARAMETER_PREFIX)) parameters.delete(key);
  for (const control of controls) {
    validateControl(control);
    if (control.disabledReason || options.reset) continue;
    const candidate = state[control.id] ?? control.defaultValue;
    const value = control.options.some((option) => option.value === candidate) ? candidate : control.defaultValue;
    parameters.set(scenarioParameterName(control.id), value);
  }
  return parameters;
}
