import { getSites } from './siteService';

const CADDY_CUSTOM_FILE = process.env.CADDY_CUSTOM_FILE ?? '/app/Caddyfile.custom';

export async function generateCaddyfile(): Promise<string> {
  const sites = await getSites();
  const blocks = sites.map(s => `${s.host} {\n\treverse_proxy ${s.upstream}\n}`);
  const header = `# Managed by default-site — do not edit manually.\n# Use Caddyfile.custom for global options, TLS config, and extra blocks.\n\nimport ${CADDY_CUSTOM_FILE}\n`;
  return header + (blocks.length ? '\n' + blocks.join('\n\n') + '\n' : '');
}
