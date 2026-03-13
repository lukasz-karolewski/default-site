import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/data/siteService", () => ({
  getSites: vi.fn(),
}));
vi.mock("~/lib/caddy/caddyfileGenerate", () => ({
  generateCaddyfile: vi.fn(),
}));
vi.mock("~/lib/caddy/caddySync", () => ({
  applyCaddyfileToCaddyApi: vi.fn(),
}));

import { generateCaddyfile } from "~/lib/caddy/caddyfileGenerate";
import { applyCaddyfileToCaddyApi } from "~/lib/caddy/caddySync";
import { getSites } from "~/lib/data/siteService";
import { buildPreviewSiteRoutes, previewSiteInCaddy } from "./caddyPreview";

const mockGetSites = vi.mocked(getSites);
const mockGenerateCaddyfile = vi.mocked(generateCaddyfile);
const mockApplyCaddyfileToCaddyApi = vi.mocked(applyCaddyfileToCaddyApi);

describe("buildPreviewSiteRoutes", () => {
  it("replaces an existing site when previewing an edit", () => {
    expect(
      buildPreviewSiteRoutes(
        [
          { id: "1", subdomain: "app", upstream: "localhost:3000" },
          { id: "2", subdomain: "api", upstream: "localhost:4000" },
        ],
        { id: "1", subdomain: "app", upstream: "localhost:5000" },
      ),
    ).toEqual([
      { subdomain: "app", upstream: "localhost:5000" },
      { subdomain: "api", upstream: "localhost:4000" },
    ]);
  });

  it("adds a new site without touching persisted data", () => {
    expect(
      buildPreviewSiteRoutes(
        [{ id: "1", subdomain: "api", upstream: "localhost:4000" }],
        { subdomain: "app", upstream: "localhost:3000" },
      ),
    ).toEqual([
      { subdomain: "api", upstream: "localhost:4000" },
      { subdomain: "app", upstream: "localhost:3000" },
    ]);
  });
});

describe("previewSiteInCaddy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSites.mockResolvedValue([
      { id: "1", subdomain: "api", upstream: "localhost:4000", favicon: null },
    ]);
    mockGenerateCaddyfile.mockResolvedValue("preview-config");
    mockApplyCaddyfileToCaddyApi.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
    });
  });

  it("generates and applies a preview config without writing files", async () => {
    const result = await previewSiteInCaddy({
      subdomain: "app",
      upstream: "localhost:3000",
    });

    expect(result.ok).toBe(true);
    expect(mockGenerateCaddyfile).toHaveBeenCalledWith([
      { subdomain: "api", upstream: "localhost:4000" },
      { subdomain: "app", upstream: "localhost:3000" },
    ]);
    expect(mockApplyCaddyfileToCaddyApi).toHaveBeenCalledWith("preview-config");
  });
});
