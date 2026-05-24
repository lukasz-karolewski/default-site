import fs from "node:fs/promises";
import { sha256 } from "~/lib/shared/hash";
import { getCaddyfilePath } from "~/lib/shared/paths";
import { getCaddySyncSnapshot } from "~/lib/ui/caddySyncState";

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
        changedSinceLastManagedWrite,
        exists: true,
        hash: currentHash,
        modifiedAt: stat.mtime.toISOString(),
        path: caddyfilePath,
        readError: null,
        sizeBytes: stat.size,
      },
    };
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return {
        ...snapshot,
        caddyfile: {
          changedSinceLastManagedWrite: null,
          exists: false,
          hash: null,
          modifiedAt: null,
          path: caddyfilePath,
          readError: null,
          sizeBytes: null,
        },
      };
    }

    const message =
      error instanceof Error ? error.message : "Unknown file read error";
    return {
      ...snapshot,
      caddyfile: {
        changedSinceLastManagedWrite: null,
        exists: true,
        hash: null,
        modifiedAt: null,
        path: caddyfilePath,
        readError: message,
        sizeBytes: null,
      },
    };
  }
}
