export function getUpstreamRedirectHost(upstream: string): string {
  const trimmed = upstream.trim();
  if (!trimmed) return "";

  try {
    return new URL(`http://${trimmed}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}
