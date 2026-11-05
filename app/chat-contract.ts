import { z } from 'zod';
import { chatLimits } from './chat-limits';
const uuid = z.string().uuid();
const textPartSchema = z.object({ type: z.literal('text'), text: z.string().trim().min(1).max(chatLimits.maxMessageCharacters) }).strict();
const userMessageSchema = z.object({ id: z.string().min(1).max(128), role: z.literal('user'), parts: z.array(textPartSchema).min(1).max(1) }).strict();
export const chatRequestSchema = z.object({ notebookId: uuid, sourceIds: z.array(uuid).min(1).max(8), messages: z.array(userMessageSchema).min(1).max(chatLimits.maxMessages) }).strict();
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** SDK display history is untrusted, never model history. Supports older tabs. */
export function currentUserMessages(messages: unknown): unknown {
  if (!Array.isArray(messages) || !messages.length || messages.length > chatLimits.maxMessages) return null;
  if (messages.some(message => !message || typeof message !== 'object' || !['user', 'assistant'].includes(message.role))) return null;
  const last = messages.at(-1);
  if (last.role !== 'user' || !Array.isArray(last.parts)) return null;
  return [{ id: last.id, role: last.role, parts: last.parts.map((part: Record<string, unknown>) =>
    part && typeof part === 'object' ? { type: part.type, text: part.text } : null) }];
}
