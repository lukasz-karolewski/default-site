import fs from "node:fs/promises";
import { extractGlobalOptionsBlock } from "~/lib/caddy/caddyfileParser";
import { CADDY_ADMIN_ALLOWED_ORIGINS } from "~/lib/caddy/caddyUrls";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { getSites } from "~/lib/data/siteService";
import { getCaddyfilePath } from "~/lib/shared/paths";

const REQUIRED_ADMIN_BLOCK = `    admin 0.0.0.0:2019 {
        origins ${CADDY_ADMIN_ALLOWED_ORIGINS.join(" ")}
    }`;

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

function buildManagedSiteBlock(input: ManagedBlockInput): string {
  const { baseDomain, siteBlockDirectives, dashboardUpstream, sites } = input;
  const header = "# Managed by default-site - do not edit manually.";

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

function ensureAdminGlobalOptions(globalOptions: string): string {
  const trimmed = globalOptions.trim();
  const body = trimmed ? trimmed.replace(/^\{\s*|\s*\}$/g, "") : "";

  const withoutAdmin = body
    .replace(/^\s*admin\b[^\n{]*\{[\s\S]*?^\s*\}\s*$/gm, "")
    .replace(/^\s*admin\b[^\n]*$/gm, "")
    .trim();

  const pieces = withoutAdmin
    ? [withoutAdmin, REQUIRED_ADMIN_BLOCK]
    : [REQUIRED_ADMIN_BLOCK];
  return `{\n${pieces.join("\n\n")}\n}`;
}

export async function generateCaddyfile(): Promise<string> {
  const siteConfig = await getSiteConfig();
  if (!siteConfig || siteConfig.onboardingStatus !== "completed") {
    throw new Error(
      "Onboarding is not complete. Configure site settings first.",
    );
  }

  const managedBlock = buildManagedSiteBlock({
    baseDomain: siteConfig.baseDomain,
    siteBlockDirectives: siteConfig.siteBlockDirectives,
    dashboardUpstream: siteConfig.dashboardUpstream,
    sites: await getSites(),
  });

  let globalOptions = "";
  try {
    const existingCaddyfile = await fs.readFile(getCaddyfilePath(), "utf8");
    globalOptions = extractGlobalOptionsBlock(existingCaddyfile);
  } catch {
    // Existing file is optional; generate without global options when unavailable.
  }

  const normalizedGlobalOptions = ensureAdminGlobalOptions(globalOptions);
  return normalizedGlobalOptions
    ? `${normalizedGlobalOptions}\n\n${managedBlock}`
    : managedBlock;
}
