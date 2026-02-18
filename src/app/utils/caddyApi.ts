import { generateCaddyfile } from './caddyfileGen';
import fs from 'fs/promises';

const CADDY_API = process.env.CADDY_API ?? 'http://host.docker.internal:2019';
const CADDYFILE_PATH = process.env.CADDYFILE_PATH ?? '/app/Caddyfile';

export async function applyCaddyConfig() {
  const caddyfile = await generateCaddyfile();
  await fs.writeFile(CADDYFILE_PATH, caddyfile, 'utf8');
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
