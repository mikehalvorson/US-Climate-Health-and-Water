import { describe, expect, it } from 'vitest';

import { nextTheme, resolveInitialTheme } from '../../src/lib/theme';

describe('theme preference', () => {
  it('honors an explicit stored preference before system preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference for missing or invalid storage', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme('unexpected', false)).toBe('light');
  });

  it('toggles between both supported themes', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });
});
