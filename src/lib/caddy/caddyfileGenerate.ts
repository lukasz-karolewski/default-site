import fs from "node:fs/promises";
import {
  ensureAdminGlobalOptions,
  extractGlobalOptionsBlock,
} from "~/lib/caddy/caddyGlobalOptions";
import { buildManagedSiteBlock } from "~/lib/caddy/caddyRenderManagedBlock";
import { getCaddyfilePath } from "~/lib/config/runtimePaths";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { getSites } from "~/lib/data/siteService";

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
