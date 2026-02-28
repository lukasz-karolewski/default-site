"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { buildCaddyUrl, CADDY_CONFIG_PATH } from "~/lib/caddy/caddyUrls";
import {
  formatChanged,
  formatHash,
  formatTimestamp,
  useCaddyStatus,
} from "~/lib/ui/useCaddyStatus";
import CopyCommand from "./CopyCommand";

export default function FooterStatus() {
  const {
    status,
    writing,
    showDiagnostics,
    healthy,
    summary,
    fetchStatus,
    writeConfigNow,
    setShowDiagnostics,
  } = useCaddyStatus();

  return (
    <footer className="mt-auto border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p aria-live="polite">Status: {summary}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={writing}
            onClick={writeConfigNow}
          >
            {writing ? "Writing..." : "Write config now"}
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={fetchStatus}
          >
            Refresh
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => setShowDiagnostics((value) => !value)}
          >
            {showDiagnostics ? "Hide diagnostics" : "Diagnostics"}
          </Button>
        </div>
      </div>

      {showDiagnostics ? (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground/90">
          <p>Connected: {status.connected ? "yes" : "no"}</p>
          <p>Pending changes: {status.pendingChanges ? "yes" : "no"}</p>
          <p>API: {status.caddyApiUrl || "unavailable"}</p>
          <p>
            Config endpoint:{" "}
            {status.caddyApiUrl
              ? buildCaddyUrl(status.caddyApiUrl, CADDY_CONFIG_PATH)
              : "unavailable"}
          </p>
          <p>
            Last Caddy API apply attempt:{" "}
            {formatTimestamp(status.lastAttemptAt)}
          </p>
          <p>
            Last successful Caddy API apply:{" "}
            {formatTimestamp(status.lastSuccessAt)}
          </p>
          <p>
            Last Caddyfile write by this app:{" "}
            {formatTimestamp(status.lastManagedWriteAt)}
          </p>
          <p>
            Hash of last app-written Caddyfile:{" "}
            {formatHash(status.lastManagedWriteHash)}
          </p>
          <p>Caddyfile path: {status.caddyfile.path || "unavailable"}</p>
          <p>Caddyfile exists: {status.caddyfile.exists ? "yes" : "no"}</p>
          <p>
            Caddyfile last modified on disk:{" "}
            {formatTimestamp(status.caddyfile.modifiedAt)}
          </p>
          <p>Caddyfile size: {status.caddyfile.sizeBytes ?? "unknown"} bytes</p>
          <p>
            Current on-disk Caddyfile hash: {formatHash(status.caddyfile.hash)}
          </p>
          <p>
            File changed since last app write:{" "}
            {formatChanged(status.caddyfile.changedSinceLastManagedWrite)}
          </p>
          {status.caddyfile.readError ? (
            <p>Caddyfile read error: {status.caddyfile.readError}</p>
          ) : null}
          {status.lastError ? <p>Last error: {status.lastError}</p> : null}
          <div className="space-y-1">
            <p>Recovery:</p>
            <div className="flex flex-wrap gap-2">
              <CopyCommand command="systemctl is-active caddy" />
              <CopyCommand command="sudo systemctl start caddy" />
              <CopyCommand command="sudo journalctl -u caddy -n 200 --no-pager" />
              <Button
                size="xs"
                variant="outline"
                render={<Link href="/onboarding?edit=1" />}
              >
                Update onboarding settings
              </Button>
            </div>
          </div>
        </div>
      ) : !healthy && status.lastError ? (
        <p className="mt-2 text-xs text-muted-foreground/90">
          {status.lastError}
        </p>
      ) : null}
    </footer>
  );
}
