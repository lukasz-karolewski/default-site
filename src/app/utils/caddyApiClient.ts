import fetch from 'node-fetch';

const CADDY_API = 'http://localhost:2019';

export async function loadConfig(caddyfile: string) {
  const resp = await fetch(`${CADDY_API}/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/caddyfile' },
    body: caddyfile,
  });
  if (!resp.ok) {
    throw new Error(`Caddy API /load error: ${resp.status} ${await resp.text()}`);
  }
  return true;
}

export async function adaptCaddyfile(caddyfile: string) {
  const resp = await fetch(`${CADDY_API}/adapt`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/caddyfile' },
    body: caddyfile,
  });
  if (!resp.ok) {
    throw new Error(`Caddy API /adapt error: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

export async function getConfig() {
  const resp = await fetch(`${CADDY_API}/config/`);
  if (!resp.ok) {
    throw new Error(`Caddy API /config error: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

export async function stop() {
  const resp = await fetch(`${CADDY_API}/stop`, { method: 'POST' });
  if (!resp.ok) {
    throw new Error(`Caddy API /stop error: ${resp.status} ${await resp.text()}`);
  }
  return true;
}
