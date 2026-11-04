export type DemoProvisioningStage = 'configuration' | 'quota' | 'embedding' | 'sources' | 'chunks' | 'ready';

export type DemoProvisioningResult =
  | { kind: 'ready' }
  | { kind: 'rate_limited'; retryAfterSeconds: number }
  | { kind: 'unavailable'; stage: DemoProvisioningStage; errorCode: 'demo_sources_unavailable' };

type DemoProvisioningActions = {
  configured: boolean;
  claimQuota: () => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
  embed: () => Promise<void>;
  insertSources: () => Promise<void>;
  insertChunks: () => Promise<void>;
  markSourcesReady: () => Promise<void>;
};

/**
 * Runs the demo setup without exposing provider or database error details to an
 * anonymous client. The returned stage is for server-side, correlation-safe
 * diagnostics only.
 */
export async function provisionDemoSources(actions: DemoProvisioningActions): Promise<DemoProvisioningResult> {
  if (!actions.configured) return { kind: 'unavailable', stage: 'configuration', errorCode: 'demo_sources_unavailable' };

  let stage: DemoProvisioningStage = 'quota';
  try {
    const quota = await actions.claimQuota();
    if (!quota.allowed) return { kind: 'rate_limited', retryAfterSeconds: quota.retryAfterSeconds };
    stage = 'embedding';
    await actions.embed();
    stage = 'sources';
    await actions.insertSources();
    stage = 'chunks';
    await actions.insertChunks();
    stage = 'ready';
    await actions.markSourcesReady();
    return { kind: 'ready' };
  } catch {
    return { kind: 'unavailable', stage, errorCode: 'demo_sources_unavailable' };
  }
}

/** Maps returned insert rows by their explicit title rather than database row order. */
export function mapDemoSourcesByTitle(expectedTitles: string[], rows: Array<{ id: string; title: string }>): Array<{ id: string }> | null {
  if (rows.length !== expectedTitles.length) return null;
  const idsByTitle = new Map(rows.map(row => [row.title, row.id]));
  if (idsByTitle.size !== expectedTitles.length) return null;
  const mapped = expectedTitles.map(title => idsByTitle.get(title));
  return mapped.every((id): id is string => Boolean(id)) ? mapped.map(id => ({ id })) : null;
}
