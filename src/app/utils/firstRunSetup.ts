import fs from 'fs/promises';
import { getSites, addSite } from './siteService';
import { applyCaddyConfig } from './caddyApi';

const CADDYFILE_PATH = process.env.CADDYFILE_PATH ?? '/app/Caddyfile';
const CADDYFILE_BACKUP_PATH = `${CADDYFILE_PATH}.bak`;
const CADDY_CUSTOM_FILE = process.env.CADDY_CUSTOM_FILE ?? '/app/Caddyfile.custom';
const DEFAULT_CADDY_CUSTOM_CONTENT = `tls internal
log
`;

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

export async function runFirstTimeSetup(): Promise<void> {
  const existing = await getSites();
  if (existing.length > 0) return;

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
      await fs.writeFile(CADDY_CUSTOM_FILE, DEFAULT_CADDY_CUSTOM_CONTENT, 'utf8');
    }
  }

  try {
    await fs.copyFile(CADDYFILE_PATH, CADDYFILE_BACKUP_PATH);
  } catch (err: unknown) {
    // If no Caddyfile exists yet, there is nothing to back up.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  await applyCaddyConfig();
  console.log(`[first-run] initialized with ${unique.length} site(s)`);
}
