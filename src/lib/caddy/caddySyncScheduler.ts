import { applyCaddyConfig } from '~/lib/caddy/caddyApi';
import { getCaddySyncSnapshot } from '~/lib/caddy/caddySyncState';

let retryTimer: NodeJS.Timeout | null = null;

function retryIntervalMs(): number {
  const seconds = Number(process.env.CADDY_RETRY_SECONDS ?? '10');
  if (!Number.isFinite(seconds) || seconds <= 0) return 10_000;
  return seconds * 1000;
}

export async function retryCaddyNow() {
  return applyCaddyConfig();
}

export function ensureCaddyRetryLoop() {
  if (retryTimer) return;

  retryTimer = setInterval(async () => {
    const status = await getCaddySyncSnapshot();
    if (!status.pendingChanges) return;
    await retryCaddyNow();
  }, retryIntervalMs());
}
