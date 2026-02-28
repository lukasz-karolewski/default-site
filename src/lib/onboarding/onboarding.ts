import fs from "fs/promises";
import { addSite, getSites } from "~/lib/data/siteService";
import { applyCaddyConfig } from "~/lib/caddy/caddyApi";
import { ensureCaddyRetryLoop } from "~/lib/caddy/caddySyncScheduler";
import { buildCaddyUrl, CADDY_CONFIG_PATH } from "~/lib/caddy/caddyUrls";
import { getCaddyfilePath } from "~/lib/config/runtimePaths";
import {
	getSiteConfig,
	markOnboardingCompleted,
	normalizeCaddyApi,
	normalizeDirectives,
	normalizeDomain,
	normalizeUpstream,
	upsertSiteConfig,
} from "~/lib/data/siteConfig";

const DEFAULT_SITE_BLOCK_DIRECTIVES = `tls internal\nlog`;
const DEFAULT_DASHBOARD_UPSTREAM = "localhost:3080";

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

function uniqueSites(sites: Array<{ host: string; upstream: string }>) {
	const seen = new Set<string>();
	return sites.filter((site) => {
		if (seen.has(site.host)) return false;
		seen.add(site.host);
		return true;
	});
}

export function parseSitesFromCaddy(
	content: string,
): Array<{ host: string; upstream: string }> {
	const results: Array<{ host: string; upstream: string }> = [];

	const simplePattern =
		/@([\w.-]+)\s+host\s+([\w.\-]+)\s*\n\s*reverse_proxy\s+@\1\s+([\w.:\-]+)/gm;
	let match: RegExpExecArray | null;
	while ((match = simplePattern.exec(content)) !== null) {
		results.push({ host: match[2], upstream: match[3] });
	}

	const handlePattern =
		/@([\w.-]+)\s+host\s+([\w.\-]+)\s*\n\s*handle\s+@\1\s*{\s*\n\s*reverse_proxy\s+([\w.:\-]+)/gm;
	while ((match = handlePattern.exec(content)) !== null) {
		results.push({ host: match[2], upstream: match[3] });
	}

	return results;
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

function detectBaseDomainFromWildcardBlock(content: string): string | null {
	const wildcard = content.match(
		/\*\.([A-Za-z0-9.-]+)\s*,\s*([A-Za-z0-9.-]+)\s*\{/,
	);
	if (!wildcard) return null;
	const wildcardDomain = normalizeDomain(wildcard[1]);
	const rootDomain = normalizeDomain(wildcard[2]);
	return wildcardDomain || rootDomain || null;
}

function inferBaseDomainFromHosts(hosts: string[]): string | null {
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

function detectDirectivesFromWildcardBlock(content: string): string {
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

function detectCaddyApiFromGlobalOptions(content: string): string {
	const adminMatch = content.match(/\badmin\s+([^\s{]+)/);
	return normalizeCaddyApi(adminMatch?.[1] ?? "");
}

function detectDashboardUpstreamFromWildcardBlock(content: string): string {
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

export async function ensureOnboardingDraft(): Promise<OnboardingDraft | null> {
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

	const result = await applyCaddyConfig();
	if (!result.ok) {
		console.warn(
			`[startup] Caddy API unavailable; continuing in degraded mode: ${result.error}`,
		);
	}
	ensureCaddyRetryLoop();
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

	const apply = await applyCaddyConfig();
	if (apply.ok) {
		ensureCaddyRetryLoop();
		return { ok: true, error: null, manualCommands: [] };
	}

	ensureCaddyRetryLoop();
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
