import { z } from 'zod';
import { chatLimits } from './chat-limits';
const uuid = z.string().uuid();
const textPartSchema = z.object({ type: z.literal('text'), text: z.string().trim().min(1).max(chatLimits.maxMessageCharacters) }).strict();
const userMessageSchema = z.object({ id: z.string().min(1).max(128), role: z.literal('user'), parts: z.array(textPartSchema).min(1).max(1) }).strict();
export const chatRequestSchema = z.object({ notebookId: uuid, sourceIds: z.array(uuid).min(1).max(8), messages: z.array(userMessageSchema).min(1).max(chatLimits.maxMessages) }).strict();
export type ChatRequest = z.infer<typeof chatRequestSchema>;
