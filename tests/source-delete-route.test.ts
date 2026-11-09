import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('../lib/supabase/server', () => ({ createClient: mocked.createClient }));
import { DELETE } from '../app/api/notebooks/[id]/sources/[sourceId]/route';

const notebookId = '11111111-1111-4111-8111-111111111111';
const sourceId = '22222222-2222-4222-8222-222222222222';

type State = {
  storageError: unknown;
  deleteError: unknown;
  deleteCalls: number;
  storageCalls: number;
};
function client(state: State) {
  return {
    visitor: { id: 'test-visitor' },
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(async () => {
          state.storageCalls++;
          return { error: state.storageError };
        }),
      })),
    },
    from: vi.fn((table: string) => {
      if (table !== 'sources') throw new Error('unexpected table ' + table);
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: { id: sourceId, storage_path: 'user-1/path.txt' } }),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => {
              state.deleteCalls++;
              return { error: state.deleteError };
            }),
          })),
        })),
      };
    }),
  };
}
async function remove() {
  return DELETE(new Request('http://test.invalid'), {
    params: Promise.resolve({ id: notebookId, sourceId }),
  });
}

describe('DELETE Quellenroute', () => {
  let state: State;
  beforeEach(() => {
    state = { storageError: null, deleteError: null, deleteCalls: 0, storageCalls: 0 };
    mocked.createClient.mockResolvedValue(client(state));
  });

  it('bricht bei Storage-Fehler mit 502 ab und lässt den Datenbank-Löschversuch für einen erfolgreichen Retry aus', async () => {
    state.storageError = { statusCode: 500 };
    expect((await remove()).status).toBe(502);
    expect(state.deleteCalls).toBe(0);
    state.storageError = null;
    expect((await remove()).status).toBe(204);
    expect(state.storageCalls).toBe(2);
    expect(state.deleteCalls).toBe(1);
  });

  it('behandelt ein fehlendes Storage-Objekt auch bei String-404 idempotent', async () => {
    state.storageError = { statusCode: '404' };
    expect((await remove()).status).toBe(204);
    expect(state.deleteCalls).toBe(1);
  });

  it('gibt bei Datenbankfehler 500 zurück, sodass der Löschvorgang retrybar bleibt', async () => {
    state.deleteError = { message: 'temporary database failure' };
    expect((await remove()).status).toBe(500);
    expect(state.storageCalls).toBe(1);
    expect(state.deleteCalls).toBe(1);
    state.deleteError = null;
    expect((await remove()).status).toBe(204);
    expect(state.deleteCalls).toBe(2);
  });
});
