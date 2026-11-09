/** Fixed per-visitor limit; deleting cookies can bypass it. Not a spending cap. */
export const visitorProviderLimit = { calls: 12, windowSeconds: 3600 } as const;
type RateDb = { rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }> };
export async function claimVisitorProviderCall(db: RateDb) {
  const { data, error } = await db.rpc('claim_visitor_provider_call');
  if (error)
    return {
      allowed: false,
      retryAfterSeconds: visitorProviderLimit.windowSeconds,
      unavailable: true,
    };
  const row = (Array.isArray(data) ? data[0] : data) as {
    allowed?: boolean;
    retry_after_seconds?: number;
  } | null;
  return {
    allowed: row?.allowed === true,
    retryAfterSeconds: Math.max(1, Math.ceil(Number(row?.retry_after_seconds) || 0)),
  };
}
