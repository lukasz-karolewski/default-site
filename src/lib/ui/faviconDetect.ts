import { parse } from "node-html-parser";
import type { ProbeTarget, SiteProbeOptions } from "./siteProbeTargets";
import { buildSiteProbeTargets } from "./siteProbeTargets";

/**
 * Extract the best favicon URL from an HTML string.
 * Checks `<link>` tags whose `rel` contains "icon".
 */
export function extractFaviconFromHtml(
  html: string,
  baseUrl: string,
): string | null {
  const root = parse(html);

  const linkTags = root.querySelectorAll("link");
  for (const link of linkTags) {
    const rel = (link.getAttribute("rel") ?? "").toLowerCase();
    if (!rel.includes("icon")) continue;

    const href = link.getAttribute("href");
    if (!href) continue;

    try {
      return new URL(href, baseUrl).toString();
    } catch {}
  }

  return null;
}

/**
 * Detect the favicon for an upstream address by fetching its HTML
 * and parsing `<link rel="icon">` tags.
 *
 * Returns the absolute favicon URL, or `null` if none found.
 */
export async function detectFavicon(
  upstream: string,
  options?: SiteProbeOptions,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const targets = buildSiteProbeTargets({ upstream, ...options });

  try {
    for (const target of targets) {
      try {
        const favicon = await detectFromTarget(target, controller.signal);
        if (favicon) return favicon;
      } catch {
        // try next target
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`Favicon detection timed out for ${upstream}`);
    } else {
      console.warn(
        `Error during favicon detection for ${upstream}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function detectFromTarget(
  target: ProbeTarget,
  signal: AbortSignal,
): Promise<string | null> {
  const res = await fetch(target.url, {
    signal,
    headers: {
      "User-Agent": "default-site-favicon-detect/1.0",
      ...(target.headers ?? {}),
    },
    redirect: "follow",
  });

  if (!res.ok) return null;
  if (!res.headers.get("content-type")?.includes("text/html")) return null;

  const html = await res.text();
  return extractFaviconFromHtml(html, target.canonicalUrl ?? target.url);
}
