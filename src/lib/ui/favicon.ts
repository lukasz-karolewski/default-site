export function buildFaviconUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    url.pathname = "/favicon.ico";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "/favicon.ico";
  }
}
