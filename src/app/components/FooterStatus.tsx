"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";

interface CaddyStatus {
  connected: boolean;
  startupMode: "degraded" | "strict" | "wait";
  lastError: string | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  pendingChanges: boolean;
}

const DEFAULT_STATUS: CaddyStatus = {
  connected: true,
  startupMode: "degraded",
  lastError: null,
  lastAttemptAt: null,
  lastSuccessAt: null,
  pendingChanges: false,
};

function formatTimestamp(value: string | null) {
  if (!value) return "never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FooterStatus() {
  const [status, setStatus] = useState<CaddyStatus>(DEFAULT_STATUS);
  const [retrying, setRetrying] = useState(false);

  const healthy = status.connected && !status.pendingChanges;

  const summary = useMemo(() => {
    if (healthy) {
      return `Connected · ${status.startupMode} · last sync ${formatTimestamp(status.lastSuccessAt)}`;
    }

    const failedAt = status.lastAttemptAt ?? status.lastSuccessAt;
    return `Degraded · ${status.startupMode} · last attempt ${formatTimestamp(failedAt)}`;
  }, [healthy, status.lastAttemptAt, status.lastSuccessAt, status.startupMode]);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/status/caddy", { cache: "no-store" });
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {
      setStatus(prev => ({ ...prev, connected: false }));
    }
  }

  async function retrySyncNow() {
    setRetrying(true);
    try {
      await fetch("/api/status/caddy/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      await fetchStatus();
    } finally {
      setRetrying(false);
    }
  }

  useEffect(() => {
    void fetchStatus();
  }, []);

  useEffect(() => {
    if (healthy) return;

    const timer = setInterval(() => {
      void fetchStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, [healthy]);

  return (
    <footer className="mt-auto border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p aria-live="polite">Status: {summary}</p>
        {!healthy ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={retrying}
            onClick={retrySyncNow}
          >
            {retrying ? "Retrying" : "Retry"}
          </Button>
        ) : null}
      </div>
      {!healthy && status.lastError ? (
        <p className="mt-2 text-xs text-muted-foreground/90">{status.lastError}</p>
      ) : null}
    </footer>
  );
}
