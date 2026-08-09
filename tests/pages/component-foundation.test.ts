import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');
const sourceDrawer = readFileSync(new URL('../../src/scripts/source-drawer.ts', import.meta.url), 'utf8');
const tooltips = readFileSync(new URL('../../src/scripts/chart-tooltips.ts', import.meta.url), 'utf8');
const scenarios = readFileSync(new URL('../../src/scripts/scenario-workbench.ts', import.meta.url), 'utf8');

function variables(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/giu)].map((match) => [match[1], match[2]]));
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

describe('shared component accessibility foundation', () => {
  it('keeps core text and evidence-state tokens at AA contrast in both themes', () => {
    const light = variables(css.match(/:root \{([\s\S]*?)\}/u)?.[1] ?? '');
    const dark = variables(css.match(/:root\[data-theme='dark'\] \{([\s\S]*?)\}/u)?.[1] ?? '');
    for (const [tokens, surface] of [[light, 'surface'], [dark, 'surface-raised']] as const) {
      for (const token of ['ink', 'ink-soft', 'ink-muted', 'evidence-observed', 'evidence-estimate', 'evidence-scenario', 'evidence-model', 'evidence-gap']) {
        expect(contrast(tokens[token] ?? '#000000', tokens[surface] ?? '#ffffff'), `${token} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
      for (let index = 1; index <= 6; index += 1) {
        expect(contrast(tokens[`chart-series-${index}`] ?? '#000000', tokens[surface] ?? '#ffffff'), `chart-series-${index} on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('defines responsive reflow instead of a fixed-width chart canvas', () => {
    expect(css).toContain('.svg-plot { display: block; width: 100%; height: auto;');
    expect(css).not.toMatch(/\.svg-plot\s*\{[^}]*min-width/gu);
    expect(css).toContain('.viewpoint-grid__items, .scenario-workbench__controls { grid-template-columns: 1fr; }');
    expect(css).toContain('.chart-frame__caption, .scenario-workbench__header { grid-template-columns: 1fr; }');
  });

  it('covers pointer and keyboard interaction with stable focus restoration', () => {
    expect(sourceDrawer).toContain('dialog.showModal()');
    expect(sourceDrawer).toContain("dialog.addEventListener('close', () => returnFocus?.focus())");
    expect(tooltips).toContain("frame.addEventListener('pointerover'");
    expect(tooltips).toContain("frame.addEventListener('focusin'");
    expect(tooltips).toContain("event.key === 'Escape'");
    expect(scenarios).toContain('reset.focus()');
  });
});
