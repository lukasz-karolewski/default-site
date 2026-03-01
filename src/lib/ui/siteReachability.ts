const AGGRESSIVE_TIMEOUT_MS = 1200;

function normalizeUpstreamUrl(upstream: string): string {
  const trimmed = upstream.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

async function probe(
  url: string,
  method: "HEAD" | "GET",
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkSiteReachability(
  upstream: string,
  timeoutMs = AGGRESSIVE_TIMEOUT_MS,
): Promise<boolean> {
  const url = normalizeUpstreamUrl(upstream);

  try {
    const headResponse = await probe(url, "HEAD", timeoutMs);
    if (headResponse.status === 405 || headResponse.status === 501) {
      const getResponse = await probe(url, "GET", timeoutMs);
      return getResponse.status < 500;
    }

    return headResponse.status < 500;
  } catch {
    return false;
  }
}
