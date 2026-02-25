import fs from 'fs/promises';
import path from 'path';
import { getSites, addSite } from './siteService';
import { applyCaddyConfig, applyCaddyConfigStrict } from './caddyApi';
import { ensureCaddyRetryLoop } from './caddySyncScheduler';
import { getCaddyStartupMode } from './caddySyncState';
import { getCaddyCustomFilePath, getCaddyfilePath } from './runtimePaths';

const CADDYFILE_PATH = getCaddyfilePath();
const CADDYFILE_BACKUP_PATH = `${CADDYFILE_PATH}.bak`;
const CADDY_CUSTOM_FILE = getCaddyCustomFilePath();
const DEFAULT_CADDY_CUSTOM_CONTENT = `tls internal
log
`;

function startupWaitMs(): number {
  const seconds = Number(process.env.CADDY_STARTUP_WAIT_SECONDS ?? '30');
  if (!Number.isFinite(seconds) || seconds <= 0) return 30_000;
  return seconds * 1000;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseSitesFromCaddy(content: string): Array<{ host: string; upstream: string }> {
  const results: Array<{ host: string; upstream: string }> = [];

  // Match simple format:
  // @name host example.com
  // reverse_proxy @name localhost:8123
  const simplePattern = /@([\w.-]+)\s+host\s+([\w.\-]+)\s*\n\s*reverse_proxy\s+@\1\s+([\w.:\-]+)/gm;
  let match: RegExpExecArray | null;
  while ((match = simplePattern.exec(content)) !== null) {
    results.push({ host: match[2], upstream: match[3] });
  }

  // Match handle format:
  // @name host example.com
  // handle @name {
  //   reverse_proxy localhost:8123
  // }
  const handlePattern = /@([\w.-]+)\s+host\s+([\w.\-]+)\s*\n\s*handle\s+@\1\s*{\s*\n\s*reverse_proxy\s+([\w.:\-]+)/gm;
  while ((match = handlePattern.exec(content)) !== null) {
    results.push({ host: match[2], upstream: match[3] });
  }

  return results;
}

async function applyStartupPolicy() {
  const mode = getCaddyStartupMode();

  if (mode === 'strict') {
    await applyCaddyConfigStrict();
    return;
  }

  if (mode === 'wait') {
    const deadline = Date.now() + startupWaitMs();
    while (Date.now() < deadline) {
      const result = await applyCaddyConfig();
      if (result.ok) return;
      await sleep(1000);
    }

    console.warn('[first-run] Caddy API unavailable after wait timeout; continuing in degraded mode');
    ensureCaddyRetryLoop();
    return;
  }

  const result = await applyCaddyConfig();
  if (!result.ok) {
    console.warn(`[first-run] Caddy API unavailable; continuing in degraded mode: ${result.error}`);
    ensureCaddyRetryLoop();
  }
}

export async function runFirstTimeSetup(): Promise<void> {
  const existing = await getSites();
  if (existing.length > 0) {
    await applyStartupPolicy();
    ensureCaddyRetryLoop();
    return;
  }

  let sites: Array<{ host: string; upstream: string }> = [];

  try {
    const content = await fs.readFile(CADDYFILE_PATH, 'utf8');
    if (content.trim()) {
      sites = parseSitesFromCaddy(content);
    }
  } catch {
    // file doesn't exist or unreadable — skip
  }

  const seen = new Set<string>();
  const unique = sites.filter(s => {
    if (seen.has(s.host)) return false;
    seen.add(s.host);
    return true;
  });

  for (const site of unique) {
    await addSite(site.host, site.upstream);
  }

  try {
    await fs.stat(CADDY_CUSTOM_FILE);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.mkdir?.(path.dirname(CADDY_CUSTOM_FILE), { recursive: true });
        await fs.writeFile(CADDY_CUSTOM_FILE, DEFAULT_CADDY_CUSTOM_CONTENT, 'utf8');
      } catch (writeErr: unknown) {
        const message = writeErr instanceof Error ? writeErr.message : 'Unknown error';
        console.warn(`[first-run] unable to create Caddy custom file at ${CADDY_CUSTOM_FILE}: ${message}`);
      }
    }
  }

  try {
    await fs.copyFile(CADDYFILE_PATH, CADDYFILE_BACKUP_PATH);
  } catch (err: unknown) {
    // If no Caddyfile exists yet, there is nothing to back up.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  await applyStartupPolicy();
  ensureCaddyRetryLoop();
  console.log(`[first-run] initialized with ${unique.length} site(s)`);
}
