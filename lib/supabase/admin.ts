import 'server-only';
import { createClient as supabase } from '@supabase/supabase-js';
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('visitor_backend_not_configured');
  return supabase(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
