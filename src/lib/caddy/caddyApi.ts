import { generateCaddyfile } from './caddyfileGen';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import {
  markCaddyFailure,
  markCaddyfileManagedWrite,
  markCaddyPending,
  markCaddySuccess,
} from '~/lib/caddy/caddySyncState';
import { buildCaddyUrl, CADDY_LOAD_PATH } from '~/lib/caddy/caddyUrls';
import { getCaddyfilePath } from '~/lib/config/runtimePaths';
import { getRuntimeCaddyApiUrl } from './caddyApiConfig';

const CADDYFILE_PATH = getCaddyfilePath();

export interface CaddyApplyResult {
  ok: boolean;
  error: string | null;
  status: number | null;
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export async function renderAndWriteCaddyfile(): Promise<string> {
  const caddyfile = await generateCaddyfile();
  await fs.mkdir?.(path.dirname(CADDYFILE_PATH), { recursive: true });
  await fs.writeFile(CADDYFILE_PATH, caddyfile, 'utf8');
  await markCaddyfileManagedWrite(sha256(caddyfile));
  return caddyfile;
}

export async function pushConfigToCaddyApi(caddyfile: string): Promise<CaddyApplyResult> {
  await markCaddyPending();
  const caddyApi = await getRuntimeCaddyApiUrl();

  try {
    const resp = await fetch(buildCaddyUrl(caddyApi, CADDY_LOAD_PATH), {
      method: 'POST',
      headers: { 'Content-Type': 'text/caddyfile' },
      body: caddyfile,
    });

    if (!resp.ok) {
      const body = await resp.text();
      const error = `Caddy API error: ${resp.status} ${body}`.trim();
      await markCaddyFailure(error);
      return { ok: false, error, status: resp.status };
    }

    await markCaddySuccess();
    return { ok: true, error: null, status: resp.status };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Caddy API error';
    await markCaddyFailure(message);
    return { ok: false, error: message, status: null };
  }
}

export async function applyCaddyConfig(): Promise<CaddyApplyResult> {
  try {
    const caddyfile = await renderAndWriteCaddyfile();
    return pushConfigToCaddyApi(caddyfile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Caddy apply error';
    await markCaddyFailure(message);
    return { ok: false, error: message, status: null };
  }
}
