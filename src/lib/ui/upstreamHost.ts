export function getUpstreamRedirectHost(upstream: string): string {
  const trimmed = upstream.trim();
  if (!trimmed) return "";

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      if (!/^https?:$/.test(url.protocol)) {
        return "";
      }
      return url.hostname.toLowerCase();
    }

    if (/^[a-z0-9.-]+:\d+(?:\/.*)?$/i.test(trimmed)) {
      return new URL(`http://${trimmed}`).hostname.toLowerCase();
    }
  } catch {}

  return "";
}
