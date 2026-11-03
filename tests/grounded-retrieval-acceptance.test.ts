import { describe, expect, it } from 'vitest';
import { buildGroundedContext, formatBoundedHistory, retrievalLimits, validateCitationIds, type RetrievedPassage } from '../lib/retrieval';
const sourceA = '11111111-1111-4111-8111-111111111111';
const sourceB = '22222222-2222-4222-8222-222222222222';
const chunkA = '33333333-3333-4333-8333-333333333333';
const chunkB = '44444444-4444-4444-8444-444444444444';
const passages: RetrievedPassage[] = [
  { id: chunkA, source_id: sourceA, content: 'PDF Seite 2: Umsatz sank.', page: 2, section: 'Ergebnis', similarity: .9 },
  { id: chunkB, source_id: sourceB, content: 'Konflikt: Umsatz stieg.', page: 2, section: 'Ergebnis', similarity: .8 },
];
describe('grounded retrieval', () => {
  it('behält ausgewählte Belege aus zwei Dokumenten inklusive widersprüchlicher Passagen', () => { const context = buildGroundedContext(passages); expect(context.passages.map(p => p.source_id)).toEqual([sourceA, sourceB]); expect(context.context).toContain('[citation:' + chunkA + ']'); expect(context.context).toContain('[citation:' + chunkB + ']'); expect(context.context).toContain('Konflikt: Umsatz stieg.'); });
  it('lässt nur tatsächlich retrievte Citation-IDs als klickbare Belege zu', () => { const unknown = '55555555-5555-4555-8555-555555555555'; expect(validateCitationIds([chunkA, unknown, chunkA, 'not-a-uuid'], passages)).toEqual([chunkA]); });
  it('begrenzt den Kontext einschließlich Citation-Markern und Join-Newlines auf 12000 Zeichen', () => { const long = Array.from({ length: 3 }, (_, index) => ({ ...passages[index % 2], id: ('00000000-0000-4000-8000-00000000000' + index).slice(0, 36), content: 'x'.repeat(11_990) })); const context = buildGroundedContext(long); expect(context.context.length).toBeLessThanOrEqual(retrievalLimits.contextCharacters); });
  it('behandelt historische Citation-IDs nicht als aktuelle Evidenz', () => { expect(formatBoundedHistory([{ role: 'assistant', content: 'Alt [citation:' + chunkA + ']' }])).toContain('[historischer Beleg, nicht aktuell]'); });
  it('begrenzt gespeicherten Gesprächskontext auf acht Nachrichten', () => { const history = Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? 'assistant' as const : 'user' as const, content: 'm' + index })); const formatted = formatBoundedHistory(history); expect(formatted).not.toContain('m0'); expect(formatted).not.toContain('m1'); expect(formatted).toContain('m9'); });
  it('kennzeichnet Mock-Inhalt nur als Daten im Citation-Kontext', () => { const context = buildGroundedContext([{ ...passages[0], content: 'mock injection text' }]); expect(context.context).toContain('[citation:' + chunkA + ']'); });
});
