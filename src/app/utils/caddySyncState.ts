import { getRuntimeCaddyApiUrl } from './caddyUrls';

export interface CaddySyncSnapshot {
  connected: boolean;
  startupMode: 'degraded' | 'strict' | 'wait';
  lastError: string | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  pendingChanges: boolean;
  caddyApiUrl: string;
}

interface CaddySyncState {
  connected: boolean;
  lastError: string | null;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  pendingChanges: boolean;
}

const CADDY_API = getRuntimeCaddyApiUrl();
const startupMode = (process.env.CADDY_STARTUP_MODE ?? 'degraded') as CaddySyncSnapshot['startupMode'];

const state: CaddySyncState = {
  connected: true,
  lastError: null,
  lastAttemptAt: null,
  lastSuccessAt: null,
  pendingChanges: false,
};

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function markCaddyPending() {
  state.pendingChanges = true;
}

export function markCaddySuccess() {
  state.connected = true;
  state.lastError = null;
  state.lastAttemptAt = new Date();
  state.lastSuccessAt = state.lastAttemptAt;
  state.pendingChanges = false;
}

export function markCaddyFailure(error: string) {
  state.connected = false;
  state.lastError = error;
  state.lastAttemptAt = new Date();
  state.pendingChanges = true;
}

export function getCaddySyncSnapshot(): CaddySyncSnapshot {
  return {
    connected: state.connected,
    startupMode,
    lastError: state.lastError,
    lastAttemptAt: toIso(state.lastAttemptAt),
    lastSuccessAt: toIso(state.lastSuccessAt),
    pendingChanges: state.pendingChanges,
    caddyApiUrl: CADDY_API,
  };
}

export function getCaddyStartupMode(): 'degraded' | 'strict' | 'wait' {
  const mode = process.env.CADDY_STARTUP_MODE;
  if (mode === 'strict' || mode === 'wait' || mode === 'degraded') {
    return mode;
  }
  return 'degraded';
}
