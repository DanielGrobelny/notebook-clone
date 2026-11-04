import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../../lib/supabase/server';
const uuid = z.string().uuid();
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = uuid.safeParse((await params).id);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const db = await createClient();
  const user=db.visitor;
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: notebook } = await db.from('notebooks').select('id').eq('id', parsed.data).maybeSingle();
  if (!notebook) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data, error } = await db.from('chats').select('id,title,created_at,messages(id,role,content,citations,created_at)').eq('notebook_id', notebook.id).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'history_failed' }, { status: 500 });
  return NextResponse.json({ chats: (data ?? []).map((chat: any) => ({ ...chat, messages: Array.isArray(chat.messages) ? chat.messages.sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at))) : [] })) });
}
