/**
 * Anonymous sessions may spend at most 12 provider calls per rolling database
 * window of 60 minutes. The database RPC serializes concurrent requests.
 * This limits one anonymous identity; deleting/resetting a demo never resets it.
 * It is deliberately not an anti-abuse boundary against a user creating a new
 * anonymous identity (and we do not trust forwarded client IP headers).
 */
export const anonymousProviderLimit = { calls: 12, windowSeconds: 60 * 60 } as const;

type RateDb = { rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }> };
type RateRow = { allowed?: unknown; retry_after_seconds?: unknown };

export function isAnonymousUser(user: unknown) {
  if (!user || typeof user !== 'object') return false;
  const candidate = user as { is_anonymous?: unknown; app_metadata?: unknown };
  const metadata = candidate.app_metadata && typeof candidate.app_metadata === 'object'
    ? candidate.app_metadata as { is_anonymous?: unknown } : undefined;
  return candidate.is_anonymous === true || metadata?.is_anonymous === true;
}

export async function claimAnonymousProviderCall(db: RateDb, user: unknown) {
  if (!isAnonymousUser(user)) return { allowed: true, retryAfterSeconds: 0 };
  const { data, error } = await db.rpc('claim_anonymous_provider_call');
  if (error) return { allowed: false, retryAfterSeconds: anonymousProviderLimit.windowSeconds, unavailable: true };
  const row = (Array.isArray(data) ? data[0] : data) as RateRow | null;
  const retryAfterSeconds = Math.max(1, Math.ceil(Number(row?.retry_after_seconds) || 0));
  return { allowed: row?.allowed === true, retryAfterSeconds };
}
