'use client';

import { useEffect, useState } from 'react';
import { buildCaddyUrl, CADDY_CONFIG_PATH, DEFAULT_CADDY_API_URL } from '../utils/caddyUrls';

interface CaddyStatus {
  connected: boolean;
  lastError: string | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  pendingChanges: boolean;
  caddyApiUrl: string;
}

const DEFAULT_STATUS: CaddyStatus = {
  connected: true,
  lastError: null,
  lastAttemptAt: null,
  lastSuccessAt: null,
  pendingChanges: false,
  caddyApiUrl: DEFAULT_CADDY_API_URL,
};

export default function CaddyStatusPanel() {
  const [status, setStatus] = useState<CaddyStatus>(DEFAULT_STATUS);
  const [retrying, setRetrying] = useState(false);

  const isHealthy = status.connected && !status.pendingChanges;

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status/caddy', { cache: 'no-store' });
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {
      setStatus(prev => ({ ...prev, connected: false }));
    }
  }

  useEffect(() => {
    void fetchStatus();
  }, []);

  useEffect(() => {
    if (status.connected && !status.pendingChanges) return;

    const timer = setInterval(() => {
      void fetchStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, [status.connected, status.pendingChanges]);

  async function retrySyncNow() {
    setRetrying(true);
    try {
      await fetch('/api/status/caddy/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      await fetchStatus();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section
      className={`brutal-panel p-5 lg:col-span-2 ${isHealthy ? '' : 'brutal-panel-urgent animate-[alert-slam_220ms_ease-in-out_3]'}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-700">Sync Status</p>
      <p className="mt-2 text-xl font-black text-zinc-900">
        Caddy status: {isHealthy ? 'Connected' : 'Disconnected or out of sync'}
      </p>
      {isHealthy ? (
        <p className="mt-2 text-sm font-semibold text-emerald-700">Configuration changes are being applied to Caddy.</p>
      ) : (
        <>
          <p className="mt-2 text-sm font-semibold text-amber-700">
            Changes are saved in this app, but Caddy has not loaded them yet.
          </p>
          <p className="mt-3 text-xs font-medium text-zinc-700">
            Recovery: run <code>systemctl is-active caddy</code>, then <code>sudo systemctl start caddy</code>, and verify <code>curl {buildCaddyUrl(status.caddyApiUrl, CADDY_CONFIG_PATH)}</code>.
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-700">API: {status.caddyApiUrl}</p>
          {status.lastError && <p className="mt-2 text-xs font-medium text-zinc-700">Last error: {status.lastError}</p>}
          <button
            type="button"
            onClick={retrySyncNow}
            disabled={retrying}
            className="mt-4 border-2 border-black bg-black px-3 py-2 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {retrying ? 'Retrying...' : 'Retry sync now'}
          </button>
        </>
      )}
    </section>
  );
}
