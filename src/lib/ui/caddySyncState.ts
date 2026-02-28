import {
  getCaddySyncStateSnapshot,
  type CaddySyncStateSnapshot,
} from "~/lib/data/siteService";
import { getSiteConfig } from "~/lib/data/siteConfig";

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
