import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getModelConfiguration } from '../../ai-config';
import { embedTexts, vectorLiteral } from '../../../lib/embeddings';
import { claimAnonymousProviderCall } from '../../../lib/anonymous-provider-rate-guard';
import { mapDemoSourcesByTitle, provisionDemoSources } from '../../../lib/demo-provisioning';

const samples = [
  { title: 'Produktstrategie 2026', content: 'Synthetische Demoquelle. Das Team priorisiert klare Zielgruppen, messbare Lernschleifen und einen kleinen ersten Nutzen.' },
  { title: 'Interview-Notizen', content: 'Synthetische Demoquelle. Testpersonen wünschen eine ruhige Ablage, nachvollziehbare Quellen und kurze Zusammenfassungen.' },
];
const unavailableCode = 'demo_sources_unavailable' as const;

async function userClient() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  return { db, user };
}

export async function POST() {
  const requestId = crypto.randomUUID();
  const { db, user } = await userClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: existing } = await db.from('notebooks').select('id,title,sources(status)').eq('is_demo', true).order('created_at').limit(1).maybeSingle();
  if (existing) {
    const providerReady = (existing.sources ?? []).some((source: { status: string }) => source.status === 'ready');
    return NextResponse.json({ notebook: { id: existing.id, title: existing.title }, providerReady, ...(providerReady ? {} : { providerIssue: unavailableCode }), existing: true });
  }
  const { data: notebook, error } = await db.from('notebooks').insert({ title: 'Mein Demo-Notebook', is_demo: true }).select('id,title').single();
  if (error || !notebook) return NextResponse.json({ error: 'create_failed' }, { status: 500 });

  const config = getModelConfiguration();
  let embeddings: number[][] = [];
  let sources: Array<{ id: string }> = [];
  const provision = await provisionDemoSources({
    configured: config.configured,
    claimQuota: () => claimAnonymousProviderCall(db, user),
    embed: async () => {
      if (!config.configured) throw new Error('unreachable');
      embeddings = await embedTexts(samples.map(sample => sample.content), config.apiKey, undefined, config.baseURL);
    },
    insertSources: async () => {
      const { data, error: sourceError } = await db.from('sources').insert(samples.map(sample => ({ notebook_id: notebook.id, title: sample.title, source_type: 'text', status: 'processing', byte_size: sample.content.length, page_count: null }))).select('id,title');
      const mapped = mapDemoSourcesByTitle(samples.map(sample => sample.title), data ?? []);
      if (sourceError || !mapped) throw new Error('source_failed');
      sources = mapped;
    },
    insertChunks: async () => {
      const { error: chunkError } = await db.from('source_chunks').insert(sources.map((source, index) => ({ source_id: source.id, position: 0, content: samples[index].content, metadata: { section: 'Synthetische Demoquelle' }, embedding: vectorLiteral(embeddings[index]) })));
      if (chunkError) throw new Error('chunk_failed');
    },
    markSourcesReady: async () => {
      const { error: readyError } = await db.from('sources').update({ status: 'ready' }).in('id', sources.map(source => source.id));
      if (readyError) throw new Error('ready_failed');
    },
  });

  if (provision.kind === 'rate_limited') return NextResponse.json({ error: 'rate_limited', message: 'Das Demo-Limit ist für diese anonyme Sitzung erreicht. Bitte warte, bevor du es erneut versuchst.' }, { status: 429, headers: { 'Retry-After': String(provision.retryAfterSeconds) } });
  if (provision.kind === 'unavailable') {
    // Deliberately omit error objects, prompts, credentials, and database details.
    console.error('demo_provisioning_unavailable', { requestId, stage: provision.stage, errorCode: provision.errorCode });
    return NextResponse.json({ notebook, providerReady: false, providerIssue: provision.errorCode, requestId, existing: false }, { status: 201 });
  }
  return NextResponse.json({ notebook, providerReady: true, existing: false }, { status: 201 });
}

export async function DELETE() {
  const { db, user } = await userClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { error } = await db.from('notebooks').delete().eq('is_demo', true);
  return error ? NextResponse.json({ error: 'reset_failed' }, { status: 500 }) : new NextResponse(null, { status: 204 });
}
