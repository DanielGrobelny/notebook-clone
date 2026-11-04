import { deflateSync } from 'node:zlib';
import { expect, test } from './test-fixture';

const credentials = (label: string) => ({ email: label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '@example.test', password: 'Notebook-import-test-2026!' });
async function signUp(page: import('@playwright/test').Page, user: ReturnType<typeof credentials>) { await page.goto('/');    await page.getByText('Notebooks wechseln',{exact:true}).click();await expect(page.getByRole('button', { name: 'Mein Notebook',exact:true })).toBeVisible(); }
async function notebook(page: import('@playwright/test').Page, title: string) { page.once('dialog', d => d.accept(title)); await page.getByRole('button', { name: '+ Notebook' }).click(); const response = await page.waitForResponse(r => r.url().includes('/api/notebooks') && r.request().method() === 'POST'); return (await response.json()).notebook.id as string; }
async function postSource(page: import('@playwright/test').Page, notebookId: string, file?: { name: string; mime: string; buffer: Uint8Array }, text?: string) { return page.evaluate(async ({ notebookId, file, text }) => { const form = new FormData(); if (text !== undefined) form.set('text', text); if (file) form.set('file', new File([new Uint8Array(file.bytes)], file.name, { type: file.mime })); const response = await fetch('/api/notebooks/' + notebookId + '/sources', { method: 'POST', body: form }); return { status: response.status, body: await response.json() }; }, { notebookId, file: file && { name: file.name, mime: file.mime, bytes: Array.from(file.buffer) }, text }); }
function twoPagePdf() {
  const streams = ['BT /F1 16 Tf 72 720 Td (Seite eins: Planung) Tj ET', 'BT /F1 16 Tf 72 720 Td (Seite zwei: Risiken) Tj ET'];
  const encoded = streams.map((stream) => deflateSync(Buffer.from(stream)));
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + encoded[0].length + ' /Filter /FlateDecode >>\nstream\n' + encoded[0].toString('binary') + '\nendstream',
    '<< /Length ' + encoded[1].length + ' /Filter /FlateDecode >>\nstream\n' + encoded[1].toString('binary') + '\nendstream',
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'binary')); pdf += String(index + 1) + ' 0 obj\n' + object + '\nendobj\n'; });
  const xref = Buffer.byteLength(pdf, 'binary');
  pdf += 'xref\n0 ' + String(objects.length + 1) + '\n0000000000 65535 f \n' + offsets.slice(1).map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + String(objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + String(xref) + '\n%%EOF';
  return new Uint8Array(Buffer.from(pdf, 'binary'));
}

test('API: Import, PDF-Seite 2, Validierung, Dedup, Löschen und Mandantentrennung', async ({ browser, page }) => {
  await signUp(page, credentials('import-a')); const id = await notebook(page, 'Import ' + Date.now());
  const txt = await postSource(page, id, { name: 'note.txt', mime: 'text/plain', buffer: Buffer.from('TXT Inhalt') }); expect(txt.status).toBe(201);
  expect((await postSource(page, id, { name: 'note.md', mime: 'text/markdown', buffer: Buffer.from('# Titel\nMarkdown Inhalt') })).status).toBe(201); expect((await postSource(page, id, undefined, 'Eingefügter Inhalt')).status).toBe(201);
  const pdf = await postSource(page, id, { name: 'zwei-seiten.pdf', mime: 'application/pdf', buffer: twoPagePdf() }); expect(pdf.status).toBe(201); expect(pdf.body.source.page_count).toBe(2);
  const detail = await page.evaluate(async ({ id, sourceId }) => { const r = await fetch('/api/notebooks/' + id + '/sources/' + sourceId); return { status: r.status, body: await r.json() }; }, { id, sourceId: pdf.body.source.id }); expect(detail.status).toBe(200); expect(detail.body.chunks.map((c: { metadata: { page: number } }) => c.metadata.page)).toEqual([1, 2]);
  for (const bad of [{ name: 'empty.txt', mime: 'text/plain', buffer: Buffer.alloc(0) }, { name: 'broken.pdf', mime: 'application/pdf', buffer: Buffer.from('%PDF-1.4 broken') }, { name: 'large.txt', mime: 'text/plain', buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 'x') }]) expect((await postSource(page, id, bad)).status).toBe(400);
  const duplicate = { name: 'same.txt', mime: 'text/plain', buffer: Buffer.from('parallel hash') }; const parallel = await Promise.all([postSource(page, id, duplicate), postSource(page, id, duplicate)]); expect(parallel.map(x => x.status).sort()).toEqual([200, 201]); expect(parallel.some(x => x.body.duplicate)).toBeTruthy(); expect(parallel[0].body.source.id).toBe(parallel[1].body.source.id);
  const stranger = await browser.newPage(); await stranger.addInitScript(()=>localStorage.setItem('lumen.welcome.v1','seen')); await signUp(stranger, credentials('import-b'));
  expect(await stranger.evaluate(async ({ id, sourceId }) => (await fetch('/api/notebooks/' + id + '/sources/' + sourceId)).status, { id, sourceId: txt.body.source.id })).toBe(404);
  expect(await stranger.evaluate(async ({ id, sourceId }) => (await fetch('/api/notebooks/' + id + '/sources/' + sourceId, { method: 'DELETE' })).status, { id, sourceId: txt.body.source.id })).toBe(404);
  const ownerTxt = await page.evaluate(async ({ id, sourceId }) => { const r = await fetch('/api/notebooks/' + id + '/sources/' + sourceId); return { status: r.status, body: await r.json() }; }, { id, sourceId: txt.body.source.id });
  expect(ownerTxt.status).toBe(200); expect(ownerTxt.body.source.id).toBe(txt.body.source.id); expect(ownerTxt.body.chunks).toHaveLength(1);
  expect(await page.evaluate(async ({ id, sourceId }) => (await fetch('/api/notebooks/' + id + '/sources/' + sourceId, { method: 'DELETE' })).status, { id, sourceId: pdf.body.source.id })).toBe(204); expect(await page.evaluate(async ({ id, sourceId }) => (await fetch('/api/notebooks/' + id + '/sources/' + sourceId)).status, { id, sourceId: pdf.body.source.id })).toBe(404);
  expect(await stranger.evaluate(async ({ id }) => (await fetch('/api/notebooks/' + id + '/sources')).status, { id })).toBe(404); await stranger.close();
});
