import { expect, test } from './test-fixture';

// Real visitor session, text imports, database retrieval and persistence; mocked provider.
test('zwei Texte liefern über echtes Retrieval Antwort und beide Belege', async ({ page, isMobile, browser }, testInfo) => {
  await page.goto('/');
  await page.getByText('Notebooks wechseln',{exact:true}).click();
  await expect(page.getByRole('button',{name:'Mein Notebook',exact:true})).toBeVisible();
  const notebookId = (await (await page.request.get('/api/notebooks')).json()).notebooks[0].id;
  const scope = isMobile ? (await page.getByRole('button', { name: 'Quellen' }).click(), page.getByRole('dialog', { name: 'Quellen' })) : page;
  const sourceIds: string[] = [];
  for (const text of ['SYNTHETIC-CV: Alex Beispiel entwickelt TypeScript und PostgreSQL Anwendungen seit fünf Jahren.', 'SYNTHETIC-JOB: Gesucht wird Fullstack-Erfahrung mit TypeScript, PostgreSQL und Teamarbeit.']) {
    page.once('dialog', dialog => dialog.accept(text));
    const imported = page.waitForResponse(r => r.url().endsWith('/sources') && r.request().method() === 'POST');
    await scope.getByRole('button', { name: 'Text einfügen', exact: true }).click();
    const response = await imported; expect(response.status()).toBe(201);
    sourceIds.push((await response.json()).source.id);
  }
  const sources = scope.getByRole('button', { name: 'Eingefügter Text Bereit · Text', exact: true });
  await expect(sources).toHaveCount(2);

  if (isMobile) await page.getByRole('button', { name: 'Quellen schließen' }).click();
  const answer = page.waitForResponse(r => r.url().endsWith('/api/chat') && r.request().method() === 'POST');
  await page.getByLabel('Frage an deine Quellen').fill('Vergleiche den synthetischen CV mit der Ausschreibung. Guter Fit?');
  await page.getByRole('button', { name: 'Frage senden' }).click();
  const response = await answer; expect(response.status()).toBe(200);
  expect((await response.body()).toString()).toContain('text-delta');
  await expect(page.getByText(/Lokale Chatantwort mit Beleg/)).toBeVisible();
  const history = async () => page.evaluate(async id => (await fetch('/api/notebooks/' + id + '/history')).json(), notebookId);
  await expect.poll(async () => {
    const data = await history();
    return [...new Set(data.chats.flatMap((chat: any) => chat.messages).filter((m: any) => m.role === 'assistant').flatMap((m: any) => m.citations.map((c: any) => c.sourceId)))].sort();
  }).toEqual([...sourceIds].sort());
  await page.screenshot({ path: testInfo.outputPath('comparison-two-sources.png'), fullPage: true });
  await page.reload();
  await expect(page.getByText(/Lokale Chatantwort mit Beleg/)).toBeVisible();
  const data = await history();
  const citations = data.chats.flatMap((chat: any) => chat.messages).find((m: any) => m.role === 'assistant').citations;
  expect(citations.map((c: any) => c.excerpt).join(' ')).toContain('SYNTHETIC-CV');
  expect(citations.map((c: any) => c.excerpt).join(' ')).toContain('SYNTHETIC-JOB');
  const belege = page.getByRole('button', { name: /^Beleg/ });
  await expect(belege).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await belege.nth(i).click();
    await expect(page.getByRole('dialog', { name: 'Belegpassage' })).toContainText(/SYNTHETIC-(CV|JOB)/);
    await page.getByRole('button', { name: '×', exact: true }).click();
  }
  const request = (ids: string[], messages = ['Vergleich']) => ({ notebookId, sourceIds: ids, messages: messages.map((text, index) => ({ id: 'query-' + index, role: 'user', parts: [{ type: 'text', text }] })) });
  const post = async (body: unknown) => page.evaluate(async body => { const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, text: await r.text() }; }, body);
  expect((await post(request([]))).status).toBe(400);
  const absent = await post(request(['90000000-0000-4000-8000-000000000001']));
  expect(absent.status).toBe(502); expect(absent.text).toContain('retrieval_failed');
  const filtered = await post(request([sourceIds[0]], ['Vergleich', 'Vergleich', 'Vergleich']));
  expect(filtered.status).toBe(200);
  await expect.poll(async () => {
    const all = (await history()).chats.flatMap((chat: any) => chat.messages).filter((m: any) => m.role === 'assistant');
    return all.some((m: any) => m.citations.length === 1 && m.citations[0].sourceId === sourceIds[0]);
  }).toBe(true);
  const other = await browser.newContext();
  try {
    const stranger = await other.newPage(); await stranger.goto('/');
    await stranger.getByRole('button',{name:'Erst einmal umsehen'}).click();
    await expect(stranger.getByLabel('Frage an deine Quellen')).toBeVisible();
    const status = await stranger.evaluate(async body => (await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).status, request(sourceIds));
    expect(status).toBe(404);
  } finally { await other.close(); }

});
