import type { CaddySyncStateSnapshot } from "~/lib/data/schema";
import { getSiteConfig } from "~/lib/data/siteConfig";
import { getCaddySyncStateSnapshot } from "~/lib/data/siteService";

export interface CaddySyncSnapshot extends CaddySyncStateSnapshot {
  caddyApiUrl: string;
}

export async function getCaddySyncSnapshot(): Promise<CaddySyncSnapshot> {
  const [state, config] = await Promise.all([
    getCaddySyncStateSnapshot(),
    getSiteConfig(),
  ]);

  return {
    ...state,
    caddyApiUrl: config?.caddyApi ?? "",
  };
}
