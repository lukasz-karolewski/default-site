import { SITE_URL_PROTOCOL } from "~/lib/caddy/caddyUrls";

export function buildSiteUrl(host: string, rootDomain: string): string {
  const value = host
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^\.+|\.+$/g, "");
  const root = rootDomain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^\.+|\.+$/g, "");

  if (!value) {
    return `${SITE_URL_PROTOCOL}${root}`;
  }

  if (value === root || value.endsWith(`.${root}`)) {
    return `${SITE_URL_PROTOCOL}${value}`;
  }

  return `${SITE_URL_PROTOCOL}${value}.${root}`;
}
