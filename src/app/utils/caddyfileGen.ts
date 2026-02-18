import { getSites } from './siteService';

export async function generateCaddyfile() {
  const sites = await getSites();
  let caddyfile = '';
  for (const site of sites) {
    caddyfile += `@${site.host} host ${site.host}\nreverse_proxy @${site.host} ${site.upstream}\n`;
  }
  return caddyfile;
}
