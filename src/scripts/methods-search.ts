const normalize = (value: string) => value.trim().toLocaleLowerCase();

document.querySelectorAll<HTMLElement>('[data-ledger-filter]').forEach((panel) => {
  const input = panel.querySelector<HTMLInputElement>('[data-ledger-query]');
  const rows = [...panel.querySelectorAll<HTMLTableRowElement>('[data-ledger-row]')];
  const count = panel.querySelector<HTMLElement>('[data-ledger-count]');
  const reset = panel.querySelector<HTMLButtonElement>('[data-ledger-reset]');
  if (!input || !count) return;

  const apply = () => {
    const query = normalize(input.value);
    let visible = 0;
    for (const row of rows) {
      const matches = query.length === 0 || normalize(row.textContent ?? '').includes(query);
      row.hidden = !matches;
      if (matches) visible += 1;
    }
    count.textContent = `${visible} of ${rows.length} records visible`;
  };

  input.addEventListener('input', apply);
  reset?.addEventListener('click', () => {
    input.value = '';
    apply();
    input.focus();
  });
  apply();
});
