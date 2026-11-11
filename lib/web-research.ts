import { z } from 'zod';
export const researchRequest = z.object({ query: z.string().trim().min(1).max(2000) }).strict();
export type WebCitation = { start: number; end: number; url: string; title: string };
export type ResearchResult = {
  text: string;
  citations: WebCitation[];
  sources: { url: string; title: string }[];
  searched: boolean;
  complete: boolean;
};
export function safeWebURL(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 4096) return null;
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}
// Responses indices count Unicode code points; convert once to JS UTF-16 boundaries.
export function mapResearch(
  content: readonly any[],
  sources: readonly any[],
  searched: boolean,
  complete: boolean,
): ResearchResult {
  let text = '';
  const citations: WebCitation[] = [];
  const urls = new Map<string, string>();
  for (const part of content) {
    if (part.type !== 'text' || typeof part.text !== 'string') continue;
    const offset = text.length;
    const points = Array.from(part.text as string);
    text += part.text;
    for (const a of part.providerMetadata?.openai?.annotations ?? []) {
      const url = safeWebURL(a.url);
      if (a.type !== 'url_citation' || !url) continue;
      const title = typeof a.title === 'string' ? a.title.slice(0, 300) : new URL(url).hostname;
      urls.set(url, title);
      if (
        !Number.isInteger(a.start_index) ||
        !Number.isInteger(a.end_index) ||
        a.start_index < 0 ||
        a.end_index <= a.start_index ||
        a.end_index > points.length
      )
        continue;
      const start = offset + points.slice(0, a.start_index).join('').length,
        end = offset + points.slice(0, a.end_index).join('').length;
      if (!citations.some((c) => c.start === start && c.end === end && c.url === url))
        citations.push({ start, end, url, title });
    }
  }
  for (const s of sources) {
    const url = safeWebURL(s.url);
    if (url && !urls.has(url))
      urls.set(url, typeof s.title === 'string' ? s.title.slice(0, 300) : new URL(url).hostname);
  }
  return {
    text,
    citations: citations.sort((a, b) => a.start - b.start),
    sources: [...urls].slice(0, 60).map(([url, title]) => ({ url, title })),
    searched,
    complete,
  };
}
