import { createClient } from './supabase/server';
export async function visitorContext() {
  const db = await createClient();
  return { db, visitorId: db.visitor.id };
}
export async function ownedNotebook(
  db: Pick<Awaited<ReturnType<typeof createClient>>, 'from'>,
  id: string,
  visitorId: string,
) {
  const { data, error } = await db
    .from('notebooks')
    .select('id,title,created_at,updated_at')
    .eq('id', id)
    .eq('visitor_id', visitorId)
    .maybeSingle();
  if (error) throw new Error('notebook_lookup_failed');
  return data;
}
