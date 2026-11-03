import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { getModelConfiguration, modelId } = await import('../app/ai-config');
describe('serverseitige Modellkonfiguration', () => {
 it('lehnt fehlenden Key ab', () => expect(getModelConfiguration({})).toEqual({ configured:false }));
 it('akzeptiert nur einen expliziten OpenAI-Key und festes Modell', () => expect(getModelConfiguration({ OPENAI_API_KEY:' key ' })).toEqual({ configured:true,modelId,apiKey:'key' }));
});
