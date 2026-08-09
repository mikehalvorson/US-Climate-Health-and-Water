export {};

const frames = document.querySelectorAll<HTMLElement>('[data-chart-frame]');

for (const frame of frames) {
  if (frame.dataset.chartTooltipBound === 'true') continue;
  frame.dataset.chartTooltipBound = 'true';
  const tooltip = frame.querySelector<HTMLElement>('[data-chart-tooltip]');
  if (!tooltip) continue;

  const show = (mark: Element, clientX?: number, clientY?: number) => {
    const content = mark.getAttribute('data-tooltip');
    if (!content) return;
    tooltip.textContent = content;
    tooltip.hidden = false;
    const frameBounds = frame.getBoundingClientRect();
    const markBounds = mark.getBoundingClientRect();
    const x = clientX ?? markBounds.left + markBounds.width / 2;
    const y = clientY ?? markBounds.top;
    tooltip.style.setProperty('--tooltip-x', `${Math.max(8, Math.min(frameBounds.width - 8, x - frameBounds.left))}px`);
    tooltip.style.setProperty('--tooltip-y', `${Math.max(8, y - frameBounds.top)}px`);
  };
  const hide = () => { tooltip.hidden = true; };

  frame.addEventListener('pointerover', (event) => {
    const mark = event.target instanceof Element ? event.target.closest('[data-tooltip]') : null;
    if (mark) show(mark, event.clientX, event.clientY);
  });
  frame.addEventListener('pointermove', (event) => {
    const mark = event.target instanceof Element ? event.target.closest('[data-tooltip]') : null;
    if (mark) show(mark, event.clientX, event.clientY);
  });
  frame.addEventListener('pointerout', (event) => {
    const next = event.relatedTarget instanceof Element ? event.relatedTarget.closest('[data-tooltip]') : null;
    if (!next) hide();
  });
  frame.addEventListener('focusin', (event) => {
    const mark = event.target instanceof Element ? event.target.closest('[data-tooltip]') : null;
    if (mark) show(mark);
  });
  frame.addEventListener('focusout', hide);
  frame.addEventListener('keydown', (event) => { if (event.key === 'Escape') hide(); });
}
