import { nextTheme, type Theme } from '../lib/theme';

const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  if (!button) return;
  const dark = theme === 'dark';
  button.setAttribute('aria-pressed', String(dark));
  button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  const label = button.querySelector<HTMLElement>('[data-theme-label]');
  if (label) label.textContent = dark ? 'Dark' : 'Light';
}

if (button) {
  const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(current);
  button.addEventListener('click', () => {
    const active = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const theme = nextTheme(active);
    try { localStorage.setItem('chw-theme', theme); } catch { /* Device storage can be unavailable. */ }
    applyTheme(theme);
  });
}
