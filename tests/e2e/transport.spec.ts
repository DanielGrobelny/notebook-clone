import { expect, test } from '@playwright/test';
import { setupRealSource } from './real-source';
const stream = (text: string) => [
  'data: {"type":"start","messageId":"assistant-1"}',
  'data: {"type":"text-start","id":"text-1"}',
  'data: '+JSON.stringify({ type: 'text-delta', id: 'text-1', delta: text }),
  'data: {"type":"text-end","id":"text-1"}',
  'data: {"type":"finish"}',
].join('\n\n')+'\n\n';
const headers = { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' };
async function ask(page: import('@playwright/test').Page, question: string) { await page.getByLabel('Frage an deine Quellen').fill(question); await expect(page.getByRole('button', { name: 'Frage senden' })).toBeEnabled(); await page.getByRole('button', { name: 'Frage senden' }).click(); }
test('SDK-7-UI-Message-Stream wird mit echter Quellenberechtigung dargestellt', async ({ page, isMobile }, testInfo) => {
  await page.route('**/api/chat', route => route.fulfill({ status: 200, headers, body: stream('Gestreamte Antwort.') }));
  await setupRealSource(page, isMobile, 'stream'); await ask(page, 'Erste Frage');
  await expect(page.getByText('Gestreamte Antwort.')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('notebook-sdk-stream.png'), fullPage: true });
});
test('Abbruch beendet einen laufenden Transport und erlaubt die nächste Frage', async ({ page, isMobile }) => {
  let calls = 0;
  await page.route('**/api/chat', async route => { calls += 1; if (calls === 1) { await new Promise(resolve => setTimeout(resolve, 800)); await route.fulfill({ status: 200, headers, body: stream('Zu spät.') }); } else await route.fulfill({ status: 200, headers, body: stream('Nach Abbruch erneut gesendet.') }); });
  await setupRealSource(page, isMobile, 'abort'); await ask(page, 'Bitte abbrechen');
  await expect(page.getByRole('button', { name: 'Anfrage abbrechen' })).toBeVisible(); await page.getByRole('button', { name: 'Anfrage abbrechen' }).click();
  await expect(page.getByRole('button', { name: 'Frage senden' })).toBeVisible(); await ask(page, 'Neue Frage');
  await expect(page.getByText('Nach Abbruch erneut gesendet.')).toBeVisible();
});
test('429 und Timeout zeigen Fehler und Retry startet eine weitere Frage', async ({ page, isMobile }) => {
  let calls = 0;
  await page.route('**/api/chat', route => { calls += 1; return calls === 1 ? route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ message: 'Rate limit' }) }) : route.fulfill({ status: 200, headers, body: stream('Nach Retry verfügbar.') }); });
  await setupRealSource(page, isMobile, 'errors'); await ask(page, 'Rate Limit'); await expect(page.locator('.answer[role="alert"]')).toBeVisible(); await page.getByRole('button', { name: 'Erneut versuchen' }).click(); await expect(page.getByText('Nach Retry verfügbar.')).toBeVisible();
  await page.unroute('**/api/chat'); await page.route('**/api/chat', route => route.abort('timedout'));
  await ask(page, 'Timeout'); await expect(page.locator('.answer[role="alert"]')).toBeVisible();
});
