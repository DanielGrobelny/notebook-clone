import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../../lib/supabase/server';
const uuid = z.string().uuid();
const note = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(20000),
  answerId: uuid.optional(),
});
async function notebook(id: string) {
  const db = await createClient();
  const user = db.visitor;
  if (!user) return { db, status: 401 as const };
  const { data: n } = await db.from('notebooks').select('id').eq('id', id).maybeSingle();
  return { db, status: n ? (200 as const) : (404 as const), n };
}
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = uuid.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const x = await notebook(id.data);
  if (x.status !== 200)
    return NextResponse.json(
      { error: x.status === 401 ? 'unauthorized' : 'not_found' },
      { status: x.status },
    );
  const { data, error } = await x.db
    .from('artifacts')
    .select('id,kind,title,content,source_refs,generation_status,created_at,updated_at')
    .eq('notebook_id', id.data)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'artifacts_failed' }, { status: 500 });
  const refs = [
    ...new Set((data ?? []).flatMap((a: any) => (a.source_refs ?? []).map((r: any) => r.id))),
  ];
  const { data: sources } = refs.length
    ? await x.db.from('sources').select('id').in('id', refs)
    : { data: [] };
  const present = new Set((sources ?? []).map((s: any) => s.id));
  return NextResponse.json({
    artifacts: (data ?? []).map((a: any) => ({
      ...a,
      stale: (a.source_refs ?? []).some((r: any) => !present.has(r.id)),
    })),
  });
}
export async function POST(r: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = uuid.safeParse((await params).id),
    body = note.safeParse(await r.json().catch(() => null));
  if (!id.success || !body.success)
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  const x = await notebook(id.data);
  if (x.status !== 200)
    return NextResponse.json(
      { error: x.status === 401 ? 'unauthorized' : 'not_found' },
      { status: x.status },
    );
  let refs: unknown[] = [];
  if (body.data.answerId) {
    const { data: message } = await x.db
      .from('messages')
      .select('citations,chats!inner(notebook_id)')
      .eq('id', body.data.answerId)
      .eq('chats.notebook_id', id.data)
      .eq('role', 'assistant')
      .maybeSingle();
    if (!message) return NextResponse.json({ error: 'answer_not_found' }, { status: 409 });
    refs = (Array.isArray(message.citations) ? message.citations : [])
      .filter((c: any) => typeof c?.sourceId === 'string')
      .map((c: any) => ({
        id: c.sourceId,
        title: typeof c.title === 'string' ? c.title : 'Quelle',
      }));
    const ids = [...new Set(refs.map((r: any) => r.id))];
    if (ids.length) {
      const { data: sources } = await x.db
        .from('sources')
        .select('id,title')
        .eq('notebook_id', id.data)
        .in('id', ids);
      if ((sources ?? []).length !== ids.length)
        return NextResponse.json({ error: 'invalid_source_refs' }, { status: 409 });
      const titles = new Map((sources ?? []).map((s: any) => [s.id, s.title]));
      refs = ids.map((sourceId) => ({ id: sourceId, title: titles.get(sourceId) }));
    }
  }
  const { data, error } = await x.db
    .from('artifacts')
    .insert({
      notebook_id: id.data,
      kind: 'note',
      title: body.data.title,
      content: body.data.content,
      source_refs: refs,
      generation_status: 'ready',
    })
    .select('id,kind,title,content,source_refs,generation_status,created_at,updated_at')
    .single();
  if (error) return NextResponse.json({ error: 'artifact_failed' }, { status: 500 });
  return NextResponse.json({ artifact: data }, { status: 201 });
}
