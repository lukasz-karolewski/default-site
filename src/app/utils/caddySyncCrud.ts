import { applyCaddyConfig } from './caddyApi';
import { ensureCaddyRetryLoop } from './caddySyncScheduler';
import { getCaddySyncSnapshot } from '~/lib/caddySyncState';

export interface CaddySyncResult {
  attempted: boolean;
  applied: boolean;
  error: string | null;
  pendingChanges: boolean;
}

export async function syncCaddyForCrud(): Promise<CaddySyncResult> {
  const result = await applyCaddyConfig();
  if (!result.ok) {
    ensureCaddyRetryLoop();
  }

  return {
    attempted: true,
    applied: result.ok,
    error: result.error,
    pendingChanges: (await getCaddySyncSnapshot()).pendingChanges,
  };
}
