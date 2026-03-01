export interface ProbeTarget {
  url: string;
  /** Public-facing URL to use when resolving relative paths (e.g. favicon hrefs). */
  canonicalUrl?: string;
  headers?: Record<string, string>;
}

export interface SiteProbeOptions {
  subdomain?: string | null;
  baseDomain?: string | null;
}

const DOCKER_HOST_GATEWAY = "host.docker.internal";

function ensureHttpProtocol(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

function normalizeHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^\.+|\.+$/g, "");
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function rewriteLoopbackHost(url: string): string {
  try {
    const parsed = new URL(url);
    if (!isLoopbackHost(parsed.hostname)) {
      return parsed.toString();
    }

    parsed.hostname = DOCKER_HOST_GATEWAY;
    return parsed.toString();
  } catch {
    return url;
  }
}

function dedupeTargets(targets: ProbeTarget[]): ProbeTarget[] {
  const seen = new Set<string>();
  const output: ProbeTarget[] = [];

  for (const target of targets) {
    const headerPairs = Object.entries(target.headers ?? {}).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const key = `${target.url}|${headerPairs
      .map(([k, v]) => `${k}:${v}`)
      .join(";")}`;

    if (seen.has(key)) continue;
    seen.add(key);
    output.push(target);
  }

  return output;
}

export function buildSiteProbeTargets(
  input: { upstream: string } & SiteProbeOptions,
): ProbeTarget[] {
  const normalizedUpstream = ensureHttpProtocol(input.upstream);
  const rewrittenUpstream = rewriteLoopbackHost(normalizedUpstream);

  const targets: ProbeTarget[] = [
    ...(rewrittenUpstream !== normalizedUpstream
      ? [{ url: rewrittenUpstream, canonicalUrl: normalizedUpstream }]
      : []),
  ];

  const subdomain = normalizeHost(input.subdomain ?? "");
  const baseDomain = normalizeHost(input.baseDomain ?? "");

  if (subdomain && baseDomain) {
    const publicHost = `${subdomain}.${baseDomain}`;
    const canonicalUrl = `https://${publicHost}`;
    targets.push(
      {
        url: `http://${DOCKER_HOST_GATEWAY}`,
        canonicalUrl,
        headers: { Host: publicHost },
      },
      {
        url: "http://127.0.0.1",
        canonicalUrl,
        headers: { Host: publicHost },
      },
      { url: `https://${publicHost}` },
      { url: `http://${publicHost}` },
    );
  }

  targets.push({ url: normalizedUpstream });
  return dedupeTargets(targets);
}
