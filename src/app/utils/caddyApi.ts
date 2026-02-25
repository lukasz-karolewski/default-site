import { generateCaddyfile } from './caddyfileGen';
import fs from 'fs/promises';
import path from 'path';
import {
  markCaddyFailure,
  markCaddyPending,
  markCaddySuccess,
} from './caddySyncState';
import { buildCaddyUrl, CADDY_LOAD_PATH, getRuntimeCaddyApiUrl } from './caddyUrls';
import { getCaddyfilePath } from './runtimePaths';

const CADDY_API = getRuntimeCaddyApiUrl();
const CADDYFILE_PATH = getCaddyfilePath();

export interface CaddyApplyResult {
  ok: boolean;
  error: string | null;
  status: number | null;
}

export async function renderAndWriteCaddyfile(): Promise<string> {
  const caddyfile = await generateCaddyfile();
  await fs.mkdir?.(path.dirname(CADDYFILE_PATH), { recursive: true });
  await fs.writeFile(CADDYFILE_PATH, caddyfile, 'utf8');
  return caddyfile;
}

export async function pushConfigToCaddyApi(caddyfile: string): Promise<CaddyApplyResult> {
  markCaddyPending();

  try {
    const resp = await fetch(buildCaddyUrl(CADDY_API, CADDY_LOAD_PATH), {
      method: 'POST',
      headers: { 'Content-Type': 'text/caddyfile' },
      body: caddyfile,
    });

    if (!resp.ok) {
      const body = await resp.text();
      const error = `Caddy API error: ${resp.status} ${body}`.trim();
      markCaddyFailure(error);
      return { ok: false, error, status: resp.status };
    }

    markCaddySuccess();
    return { ok: true, error: null, status: resp.status };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Caddy API error';
    markCaddyFailure(message);
    return { ok: false, error: message, status: null };
  }
}

export async function applyCaddyConfig(): Promise<CaddyApplyResult> {
  try {
    const caddyfile = await renderAndWriteCaddyfile();
    return pushConfigToCaddyApi(caddyfile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Caddy apply error';
    markCaddyFailure(message);
    return { ok: false, error: message, status: null };
  }
}

export async function applyCaddyConfigStrict(): Promise<void> {
  const result = await applyCaddyConfig();
  if (!result.ok) {
    throw new Error(result.error ?? 'Caddy apply failed');
  }
}
