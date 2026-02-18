import { getSites } from './siteService';
import fs from 'fs/promises';

const CADDY_API = process.env.CADDY_API ?? 'http://host.docker.internal:2019';
const CADDY_SITES_FILE = process.env.CADDY_SITES_FILE ?? '/app/sites.caddy';
const CADDYFILE_PATH = process.env.CADDYFILE_PATH ?? '/app/Caddyfile';

export async function applyCaddyConfig() {
  const sites = await getSites();

  let siteBlocks = '';
  for (const site of sites) {
    siteBlocks += `@${site.host} host ${site.host}\nreverse_proxy @${site.host} ${site.upstream}\n\n`;
  }
  await fs.writeFile(CADDY_SITES_FILE, siteBlocks, 'utf8');

  const caddyfile = await fs.readFile(CADDYFILE_PATH, 'utf8');
  const resp = await fetch(`${CADDY_API}/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/caddyfile' },
    body: caddyfile,
  });
  if (!resp.ok) {
    throw new Error(`Caddy API error: ${resp.status} ${await resp.text()}`);
  }
  return true;
}
