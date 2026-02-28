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
            key={`${title}-${item.label}`}
            className="grid grid-cols-[150px_1fr] gap-2"
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
    healthy,
    summary,
    fetchStatus,
    writeConfigNow,
    setShowDiagnostics,
  } = useCaddyStatus();

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
          Status: {summary} · Pending changes:{" "}
          {status.pendingChanges ? "yes" : "no"}
        </p>
        <div className="flex items-center gap-2">
          {showDiagnostics ? (
            <>
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
                size="xs"
                variant="outline"
                nativeButton={false}
                render={<Link href="/onboarding?edit=1" />}
              >
                Update onboarding settings
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => setShowDiagnostics((value) => !value)}
            aria-expanded={showDiagnostics}
          >
            {showDiagnostics ? "Hide diagnostics" : "Diagnostics"}
          </Button>
        </div>
      </div>

      {showDiagnostics ? (
        <div className="mt-3 space-y-2 text-xs text-muted-foreground/90">
          <div className="grid gap-2 md:grid-cols-2">
            <DiagnosticSection title="Sync" items={syncItems} />
            <DiagnosticSection title="Caddyfile" items={caddyfileItems} />
          </div>
          {errorItems.length > 0 ? (
            <DiagnosticSection title="Errors" items={errorItems} />
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
