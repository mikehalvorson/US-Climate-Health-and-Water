export {};

const disclosures = document.querySelectorAll<HTMLElement>('[data-source-disclosure]');

for (const disclosure of disclosures) {
  if (disclosure.dataset.sourceDisclosureBound === 'true') continue;
  disclosure.dataset.sourceDisclosureBound = 'true';
  const trigger = disclosure.querySelector<HTMLAnchorElement>('[data-source-drawer-trigger]');
  const dialog = disclosure.querySelector<HTMLDialogElement>('[data-source-drawer]');
  const closeButton = disclosure.querySelector<HTMLButtonElement>('[data-source-drawer-close]');
  if (!trigger || !dialog || !closeButton) continue;

  let returnFocus: HTMLElement | null = null;
  trigger.addEventListener('click', (event) => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
    dialog.showModal();
    closeButton.focus();
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => returnFocus?.focus());
}
