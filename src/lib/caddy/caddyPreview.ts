import {
  generateCaddyfile,
  type ManagedSiteRoute,
} from "~/lib/caddy/caddyfileGenerate";
import {
  applyCaddyfileToCaddyApi,
  type CaddyApplyResult,
} from "~/lib/caddy/caddySync";
import type { SiteRecord } from "~/lib/data/schema";
import { getSites } from "~/lib/data/siteService";

export interface PreviewSiteInput extends ManagedSiteRoute {
  id?: string;
}

export function buildPreviewSiteRoutes(
  existingSites: Pick<SiteRecord, "id" | "subdomain" | "upstream">[],
  previewSite: PreviewSiteInput,
): ManagedSiteRoute[] {
  const nextSite: ManagedSiteRoute = {
    subdomain: previewSite.subdomain,
    upstream: previewSite.upstream,
  };

  if (previewSite.id) {
    return existingSites.map((site) =>
      site.id === previewSite.id
        ? nextSite
        : { subdomain: site.subdomain, upstream: site.upstream },
    );
  }

  return [
    ...existingSites
      .filter((site) => site.subdomain !== previewSite.subdomain)
      .map((site) => ({ subdomain: site.subdomain, upstream: site.upstream })),
    nextSite,
  ];
}

export async function previewSiteInCaddy(
  previewSite: PreviewSiteInput,
): Promise<CaddyApplyResult> {
  const existingSites = await getSites();
  const caddyfile = await generateCaddyfile(
    buildPreviewSiteRoutes(existingSites, previewSite),
  );
  return applyCaddyfileToCaddyApi(caddyfile);
}
