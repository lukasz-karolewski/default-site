export function getUpstreamRedirectHost(upstream: string): string {
  const trimmed = upstream.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) {
      return "";
    }
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
}
