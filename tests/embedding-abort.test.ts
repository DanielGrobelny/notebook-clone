import { expect, it, vi } from 'vitest';
const model = vi.hoisted(() => ({ doEmbed: vi.fn() }));
vi.mock('@ai-sdk/openai', () => ({ createOpenAI: () => ({ embedding: () => model }) }));
import { embedTexts } from '../lib/embeddings';
it('pre-aborted embedding never invokes the provider', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(embedTexts(['synthetic'], 'test-only', controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
  expect(model.doEmbed).not.toHaveBeenCalled();
});
it('embedding forwards cancellation to the provider without retrying', async () => {
  const controller = new AbortController();
  model.doEmbed.mockImplementationOnce(
    ({ abortSignal }) =>
      new Promise((resolve, reject) => {
        abortSignal.addEventListener(
          'abort',
          () => reject(new DOMException('aborted', 'AbortError')),
          { once: true },
        );
      }),
  );
  const request = embedTexts(['synthetic'], 'test-only', controller.signal);
  controller.abort();
  await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  expect(model.doEmbed).toHaveBeenCalledTimes(1);
  expect(model.doEmbed.mock.calls[0][0].abortSignal).toBe(controller.signal);
});
