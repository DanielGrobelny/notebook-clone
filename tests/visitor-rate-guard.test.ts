import { it, expect, vi } from 'vitest';
import { claimVisitorProviderCall } from '../lib/visitor-rate-guard';
it('always uses the database visitor quota', async () => {
  const rpc = vi
    .fn()
    .mockResolvedValue({ data: [{ allowed: false, retry_after_seconds: 123 }], error: null });
  expect(await claimVisitorProviderCall({ rpc })).toEqual({
    allowed: false,
    retryAfterSeconds: 123,
  });
  expect(rpc).toHaveBeenCalledWith('claim_visitor_provider_call');
});
it('fails closed when quota unavailable', async () => {
  expect(
    await claimVisitorProviderCall({ rpc: vi.fn().mockResolvedValue({ error: {}, data: null }) }),
  ).toEqual({ allowed: false, retryAfterSeconds: 3600, unavailable: true });
});
