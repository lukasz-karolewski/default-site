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

interface DiagnosticItem {
  label: string;
  value: string;
}

function DiagnosticSection({
  title,
  items,
}: {
  title: string;
  items: DiagnosticItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-md border border-border/70 p-2">
      <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <dl className="mt-1 space-y-1">
        {items.map((item) => (
          <div
            className="grid grid-cols-[150px_1fr] gap-2"
            key={`${title}-${item.label}`}
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="break-all text-foreground/90">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function FooterStatus() {
  const {
    status,
    writing,
    showDiagnostics,
    fetchStatus,
    writeConfigNow,
    setShowDiagnostics,
  } = useCaddyStatus();

  const healthy = status.connected && !status.pendingChanges;

  const configEndpoint = status.caddyApiUrl
    ? buildCaddyUrl(status.caddyApiUrl, CADDY_CONFIG_PATH)
    : "unavailable";
  const lastApplyAt = status.lastAttemptAt ?? status.lastSuccessAt;
  const attemptDiffersFromSuccess = Boolean(
    status.lastAttemptAt &&
      status.lastSuccessAt &&
      status.lastAttemptAt !== status.lastSuccessAt,
  );
  const showHashDetails =
    status.caddyfile.changedSinceLastManagedWrite !== false;

  const syncItems: DiagnosticItem[] = [
    { label: "Connected", value: status.connected ? "yes" : "no" },
    { label: "Config endpoint", value: configEndpoint },
    { label: "Last apply", value: formatTimestamp(lastApplyAt) },
    ...(attemptDiffersFromSuccess
      ? [
          {
            label: "Last successful apply",
            value: formatTimestamp(status.lastSuccessAt),
          },
        ]
      : []),
  ];

  const caddyfileItems: DiagnosticItem[] = [
    { label: "Path", value: status.caddyfile.path || "unavailable" },
    { label: "Exists", value: status.caddyfile.exists ? "yes" : "no" },
    {
      label: "Last app write",
      value: formatTimestamp(status.lastManagedWriteAt),
    },
    {
      label: "Last disk update",
      value: formatTimestamp(status.caddyfile.modifiedAt),
    },
    {
      label: "Changed since app write",
      value: formatChanged(status.caddyfile.changedSinceLastManagedWrite),
    },
    ...(showHashDetails
      ? [
          {
            label: "Last app-write hash",
            value: formatHash(status.lastManagedWriteHash),
          },
          {
            label: "Current disk hash",
            value: formatHash(status.caddyfile.hash),
          },
        ]
      : []),
  ];

  const errorItems: DiagnosticItem[] = [
    ...(status.lastError
      ? [{ label: "Last sync error", value: status.lastError }]
      : []),
    ...(status.caddyfile.readError
      ? [{ label: "Caddyfile read error", value: status.caddyfile.readError }]
      : []),
  ];

  return (
    <footer className="mt-auto border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p aria-live="polite">
          Pending changes: {status.pendingChanges ? "yes" : "no"}
        </p>
        <div className="flex items-center gap-2">
          {showDiagnostics ? (
            <>
              <Button
                disabled={writing}
                onClick={writeConfigNow}
                size="xs"
                type="button"
                variant="outline"
              >
                {writing ? "Writing..." : "Write config now"}
              </Button>
              <Button
                onClick={fetchStatus}
                size="xs"
                type="button"
                variant="outline"
              >
                Refresh
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/onboarding?edit=1" />}
                size="xs"
                variant="outline"
              >
                Update onboarding settings
              </Button>
            </>
          ) : null}
          <Button
            aria-expanded={showDiagnostics}
            onClick={() => setShowDiagnostics((value) => !value)}
            size="xs"
            type="button"
            variant="outline"
          >
            {showDiagnostics ? "Hide diagnostics" : "Diagnostics"}
          </Button>
        </div>
      </div>

      {showDiagnostics ? (
        <div className="mt-3 space-y-2 text-xs text-muted-foreground/90">
          <div className="grid gap-2 md:grid-cols-2">
            <DiagnosticSection items={syncItems} title="Sync" />
            <DiagnosticSection items={caddyfileItems} title="Caddyfile" />
          </div>
          {errorItems.length > 0 ? (
            <DiagnosticSection items={errorItems} title="Errors" />
          ) : null}
          <section className="rounded-md border border-border/70 p-2">
            <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Recovery
            </h4>
            <div className="flex flex-wrap gap-2">
              <CopyCommand command="systemctl is-active caddy" />
              <CopyCommand command="sudo systemctl start caddy" />
              <CopyCommand command="sudo journalctl -u caddy -n 200 --no-pager" />
            </div>
          </section>
        </div>
      ) : !healthy && status.lastError ? (
        <p className="mt-2 text-xs text-muted-foreground/90">
          {status.lastError}
        </p>
      ) : null}
    </footer>
  );
}
