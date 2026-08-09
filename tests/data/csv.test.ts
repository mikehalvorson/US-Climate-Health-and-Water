import { describe, expect, it } from 'vitest';

import { parseCsv } from '../../src/lib/data/csv';

describe('CSV adapter', () => {
  it('parses quoted commas, escaped quotes, CRLF, and empty values', () => {
    expect(parseCsv('id,label,value\r\n1,"Grid, power",4\r\n2,"A ""quoted"" field",\r\n')).toEqual([
      { id: '1', label: 'Grid, power', value: '4' },
      { id: '2', label: 'A "quoted" field', value: '' },
    ]);
  });

  it('rejects malformed rows and unterminated quotes', () => {
    expect(() => parseCsv('a,b\n1')).toThrow(/expected 2/u);
    expect(() => parseCsv('a,b\n"open,1')).toThrow(/quoted field/u);
  });
});
