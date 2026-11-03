import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { getModelConfiguration, modelId } = await import('../app/ai-config');
describe('serverseitige Modellkonfiguration', () => {
 it('lehnt fehlenden Key ab', () => expect(getModelConfiguration({})).toEqual({ configured:false }));
 it('akzeptiert einen expliziten OpenAI-Key und festes Modell', () => expect(getModelConfiguration({ OPENAI_API_KEY:' key ' })).toEqual({ configured:true,modelId,apiKey:'key' }));
 it('liest keine implizite Home-Keydatei, sondern nur einen expliziten Pfad', () => expect(getModelConfiguration({})).toEqual({ configured:false }));
 it('trägt einen expliziten lokalen Provider-Endpunkt nur serverseitig weiter', () => expect(getModelConfiguration({ OPENAI_API_KEY:'test', OPENAI_BASE_URL:'http://127.0.0.1:4175/v1' })).toEqual({ configured:true,modelId,apiKey:'test',baseURL:'http://127.0.0.1:4175/v1' }));
});
