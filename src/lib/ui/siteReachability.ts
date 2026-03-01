import { buildSiteUrl } from "./siteLink";

const AGGRESSIVE_TIMEOUT_MS = 1200;

async function probe(
  url: string,
  method: "HEAD" | "GET",
  timeoutMs: number,
  requestInit?: Pick<RequestInit, "headers">,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      ...requestInit,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkSiteReachability(
  options: { subdomain?: string | null; baseDomain?: string | null },
  timeoutMs = AGGRESSIVE_TIMEOUT_MS,
): Promise<boolean> {
  const subdomain = options.subdomain?.trim();
  const baseDomain = options.baseDomain?.trim();
  if (!subdomain || !baseDomain) return false;

  const targetUrl = buildSiteUrl(subdomain, baseDomain);

  try {
    const headResponse = await probe(targetUrl, "HEAD", timeoutMs);
    if (headResponse.status === 405 || headResponse.status === 501) {
      const getResponse = await probe(targetUrl, "GET", timeoutMs);
      return getResponse.status < 500;
    }

    return headResponse.status < 500;
  } catch {}

  return false;
}
