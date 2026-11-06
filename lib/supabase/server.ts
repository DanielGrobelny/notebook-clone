import { createClient as supabase } from '@supabase/supabase-js';
import { getVisitorSession } from '../visitor-session';
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('visitor_backend_not_configured');
  return supabase(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function createClient() {
  const session = await getVisitorSession();
  const db = supabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-visitor-token': session.token } },
    },
  );
  return Object.assign(db, { visitor: { id: session.id } });
}
