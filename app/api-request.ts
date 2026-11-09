/** Never retry mutations automatically: a timed-out request may have succeeded. */
export async function apiRequest(url: string, options: RequestInit = {}, timeoutMs = 35000) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const response = await fetch(url, { ...options, signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const retry = response.headers.get('retry-after');
    const message =
      typeof body?.message === 'string'
        ? body.message
        : 'Anfrage fehlgeschlagen. Bitte erneut versuchen.';
    throw new Error(
      response.status === 429
        ? message +
            (retry && /^\d+$/.test(retry)
              ? ' Erneut in ' + retry + ' Sekunden versuchen.'
              : ' Bitte später erneut versuchen.')
        : message,
    );
  }
  return response;
}
