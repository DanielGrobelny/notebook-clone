import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getModelConfiguration } from '../../ai-config';
import { embedTexts, vectorLiteral } from '../../../lib/embeddings';
import { claimAnonymousProviderCall } from '../../../lib/anonymous-provider-rate-guard';

const samples = [
  { title: 'Produktstrategie 2026', content: 'Synthetische Demoquelle. Das Team priorisiert klare Zielgruppen, messbare Lernschleifen und einen kleinen ersten Nutzen.' },
  { title: 'Interview-Notizen', content: 'Synthetische Demoquelle. Testpersonen wünschen eine ruhige Ablage, nachvollziehbare Quellen und kurze Zusammenfassungen.' },
];

async function userClient() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  return { db, user };
}

export async function POST() {
  const { db, user } = await userClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: existing } = await db.from('notebooks').select('id,title,sources(status)').eq('is_demo', true).order('created_at').limit(1).maybeSingle();
  if (existing) return NextResponse.json({ notebook: { id: existing.id, title: existing.title }, providerReady: (existing.sources ?? []).some((source: { status: string }) => source.status === 'ready'), existing: true });
  const { data: notebook, error } = await db.from('notebooks').insert({ title: 'Mein Demo-Notebook', is_demo: true }).select('id,title').single();
  if (error || !notebook) return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  const config = getModelConfiguration();
  let providerReady = false;
  try {
    if (!config.configured) throw new Error('not_configured');
    const quota = await claimAnonymousProviderCall(db, user);
    if (!quota.allowed) return NextResponse.json({ error: 'rate_limited', message: 'Das Demo-Limit ist für diese anonyme Sitzung erreicht. Bitte warte, bevor du es erneut versuchst.' }, { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds) } });
    const embeddings = await embedTexts(samples.map(sample => sample.content), config.apiKey, undefined, config.baseURL);
    const { data: sources, error: sourceError } = await db.from('sources').insert(samples.map(sample => ({ notebook_id: notebook.id, title: sample.title, source_type: 'text', status: 'processing', byte_size: sample.content.length, page_count: null }))).select('id').order('created_at');
    if (sourceError || !sources || sources.length !== samples.length) throw new Error('source_failed');
    const { error: chunkError } = await db.from('source_chunks').insert(sources.map((source, index) => ({ source_id: source.id, position: 0, content: samples[index].content, metadata: { section: 'Synthetische Demoquelle' }, embedding: vectorLiteral(embeddings[index]) })));
    if (chunkError) throw chunkError;
    const { error: readyError } = await db.from('sources').update({ status: 'ready' }).in('id', sources.map(source => source.id));
    if (readyError) throw readyError;
    providerReady = true;
  } catch {
    // The notebook is still real and private. No fabricated embeddings or answers are stored.
  }
  return NextResponse.json({ notebook, providerReady, existing: false }, { status: 201 });
}

export async function DELETE() {
  const { db, user } = await userClient();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { error } = await db.from('notebooks').delete().eq('is_demo', true);
  return error ? NextResponse.json({ error: 'reset_failed' }, { status: 500 }) : new NextResponse(null, { status: 204 });
}
