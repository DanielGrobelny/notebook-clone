import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { extractText } from '../lib/sources/import';
// Optional independently authored documents, kept outside the repository:
// https://bitcoin.org/bitcoin.pdf (OpenOffice, 9 pages)
// https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf (TeX, 14 pages)
const directory = process.env.REAL_PDF_FIXTURES;
describe.skipIf(!directory)('independent real multi-page PDF documents', () => {
  it.each([
    ['bitcoin.pdf', 9, 'Bitcoin'],
    ['tracemonkey.pdf', 14, 'Trace'],
  ])('extracts %s with page provenance', async (name, pages, word) => {
    const result = await extractText(
      new Uint8Array(await readFile(join(directory!, String(name)))),
      'application/pdf',
    );
    expect(result.sections).toHaveLength(Number(pages));
    expect(result.text).toContain(String(word));
    expect(result.sections.at(-1)?.page).toBe(pages);
  });
});
