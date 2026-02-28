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

export function parseSitesFromCaddy(content: string): ParsedSite[] {
  const results: ParsedSite[] = [];

  const simplePattern =
    /@([\w.-]+)\s+host\s+([\w.-]+)\s*\n\s*reverse_proxy\s+@\1\s+([\w.:-]+)/gm;
  let match: RegExpExecArray | null;
  match = simplePattern.exec(content);
  while (match !== null) {
    results.push({ host: match[2], upstream: match[3] });
    match = simplePattern.exec(content);
  }

  const handlePattern =
    /@([\w.-]+)\s+host\s+([\w.-]+)\s*\n\s*handle\s+@\1\s*{\s*\n\s*reverse_proxy\s+([\w.:-]+)/gm;
  match = handlePattern.exec(content);
  while (match !== null) {
    results.push({ host: match[2], upstream: match[3] });
    match = handlePattern.exec(content);
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

export function detectBaseDomainFromWildcardBlock(
  content: string,
): string | null {
  const wildcard = content.match(
    /\*\.([A-Za-z0-9.-]+)\s*,\s*([A-Za-z0-9.-]+)\s*\{/,
  );
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

  return (
    [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || b[0].length - a[0].length,
    )[0][0] ?? null
  );
}

export function detectDirectivesFromWildcardBlock(content: string): string {
  const wildcardHeader = content.search(
    /\*\.[A-Za-z0-9.-]+\s*,\s*[A-Za-z0-9.-]+\s*\{/,
  );
  if (wildcardHeader < 0) return DEFAULT_SITE_BLOCK_DIRECTIVES;

  const body = findBlockBody(content, wildcardHeader);
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
  const wildcardHeader = content.search(
    /\*\.[A-Za-z0-9.-]+\s*,\s*[A-Za-z0-9.-]+\s*\{/,
  );
  if (wildcardHeader < 0) return DEFAULT_DASHBOARD_UPSTREAM;
  const body = findBlockBody(content, wildcardHeader);
  if (!body) return DEFAULT_DASHBOARD_UPSTREAM;

  const matches = [
    ...body.matchAll(/handle\s*\{\s*[\s\S]*?reverse_proxy\s+([^\s}]+)/gm),
  ];
  if (matches.length === 0) return DEFAULT_DASHBOARD_UPSTREAM;

  const value = matches[matches.length - 1][1];
  return normalizeUpstream(value) || DEFAULT_DASHBOARD_UPSTREAM;
}
