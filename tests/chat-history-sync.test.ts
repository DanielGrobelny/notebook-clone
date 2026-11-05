import { describe, expect, it } from 'vitest';
import { isAssistantPersisted } from '../lib/chat-history-sync';

describe('Chat-Verlauf-Synchronisierung', () => {
  const streamed = 'ORION-42 [citation:33333333-3333-4333-8333-333333333333]';
  it('akzeptiert nur die finale, serverseitig identifizierte Assistentenantwort', () => {
    expect(isAssistantPersisted([{ id: 'assistant-a', role: 'assistant', content: 'Wird generiert …' }], 'assistant-a', streamed)).toBe(false);
    expect(isAssistantPersisted([{ id: 'assistant-b', role: 'assistant', content: streamed }], 'assistant-a', streamed)).toBe(false);
    expect(isAssistantPersisted([{ id: 'assistant-a', role: 'assistant', content: streamed }], 'assistant-a', streamed)).toBe(true);
  });

  it('verwirft fehlende Stream-Metadaten statt Gleichtext aus einem anderen Verlauf zu übernehmen', () => {
    expect(isAssistantPersisted([{ id: 'assistant-a', role: 'assistant', content: streamed }], undefined, streamed)).toBe(false);
  });
});

it('bestätigt denselben Teiltext mit persistiertem Unvollständigkeitshinweis',()=>{
 expect(isAssistantPersisted([{id:'a',role:'assistant',content:'Teil\n\nAntwort unvollständig: Ausgabelimit erreicht.'}],'a','Teil')).toBe(true);
});
