import { describe, expect, it, vi } from 'vitest';
import { anonymousProviderLimit, claimAnonymousProviderCall, isAnonymousUser } from '../lib/anonymous-provider-rate-guard';
describe('anonymous provider rate guard', () => {
  it('only debits anonymous identities', async () => {
    const rpc = vi.fn();
    await expect(claimAnonymousProviderCall({ rpc }, { app_metadata: {} })).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('uses the atomic database claim and returns its retry time', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ allowed: false, retry_after_seconds: 123 }], error: null });
    await expect(claimAnonymousProviderCall({ rpc }, { is_anonymous: true })).resolves.toEqual({ allowed: false, retryAfterSeconds: 123 });
    expect(rpc).toHaveBeenCalledWith('claim_anonymous_provider_call');
  });
  it('fails closed for an unavailable quota RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'offline' } });
    await expect(claimAnonymousProviderCall({ rpc }, { app_metadata: { is_anonymous: true } })).resolves.toEqual({ allowed: false, retryAfterSeconds: anonymousProviderLimit.windowSeconds, unavailable: true });
  });
  it('recognizes both Supabase anonymous-user representations', () => {
    expect(isAnonymousUser({ is_anonymous: true })).toBe(true);
    expect(isAnonymousUser({ app_metadata: { is_anonymous: true } })).toBe(true);
  });
});
