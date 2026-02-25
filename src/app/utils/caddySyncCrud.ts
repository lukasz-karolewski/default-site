import { applyCaddyConfig, applyCaddyConfigStrict } from './caddyApi';
import { ensureCaddyRetryLoop } from './caddySyncScheduler';
import { getCaddyStartupMode, getCaddySyncSnapshot } from './caddySyncState';

export interface CaddySyncResult {
  attempted: boolean;
  applied: boolean;
  error: string | null;
  pendingChanges: boolean;
}

function isStrictMode() {
  return getCaddyStartupMode() === 'strict';
}

export async function syncCaddyForCrud(): Promise<CaddySyncResult> {
  if (isStrictMode()) {
    await applyCaddyConfigStrict();
    return { attempted: true, applied: true, error: null, pendingChanges: false };
  }

  const result = await applyCaddyConfig();
  if (!result.ok) {
    ensureCaddyRetryLoop();
  }

  return {
    attempted: true,
    applied: result.ok,
    error: result.error,
    pendingChanges: getCaddySyncSnapshot().pendingChanges,
  };
}
