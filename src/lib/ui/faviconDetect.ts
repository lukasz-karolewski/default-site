import { parse } from "node-html-parser";

/**
 * Normalize an upstream value (e.g. "localhost:3000") into a full URL.
 */
function normalizeUpstreamUrl(upstream: string): string {
  const trimmed = upstream.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

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
export async function detectFavicon(upstream: string): Promise<string | null> {
  const baseUrl = normalizeUpstreamUrl(upstream);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(baseUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "default-site-favicon-detect/1.0" },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const html = await res.text();
    return extractFaviconFromHtml(html, baseUrl);
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
