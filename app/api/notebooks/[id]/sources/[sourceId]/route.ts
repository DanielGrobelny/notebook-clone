import { NextResponse } from 'next/server';
import { createClient } from '../../../../../../lib/supabase/server';
const uuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  const { id, sourceId } = await params;
  if (!uuid(id) || !uuid(sourceId))
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const db = await createClient();
  const user = db.visitor;
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: source } = await db
    .from('sources')
    .select('id,title,source_type,status,created_at,byte_size,page_count,storage_path')
    .eq('id', sourceId)
    .eq('notebook_id', id)
    .maybeSingle();
  if (!source) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (new URL(request.url).searchParams.get('download') === '1') {
    if (!source.storage_path) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const { data: file, error } = await db.storage
      .from('source-files')
      .download(source.storage_path);
    if (error || !file) return NextResponse.json({ error: 'download_failed' }, { status: 404 });
    return new Response(file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment',
        'Cache-Control': 'private, no-store',
      },
    });
  }
  const { data: chunks, error } = await db
    .from('source_chunks')
    .select('id,position,content,metadata')
    .eq('source_id', sourceId)
    .order('position');
  return error
    ? NextResponse.json({ error: 'query_failed' }, { status: 500 })
    : NextResponse.json({ source, chunks });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  const { id, sourceId } = await params;
  if (!uuid(id) || !uuid(sourceId))
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  const db = await createClient();
  const user = db.visitor;
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: source } = await db
    .from('sources')
    .select('id,storage_path')
    .eq('id', sourceId)
    .eq('notebook_id', id)
    .maybeSingle();
  if (!source) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  // Remove the blob first. A failed storage operation leaves the DB row intact,
  // so the request can safely be retried instead of returning a false 204.
  if (source.storage_path) {
    const { error: storageError } = await db.storage
      .from('source-files')
      .remove([source.storage_path]);
    if (
      storageError &&
      Number((storageError as { statusCode?: number | string }).statusCode) !== 404
    )
      return NextResponse.json({ error: 'storage_delete_failed' }, { status: 502 });
  }
  const { error } = await db.from('sources').delete().eq('id', sourceId).eq('notebook_id', id);
  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
