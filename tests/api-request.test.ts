import { afterEach, expect, it, vi } from 'vitest';
import { apiRequest } from '../app/api-request';
afterEach(() => vi.unstubAllGlobals());
it('surfaces rate limits without retrying a mutation', async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response('{"message":"Limit erreicht."}', {
      status: 429,
      headers: { 'retry-after': '12' },
    }),
  );
  vi.stubGlobal('fetch', fetch);
  await expect(apiRequest('/api/test', { method: 'POST' })).rejects.toThrow('12 Sekunden');
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('handles non-JSON failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));
  await expect(apiRequest('/api/test')).rejects.toThrow('Anfrage fehlgeschlagen');
});
it('combines caller cancellation with a finite timeout', async () => {
  const controller = new AbortController();
  const fetch = vi.fn().mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason));
      }),
  );
  vi.stubGlobal('fetch', fetch);
  const pending = apiRequest('/api/test', { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await expect(apiRequest('/api/test', {}, 5)).rejects.toMatchObject({ name: 'TimeoutError' });
});
