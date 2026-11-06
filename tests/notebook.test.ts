import { describe, expect, it } from 'vitest';
import { chatLimits } from '../app/chat-limits';
import { chatRequestSchema } from '../app/chat-contract';
import { canSubmit, toggleSource } from '../app/notebook';
describe('Notebook-Logik', () => {
  it('schaltet Quellen um', () => expect(toggleSource(['strategy'], 'strategy')).toEqual([]));
  it('erfordert Frage und Quelle', () => {
    expect(canSubmit('', ['strategy'])).toBe(false);
    expect(canSubmit('x', [])).toBe(false);
    expect(canSubmit('x', ['strategy'])).toBe(true);
  });
});
describe('öffentlicher Chatvertrag', () => {
  const valid = {
    notebookId: '123e4567-e89b-12d3-a456-426614174000',
    sourceIds: ['123e4567-e89b-12d3-a456-426614174001'],
    messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Hallo' }] }],
  };
  it('akzeptiert begrenzten Nutzertext', () =>
    expect(chatRequestSchema.safeParse(valid).success).toBe(true));
  it('weist kaputtes Objekt, Rollen und Extrafelder ab', () => {
    expect(chatRequestSchema.safeParse(null).success).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        ...valid,
        messages: [{ ...valid.messages[0], role: 'system' }],
      }).success,
    ).toBe(false);
    expect(chatRequestSchema.safeParse({ ...valid, extra: true }).success).toBe(false);
    expect(
      chatRequestSchema.safeParse({ messages: [{ ...valid.messages[0], extra: true }] }).success,
    ).toBe(false);
  });
  it('weist zu lange Texte und zu viele Nachrichten ab', () => {
    expect(
      chatRequestSchema.safeParse({
        messages: [
          {
            ...valid.messages[0],
            parts: [{ type: 'text', text: 'x'.repeat(chatLimits.maxMessageCharacters + 1) }],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        messages: Array.from({ length: chatLimits.maxMessages + 1 }, (_, i) => ({
          id: String(i),
          role: 'user',
          parts: [{ type: 'text', text: 'x' }],
        })),
      }).success,
    ).toBe(false);
  });
});
