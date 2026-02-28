import { syncCaddy } from "~/lib/caddy/caddySyncPipeline";
import { getCaddySyncStateSnapshot } from "~/lib/data/siteService";

let retryTimer: NodeJS.Timeout | null = null;
let retryInFlight = false;

function retryIntervalMs(): number {
  const seconds = Number(process.env.CADDY_RETRY_SECONDS ?? "10");
  if (!Number.isFinite(seconds) || seconds <= 0) return 10_000;
  return seconds * 1000;
}

async function runRetryTick() {
  if (retryInFlight) {
    scheduleNextTick();
    return;
  }

  retryInFlight = true;
  try {
    const status = await getCaddySyncStateSnapshot();
    if (status.pendingChanges) {
      await syncCaddy();
    }
  } finally {
    retryInFlight = false;
    scheduleNextTick();
  }
}

function scheduleNextTick() {
  if (!retryTimer) return;
  retryTimer = setTimeout(runRetryTick, retryIntervalMs());
}

export async function retryCaddyNow() {
  return syncCaddy();
}

export function ensureCaddyRetryLoop() {
  if (retryTimer) return;
  retryTimer = setTimeout(runRetryTick, retryIntervalMs());
}

export function stopCaddyRetryLoop() {
  if (!retryTimer) return;
  clearTimeout(retryTimer);
  retryTimer = null;
}
