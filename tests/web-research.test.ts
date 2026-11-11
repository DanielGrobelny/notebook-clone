import { expect, it, vi, beforeEach } from 'vitest';
import { mapResearch, researchRequest, safeWebURL } from '../lib/web-research';
const m = vi.hoisted(() => ({ db: vi.fn(), generate: vi.fn(), config: vi.fn() }));
vi.mock('../lib/supabase/server', () => ({ createClient: m.db }));
vi.mock('../app/ai-config', () => ({ getModelConfiguration: m.config }));
vi.mock('ai', () => ({ generateText: m.generate }));
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: () => ({ responses: () => 'model', tools: { webSearch: () => ({}) } }),
}));
const { POST } = await import('../app/api/research/route');
const request = (body: unknown = { query: 'MDN map' }, signal?: AbortSignal) =>
  new Request('http://localhost/api/research', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
beforeEach(() => {
  vi.clearAllMocks();
  m.db.mockResolvedValue({
    visitor: { id: 'v' },
    rpc: vi.fn().mockResolvedValue({ data: [{ allowed: true }] }),
  });
  m.config.mockReturnValue({ configured: true, modelId: 'same-model', apiKey: 'test-only' });
  m.generate.mockResolvedValue({ content: [], sources: [], toolResults: [], finishReason: 'stop' });
});
it('validiert nur explizite Frage und verbietet private Zusatzdaten', async () => {
  for (const body of [
    { query: ' ' },
    { query: 'x'.repeat(2001) },
    { query: 'q', history: ['private'] },
    { query: 'q', notebookId: 'private' },
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(m.generate).not.toHaveBeenCalled();
  expect(researchRequest.safeParse({ query: ' q ' }).success).toBe(true);
});
it('benötigt Besuchersitzung vor Provider', async () => {
  m.db.mockResolvedValue({ visitor: null });
  expect((await POST(request())).status).toBe(401);
  expect(m.generate).not.toHaveBeenCalled();
});
it('verweigert Limitüberschreitung vor Provider', async () => {
  m.db.mockResolvedValue({
    visitor: {},
    rpc: vi.fn().mockResolvedValue({ data: [{ allowed: false, retry_after_seconds: 123 }] }),
  });
  const r = await POST(request());
  expect(r.status).toBe(429);
  expect(r.headers.get('retry-after')).toBe('123');
  expect(m.generate).not.toHaveBeenCalled();
});
it('sendet nur Query ohne Verlauf, begrenzt Kosten und meldet fehlende Suche', async () => {
  const r = await POST(request());
  const o = m.generate.mock.calls[0][0];
  expect(o.prompt).toBe('MDN map');
  expect(o.messages).toBeUndefined();
  expect(o.maxRetries).toBe(0);
  expect(o.maxOutputTokens).toBe(2000);
  expect(o.providerOptions.openai).toMatchObject({
    store: false,
    maxToolCalls: 1,
    includeWebSearchSources: true,
  });
  expect((await r.json()).searched).toBe(false);
});
it('behandelt Provider429 ohne sensitive Details', async () => {
  m.generate.mockRejectedValue({ statusCode: 429, message: 'secret' });
  const r = await POST(request());
  expect(r.status).toBe(429);
  expect(await r.text()).not.toContain('secret');
});
it('behandelt Abbruch vor Provider', async () => {
  const c = new AbortController();
  c.abort();
  expect((await POST(request(undefined, c.signal))).status).toBe(499);
  expect(m.generate).not.toHaveBeenCalled();
});
it('behandelt Timeout ehrlich', async () => {
  const spy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());
  expect((await POST(request())).status).toBe(499);
  spy.mockRestore();
});
it('mappt Unicode, dedupliziert und verwechselt keine UUID Zitate', () => {
  const a = {
    type: 'url_citation',
    url: 'https://example.org/',
    title: 'Example',
    start_index: 2,
    end_index: 8,
  };
  const r = mapResearch(
    [
      {
        type: 'text',
        text: '😀 Beleg! [citation:abc]',
        providerMetadata: {
          openai: {
            annotations: [a, a, { ...a, url: 'javascript:alert(1)' }, { ...a, start_index: 200 }],
          },
        },
      },
    ],
    [{ url: a.url }],
    true,
    true,
  );
  expect(r.citations).toEqual([{ start: 3, end: 9, url: a.url, title: 'Example' }]);
  expect(r.text.slice(3, 9)).toBe('Beleg!');
  expect(r.sources).toHaveLength(1);
  expect(safeWebURL('data:text/html,x')).toBeNull();
  expect(safeWebURL('https://user:pass@example.org')).toBeNull();
});
