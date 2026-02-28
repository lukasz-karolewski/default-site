import { buildCaddyUrl, CADDY_LOAD_PATH } from "~/lib/caddy/caddyUrls";
import { getSiteConfig } from "~/lib/data/siteConfig";

export interface CaddyApplyResult {
  ok: boolean;
  error: string | null;
  status: number | null;
}

export async function pushConfigToCaddyApi(
  caddyfile: string,
): Promise<CaddyApplyResult> {
  const config = await getSiteConfig();
  const caddyApi = config?.caddyApi ?? "";

  try {
    const resp = await fetch(buildCaddyUrl(caddyApi, CADDY_LOAD_PATH), {
      method: "POST",
      headers: { "Content-Type": "text/caddyfile" },
      body: caddyfile,
    });

    if (!resp.ok) {
      const body = await resp.text();
      const error = `Caddy API error: ${resp.status} ${body}`.trim();
      return { ok: false, error, status: resp.status };
    }

    return { ok: true, error: null, status: resp.status };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown Caddy API error";
    return { ok: false, error: message, status: null };
  }
}
