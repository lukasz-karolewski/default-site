"use client";

import { useEffect, useMemo, useState } from "react";

export interface CaddyStatus {
  connected: boolean;
  lastError: string | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  pendingChanges: boolean;
  caddyApiUrl: string;
  lastManagedWriteAt: string | null;
  lastManagedWriteHash: string | null;
  caddyfile: {
    path: string;
    exists: boolean;
    modifiedAt: string | null;
    sizeBytes: number | null;
    hash: string | null;
    readError: string | null;
    changedSinceLastManagedWrite: boolean | null;
  };
}

const DEFAULT_STATUS: CaddyStatus = {
  connected: true,
  lastError: null,
  lastAttemptAt: null,
  lastSuccessAt: null,
  pendingChanges: false,
  caddyApiUrl: "",
  lastManagedWriteAt: null,
  lastManagedWriteHash: null,
  caddyfile: {
    path: "",
    exists: false,
    modifiedAt: null,
    sizeBytes: null,
    hash: null,
    readError: null,
    changedSinceLastManagedWrite: null,
  },
};

export function formatTimestamp(value: string | null) {
  if (!value) return "never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatHash(value: string | null) {
  if (!value) return "none";
  return value.slice(0, 12);
}

export function formatChanged(value: boolean | null) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

export function useCaddyStatus() {
  const [status, setStatus] = useState<CaddyStatus>(DEFAULT_STATUS);
  const [writing, setWriting] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const healthy = status.connected && !status.pendingChanges;

  const summary = useMemo(() => {
    if (healthy) {
      return `Connected · last sync ${formatTimestamp(status.lastSuccessAt)}`;
    }

    const failedAt = status.lastAttemptAt ?? status.lastSuccessAt;
    return `Degraded · last attempt ${formatTimestamp(failedAt)}`;
  }, [healthy, status.lastAttemptAt, status.lastSuccessAt]);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/status/caddy", { cache: "no-store" });
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {
      setStatus(prev => ({ ...prev, connected: false }));
    }
  }

  async function writeConfigNow() {
    setWriting(true);
    try {
      await fetch("/api/status/caddy/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      await fetchStatus();
    } finally {
      setWriting(false);
    }
  }

  useEffect(() => {
    void fetchStatus();
  }, []);

  useEffect(() => {
    const hasTimestamps = Boolean(status.lastAttemptAt || status.lastSuccessAt);
    if (healthy && hasTimestamps) return;

    const timer = setInterval(() => {
      void fetchStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, [healthy, status.lastAttemptAt, status.lastSuccessAt]);

  return {
    status,
    writing,
    showDiagnostics,
    healthy,
    summary,
    fetchStatus,
    writeConfigNow,
    setShowDiagnostics,
  };
}
