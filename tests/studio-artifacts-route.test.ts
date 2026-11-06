import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('../lib/supabase/server', () => ({ createClient: mocked.createClient }));
const { GET, POST } = await import('../app/api/notebooks/[id]/artifacts/route');
const notebookId = '11111111-1111-4111-8111-111111111111',
  messageId = '22222222-2222-4222-8222-222222222222',
  sourceId = '33333333-3333-4333-8333-333333333333';
function chain(result: any) {
  const x: any = {
    select: vi.fn(() => x),
    eq: vi.fn(() => x),
    in: vi.fn(() => x),
    order: vi.fn(() => x),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn(() => x),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return x;
}
function db({
  message = { citations: [{ sourceId, title: 'client' }] },
  sources = [{ id: sourceId, title: 'Serverquelle' }],
  artifacts = [],
}: any = {}) {
  const inserts: any[] = [];
  return {
    inserts,
    visitor: { id: 'test-visitor' },
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u' } } }) },
    from: vi.fn((table: string) => {
      if (table === 'notebooks') return chain({ data: { id: notebookId } });
      if (table === 'messages') return chain({ data: message });
      if (table === 'sources') return chain({ data: sources });
      if (table === 'artifacts') {
        const x = chain({ data: artifacts, error: null });
        x.insert = vi.fn((row: any) => {
          inserts.push(row);
          return x;
        });
        return x;
      }
      throw Error(table);
    }),
  };
}
const params = { params: Promise.resolve({ id: notebookId }) };
const req = (body: any) =>
  new Request('http://test', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => vi.clearAllMocks());
describe('Studio-Artefakte', () => {
  it('lehnt fremde oder nicht persistierte Assistant-ID ab', async () => {
    const x = db({ message: null });
    mocked.createClient.mockResolvedValue(x);
    expect(
      (await POST(req({ title: 'N', content: 'Text', answerId: messageId }), params)).status,
    ).toBe(409);
    expect(x.inserts).toEqual([]);
  });
  it('ignoriert clientseitige source refs und übernimmt nur serverseitige Citations', async () => {
    const x = db();
    mocked.createClient.mockResolvedValue(x);
    expect(
      (
        await POST(
          req({
            title: 'N',
            content: 'Text',
            answerId: messageId,
            sourceRefs: [{ id: 'foreign' }],
          }),
          params,
        )
      ).status,
    ).toBe(201);
    expect(x.inserts[0].source_refs).toEqual([{ id: sourceId, title: 'Serverquelle' }]);
  });
  it('markiert Artefakte mit entfernten Quellen als stale', async () => {
    const x = db({
      artifacts: [{ id: 'a', source_refs: [{ id: sourceId, title: 'S' }] }],
      sources: [],
    });
    mocked.createClient.mockResolvedValue(x);
    const r = await GET(new Request('http://test'), params);
    expect((await r.json()).artifacts[0].stale).toBe(true);
  });
});
