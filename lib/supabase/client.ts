'use client';
import { createBrowserClient } from '@supabase/ssr';

// Next ersetzt nur direkte NEXT_PUBLIC-Zugriffe beim Client-Build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseBrowserConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('supabase_browser_not_configured');
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
