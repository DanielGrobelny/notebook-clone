import { readFileSync } from 'node:fs';
for (const line of readFileSync('.env.local', 'utf8').split('\n')) { const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.replace(/\r$/, '')); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ''); }
import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
test.skip(!process.env.RUN_OPENAI_INTEGRATION, 'Set RUN_OPENAI_INTEGRATION=1 for the paid real-provider smoke test');
test('Browser → App-Route → OpenAI → UI stream liefert quellengebundene Antwort', async ({ page }) => {
  const stamp = Date.now().toString(36); const email = 'chat-stream-' + stamp + '@example.test'; const password = 'Chat-stream-test-2026!';
  let userId: string | undefined; let notebookId: string | undefined;
  try {
    await page.goto('/'); await page.getByLabel('E-Mail').fill(email); await page.getByLabel('Passwort').fill(password); await page.getByRole('button', { name: 'Registrieren' }).click(); await expect(page.getByRole('button', { name: '+ Notebook' })).toBeVisible();
    page.once('dialog', d => d.accept('Stream ' + stamp)); await page.getByRole('button', { name: '+ Notebook' }).click();
    const created = await page.waitForResponse(r => r.url().includes('/api/notebooks') && r.request().method() === 'POST'); notebookId = (await created.json()).notebook.id;
    const importResult = await page.evaluate(async id => { const f = new FormData(); f.set('text', 'Das Projektsignal lautet ORION-42.'); const r = await fetch('/api/notebooks/' + id + '/sources', { method: 'POST', body: f }); return { status: r.status, body: await r.json() }; }, notebookId);
    expect(importResult.status).toBe(201);
    await page.reload();
    await page.getByRole('button', { name: 'Eingefügter Text Bereit · Text' }).click();
    const responsePromise = page.waitForResponse(r => r.url().includes('/api/chat') && r.request().method() === 'POST');
    await page.getByLabel('Frage an deine Quellen').fill('Wie lautet das Projektsignal? Antworte nur mit dem Signal.'); await page.getByRole('button', { name: 'Frage senden' }).click();
    const response = await responsePromise; expect(response.status()).toBe(200); expect(response.headers()['x-vercel-ai-ui-message-stream']).toBe('v1');
    await expect(page.getByText(/ORION-42/)).toBeVisible({ timeout: 60_000 });
    const streamBody = (await response.body()).toString(); expect(streamBody).toContain('text-delta');
    // Token usage is observed only by the server-side streamText.onFinish callback.
    // This browser smoke test verifies transport and answer content, not accounting metadata.
    console.log(JSON.stringify({ browserChat: { status: response.status(), streamed: true, answerContainsSignal: true } }));
  } finally {
    if (notebookId) await page.evaluate(id => fetch('/api/notebooks/' + id, { method: 'DELETE' }), notebookId).catch(() => undefined);
    const users = await admin.auth.admin.listUsers(); userId = users.data.users.find(u => u.email === email)?.id; if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
