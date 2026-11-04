import { embedTexts, vectorLiteral } from './embeddings';
export const retrievalLimits = { maxChunks: 12, contextCharacters: 12000, historyMessages: 8 } as const;
export type RetrievedPassage = { id: string; source_id: string; content: string; page: number | null; section: string | null; similarity: number };
export type ChatHistoryMessage = { role: 'user' | 'assistant'; content: string };
export async function scopedSimilaritySearch(db: any, input: { notebookId: string; userId: string; sourceIds: string[]; question: string; apiKey: string; signal?: AbortSignal }) {
  if (input.signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
  const {data:sources,error:sourceError}=await db.from('sources').select('id,status').eq('notebook_id',input.notebookId).in('id',input.sourceIds); if(sourceError||!sources||sources.length!==new Set(input.sourceIds).size||sources.some((s:any)=>s.status!=='ready'))throw new Error('sources_unavailable'); const [embedding] = await embedTexts([input.question], input.apiKey, input.signal);
  if (input.signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
  const { data, error } = await db.rpc('match_source_chunks', { p_notebook_id: input.notebookId, p_user_id: input.userId, p_source_ids: input.sourceIds, p_query_embedding: vectorLiteral(embedding), p_match_count: retrievalLimits.maxChunks });
  if (error) throw error;
  return (data ?? []) as RetrievedPassage[];
}
export function buildGroundedContext(passages: RetrievedPassage[]) {
  const blocks: string[] = []; const included: RetrievedPassage[] = [];
  for (const passage of passages) {
    const marker = '[citation:' + passage.id + ']\n';
    const separator = blocks.length ? '\n\n' : '';
    const available = retrievalLimits.contextCharacters - blocks.join('').length - separator.length - marker.length;
    if (available <= 0) break;
    const content = passage.content.slice(0, available);
    blocks.push(separator + marker + content);
    included.push({ ...passage, content });
  }
  return { passages: included, context: blocks.join('') };
}
export function formatBoundedHistory(messages: ChatHistoryMessage[]) {
  return messages.slice(-retrievalLimits.historyMessages).map(message => (message.role === 'user' ? 'Nutzer' : 'Assistent') + ': ' + message.content.replace(/\[citation:[0-9a-f-]{36}\]/gi, '[historischer Beleg, nicht aktuell]')).join('\n');
}
export function validateCitationIds(ids: unknown, passages: RetrievedPassage[]) {
  if (!Array.isArray(ids)) return [];
  const permitted = new Set(passages.map(p => p.id));
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && permitted.has(id)))];
}
