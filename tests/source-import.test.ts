import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  chunkExtracted,
  extractText,
  safeFilename,
  sourceLimits,
  validateText,
} from '../lib/sources/import';
function twoPageCompressedPdf() {
  const streams = [
    'BT /F1 16 Tf 72 720 Td (Seite eins: Planung) Tj ET',
    'BT /F1 16 Tf 72 720 Td (Seite zwei: Risiken) Tj ET',
  ];
  const encoded = streams.map((stream) => deflateSync(Buffer.from(stream)));
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' +
      encoded[0].length +
      ' /Filter /FlateDecode >>\nstream\n' +
      encoded[0].toString('binary') +
      '\nendstream',
    '<< /Length ' +
      encoded[1].length +
      ' /Filter /FlateDecode >>\nstream\n' +
      encoded[1].toString('binary') +
      '\nendstream',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += String(index + 1) + ' 0 obj\n' + object + '\nendobj\n';
  });
  const xref = Buffer.byteLength(pdf, 'binary');
  pdf +=
    'xref\n0 ' +
    String(objects.length + 1) +
    '\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n')
      .join('') +
    'trailer\n<< /Size ' +
    String(objects.length + 1) +
    ' /Root 1 0 R >>\nstartxref\n' +
    String(xref) +
    '\n%%EOF';
  return new Uint8Array(Buffer.from(pdf, 'binary'));
}
describe('Quellenimport', () => {
  it('weist leere Texte zurück', () => expect(() => validateText(' \n ')).toThrow('leer'));
  it('begrenzt eingefügten Text', () =>
    expect(() => validateText('x'.repeat(sourceLimits.maxTextCharacters + 1))).toThrow('lang'));
  it('bewahrt Markdown-Abschnitte und Herkunft', async () => {
    const x = await extractText(
      new TextEncoder().encode('# Planung\nInhalt\n## Risiken\nText'),
      'text/markdown',
    );
    const chunks = chunkExtracted(x);
    expect(chunks.map((chunk) => chunk.section)).toEqual(['Planung', 'Risiken']);
  });
  it('extrahiert komprimierten mehrseitigen PDF-Text mit korrekter Seitenherkunft', async () => {
    const extracted = await extractText(twoPageCompressedPdf(), 'application/pdf');
    expect(extracted.sections).toEqual([
      { text: 'Seite eins: Planung', page: 1, section: null },
      { text: 'Seite zwei: Risiken', page: 2, section: null },
    ]);
    expect(chunkExtracted(extracted).map((chunk) => chunk.page)).toEqual([1, 2]);
  });
  it('weist ungültige und gescannte PDFs verständlich ab', async () => {
    await expect(
      extractText(new TextEncoder().encode('kein pdf'), 'application/pdf'),
    ).rejects.toThrow('gültiges PDF');
    await expect(
      extractText(new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<<>>\nendobj'), 'application/pdf'),
    ).rejects.toThrow(/beschädigt|extrahierbaren Text/);
  });
  it('neutralisiert unsichere Dateinamen', () =>
    expect(safeFilename('../../private/ä.txt')).toBe('._._private__.txt'));
});
