import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { siteConfig } from "./schema";

const SITE_CONFIG_ID = "singleton";

export type OnboardingStatus = "pending" | "completed";

export interface SiteConfigInput {
  baseDomain: string;
  caddyApi: string;
  dashboardUpstream: string;
  siteBlockDirectives: string;
  onboardingStatus: OnboardingStatus;
}

export async function getSiteConfig() {
  return getDb()
    .select()
    .from(siteConfig)
    .where(eq(siteConfig.id, SITE_CONFIG_ID))
    .get();
}

export async function upsertSiteConfig(input: SiteConfigInput) {
  await getDb()
    .insert(siteConfig)
    .values({
      id: SITE_CONFIG_ID,
      baseDomain: input.baseDomain,
      caddyApi: input.caddyApi,
      dashboardUpstream: input.dashboardUpstream,
      siteBlockDirectives: input.siteBlockDirectives,
      onboardingStatus: input.onboardingStatus,
    })
    .onConflictDoUpdate({
      target: siteConfig.id,
      set: {
        baseDomain: input.baseDomain,
        caddyApi: input.caddyApi,
        dashboardUpstream: input.dashboardUpstream,
        siteBlockDirectives: input.siteBlockDirectives,
        onboardingStatus: input.onboardingStatus,
      },
    })
    .run();
}

export async function markOnboardingCompleted(
  baseDomain: string,
  caddyApi: string,
  dashboardUpstream: string,
  siteBlockDirectives: string,
) {
  await upsertSiteConfig({
    baseDomain,
    caddyApi,
    dashboardUpstream,
    siteBlockDirectives,
    onboardingStatus: "completed",
  });
}

export function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^\.+|\.+$/g, "");
}

export function normalizeDirectives(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function normalizeCaddyApi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  try {
    return new URL(withProtocol).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function normalizeUpstream(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}
