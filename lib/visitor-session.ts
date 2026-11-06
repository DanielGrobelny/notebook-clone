import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { adminClient } from './supabase/server';
export const visitorCookieName = 'notebook_visitor';
const lifetimeMs = 30 * 24 * 60 * 60 * 1000;
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/** The privileged client is used only to resolve/create hashed sessions. */
export async function getVisitorSession() {
  const jar = await cookies();
  const existing = jar.get(visitorCookieName)?.value;
  const db = adminClient();
  if (existing && /^[A-Za-z0-9_-]{43}$/.test(existing)) {
    const { data, error } = await db
      .from('visitor_sessions')
      .select('id,expires_at')
      .eq('token_hash', hash(existing))
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (error) throw new Error('visitor_session_unavailable');
    if (data) return { id: data.id, token: existing };
  }
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + lifetimeMs);
  const { data, error } = await db
    .from('visitor_sessions')
    .insert({ token_hash: hash(token), expires_at: expires.toISOString() })
    .select('id')
    .single();
  if (error || !data) throw new Error('visitor_session_unavailable');
  const secure = (await headers()).get('x-forwarded-proto') === 'https';
  jar.set(visitorCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires,
  });
  return { id: data.id, token };
}
