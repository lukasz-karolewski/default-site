import { parse } from "node-html-parser";
import { buildSiteUrl } from "./siteLink";

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
 * Detect a favicon by probing site targets and parsing HTML
 * and parsing `<link rel="icon">` tags.
 *
 * Returns the absolute favicon URL, or `null` if none found.
 */
export async function detectFavicon(options: {
  subdomain?: string | null;
  baseDomain?: string | null;
}): Promise<string | null> {
  const subdomain = options.subdomain?.trim();
  const baseDomain = options.baseDomain?.trim();
  if (!subdomain || !baseDomain) return null;

  const targetUrl = buildSiteUrl(subdomain, baseDomain);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    return await detectFromTarget(targetUrl, controller.signal);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Favicon detection timed out");
    } else {
      console.warn(
        `Error during favicon detection: ${
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
  targetUrl: string,
  signal: AbortSignal,
): Promise<string | null> {
  const res = await fetch(targetUrl, {
    signal,
    headers: {
      "User-Agent": "default-site-favicon-detect/1.0",
    },
    redirect: "follow",
  });

  if (!res.headers.get("content-type")?.includes("text/html")) return null;

  const html = await res.text();
  return extractFaviconFromHtml(html, targetUrl);
}
