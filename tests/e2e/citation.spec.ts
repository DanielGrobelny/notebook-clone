import { expect, test } from './test-fixture';
import { setupRealSource } from './real-source';
const sourceId = '22222222-2222-4222-8222-222222222222';
const chunkId = '33333333-3333-4333-8333-333333333333';
const history = {
  chats: [
    {
      id: 'chat-1',
      messages: [
        { id: 'user-1', role: 'user', content: 'Was steht auf Seite 2?', citations: [] },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: 'Die belegte Aussage.',
          citations: [
            {
              id: chunkId,
              sourceId,
              page: 2,
              section: 'Ergebnis',
              excerpt: 'Falscher Fallback darf nicht erscheinen.',
            },
          ],
        },
      ],
    },
  ],
};
test('Belegklick öffnet auf Desktop und Mobil die exakte Originalpassage von PDF-Seite 2', async ({
  page,
  isMobile,
}) => {
  await setupRealSource(page, isMobile, 'citation');
  await page.route('**/history', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(history) }),
  );
  await page.route('**/sources/' + sourceId, (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: { id: sourceId, title: 'Quelle.pdf' },
        chunks: [
          {
            id: 'anderer-chunk',
            content: 'Falscher Fallback darf nicht erscheinen.',
            metadata: { page: 2 },
          },
          {
            id: chunkId,
            content: 'Exakte Originalpassage auf PDF-Seite 2.',
            metadata: { page: 2, section: 'Ergebnis' },
          },
        ],
      }),
    }),
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Beleg · Seite 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Beleg · Seite 2' }).click();
  const dialog = page.getByRole('dialog', { name: 'Belegpassage' });
  await expect(dialog).toContainText('PDF-Seite 2');
  await expect(dialog).toContainText('Exakte Originalpassage auf PDF-Seite 2.');
  await expect(dialog).not.toContainText('Falscher Fallback darf nicht erscheinen.');
});

const streamHeaders = {
  'content-type': 'text/event-stream',
  'x-vercel-ai-ui-message-stream': 'v1',
};
function streamAnswer(text: string) {
  return (
    [
      'data: {"type":"start","messageId":"assistant-stream"}',
      'data: {"type":"text-start","id":"text-stream"}',
      'data: ' + JSON.stringify({ type: 'text-delta', id: 'text-stream', delta: text }),
      'data: {"type":"text-end","id":"text-stream"}',
      'data: ' +
        JSON.stringify({
          type: 'message-metadata',
          messageMetadata: { assistantMessageId: 'assistant-live' },
        }),
      'data: {"type":"finish"}',
    ].join('\n\n') + '\n\n'
  );
}
test('neue Antwort zeigt ihren Beleg ohne Reload, bleibt nach Reload exakt und führt Kontext in Folgefrage mit', async ({
  page,
  isMobile,
}) => {
  let answered = false;
  let followupOnlyQuestion = false;
  let delayedHistoryChecks = 0;
  const saved = {
    chats: [
      {
        id: 'chat-live',
        messages: [
          { id: 'user-live', role: 'user', content: 'Was steht auf Seite 2?', citations: [] },
          {
            id: 'assistant-live',
            role: 'assistant',
            content: 'Die neue belegte Aussage.',
            citations: [
              {
                id: chunkId,
                sourceId,
                page: 2,
                section: 'Ergebnis',
                excerpt: 'Veralteter Auszug.',
              },
            ],
          },
        ],
      },
    ],
  };
  await page.route('**/history', (route) => {
    const body =
      answered && ++delayedHistoryChecks < 3
        ? {
            chats: [
              {
                id: 'chat-live',
                messages: [
                  {
                    id: 'assistant-live',
                    role: 'assistant',
                    content: 'Wird generiert …',
                    citations: [],
                  },
                ],
              },
            ],
          }
        : answered
          ? saved
          : { chats: [] };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.route('**/sources/' + sourceId, (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: { id: sourceId, title: 'Quelle.pdf' },
        chunks: [
          {
            id: chunkId,
            content: 'Exakte Originalpassage auf PDF-Seite 2.',
            metadata: { page: 2, section: 'Ergebnis' },
          },
        ],
      }),
    }),
  );
  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON();
    if (answered)
      followupOnlyQuestion =
        body.messages.length === 1 && body.messages[0].parts[0].text === 'Und was bedeutet das?';
    answered = true;
    await route.fulfill({
      status: 200,
      headers: streamHeaders,
      body: streamAnswer(answered ? 'Die neue belegte Aussage.' : 'Folgeantwort.'),
    });
  });
  await setupRealSource(page, isMobile, 'citation-live');
  await page.getByLabel('Frage an deine Quellen').fill('Was steht auf Seite 2?');
  await page.getByRole('button', { name: 'Frage senden' }).click();
  const citation = page.getByRole('button', { name: 'Beleg · Seite 2' });
  await expect(citation).toBeVisible();
  await citation.click();
  const dialog = page.getByRole('dialog', { name: 'Belegpassage' });
  await expect(dialog).toContainText('PDF-Seite 2');
  await expect(dialog).toContainText('Exakte Originalpassage auf PDF-Seite 2.');
  await expect(dialog).not.toContainText('Veralteter Auszug.');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Beleg · Seite 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Beleg · Seite 2' }).click();
  await expect(page.getByRole('dialog', { name: 'Belegpassage' })).toContainText(
    'Exakte Originalpassage auf PDF-Seite 2.',
  );
  await page.getByRole('button', { name: '×' }).click();
  const sourceScope = isMobile
    ? (await page.getByRole('button', { name: 'Quellen' }).click(),
      page.getByRole('dialog', { name: 'Quellen' }))
    : page;
  await sourceScope
    .getByRole('button', { name: 'e2e-quelle.txt Bereit · Text', exact: true })
    .click();
  if (isMobile) await page.getByRole('button', { name: 'Quellen schließen' }).click();
  await page.getByLabel('Frage an deine Quellen').fill('Und was bedeutet das?');
  await page.getByRole('button', { name: 'Frage senden' }).click();
  await expect.poll(() => followupOnlyQuestion).toBeTruthy();
});
