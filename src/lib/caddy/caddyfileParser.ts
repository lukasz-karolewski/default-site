import {
  normalizeCaddyApi,
  normalizeDirectives,
  normalizeDomain,
  normalizeUpstream,
} from "~/lib/data/siteConfig";

export const DEFAULT_SITE_BLOCK_DIRECTIVES = "tls internal\nlog";
export const DEFAULT_DASHBOARD_UPSTREAM = "localhost:3080";

export interface ParsedSite {
  host: string;
  upstream: string;
}

const WILDCARD_HEADER = /\*\.([A-Za-z0-9.-]+)\s*,\s*([A-Za-z0-9.-]+)\s*\{/;

export function parseSitesFromCaddy(content: string): ParsedSite[] {
  const results: ParsedSite[] = [];

  const simplePattern =
    /@([\w.-]+)\s+host\s+([\w.-]+)\s*\n\s*reverse_proxy\s+@\1\s+([\w.:-]+)/gm;
  const handlePattern =
    /@([\w.-]+)\s+host\s+([\w.-]+)\s*\n\s*handle\s+@\1\s*{\s*\n\s*reverse_proxy\s+([\w.:-]+)/gm;

  for (const match of content.matchAll(simplePattern)) {
    results.push({ host: match[2], upstream: match[3] });
  }
  for (const match of content.matchAll(handlePattern)) {
    results.push({ host: match[2], upstream: match[3] });
  }

  return results;
}

export function uniqueSites(sites: ParsedSite[]): ParsedSite[] {
  const seen = new Set<string>();
  return sites.filter((site) => {
    if (seen.has(site.host)) return false;
    seen.add(site.host);
    return true;
  });
}

function findBlockBody(content: string, startIndex: number): string {
  const openIndex = content.indexOf("{", startIndex);
  if (openIndex < 0) return "";

  let depth = 0;
  for (let i = openIndex; i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") {
      depth--;
      if (depth === 0) return content.slice(openIndex + 1, i);
    }
  }

  return "";
}

function findWildcardBlockBody(content: string): string | null {
  const headerIndex = content.search(WILDCARD_HEADER);
  if (headerIndex < 0) return null;
  const body = findBlockBody(content, headerIndex);
  return body || null;
}

export function detectBaseDomainFromWildcardBlock(
  content: string,
): string | null {
  const wildcard = content.match(WILDCARD_HEADER);
  if (!wildcard) return null;
  const wildcardDomain = normalizeDomain(wildcard[1]);
  const rootDomain = normalizeDomain(wildcard[2]);
  return wildcardDomain || rootDomain || null;
}

export function inferBaseDomainFromHosts(hosts: string[]): string | null {
  const counts = new Map<string, number>();

  for (const host of hosts) {
    const labels = normalizeDomain(host).split(".").filter(Boolean);
    for (let i = 1; i < labels.length - 1; i++) {
      const suffix = labels.slice(i).join(".");
      counts.set(suffix, (counts.get(suffix) ?? 0) + 1);
    }
  }

  if (counts.size === 0) return null;

  let best: [string, number] | null = null;
  for (const entry of counts) {
    if (
      !best ||
      entry[1] > best[1] ||
      (entry[1] === best[1] && entry[0].length > best[0].length)
    ) {
      best = entry;
    }
  }
  return best![0];
}

export function detectDirectivesFromWildcardBlock(content: string): string {
  const body = findWildcardBlockBody(content);
  if (!body) return DEFAULT_SITE_BLOCK_DIRECTIVES;

  const firstRouteIndex = body.search(
    /\n\s*@[^\n]+\s+host\s+|\n\s*handle\s+@|\n\s*handle\s*\{/,
  );
  const preRoutes =
    firstRouteIndex >= 0 ? body.slice(0, firstRouteIndex) : body;

  const directives = normalizeDirectives(
    preRoutes
      .split("\n")
      .filter((line) => !/^\s*import\s+/i.test(line))
      .join("\n"),
  );

  return directives || DEFAULT_SITE_BLOCK_DIRECTIVES;
}

export function detectCaddyApiFromGlobalOptions(content: string): string {
  const adminMatch = content.match(/\badmin\s+([^\s{]+)/);
  return normalizeCaddyApi(adminMatch?.[1] ?? "");
}

export function detectDashboardUpstreamFromWildcardBlock(
  content: string,
): string {
  const body = findWildcardBlockBody(content);
  if (!body) return DEFAULT_DASHBOARD_UPSTREAM;

  let lastMatch: RegExpMatchArray | null = null;
  for (const match of body.matchAll(
    /handle\s*\{\s*[\s\S]*?reverse_proxy\s+([^\s}]+)/gm,
  )) {
    lastMatch = match;
  }
  if (!lastMatch) return DEFAULT_DASHBOARD_UPSTREAM;

  return normalizeUpstream(lastMatch[1]) || DEFAULT_DASHBOARD_UPSTREAM;
}

export function extractGlobalOptionsBlock(content: string): string {
  let i = 0;

  while (i < content.length) {
    while (i < content.length && " \t\n\r\f\v".includes(content[i])) i++;

    if (content[i] === "#") {
      while (i < content.length && content[i] !== "\n") i++;
      continue;
    }
    break;
  }

  if (content[i] !== "{") return "";

  const start = i;
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (; i < content.length; i++) {
    const ch = content[i];

    if (quote) {
      if (ch === quote && content[i - 1] !== "\\") quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return content.slice(start, i + 1).trim();
      }
    }
  }

  return "";
}
