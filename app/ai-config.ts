import 'server-only';
import { readFileSync } from 'node:fs';
export const modelId = 'gpt-5.6-luna';
export type ModelConfiguration =
  | { configured: false }
  | { configured: true; modelId: typeof modelId; apiKey: string; baseURL?: string };
function keyFromExplicitFile(path: string | undefined): string | undefined {
  if (!path?.trim()) return undefined;
  try {
    const value = readFileSync(path.trim(), 'utf8').trim();
    return value.startsWith('OPENAI_API_KEY=')
      ? value.slice('OPENAI_API_KEY='.length).trim() || undefined
      : value || undefined;
  } catch {
    return undefined;
  }
}
/** Ausschließlich serverseitig: nur explizite Umgebung oder explizit gesetzte Key-Datei. */
export function getModelConfiguration(
  env: Partial<NodeJS.ProcessEnv> = process.env,
): ModelConfiguration {
  const apiKey = env.OPENAI_API_KEY?.trim() || keyFromExplicitFile(env.OPENAI_API_KEY_FILE);
  const baseURL = env.OPENAI_BASE_URL?.trim() || undefined;
  return apiKey
    ? { configured: true, modelId, apiKey, ...(baseURL ? { baseURL } : {}) }
    : { configured: false };
}
