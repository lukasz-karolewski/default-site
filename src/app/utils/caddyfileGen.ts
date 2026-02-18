import { getSites } from './siteService';

function matcherName(host: string, baseDomain: string): string {
  const suffix = '.' + baseDomain;
  return host.endsWith(suffix) ? host.slice(0, -suffix.length) : host;
}

export async function generateCaddyfile(): Promise<string> {
  const BASE_DOMAIN = process.env.BASE_DOMAIN;
  if (!BASE_DOMAIN) throw new Error('BASE_DOMAIN environment variable is required');
  const CADDY_CUSTOM_FILE = process.env.CADDY_CUSTOM_FILE ?? '/app/Caddyfile.custom';
  const DASHBOARD_UPSTREAM = process.env.DASHBOARD_UPSTREAM ?? 'localhost:3080';

  const sites = await getSites();
  const header = `# Managed by default-site — do not edit manually.\n# Use Caddyfile.custom for TLS, logging, and other options inside the site block.`;

  const siteBlocks = sites.map(s => {
    const name = matcherName(s.host, BASE_DOMAIN);
    return `\t@${name} host ${s.host}\n\thandle @${name} {\n\t\treverse_proxy ${s.upstream}\n\t}`;
  });

  const inner = [
    `\timport ${CADDY_CUSTOM_FILE}`,
    ...siteBlocks,
    `\thandle {\n\t\treverse_proxy ${DASHBOARD_UPSTREAM}\n\t}`,
  ].join('\n\n');

  return `${header}\n\n*.${BASE_DOMAIN}, ${BASE_DOMAIN} {\n${inner}\n}\n`;
}
