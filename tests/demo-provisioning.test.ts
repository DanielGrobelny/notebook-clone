import { describe, expect, it, vi } from 'vitest';
import { provisionDemoSources } from '../lib/demo-provisioning';

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

describe('demo provisioning', () => {
  it('does not claim ready when model configuration is absent', async () => {
    const setup = actions({ configured: false });
    await expect(provisionDemoSources(setup)).resolves.toEqual({ kind: 'unavailable', stage: 'configuration', errorCode: 'demo_sources_unavailable' });
    expect(setup.claimQuota).not.toHaveBeenCalled();
    expect(setup.embed).not.toHaveBeenCalled();
  });

  it('classifies a provider authentication failure without exposing it', async () => {
    const setup = actions({ embed: vi.fn().mockRejectedValue(new Error('401 invalid API key')) });
    await expect(provisionDemoSources(setup)).resolves.toEqual({ kind: 'unavailable', stage: 'embedding', errorCode: 'demo_sources_unavailable' });
    expect(setup.insertSources).not.toHaveBeenCalled();
  });

  it('does not claim ready when database persistence fails after embedding', async () => {
    const setup = actions({ insertSources: vi.fn().mockRejectedValue(new Error('database constraint detail')) });
    await expect(provisionDemoSources(setup)).resolves.toEqual({ kind: 'unavailable', stage: 'sources', errorCode: 'demo_sources_unavailable' });
    expect(setup.embed).toHaveBeenCalledOnce();
    expect(setup.insertChunks).not.toHaveBeenCalled();
    expect(setup.markSourcesReady).not.toHaveBeenCalled();
  });
});
