import fs from "node:fs/promises";
import path from "node:path";
import { generateCaddyfile } from "~/lib/caddy/caddyfileGenerate";
import { sha256 } from "~/lib/caddy/caddyHash";
import { pushConfigToCaddyApi } from "~/lib/caddy/caddyPushConfig";
import {
  markCaddyFailure,
  markCaddyfileManagedWrite,
  markCaddyPending,
  markCaddySuccess,
} from "~/lib/caddy/caddySyncState";
import { getCaddyfilePath } from "~/lib/config/runtimePaths";

export type { CaddyApplyResult } from "~/lib/caddy/caddyPushConfig";

export async function renderAndWriteCaddyfile(): Promise<string> {
  const caddyfile = await generateCaddyfile();
  const caddyfilePath = getCaddyfilePath();
  await fs.mkdir(path.dirname(caddyfilePath), { recursive: true });
  await fs.writeFile(caddyfilePath, caddyfile, "utf8");
  await markCaddyfileManagedWrite(sha256(caddyfile));
  return caddyfile;
}

export async function syncCaddy() {
  try {
    const caddyfile = await renderAndWriteCaddyfile();
    await markCaddyPending();
    const result = await pushConfigToCaddyApi(caddyfile);

    if (!result.ok) {
      await markCaddyFailure(result.error ?? "Unknown Caddy API error");
      return result;
    }

    await markCaddySuccess();
    return result;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown Caddy apply error";
    await markCaddyFailure(message);
    return { ok: false, error: message, status: null };
  }
}
