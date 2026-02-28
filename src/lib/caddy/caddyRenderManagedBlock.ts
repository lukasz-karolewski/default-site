interface Site {
  host: string;
  upstream: string;
}

interface ManagedBlockInput {
  baseDomain: string;
  siteBlockDirectives: string;
  dashboardUpstream: string;
  sites: Site[];
}

function matcherName(host: string, baseDomain: string): string {
  const suffix = `.${baseDomain}`;
  return host.endsWith(suffix) ? host.slice(0, -suffix.length) : host;
}

export function buildManagedSiteBlock(input: ManagedBlockInput): string {
  const { baseDomain, siteBlockDirectives, dashboardUpstream, sites } = input;
  const header = "# Managed by default-site — do not edit manually.";

  const siteBlocks = sites.map((site) => {
    const name = matcherName(site.host, baseDomain);
    return `\t@${name} host ${site.host}\n\thandle @${name} {\n\t\treverse_proxy ${site.upstream}\n\t}`;
  });

  const inner = [
    ...siteBlockDirectives.split("\n").map((line) => `\t${line}`),
    ...siteBlocks,
    `\thandle {\n\t\treverse_proxy ${dashboardUpstream}\n\t}`,
  ].join("\n\n");

  return `${header}\n\n*.${baseDomain}, ${baseDomain} {\n${inner}\n}\n`;
}
