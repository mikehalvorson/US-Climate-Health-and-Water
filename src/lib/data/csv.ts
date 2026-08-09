export type CsvRow = Readonly<Record<string, string>>;

export function parseCsv(input: string): readonly CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/u, ''));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('CSV input ends inside a quoted field.');
  row.push(field.replace(/\r$/u, ''));
  if (row.some((value) => value.length > 0)) rows.push(row);
  const headers = rows.shift();
  if (!headers?.length || headers.some((header) => !header)) throw new Error('CSV input requires a non-empty header row.');
  if (new Set(headers).size !== headers.length) throw new Error('CSV input contains duplicate headers.');

  return rows.map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}
