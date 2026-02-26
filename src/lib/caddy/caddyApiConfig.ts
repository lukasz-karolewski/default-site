import 'server-only';

import { DEFAULT_CADDY_API_URL } from '~/lib/caddy/caddyUrls';
import { getSiteConfig } from '~/lib/data/siteConfig';

export async function getRuntimeCaddyApiUrl(): Promise<string> {
  const config = await getSiteConfig();
  return config?.caddyApi || DEFAULT_CADDY_API_URL;
}
