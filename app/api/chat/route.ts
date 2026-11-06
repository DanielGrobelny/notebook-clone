import { completedContent, completionNotice } from '../../../lib/answer-completion';
import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, consumeStream } from 'ai';
import { getModelConfiguration } from '../../ai-config';
import { chatRequestSchema, currentUserMessages } from '../../chat-contract';
import { chatLimits } from '../../chat-limits';
import { createClient } from '../../../lib/supabase/server';
import { claimVisitorProviderCall } from '../../../lib/visitor-rate-guard';
import { groundedAnswerInstruction } from '../../../lib/grounded-prompt';
import {
  buildGroundedContext,
  formatBoundedHistory,
  retrievalLimits,
  scopedSimilaritySearch,
  validateCitationIds,
  type ChatHistoryMessage,
} from '../../../lib/retrieval';
export const runtime = 'nodejs';
type ProviderError = { statusCode?: unknown; status?: unknown };
function isRateLimited(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    ((error as ProviderError).statusCode === 429 || (error as ProviderError).status === 429)
  );
}
function safeStreamError(error: unknown, signal: AbortSignal, timedOut: AbortSignal) {
  if (signal.aborted)
    return timedOut.aborted
      ? 'Die Modellanfrage hat das Zeitlimit überschritten.'
      : 'Die Anfrage wurde abgebrochen.';
  if (isRateLimited(error))
    return 'Das Modell ist gerade ausgelastet. Bitte versuche es gleich noch einmal.';
  return 'Die Modellantwort ist momentan nicht verfügbar. Bitte versuche es später erneut.';
}
function citationIds(text: string) {
  return [...text.matchAll(/\[citation:([0-9a-f-]{36})\]/gi)].map((match) => match[1]);
}
async function savedHistory(db: any, notebookId: string): Promise<ChatHistoryMessage[]> {
  const { data, error } = await db
    .from('chats')
    .select('id,messages(role,content,created_at)')
    .eq('notebook_id', notebookId)
    .order('created_at', { ascending: false })
    .limit(retrievalLimits.historyMessages);
  if (error) throw error;
  return (data ?? [])
    .flatMap((chat: { messages?: ChatHistoryMessage[] }) => chat.messages ?? [])
    .filter(
      (message: ChatHistoryMessage) => message.role === 'user' || message.role === 'assistant',
    )
    .slice(-retrievalLimits.historyMessages);
}
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'invalid_request', message: 'Die Chat-Anfrage ist kein gültiges JSON.' },
      { status: 400 },
    );
  }
  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : body;
  const parsed = chatRequestSchema.safeParse(
    input && typeof input === 'object'
      ? {
          notebookId: (input as Record<string, unknown>).notebookId,
          sourceIds: (input as Record<string, unknown>).sourceIds,
          messages: currentUserMessages((input as Record<string, unknown>).messages),
        }
      : input,
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        code: 'invalid_request',
        message: 'Die Chat-Anfrage enthält keine zulässigen Nutzernachrichten oder Quellen.',
      },
      { status: 400 },
    );
  const timeout = AbortSignal.timeout(chatLimits.timeoutMs);
  const abortSignal = AbortSignal.any([request.signal, timeout]);
  if (abortSignal.aborted)
    return NextResponse.json(
      { code: 'aborted', message: 'Die Anfrage wurde abgebrochen.' },
      { status: 499 },
    );
  const db = await createClient();
  const user = db.visitor;
  if (!user)
    return NextResponse.json(
      { code: 'unauthorized', message: 'Besuchersitzung nicht verfügbar.' },
      { status: 401 },
    );
  const { data: notebook } = await db
    .from('notebooks')
    .select('id')
    .eq('id', parsed.data.notebookId)
    .maybeSingle();
  if (!notebook)
    return NextResponse.json(
      { code: 'not_found', message: 'Notebook nicht gefunden.' },
      { status: 404 },
    );
  const config = getModelConfiguration();
  if (!config.configured)
    return NextResponse.json(
      { code: 'not_configured', message: 'Die Modellanbindung ist noch nicht konfiguriert.' },
      { status: 503 },
    );
  const quota = await claimVisitorProviderCall(db);
  if (!quota.allowed)
    return NextResponse.json(
      {
        code: 'rate_limited',
        message:
          'Das Limit für diese anonyme Sitzung ist erreicht. Bitte versuche es nach Ablauf der Wartezeit erneut.',
      },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds) } },
    );
  const question = parsed.data.messages.at(-1)!.parts[0].text;
  let passages;
  try {
    passages = await scopedSimilaritySearch(db, {
      notebookId: notebook.id,
      userId: user.id,
      sourceIds: parsed.data.sourceIds,
      question,
      apiKey: config.apiKey,
      signal: abortSignal,
    });
  } catch {
    return NextResponse.json(
      {
        code: abortSignal.aborted ? 'aborted' : 'retrieval_failed',
        message: abortSignal.aborted
          ? safeStreamError(new Error(), abortSignal, timeout)
          : 'Quellen konnten nicht sicher durchsucht werden.',
      },
      { status: abortSignal.aborted ? 499 : 502 },
    );
  }
  const grounded = buildGroundedContext(passages);
  if (!grounded.passages.length)
    return NextResponse.json(
      {
        code: 'no_context',
        message: 'Keine passenden Passagen in den ausgewählten Quellen gefunden.',
      },
      { status: 400 },
    );
  let history: ChatHistoryMessage[];
  try {
    history = await savedHistory(db, notebook.id);
  } catch {
    return NextResponse.json(
      { code: 'history_failed', message: 'Chatverlauf konnte nicht geladen werden.' },
      { status: 500 },
    );
  }
  // A chat performs two provider calls: query embedding and final generation. Claim each one.
  const completionQuota = await claimVisitorProviderCall(db);
  if (!completionQuota.allowed)
    return NextResponse.json(
      {
        code: 'rate_limited',
        message:
          'Das Limit für diese anonyme Sitzung ist erreicht. Bitte versuche es nach Ablauf der Wartezeit erneut.',
      },
      { status: 429, headers: { 'Retry-After': String(completionQuota.retryAfterSeconds) } },
    );
  const { data: chat, error: chatError } = await db
    .from('chats')
    .insert({ notebook_id: notebook.id, title: question.slice(0, 160) })
    .select('id')
    .single();
  if (chatError || !chat)
    return NextResponse.json(
      { code: 'persistence_failed', message: 'Chat konnte nicht gespeichert werden.' },
      { status: 500 },
    );
  const { error: userMessageError } = await db
    .from('messages')
    .insert({ chat_id: chat.id, role: 'user', content: question });
  if (userMessageError)
    return NextResponse.json(
      { code: 'persistence_failed', message: 'Nachricht konnte nicht gespeichert werden.' },
      { status: 500 },
    );
  const proposedAssistantMessageId = crypto.randomUUID();
  const { data: assistantMessage, error: assistantMessageError } = await db
    .from('messages')
    .insert({
      id: proposedAssistantMessageId,
      chat_id: chat.id,
      role: 'assistant',
      content: completionNotice('interrupted'),
      citations: [],
    })
    .select('id')
    .single();
  if (assistantMessageError || !assistantMessage)
    return NextResponse.json(
      { code: 'persistence_failed', message: 'Antwort konnte nicht sicher vorbereitet werden.' },
      { status: 500 },
    );
  const assistantMessageId = assistantMessage.id;
  let partial = '';
  let failure: string | undefined;
  let persisted = false;
  const persist = async (text: string, reason: string) => {
    const ids = validateCitationIds(citationIds(text), grounded.passages);
    const { error } = await db
      .from('messages')
      .update({
        content: completedContent(text, reason),
        citations: ids.map((id) => {
          const p = grounded.passages.find((x) => x.id === id)!;
          return {
            id,
            sourceId: p.source_id,
            page: p.page,
            section: p.section,
            excerpt: p.content,
          };
        }),
      })
      .eq('id', assistantMessageId);
    persisted = !error;
    if (error) console.error(JSON.stringify({ event: 'assistant_message_persistence_failed' }));
  };
  try {
    const openai = createOpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    });
    const result = streamText({
      model: openai.responses(config.modelId),
      system: groundedAnswerInstruction,
      prompt:
        'Bisheriger Verlauf (nur Gesprächskontext, keine aktuelle Evidenz):\n' +
        formatBoundedHistory(history) +
        '\n\nAktuelle Evidenz:\n' +
        grounded.context +
        '\n\nFrage: ' +
        question,
      maxOutputTokens: chatLimits.maxOutputTokens,
      maxRetries: 0,
      abortSignal,
      providerOptions: { openai: { store: false } },
      onChunk: ({ chunk }) => {
        if (chunk.type === 'text-delta') partial += chunk.text;
      },
      onAbort: async () => {
        failure = timeout.aborted ? 'timeout' : 'abort';
        await persist(partial, failure);
      },
      onError: async () => {
        failure = 'error';
        await persist(partial, failure);
      },
      onFinish: async ({ text, totalUsage, finishReason }) => {
        const reason = failure ?? finishReason;
        await persist(text, reason);
        console.info(
          JSON.stringify({
            event: 'openai_usage',
            model: config.modelId,
            usage: totalUsage,
            finishReason: reason,
          }),
        );
      },
    });
    return result.toUIMessageStreamResponse({
      consumeSseStream: ({ stream }) => consumeStream({ stream }),
      onError: (error) => safeStreamError(error, abortSignal, timeout),
      messageMetadata: ({ part }) =>
        part.type === 'start'
          ? { assistantMessageId }
          : part.type === 'finish'
            ? {
                assistantMessageId,
                finishReason: failure ?? part.finishReason,
                persisted,
                notice:
                  (failure ?? part.finishReason) === 'stop'
                    ? undefined
                    : completionNotice(failure ?? part.finishReason),
              }
            : undefined,
    });
  } catch (error) {
    await persist(partial, abortSignal.aborted ? (timeout.aborted ? 'timeout' : 'abort') : 'error');
    return NextResponse.json(
      {
        code: isRateLimited(error) ? 'rate_limited' : 'provider_error',
        message: safeStreamError(error, abortSignal, timeout),
      },
      { status: isRateLimited(error) ? 429 : 502 },
    );
  }
}
