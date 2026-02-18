import fetch from 'node-fetch';
import { generateCaddyfile } from './caddyfileGen';
import fs from 'fs/promises';

const CADDY_API = 'http://localhost:2019';

export async function applyCaddyConfig() {
  const caddyfile = await generateCaddyfile();
  await fs.writeFile('Caddyfile', caddyfile, 'utf8');

  // Convert Caddyfile to JSON using Caddy API
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
