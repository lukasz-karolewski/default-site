export const CADDY_LOAD_PATH = "/load";
export const CADDY_CONFIG_PATH = "/config/";
export const SITE_URL_PROTOCOL = "https://";
export const CADDY_ADMIN_ALLOWED_ORIGINS = [
  "host.docker.internal:2019",
  "localhost:2019",
  "127.0.0.1:2019",
];

export function buildCaddyUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, base).toString();
}
