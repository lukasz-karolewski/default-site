import fs from "node:fs/promises";
import {
  DEFAULT_DASHBOARD_UPSTREAM,
  DEFAULT_SITE_BLOCK_DIRECTIVES,
  detectBaseDomainFromWildcardBlock,
  detectCaddyApiFromGlobalOptions,
  detectDashboardUpstreamFromWildcardBlock,
  detectDirectivesFromWildcardBlock,
  inferBaseDomainFromHosts,
  parseSitesFromCaddy,
  uniqueSites,
} from "~/lib/caddy/caddyfileParser";
import { syncCaddy } from "~/lib/caddy/caddySync";
import { buildCaddyUrl, CADDY_CONFIG_PATH } from "~/lib/caddy/caddyUrls";
import {
  getSiteConfig,
  markOnboardingCompleted,
  normalizeCaddyApi,
  normalizeDirectives,
  normalizeDomain,
  normalizeUpstream,
  upsertSiteConfig,
} from "~/lib/data/siteConfig";
import { addSite, getSites } from "~/lib/data/siteService";
import { getCaddyfilePath } from "~/lib/shared/paths";

export interface OnboardingDraft {
  baseDomain: string;
  caddyApi: string;
  dashboardUpstream: string;
  siteBlockDirectives: string;
  importedSites: number;
}

export interface OnboardingCompletionResult {
  ok: boolean;
  error: string | null;
  manualCommands: string[];
}

async function readCaddyfileSafely(): Promise<string> {
  try {
    const content = await fs.readFile(getCaddyfilePath(), "utf8");
    return content.trim() ? content : "";
  } catch {
    return "";
  }
}

function toManualCommands(
  caddyApiUrl: string,
  caddyfilePath: string,
): string[] {
  return [
    "systemctl is-active caddy",
    "sudo systemctl start caddy",
    `curl ${buildCaddyUrl(caddyApiUrl, CADDY_CONFIG_PATH)}`,
    `sudo caddy validate --config ${caddyfilePath}`,
  ];
}

export async function ensureOnboardingDraft(): Promise<OnboardingDraft> {
  const existingConfig = await getSiteConfig();
  if (existingConfig) {
    return {
      baseDomain: existingConfig.baseDomain,
      caddyApi: existingConfig.caddyApi,
      dashboardUpstream:
        existingConfig.dashboardUpstream || DEFAULT_DASHBOARD_UPSTREAM,
      siteBlockDirectives: existingConfig.siteBlockDirectives,
      importedSites: (await getSites()).length,
    };
  }

  const caddyfile = await readCaddyfileSafely();
  const parsedSites = caddyfile
    ? uniqueSites(parseSitesFromCaddy(caddyfile))
    : [];

  const existingSites = await getSites();
  if (existingSites.length === 0) {
    for (const site of parsedSites) {
      await addSite(site.host, site.upstream);
    }
  }

  const baseDomain =
    (caddyfile && detectBaseDomainFromWildcardBlock(caddyfile)) ??
    inferBaseDomainFromHosts(parsedSites.map((site) => site.host)) ??
    "localhost";

  const siteBlockDirectives = caddyfile
    ? detectDirectivesFromWildcardBlock(caddyfile)
    : DEFAULT_SITE_BLOCK_DIRECTIVES;

  const caddyApi = caddyfile ? detectCaddyApiFromGlobalOptions(caddyfile) : "";

  const dashboardUpstream = caddyfile
    ? detectDashboardUpstreamFromWildcardBlock(caddyfile)
    : DEFAULT_DASHBOARD_UPSTREAM;

  await upsertSiteConfig({
    baseDomain,
    caddyApi,
    dashboardUpstream,
    siteBlockDirectives,
    onboardingStatus: "pending",
  });

  return {
    baseDomain,
    caddyApi,
    dashboardUpstream,
    siteBlockDirectives,
    importedSites: parsedSites.length,
  };
}

export async function runStartupBootstrap(): Promise<void> {
  const config = await getSiteConfig();

  if (!config) {
    await ensureOnboardingDraft();
    return;
  }

  if (config.onboardingStatus !== "completed") {
    return;
  }

  const result = await syncCaddy();
  if (!result.applied) {
    console.warn(
      `[startup] Caddy API unavailable; continuing in degraded mode: ${result.error}`,
    );
  }
}

export async function completeOnboarding(input: {
  baseDomain: string;
  caddyApi: string;
  dashboardUpstream: string;
  siteBlockDirectives: string;
}): Promise<OnboardingCompletionResult> {
  const baseDomain = normalizeDomain(input.baseDomain);
  const caddyApi = normalizeCaddyApi(input.caddyApi);
  const dashboardUpstream = normalizeUpstream(input.dashboardUpstream);
  const siteBlockDirectives = normalizeDirectives(input.siteBlockDirectives);

  if (!baseDomain) {
    return { ok: false, error: "Base domain is required.", manualCommands: [] };
  }

  if (!siteBlockDirectives) {
    return {
      ok: false,
      error: "Site config directives are required.",
      manualCommands: [],
    };
  }
  if (!caddyApi) {
    return {
      ok: false,
      error: "Caddy API URL is required.",
      manualCommands: [],
    };
  }
  if (!dashboardUpstream) {
    return {
      ok: false,
      error: "Dashboard upstream is required.",
      manualCommands: [],
    };
  }

  await markOnboardingCompleted(
    baseDomain,
    caddyApi,
    dashboardUpstream,
    siteBlockDirectives,
  );

  const apply = await syncCaddy();
  if (apply.applied) {
    return { ok: true, error: null, manualCommands: [] };
  }

  return {
    ok: false,
    error: apply.error ?? "Failed to apply Caddy config.",
    manualCommands: toManualCommands(caddyApi, getCaddyfilePath()),
  };
}

export async function getOnboardingState() {
  const config = await getSiteConfig();
  return {
    complete: config?.onboardingStatus === "completed",
    config,
  };
}
