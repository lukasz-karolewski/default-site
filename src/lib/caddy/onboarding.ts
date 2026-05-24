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
      importedSites: (await getSites()).length,
      siteBlockDirectives: existingConfig.siteBlockDirectives,
    };
  }

  const caddyfile = await readCaddyfileSafely();
  const parsedSites = caddyfile
    ? uniqueSites(parseSitesFromCaddy(caddyfile))
    : [];

  const baseDomain =
    (caddyfile && detectBaseDomainFromWildcardBlock(caddyfile)) ??
    inferBaseDomainFromHosts(parsedSites.map((site) => site.host)) ??
    "localhost";

  const existingSites = await getSites();
  if (existingSites.length === 0) {
    for (const site of parsedSites) {
      const subdomain = site.host.endsWith(`.${baseDomain}`)
        ? site.host.slice(0, -(baseDomain.length + 1))
        : site.host;
      await addSite(subdomain, site.upstream);
    }
  }

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
    onboardingStatus: "pending",
    siteBlockDirectives,
  });

  return {
    baseDomain,
    caddyApi,
    dashboardUpstream,
    importedSites: parsedSites.length,
    siteBlockDirectives,
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
    return { error: "Base domain is required.", manualCommands: [], ok: false };
  }

  if (!siteBlockDirectives) {
    return {
      error: "Site config directives are required.",
      manualCommands: [],
      ok: false,
    };
  }
  if (!caddyApi) {
    return {
      error: "Caddy API URL is required.",
      manualCommands: [],
      ok: false,
    };
  }
  if (!dashboardUpstream) {
    return {
      error: "Dashboard upstream is required.",
      manualCommands: [],
      ok: false,
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
    return { error: null, manualCommands: [], ok: true };
  }

  return {
    error: apply.error ?? "Failed to apply Caddy config.",
    manualCommands: toManualCommands(caddyApi, getCaddyfilePath()),
    ok: false,
  };
}

export async function getOnboardingState() {
  const config = await getSiteConfig();
  return {
    complete: config?.onboardingStatus === "completed",
    config,
  };
}
