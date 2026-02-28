import fs from "node:fs/promises";
import { extractGlobalOptionsBlock } from "~/lib/caddy/caddyfileParser";
import { CADDY_ADMIN_ALLOWED_ORIGINS } from "~/lib/caddy/caddyUrls";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { getSites } from "~/lib/data/siteService";
import { getCaddyfilePath } from "~/lib/shared/paths";

const REQUIRED_ADMIN_BLOCK = `\tadmin 0.0.0.0:2019 {
\t\torigins ${CADDY_ADMIN_ALLOWED_ORIGINS.join(" ")}
\t}`;

interface ManagedBlockInput {
  baseDomain: string;
  siteBlockDirectives: string;
  dashboardUpstream: string;
  sites: { subdomain: string; upstream: string }[];
}

function buildManagedSiteBlock(input: ManagedBlockInput): string {
  const { baseDomain, siteBlockDirectives, dashboardUpstream, sites } = input;
  const header = "# Managed by default-site - do not edit manually.";

  const siteBlocks = sites.map((site) => {
    const fullHost = `${site.subdomain}.${baseDomain}`;
    return `\t@${site.subdomain} host ${fullHost}\n\thandle @${site.subdomain} {\n\t\treverse_proxy ${site.upstream}\n\t}`;
  });

  const inner = [
    ...siteBlockDirectives.split("\n").filter((line) => line.trim()).map((line) => `\t${line}`),
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

  const [sites, existingCaddyfile] = await Promise.all([
    getSites(),
    fs.readFile(getCaddyfilePath(), "utf8").catch(() => ""),
  ]);

  const managedBlock = buildManagedSiteBlock({
    baseDomain: siteConfig.baseDomain,
    siteBlockDirectives: siteConfig.siteBlockDirectives,
    dashboardUpstream: siteConfig.dashboardUpstream,
    sites,
  });

  const normalizedGlobalOptions = ensureAdminGlobalOptions(
    extractGlobalOptionsBlock(existingCaddyfile),
  );
  return `${normalizedGlobalOptions}\n\n${managedBlock}`;
}
