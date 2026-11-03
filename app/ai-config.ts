import 'server-only';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
export const modelId = 'gpt-5.6-luna';
export type ModelConfiguration = { configured: false } | { configured: true; modelId: typeof modelId; apiKey: string };
function configuredKey(): string | undefined { try { const line = readFileSync(join(homedir(), '.config', 'notebook-clone', 'openai.env'), 'utf8').split(/\r?\n/).find(value => value.startsWith('OPENAI_API_KEY=')); return line?.slice('OPENAI_API_KEY='.length).trim() || undefined; } catch { return undefined; } }
/** Liest das ausschließlich serverseitige Providergeheimnis; nie in Client-Code importieren. */
export function getModelConfiguration(env: Partial<NodeJS.ProcessEnv> = process.env): ModelConfiguration { const apiKey = env === process.env ? (env.OPENAI_API_KEY?.trim() || configuredKey()) : env.OPENAI_API_KEY?.trim(); return apiKey ? { configured: true, modelId, apiKey } : { configured: false }; }
