import { describe, expect, it, vi } from 'vitest';
import { mapDemoSourcesByTitle, provisionDemoSources } from '../lib/demo-provisioning';

function actions(overrides: Partial<Parameters<typeof provisionDemoSources>[0]> = {}) {
  return {
    configured: true,
    claimQuota: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
    embed: vi.fn().mockResolvedValue(undefined),
    insertSources: vi.fn().mockResolvedValue(undefined),
    insertChunks: vi.fn().mockResolvedValue(undefined),
    markSourcesReady: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function expectGenericUnavailable(result: unknown, stage: string) {
  expect(result).toEqual({ kind: 'unavailable', stage, errorCode: 'demo_sources_unavailable' });
  expect(JSON.stringify(result)).not.toContain('internal provider or database detail');
  expect(result).not.toHaveProperty('error');
  expect(result).not.toHaveProperty('message');
  expect(result).not.toHaveProperty('cause');
}

describe('demo provisioning', () => {
  it('does not call a provider when model configuration is absent', async () => {
    const setup = actions({ configured: false });
    expectGenericUnavailable(await provisionDemoSources(setup), 'configuration');
    expect(setup.claimQuota).not.toHaveBeenCalled();
    expect(setup.embed).not.toHaveBeenCalled();
  });

  it('returns the quota response without invoking the provider', async () => {
    const setup = actions({ claimQuota: vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 73 }) });
    await expect(provisionDemoSources(setup)).resolves.toEqual({ kind: 'rate_limited', retryAfterSeconds: 73 });
    expect(setup.embed).not.toHaveBeenCalled();
  });

  it('turns a quota exception into a generic unavailable result', async () => {
    const setup = actions({ claimQuota: vi.fn().mockRejectedValue(new Error('internal provider or database detail')) });
    expectGenericUnavailable(await provisionDemoSources(setup), 'quota');
    expect(setup.embed).not.toHaveBeenCalled();
  });

  for (const [name, action, stage, later] of [
    ['embedding', 'embed', 'embedding', ['insertSources', 'insertChunks', 'markSourcesReady']],
    ['source persistence', 'insertSources', 'sources', ['insertChunks', 'markSourcesReady']],
    ['chunk persistence', 'insertChunks', 'chunks', ['markSourcesReady']],
    ['ready update', 'markSourcesReady', 'ready', []],
  ] as const) {
    it(`returns only the generic code when ${name} fails`, async () => {
      const setup = actions({ [action]: vi.fn().mockRejectedValue(new Error('internal provider or database detail')) });
      expectGenericUnavailable(await provisionDemoSources(setup), stage);
      for (const method of later) expect(setup[method]).not.toHaveBeenCalled();
    });
  }

  it('reports ready only after every provisioning stage succeeds', async () => {
    const setup = actions();
    await expect(provisionDemoSources(setup)).resolves.toEqual({ kind: 'ready' });
    expect(setup.claimQuota).toHaveBeenCalledOnce();
    expect(setup.embed).toHaveBeenCalledOnce();
    expect(setup.insertSources).toHaveBeenCalledOnce();
    expect(setup.insertChunks).toHaveBeenCalledOnce();
    expect(setup.markSourcesReady).toHaveBeenCalledOnce();
  });
});

describe('demo source insert mapping', () => {
  it('maps source IDs by title when the database returns rows out of order', () => {
    expect(mapDemoSourcesByTitle(['first', 'second'], [{ id: 'id-second', title: 'second' }, { id: 'id-first', title: 'first' }])).toEqual([{ id: 'id-first' }, { id: 'id-second' }]);
  });

  it('rejects incomplete or duplicate source rows', () => {
    expect(mapDemoSourcesByTitle(['first', 'second'], [{ id: 'id-first', title: 'first' }])).toBeNull();
    expect(mapDemoSourcesByTitle(['first', 'second'], [{ id: 'id-a', title: 'first' }, { id: 'id-b', title: 'first' }])).toBeNull();
  });
});
