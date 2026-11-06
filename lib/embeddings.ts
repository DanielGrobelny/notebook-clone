import { createOpenAI } from '@ai-sdk/openai';
export const embeddingConfig = { modelId: 'text-embedding-3-small', dimensions: 1536 } as const;
export async function embedTexts(
  texts: string[],
  apiKey: string,
  signal?: AbortSignal,
  baseURL: string | undefined = process.env.OPENAI_BASE_URL,
) {
  if (!apiKey) throw new Error('embedding_not_configured');
  if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
  const openai = createOpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const result = await openai
    .embedding(embeddingConfig.modelId)
    .doEmbed({ values: texts, abortSignal: signal });
  return result.embeddings.map((vector) => {
    if (vector.length !== embeddingConfig.dimensions)
      throw new Error('embedding_dimension_mismatch');
    return vector;
  });
}
export function vectorLiteral(vector: number[]) {
  if (
    vector.length !== embeddingConfig.dimensions ||
    vector.some((value) => !Number.isFinite(value))
  )
    throw new Error('invalid_embedding');
  return '[' + vector.join(',') + ']';
}
