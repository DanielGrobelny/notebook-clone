import { readFileSync } from 'node:fs';
for (const line of readFileSync('.env.local', 'utf8').split('\n')) { const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.replace(/\r$/, '')); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ''); }
import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SERVICE_ROLE_KEY'] as const;
for (const key of required) if (!process.env[key]) throw new Error('Missing local integration-test configuration: ' + key);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
const stamp = Date.now().toString(36);
const email = `source-storage-${stamp}@example.test`;
const password = 'Source-storage-test-2026!';
const title = `Source Storage ${stamp}`;
const file = { name: 'source-evidence.txt', mime: 'text/plain', bytes: Array.from(Buffer.from('Source storage deletion evidence.')) };

async function postSource(page: import('@playwright/test').Page, notebookId: string) {
  return page.evaluate(async ({ notebookId, file }) => {
    const form = new FormData();
    form.set('file', new File([new Uint8Array(file.bytes)], file.name, { type: file.mime }));
    const response = await fetch(`/api/notebooks/${notebookId}/sources`, { method: 'POST', body: form });
    return { status: response.status, body: await response.json() };
  }, { notebookId, file });
}

async function counts(sourceId: string, storagePath: string) {
  const [{ count: chunkCount, error: chunkError }, listed] = await Promise.all([
    admin.from('source_chunks').select('*', { count: 'exact', head: true }).eq('source_id', sourceId),
    admin.storage.from('source-files').list(storagePath.split('/').slice(0, -1).join('/')),
  ]);
  if (chunkError) throw chunkError;
  if (listed.error) throw listed.error;
  const name = storagePath.split('/').at(-1);
  return { chunkCount: chunkCount ?? 0, objectCount: listed.data.filter(object => object.name === name).length, objectPresent: listed.data.some(object => object.name === name) };
}

test('Source: App-Import und App-Löschung hinterlassen Storage und Chunks konsistent', async ({ page }) => {
  let userId: string | undefined;
  let notebookId: string | undefined;
  let sourceId: string | undefined;
  try {
    await page.goto('/');
    await page.getByLabel('E-Mail').fill(email);
    await page.getByLabel('Passwort').fill(password);
    await page.getByRole('button', { name: 'Registrieren' }).click();
    await expect(page.getByRole('button', { name: '+ Notebook' })).toBeVisible();
    page.once('dialog', dialog => dialog.accept(title));
    await page.getByRole('button', { name: '+ Notebook' }).click();
    const created = await page.waitForResponse(response => response.url().includes('/api/notebooks') && response.request().method() === 'POST');
    notebookId = (await created.json()).notebook.id;
    const { data: auth } = await admin.auth.admin.listUsers();
    userId = auth.users.find(user => user.email === email)?.id;
    expect(userId).toBeTruthy();

    const first = await postSource(page, notebookId!);
    expect(first.status).toBe(201);
    sourceId = first.body.source.id;
    const before = await counts(sourceId!, first.body.source.storage_path);
    expect(before).toEqual({ chunkCount: 1, objectCount: 1, objectPresent: true });

    const deleted = await page.evaluate(async ({ notebookId, sourceId }) => (await fetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, { method: 'DELETE' })).status, { notebookId, sourceId });
    expect(deleted).toBe(204);
    const after = await counts(sourceId!, first.body.source.storage_path);
    expect(after).toEqual({ chunkCount: 0, objectCount: 0, objectPresent: false });
    sourceId = undefined;

    const parallel = await Promise.all([postSource(page, notebookId!), postSource(page, notebookId!)]);
    expect(parallel.map(result => result.status).sort()).toEqual([200, 201]);
    expect(parallel[0].body.source.id).toBe(parallel[1].body.source.id);
    sourceId = parallel[0].body.source.id;
    const concurrent = await counts(sourceId!, parallel[0].body.source.storage_path);
    expect(concurrent).toEqual({ chunkCount: 1, objectCount: 1, objectPresent: true });
    console.log(JSON.stringify({ source: { before, after, concurrent, sameSourceId: true } }));

    expect(await page.evaluate(async ({ notebookId, sourceId }) => (await fetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, { method: 'DELETE' })).status, { notebookId, sourceId })).toBe(204);
    sourceId = undefined;
  } finally {
    if (sourceId && notebookId) await page.evaluate(async ({ notebookId, sourceId }) => fetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, { method: 'DELETE' }), { notebookId, sourceId }).catch(() => undefined);
    if (notebookId) await page.evaluate(async id => fetch(`/api/notebooks/${id}`, { method: 'DELETE' }), notebookId).catch(() => undefined);
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
