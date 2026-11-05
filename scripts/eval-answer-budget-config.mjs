import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { stripTypeScriptTypes } from 'node:module';
// Execute the actual app configuration, removing only its bundler-only guard.
// This avoids a second model/default/baseURL contract in the evaluation runner.
const source = readFileSync(new URL('../app/ai-config.ts', import.meta.url), 'utf8').replace("import 'server-only';", '');
const { getModelConfiguration } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
export function loadBudgetConfiguration(env) {
  let file = {};
  if (env.OPENAI_API_KEY_FILE) {
    const raw = readFileSync(env.OPENAI_API_KEY_FILE, 'utf8').trim();
    file = parseEnv(raw);
    if (!Object.hasOwn(file, 'OPENAI_API_KEY')) file = { OPENAI_API_KEY: raw };
  }
  const config = getModelConfiguration({
    OPENAI_API_KEY: env.OPENAI_API_KEY?.trim() || file.OPENAI_API_KEY,
    OPENAI_BASE_URL: env.OPENAI_BASE_URL ?? file.OPENAI_BASE_URL,
  });
  if (!config.configured) throw Error('Missing explicit provider key');
  if (config.apiKey === '[SENSITIVE]') throw Error('Vercel sensitive placeholder is not a provider key');
  return config;
}
