import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  getModelConfiguration: vi.fn(), createClient: vi.fn(), streamText: vi.fn(), createOpenAI: vi.fn(), toUI: vi.fn(), responseModel: vi.fn(),
}));
vi.mock('../app/ai-config', () => ({ getModelConfiguration: mocked.getModelConfiguration }));
vi.mock('../lib/supabase/server', () => ({ createClient: mocked.createClient }));
vi.mock('@ai-sdk/openai', () => ({ createOpenAI: mocked.createOpenAI }));
vi.mock('ai', () => ({ streamText: mocked.streamText }));
const { POST } = await import('../app/api/chat/route');

const valid = { notebookId: '123e4567-e89b-12d3-a456-426614174000', sourceIds: ['123e4567-e89b-12d3-a456-426614174001'], messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Hallo' }] }] };
function db({ user = { id: 'u1' }, notebook = { id: valid.notebookId }, chunks = [{ content: 'Erlaubter Kontext' }] } = {}) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) }, from: vi.fn((table: string) => {
    if (table === 'notebooks') return { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: notebook }) })) })) };
    if (table === 'source_chunks') return { select: vi.fn(() => ({ in: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: chunks, error: null }) })) })) })) })) };
    throw new Error('unexpected table');
  }) };
}
function request(body: unknown = valid, signal?: AbortSignal) { return new Request('http://test/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal }); }

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getModelConfiguration.mockReturnValue({ configured: true, modelId: 'configured-model', apiKey: 'test-key' });
  mocked.createClient.mockResolvedValue(db());
  mocked.responseModel.mockReturnValue('model'); mocked.createOpenAI.mockReturnValue({ responses: mocked.responseModel });
  mocked.toUI.mockReturnValue(new Response('stream', { headers: { 'x-vercel-ai-ui-message-stream': 'v1' } }));
  mocked.streamText.mockReturnValue({ toUIMessageStreamResponse: mocked.toUI });
});

describe('POST /api/chat', () => {
  it('gibt bei fehlerhaftem JSON 400 zurück', async () => { const response = await POST(new Request('http://test/api/chat', { method: 'POST', body: '{' })); expect(response.status).toBe(400); await expect(response.json()).resolves.toMatchObject({ code: 'invalid_request' }); });
  it('weist ungültige Verträge ohne Modellaufruf ab', async () => { expect((await POST(request({ messages: [] }))).status).toBe(400); expect(mocked.streamText).not.toHaveBeenCalled(); });
  it('weist fehlende Anmeldung ohne Modellaufruf ab', async () => { mocked.createClient.mockResolvedValue(db({ user: null as never })); expect((await POST(request())).status).toBe(401); expect(mocked.streamText).not.toHaveBeenCalled(); });
  it('weist fremde oder fehlende Notebooks ohne Modellaufruf ab', async () => { mocked.createClient.mockResolvedValue(db({ notebook: null as never })); expect((await POST(request())).status).toBe(404); expect(mocked.streamText).not.toHaveBeenCalled(); });
  it('meldet fehlende Konfiguration ohne Modellaufruf', async () => { mocked.getModelConfiguration.mockReturnValue({ configured: false }); expect((await POST(request())).status).toBe(503); expect(mocked.streamText).not.toHaveBeenCalled(); });
  it('liefert den SDK-7-UI-Stream bei Erfolg', async () => { const response = await POST(request()); expect(response.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1'); expect(mocked.toUI).toHaveBeenCalledWith(expect.objectContaining({ onError: expect.any(Function) })); });
  it('beobachtet die vom SDK gelieferten totalUsage serverseitig im onFinish-Callback', async () => { const info = vi.spyOn(console, 'info').mockImplementation(() => undefined); await POST(request()); const onFinish = mocked.streamText.mock.calls[0][0].onFinish as (event: { totalUsage: unknown }) => void; const totalUsage = { inputTokens: 7, outputTokens: 3, totalTokens: 10 }; onFinish({ totalUsage }); expect(info).toHaveBeenCalledWith(JSON.stringify({ event: 'openai_usage', model: 'configured-model', usage: totalUsage })); info.mockRestore(); });
  it('serialisiert Provider-429 nach Streamstart sicher als UI-Fehler', async () => { await POST(request()); const onError = mocked.toUI.mock.calls[0][0].onError as (x: unknown) => string; expect(onError({ statusCode: 429, message: 'secret provider detail' })).toContain('ausgelastet'); expect(onError({ statusCode: 429, message: 'secret provider detail' })).not.toContain('secret'); });
  it('serialisiert Timeout und Nutzerabbruch nach Streamstart sicher', async () => { const controller = new AbortController(); const pending = POST(request(valid, controller.signal)); controller.abort(); await pending; const onError = mocked.toUI.mock.calls[0][0].onError as (x: unknown) => string; expect(onError(new Error('ignored'))).toContain('abgebrochen'); expect(mocked.streamText.mock.calls[0][0].abortSignal.aborted).toBe(true); });
});
