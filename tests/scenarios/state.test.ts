import { describe, expect, it } from 'vitest';

import {
  publishedScenarioDefaults,
  readScenarioState,
  scenarioParameterName,
  writeScenarioState,
  type ScenarioControlDefinition,
} from '../../src/lib/scenarios/state';

const controls: readonly ScenarioControlDefinition[] = [
  {
    id: 'case',
    label: 'Planning case',
    defaultValue: 'reference',
    options: [
      { value: 'reference', label: 'Reference' },
      { value: 'recommended', label: 'Recommended' },
      { value: 'stress', label: 'Stress' },
    ],
  },
  {
    id: 'distribution',
    label: 'Distributional lens',
    defaultValue: 'unavailable',
    options: [{ value: 'unavailable', label: 'Unavailable' }],
    disabledReason: 'No compatible distributional evidence is registered.',
  },
];

describe('scenario URL and reset state', () => {
  it('publishes explicit defaults and restores them for absent or incompatible state', () => {
    expect(publishedScenarioDefaults(controls)).toEqual({ case: 'reference', distribution: 'unavailable' });
    expect(readScenarioState('', controls)).toEqual({ case: 'reference', distribution: 'unavailable' });
    expect(readScenarioState('?scenario_case=unsupported', controls).case).toBe('reference');
  });

  it('writes only page-supported active controls while preserving unrelated query state', () => {
    const parameters = writeScenarioState('?source=chapter&scenario_old=drop', controls, {
      case: 'stress',
      distribution: 'unavailable',
    });
    expect(parameters.get('source')).toBe('chapter');
    expect(parameters.get('scenario_case')).toBe('stress');
    expect(parameters.has('scenario_distribution')).toBe(false);
    expect(parameters.has('scenario_old')).toBe(false);
  });

  it('clears scenario parameters on reset without clearing unrelated state', () => {
    const parameters = writeScenarioState('?source=chapter&scenario_case=stress', controls, publishedScenarioDefaults(controls), { reset: true });
    expect(parameters.toString()).toBe('source=chapter');
  });

  it('rejects unsafe control identities and invalid defaults', () => {
    expect(scenarioParameterName('planning_case')).toBe('scenario_planning_case');
    expect(() => scenarioParameterName('Bad ID')).toThrow(/URL-safe/u);
    expect(() => publishedScenarioDefaults([{ id: 'case', label: 'Case', defaultValue: 'missing', options: [{ value: 'known', label: 'Known' }] }])).toThrow(/default/u);
  });
});
