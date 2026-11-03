export type PersistedChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

export function findPersistedAssistant(messages: PersistedChatMessage[], assistantMessageId: string, streamedText: string) {
  return messages.find(message => message.id === assistantMessageId && message.role === 'assistant' && message.content === streamedText) ?? null;
}

export function isAssistantPersisted(messages: PersistedChatMessage[], assistantMessageId: string | undefined, streamedText: string) {
  return !!assistantMessageId && !!streamedText && !!findPersistedAssistant(messages, assistantMessageId, streamedText);
}
