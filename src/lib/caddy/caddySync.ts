import fs from "node:fs/promises";
import path from "node:path";
import { generateCaddyfile } from "~/lib/caddy/caddyfileGenerate";
import {
  markCaddyFailure,
  markCaddyfileManagedWrite,
  markCaddyPending,
  markCaddySuccess,
  getCaddySyncStateSnapshot,
} from "~/lib/data/siteService";
import { buildCaddyUrl, CADDY_LOAD_PATH } from "~/lib/caddy/caddyUrls";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { sha256 } from "~/lib/shared/hash";
import { getCaddyfilePath } from "~/lib/shared/paths";

interface CaddyApplyResult {
  ok: boolean;
  error: string | null;
  status: number | null;
}

export interface CaddySyncResult {
  attempted: boolean;
  applied: boolean;
  error: string | null;
  status: number | null;
  pendingChanges: boolean;
}

async function pushConfigToCaddyApi(
  caddyfile: string,
): Promise<CaddyApplyResult> {
  const config = await getSiteConfig();
  const caddyApi = config?.caddyApi ?? "";

  try {
    const resp = await fetch(buildCaddyUrl(caddyApi, CADDY_LOAD_PATH), {
      method: "POST",
      headers: { "Content-Type": "text/caddyfile" },
      body: caddyfile,
    });

    if (!resp.ok) {
      const body = await resp.text();
      const error = `Caddy API error: ${resp.status} ${body}`.trim();
      return { ok: false, error, status: resp.status };
    }

    return { ok: true, error: null, status: resp.status };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown Caddy API error";
    return { ok: false, error: message, status: null };
  }
}

async function renderAndWriteCaddyfile(): Promise<string> {
  const caddyfile = await generateCaddyfile();
  const caddyfilePath = getCaddyfilePath();
  await fs.mkdir(path.dirname(caddyfilePath), { recursive: true });
  await fs.writeFile(caddyfilePath, caddyfile, "utf8");
  await markCaddyfileManagedWrite(sha256(caddyfile));
  return caddyfile;
}

export async function syncCaddy(): Promise<CaddySyncResult> {
  try {
    const caddyfile = await renderAndWriteCaddyfile();
    await markCaddyPending();
    const result = await pushConfigToCaddyApi(caddyfile);

    if (!result.ok) {
      await markCaddyFailure(result.error ?? "Unknown Caddy API error");
      return {
        attempted: true,
        applied: false,
        error: result.error,
        status: result.status,
        pendingChanges: (await getCaddySyncStateSnapshot()).pendingChanges,
      };
    }

    await markCaddySuccess();
    return {
      attempted: true,
      applied: true,
      error: null,
      status: result.status,
      pendingChanges: (await getCaddySyncStateSnapshot()).pendingChanges,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown Caddy apply error";
    await markCaddyFailure(message);
    return {
      attempted: true,
      applied: false,
      error: message,
      status: null,
      pendingChanges: (await getCaddySyncStateSnapshot()).pendingChanges,
    };
  };
}
