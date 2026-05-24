import fs from "node:fs/promises";
import path from "node:path";
import { generateCaddyfile } from "~/lib/caddy/caddyfileGenerate";
import { buildCaddyUrl } from "~/lib/caddy/caddyUrls";
import { getSiteConfig } from "~/lib/data/siteConfig";
import {
  getCaddySyncStateSnapshot,
  markCaddyFailure,
  markCaddyfileManagedWrite,
  markCaddyPending,
  markCaddySuccess,
} from "~/lib/data/siteService";
import { sha256 } from "~/lib/shared/hash";
import { getCaddyfilePath } from "~/lib/shared/paths";

interface CaddyApplyResult {
  ok: boolean;
  error: string | null;
  status: number | null;
}

export type { CaddyApplyResult };

export interface CaddySyncResult {
  attempted: boolean;
  applied: boolean;
  error: string | null;
  status: number | null;
  pendingChanges: boolean;
}
export const CADDY_LOAD_PATH = "/load";
const CADDY_ADMIN_ORIGIN = "http://localhost:2019";

async function applyConfig(url: string, caddyfile: string): Promise<Response> {
  return fetch(url, {
    body: caddyfile,
    headers: {
      "Content-Type": "text/caddyfile",
      Origin: CADDY_ADMIN_ORIGIN,
    },
    method: "POST",
  });
}

export async function applyCaddyfileToCaddyApi(
  caddyfile: string,
): Promise<CaddyApplyResult> {
  const config = await getSiteConfig();
  const caddyApi = config?.caddyApi ?? "";
  const loadUrl = buildCaddyUrl(caddyApi, CADDY_LOAD_PATH);

  try {
    const resp = await applyConfig(loadUrl, caddyfile);

    if (!resp.ok) {
      const body = await resp.text();
      const error = `Caddy API error: ${resp.status} ${body}`.trim();
      return { error, ok: false, status: resp.status };
    }

    return { error: null, ok: true, status: resp.status };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown Caddy API error";
    return { error: message, ok: false, status: null };
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
    const result = await applyCaddyfileToCaddyApi(caddyfile);

    if (!result.ok) {
      await markCaddyFailure(result.error ?? "Unknown Caddy API error");
      return {
        applied: false,
        attempted: true,
        error: result.error,
        pendingChanges: (await getCaddySyncStateSnapshot()).pendingChanges,
        status: result.status,
      };
    }

    await markCaddySuccess();
    return {
      applied: true,
      attempted: true,
      error: null,
      pendingChanges: (await getCaddySyncStateSnapshot()).pendingChanges,
      status: result.status,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown Caddy apply error";
    await markCaddyFailure(message);
    return {
      applied: false,
      attempted: true,
      error: message,
      pendingChanges: (await getCaddySyncStateSnapshot()).pendingChanges,
      status: null,
    };
  }
}
