/** Öffentliche, nicht-sensitive Chatgrenzen für Client und Server. */
export const chatLimits = {
  maxMessages: 20,
  maxMessageCharacters: 4_000,
  maxOutputTokens: 4096,
  timeoutMs: 30_000,
} as const;
