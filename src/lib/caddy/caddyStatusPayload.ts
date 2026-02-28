import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { getCaddyfilePath } from "~/lib/config/runtimePaths";
import { getCaddySyncSnapshot } from "./caddySyncState";

interface CaddyfileSnapshot {
  path: string;
  exists: boolean;
  modifiedAt: string | null;
  sizeBytes: number | null;
  hash: string | null;
  readError: string | null;
  changedSinceLastManagedWrite: boolean | null;
}

export interface CaddyStatusPayload
  extends Awaited<ReturnType<typeof getCaddySyncSnapshot>> {
  caddyfile: CaddyfileSnapshot;
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function buildCaddyStatusPayload(): Promise<CaddyStatusPayload> {
  const snapshot = await getCaddySyncSnapshot();
  const caddyfilePath = getCaddyfilePath();

  try {
    const [stat, content] = await Promise.all([
      fs.stat(caddyfilePath),
      fs.readFile(caddyfilePath, "utf8"),
    ]);

    const currentHash = sha256(content);
    const changedSinceLastManagedWrite =
      snapshot.lastManagedWriteHash && currentHash
        ? snapshot.lastManagedWriteHash !== currentHash
        : null;

    return {
      ...snapshot,
      caddyfile: {
        path: caddyfilePath,
        exists: true,
        modifiedAt: stat.mtime.toISOString(),
        sizeBytes: stat.size,
        hash: currentHash,
        readError: null,
        changedSinceLastManagedWrite,
      },
    };
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return {
        ...snapshot,
        caddyfile: {
          path: caddyfilePath,
          exists: false,
          modifiedAt: null,
          sizeBytes: null,
          hash: null,
          readError: null,
          changedSinceLastManagedWrite: null,
        },
      };
    }

    const message =
      error instanceof Error ? error.message : "Unknown file read error";
    return {
      ...snapshot,
      caddyfile: {
        path: caddyfilePath,
        exists: true,
        modifiedAt: null,
        sizeBytes: null,
        hash: null,
        readError: message,
        changedSinceLastManagedWrite: null,
      },
    };
  }
}
