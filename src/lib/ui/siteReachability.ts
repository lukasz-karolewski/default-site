import type { SiteProbeOptions } from "./siteProbeTargets";
import { buildSiteProbeTargets } from "./siteProbeTargets";

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
  upstream: string,
  options?: SiteProbeOptions,
  timeoutMs = AGGRESSIVE_TIMEOUT_MS,
): Promise<boolean> {
  const targets = buildSiteProbeTargets({ upstream, ...options });

  for (const target of targets) {
    try {
      const headResponse = await probe(target.url, "HEAD", timeoutMs, {
        headers: target.headers,
      });
      if (headResponse.status === 405 || headResponse.status === 501) {
        const getResponse = await probe(target.url, "GET", timeoutMs, {
          headers: target.headers,
        });
        if (getResponse.status < 500) return true;
        continue;
      }

      if (headResponse.status < 500) return true;
    } catch {}
  }

  return false;
}
